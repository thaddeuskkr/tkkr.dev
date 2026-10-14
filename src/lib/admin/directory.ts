import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { database, type Database } from "../db";
import {
    directoryGroups,
    type DirectoryEntry,
    type DirectoryGroup,
    type DirectoryIcon,
} from "../directory";

export type ManagedDirectoryEntry = DirectoryEntry & {
    id: string;
    groupId: "social" | "directory";
    sortOrder: number;
    enabled: boolean;
    updatedAt: number;
};
export type DirectoryEntryInput = {
    id?: string;
    version?: number;
    groupId: string;
    name: string;
    description: string;
    href: string;
    destination: string;
    iconKind: string;
    iconReference: string;
    iconFormat: string;
    iconThemed: boolean;
    restricted: boolean;
    keywords: string;
    sortOrder: number;
    enabled: boolean;
};
function text(value: unknown, label: string, limit: number, required = false) {
    if (typeof value !== "string" || value.trim().length > limit || (required && !value.trim()))
        throw new Error(`${label} is required and must be at most ${limit} characters.`);
    return value.trim();
}

function iconAsset(reference: string, format: string) {
    const file = `${reference}.${format}`;
    return existsSync(path.join(process.cwd(), "public", "icons", file)) ?
        `/icons/${file}` :
        `https://cdn.jsdelivr.net/gh/selfhst/icons@main/${format}/${file}`;
}

function validateDirectoryEntryInput(input: DirectoryEntryInput) {
    if (!input || typeof input !== "object") throw new Error("Invalid link fields.");
    if (input.groupId !== "social" && input.groupId !== "directory")
        throw new Error("Choose Social or Directory.");
    const href = text(input.href, "URL", 2048, true);
    let url: URL;
    try {
        url = new URL(href);
    } catch {
        throw new Error("Enter a complete URL.");
    }

    if (!["https:", "http:", "mailto:", "tel:"].includes(url.protocol))
        throw new Error("Use an HTTP, HTTPS, email, or telephone URL.");
    if (!Number.isSafeInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 10000)
        throw new Error("Order must be a whole number between 0 and 10000.");
    if (
        typeof input.enabled !== "boolean" ||
        typeof input.restricted !== "boolean" ||
        typeof input.iconThemed !== "boolean"
    )
        throw new Error("Invalid link options.");
    let icon: DirectoryIcon;
    if (["mail", "activity", "globe"].includes(input.iconKind)) {
        icon = {
            kind: "symbol",
            name: input.iconKind as "mail" | "activity" | "globe",
        };
    } else {
        if (
            input.iconKind !== "selfhst" ||
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.iconReference) ||
            input.iconReference.length > 100
        )
            throw new Error("Enter a selfh.st icon reference, such as dockhand.");
        if (!["svg", "webp", "png"].includes(input.iconFormat))
            throw new Error("Choose an icon format.");
        icon = {
            kind: "brand",
            src: iconAsset(
                `${input.iconReference}${input.iconThemed ? "-dark" : ""}`,
                input.iconFormat,
            ),
            ...(input.iconThemed ?
                    {
                        darkSrc: iconAsset(`${input.iconReference}-light`, input.iconFormat),
                    } :
                    { grayscale: true }),
        };
    }

    const keywords = text(input.keywords, "Keywords", 500)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    return {
        groupId: input.groupId,
        name: text(input.name, "Name", 100, true),
        description: text(input.description, "Description", 500),
        href: url.href,
        destination: text(input.destination, "Displayed address", 2048, true),
        icon,
        access: input.restricted ? "Restricted" : null,
        keywords,
        sortOrder: input.sortOrder,
        enabled: input.enabled,
    };
}

function fromRow(row: Record<string, unknown>): ManagedDirectoryEntry {
    // Translate stable database group IDs into the app's current terminology.
    return {
        id: String(row.id),
        groupId: row.group_id === "social" ? "social" : "directory",
        name: String(row.name),
        description: String(row.description),
        destination: String(row.destination),
        href: String(row.href),
        icon: row.icon as DirectoryIcon,
        ...(row.access ? { access: "Restricted" as const } : {}),
        keywords: row.keywords as string[],
        sortOrder: Number(row.sort_order),
        enabled: Boolean(row.enabled),
        updatedAt: Number(row.updated_at),
    };
}

export async function listDirectoryEntries(db: Database = database(), publicOnly = false) {
    return (
        await db.query(
            `SELECT * FROM profile_links ${publicOnly ? "WHERE enabled = TRUE" : ""} ORDER BY group_id, sort_order, id`,
        )
    ).map(fromRow);
}

export async function publicDirectoryGroups(): Promise<readonly DirectoryGroup[]> {
    const links = await listDirectoryEntries(database(), true);
    return directoryGroups.map((group) => ({
        ...group,
        links: links.filter((link) => link.groupId === group.id),
    }));
}

export async function saveDirectoryEntryRecord(db: Database, input: DirectoryEntryInput) {
    const link = validateDirectoryEntryInput(input);
    const values = [
        link.groupId === "directory" ? "links" : "social",
        link.name,
        link.description,
        link.destination,
        link.href,
        JSON.stringify(link.icon),
        link.access,
        link.keywords,
        link.sortOrder,
        link.enabled,
        Date.now(),
    ];
    if (input.id) {
        const rows = await db.query(
            `UPDATE profile_links SET group_id=$1,name=$2,description=$3,destination=$4,href=$5,icon=$6::jsonb,access=$7,keywords=$8,sort_order=$9,enabled=$10,updated_at=GREATEST($11,updated_at+1) WHERE id=$12 AND updated_at=$13 RETURNING id`,
            [...values, input.id, input.version],
        );
        if (!rows.length)
            throw new Error("This link changed or was deleted. Refresh and try again.");
    } else {
        await db.query(
            `INSERT INTO profile_links(group_id,name,description,destination,href,icon,access,keywords,sort_order,enabled,updated_at,id) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12)`,
            [...values, randomUUID()],
        );
    }
}

export async function deleteDirectoryEntryRecord(db: Database, id: string, version: number) {
    const rows = await db.query(
        "DELETE FROM profile_links WHERE id=$1 AND updated_at=$2 RETURNING id",
        [id, version],
    );
    if (!rows.length) throw new Error("This link changed or was deleted. Refresh and try again.");
}
