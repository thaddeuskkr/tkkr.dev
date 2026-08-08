import { normalizeShortUrlDestination } from '@/lib/shortener/destination';

const shortUrlSlugPattern = /^[a-z0-9_-]{1,64}$/;
const accessKeyPattern = /^[A-Za-z0-9_-]{22}$/;
const keyVerifierPattern = /^hmac-sha256:key:([A-Za-z0-9_-]{22}):([A-Za-z0-9_-]{43})$/;
const passwordVerifierPattern = /^hmac-sha256:password:([A-Za-z0-9_-]{22}):([A-Za-z0-9_-]{43})$/;
const pinVerifierPattern = /^hmac-sha256:pin:([4-8]):([A-Za-z0-9_-]{22}):([A-Za-z0-9_-]{43})$/;

const reservedShortUrlSlugs = new Set(['about', 'admin', 'api', 'links', 'projects']);

const textEncoder = new TextEncoder();

type ShortUrlRow = {
    id: string;
    destination_url: string;
    expires_at: number | null;
    unlock_verifier: string | null;
};

export type PublicShortUrl = {
    destinationUrl: string;
    expiresAt: number | null;
};

export type ProtectedShortUrl = PublicShortUrl & {
    id: string;
    protection: ShortUrlProtection;
    unlockVerifier: string;
};

export type ShortUrlProtection = { kind: 'key' } | { kind: 'password' } | { kind: 'pin'; length: number };

export type ShortUrlLookupResult =
    | { kind: 'active'; shortUrl: PublicShortUrl }
    | { kind: 'protected'; shortUrl: ProtectedShortUrl }
    | { kind: 'expired' }
    | { kind: 'missing' }
    | { kind: 'unavailable'; reason: 'database' | 'invalid-record'; error?: string };

export function normalizeShortUrlSlug(value: string): string | null {
    const slug = value.toLowerCase();

    if (!shortUrlSlugPattern.test(slug) || reservedShortUrlSlugs.has(slug)) {
        return null;
    }

    return slug;
}

export async function lookupShortUrl(
    database: D1Database,
    slug: string,
    now = Date.now()
): Promise<ShortUrlLookupResult> {
    let row: ShortUrlRow | null;

    try {
        row = await database
            .prepare(
                `SELECT
                    short_urls.id,
                    short_urls.destination_url,
                    short_urls.expires_at,
                    short_urls.unlock_verifier
                FROM short_url_slugs
                INNER JOIN short_urls
                    ON short_urls.id = short_url_slugs.short_url_id
                WHERE short_url_slugs.slug = ?1
                LIMIT 1`
            )
            .bind(slug)
            .first<ShortUrlRow>();
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

    const destinationUrl = normalizeShortUrlDestination(row.destination_url);
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

    if (unlockVerifier !== null && parsedVerifier) {
        return {
            kind: 'protected',
            shortUrl: {
                id: row.id,
                destinationUrl,
                expiresAt,
                protection: parsedVerifier.protection,
                unlockVerifier,
            },
        };
    }

    return {
        kind: 'active',
        shortUrl: { destinationUrl, expiresAt },
    };
}

export async function verifyShortUrlSecret(secret: string, verifier: string, pepper: string): Promise<boolean> {
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
    protection: ShortUrlProtection;
    salt: string;
    encodedSignature: string;
};

function parseVerifier(verifier: string): ParsedVerifier | null {
    const keyMatch = keyVerifierPattern.exec(verifier);
    if (keyMatch?.[1] && keyMatch[2]) {
        return {
            protection: { kind: 'key' },
            salt: keyMatch[1],
            encodedSignature: keyMatch[2],
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

function isValidSubmittedSecret(value: string, protection: ShortUrlProtection): boolean {
    switch (protection.kind) {
        case 'key':
            return accessKeyPattern.test(value);
        case 'password':
            return value.length >= 8 && value.length <= 128;
        case 'pin':
            return value.length === protection.length && /^[0-9]+$/.test(value);
    }
}

function signingPayload(value: string, protection: ShortUrlProtection, salt: string): string {
    return `${protection.kind}.${salt}.${value}`;
}

function importHmacKey(pepper: string, usages: KeyUsage[]): Promise<CryptoKey> {
    const pepperBytes = textEncoder.encode(pepper);
    if (pepperBytes.byteLength < 32) {
        throw new Error('SHORT_URL_PEPPER must contain at least 32 bytes');
    }

    return crypto.subtle.importKey('raw', pepperBytes, { name: 'HMAC', hash: 'SHA-256' }, false, usages);
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
