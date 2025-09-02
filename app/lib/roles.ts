export type SessionWithRoles = {
    user?: {
        roles?: string[];
    };
} | null;

export function userHasPermittedRoles(session: SessionWithRoles): boolean {
    const permittedRoles =
        process.env.AUTH_ALLOWED_ROLES?.split(",")
            .map((role) => role.trim())
            .filter(Boolean) || [];
    if (permittedRoles.length === 0) {
        return true;
    }
    return session?.user?.roles?.some((role) => permittedRoles.includes(role)) ?? false;
}
