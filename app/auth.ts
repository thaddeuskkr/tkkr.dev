import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import Auth0 from "next-auth/providers/auth0";
import { Auth0UserProfile } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Auth0({
            profile(profile) {
                return { ...profile };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    jwt: {
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        // @ts-expect-error this works.
        jwt({ token, user }: { token: JWT; user: Auth0UserProfile | undefined }) {
            if (user) {
                token.sub = user.sub;
                token.nickname = typeof user.nickname === "string" ? user.nickname : undefined;
                token.picture = typeof user.picture === "string" ? user.picture : undefined;
                token.roles = Array.isArray(user["/roles"]) ? user["/roles"] : [];
            }
            return token;
        },
        session({ session, token }) {
            if (token.sub) session.user.sub = token.sub;
            if (token.nickname) session.user.nickname = token.nickname;
            session.user.roles = Array.isArray(token.roles) ? token.roles : [];
            return session;
        },
    },
});
