import { headers } from "next/headers";
import { getAuth } from "../auth";
import { database } from "../db";

export class AdminAccessError extends Error {
    constructor() {
        super("Sign in with your authorized tkID account to continue.");
    }
}
export async function adminSession() {
    const auth = getAuth();
    if (!auth) return null;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;
    const accounts = await database().query(
        `SELECT id FROM admin_accounts WHERE "userId" = $1 AND "providerId" = 'tkid' LIMIT 1`,
        [session.user.id],
    );
    return accounts.length ? session : null;
}

export async function requireAdmin() {
    const session = await adminSession();
    if (!session) throw new AdminAccessError();
    return session;
}
