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

export const Route = createRootRoute({
    validateSearch: (search: Record<string, unknown>): RootSearch => ({
        links: search.links === true || search.links === 'true' ? true : undefined,
    }),
    head: ({ match }) => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            {
                title: match.globalNotFound ? notFoundStatusPage.title : 'Thaddeus Kuah',
            },
            {
                name: 'description',
                content: 'My personal website.',
            },
        ],
        links: [
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
    const standaloneQuickLink = useRouterState({
        select: ({ matches }) =>
            matches.some(({ loaderData, routeId }) => {
                if (routeId !== '/$slug' || typeof loaderData !== 'object') return false;
                return 'kind' in loaderData && loaderData.kind === 'protected';
            }),
    });

    return (
        <>
            {!standaloneQuickLink ? <Navigation /> : null}
            {children}
            {!standaloneQuickLink ? <PageScrollbar /> : null}
            {!standaloneQuickLink ? <LinksDialogSlot /> : null}
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
