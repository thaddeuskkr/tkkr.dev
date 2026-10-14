import type { BetterAuthOptions } from "better-auth";

export function authBaseURL(env: NodeJS.ProcessEnv = process.env) {
    const fallback = env.BETTER_AUTH_URL?.trim() || "https://tkkr.dev";
    const deploymentHosts = [
        env.VERCEL_URL,
        env.VERCEL_BRANCH_URL,
        env.VERCEL_PROJECT_PRODUCTION_URL,
    ].flatMap((host) => host?.trim() ? [host.trim()] : []);

    return {
        allowedHosts: [
            ...new Set([
                "tkkr.dev",
                "tkkr.vercel.app",
                new URL(fallback).host,
                ...deploymentHosts,
                ...(env.NODE_ENV === "development" ? ["localhost:*", "127.0.0.1:*"] : []),
            ]),
        ],
        protocol: env.NODE_ENV === "production" ? "https" : "auto",
        fallback,
    } satisfies BetterAuthOptions["baseURL"];
}
