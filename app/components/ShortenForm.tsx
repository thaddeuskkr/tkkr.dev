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
            const toUrls = (slugs: string[]) =>
                slugs.map((slug) => `${window.location.origin}/${slug}`);

            const urls = toUrls(state.slugs);
            const showSuccess = (autoCopied: boolean) => {
                const multiple = urls.length > 1;
                const description =
                    autoCopied ?
                        multiple ? "Copied first short URL to clipboard"
                        :   "Copied short URL to clipboard"
                    : multiple ?
                        "User interaction required for clipboard access. Click 'Copy All' to copy all URLs."
                    :   "User interaction required for clipboard access. Click 'Copy' to copy the URL.";

                const action =
                    multiple ?
                        {
                            label: "Copy All",
                            onClick: () => navigator.clipboard.writeText(urls.join("\n")),
                        }
                    :   {
                            label: "Copy",
                            onClick: () => navigator.clipboard.writeText(urls[0] || ""),
                        };

                toast.success("URL shortened successfully!", {
                    description,
                    ...(navigator?.clipboard && { action }),
                });
            };

            if (navigator?.clipboard && urls[0]) {
                navigator.clipboard
                    .writeText(urls[0])
                    .then(() => showSuccess(true))
                    .catch(() => showSuccess(false));
            } else {
                showSuccess(false);
            }
        } else if (!pending && state.issues.length > 0) {
            state.issues.forEach((iss: string) => toast.error(iss));
        }
    }, [pending, state]);

    const inputClass =
        "w-full text-neutral-700 placeholder-neutral-600 select-none focus:outline-none dark:text-neutral-300 dark:placeholder-neutral-400";

    const fields: Array<{
        name: string;
        placeholder: string;
        type?: string;
        required?: boolean;
        autoComplete?: string;
    }> = [
        {
            name: "url",
            placeholder: "enter long url",
            type: "url",
            required: true,
            autoComplete: "off",
        },
        {
            name: "slugs",
            placeholder: "enter slugs (comma-separated, optional)",
            type: "text",
            autoComplete: "off",
        },
        {
            name: "expiry",
            placeholder: "enter expiry (e.g. 5m, 10h, 1d, etc., optional)",
            type: "text",
            autoComplete: "off",
        },
        {
            name: "password",
            placeholder: "enter password (optional)",
            type: "text",
            autoComplete: "new-password",
        },
    ];
    return (
        <form className="flex flex-col gap-1.5" action={formAction}>
            {fields.map(({ name, placeholder, type = "text", required, autoComplete }) => (
                <input
                    key={name}
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    className={inputClass}
                    required={required}
                    autoComplete={autoComplete}
                />
            ))}
            <button
                type="submit"
                disabled={pending}
                className="max-w-fit cursor-pointer text-neutral-600 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
                {pending ? "shortening..." : "shorten"}
            </button>
        </form>
    );
}
