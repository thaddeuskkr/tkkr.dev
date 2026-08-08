const shortUrlHandoffSecretPattern = /^[A-Za-z0-9_-]{43}$/;
const shortUrlHandoffTokenPattern = /^[A-Za-z0-9_-]{43}$/;
const textEncoder = new TextEncoder();

export const shortUrlHandoffTokenParameter = 'access_token';
export const shortUrlHandoffTimeStepSeconds = 30;

const shortUrlHandoffTimeStepMilliseconds = shortUrlHandoffTimeStepSeconds * 1000;
const acceptedPreviousTimeSteps = 1;

export async function deriveShortUrlHandoffSecret(shortUrlId: string, pepper: string): Promise<string> {
    return encodeBase64Url(await deriveShortUrlHandoffSecretBytes(shortUrlId, pepper));
}

export async function createShortUrlHandoffDestination(
    shortUrlId: string,
    destinationUrl: string,
    pepper: string,
    now = Date.now()
): Promise<string> {
    const token = await createShortUrlHandoffToken(shortUrlId, pepper, now);
    const destination = new URL(destinationUrl);
    destination.searchParams.set(shortUrlHandoffTokenParameter, token);
    return destination.href;
}

export async function createShortUrlHandoffToken(
    shortUrlId: string,
    pepper: string,
    now = Date.now()
): Promise<string> {
    const handoffSecret = await deriveShortUrlHandoffSecretBytes(shortUrlId, pepper);
    const key = await importHmacKey(handoffSecret, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(handoffTokenPayload(timeStep(now))));

    return encodeBase64Url(new Uint8Array(signature));
}

/**
 * Copy this function and its helpers to a destination backend. The backend
 * receives the per-Short-URL secret printed by the CLI, never the Worker pepper.
 */
export async function verifyShortUrlHandoffToken(
    token: string,
    handoffSecret: string,
    now = Date.now()
): Promise<boolean> {
    if (!shortUrlHandoffTokenPattern.test(token) || !shortUrlHandoffSecretPattern.test(handoffSecret)) {
        return false;
    }

    const tokenBytes = decodeBase64Url(token);
    const secretBytes = decodeBase64Url(handoffSecret);
    if (!tokenBytes || !secretBytes || tokenBytes.byteLength !== 32 || secretBytes.byteLength !== 32) {
        return false;
    }

    const key = await importHmacKey(secretBytes, ['verify']);
    const currentTimeStep = timeStep(now);

    for (let offset = 0; offset <= acceptedPreviousTimeSteps; offset += 1) {
        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            tokenBytes,
            textEncoder.encode(handoffTokenPayload(currentTimeStep - offset))
        );
        if (valid) return true;
    }

    return false;
}

async function deriveShortUrlHandoffSecretBytes(shortUrlId: string, pepper: string): Promise<Uint8Array<ArrayBuffer>> {
    const pepperBytes = textEncoder.encode(pepper);
    if (pepperBytes.byteLength < 32) {
        throw new Error('SHORT_URL_PEPPER must contain at least 32 bytes');
    }

    const key = await importHmacKey(pepperBytes, ['sign']);
    const secret = await crypto.subtle.sign(
        'HMAC',
        key,
        textEncoder.encode(`short-url-handoff-secret:v1:${shortUrlId}`)
    );
    return new Uint8Array(secret);
}

function handoffTokenPayload(timeStepValue: number): string {
    return `short-url-handoff-token:v1:${timeStepValue}`;
}

function timeStep(now: number): number {
    if (!Number.isSafeInteger(now) || now < 0) {
        throw new Error('Short URL handoff time must be a non-negative integer');
    }

    return Math.floor(now / shortUrlHandoffTimeStepMilliseconds);
}

function importHmacKey(keyBytes: Uint8Array<ArrayBuffer>, usages: KeyUsage[]): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, usages);
}

function encodeBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
    try {
        const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const binary = atob(padded);
        const bytes = new Uint8Array(new ArrayBuffer(binary.length));
        for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }
        return bytes;
    } catch {
        return null;
    }
}
