import { notFound, permanentRedirect } from "next/navigation";
import { getUrlBySlug } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Slug({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string }>;
}) {
    const { slug } = await params;
    const urlDoc = await getUrlBySlug(slug, Object.keys(await searchParams)[0]);
    if (!urlDoc) notFound();
    permanentRedirect(urlDoc.url);
}
