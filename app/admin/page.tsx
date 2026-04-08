import { AuthButton } from "@/components/AuthButton";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { ShortenForm } from "@/components/ShortenForm";
import { auth } from "@/auth";
import { getAnnouncement } from "@/lib/db";
import * as motion from "motion/react-client";
import { headers } from "next/headers";

export default async function Admin() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const announcement = session?.user ? await getAnnouncement() : null;

    return (
        <main>
            <motion.div
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">authentication</span>
                    {session?.user ?
                        <p>
                            you’re signed in as {session.user.name} ({session.user.email}).
                        </p>
                    :   <p>you’re not currently signed in.</p>}
                    <AuthButton session={session} />
                </div>
                {session?.user && (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1">
                            <span className="font-bold">link shortener</span>
                            <ShortenForm />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="font-bold">site announcement</span>
                            <AnnouncementForm initialAnnouncement={announcement} />
                        </div>
                    </div>
                )}
            </motion.div>
        </main>
    );
}
