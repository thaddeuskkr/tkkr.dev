"use client";

import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

export function AuthButton({
    session,
    className,
}: {
    session: { user?: unknown } | null;
    className?: string;
}) {
    const [pending, setPending] = useState(false);
    const defaultClassName =
        "max-w-fit cursor-pointer text-neutral-600 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200";

    if (session?.user) {
        return (
            <button
                className={className || defaultClassName}
                onClick={() => {
                    setPending(true);
                    signOut();
                }}
                type="button"
                disabled={pending}>
                sign out
            </button>
        );
    }

    return (
        <button
            className={className || defaultClassName}
            onClick={() => {
                setPending(true);
                signIn("auth0");
            }}
            type="button"
            disabled={pending}>
            sign in
        </button>
    );
}
