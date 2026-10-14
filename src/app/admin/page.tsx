import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminSession } from "@/lib/admin/access";
import { isAuthConfigured } from "@/lib/auth";
import { AdminLogin } from "@/components/admin-login";
import { AdminDashboard } from "@/components/admin-dashboard";
import { listDirectoryEntries } from "@/lib/admin/directory";
import { listManagedShortLinks } from "@/lib/admin/short-links";
import { database } from "@/lib/db";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
    title: "Admin — tkkr.dev",
    robots: { index: false, follow: false },
};
export default async function AdminPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const session = await adminSession();
    const failed = Boolean((await searchParams).error);
    const data =
        session ?
                await Promise.all([listDirectoryEntries(), listManagedShortLinks(database())]) :
            null;
    return (
        <main className="admin-shell min-h-screen px-5 py-8 sm:px-10">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/"
                    className="inline-flex min-h-10 items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-3.5" /> Back to website
                </Link>
                {session && data ?
                        (
                            <AdminDashboard
                                directoryEntries={data[0]}
                                shortLinks={data[1]}
                                userName={session.user.name}
                            />
                        ) :
                        <AdminLogin configured={isAuthConfigured()} failed={failed} />}
            </div>
        </main>
    );
}
