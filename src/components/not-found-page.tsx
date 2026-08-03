import { ArrowLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { notFoundStatusPage } from '@/lib/status-pages';
import type { StatusPageDefinition } from '@/lib/status-pages';
import { cn } from '@/lib/utils';

type StatusPageProps = {
    page: StatusPageDefinition;
};

export function NotFoundPage() {
    return <StatusPage page={notFoundStatusPage} />;
}

export function StatusPage({ page }: StatusPageProps) {
    const ActionIcon =
        page.action.icon === 'retry' ? RotateCcw : page.action.icon === 'open' ? ArrowUpRight : ArrowLeft;

    return (
        <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -right-40 size-120 rounded-full bg-primary/15 blur-3xl motion-safe:animate-ambient-drift dark:bg-primary/6" />
                <div className="absolute -bottom-48 -left-48 size-112 rounded-full bg-primary/13 blur-3xl motion-safe:animate-ambient-drift-reverse dark:bg-primary/4" />
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent" />
                <span className="absolute right-[-0.06em] bottom-[-0.22em] font-mono text-[clamp(11rem,34vw,30rem)] leading-none font-semibold -tracking-widest text-primary/[0.07] select-none dark:text-primary/4.5">
                    {page.status}
                </span>
            </div>

            <section
                aria-labelledby="status-heading"
                className="relative z-10 mx-auto grid min-h-svh w-full max-w-6xl items-center px-6 pt-28 pb-14 sm:px-10 sm:pt-32 sm:pb-16 lg:px-12"
            >
                <div className="max-w-3xl">
                    <p className="mb-4 font-mono text-xs font-semibold tracking-[0.12em] text-primary uppercase motion-safe:animate-hero-eyebrow sm:text-sm">
                        {page.status} / {page.label}
                    </p>
                    <h1
                        id="status-heading"
                        className="text-5xl leading-[0.96] font-semibold tracking-[-0.055em] text-balance motion-safe:animate-hero-name sm:text-7xl lg:text-8xl"
                    >
                        {page.heading}
                    </h1>
                    <p className="mt-7 max-w-xl text-base/7 text-pretty text-muted-foreground motion-safe:animate-hero-copy sm:text-lg/8">
                        {page.description}
                    </p>
                    <a
                        href={page.action.href}
                        className={cn(
                            buttonVariants({ size: 'lg' }),
                            'mt-8 h-11 rounded-xl px-4 text-sm shadow-[0_14px_34px_-18px_var(--primary)] motion-safe:animate-hero-copy motion-safe:hover:-translate-y-0.5'
                        )}
                    >
                        <ActionIcon data-icon="inline-start" aria-hidden="true" />
                        {page.action.label}
                    </a>
                </div>
            </section>
        </main>
    );
}
