import { createHmac } from "node:crypto";

const handoffTimeStepMilliseconds = 30_000;

function handoffSecret(shortUrlId: string, pepper: string) {
    if (Buffer.byteLength(pepper) < 32) {
        throw new Error("SHORT_URL_PEPPER must contain at least 32 bytes");
    }

    return createHmac("sha256", pepper).update(`access:${shortUrlId}`).digest();
}

export async function deriveShortUrlHandoffSecret(
    shortUrlId: string,
    pepper: string,
): Promise<string> {
    return handoffSecret(shortUrlId, pepper).toString("base64url");
}

export async function createShortUrlHandoffDestination(
    shortUrlId: string,
    destinationUrl: string,
    pepper: string,
    now = Date.now(),
): Promise<string> {
    if (!Number.isSafeInteger(now) || now < 0) {
        throw new Error("Short URL handoff time must be a non-negative integer");
    }

    const token = createHmac("sha256", handoffSecret(shortUrlId, pepper))
        .update(String(Math.floor(now / handoffTimeStepMilliseconds)))
        .digest("base64url");
    const destination = new URL(destinationUrl);
    destination.searchParams.set("access_token", token);
    return destination.href;
}
