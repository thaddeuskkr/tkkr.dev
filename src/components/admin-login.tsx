"use client";
import { useState } from "react";
import { ArrowUpRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
export function AdminLogin({ configured, failed }: { configured: boolean; failed: boolean }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(
        failed ? "Sign-in did not complete. Use your authorized tkID account and try again." : "",
    );
    async function signIn() {
        setPending(true);
        setError("");
        try {
            const result = await authClient.signIn.social({
                provider: "tkid",
                callbackURL: "/admin",
                errorCallbackURL: "/admin?error=signin",
            });
            if (result.error) {
                setError("Unable to start tkID sign-in. Please try again.");
                setPending(false);
            }
        } catch {
            setError("Unable to reach tkID. Please try again.");
            setPending(false);
        }
    }

    return (
        <div className="mx-auto max-w-sm py-24">
            <ShieldCheck className="mb-6 size-7 text-muted-foreground" />
            <h1 className="text-2xl font-medium tracking-tight">Admin</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Sign in with your tkID account to continue.
            </p>
            {configured ?
                    (
                        <Button onClick={signIn} disabled={pending} className="mt-7 h-11 w-full">
                            {pending ?
                                    <Loader2 className="animate-spin" /> :
                                    <ArrowUpRight />}{" "}
                            Continue with tkID
                        </Button>
                    ) :
                    (
                        <p
                            role="status"
                            className="mt-7 rounded-xl border border-border p-4 text-sm leading-6 text-muted-foreground">
                            tkID sign-in is awaiting configuration. The dashboard stays private until your
                            client credentials are set.
                        </p>
                    )}
            {error && (
                <p role="alert" className="mt-4 text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
