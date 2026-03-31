import { checkConnection } from "@/lib/db";

export async function GET() {
    const databaseStatus = await checkConnection();
    if (!databaseStatus.connected) {
        return new Response(
            JSON.stringify({
                message: "database error",
                error: databaseStatus.error,
            }),
            { status: 500 },
        );
    }
    return new Response(
        JSON.stringify({
            message: "ok",
            error: null,
        }),
        { status: 200 },
    );
}
