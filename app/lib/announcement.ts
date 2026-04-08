"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { ANNOUNCEMENT_CACHE_TAG, deleteAnnouncement, saveAnnouncement } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";

export type AnnouncementActionState = {
    success: boolean;
    issues: string[];
    result: "idle" | "created" | "updated" | "deleted";
};

const emptyState: AnnouncementActionState = {
    success: false,
    issues: [],
    result: "idle",
};

const announcementSchema = z.object({
    message: z.preprocess(
        (value) => (typeof value === "string" ? value.trim() : value),
        z
            .string({ error: "Announcement is required" })
            .min(1, { error: "Announcement cannot be empty" })
            .max(200, { error: "Announcement must be 200 characters or fewer" }),
    ),
    category: z.preprocess(
        (value) => {
            if (typeof value !== "string") return value;
            const trimmed = value.trim().toLowerCase();
            return trimmed || "announcement";
        },
        z
            .string({ error: "Category is required" })
            .min(1, { error: "Category cannot be empty" })
            .max(24, { error: "Category must be 24 characters or fewer" }),
    ),
});

async function getAuthorizedSession() {
    return auth.api.getSession({
        headers: await headers(),
    });
}

export async function saveAnnouncementAction(
    _: AnnouncementActionState,
    formData: FormData,
): Promise<AnnouncementActionState> {
    const session = await getAuthorizedSession();
    if (!session?.user) {
        return {
            ...emptyState,
            issues: ["Unauthorized"],
        };
    }

    const validatedFields = announcementSchema.safeParse({
        message: formData.get("message"),
        category: formData.get("category"),
    });
    if (!validatedFields.success) {
        return {
            ...emptyState,
            issues: validatedFields.error.issues.map((issue) => issue.message),
        };
    }

    const result = await saveAnnouncement({
        message: validatedFields.data.message,
        category: validatedFields.data.category,
        updatedBy: session.user.email || session.user.id || "unknown",
    });
    if (!result.success) {
        return {
            ...emptyState,
            issues: result.error ? [result.error] : ["Unable to save announcement"],
        };
    }

    revalidateTag(ANNOUNCEMENT_CACHE_TAG, "max");

    return {
        success: true,
        issues: [],
        result: result.created ? "created" : "updated",
    };
}

export async function deleteAnnouncementAction(
    _: AnnouncementActionState,
): Promise<AnnouncementActionState> {
    const session = await getAuthorizedSession();
    if (!session?.user) {
        return {
            ...emptyState,
            issues: ["Unauthorized"],
        };
    }

    const result = await deleteAnnouncement();
    if (!result.success) {
        return {
            ...emptyState,
            issues: result.error ? [result.error] : ["Unable to delete announcement"],
        };
    }

    revalidateTag(ANNOUNCEMENT_CACHE_TAG, "max");

    return {
        success: true,
        issues: [],
        result: "deleted",
    };
}
