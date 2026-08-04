export type StatusPageActionIcon = 'home' | 'open' | 'retry';

export type StatusPageDefinition = {
    status: number;
    title: string;
    label: string;
    heading: string;
    description: string;
    action: {
        href: string;
        icon: StatusPageActionIcon;
        label: string;
    };
};

export const notFoundStatusPage = {
    status: 404,
    title: 'Page not found — tkkr.dev',
    label: 'Page not found',
    heading: 'Nothing lives at this address.',
    description: 'The page may have moved, or the link might be incomplete. Head home and try another path.',
    action: {
        href: '/',
        icon: 'home',
        label: 'Return home',
    },
} satisfies StatusPageDefinition;

export const shortUrlExpiredStatusPage = {
    status: 410,
    title: 'Short URL expired — tkkr.dev',
    label: 'Short URL expired',
    heading: 'This short URL has run its course.',
    description: 'This short URL has reached its expiry time and can no longer take you to its destination.',
    action: {
        href: '/',
        icon: 'home',
        label: 'Return home',
    },
} satisfies StatusPageDefinition;

export function shortUrlUnavailableStatusPage(slug: string): StatusPageDefinition {
    return {
        status: 503,
        title: 'Short URLs unavailable — tkkr.dev',
        label: 'Service unavailable',
        heading: 'Short URLs are out of reach.',
        description: 'Short URLs are temporarily unavailable. Please wait a few minutes and try this address again.',
        action: {
            href: `/${slug}`,
            icon: 'retry',
            label: 'Try again',
        },
    };
}

export function shortUrlMethodNotAllowedStatusPage(slug: string): StatusPageDefinition {
    return {
        status: 405,
        title: 'Method not allowed — tkkr.dev',
        label: 'Method not allowed',
        heading: 'This short URL is already open.',
        description: 'This short URL does not require an access key. Open it normally to continue.',
        action: {
            href: `/${slug}`,
            icon: 'open',
            label: 'Open short URL',
        },
    };
}

export function shortUrlUnsupportedRequestStatusPage(slug: string): StatusPageDefinition {
    return {
        status: 415,
        title: 'Unsupported request — tkkr.dev',
        label: 'Unsupported request',
        heading: 'That request cannot unlock this short URL.',
        description: 'Use the protected short URL form to submit your password, PIN, or access key.',
        action: {
            href: `/${slug}`,
            icon: 'retry',
            label: 'Try again',
        },
    };
}

export function shortUrlRequestTooLargeStatusPage(slug: string): StatusPageDefinition {
    return {
        status: 413,
        title: 'Request too large — tkkr.dev',
        label: 'Request too large',
        heading: 'That entry was too large.',
        description: 'The submitted access value exceeded the allowed size. Return to the form and enter it again.',
        action: {
            href: `/${slug}`,
            icon: 'retry',
            label: 'Try again',
        },
    };
}
