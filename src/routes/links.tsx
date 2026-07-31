import { createFileRoute } from '@tanstack/react-router';

import { ServiceHub } from '@/components/service-hub';

export const Route = createFileRoute('/links')({
    head: () => ({
        meta: [
            { title: 'Links & services — Thaddeus Kuah' },
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
                <div className="absolute -top-52 -right-56 size-136 rounded-full bg-primary/8 blur-3xl motion-safe:animate-ambient-drift dark:bg-primary/5" />
                <div className="absolute top-160 -left-72 size-128 rounded-full bg-primary/5 blur-3xl motion-safe:animate-ambient-drift-reverse dark:bg-primary/3" />
            </div>

            <article className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-32 pb-20 sm:px-10 sm:pt-40 sm:pb-28 lg:px-12">
                <header className="max-w-3xl pb-14 sm:pb-18">
                    <p className="mb-5 text-xs font-semibold tracking-[0.24em] text-primary uppercase motion-safe:animate-hero-eyebrow sm:text-sm">
                        Directory
                    </p>
                    <h1 className="text-5xl leading-[0.96] font-semibold tracking-tighter text-balance sm:text-7xl">
                        <span className="inline-block motion-safe:animate-hero-name">Links</span>{' '}
                        <span className="inline-block text-primary motion-safe:animate-hero-name-accent">
                            &amp; services.
                        </span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-base/7 text-pretty text-muted-foreground motion-safe:animate-hero-copy sm:text-lg/8">
                        The places I&apos;m active and the public entry points into the systems I maintain.
                    </p>
                </header>

                <ServiceHub variant="page" />
            </article>
        </main>
    );
}
