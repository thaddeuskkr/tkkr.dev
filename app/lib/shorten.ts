"use server";

import { z } from "zod";
import parse from "parse-duration";
import { auth } from "@/auth";
import { shortenUrl } from "@/lib/db";
import { userHasPermittedRoles } from "@/lib/roles";

const schema = z.object({
    url: z.preprocess(
        (val) => (typeof val === "string" ? val.trim() : val),
        z.url({ error: "Long URL is invalid" }),
    ),
    slugs: z.preprocess(
        (val) => {
            if (typeof val !== "string" || !val.trim().length) return [];
            return val.split(",").map((slug) => slug.trim());
        },
        z.array(
            z.string().regex(/^[A-Za-z0-9_-]+$/, {
                error: "Slugs can only contain URL-friendly symbols",
            }),
        ),
    ),
    expiry: z.preprocess(
        (val) => {
            if (typeof val !== "string" || !val.trim().length) return null;
            const parsed = parse(val.trim());
            if (parsed === null) {
                return "";
            }
            return parsed;
        },
        z.nullable(z.number({ error: "Invalid expiry" })),
    ),
    password: z.preprocess(
        (val) => {
            if (typeof val !== "string" || !val.trim().length) return null;
            return val.trim();
        },
        z.nullable(z.string({ error: "Invalid password" })),
    ),
});

export async function shorten(_: unknown, formData: FormData) {
    const session = await auth();
    if (!session) {
        return { success: false, issues: ["Unauthorized"], slugs: [] };
    }

    if (!userHasPermittedRoles(session)) {
        return { success: false, issues: ["Forbidden"], slugs: [] };
    }

    const validatedFields = schema.safeParse({
        url: formData.get("url"),
        slugs: formData.get("slugs"),
        expiry: formData.get("expiry"),
        password: formData.get("password"),
    });
    if (!validatedFields.success) {
        return {
            success: false,
            issues: validatedFields.error.issues.map((iss) => iss.message),
            slugs: [],
        };
    }
    const res = await shortenUrl({
        url: validatedFields.data.url,
        slugs: validatedFields.data.slugs || [],
        expiry: validatedFields.data.expiry || null,
        createdBy: session.user.email || session.user.sub || session.user.id || "unknown",
        password: validatedFields.data.password || null,
    });
    if (!res.success) {
        return {
            success: false,
            issues: res.error ? [res.error] : [],
            slugs: [],
        };
    }
    return {
        success: true,
        issues: [],
        slugs:
            res.data?.slugs.map(
                (slug) => `${slug}${res.data.password ? `?${validatedFields.data.password}` : ""}`,
            ) || [],
    };
}
