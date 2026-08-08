const maximumFailedAttempts = 10;
const lockDurationMilliseconds = 30 * 60 * 1000;
const textEncoder = new TextEncoder();

type UnlockAttemptRow = {
    failed_attempts: number;
    locked_until: number | null;
};

export type ShortUrlRateLimitResult =
    | { kind: 'allowed'; attemptsRemaining: number; tracked: boolean }
    | { kind: 'locked'; retryAfterSeconds: number }
    | { kind: 'unavailable'; error: string };

export async function fingerprintShortUrlClient(shortUrlId: string, clientIp: string, pepper: string): Promise<string> {
    const key = await importFingerprintKey(pepper);
    const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(`ratelimit:${shortUrlId}:${clientIp}`));

    return encodeBase64Url(new Uint8Array(signature));
}

export async function checkShortUrlRateLimit(
    database: D1Database,
    shortUrlId: string,
    clientFingerprint: string,
    now = Date.now()
): Promise<ShortUrlRateLimitResult> {
    let row: UnlockAttemptRow | null;

    try {
        row = await database
            .prepare(
                `SELECT failed_attempts, locked_until
                FROM short_url_unlock_attempts
                WHERE short_url_id = ?1 AND client_fingerprint = ?2
                LIMIT 1`
            )
            .bind(shortUrlId, clientFingerprint)
            .first<UnlockAttemptRow>();
    } catch (error) {
        return unavailable(error);
    }

    if (!row) {
        return { kind: 'allowed', attemptsRemaining: maximumFailedAttempts, tracked: false };
    }

    if (!isValidRow(row)) {
        return { kind: 'unavailable', error: 'Invalid unlock-attempt record' };
    }

    if (row.locked_until !== null && row.locked_until > now) {
        return locked(row.locked_until, now);
    }

    const attemptsRemaining =
        row.locked_until !== null ? maximumFailedAttempts : maximumFailedAttempts - row.failed_attempts;
    return { kind: 'allowed', attemptsRemaining, tracked: true };
}

export async function recordShortUrlUnlockFailure(
    database: D1Database,
    shortUrlId: string,
    clientFingerprint: string,
    now = Date.now()
): Promise<ShortUrlRateLimitResult> {
    const lockedUntil = now + lockDurationMilliseconds;
    let row: unknown;

    try {
        const [, readResult] = await database.batch<UnlockAttemptRow>([
            database
                .prepare(
                    `INSERT INTO short_url_unlock_attempts (
                        short_url_id,
                        client_fingerprint,
                        failed_attempts,
                        locked_until,
                        updated_at
                    ) VALUES (?1, ?2, 1, NULL, ?3)
                    ON CONFLICT (short_url_id, client_fingerprint) DO UPDATE SET
                        failed_attempts = CASE
                            WHEN short_url_unlock_attempts.locked_until IS NOT NULL
                                AND short_url_unlock_attempts.locked_until <= ?3 THEN 1
                            WHEN short_url_unlock_attempts.failed_attempts >= ?4 THEN ?4
                            ELSE short_url_unlock_attempts.failed_attempts + 1
                        END,
                        locked_until = CASE
                            WHEN short_url_unlock_attempts.locked_until IS NOT NULL
                                AND short_url_unlock_attempts.locked_until > ?3
                                THEN short_url_unlock_attempts.locked_until
                            WHEN short_url_unlock_attempts.locked_until IS NOT NULL
                                AND short_url_unlock_attempts.locked_until <= ?3 THEN NULL
                            WHEN short_url_unlock_attempts.failed_attempts >= ?4 - 1 THEN ?5
                            ELSE NULL
                        END,
                        updated_at = ?3`
                )
                .bind(shortUrlId, clientFingerprint, now, maximumFailedAttempts, lockedUntil),
            database
                .prepare(
                    `SELECT failed_attempts, locked_until
                    FROM short_url_unlock_attempts
                    WHERE short_url_id = ?1 AND client_fingerprint = ?2
                    LIMIT 1`
                )
                .bind(shortUrlId, clientFingerprint),
        ]);

        row = readResult.results[0];
    } catch (error) {
        return unavailable(error);
    }

    if (!isValidRow(row)) {
        return { kind: 'unavailable', error: 'Invalid unlock-attempt result' };
    }

    if (row.locked_until !== null && row.locked_until > now) {
        return locked(row.locked_until, now);
    }

    return {
        kind: 'allowed',
        attemptsRemaining: Math.max(0, maximumFailedAttempts - row.failed_attempts),
        tracked: true,
    };
}

export async function clearShortUrlUnlockFailures(
    database: D1Database,
    shortUrlId: string,
    clientFingerprint: string
): Promise<void> {
    await database
        .prepare(
            `DELETE FROM short_url_unlock_attempts
            WHERE short_url_id = ?1 AND client_fingerprint = ?2`
        )
        .bind(shortUrlId, clientFingerprint)
        .run();
}

function isValidRow(row: unknown): row is UnlockAttemptRow {
    if (!row || typeof row !== 'object' || !('failed_attempts' in row) || !('locked_until' in row)) {
        return false;
    }

    const failedAttempts = row.failed_attempts;
    const lockedUntil = row.locked_until;
    return (
        typeof failedAttempts === 'number' &&
        Number.isInteger(failedAttempts) &&
        failedAttempts >= 1 &&
        failedAttempts <= maximumFailedAttempts &&
        (lockedUntil === null ||
            (typeof lockedUntil === 'number' && Number.isSafeInteger(lockedUntil) && lockedUntil >= 0))
    );
}

function locked(lockedUntil: number, now: number): ShortUrlRateLimitResult {
    return {
        kind: 'locked',
        retryAfterSeconds: Math.max(1, Math.ceil((lockedUntil - now) / 1000)),
    };
}

function unavailable(error: unknown): ShortUrlRateLimitResult {
    return {
        kind: 'unavailable',
        error: error instanceof Error ? error.message : String(error),
    };
}

function importFingerprintKey(pepper: string): Promise<CryptoKey> {
    const pepperBytes = textEncoder.encode(pepper);
    if (pepperBytes.byteLength < 32) {
        throw new Error('SHORT_URL_PEPPER must contain at least 32 bytes');
    }

    return crypto.subtle.importKey('raw', pepperBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

function encodeBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
