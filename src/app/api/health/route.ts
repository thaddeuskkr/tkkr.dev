export function GET() {
    return Response.json(
        { message: "ok", error: null },
        {
            headers: {
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            },
        },
    );
}
