"use client";

import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
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
        "max-w-fit cursor-pointer text-body-muted transition-colors hover:text-body-tertiary";

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
                await authClient.signOut();
                redirect(window.location.pathname);
            } else {
                await authClient.signIn.oauth2({
                    providerId: "tkkr",
                    scopes: ["openid", "profile", "email"],
                    callbackURL: window.location.href,
                });
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

