"use client";

import { toast } from "sonner";
import { shorten } from "@/lib/shorten";
import { useActionState, useEffect } from "react";

export default function ShortenForm() {
    const [state, formAction, pending] = useActionState(shorten, {
        success: false,
        issues: [] as string[],
        slugs: [] as string[],
    });

    useEffect(() => {
        if (!pending && state.success) {
            toast.success("URL shortened successfully!", {
                action: {
                    label: "Copy short URLs",
                    onClick: () =>
                        navigator.clipboard.writeText(
                            state.slugs
                                .map((slug) => `${window.location.origin}/${slug}`)
                                .join(", ") || "",
                        ),
                },
            });
        } else if (!pending && state.issues.length > 0) {
            state.issues.forEach((iss: string) => toast.error(iss));
        }
    }, [pending, state]);

    const inputClass =
        "w-full text-neutral-700 placeholder-neutral-600 select-none focus:outline-none dark:text-neutral-300 dark:placeholder-neutral-400";
    return (
        <form className="flex flex-col gap-1.5" action={formAction}>
            <input
                type="text"
                name="url"
                placeholder="enter long url"
                className={inputClass}
                required
            />
            <input
                type="text"
                name="slugs"
                placeholder="enter slugs (comma-separated, optional)"
                className={inputClass}
            />
            <input
                type="text"
                name="expiry"
                placeholder="enter expiry (e.g. 5m, 10h, 1d, etc., optional)"
                className={inputClass}
            />
            <input
                type="text"
                name="password"
                placeholder="enter password (optional)"
                className={inputClass}
            />
            <button
                type="submit"
                disabled={pending}
                className="max-w-fit cursor-pointer text-neutral-600 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
                shorten
            </button>
        </form>
    );
}
