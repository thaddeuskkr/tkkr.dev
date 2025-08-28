import { redirect } from "next/navigation";
import { getUrlBySlug } from "@/lib/db";
import * as motion from "motion/react-client";

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
    if (!urlDoc)
        return (
            <main>
                <motion.div
                    className="pb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}>
                    <p className="font-medium">404 - not found</p>
                    <p>
                        sorry, the page you’re looking for doesn’t exist.
                        <br />
                        if you think this is a mistake, please{" "}
                        <a
                            href="mailto:hi@tkkr.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline transition-colors hover:text-purple-800 dark:hover:text-purple-300">
                            contact me
                        </a>
                        .
                    </p>
                </motion.div>
            </main>
        );
    redirect(urlDoc.url);
}
