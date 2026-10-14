import { betterAuth, type BetterAuthOptions } from "better-auth";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { nextCookies } from "better-auth/next-js";
import { databasePool } from "./db";
import { authBaseURL } from "./auth-base-url";

export function isAuthConfigured() {
    return ["BETTER_AUTH_SECRET", "AUTH_CLIENT_ID", "AUTH_CLIENT_SECRET"].every(
        (key) => Boolean(process.env[key]?.trim()),
    );
}

function authOptions() {
    return {
        appName: "tkkr.dev Admin",
        database: databasePool(),
        baseURL: authBaseURL(),
        secret: process.env.BETTER_AUTH_SECRET,
        user: {
            modelName: "admin_users",
            validateUserInfo: ({ source }) => {
                if (source.oauth?.providerId !== "tkid" || !source.oauth.profile?.sub) {
                    return {
                        error: "access_denied",
                        errorDescription: "This dashboard is private.",
                    };
                }
            },
        },
        session: {
            modelName: "admin_sessions",
            expiresIn: 60 * 60 * 8,
            updateAge: 60 * 60,
            cookieCache: { enabled: false },
        },
        account: {
            modelName: "admin_accounts",
            accountLinking: { enabled: false },
            encryptOAuthTokens: true,
        },
        verification: { modelName: "admin_verifications" },
        rateLimit: {
            enabled: true,
            storage: "database",
            modelName: "admin_rate_limits",
            window: 60,
            max: 30,
        },
        plugins: [
            genericOAuth({
                config: [
                    {
                        providerId: "tkid",
                        name: "tkID",
                        discoveryUrl: `${process.env.TKID_ISSUER_URL ?? "https://id.tkkr.dev"}/.well-known/openid-configuration`,
                        clientId: process.env.AUTH_CLIENT_ID ?? "",
                        clientSecret: process.env.AUTH_CLIENT_SECRET,
                        scopes: ["openid", "profile", "email"],
                        pkce: true,
                        requireIdTokenVerification: true,
                        disableProviderLogout: true,
                    },
                ],
            }),
            nextCookies(),
        ],
    } satisfies BetterAuthOptions;
}

let instance: ReturnType<typeof betterAuth<ReturnType<typeof authOptions>>> | undefined;
export function getAuth() {
    if (!isAuthConfigured()) return null;
    instance ??= betterAuth(authOptions());
    return instance;
}
