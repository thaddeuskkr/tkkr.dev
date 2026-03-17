import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        {
            id: "tkkr",
            name: "tkkr.dev",
            type: "oidc",
            issuer: process.env.AUTH_ISSUER,
            clientId: process.env.AUTH_CLIENT_ID,
            clientSecret: process.env.AUTH_CLIENT_SECRET,
            authorization: { params: { scope: "openid email profile" } },
            checks: ["pkce", "state"],
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
            },
        },
    ],
});
