import { lazy, Suspense, useEffect, useState } from 'react';
import { HeadContent, Scripts, createRootRoute, useRouterState, useSearch } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';

import { ThemeProvider } from '@/components/theme-provider';
import { Navigation } from '@/components/navigation';
import { NotFoundPage } from '@/components/not-found-page';
import { PageScrollbar } from '@/components/page-scrollbar';
import { notFoundStatusPage } from '@/lib/status-pages';
import appCss from '@/styles.css?url';

const LazyLinksDialog = lazy(() =>
    import('@/components/links-dialog').then(({ LinksDialog }) => ({
        default: LinksDialog,
    }))
);

type RootSearch = {
    links?: boolean;
};

type NotFoundAwareMatch = {
    status: string;
    globalNotFound?: boolean;
    _notFound?: boolean;
};

function isNotFoundMatch(match: NotFoundAwareMatch) {
    return match.status === 'notFound' || match.globalNotFound === true || match._notFound === true;
}

export const Route = createRootRoute({
    validateSearch: (search: Record<string, unknown>): RootSearch => ({
        links: search.links === true || search.links === 'true' ? true : undefined,
    }),
    head: ({ matches }) => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            {
                title: matches.some(isNotFoundMatch) ? notFoundStatusPage.title : 'Thaddeus Kuah',
            },
            {
                name: 'description',
                content:
                    'The personal website of Thaddeus Kuah, an information technology student and self-taught hobbyist programmer in Singapore.',
            },
            {
                name: 'color-scheme',
                content: 'light dark',
            },
        ],
        links: [
            {
                rel: 'icon',
                href: '/favicon.ico',
                type: 'image/x-icon',
            },
            {
                rel: 'icon',
                sizes: '16x16',
                href: '/favicon-16x16.png',
                type: 'image/png',
            },
            {
                rel: 'icon',
                sizes: '32x32',
                href: '/favicon-32x32.png',
                type: 'image/png',
            },
            {
                rel: 'apple-touch-icon',
                href: '/apple-touch-icon.png',
                sizes: '180x180',
            },
            {
                rel: 'manifest',
                href: '/site.webmanifest',
            },
            {
                rel: 'stylesheet',
                href: appCss,
            },
        ],
    }),
    notFoundComponent: NotFoundPage,
    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body>
                <ThemeProvider defaultTheme="system" storageKey="theme">
                    <RouteChrome>{children}</RouteChrome>
                </ThemeProvider>
                <TanStackDevtools
                    config={{
                        position: 'bottom-right',
                    }}
                    plugins={[
                        {
                            name: 'Tanstack Router',
                            render: <TanStackRouterDevtoolsPanel />,
                        },
                    ]}
                />
                <Scripts />
            </body>
        </html>
    );
}

function RouteChrome({ children }: { children: React.ReactNode }) {
    const standaloneShortUrl = useRouterState({
        select: ({ matches }) =>
            matches.some(({ loaderData, routeId }) => {
                if (routeId !== '/$slug' || typeof loaderData !== 'object') return false;
                return 'kind' in loaderData && loaderData.kind === 'protected';
            }),
    });

    return (
        <>
            {!standaloneShortUrl ? <Navigation /> : null}
            {children}
            {!standaloneShortUrl ? <PageScrollbar /> : null}
            {!standaloneShortUrl ? <LinksDialogSlot /> : null}
        </>
    );
}

function LinksDialogSlot() {
    const { links } = useSearch({ from: '__root__' });
    const [hasOpened, setHasOpened] = useState(links === true);

    useEffect(() => {
        if (links) setHasOpened(true);
    }, [links]);

    if (!links && !hasOpened) return null;

    return (
        <Suspense fallback={null}>
            <LazyLinksDialog />
        </Suspense>
    );
}
