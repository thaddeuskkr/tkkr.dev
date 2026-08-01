import { betterAuth } from 'better-auth';
import { genericOAuth } from 'better-auth/plugins';
import { tanstackStartCookies } from 'better-auth/tanstack-start';

const sessionLifetime = 7 * 24 * 60 * 60;

export const auth = betterAuth({
    appName: 'tkkr.dev',
    session: {
        expiresIn: sessionLifetime,
        updateAge: 24 * 60 * 60,
        cookieCache: {
            enabled: true,
            maxAge: sessionLifetime,
            strategy: 'jwe',
            refreshCache: true,
            version: '1',
        },
    },
    account: {
        storeStateStrategy: 'cookie',
        storeAccountCookie: true,
    },
    plugins: [
        genericOAuth({
            config: [
                {
                    providerId: 'tkid',
                    clientId: process.env.AUTH_CLIENT_ID!,
                    clientSecret: process.env.AUTH_CLIENT_SECRET!,
                    discoveryUrl: process.env.AUTH_DISCOVERY_URL!,
                    scopes: ['openid', 'profile', 'email'],
                    pkce: true,
                },
            ],
        }),
        tanstackStartCookies(),
    ],
    advanced: {
        ipAddress: {
            ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
        },
        trustedProxyHeaders: true,
    },
});

export type AuthSession = typeof auth.$Infer.Session;
