import type { ShortUrlProtection } from "./store";
const noStoreHeaders = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
};
function escape(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function icon(paths: string) {
    return `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

const lockIcon = icon(
    "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"3\"/><path d=\"M8 10V7a4 4 0 0 1 8 0v3\"/><path d=\"M12 14v3\"/>",
);
const arrowIcon = icon("<path d=\"M7 17 17 7M7 7h10v10\"/>");
const backIcon = icon("<path d=\"m9 6-6 6 6 6M3 12h18\"/>");
const adminIcon = icon(
    "<path d=\"M14 17H5M19 7h-9\"/><circle cx=\"17\" cy=\"17\" r=\"3\"/><circle cx=\"7\" cy=\"7\" r=\"3\"/>",
);
const eyeIcon = icon(
    "<path d=\"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
);
function html(title: string, body: string, status: number, headers: Record<string, string> = {}) {
    const adminLink =
        status === 404 ?
            `<a class="footer-admin" href="/admin" aria-label="Admin" title="Admin">${adminIcon}</a>` :
            "";
    return new Response(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#20231f"><title>${escape(title)} — tkkr.dev</title><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="stylesheet" href="/landscape.css"><link rel="stylesheet" href="/shortener.css"><script src="/shortener.js" defer></script></head><body class="shortener-page"><div class="landscape" aria-hidden="true"></div><div class="landscape-shade" aria-hidden="true"></div><main class="shortener-card" aria-labelledby="page-title">${body}</main><footer class="page-credit"><a href="https://unsplash.com/photos/FN-3TXezroI" target="_blank" rel="noopener noreferrer">Photo by Jonathan Cooper</a>${adminLink}</footer></body></html>`,
        {
            status,
            headers: {
                ...noStoreHeaders,
                "Content-Type": "text/html; charset=utf-8",
                "Content-Security-Policy":
                    "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'",
                ...headers,
            },
        },
    );
}

export function statusResponse(
    status: number,
    title: string,
    description: string,
    headers: Record<string, string> = {},
) {
    return html(
        title,
        `<h1 id="page-title" class="status-title">${escape(title)}.</h1><p class="description">${escape(description)}</p><div class="card-footer"><a class="home" href="/">${backIcon} Back to the homepage</a></div>`,
        status,
        headers,
    );
}

export function unlockResponse(
    slug: string,
    protection: ShortUrlProtection,
    message = "",
    status = 200,
    retryAfter = 0,
) {
    const label =
        protection.kind === "pin" ?
            "PIN" :
            protection.kind === "password" ?
                "Password" :
                "Access key";
    const length =
        protection.kind === "pin" ?
            protection.length :
            protection.kind === "password" ?
                128 :
                256;
    const locked = status === 429;
    const invalid = status === 401;
    const feedback = message ? " aria-describedby=\"feedback\"" : "";
    const disabled = locked ? " disabled" : "";
    const invalidAttribute = invalid ? " aria-invalid=\"true\"" : "";
    const field =
        protection.kind === "pin" ?
            `<fieldset class="pin-entry"${feedback}><legend>${length}-digit PIN</legend><div class="pin-digits pin-digits-${length}">${Array.from({ length }, (_, index) => `<input class="pin-digit" name="pinDigit" type="password" inputmode="numeric" pattern="[0-9]" minlength="1" maxlength="1" autocomplete="off" aria-label="Digit ${index + 1} of ${length}" required${disabled}${invalidAttribute}${feedback}${!locked && index === 0 ? " autofocus" : ""}>`).join("")}</div></fieldset>` :
            `<label for="secret">${label}</label><div class="secret-field"><input id="secret" class="secret-input" name="accessKey" type="password" maxlength="${length}" autocomplete="${protection.kind === "password" ? "current-password" : "off"}" autocapitalize="none" spellcheck="false" placeholder="Enter ${label.toLowerCase()}" required${disabled}${invalidAttribute}${feedback}${!locked ? " autofocus" : ""}><button class="reveal-secret" type="button" aria-label="Show ${label.toLowerCase()}" aria-controls="secret" aria-pressed="false" data-secret-label="${label.toLowerCase()}"${disabled} hidden>${eyeIcon}</button></div>`;
    return html(
        `Unlock /${slug}`,
        `<h1 id="page-title">Enter your <em>${label === "PIN" ? label : label.toLowerCase()}.</em></h1><p class="description">Use the ${protection.kind === "pin" ? "code" : label.toLowerCase()} shared with you to open this link.</p>
    <form method="post" action="/${escape(slug)}" class="unlock-form">${field}
    ${message ? `<p id="feedback" role="alert" class="feedback ${locked ? "feedback-locked" : ""}">${escape(message)}</p>` : ""}<button class="primary-action" type="submit"${disabled}><span>${locked ? "Temporarily locked" : "Open link"}</span>${locked ? lockIcon : arrowIcon}</button></form><div class="card-footer"><a class="home" href="/">${backIcon} Back to the homepage</a></div>`,
        status,
        retryAfter ? { "Retry-After": String(retryAfter) } : {},
    );
}

export function redirectResponse(destination: string, status: 303 | 307) {
    return new Response(null, {
        status,
        headers: { ...noStoreHeaders, Location: destination },
    });
}

export async function boundedBody(request: Request, limit = 1024): Promise<string | null> {
    const length = request.headers.get("content-length");
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > limit)) return null;
    if (!request.body) return "";
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > limit) {
            await reader.cancel();
            return null;
        }

        chunks.push(value);
    }

    const buffer = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
    }

    return new TextDecoder().decode(buffer);
}
