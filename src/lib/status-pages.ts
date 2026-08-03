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

export const quickLinkExpiredStatusPage = {
    status: 410,
    title: 'Link expired — tkkr.dev',
    label: 'Link expired',
    heading: 'This link has run its course.',
    description: 'This link has reached its expiry time and can no longer take you to its destination.',
    action: {
        href: '/',
        icon: 'home',
        label: 'Return home',
    },
} satisfies StatusPageDefinition;

export function quickLinkUnavailableStatusPage(slug: string): StatusPageDefinition {
    return {
        status: 503,
        title: 'Links unavailable — tkkr.dev',
        label: 'Service unavailable',
        heading: 'Links are out of reach.',
        description: 'Links are temporarily unavailable. Please wait a few minutes and try this address again.',
        action: {
            href: `/${slug}`,
            icon: 'retry',
            label: 'Try again',
        },
    };
}

export function quickLinkMethodNotAllowedStatusPage(slug: string): StatusPageDefinition {
    return {
        status: 405,
        title: 'Method not allowed — tkkr.dev',
        label: 'Method not allowed',
        heading: 'This link is already open.',
        description: 'This link does not require an access key. Open it normally to continue.',
        action: {
            href: `/${slug}`,
            icon: 'open',
            label: 'Open link',
        },
    };
}

export function quickLinkUnsupportedRequestStatusPage(slug: string): StatusPageDefinition {
    return {
        status: 415,
        title: 'Unsupported request — tkkr.dev',
        label: 'Unsupported request',
        heading: 'That request cannot unlock this link.',
        description: 'Use the protected-link form to submit your password, PIN, or access key.',
        action: {
            href: `/${slug}`,
            icon: 'retry',
            label: 'Try again',
        },
    };
}

export function quickLinkRequestTooLargeStatusPage(slug: string): StatusPageDefinition {
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
