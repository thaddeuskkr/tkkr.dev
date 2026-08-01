import { createFileRoute } from '@tanstack/react-router';

import { Links } from '@/components/links';

export const Route = createFileRoute('/links')({
    head: () => ({
        meta: [
            { title: 'Quick links — Thaddeus Kuah' },
            {
                name: 'description',
                content: 'Social profiles and public services maintained by Thaddeus Kuah.',
            },
        ],
    }),
    component: LinksPage,
});

function LinksPage() {
    return (
        <main className="relative min-h-svh overflow-clip bg-background transition-colors duration-500 motion-reduce:transition-none">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -top-52 -right-56 size-136 rounded-full bg-primary/15 blur-3xl motion-safe:animate-ambient-drift dark:bg-primary/6" />
                <div className="absolute top-160 -left-72 size-128 rounded-full bg-primary/13 blur-3xl motion-safe:animate-ambient-drift-reverse dark:bg-primary/4" />
            </div>

            <article className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-32 pb-20 sm:px-10 sm:pt-40 sm:pb-28 lg:px-12">
                <h1 className="sr-only">Quick links</h1>

                <Links variant="page" />
            </article>
        </main>
    );
}
