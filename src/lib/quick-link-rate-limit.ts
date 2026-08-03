const maximumFailedAttempts = 10;
const lockDurationMilliseconds = 30 * 60 * 1000;
const textEncoder = new TextEncoder();

type UnlockAttemptRow = {
    failed_attempts: number;
    locked_until: number | null;
};

export type QuickLinkRateLimitResult =
    | { kind: 'allowed'; attemptsRemaining: number; tracked: boolean }
    | { kind: 'locked'; retryAfterSeconds: number }
    | { kind: 'unavailable'; error: string };

export async function fingerprintQuickLinkClient(
    quickLinkId: string,
    clientIp: string,
    pepper: string
): Promise<string> {
    const key = await importFingerprintKey(pepper);
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        textEncoder.encode(`quick-link-rate-limit:v1:${quickLinkId}:${clientIp}`)
    );

    return encodeBase64Url(new Uint8Array(signature));
}

export async function checkQuickLinkRateLimit(
    database: D1Database,
    quickLinkId: string,
    clientFingerprint: string,
    now = Date.now()
): Promise<QuickLinkRateLimitResult> {
    let row: UnlockAttemptRow | null;

    try {
        row = await database
            .prepare(
                `SELECT failed_attempts, locked_until
                FROM quick_link_unlock_attempts
                WHERE quick_link_id = ?1 AND client_fingerprint = ?2
                LIMIT 1`
            )
            .bind(quickLinkId, clientFingerprint)
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

export async function recordQuickLinkUnlockFailure(
    database: D1Database,
    quickLinkId: string,
    clientFingerprint: string,
    now = Date.now()
): Promise<QuickLinkRateLimitResult> {
    const lockedUntil = now + lockDurationMilliseconds;
    let row: unknown;

    try {
        const [, readResult] = await database.batch<UnlockAttemptRow>([
            database
                .prepare(
                    `INSERT INTO quick_link_unlock_attempts (
                        quick_link_id,
                        client_fingerprint,
                        failed_attempts,
                        locked_until,
                        updated_at
                    ) VALUES (?1, ?2, 1, NULL, ?3)
                    ON CONFLICT (quick_link_id, client_fingerprint) DO UPDATE SET
                        failed_attempts = CASE
                            WHEN quick_link_unlock_attempts.locked_until IS NOT NULL
                                AND quick_link_unlock_attempts.locked_until <= ?3 THEN 1
                            WHEN quick_link_unlock_attempts.failed_attempts >= ?4 THEN ?4
                            ELSE quick_link_unlock_attempts.failed_attempts + 1
                        END,
                        locked_until = CASE
                            WHEN quick_link_unlock_attempts.locked_until IS NOT NULL
                                AND quick_link_unlock_attempts.locked_until > ?3
                                THEN quick_link_unlock_attempts.locked_until
                            WHEN quick_link_unlock_attempts.locked_until IS NOT NULL
                                AND quick_link_unlock_attempts.locked_until <= ?3 THEN NULL
                            WHEN quick_link_unlock_attempts.failed_attempts >= ?4 - 1 THEN ?5
                            ELSE NULL
                        END,
                        updated_at = ?3`
                )
                .bind(quickLinkId, clientFingerprint, now, maximumFailedAttempts, lockedUntil),
            database
                .prepare(
                    `SELECT failed_attempts, locked_until
                    FROM quick_link_unlock_attempts
                    WHERE quick_link_id = ?1 AND client_fingerprint = ?2
                    LIMIT 1`
                )
                .bind(quickLinkId, clientFingerprint),
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

export async function clearQuickLinkUnlockFailures(
    database: D1Database,
    quickLinkId: string,
    clientFingerprint: string
): Promise<void> {
    await database
        .prepare(
            `DELETE FROM quick_link_unlock_attempts
            WHERE quick_link_id = ?1 AND client_fingerprint = ?2`
        )
        .bind(quickLinkId, clientFingerprint)
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

function locked(lockedUntil: number, now: number): QuickLinkRateLimitResult {
    return {
        kind: 'locked',
        retryAfterSeconds: Math.max(1, Math.ceil((lockedUntil - now) / 1000)),
    };
}

function unavailable(error: unknown): QuickLinkRateLimitResult {
    return {
        kind: 'unavailable',
        error: error instanceof Error ? error.message : String(error),
    };
}

function importFingerprintKey(pepper: string): Promise<CryptoKey> {
    const pepperBytes = textEncoder.encode(pepper);
    if (pepperBytes.byteLength < 32) {
        throw new Error('SHORT_LINK_PEPPER must contain at least 32 bytes');
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
