export const maxShortUrlDestinationLength = 2048;

const blockedShortUrlDestinationProtocols = new Set([
    'about:',
    'blob:',
    'brave:',
    'chrome:',
    'chrome-devtools:',
    'chrome-extension:',
    'data:',
    'devtools:',
    'edge:',
    'file:',
    'filesystem:',
    'javascript:',
    'jar:',
    'moz-extension:',
    'opera:',
    'resource:',
    'safari-extension:',
    'vbscript:',
    'view-source:',
    'wyciwyg:',
]);

export type ShortUrlDestinationValidation =
    | { kind: 'valid'; destinationUrl: string; protocol: string }
    | { kind: 'invalid' }
    | { kind: 'blocked-protocol'; protocol: string }
    | { kind: 'too-long' };

export function validateShortUrlDestination(value: unknown): ShortUrlDestinationValidation {
    if (typeof value !== 'string' || value.length === 0) {
        return { kind: 'invalid' };
    }

    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return { kind: 'invalid' };
    }

    const protocol = url.protocol.toLowerCase();
    if (blockedShortUrlDestinationProtocols.has(protocol)) {
        return { kind: 'blocked-protocol', protocol };
    }

    if (url.href.length > maxShortUrlDestinationLength) {
        return { kind: 'too-long' };
    }

    return { kind: 'valid', destinationUrl: url.href, protocol };
}

export function normalizeShortUrlDestination(value: unknown): string | null {
    const result = validateShortUrlDestination(value);
    return result.kind === 'valid' ? result.destinationUrl : null;
}

export function shortUrlDestinationCspSource(destinationUrl: string): string {
    const url = new URL(destinationUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : url.protocol;
}
