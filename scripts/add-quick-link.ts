import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { emitKeypressEvents } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const databaseName = 'tkkr-dev-links';
const publicOrigins = {
    local: 'http://localhost:3000',
    remote: 'https://tkkr.dev',
} as const;
const slugPattern = /^[a-z0-9_-]{1,64}$/;
const reservedSlugs = new Set(['about', 'admin', 'api', 'links', 'projects']);
const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));

type CliOptions = {
    aliases: string[];
    databaseTarget: DatabaseTarget | null;
    expires: string | undefined;
    help: boolean;
    owner: string | undefined;
    positionals: string[];
    protection: 'key' | 'password' | 'pin' | null;
};

type DatabaseTarget = keyof typeof publicOrigins;

type ProtectionCredentials = {
    accessKey?: string;
    verifier: string;
};

type QuickLinkInsert = {
    id: string;
    destinationUrl: string;
    verifier: string | null;
    expiresAt: number | null;
    ownerId: string;
    now: number;
    slugs: string[];
};

const help = `Add a Quick Link directly to D1.

Usage:
  pnpm quick-link:add -- <slug> <destination> [options]
  pnpm quick-link:add:local -- <slug> <destination> [options]

Options:
  --alias <slug>       Add another alias (repeatable)
  --owner <tkid>       Owner tkid (defaults to QUICK_LINK_OWNER_ID)
  --expires <date>     Expiry as an ISO 8601 date
  --protected          Generate a 128-bit access key
  --password           Prompt for a password (8-128 characters)
  --pin                Prompt for a numeric PIN (4-8 digits)
  --local              Write to the local test D1 database
  --remote             Write to remote D1 (the default)
  -h, --help           Show this help

Examples:
  pnpm quick-link:add -- docs https://developers.cloudflare.com
  pnpm quick-link:add:local -- docs https://developers.cloudflare.com
  pnpm quick-link:add -- docs https://developers.cloudflare.com --alias cf --protected
  pnpm quick-link:add:local -- private https://example.com --password
  pnpm quick-link:add:local -- event https://example.com --pin

Expired aliases are reclaimed automatically when a new link reuses them.
`;

async function main(): Promise<void> {
    const options = parseArguments(process.argv.slice(2));

    if (options.help) {
        process.stdout.write(help);
        return;
    }

    const slug = normalizeSlug(options.positionals[0], 'slug');
    const destinationUrl = normalizeDestinationUrl(options.positionals[1]);
    const aliases = options.aliases.map((alias) => normalizeSlug(alias, 'alias'));
    const slugs = [...new Set([slug, ...aliases])];
    const ownerId = normalizeOwnerId(options.owner ?? process.env.QUICK_LINK_OWNER_ID);
    const expiresAt = normalizeExpiry(options.expires);
    const credentials = await createProtectionCredentials(options.protection, process.env.SHORT_LINK_PEPPER);
    const databaseTarget = options.databaseTarget ?? 'remote';
    const id = randomUUID();
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

    await executeSqlFile(sql, databaseTarget, id);

    const databaseLabel = databaseTarget === 'local' ? 'local test D1' : 'remote D1';
    process.stdout.write(`\nCreated ${slugs.length === 1 ? 'Quick Link' : 'Quick Links'} in ${databaseLabel}:\n`);
    for (const linkSlug of slugs) {
        process.stdout.write(`  ${publicOrigins[databaseTarget]}/${linkSlug}\n`);
    }

    if (expiresAt !== null) {
        process.stdout.write(`Expires: ${new Date(expiresAt).toISOString()}\n`);
    }

    if (credentials?.accessKey) {
        process.stdout.write(`\nAccess key (shown once): ${credentials.accessKey}\n`);
    }
}

function parseArguments(arguments_: string[]): CliOptions {
    const options: CliOptions = {
        aliases: [],
        databaseTarget: null,
        expires: undefined,
        help: false,
        owner: undefined,
        positionals: [],
        protection: null,
    };

    for (let index = 0; index < arguments_.length; index += 1) {
        const argument = arguments_[index];

        if (argument === '--') {
            continue;
        } else if (argument === '-h' || argument === '--help') {
            options.help = true;
        } else if (argument === '--protected') {
            setProtection(options, 'key');
        } else if (argument === '--password') {
            setProtection(options, 'password');
        } else if (argument === '--pin') {
            setProtection(options, 'pin');
        } else if (argument === '--local') {
            setDatabaseTarget(options, 'local');
        } else if (argument === '--remote') {
            setDatabaseTarget(options, 'remote');
        } else if (argument === '--alias' || argument.startsWith('--alias=')) {
            options.aliases.push(readOptionValue(arguments_, index, argument, '--alias'));
            if (argument === '--alias') index += 1;
        } else if (argument === '--owner' || argument.startsWith('--owner=')) {
            options.owner = readOptionValue(arguments_, index, argument, '--owner');
            if (argument === '--owner') index += 1;
        } else if (argument === '--expires' || argument.startsWith('--expires=')) {
            options.expires = readOptionValue(arguments_, index, argument, '--expires');
            if (argument === '--expires') index += 1;
        } else if (argument.startsWith('-')) {
            throw new Error(`Unknown option: ${argument}`);
        } else if (argument) {
            options.positionals.push(argument);
        }
    }

    if (!options.help && options.positionals.length !== 2) {
        throw new Error('Expected a slug and destination URL. Run with --help for usage.');
    }

    return options;
}

function setDatabaseTarget(options: CliOptions, databaseTarget: DatabaseTarget): void {
    if (options.databaseTarget !== null && options.databaseTarget !== databaseTarget) {
        throw new Error('Choose only one of --local or --remote');
    }

    options.databaseTarget = databaseTarget;
}

function setProtection(options: CliOptions, protection: NonNullable<CliOptions['protection']>): void {
    if (options.protection !== null) {
        throw new Error('Choose only one of --protected, --password, or --pin');
    }

    options.protection = protection;
}

function readOptionValue(arguments_: string[], index: number, argument: string, optionName: string): string {
    const inlineValue = argument.slice(optionName.length + 1);
    const value = argument === optionName ? arguments_[index + 1] : inlineValue;

    if (!value || value.startsWith('-')) {
        throw new Error(`${optionName} requires a value`);
    }

    return value;
}

function normalizeSlug(value: string | undefined, label: string): string {
    const slug = value?.toLowerCase();

    if (!slug || !slugPattern.test(slug)) {
        throw new Error(`${label} must use 1-64 characters from a-z, 0-9, _ or -`);
    }

    if (reservedSlugs.has(slug)) {
        throw new Error(`${label} "${slug}" is reserved by the website`);
    }

    return slug;
}

function normalizeDestinationUrl(value: string | undefined): string {
    if (!value) {
        throw new Error('Destination must be a valid URL');
    }

    let url: URL;

    try {
        url = new URL(value);
    } catch {
        throw new Error('Destination must be a valid URL');
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Destination must use HTTP or HTTPS');
    }

    if (url.href.length > 2048) {
        throw new Error('Destination must be no longer than 2048 characters');
    }

    return url.href;
}

function normalizeOwnerId(value: string | undefined): string {
    const ownerId = value?.trim();

    if (!ownerId) {
        throw new Error('Provide --owner <tkid> or set QUICK_LINK_OWNER_ID in .env');
    }

    if (ownerId.length > 255 || ownerId.includes('\0')) {
        throw new Error('Owner tkid must be between 1 and 255 characters');
    }

    return ownerId;
}

function normalizeExpiry(value: string | undefined): number | null {
    if (value === undefined) {
        return null;
    }

    const expiresAt = Date.parse(value);
    if (!Number.isSafeInteger(expiresAt)) {
        throw new Error('Expiry must be a valid ISO 8601 date');
    }

    if (expiresAt <= Date.now()) {
        throw new Error('Expiry must be in the future');
    }

    return expiresAt;
}

async function createProtectionCredentials(
    protection: CliOptions['protection'],
    pepper: string | undefined
): Promise<ProtectionCredentials | null> {
    if (protection === null) {
        return null;
    }

    if (!pepper || Buffer.byteLength(pepper) < 32) {
        throw new Error('SHORT_LINK_PEPPER must contain at least 32 bytes for protected links');
    }

    if (protection === 'key') {
        return createAccessCredentials(pepper);
    }

    const label = protection === 'pin' ? 'PIN' : 'Password';
    const secret = await promptAndConfirmSecret(label);

    if (protection === 'pin' && !/^[0-9]{4,8}$/.test(secret)) {
        throw new Error('PIN must contain 4-8 digits');
    }
    if (protection === 'password' && (secret.length < 8 || secret.length > 128)) {
        throw new Error('Password must contain 8-128 characters');
    }

    const salt = randomBytes(16).toString('base64url');
    const signature = createHmac('sha256', pepper).update(`${protection}.${salt}.${secret}`).digest('base64url');
    const lengthSegment = protection === 'pin' ? `:${secret.length}` : '';

    return {
        verifier: `hmac-sha256:v2:${protection}${lengthSegment}:${salt}:${signature}`,
    };
}

function createAccessCredentials(pepper: string): ProtectionCredentials {
    const accessKey = randomBytes(16).toString('base64url');
    const salt = randomBytes(16).toString('base64url');
    const signature = createHmac('sha256', pepper).update(`${salt}.${accessKey}`).digest('base64url');

    return {
        accessKey,
        verifier: `hmac-sha256:v1:${salt}:${signature}`,
    };
}

async function promptAndConfirmSecret(label: string): Promise<string> {
    const secret = await readSecret(`${label}: `);
    const confirmation = await readSecret(`Confirm ${label.toLowerCase()}: `);

    if (secret !== confirmation) {
        throw new Error(`${label} entries do not match`);
    }

    return secret;
}

function readSecret(prompt: string): Promise<string> {
    const input = process.stdin;
    const output = process.stdout;

    if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') {
        throw new Error('Password and PIN entry requires an interactive terminal');
    }

    return new Promise((resolve, reject) => {
        let value = '';
        const previouslyRaw = input.isRaw;

        const cleanup = () => {
            input.off('keypress', onKeypress);
            input.setRawMode(previouslyRaw);
            input.pause();
        };

        const onKeypress = (character: string, key: { ctrl?: boolean; meta?: boolean; name?: string }) => {
            if (key.ctrl && key.name === 'c') {
                output.write('\n');
                cleanup();
                reject(new Error('Cancelled'));
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
        output.write(prompt);
    });
}

function createInsertSql({ id, destinationUrl, verifier, expiresAt, ownerId, now, slugs }: QuickLinkInsert): string {
    const slugValues = slugs.map((slug) => `(${quoteSql(slug)}, ${quoteSql(id)})`).join(',\n    ');

    return `PRAGMA foreign_keys = ON;

INSERT INTO quick_links (
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

INSERT INTO quick_link_slugs (slug, quick_link_id) VALUES
    ${slugValues};

DELETE FROM quick_links
WHERE expires_at IS NOT NULL
  AND expires_at <= ${now}
  AND NOT EXISTS (
      SELECT 1
      FROM quick_link_slugs
      WHERE quick_link_slugs.quick_link_id = quick_links.id
  );
`;
}

function quoteSql(value: string): string {
    return `'${value.replaceAll("'", "''")}'`;
}

async function executeSqlFile(sql: string, databaseTarget: DatabaseTarget, linkId: string): Promise<void> {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'tkkr-quick-link-'));
    const sqlFile = join(temporaryDirectory, 'insert.sql');

    try {
        await writeFile(sqlFile, sql, { encoding: 'utf8', mode: 0o600 });
        try {
            await runWrangler([
                'exec',
                'wrangler',
                'd1',
                'execute',
                databaseName,
                `--file=${sqlFile}`,
                databaseTarget === 'local' ? '--local' : '--remote',
                '--yes',
            ]);
        } catch (error) {
            await cleanupFailedInsert(linkId, databaseTarget, error);
            throw error;
        }
    } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}

async function cleanupFailedInsert(
    linkId: string,
    databaseTarget: DatabaseTarget,
    originalError: unknown
): Promise<void> {
    const cleanupSql = `DELETE FROM quick_links
WHERE id = ${quoteSql(linkId)}
  AND NOT EXISTS (
      SELECT 1
      FROM quick_link_slugs
      WHERE quick_link_slugs.quick_link_id = quick_links.id
  );`;

    try {
        await runWrangler([
            'exec',
            'wrangler',
            'd1',
            'execute',
            databaseName,
            `--command=${cleanupSql}`,
            databaseTarget === 'local' ? '--local' : '--remote',
            '--yes',
        ]);
    } catch (cleanupError) {
        throw new AggregateError(
            [originalError, cleanupError],
            'D1 write failed and its incomplete Quick Link could not be cleaned up.'
        );
    }
}

function runWrangler(arguments_: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn('pnpm', arguments_, {
            cwd: projectDirectory,
            stdio: 'inherit',
        });

        child.once('error', reject);
        child.once('exit', (code, signal) => {
            if (code === 0) {
                resolve();
                return;
            }

            const reason = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`;
            reject(new Error(`D1 write failed (${reason}). No Quick Link was created.`));
        });
    });
}

main().catch((error) => {
    process.stderr.write(`\nError: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
});
