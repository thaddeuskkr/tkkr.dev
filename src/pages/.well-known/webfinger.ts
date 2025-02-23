export async function GET() {
    return new Response(
        JSON.stringify({
            links: [
                {
                    rel: "http://openid.net/specs/connect/1.0/issuer",
                    href: "https://auth.tkkr.dev",
                },
            ],
        }),
        { headers: { "Content-Type": "application/json" } },
    );
}
