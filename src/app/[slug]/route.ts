import { handleShortUrl } from "@/lib/shortener/handler";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string }> };
export async function GET(request: Request, context: Context) {
    return handleShortUrl(request, (await context.params).slug);
}

export async function POST(request: Request, context: Context) {
    return handleShortUrl(request, (await context.params).slug);
}

export async function HEAD(request: Request, context: Context) {
    const response = await GET(request, context);
    return new Response(null, {
        status: response.status,
        headers: response.headers,
    });
}
