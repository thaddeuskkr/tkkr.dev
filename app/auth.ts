import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

export const auth = betterAuth({
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 7 * 24 * 60 * 60,
            strategy: "jwe",
            refreshCache: true,
        },
    },
    account: {
        storeStateStrategy: "cookie",
        storeAccountCookie: true,
    },
    plugins: [
        genericOAuth({
            config: [
                {
                    providerId: "tkkr",
                    clientId: process.env.AUTH_CLIENT_ID as string,
                    clientSecret: process.env.AUTH_CLIENT_SECRET as string,
                    discoveryUrl: process.env.AUTH_DISCOVERY_URL as string,
                    pkce: true,
                },
            ],
        }),
    ],
    advanced: {
        ipAddress: {
            ipAddressHeaders: ["x-forwarded-for"],
        },
        trustedProxyHeaders: true,
    },
});
