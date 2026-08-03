const quickLinkSlugPattern = /^[a-z0-9_-]{1,64}$/;
const accessKeyPattern = /^[A-Za-z0-9_-]{22}$/;
const legacyVerifierPattern = /^hmac-sha256:v1:([A-Za-z0-9_-]{22}):([A-Za-z0-9_-]{43})$/;
const passwordVerifierPattern = /^hmac-sha256:v2:password:([A-Za-z0-9_-]{22}):([A-Za-z0-9_-]{43})$/;
const pinVerifierPattern = /^hmac-sha256:v2:pin:([4-8]):([A-Za-z0-9_-]{22}):([A-Za-z0-9_-]{43})$/;

const reservedQuickLinkSlugs = new Set(['about', 'admin', 'api', 'links', 'projects']);

const textEncoder = new TextEncoder();

type QuickLinkRow = {
    id: string;
    destination_url: string;
    expires_at: number | null;
    unlock_verifier: string | null;
};

export type PublicQuickLink = {
    destinationUrl: string;
    expiresAt: number | null;
};

export type ProtectedQuickLink = PublicQuickLink & {
    id: string;
    protection: QuickLinkProtection;
    unlockVerifier: string;
};

export type QuickLinkProtection = { kind: 'key' } | { kind: 'password' } | { kind: 'pin'; length: number };

export type QuickLinkLookupResult =
    | { kind: 'active'; link: PublicQuickLink }
    | { kind: 'protected'; link: ProtectedQuickLink }
    | { kind: 'expired' }
    | { kind: 'missing' }
    | { kind: 'unavailable'; reason: 'database' | 'invalid-record'; error?: string };

export type QuickLinkAccessCredentials = {
    accessKey: string;
    verifier: string;
};

export function normalizeQuickLinkSlug(value: string): string | null {
    const slug = value.toLowerCase();

    if (!quickLinkSlugPattern.test(slug) || reservedQuickLinkSlugs.has(slug)) {
        return null;
    }

    return slug;
}

export async function lookupQuickLink(
    database: D1Database,
    slug: string,
    now = Date.now()
): Promise<QuickLinkLookupResult> {
    let row: QuickLinkRow | null;

    try {
        row = await database
            .prepare(
                `SELECT
                    quick_links.id,
                    quick_links.destination_url,
                    quick_links.expires_at,
                    quick_links.unlock_verifier
                FROM quick_link_slugs
                INNER JOIN quick_links
                    ON quick_links.id = quick_link_slugs.quick_link_id
                WHERE quick_link_slugs.slug = ?1
                LIMIT 1`
            )
            .bind(slug)
            .first<QuickLinkRow>();
    } catch (error) {
        return {
            kind: 'unavailable',
            reason: 'database',
            error: error instanceof Error ? error.message : String(error),
        };
    }

    if (!row) {
        return { kind: 'missing' };
    }

    const destinationUrl = normalizeDestinationUrl(row.destination_url);
    const expiresAt = row.expires_at;
    const unlockVerifier = row.unlock_verifier;
    const parsedVerifier = unlockVerifier === null ? null : parseVerifier(unlockVerifier);

    if (
        !destinationUrl ||
        typeof row.id !== 'string' ||
        (expiresAt !== null && (!Number.isSafeInteger(expiresAt) || expiresAt < 0)) ||
        (unlockVerifier !== null && !parsedVerifier)
    ) {
        return { kind: 'unavailable', reason: 'invalid-record' };
    }

    if (expiresAt !== null && expiresAt <= now) {
        return { kind: 'expired' };
    }

    if (unlockVerifier) {
        return {
            kind: 'protected',
            link: {
                id: row.id,
                destinationUrl,
                expiresAt,
                protection: parsedVerifier?.protection ?? { kind: 'key' },
                unlockVerifier,
            },
        };
    }

    return {
        kind: 'active',
        link: { destinationUrl, expiresAt },
    };
}

export async function generateQuickLinkAccessCredentials(pepper: string): Promise<QuickLinkAccessCredentials> {
    const accessKeyBytes = crypto.getRandomValues(new Uint8Array(16));
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const accessKey = encodeBase64Url(accessKeyBytes);
    const salt = encodeBase64Url(saltBytes);
    const signature = await signAccessKey(accessKey, salt, pepper);

    return {
        accessKey,
        verifier: `hmac-sha256:v1:${salt}:${encodeBase64Url(signature)}`,
    };
}

export async function verifyQuickLinkSecret(secret: string, verifier: string, pepper: string): Promise<boolean> {
    const parsedVerifier = parseVerifier(verifier);
    if (!parsedVerifier || !isValidSubmittedSecret(secret, parsedVerifier.protection)) {
        return false;
    }

    const signature = decodeBase64Url(parsedVerifier.encodedSignature);
    if (!signature || signature.byteLength !== 32) {
        return false;
    }

    const key = await importHmacKey(pepper, ['verify']);
    return crypto.subtle.verify(
        'HMAC',
        key,
        signature,
        textEncoder.encode(signingPayload(secret, parsedVerifier.protection, parsedVerifier.salt))
    );
}

type ParsedVerifier = {
    protection: QuickLinkProtection;
    salt: string;
    encodedSignature: string;
};

function parseVerifier(verifier: string): ParsedVerifier | null {
    const legacyMatch = legacyVerifierPattern.exec(verifier);
    if (legacyMatch?.[1] && legacyMatch[2]) {
        return {
            protection: { kind: 'key' },
            salt: legacyMatch[1],
            encodedSignature: legacyMatch[2],
        };
    }

    const passwordMatch = passwordVerifierPattern.exec(verifier);
    if (passwordMatch?.[1] && passwordMatch[2]) {
        return {
            protection: { kind: 'password' },
            salt: passwordMatch[1],
            encodedSignature: passwordMatch[2],
        };
    }

    const pinMatch = pinVerifierPattern.exec(verifier);
    const pinLength = Number(pinMatch?.[1]);
    if (Number.isInteger(pinLength) && pinMatch?.[2] && pinMatch[3]) {
        return {
            protection: { kind: 'pin', length: pinLength },
            salt: pinMatch[2],
            encodedSignature: pinMatch[3],
        };
    }

    return null;
}

function isValidSubmittedSecret(value: string, protection: QuickLinkProtection): boolean {
    switch (protection.kind) {
        case 'key':
            return accessKeyPattern.test(value);
        case 'password':
            return value.length >= 8 && value.length <= 128;
        case 'pin':
            return value.length === protection.length && /^[0-9]+$/.test(value);
    }
}

function signingPayload(value: string, protection: QuickLinkProtection, salt: string): string {
    return protection.kind === 'key' ? `${salt}.${value}` : `${protection.kind}.${salt}.${value}`;
}

function normalizeDestinationUrl(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch {
        return null;
    }
}

async function signAccessKey(accessKey: string, salt: string, pepper: string): Promise<Uint8Array> {
    const key = await importHmacKey(pepper, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(`${salt}.${accessKey}`));

    return new Uint8Array(signature);
}

function importHmacKey(pepper: string, usages: KeyUsage[]): Promise<CryptoKey> {
    const pepperBytes = textEncoder.encode(pepper);
    if (pepperBytes.byteLength < 32) {
        throw new Error('SHORT_LINK_PEPPER must contain at least 32 bytes');
    }

    return crypto.subtle.importKey('raw', pepperBytes, { name: 'HMAC', hash: 'SHA-256' }, false, usages);
}

function encodeBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
    try {
        const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const binary = atob(padded);
        const bytes = new Uint8Array(new ArrayBuffer(binary.length));
        for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }
        return bytes;
    } catch {
        return null;
    }
}
