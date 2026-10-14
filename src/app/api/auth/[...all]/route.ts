import { getAuth } from "@/lib/auth";
export const runtime = "nodejs";
async function handle(request: Request) {
    const auth = getAuth();
    if (!auth)
        return Response.json({ error: "tkID sign-in is not configured yet." }, { status: 503 });
    return auth.handler(request);
}

export const GET = handle;
export const POST = handle;
