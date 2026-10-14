import { database, type Database } from "../db";
import { lookupShortUrl, normalizeShortUrlSlug, verifyShortUrlSecret } from "./store";
import { createShortUrlHandoffDestination } from "./handoff";
import { clearUnlockAttempts, clientFingerprint, reserveUnlockAttempt } from "./rate-limit";
import { boundedBody, redirectResponse, statusResponse, unlockResponse } from "./responses";
export async function handleShortUrl(request: Request, rawSlug: string, db?: Database) {
    const slug = normalizeShortUrlSlug(rawSlug);
    if (!slug)
        return statusResponse(
            404,
            "Link not found",
            "The page or short link you’re looking for doesn’t exist. Check the address, or head back to the homepage.",
        );
    try {
        db ??= database();
        const result = await lookupShortUrl(db, slug);
        if (result.kind === "missing")
            return statusResponse(
                404,
                "Link not found",
                "The page or short link you’re looking for doesn’t exist. Check the address, or head back to the homepage.",
            );
        if (result.kind === "expired")
            return statusResponse(
                410,
                "This link has expired",
                "Ask the person who shared it for a new link.",
            );
        if (result.kind === "unavailable") return unavailable();
        if (result.kind === "active")
            return request.method === "POST" ?
                    statusResponse(
                        405,
                        "Use the link directly",
                        "This link does not need to be unlocked.",
                        { Allow: "GET, HEAD" },
                    ) :
                    redirectResponse(result.shortUrl.destinationUrl, 307);
        const link = result.shortUrl;
        if (request.method !== "POST") return unlockResponse(slug, link.protection);
        if (
            request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
            "application/x-www-form-urlencoded"
        )
            return statusResponse(
                415,
                "Unsupported request",
                "Use the unlock form to open this link.",
            );
        const body = await boundedBody(request);
        if (body === null)
            return statusResponse(413, "Request too large", "Try entering the secret again.");
        const pepper = process.env.SHORT_URL_PEPPER;
        if (!pepper || Buffer.byteLength(pepper) < 32) return unavailable();
        const fingerprint = clientFingerprint(link.id, request.headers, pepper);
        const attempt = await reserveUnlockAttempt(db, link.id, fingerprint);
        if (!attempt.allowed)
            return unlockResponse(
                slug,
                link.protection,
                `Too many attempts. Try again in ${Math.ceil(attempt.retryAfter / 60)} minutes.`,
                429,
                attempt.retryAfter,
            );
        const params = new URLSearchParams(body);
        const secrets = params.getAll("accessKey");
        const digits = params.getAll("pinDigit");
        const secret =
            secrets.length === 1 && !digits.length ?
                secrets[0] :
                    !secrets.length && digits.length >= 4 && digits.length <= 8 ?
                            digits.join("") :
                        "";
        if (!(await verifyShortUrlSecret(secret, link.unlockVerifier, pepper))) {
            const protectionLabel = {
                pin: "PIN",
                password: "password",
                key: "access key",
            }[link.protection.kind];
            return attempt.retryAfter ?
                    unlockResponse(
                        slug,
                        link.protection,
                        "Too many attempts. Try again in 30 minutes.",
                        429,
                        attempt.retryAfter,
                    ) :
                    unlockResponse(
                        slug,
                        link.protection,
                        `Incorrect ${protectionLabel}. ${attempt.remaining} attempts remaining.`,
                        401,
                    );
        }

        await clearUnlockAttempts(db, link.id, fingerprint);
        return redirectResponse(
            await createShortUrlHandoffDestination(link.id, link.destinationUrl, pepper),
            303,
        );
    } catch {
        // Never leak destinations, credentials, connection strings or SQL into error pages/logs.
        console.error("Short URL operation failed.");
        return unavailable();
    }
}

function unavailable() {
    return statusResponse(503, "Link temporarily unavailable", "Please try again in a moment.", {
        "Retry-After": "60",
    });
}
