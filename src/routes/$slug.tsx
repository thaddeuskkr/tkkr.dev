import { env, waitUntil } from 'cloudflare:workers';
import { createFileRoute, notFound, redirect, rootRouteId } from '@tanstack/react-router';
import { createMiddleware, createServerFn } from '@tanstack/react-start';
import { renderToStaticMarkup } from 'react-dom/server';

import { ShortUrlUnlockPage } from '@/components/short-url-unlock-page';
import { StatusPage } from '@/components/not-found-page';
import {
    checkShortUrlRateLimit,
    clearShortUrlUnlockFailures,
    fingerprintShortUrlClient,
    recordShortUrlUnlockFailure,
} from '@/lib/shortener/rate-limit';
import { normalizeShortUrlDestination, shortUrlDestinationCspSource } from '@/lib/shortener/destination';
import { createShortUrlHandoffDestination } from '@/lib/shortener/handoff';
import { lookupShortUrl, normalizeShortUrlSlug, verifyShortUrlSecret } from '@/lib/shortener/store';
import type {
    ProtectedShortUrl,
    PublicShortUrl,
    ShortUrlLookupResult,
    ShortUrlProtection,
} from '@/lib/shortener/store';
import {
    shortUrlExpiredStatusPage,
    shortUrlMethodNotAllowedStatusPage,
    shortUrlRequestTooLargeStatusPage,
    shortUrlUnavailableStatusPage,
    shortUrlUnsupportedRequestStatusPage,
} from '@/lib/status-pages';
import type { StatusPageDefinition } from '@/lib/status-pages';
import appCss from '@/styles.css?url';

const cacheTtlSeconds = 5 * 60;
const maxUnlockBodyBytes = 1024;
const maxSubmittedSecretLength = 256;

type UnlockPageState =
    { kind: 'idle' } | { kind: 'rejected'; attemptsRemaining?: number } | { kind: 'locked'; retryAfterSeconds: number };

type ShortUrlRouteData =
    | { kind: 'protected'; protection: ShortUrlProtection; slug: string }
    | { kind: 'expired' }
    | { kind: 'unavailable'; slug: string };

const noStoreHeaders = {
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
} as const;

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='light'||t==='dark'?t:(d?'dark':'light');document.documentElement.classList.add(r);document.documentElement.style.colorScheme=r}catch(e){}})();`;

const lookupShortUrlForRoute = createServerFn({ method: 'GET' })
    .validator((rawSlug: unknown) => {
        if (typeof rawSlug !== 'string') throw new Error('Short URL slug must be a string');
        return rawSlug;
    })
    .handler(async ({ data: rawSlug }) => {
        const { getRequest } = await import('@tanstack/react-start/server');
        const request = getRequest();
        const slug = normalizeShortUrlSlug(rawSlug);
        if (!slug) return { kind: 'missing' } as const;

        const cachedShortUrl = await readCachedShortUrl(request, slug);
        if (cachedShortUrl) {
            logCache(slug, 'hit');
            return { kind: 'active', destinationUrl: cachedShortUrl.destinationUrl } as const;
        }

        logCache(slug, 'miss');
        const result = await lookupShortUrl(env.SHORT_URL_DB, slug);

        switch (result.kind) {
            case 'active':
                cacheShortUrl(request, slug, result.shortUrl);
                return { kind: 'active', destinationUrl: result.shortUrl.destinationUrl } as const;
            case 'protected':
                return { kind: 'protected', protection: result.shortUrl.protection, slug } as const;
            case 'expired':
                return { kind: 'expired' } as const;
            case 'missing':
                return { kind: 'missing' } as const;
            case 'unavailable':
                logFailure(slug, result.reason, result.error);
                return { kind: 'unavailable', slug } as const;
        }
    });

const shortUrlGetMiddleware = createMiddleware().server(async ({ handlerType, next, pathname, request }) => {
    if (handlerType !== 'router' || request.method !== 'GET') {
        return next();
    }

    const response = await handleShortUrlGet(request, pathname.slice(1));
    return response ?? next();
});

export const Route = createFileRoute('/$slug')({
    headers: () => noStoreHeaders,
    loader: async ({ params }) => {
        const result = await lookupShortUrlForRoute({ data: params.slug });

        switch (result.kind) {
            case 'active':
                throw redirect({
                    href: result.destinationUrl,
                    statusCode: 307,
                    headers: noStoreHeaders,
                });
            case 'missing':
                throw notFound({ routeId: rootRouteId });
            case 'expired':
                return result satisfies ShortUrlRouteData;
            case 'unavailable':
                return result satisfies ShortUrlRouteData;
            case 'protected':
                return result satisfies ShortUrlRouteData;
        }
    },
    head: ({ loaderData }) => ({
        meta: loaderData ? [{ title: shortUrlRouteTitle(loaderData) }] : undefined,
    }),
    component: ShortUrlRoute,
    server: {
        middleware: [shortUrlGetMiddleware],
        handlers: {
            POST: ({ request, params }) => handleShortUrlPost(request, params.slug),
        },
    },
});

function ShortUrlRoute() {
    const data = Route.useLoaderData();

    if (data.kind === 'protected') {
        return <ShortUrlUnlockPage protection={data.protection} slug={data.slug} state={{ kind: 'idle' }} />;
    }

    if (data.kind === 'expired') {
        return <StatusPage page={shortUrlExpiredStatusPage} />;
    }

    return <StatusPage page={shortUrlUnavailableStatusPage(data.slug)} />;
}

function shortUrlRouteTitle(data: ShortUrlRouteData): string {
    switch (data.kind) {
        case 'protected':
            return `Unlock ${data.slug} — tkkr.dev`;
        case 'expired':
            return shortUrlExpiredStatusPage.title;
        case 'unavailable':
            return shortUrlUnavailableStatusPage(data.slug).title;
    }
}

async function handleShortUrlGet(request: Request, rawSlug: string): Promise<Response | undefined> {
    const slug = normalizeShortUrlSlug(rawSlug);
    if (!slug) return undefined;

    const cachedShortUrl = await readCachedShortUrl(request, slug);
    if (cachedShortUrl) {
        logCache(slug, 'hit');
        return redirectTo(cachedShortUrl.destinationUrl, 307);
    }

    logCache(slug, 'miss');
    const result = await lookupShortUrl(env.SHORT_URL_DB, slug);

    if (result.kind === 'active') {
        cacheShortUrl(request, slug, result.shortUrl);
        return redirectTo(result.shortUrl.destinationUrl, 307);
    }

    if (result.kind === 'missing') {
        return undefined;
    }

    return responseForLookupResult(result, slug, request);
}

async function handleShortUrlPost(request: Request, rawSlug: string): Promise<Response> {
    const slug = normalizeShortUrlSlug(rawSlug);
    if (!slug) {
        return redirectPostToGet(request);
    }

    const result = await lookupShortUrl(env.SHORT_URL_DB, slug);
    if (result.kind !== 'protected') {
        if (result.kind === 'active') {
            return statusPage(shortUrlMethodNotAllowedStatusPage(slug), { Allow: 'GET, HEAD' });
        }

        return responseForLookupResult(result, slug, request);
    }

    const submittedSecret = await readUnlockSecret(request);
    if (submittedSecret.kind === 'unsupported') {
        return statusPage(shortUrlUnsupportedRequestStatusPage(slug));
    }
    if (submittedSecret.kind === 'too-large') {
        return statusPage(shortUrlRequestTooLargeStatusPage(slug));
    }

    const pepper = env.SHORT_URL_PEPPER;
    if (!pepper) {
        logFailure(slug, 'missing-pepper');
        return unavailablePage(slug);
    }

    let clientFingerprint: string | null = null;
    let hasTrackedFailures = false;
    if (result.shortUrl.protection.kind === 'password' || result.shortUrl.protection.kind === 'pin') {
        try {
            clientFingerprint = await fingerprintShortUrlClient(
                result.shortUrl.id,
                request.headers.get('CF-Connecting-IP') ?? 'unavailable',
                pepper
            );
        } catch (error) {
            logFailure(slug, 'rate-limit-fingerprint', error);
            return unavailablePage(slug);
        }

        const rateLimit = await checkShortUrlRateLimit(env.SHORT_URL_DB, result.shortUrl.id, clientFingerprint);
        if (rateLimit.kind === 'unavailable') {
            logFailure(slug, 'rate-limit-check', rateLimit.error);
            return unavailablePage(slug);
        }
        if (rateLimit.kind === 'locked') {
            return unlockPage(slug, result.shortUrl, rateLimit);
        }
        hasTrackedFailures = rateLimit.tracked;
    }

    let valid = false;
    try {
        valid = await verifyShortUrlSecret(submittedSecret.secret, result.shortUrl.unlockVerifier, pepper);
    } catch (error) {
        logFailure(slug, 'verification', error);
        return unavailablePage(slug);
    }

    if (!valid) {
        if (clientFingerprint) {
            const rateLimit = await recordShortUrlUnlockFailure(
                env.SHORT_URL_DB,
                result.shortUrl.id,
                clientFingerprint
            );
            if (rateLimit.kind === 'unavailable') {
                logFailure(slug, 'rate-limit-write', rateLimit.error);
                return unavailablePage(slug);
            }
            if (rateLimit.kind === 'locked') {
                return unlockPage(slug, result.shortUrl, rateLimit);
            }

            return unlockPage(slug, result.shortUrl, {
                kind: 'rejected',
                attemptsRemaining: rateLimit.attemptsRemaining,
            });
        }

        return unlockPage(slug, result.shortUrl, { kind: 'rejected' });
    }

    if (clientFingerprint && hasTrackedFailures) {
        try {
            await clearShortUrlUnlockFailures(env.SHORT_URL_DB, result.shortUrl.id, clientFingerprint);
        } catch (error) {
            logFailure(slug, 'rate-limit-clear', error);
        }
    }

    let destinationUrl: string;
    try {
        destinationUrl = await createShortUrlHandoffDestination(
            result.shortUrl.id,
            result.shortUrl.destinationUrl,
            pepper
        );
    } catch (error) {
        logFailure(slug, 'handoff-token', error);
        return unavailablePage(slug);
    }

    return redirectTo(destinationUrl, 303);
}

function responseForLookupResult(result: ShortUrlLookupResult, slug: string, request: Request): Response {
    switch (result.kind) {
        case 'protected':
            return unlockPage(slug, result.shortUrl, { kind: 'idle' });
        case 'expired':
            return statusPage(shortUrlExpiredStatusPage);
        case 'missing':
            return redirectPostToGet(request);
        case 'unavailable':
            logFailure(slug, result.reason, result.error);
            return unavailablePage(slug);
        case 'active':
            return redirectTo(result.shortUrl.destinationUrl, 307);
    }
}

function redirectPostToGet(request: Request): Response {
    return new Response(null, {
        status: 303,
        headers: {
            ...noStoreHeaders,
            Location: request.url,
        },
    });
}

function redirectTo(destinationUrl: string, status: 303 | 307): Response {
    return new Response(null, {
        status,
        headers: {
            ...noStoreHeaders,
            Location: destinationUrl,
        },
    });
}

function unlockPage(slug: string, shortUrl: ProtectedShortUrl, state: UnlockPageState): Response {
    const nonce = createCspNonce();
    const status = state.kind === 'locked' ? 429 : state.kind === 'rejected' ? 401 : 200;
    const destinationCspSource = shortUrlDestinationCspSource(shortUrl.destinationUrl);
    const body = renderToStaticMarkup(
        <ShortUrlUnlockPage protection={shortUrl.protection} scriptNonce={nonce} slug={slug} state={state} />
    );
    const headers = new Headers({
        ...noStoreHeaders,
        'Content-Security-Policy': `default-src 'none'; style-src 'self'; font-src 'self'; script-src 'nonce-${nonce}'; form-action 'self' ${destinationCspSource}; base-uri 'none'; frame-ancestors 'none'`,
        'Content-Type': 'text/html; charset=utf-8',
    });
    if (state.kind === 'locked') {
        headers.set('Retry-After', String(state.retryAfterSeconds));
    }

    return new Response(
        `<!doctype html>
<html lang="en" suppresshydrationwarning>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <title>Unlock ${escapeHtml(slug)} — tkkr.dev</title>
    <link rel="stylesheet" href="${escapeHtml(appCss)}">
    <script nonce="${nonce}">${themeScript}</script>
</head>
<body>
    ${body}
</body>
</html>`,
        {
            status,
            headers,
        }
    );
}

function statusPage(page: StatusPageDefinition, additionalHeaders: HeadersInit = {}): Response {
    const nonce = createCspNonce();
    const body = renderToStaticMarkup(<StatusPage page={page} />);

    return new Response(
        `<!doctype html>
<html lang="en" suppresshydrationwarning>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <title>${escapeHtml(page.title)}</title>
    <link rel="stylesheet" href="${escapeHtml(appCss)}">
    <script nonce="${nonce}">${themeScript}</script>
</head>
<body>
    ${body}
</body>
</html>`,
        {
            status: page.status,
            headers: {
                ...noStoreHeaders,
                'Content-Security-Policy': `default-src 'none'; style-src 'self'; font-src 'self'; script-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
                'Content-Type': 'text/html; charset=utf-8',
                ...Object.fromEntries(new Headers(additionalHeaders)),
            },
        }
    );
}

function unavailablePage(slug: string): Response {
    return statusPage(shortUrlUnavailableStatusPage(slug), { 'Retry-After': '60' });
}

async function readUnlockSecret(
    request: Request
): Promise<{ kind: 'ok'; secret: string } | { kind: 'unsupported' } | { kind: 'too-large' }> {
    const contentType = request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase();
    if (contentType !== 'application/x-www-form-urlencoded') {
        return { kind: 'unsupported' };
    }

    const body = await readBoundedBody(request, maxUnlockBodyBytes);
    if (body === null) {
        return { kind: 'too-large' };
    }

    const parameters = new URLSearchParams(body);
    const values = parameters.getAll('accessKey');
    const pinDigits = parameters.getAll('pinDigit');
    const secret =
        values.length === 1 && pinDigits.length === 0
            ? values[0]
            : values.length === 0 && pinDigits.length >= 4 && pinDigits.length <= 8
              ? pinDigits.join('')
              : '';

    return {
        kind: 'ok',
        secret: secret.length <= maxSubmittedSecretLength ? secret : '',
    };
}

function createCspNonce(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

async function readBoundedBody(request: Request, maxBytes: number): Promise<string | null> {
    const declaredLength = request.headers.get('Content-Length');
    if (declaredLength) {
        const length = Number(declaredLength);
        if (!Number.isSafeInteger(length) || length < 0 || length > maxBytes) {
            return null;
        }
    }

    const requestBody = request.body;
    if (requestBody === null) {
        return '';
    }

    const reader = requestBody.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
            await reader.cancel();
            return null;
        }

        chunks.push(value);
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return new TextDecoder().decode(body);
}

async function readCachedShortUrl(request: Request, slug: string): Promise<PublicShortUrl | null> {
    try {
        const response = await defaultCache().match(cacheRequest(request, slug));
        if (!response) return null;

        const value: unknown = await response.json();
        if (!isCachedShortUrl(value) || (value.expiresAt !== null && value.expiresAt <= Date.now())) {
            return null;
        }

        return value;
    } catch (error) {
        logFailure(slug, 'cache-read', error);
        return null;
    }
}

function cacheShortUrl(request: Request, slug: string, shortUrl: PublicShortUrl): void {
    const ttl = cacheTtl(shortUrl.expiresAt);
    if (ttl <= 0) return;

    const response = Response.json(shortUrl, {
        headers: { 'Cache-Control': `public, max-age=${ttl}` },
    });

    waitUntil(
        defaultCache()
            .put(cacheRequest(request, slug), response)
            .catch((error: unknown) => {
                logFailure(slug, 'cache-write', error);
            })
    );
}

function defaultCache(): Cache {
    return (caches as CacheStorage & { readonly default: Cache }).default;
}

function cacheTtl(expiresAt: number | null): number {
    if (expiresAt === null) return cacheTtlSeconds;
    return Math.min(cacheTtlSeconds, Math.floor((expiresAt - Date.now()) / 1000));
}

function cacheRequest(request: Request, slug: string): Request {
    const url = new URL(request.url);
    url.pathname = `/__short-url-cache/${encodeURIComponent(slug)}`;
    url.search = '';
    url.hash = '';
    return new Request(url, { method: 'GET' });
}

function isCachedShortUrl(value: unknown): value is PublicShortUrl {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Record<string, unknown>;
    if (typeof candidate.destinationUrl !== 'string') return false;
    if (
        candidate.expiresAt !== null &&
        (!Number.isSafeInteger(candidate.expiresAt) || (candidate.expiresAt as number) < 0)
    ) {
        return false;
    }

    return normalizeShortUrlDestination(candidate.destinationUrl) === candidate.destinationUrl;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function logCache(slug: string, outcome: 'hit' | 'miss'): void {
    console.log(JSON.stringify({ event: 'short_url_cache', outcome, slug }));
}

function logFailure(slug: string, reason: string, error?: unknown): void {
    console.error(
        JSON.stringify({
            event: 'short_url_failure',
            slug,
            reason,
            error: error instanceof Error ? error.message : error ? String(error) : undefined,
        })
    );
}
