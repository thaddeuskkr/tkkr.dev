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

    const isSignedIn = Boolean(session?.user);
    const label =
        pending ?
            isSignedIn ? "signing out..."
            :   "signing in..."
        : isSignedIn ? "sign out"
        : "sign in";

    const handleClick = async () => {
        try {
            setPending(true);
            if (isSignedIn) {
                await signOut();
            } else {
                await signIn("auth0");
            }
        } finally {
            setPending(false);
        }
    };

    return (
        <button
            className={className || defaultClassName}
            onClick={handleClick}
            type="button"
            disabled={pending}
            aria-busy={pending}>
            {label}
        </button>
    );
}
