import { auth } from "@/auth";
import { AuthButton } from "@/components/AuthButton";
import ShortenForm from "@/components/ShortenForm";
import * as motion from "motion/react-client";

export default async function Shorten() {
    const session = await auth();

    const permittedRoles =
        process.env.AUTH_ALLOWED_ROLES?.split(",").map((role) => role.trim()) || [];

    const hasPermission =
        session?.user?.roles?.some((role: string) => permittedRoles.includes(role)) || false;

    return (
        <main>
            <motion.div
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">link shortener</span>
                    {permittedRoles.length > 0 && hasPermission ?
                        <ShortenForm />
                    :   <p>this service is private, and requires an authorised user account.</p>}
                </div>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">authentication</span>
                    {session?.user ?
                        <p>you’re signed in as {session.user.email}.</p>
                    :   <p>you’re not currently signed in.</p>}
                    <AuthButton session={session} />
                </div>
            </motion.div>
        </main>
    );
}
