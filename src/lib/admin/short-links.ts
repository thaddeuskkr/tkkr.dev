import { randomBytes } from "node:crypto";
import type { Database } from "../db";
import { addShortUrl, createVerifier, type ProtectionKind } from "../shortener/manage";
import { normalizeShortUrlSlug } from "../shortener/store";
import { normalizeShortUrlDestination } from "../shortener/destination";
import { deriveShortUrlHandoffSecret } from "../shortener/handoff";

export type ManagedShortLink = {
    expired: boolean;
    id: string;
    destination: string;
    slugs: string[];
    protection: string;
    expiresAt: number | null;
    createdAt: number;
    updatedAt: number;
};
export type ShortLinkInput = {
    id?: string;
    version?: number;
    destination: string;
    slugs: string;
    expiresAt: string;
    protection: string;
    secret: string;
};
export async function listManagedShortLinks(db: Database): Promise<ManagedShortLink[]> {
    const rows =
        await db.query(`SELECT u.id,u.destination_url,u.expires_at,u.created_at,u.updated_at,
        CASE WHEN u.unlock_verifier IS NULL THEN 'public' ELSE split_part(u.unlock_verifier,':',2) END AS protection,
        COALESCE(array_agg(s.slug ORDER BY s.slug) FILTER (WHERE s.slug IS NOT NULL),'{}') AS slugs,
        (u.expires_at IS NOT NULL AND u.expires_at <= EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)*1000) AS expired
        FROM short_urls u LEFT JOIN short_url_slugs s ON s.short_url_id=u.id GROUP BY u.id ORDER BY u.created_at DESC`);
    return rows.map((row) => ({
        expired: Boolean(row.expired),
        id: String(row.id),
        destination: String(row.destination_url),
        slugs: row.slugs as string[],
        protection: String(row.protection),
        expiresAt: row.expires_at === null ? null : Number(row.expires_at),
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
    }));
}

function validateShortLinkInput(input: ShortLinkInput) {
    if (
        !input ||
        typeof input !== "object" ||
        typeof input.slugs !== "string" ||
        input.slugs.length > 5000 ||
        typeof input.expiresAt !== "string" ||
        typeof input.secret !== "string"
    ) {
        throw new Error("Invalid short URL fields.");
    }

    const destination = normalizeShortUrlDestination(input.destination);
    if (!destination) throw new Error("Enter a valid destination URL.");
    const slugs = [
        ...new Set(
            input.slugs
                .split(/[\s,]+/)
                .filter(Boolean)
                .map(normalizeShortUrlSlug),
        ),
    ];
    if (!slugs.length || slugs.length > 64 || slugs.includes(null))
        throw new Error(
            "Use 1–64 aliases, each with 1–64 letters, digits, underscores or hyphens. Reserved names cannot be used.",
        );
    if (!["keep", "public", "pin", "password", "key"].includes(input.protection))
        throw new Error("Choose a protection setting.");
    const expiresAt = input.expiresAt ? Date.parse(input.expiresAt) : null;
    if (expiresAt !== null && !Number.isSafeInteger(expiresAt))
        throw new Error("Enter a valid expiry date.");
    return { destination, slugs: slugs as string[], expiresAt };
}

export async function saveManagedShortLink(
    db: Database,
    input: ShortLinkInput,
    owner: string,
    pepper: string,
) {
    const { destination, slugs, expiresAt } = validateShortLinkInput(input);
    if (!input.id) {
        if (input.protection === "keep")
            throw new Error("Choose a protection setting for this new URL.");
        return addShortUrl(db, {
            destination,
            slugs,
            expiresAt,
            owner,
            pepper,
            ...(input.protection !== "public" ?
                    {
                        protection: input.protection as ProtectionKind,
                        secret: input.secret,
                    } :
                    {}),
        });
    }

    const id = input.id;
    return db.withTransaction(async (tx) => {
        const rows = await tx.query("SELECT * FROM short_urls WHERE id=$1 FOR UPDATE", [input.id]);
        const current = rows[0];
        if (!current || Number(current.updated_at) !== input.version)
            throw new Error("This short URL changed or was deleted. Refresh and try again.");
        if (
            expiresAt !== null &&
            expiresAt <= Date.now() &&
            (current.expires_at === null || expiresAt !== Number(current.expires_at))
        )
            throw new Error("Choose a future expiry date, or clear it for no expiry.");
        const now = Math.max(Date.now(), Number(current.updated_at) + 1);
        let accessKey: string | undefined;
        let verifier = current.unlock_verifier;
        if (input.protection !== "keep") {
            accessKey =
                input.protection === "key" ? randomBytes(16).toString("base64url") : undefined;
            verifier =
                input.protection === "public" ?
                    null :
                        createVerifier(
                            input.protection as ProtectionKind,
                            accessKey ?? input.secret,
                            pepper,
                        );
        }

        await tx.query(
            "UPDATE short_urls SET destination_url=$1,expires_at=$2,unlock_verifier=$3,updated_at=$4 WHERE id=$5",
            [destination, expiresAt, verifier, now, input.id],
        );
        await tx.query(
            "DELETE FROM short_url_slugs WHERE short_url_id=$1 AND NOT(slug=ANY($2::text[]))",
            [input.id, slugs],
        );
        await tx.query(
            `INSERT INTO short_url_slugs(slug,short_url_id) SELECT alias,$1 FROM unnest($2::text[]) alias
            WHERE NOT EXISTS(SELECT 1 FROM short_url_slugs WHERE slug=alias AND short_url_id=$1)`,
            [input.id, slugs],
        );
        if (input.protection !== "keep")
            await tx.query("DELETE FROM short_url_unlock_attempts WHERE short_url_id=$1", [
                input.id,
            ]);
        return {
            id,
            slugs,
            accessKey,
            handoffSecret:
                verifier && input.protection !== "keep" ?
                        await deriveShortUrlHandoffSecret(id, pepper) :
                    undefined,
        };
    });
}

export async function deleteManagedShortLink(db: Database, id: string, version: number) {
    const rows = await db.query(
        "DELETE FROM short_urls WHERE id=$1 AND updated_at=$2 RETURNING id",
        [id, version],
    );
    if (!rows.length)
        throw new Error("This short URL changed or was deleted. Refresh and try again.");
}
