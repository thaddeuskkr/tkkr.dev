import { lazy, Suspense, useEffect, useState } from 'react';
import { HeadContent, Scripts, createRootRoute, useSearch } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';

import { ThemeProvider } from '@/components/theme-provider';
import { Navigation } from '@/components/navigation';
import appCss from '@/styles.css?url';

const LazyServiceHubDialog = lazy(() =>
    import('@/components/service-hub-dialog').then(({ ServiceHubDialog }) => ({
        default: ServiceHubDialog,
    }))
);

type RootSearch = {
    links?: boolean;
};

export const Route = createRootRoute({
    validateSearch: (search: Record<string, unknown>): RootSearch => ({
        links: search.links === true || search.links === 'true' ? true : undefined,
    }),
    head: () => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            {
                title: 'Thaddeus Kuah',
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
    notFoundComponent: () => (
        <main className="container mx-auto p-4 pt-16">
            <h1>404</h1>
            <p>The requested page could not be found.</p>
        </main>
    ),
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
                    <Navigation />
                    {children}
                    <ServiceHubDialogSlot />
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

function ServiceHubDialogSlot() {
    const { links } = useSearch({ from: '__root__' });
    const [hasOpened, setHasOpened] = useState(links === true);

    useEffect(() => {
        if (links) setHasOpened(true);
    }, [links]);

    if (!links && !hasOpened) return null;

    return (
        <Suspense fallback={null}>
            <LazyServiceHubDialog />
        </Suspense>
    );
}
