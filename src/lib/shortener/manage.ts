import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { Database } from "../db";
import { normalizeShortUrlDestination } from "./destination";
import { normalizeShortUrlSlug } from "./store";
import { deriveShortUrlHandoffSecret } from "./handoff";
export type ProtectionKind = "key" | "password" | "pin";
export function createVerifier(kind: ProtectionKind, secret: string, pepper: string) {
    if (Buffer.byteLength(pepper) < 32)
        throw new Error("SHORT_URL_PEPPER must contain at least 32 bytes.");
    if (
        kind === "pin" ?
                !/^[0-9]{4,8}$/.test(secret) :
            kind === "password" ?
                secret.length < 8 || secret.length > 128 :
                    !/^[A-Za-z0-9_-]{22}$/.test(secret)
    )
        throw new Error("Invalid protection secret.");
    const salt = randomBytes(16).toString("base64url");
    const signature = createHmac("sha256", pepper)
        .update(`${kind}.${salt}.${secret}`)
        .digest("base64url");
    return `hmac-sha256:${kind}${kind === "pin" ? `:${secret.length}` : ""}:${salt}:${signature}`;
}

export async function addShortUrl(
    db: Database,
    options: {
        destination: string;
        slugs: string[];
        owner: string;
        expiresAt?: number | null;
        protection?: ProtectionKind;
        secret?: string;
        pepper?: string;
        now?: number;
    },
) {
    const destination = normalizeShortUrlDestination(options.destination);
    if (!destination) throw new Error("Invalid or blocked destination URL.");
    const slugs = [...new Set(options.slugs.map((slug) => normalizeShortUrlSlug(slug)))];
    if (!slugs.length || slugs.includes(null))
        throw new Error(
            "Use 1–64 letters, digits, underscores or hyphens; reserved slugs are unavailable.",
        );
    if (!options.owner || options.owner.length > 255)
        throw new Error("A link owner ID between 1 and 255 characters is required.");
    const now = options.now ?? Date.now();
    const expiresAt = options.expiresAt ?? null;
    if (expiresAt !== null && (!Number.isSafeInteger(expiresAt) || expiresAt <= now))
        throw new Error("Expiry must be a future ISO date.");
    const id = randomUUID();
    const secret =
        options.protection === "key" ? randomBytes(16).toString("base64url") : options.secret;
    const verifier =
        options.protection ?
                createVerifier(options.protection, secret ?? "", options.pepper ?? "") :
            null;
    const actualId = await db.withTransaction(async (tx) => {
        const rows = await tx.query(
            `INSERT INTO short_urls(id,destination_url,unlock_verifier,expires_at,owner_id,created_at,updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$6)
             ${verifier === null ? "ON CONFLICT (destination_url,owner_id,(COALESCE(expires_at,-1))) WHERE unlock_verifier IS NULL DO UPDATE SET updated_at = EXCLUDED.updated_at" : ""}
             RETURNING id`,
            [id, destination, verifier, expiresAt, options.owner, now],
        );
        const savedId = String(rows[0].id);
        await tx.query(
            "INSERT INTO short_url_slugs(slug,short_url_id) SELECT unnest($1::text[]), $2",
            [slugs, savedId],
        );
        return savedId;
    });
    return {
        id: actualId,
        slugs,
        accessKey: options.protection === "key" ? secret : undefined,
        handoffSecret:
            verifier ? await deriveShortUrlHandoffSecret(actualId, options.pepper!) : undefined,
    };
}
