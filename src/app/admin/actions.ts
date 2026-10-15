"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, AdminAccessError } from "@/lib/admin/access";
import { database } from "@/lib/db";
import {
    saveDirectoryEntryRecord,
    deleteDirectoryEntryRecord,
    type DirectoryEntryInput,
} from "@/lib/admin/directory";
import {
    saveManagedShortLink,
    deleteManagedShortLink,
    type ShortLinkInput,
} from "@/lib/admin/short-links";

async function perform<T>(work: (userId: string) => Promise<T>, refreshHomepage = false) {
    try {
        const session = await requireAdmin();
        const data = await work(session.user.id);
        revalidatePath("/admin");
        if (refreshHomepage) revalidatePath("/");
        return { ok: true as const, data };
    } catch (error) {
        const code = (error as { code?: string })?.code;
        const message =
            error instanceof AdminAccessError ?
                error.message :
                code === "23505" ?
                    "That alias or link already exists. Choose another." :
                    code ?
                        "The change could not be saved. Please try again." :
                        error instanceof Error ?
                            error.message :
                            "The change could not be saved.";
        return { ok: false as const, error: message };
    }
}

export async function saveDirectoryEntry(input: DirectoryEntryInput) {
    return perform(() => saveDirectoryEntryRecord(database(), input), true);
}

export async function deleteDirectoryEntry(id: string, version: number) {
    return perform(() => deleteDirectoryEntryRecord(database(), id, version), true);
}

export async function saveShortLink(input: ShortLinkInput) {
    return perform((userId) =>
        saveManagedShortLink(database(), input, userId, process.env.SHORT_URL_PEPPER ?? ""),
    );
}

export async function deleteShortLink(id: string, version: number) {
    return perform(() => deleteManagedShortLink(database(), id, version));
}
