import { spawn } from 'node:child_process';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { emitKeypressEvents } from 'node:readline';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs, stripVTControlCharacters, styleText } from 'node:util';

import { validateShortUrlDestination } from '../src/lib/shortener/destination.ts';
import { deriveShortUrlHandoffSecret } from '../src/lib/shortener/handoff.ts';

const databaseName = 'tkkr-dev-urls';
const publicOrigins = {
    local: 'http://localhost:3000',
    remote: 'https://tkkr.dev',
} as const;
const shortUrlSlugPattern = /^[a-z0-9_-]{1,64}$/;
const reservedShortUrlSlugs = new Set(['about', 'admin', 'api', 'links', 'projects']);
const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const issueUrl = 'https://github.com/thaddeuskkr/tkkr.dev/issues/new';

type CliCommand = 'add' | 'list' | 'remove';
type DatabaseTarget = keyof typeof publicOrigins;
type ProtectionKind = 'key' | 'password' | 'pin';
type ShortUrlStatus = 'active' | 'expired';
type CliErrorCode =
    | 'E_AUTH'
    | 'E_BUSY'
    | 'E_CONFIG'
    | 'E_CONFLICT'
    | 'E_D1'
    | 'E_INPUT'
    | 'E_INTERNAL'
    | 'E_INTERRUPTED'
    | 'E_NETWORK'
    | 'E_NOT_FOUND'
    | 'E_SCHEMA'
    | 'E_USAGE';

type CliOptions = {
    command: CliCommand | null;
    databaseTarget: DatabaseTarget | null;
    expires: string | undefined;
    help: boolean;
    json: boolean;
    owner: string | undefined;
    positionals: string[];
    protection: ProtectionKind | null;
    yes: boolean;
};

type ProtectionCredentials = {
    accessKey?: string;
    handoffSecret: string;
    verifier: string;
};

type ShortUrlInsert = {
    id: string;
    destinationUrl: string;
    verifier: string | null;
    expiresAt: number | null;
    ownerId: string;
    now: number;
    slugs: string[];
};

type ShortUrlQueryRow = {
    id: string;
    destinationUrl: string;
    unlockVerifier: string | null;
    expiresAt: number | null;
    ownerId: string;
    createdAt: number;
    updatedAt: number;
    slug: string;
};

type ShortUrlRecord = Omit<ShortUrlQueryRow, 'slug' | 'unlockVerifier'> & {
    protection: ProtectionKind | 'protected' | 'public';
    slugs: string[];
    status: ShortUrlStatus;
};

type D1ExecuteResult = {
    error?: unknown;
    success: boolean;
    results?: unknown[] | null;
};

type D1OperationContext = {
    databaseTarget: DatabaseTarget;
    failureMessage: string;
    slugs?: readonly string[];
};

type JsonParseAttempt = { ok: true; value: unknown } | { error: unknown; ok: false };

class CliError extends Error {
    readonly code: CliErrorCode;
    readonly hint: string | undefined;
    readonly exitCode: 1 | 2 | 130 | 143;

    constructor(
        code: CliErrorCode,
        message: string,
        hint: string | undefined,
        exitCode: 1 | 2 | 130 | 143,
        cause?: unknown
    ) {
        super(message, cause === undefined ? undefined : { cause });
        this.name = 'CliError';
        this.code = code;
        this.hint = hint;
        this.exitCode = exitCode;
    }
}

function usageError(message: string, command?: CliCommand): CliError {
    const helpCommand = command ? `pnpm urls ${command} --help` : 'pnpm urls --help';
    return new CliError('E_USAGE', message, `Run "${helpCommand}" for usage.`, 2);
}

function inputError(message: string, hint?: string): CliError {
    return new CliError('E_INPUT', message, hint, 2);
}

function configError(message: string, hint: string): CliError {
    return new CliError('E_CONFIG', message, hint, 2);
}

function d1Error(message: string, cause?: unknown): CliError {
    return new CliError(
        'E_D1',
        message,
        'Retry with --debug for diagnostic details. If Wrangler login has expired, run "pnpm exec wrangler login".',
        1,
        cause
    );
}

function shortUrlConflictError(slugs: readonly string[], databaseTarget: DatabaseTarget, cause?: unknown): CliError {
    const paths = slugs.map((slug) => `/${slug}`).join(', ');
    const message =
        slugs.length === 1
            ? `The slug ${paths} already belongs to an active Short URL in ${databaseLabel(databaseTarget)}.`
            : `These slugs already belong to active Short URLs in ${databaseLabel(databaseTarget)}: ${paths}.`;

    return new CliError(
        'E_CONFLICT',
        message,
        `Choose different slugs, or remove the existing Short URL${slugs.length === 1 ? '' : 's'} first.`,
        1,
        cause
    );
}

function possibleShortUrlConflictError(
    slugs: readonly string[],
    databaseTarget: DatabaseTarget,
    cause?: unknown
): CliError {
    if (slugs.length === 1) return shortUrlConflictError(slugs, databaseTarget, cause);

    return new CliError(
        'E_CONFLICT',
        `At least one requested slug already belongs to an active Short URL in ${databaseLabel(databaseTarget)}: ${slugs.map((slug) => `/${slug}`).join(', ')}.`,
        `Run "pnpm urls list${databaseTarget === 'local' ? ' --local' : ''}" to identify it, or retry after choosing different slugs.`,
        1,
        cause
    );
}

function interruptedError(signal: 'SIGINT' | 'SIGTERM' = 'SIGINT'): CliError {
    return new CliError(
        'E_INTERRUPTED',
        signal === 'SIGINT' ? 'Interrupted by Ctrl+C.' : 'Terminated by SIGTERM.',
        undefined,
        signal === 'SIGINT' ? 130 : 143
    );
}

function styled(
    format: Parameters<typeof styleText>[0],
    text: string,
    stream: NodeJS.WritableStream = process.stdout
): string {
    return styleText(format, text, { stream });
}

const commonOptions = `  -l, --local            Use the local test D1 database
  -r, --remote           Use remote D1 (the default)
  -h, --help             Show contextual help
  --debug                Show diagnostic details on errors`;

const globalHelp = `Manage Short URLs directly in D1.

Usage:
  pnpm urls add <destination> <slug[,slug...]> [options]
  pnpm urls list [options]
  pnpm urls remove <slug...> [options]

Commands:
  add                    Create a Short URL
  list                   List Short URLs
  remove                 Remove a Short URL and all of its aliases

Common options:
${commonOptions}

Examples:
  pnpm urls add https://developers.cloudflare.com docs,cf
  pnpm urls list
  pnpm urls remove docs old-docs

Run "pnpm urls <command> --help" for command-specific options.

Environment:
  SHORT_URL_DEBUG=1      Show diagnostic details on errors
  NO_COLOR=1             Disable terminal colours

Exit codes:
  0    Success or user-declined removal
  1    D1 or operational failure
  2    Invalid command, input, or configuration
  130  Interrupted with Ctrl+C
  143  Terminated with SIGTERM
`;

const commandHelp: Record<CliCommand, string> = {
    add: `Create a Short URL.

Usage:
  pnpm urls add <destination> <slug[,slug...]> [options]

Arguments:
  <destination>          Complete web, mail, phone, or app destination URI
  <slug[,slug...]>       One or more comma-separated slugs

Options:
  --owner <tkid>         Owner tkid (defaults to SHORT_URL_OWNER_ID)
  -e, --expires <date>   Expiry as an ISO 8601 date
  -k, --protected        Generate a 128-bit access key
  --password             Prompt for a password (8-128 characters)
  --pin                  Prompt for a numeric PIN (4-8 digits)
${commonOptions}

Examples:
  pnpm urls add https://developers.cloudflare.com docs
  pnpm urls add https://developers.cloudflare.com docs,cf -e 2030-01-01T00:00:00Z
  pnpm urls add mailto:tk@tkkr.dev email,mail
  pnpm urls add 'shortcuts://run-shortcut?name=Open%20Dashboard' dashboard
  pnpm urls add https://example.com private --password -l

Expired aliases are reclaimed automatically when a new Short URL reuses them.
Compatible public destinations reuse their existing Short URL row.
Protected destinations remain separate so their credentials are never shared implicitly.
Protected destinations print a backend verification secret after a successful D1 write.
Browser-executable and local-file destination protocols are rejected.
`,
    list: `List Short URLs.

Usage:
  pnpm urls list [options]

Options:
  --json                 Print machine-readable JSON
${commonOptions}

Examples:
  pnpm urls list
  pnpm urls list --json -l
`,
    remove: `Remove Short URLs and all of their aliases.

Usage:
  pnpm urls remove <slug...> [options]

Options:
  -y, --yes              Skip the removal confirmation
${commonOptions}

Examples:
  pnpm urls remove docs old-docs
  pnpm urls remove docs old-docs -l -y
`,
};

async function main(arguments_: string[]): Promise<void> {
    if (arguments_.length === 0) {
        process.stdout.write(globalHelp);
        return;
    }

    let options: CliOptions;
    try {
        options = parseArguments(arguments_);
    } catch (error) {
        if (error instanceof CliError) throw error;
        throw usageError(
            error instanceof Error ? error.message : 'The command line could not be parsed.',
            arguments_.find(isCommand)
        );
    }

    if (options.help) {
        process.stdout.write(options.command === null ? globalHelp : commandHelp[options.command]);
        return;
    }

    const command = options.command;
    if (command === null) {
        const suppliedCommand = options.positionals[0];
        throw usageError(suppliedCommand ? `Unknown command "${suppliedCommand}".` : 'Choose add, list, or remove.');
    }

    switch (command) {
        case 'add':
            await addShortUrl(options);
            return;
        case 'list':
            await listShortUrls(options);
            return;
        case 'remove':
            await removeShortUrl(options);
            return;
    }
}

async function addShortUrl(options: CliOptions): Promise<void> {
    validateAddOptions(options);

    const destinationUrl = normalizeDestinationUrl(options.positionals[0]);
    const slugs = normalizeSlugList(options.positionals[1]);
    const ownerId = normalizeOwnerId(options.owner ?? process.env.SHORT_URL_OWNER_ID);
    const expiresAt = normalizeExpiry(options.expires);
    const databaseTarget = options.databaseTarget ?? 'remote';
    const existingSlugs = await findActiveSlugs(databaseTarget, slugs);
    if (existingSlugs.length > 0) {
        throw shortUrlConflictError(existingSlugs, databaseTarget);
    }

    if (options.protection === null) {
        const reusableShortUrlId = await findReusableShortUrlId(databaseTarget, destinationUrl, ownerId, expiresAt);
        if (reusableShortUrlId) {
            await addSlugsToExistingShortUrl(databaseTarget, reusableShortUrlId, slugs);
            printAddedShortUrls(slugs, databaseTarget, expiresAt, true);
            return;
        }
    }

    const id = randomUUID();
    const credentials = await createProtectionCredentials(options.protection, process.env.SHORT_URL_PEPPER, id);
    const now = Date.now();
    const sql = createInsertSql({
        id,
        destinationUrl,
        verifier: credentials?.verifier ?? null,
        expiresAt,
        ownerId,
        now,
        slugs,
    });

    await executeInsertSqlFile(sql, databaseTarget, id, slugs);

    printAddedShortUrls(slugs, databaseTarget, expiresAt, false, credentials);
}

function printAddedShortUrls(
    slugs: readonly string[],
    databaseTarget: DatabaseTarget,
    expiresAt: number | null,
    reused: boolean,
    credentials?: ProtectionCredentials | null
): void {
    const action = reused
        ? `Added ${slugs.length} slug${slugs.length === 1 ? '' : 's'} to an existing Short URL`
        : `Created ${slugs.length === 1 ? 'a Short URL' : 'Short URLs'}`;
    process.stdout.write(`${styled('green', action)} in ${databaseLabel(databaseTarget)}:\n`);
    for (const shortUrlSlug of slugs) {
        process.stdout.write(`  ${styled('cyan', `${publicOrigins[databaseTarget]}/${shortUrlSlug}`)}\n`);
    }

    if (expiresAt !== null) {
        process.stdout.write(`Expires: ${new Date(expiresAt).toISOString()}\n`);
    }

    if (credentials?.accessKey) {
        process.stdout.write(`\nAccess key (shown once): ${credentials.accessKey}\n`);
    }
    if (credentials) {
        process.stdout.write(`\nBackend verification secret (shown once): ${credentials.handoffSecret}\n`);
        process.stdout.write('The backend uses this secret to validate the short-lived access_token query value.\n');
    }
}

async function listShortUrls(options: CliOptions): Promise<void> {
    validateListOptions(options);

    const databaseTarget = options.databaseTarget ?? 'remote';
    const shortUrls = await fetchShortUrls(databaseTarget);

    if (options.json) {
        process.stdout.write(
            `${JSON.stringify(
                shortUrls.map((shortUrl) => shortUrlJson(shortUrl, databaseTarget)),
                null,
                2
            )}\n`
        );
        return;
    }

    if (shortUrls.length === 0) {
        process.stdout.write(`No Short URLs found in ${databaseLabel(databaseTarget)}.\n`);
        return;
    }

    process.stdout.write(
        `${styled('bold', databaseLabel(databaseTarget))} — ${shortUrls.length} Short URL${shortUrls.length === 1 ? '' : 's'}\n`
    );
    for (const shortUrl of shortUrls) {
        process.stdout.write(
            `\n${shortUrl.slugs.map((slug) => styled('cyan', `${publicOrigins[databaseTarget]}/${slug}`)).join('\n')}\n`
        );
        process.stdout.write(`  → ${shortUrl.destinationUrl}\n`);
        process.stdout.write(
            `  ${styled(shortUrl.status === 'active' ? 'green' : 'yellow', shortUrl.status)} · ${shortUrl.protection} · ${shortUrl.expiresAt === null ? 'never expires' : `expires ${new Date(shortUrl.expiresAt).toISOString()}`}\n`
        );
        process.stdout.write(`  owner ${shortUrl.ownerId} · created ${new Date(shortUrl.createdAt).toISOString()}\n`);
    }
}

async function removeShortUrl(options: CliOptions): Promise<void> {
    validateRemoveOptions(options);

    const requestedSlugs = [
        ...new Set(options.positionals.map((slug, index) => normalizeSlug(slug, `slug ${index + 1}`))),
    ];
    const databaseTarget = options.databaseTarget ?? 'remote';
    const shortUrls = await fetchShortUrls(databaseTarget, requestedSlugs);
    const resolvedSlugs = new Set(shortUrls.flatMap((shortUrl) => shortUrl.slugs));
    const missingSlugs = requestedSlugs.filter((slug) => !resolvedSlugs.has(slug));

    if (missingSlugs.length > 0) {
        throw new CliError(
            'E_NOT_FOUND',
            `No Short URL exists for ${missingSlugs.map((slug) => `/${slug}`).join(', ')} in ${databaseLabel(databaseTarget)}. Nothing was deleted.`,
            `Run "pnpm urls list${databaseTarget === 'local' ? ' --local' : ''}" to review the available Short URLs.`,
            1
        );
    }

    if (!options.yes && !(await confirmRemoval(shortUrls, databaseTarget))) {
        process.stdout.write('Removal cancelled.\n');
        return;
    }

    const shortUrlIds = shortUrls.map((shortUrl) => shortUrl.id);
    const results = await executeD1Command(
        `PRAGMA foreign_keys = ON;
DELETE FROM short_urls
WHERE id IN (${shortUrlIds.map(quoteSql).join(', ')})
RETURNING id;`,
        databaseTarget,
        'D1 removal failed. Short URLs could not be removed.'
    );
    const removedIds = new Set(
        results
            .flatMap((result) => result.results ?? [])
            .flatMap((row) =>
                row && typeof row === 'object' && 'id' in row && typeof row.id === 'string' ? [row.id] : []
            )
    );
    if (shortUrlIds.some((id) => !removedIds.has(id))) {
        throw d1Error('One or more Short URLs changed while they were being removed. List the Short URLs and retry.');
    }

    const aliases = shortUrls.flatMap((shortUrl) => shortUrl.slugs);
    process.stdout.write(
        `${styled('green', `Removed ${shortUrls.length} Short URL${shortUrls.length === 1 ? '' : 's'}`)} and ${aliases.length} alias${aliases.length === 1 ? '' : 'es'} (${aliases.map((alias) => `/${alias}`).join(', ')}) from ${databaseLabel(databaseTarget)}.\n`
    );
    if (shortUrls.some((shortUrl) => shortUrl.status === 'active' && shortUrl.protection === 'public')) {
        process.stdout.write(
            `${styled('yellow', 'Note:')} Previously cached public redirects may remain available for up to five minutes.\n`
        );
    }
}

function parseArguments(arguments_: string[]): CliOptions {
    const { positionals, values } = parseArgs({
        args: arguments_,
        allowPositionals: true,
        options: {
            debug: { type: 'boolean' },
            expires: { type: 'string', short: 'e' },
            help: { type: 'boolean', short: 'h' },
            json: { type: 'boolean' },
            local: { type: 'boolean', short: 'l' },
            owner: { type: 'string' },
            password: { type: 'boolean' },
            pin: { type: 'boolean' },
            protected: { type: 'boolean', short: 'k' },
            remote: { type: 'boolean', short: 'r' },
            yes: { type: 'boolean', short: 'y' },
        },
        strict: true,
    });
    const targets = [values.local && 'local', values.remote && 'remote'].filter(Boolean) as DatabaseTarget[];
    const protections = [values.protected && 'key', values.password && 'password', values.pin && 'pin'].filter(
        Boolean
    ) as ProtectionKind[];

    if (targets.length > 1) {
        throw usageError('Choose only one of --local or --remote.');
    }
    if (protections.length > 1) {
        throw usageError('Choose only one of --protected, --password, or --pin.', 'add');
    }

    const [possibleCommand, ...commandPositionals] = positionals;
    const command = possibleCommand && isCommand(possibleCommand) ? possibleCommand : null;

    return {
        command,
        databaseTarget: targets[0] ?? null,
        expires: values.expires,
        help: values.help ?? false,
        json: values.json ?? false,
        owner: values.owner,
        positionals: command === null ? positionals : commandPositionals,
        protection: protections[0] ?? null,
        yes: values.yes ?? false,
    };
}

function isCommand(value: string): value is CliCommand {
    return value === 'add' || value === 'list' || value === 'remove';
}

function validateAddOptions(options: CliOptions): void {
    if (options.positionals.length !== 2) {
        throw usageError('Add expects one destination URL followed by one comma-separated slug list.', 'add');
    }
    if (options.json || options.yes) {
        throw usageError('Add does not support --json or --yes.', 'add');
    }
}

function validateListOptions(options: CliOptions): void {
    if (options.positionals.length !== 0) {
        throw usageError('List does not accept positional arguments.', 'list');
    }
    rejectAddOptions(options, 'List');
    if (options.yes) {
        throw usageError('List does not support --yes.', 'list');
    }
}

function validateRemoveOptions(options: CliOptions): void {
    if (options.positionals.length === 0) {
        throw usageError('Remove expects at least one slug.', 'remove');
    }
    rejectAddOptions(options, 'Remove');
    if (options.json) {
        throw usageError('Remove does not support --json.', 'remove');
    }
}

function rejectAddOptions(options: CliOptions, command: 'List' | 'Remove'): void {
    if (options.owner !== undefined || options.expires !== undefined || options.protection) {
        throw usageError(`${command} does not support add-only options.`, command === 'List' ? 'list' : 'remove');
    }
}

function normalizeSlugList(value: string | undefined): string[] {
    if (value === undefined) {
        throw inputError('At least one slug is required.', 'Add slugs after the destination URL, separated by commas.');
    }

    const slugs = value.split(',').map((candidate, index) => {
        const slug = candidate.trim();
        if (!slug) {
            throw inputError(
                `Slug ${index + 1} is empty.`,
                'Separate slugs with single commas, for example: docs,cf,cloudflare'
            );
        }
        return normalizeSlug(slug, `slug ${index + 1}`);
    });

    return [...new Set(slugs)];
}

function normalizeSlug(value: string | undefined, label: string): string {
    const slug = value?.toLowerCase();

    if (!slug || !shortUrlSlugPattern.test(slug)) {
        throw inputError(
            `${label} must use 1-64 characters from a-z, 0-9, _ or -.`,
            'Choose a short lowercase name such as "docs" or "release_notes".'
        );
    }

    if (reservedShortUrlSlugs.has(slug)) {
        throw inputError(`${label} "${slug}" is reserved by the website.`, 'Choose a different slug.');
    }

    return slug;
}

function normalizeDestinationUrl(value: string | undefined): string {
    if (!value) {
        throw inputError('Destination URI is required.', 'Provide a complete web, mail, phone, or app URI.');
    }

    const result = validateShortUrlDestination(value);
    switch (result.kind) {
        case 'valid':
            return result.destinationUrl;
        case 'blocked-protocol':
            throw inputError(
                `Destination protocol "${result.protocol}" is not allowed.`,
                'Use a normal web, mail, phone, or installed-app URI rather than browser code or a local file.'
            );
        case 'too-long':
            throw inputError('Destination must be no longer than 2048 characters.', 'Use a shorter destination URI.');
        case 'invalid':
            throw inputError(
                'Destination must be a complete URI with a protocol.',
                'Put it first, for example: pnpm urls add mailto:hello@example.com email'
            );
    }
}

function normalizeOwnerId(value: string | undefined): string {
    const ownerId = value?.trim();

    if (!ownerId) {
        throw configError('No owner tkid is configured.', 'Pass --owner <tkid> or add SHORT_URL_OWNER_ID to .env.');
    }

    if (ownerId.length > 255 || ownerId.includes('\0')) {
        throw inputError('Owner tkid must be between 1 and 255 characters.', 'Check --owner or SHORT_URL_OWNER_ID.');
    }

    return ownerId;
}

function normalizeExpiry(value: string | undefined): number | null {
    if (value === undefined) {
        return null;
    }

    const expiresAt = Date.parse(value);
    if (!Number.isSafeInteger(expiresAt)) {
        throw inputError('Expiry must be a valid ISO 8601 date.', 'For example: 2030-01-01T00:00:00Z');
    }

    if (expiresAt <= Date.now()) {
        throw inputError('Expiry must be in the future.', 'Choose a later date or omit --expires.');
    }

    return expiresAt;
}

async function createProtectionCredentials(
    protection: CliOptions['protection'],
    pepper: string | undefined,
    shortUrlId: string
): Promise<ProtectionCredentials | null> {
    if (protection === null) {
        return null;
    }

    if (!pepper || Buffer.byteLength(pepper) < 32) {
        throw configError(
            'SHORT_URL_PEPPER must contain at least 32 bytes for protected Short URLs.',
            'Add a sufficiently long SHORT_URL_PEPPER to .env, then retry.'
        );
    }

    const handoffSecret = await deriveShortUrlHandoffSecret(shortUrlId, pepper);

    if (protection === 'key') return { ...createAccessCredentials(pepper), handoffSecret };

    const label = protection === 'pin' ? 'PIN' : 'Password';
    const secret = await promptAndConfirmSecret(label);

    if (protection === 'pin' && !/^[0-9]{4,8}$/.test(secret)) {
        throw inputError('PIN must contain 4-8 digits.', 'Retry and enter digits only.');
    }
    if (protection === 'password' && (secret.length < 8 || secret.length > 128)) {
        throw inputError('Password must contain 8-128 characters.', 'Retry with a password in that range.');
    }

    const salt = randomBytes(16).toString('base64url');
    const signature = createHmac('sha256', pepper).update(`${protection}.${salt}.${secret}`).digest('base64url');
    const lengthSegment = protection === 'pin' ? `:${secret.length}` : '';

    return {
        handoffSecret,
        verifier: `hmac-sha256:${protection}${lengthSegment}:${salt}:${signature}`,
    };
}

function createAccessCredentials(pepper: string): Pick<ProtectionCredentials, 'accessKey' | 'verifier'> {
    const accessKey = randomBytes(16).toString('base64url');
    const salt = randomBytes(16).toString('base64url');
    const signature = createHmac('sha256', pepper).update(`key.${salt}.${accessKey}`).digest('base64url');

    return {
        accessKey,
        verifier: `hmac-sha256:key:${salt}:${signature}`,
    };
}

async function promptAndConfirmSecret(label: string): Promise<string> {
    const secret = await readSecret(`${label}: `);
    const confirmation = await readSecret(`Confirm ${label.toLowerCase()}: `);

    if (secret !== confirmation) {
        throw inputError(`${label} entries do not match.`, `Run the add command again and re-enter the ${label}.`);
    }

    return secret;
}

function readSecret(prompt: string): Promise<string> {
    const input = process.stdin;
    const output = process.stdout;

    if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') {
        throw configError(
            'Password and PIN entry requires an interactive terminal.',
            'Run the add command directly in a terminal so the secret can be entered securely.'
        );
    }

    return new Promise((resolve, reject) => {
        let value = '';
        const previouslyRaw = input.isRaw;

        const cleanup = () => {
            input.off('keypress', onKeypress);
            process.off('SIGTERM', onTermination);
            input.setRawMode(previouslyRaw);
            input.pause();
        };

        const onTermination = () => {
            output.write('\n');
            cleanup();
            reject(interruptedError('SIGTERM'));
        };

        const onKeypress = (character: string, key: { ctrl?: boolean; meta?: boolean; name?: string }) => {
            if (key.ctrl && key.name === 'c') {
                output.write('\n');
                cleanup();
                reject(interruptedError());
                return;
            }

            if (key.name === 'return' || key.name === 'enter') {
                output.write('\n');
                cleanup();
                resolve(value);
                return;
            }

            if (key.name === 'backspace') {
                if (value.length > 0) {
                    value = value.slice(0, -1);
                    output.write('\b \b');
                }
                return;
            }

            if (!character || key.ctrl || key.meta || key.name === 'escape') {
                return;
            }

            value += character;
            output.write('•'.repeat([...character].length));
        };

        emitKeypressEvents(input);
        input.setRawMode(true);
        input.resume();
        input.on('keypress', onKeypress);
        process.once('SIGTERM', onTermination);
        output.write(prompt);
    });
}

async function confirmRemoval(shortUrls: ShortUrlRecord[], databaseTarget: DatabaseTarget): Promise<boolean> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw configError(
            'Removal confirmation requires an interactive terminal.',
            'Pass --yes to confirm the removal non-interactively.'
        );
    }

    process.stdout.write(
        `Remove ${shortUrls.length} Short URL${shortUrls.length === 1 ? '' : 's'} from ${databaseLabel(databaseTarget)}?\n`
    );
    for (const shortUrl of shortUrls) {
        process.stdout.write(`  ${shortUrl.slugs.map((slug) => `/${slug}`).join(', ')} → ${shortUrl.destinationUrl}\n`);
    }

    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    const abortController = new AbortController();
    let interruption: 'SIGINT' | 'SIGTERM' = 'SIGINT';
    const interrupt = (signal: 'SIGINT' | 'SIGTERM') => {
        interruption = signal;
        abortController.abort();
    };
    const interruptWithSigint = () => interrupt('SIGINT');
    const interruptWithSigterm = () => interrupt('SIGTERM');
    process.once('SIGINT', interruptWithSigint);
    process.once('SIGTERM', interruptWithSigterm);

    try {
        const answer = await prompt.question('Continue? [y/N] ', { signal: abortController.signal });
        return answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes';
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            process.stdout.write('\n');
            throw interruptedError(interruption);
        }
        throw error;
    } finally {
        process.off('SIGINT', interruptWithSigint);
        process.off('SIGTERM', interruptWithSigterm);
        prompt.close();
    }
}

function createInsertSql({ id, destinationUrl, verifier, expiresAt, ownerId, now, slugs }: ShortUrlInsert): string {
    const reusableShortUrlId = `(SELECT id
        FROM short_urls
        WHERE destination_url = ${quoteSql(destinationUrl)}
          AND owner_id = ${quoteSql(ownerId)}
          AND unlock_verifier IS NULL
          AND IFNULL(expires_at, -1) = ${expiresAt ?? -1}
        ORDER BY created_at ASC, id ASC
        LIMIT 1)`;
    const shortUrlId = verifier === null ? reusableShortUrlId : quoteSql(id);
    const slugValues = slugs.map((slug) => `(${quoteSql(slug)}, ${shortUrlId})`).join(',\n    ');
    const insertOperator = verifier === null ? 'INSERT OR IGNORE' : 'INSERT';

    return `PRAGMA foreign_keys = ON;

${insertOperator} INTO short_urls (
    id,
    destination_url,
    unlock_verifier,
    expires_at,
    owner_id,
    created_at,
    updated_at
) VALUES (
    ${quoteSql(id)},
    ${quoteSql(destinationUrl)},
    ${verifier === null ? 'NULL' : quoteSql(verifier)},
    ${expiresAt === null ? 'NULL' : expiresAt},
    ${quoteSql(ownerId)},
    ${now},
    ${now}
);

INSERT INTO short_url_slugs (slug, short_url_id) VALUES
    ${slugValues};

DELETE FROM short_urls
WHERE id = ${quoteSql(id)}
  AND NOT EXISTS (
      SELECT 1
      FROM short_url_slugs
      WHERE short_url_slugs.short_url_id = short_urls.id
  );

DELETE FROM short_urls
WHERE expires_at IS NOT NULL
  AND expires_at <= ${now}
  AND NOT EXISTS (
      SELECT 1
      FROM short_url_slugs
      WHERE short_url_slugs.short_url_id = short_urls.id
  );
`;
}

async function findReusableShortUrlId(
    databaseTarget: DatabaseTarget,
    destinationUrl: string,
    ownerId: string,
    expiresAt: number | null
): Promise<string | null> {
    const results = await executeD1Command(
        `SELECT id
FROM short_urls
WHERE destination_url = ${quoteSql(destinationUrl)}
  AND owner_id = ${quoteSql(ownerId)}
  AND unlock_verifier IS NULL
  AND IFNULL(expires_at, -1) = ${expiresAt ?? -1}
  AND (expires_at IS NULL OR expires_at > ${Date.now()})
ORDER BY created_at ASC, id ASC
LIMIT 1;`,
        databaseTarget,
        'D1 destination lookup failed. The Short URL was not created.'
    );

    for (const row of results.flatMap((result) => result.results ?? [])) {
        if (row && typeof row === 'object' && 'id' in row && typeof row.id === 'string') return row.id;
    }
    return null;
}

async function addSlugsToExistingShortUrl(
    databaseTarget: DatabaseTarget,
    shortUrlId: string,
    slugs: readonly string[]
): Promise<void> {
    const values = slugs.map((slug) => `(${quoteSql(slug)}, ${quoteSql(shortUrlId)})`).join(',\n    ');
    await executeD1Command(
        `INSERT INTO short_url_slugs (slug, short_url_id) VALUES
    ${values};`,
        databaseTarget,
        'D1 alias write failed. No slugs were added to the existing Short URL.',
        slugs
    );
}

async function findActiveSlugs(databaseTarget: DatabaseTarget, slugs: readonly string[]): Promise<string[]> {
    const results = await executeD1Command(
        `SELECT s.slug AS slug
FROM short_url_slugs AS s
INNER JOIN short_urls AS q ON q.id = s.short_url_id
WHERE s.slug IN (${slugs.map(quoteSql).join(', ')})
  AND (q.expires_at IS NULL OR q.expires_at > ${Date.now()})
ORDER BY s.slug ASC;`,
        databaseTarget,
        'D1 conflict check failed. The Short URL was not created.'
    );

    return results
        .flatMap((result) => result.results ?? [])
        .flatMap((row) =>
            row && typeof row === 'object' && 'slug' in row && typeof row.slug === 'string' ? [row.slug] : []
        );
}

async function fetchShortUrls(databaseTarget: DatabaseTarget, slugs?: readonly string[]): Promise<ShortUrlRecord[]> {
    const where = slugs
        ? `WHERE q.id IN (
    SELECT DISTINCT short_url_id
    FROM short_url_slugs
    WHERE slug IN (${slugs.map(quoteSql).join(', ')})
)`
        : '';
    const results = await executeD1Command(
        `SELECT
    q.id AS id,
    q.destination_url AS destinationUrl,
    q.unlock_verifier AS unlockVerifier,
    q.expires_at AS expiresAt,
    q.owner_id AS ownerId,
    q.created_at AS createdAt,
    q.updated_at AS updatedAt,
    s.slug AS slug
FROM short_urls AS q
INNER JOIN short_url_slugs AS s ON s.short_url_id = q.id
${where}
ORDER BY q.created_at DESC, s.slug ASC;`,
        databaseTarget,
        'D1 lookup failed. Short URLs could not be read.'
    );
    const rows = results.flatMap((result) => result.results ?? []) as ShortUrlQueryRow[];
    const shortUrls = new Map<string, ShortUrlRecord>();
    const now = Date.now();

    for (const row of rows) {
        const existing = shortUrls.get(row.id);
        if (existing) {
            existing.slugs.push(row.slug);
            continue;
        }

        shortUrls.set(row.id, {
            id: row.id,
            destinationUrl: row.destinationUrl,
            expiresAt: row.expiresAt,
            ownerId: row.ownerId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            protection: protectionKind(row.unlockVerifier),
            slugs: [row.slug],
            status: row.expiresAt !== null && row.expiresAt <= now ? 'expired' : 'active',
        });
    }

    return [...shortUrls.values()];
}

function protectionKind(verifier: string | null): ShortUrlRecord['protection'] {
    if (verifier === null) return 'public';
    if (verifier.startsWith('hmac-sha256:key:')) return 'key';
    if (verifier.startsWith('hmac-sha256:password:')) return 'password';
    if (verifier.startsWith('hmac-sha256:pin:')) return 'pin';
    return 'protected';
}

function shortUrlJson(shortUrl: ShortUrlRecord, databaseTarget: DatabaseTarget) {
    return {
        id: shortUrl.id,
        slugs: shortUrl.slugs,
        urls: shortUrl.slugs.map((slug) => `${publicOrigins[databaseTarget]}/${slug}`),
        destinationUrl: shortUrl.destinationUrl,
        status: shortUrl.status,
        protection: shortUrl.protection,
        expiresAt: shortUrl.expiresAt === null ? null : new Date(shortUrl.expiresAt).toISOString(),
        ownerId: shortUrl.ownerId,
        createdAt: new Date(shortUrl.createdAt).toISOString(),
        updatedAt: new Date(shortUrl.updatedAt).toISOString(),
    };
}

function quoteSql(value: string): string {
    return `'${value.replaceAll("'", "''")}'`;
}

async function executeInsertSqlFile(
    sql: string,
    databaseTarget: DatabaseTarget,
    shortUrlId: string,
    slugs: readonly string[]
): Promise<void> {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'tkkr-short-url-'));
    const sqlFile = join(temporaryDirectory, 'insert.sql');
    const context: D1OperationContext = {
        databaseTarget,
        failureMessage: 'D1 write failed. No Short URL was created.',
        slugs,
    };

    try {
        await writeFile(sqlFile, sql, { encoding: 'utf8', mode: 0o600 });
        try {
            const output = await runWrangler(
                [
                    'd1',
                    'execute',
                    databaseName,
                    `--file=${sqlFile}`,
                    databaseTarget === 'local' ? '--local' : '--remote',
                    '--yes',
                    '--json',
                ],
                context
            );
            parseD1Results(output, context);
        } catch (error) {
            await cleanupFailedInsert(shortUrlId, databaseTarget, error);
            throw error;
        }
    } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}

async function cleanupFailedInsert(
    shortUrlId: string,
    databaseTarget: DatabaseTarget,
    originalError: unknown
): Promise<void> {
    const cleanupSql = `DELETE FROM short_urls
WHERE id = ${quoteSql(shortUrlId)}
  AND NOT EXISTS (
      SELECT 1
      FROM short_url_slugs
      WHERE short_url_slugs.short_url_id = short_urls.id
  );`;

    try {
        await executeD1Command(
            cleanupSql,
            databaseTarget,
            'D1 cleanup failed. The incomplete Short URL may still exist.'
        );
    } catch (cleanupError) {
        const aggregateError = new AggregateError([originalError, cleanupError]);
        if (originalError instanceof CliError) {
            throw new CliError(
                originalError.code,
                `${originalError.message} Cleanup also failed, so an incomplete Short URL may remain.`,
                [
                    originalError.hint,
                    `Run "pnpm urls list${databaseTarget === 'local' ? ' --local' : ''}" after restoring D1 access.`,
                ]
                    .filter(Boolean)
                    .join(' '),
                originalError.exitCode,
                aggregateError
            );
        }

        throw d1Error('D1 write failed and its incomplete Short URL could not be cleaned up.', aggregateError);
    }
}

async function executeD1Command(
    sql: string,
    databaseTarget: DatabaseTarget,
    failureMessage: string,
    slugs?: readonly string[]
): Promise<D1ExecuteResult[]> {
    const context: D1OperationContext = { databaseTarget, failureMessage, slugs };
    const output = await runWrangler(
        [
            'd1',
            'execute',
            databaseName,
            `--command=${sql}`,
            databaseTarget === 'local' ? '--local' : '--remote',
            '--yes',
            '--json',
        ],
        context
    );

    return parseD1Results(output, context);
}

function parseD1Results(output: string, context: D1OperationContext): D1ExecuteResult[] {
    const value = parseWranglerJson(output);

    const results = Array.isArray(value) ? value : [value];
    if (
        results.length === 0 ||
        results.some(
            (result) =>
                !result ||
                typeof result !== 'object' ||
                !('success' in result) ||
                (result as D1ExecuteResult).success !== true
        )
    ) {
        const errorText = extractWranglerErrorText(value);
        throw classifyD1Failure(errorText, context, new Error('D1 returned an unsuccessful result.'));
    }

    return results as D1ExecuteResult[];
}

function parseWranglerJson(output: string): unknown {
    const attempt = tryParseWranglerJson(output);
    if (attempt.ok) return attempt.value;

    throw d1Error('Wrangler returned an unreadable D1 response.', attempt.error);
}

function tryParseWranglerJson(output: string): JsonParseAttempt {
    const normalizedOutput = stripVTControlCharacters(output).trim();
    const candidateStarts = [0];
    const jsonLinePattern = /^[\t ]*[\x5b\x7b]/gm;

    for (const match of normalizedOutput.matchAll(jsonLinePattern)) {
        const leadingWhitespace = match[0].length - 1;
        const candidateStart = match.index + leadingWhitespace;
        if (candidateStart > 0) candidateStarts.push(candidateStart);
    }

    let parseError: unknown;
    for (const candidateStart of [candidateStarts[0], ...candidateStarts.slice(1).reverse()]) {
        try {
            return { ok: true, value: JSON.parse(normalizedOutput.slice(candidateStart)) };
        } catch (error) {
            parseError = error;
        }
    }

    return { error: parseError, ok: false };
}

function runWrangler(arguments_: string[], context: D1OperationContext): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn('pnpm', ['exec', 'wrangler', ...arguments_], {
            cwd: projectDirectory,
            stdio: ['inherit', 'pipe', 'pipe'],
        });
        let output = '';
        let errorOutput = '';
        let interrupted = false;
        const cleanupSignalHandlers = () => {
            process.off('SIGINT', interruptWithSigint);
            process.off('SIGTERM', interruptWithSigterm);
        };
        const interrupt = (signal: 'SIGINT' | 'SIGTERM') => {
            if (interrupted) return;
            interrupted = true;
            cleanupSignalHandlers();
            child.kill(signal);
            reject(interruptedError(signal));
        };
        const interruptWithSigint = () => interrupt('SIGINT');
        const interruptWithSigterm = () => interrupt('SIGTERM');

        process.once('SIGINT', interruptWithSigint);
        process.once('SIGTERM', interruptWithSigterm);

        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => {
            output += chunk;
        });
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (chunk: string) => {
            errorOutput += chunk;
        });

        child.once('error', (error) => {
            cleanupSignalHandlers();
            const isMissingExecutable = 'code' in error && error.code === 'ENOENT';
            reject(
                isMissingExecutable
                    ? new CliError(
                          'E_CONFIG',
                          `${context.failureMessage} Wrangler could not be started.`,
                          'Install project dependencies with "pnpm install", then retry.',
                          2,
                          error
                      )
                    : d1Error(`${context.failureMessage} Wrangler could not be started.`, error)
            );
        });
        child.once('exit', (code, signal) => {
            cleanupSignalHandlers();
            if (interrupted) return;

            if (code === 0) {
                if (errorOutput.trim()) process.stderr.write(errorOutput);
                resolve(output);
                return;
            }

            const reason = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`;
            const errorText = findWranglerErrorText(output, errorOutput);
            reject(classifyD1Failure(errorText, context, new Error(`Wrangler exited with ${reason}.`)));
        });
    });
}

function findWranglerErrorText(output: string, errorOutput: string): string | undefined {
    for (const streamOutput of [output, errorOutput]) {
        const attempt = tryParseWranglerJson(streamOutput);
        if (!attempt.ok) continue;

        const errorText = extractWranglerErrorText(attempt.value);
        if (errorText) return errorText;
    }

    const plainError = stripVTControlCharacters(errorOutput).trim();
    if (plainError) return plainError;

    const plainOutput = stripVTControlCharacters(output).trim();
    return plainOutput || undefined;
}

function extractWranglerErrorText(value: unknown): string | undefined {
    if (typeof value === 'string') return value.trim() || undefined;
    if (Array.isArray(value)) {
        const messages = value.flatMap((item) => extractWranglerErrorText(item) ?? []);
        return [...new Set(messages)].join('; ') || undefined;
    }
    if (!value || typeof value !== 'object') return undefined;

    const record = value as Record<string, unknown>;
    const messages: string[] = [];
    const append = (candidate: unknown) => {
        if (typeof candidate === 'string' && candidate.trim()) messages.push(candidate.trim());
    };
    const appendError = (candidate: unknown) => {
        if (typeof candidate === 'string') {
            append(candidate);
            return;
        }
        if (!candidate || typeof candidate !== 'object') return;

        const errorRecord = candidate as Record<string, unknown>;
        append(errorRecord.text);
        append(errorRecord.message);
        if (typeof errorRecord.code === 'string' || typeof errorRecord.code === 'number') {
            append(`Cloudflare error code ${String(errorRecord.code)}`);
        }
    };

    append(record.message);
    append(record.text);
    appendError(record.error);
    if (Array.isArray(record.errors)) {
        for (const error of record.errors) appendError(error);
    }

    return [...new Set(messages)].join('; ') || undefined;
}

function classifyD1Failure(errorText: string | undefined, context: D1OperationContext, cause?: unknown): CliError {
    const detail = cleanErrorText(errorText);
    const normalized = detail.toLowerCase();
    const migrationCommand = `pnpm db:migrate:${context.databaseTarget}`;

    if (
        normalized.includes('unique constraint failed: short_url_slugs.slug') ||
        (normalized.includes('sqlite_constraint_primarykey') && normalized.includes('short_url_slugs'))
    ) {
        if (context.slugs?.length) return possibleShortUrlConflictError(context.slugs, context.databaseTarget, cause);
        return new CliError(
            'E_CONFLICT',
            `A slug already belongs to another Short URL in ${databaseLabel(context.databaseTarget)}.`,
            `Run "pnpm urls list${context.databaseTarget === 'local' ? ' --local' : ''}" to find it.`,
            1,
            cause
        );
    }

    if (
        normalized.includes('no such table') ||
        normalized.includes('no such column') ||
        normalized.includes('has no column named') ||
        normalized.includes('database schema has changed')
    ) {
        return new CliError(
            'E_SCHEMA',
            `${context.failureMessage} The ${databaseLabel(context.databaseTarget)} schema is missing or out of date.`,
            `Apply the current migrations with "${migrationCommand}", then retry.`,
            1,
            cause
        );
    }

    if (
        normalized.includes('not authenticated') ||
        normalized.includes('unable to authenticate') ||
        normalized.includes('authentication error') ||
        normalized.includes('invalid api token') ||
        normalized.includes('api token is invalid') ||
        normalized.includes('token has expired') ||
        normalized.includes('expired token') ||
        normalized.includes('unauthorized') ||
        normalized.includes('forbidden') ||
        normalized.includes('not authorized') ||
        normalized.includes('do not have permission') ||
        normalized.includes('cloudflare error code 10000') ||
        normalized.includes('cloudflare error code 10001') ||
        normalized.includes('cloudflare error code 6003') ||
        normalized.includes('cloudflare error code 9109')
    ) {
        return new CliError(
            'E_AUTH',
            `${context.failureMessage} Cloudflare rejected Wrangler's credentials.`,
            'Run "pnpm exec wrangler login", then retry.',
            1,
            cause
        );
    }

    if (
        normalized.includes("couldn't find a d1") ||
        normalized.includes('could not find a d1') ||
        normalized.includes('no d1 databases are configured') ||
        (normalized.includes('database binding') && normalized.includes('not found')) ||
        (normalized.includes('database id') && normalized.includes('not found'))
    ) {
        return new CliError(
            'E_CONFIG',
            `${context.failureMessage} Wrangler could not find ${databaseName}.`,
            'Check the D1 database name and binding in wrangler.jsonc.',
            2,
            cause
        );
    }

    if (
        normalized.includes('database is locked') ||
        normalized.includes('sqlite_busy') ||
        normalized.includes('too many requests') ||
        normalized.includes('rate limit') ||
        normalized.includes('temporarily unavailable') ||
        normalized.includes('service unavailable') ||
        /\b503\b/.test(normalized) ||
        /\b429\b/.test(normalized)
    ) {
        return new CliError(
            'E_BUSY',
            `${context.failureMessage} ${databaseLabel(context.databaseTarget)} is temporarily busy.`,
            'Wait briefly and retry the command.',
            1,
            cause
        );
    }

    if (
        normalized.includes('fetch failed') ||
        normalized.includes('network error') ||
        normalized.includes('econnreset') ||
        normalized.includes('econnrefused') ||
        normalized.includes('econnaborted') ||
        normalized.includes('enotfound') ||
        normalized.includes('etimedout') ||
        normalized.includes('getaddrinfo') ||
        normalized.includes('und_err_') ||
        normalized.includes('socket hang up')
    ) {
        return new CliError(
            'E_NETWORK',
            `${context.failureMessage} Wrangler could not reach Cloudflare.`,
            'Check your connection and retry. Use --local if you intended to use the local test database.',
            1,
            cause
        );
    }

    if (normalized.includes('constraint failed')) {
        return new CliError(
            'E_D1',
            `${context.failureMessage} D1 rejected the Short URL data: ${detail}`,
            `Confirm the ${databaseLabel(context.databaseTarget)} schema is current with "${migrationCommand}".`,
            1,
            cause
        );
    }

    return d1Error(detail ? `${context.failureMessage} D1 reported: ${detail}` : context.failureMessage, cause);
}

function cleanErrorText(errorText: string | undefined): string {
    if (!errorText) return '';

    const compact = stripVTControlCharacters(errorText).replaceAll(/\s+/g, ' ').trim();
    return compact.length > 600 ? `${compact.slice(0, 597)}...` : compact;
}

function databaseLabel(databaseTarget: DatabaseTarget): string {
    return databaseTarget === 'local' ? 'local test D1' : 'remote D1';
}

function debugRequested(arguments_: readonly string[]): boolean {
    const environmentValue = process.env.SHORT_URL_DEBUG?.trim().toLowerCase();
    return arguments_.includes('--debug') || ['1', 'true', 'yes', 'on'].includes(environmentValue ?? '');
}

function describeError(error: unknown): string {
    if (error instanceof Error) {
        const details = error.stack ?? `${error.name}: ${error.message}`;
        return error.cause === undefined ? details : `${details}\nCaused by: ${describeError(error.cause)}`;
    }
    return String(error);
}

function reportError(error: unknown, debug: boolean): void {
    const cliError =
        error instanceof CliError
            ? error
            : new CliError(
                  'E_INTERNAL',
                  'An unexpected CLI error occurred.',
                  `Retry with --debug. If the problem persists, report it at ${issueUrl}`,
                  1,
                  error
              );

    process.stderr.write(
        `\n${styled(['bold', 'red'], `Error [${cliError.code}]`, process.stderr)}: ${cliError.message}\n`
    );
    if (cliError.hint) {
        process.stderr.write(`${styled('yellow', 'Hint', process.stderr)}: ${cliError.hint}\n`);
    }
    if (debug) {
        process.stderr.write(`\n${styled('dim', 'Debug details', process.stderr)}\n${describeError(cliError)}\n`);
    }

    process.exitCode = cliError.exitCode;
}

const commandLineArguments = process.argv.slice(2);
main(commandLineArguments).catch((error: unknown) => {
    reportError(error, debugRequested(commandLineArguments));
});
