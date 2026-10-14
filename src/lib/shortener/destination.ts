const maxShortUrlDestinationLength = 2048;

const blockedShortUrlDestinationProtocols = new Set([
    "about:",
    "blob:",
    "brave:",
    "chrome:",
    "chrome-devtools:",
    "chrome-extension:",
    "data:",
    "devtools:",
    "edge:",
    "file:",
    "filesystem:",
    "javascript:",
    "jar:",
    "moz-extension:",
    "opera:",
    "resource:",
    "safari-extension:",
    "vbscript:",
    "view-source:",
    "wyciwyg:",
]);

export function normalizeShortUrlDestination(value: unknown): string | null {
    if (typeof value !== "string" || !value) return null;
    try {
        const url = new URL(value);
        if (
            blockedShortUrlDestinationProtocols.has(url.protocol.toLowerCase()) ||
            url.href.length > maxShortUrlDestinationLength
        )
            return null;
        return url.href;
    } catch {
        return null;
    }
}
