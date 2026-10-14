import { createHmac } from "node:crypto";
import type { Database } from "../db";
const maximumAttempts = 10;
const lockDuration = 30 * 60 * 1000;
export function clientFingerprint(id: string, headers: Headers, pepper: string) {
    // Only trust an IP header if your reverse proxy overwrites it on every request.
    const trustedHeader =
        process.env.SHORT_URL_TRUSTED_IP_HEADER ??
        (process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : undefined);
    const client = trustedHeader ? (headers.get(trustedHeader) ?? "shared") : "shared";
    return createHmac("sha256", pepper).update(`ratelimit:${id}:${client}`).digest("base64url");
}

export async function reserveUnlockAttempt(
    db: Database,
    id: string,
    fingerprint: string,
    now = Date.now(),
) {
    const rows = await db.query<{
        failed_attempts: number;
        locked_until: number | null;
    }>(
        `
    INSERT INTO short_url_unlock_attempts(short_url_id,client_fingerprint,failed_attempts,locked_until,updated_at)
    VALUES ($1,$2,1,NULL,$3)
    ON CONFLICT (short_url_id,client_fingerprint) DO UPDATE SET
      failed_attempts = CASE WHEN short_url_unlock_attempts.locked_until <= $3 THEN 1 ELSE short_url_unlock_attempts.failed_attempts + 1 END,
      locked_until = CASE WHEN short_url_unlock_attempts.locked_until <= $3 THEN NULL
        WHEN short_url_unlock_attempts.failed_attempts >= 9 THEN $4::bigint ELSE NULL END,
      updated_at = $3
    WHERE short_url_unlock_attempts.locked_until IS NULL OR short_url_unlock_attempts.locked_until <= $3
    RETURNING failed_attempts, locked_until::float8 AS locked_until`,
        [id, fingerprint, now, now + lockDuration],
    );
    if (rows[0])
        return {
            allowed: true as const,
            remaining: maximumAttempts - rows[0].failed_attempts,
            retryAfter: rows[0].locked_until ? Math.ceil((rows[0].locked_until - now) / 1000) : 0,
        };
    const locked = await db.query(
        "SELECT locked_until::float8 AS until FROM short_url_unlock_attempts WHERE short_url_id=$1 AND client_fingerprint=$2",
        [id, fingerprint],
    );
    return {
        allowed: false as const,
        remaining: 0,
        retryAfter: Math.max(
            1,
            Math.ceil((Number(locked[0]?.until ?? now + lockDuration) - now) / 1000),
        ),
    };
}

export async function clearUnlockAttempts(db: Database, id: string, fingerprint: string) {
    await db.query(
        "DELETE FROM short_url_unlock_attempts WHERE short_url_id=$1 AND client_fingerprint=$2",
        [id, fingerprint],
    );
}
