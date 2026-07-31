import { createFileRoute } from '@tanstack/react-router';
import type { CSSProperties } from 'react';

import { RevealSection } from '@/components/reveal-section';

const experience = [
    {
        organisation: 'Suzhou TF-AMD',
        role: 'Intern',
        detail: 'Full-time · Overseas',
        period: 'Jun 2026 — Present',
        dateTime: '2026-06',
    },
    {
        organisation: 'Apple',
        role: 'Specialist',
        detail: 'Part-time',
        period: 'Aug 2025 — Mar 2026',
        dateTime: '2025-08',
    },
    {
        organisation: 'KOI Thé',
        role: 'Tea Barista',
        detail: 'Part-time',
        period: 'Mar 2025 — Apr 2025',
        dateTime: '2025-03',
    },
    {
        organisation: 'Noel Gifts',
        role: 'Operations Assistant',
        detail: 'Part-time',
        period: 'Dec 2023 — Mar 2024',
        dateTime: '2023-12',
    },
] as const;

const education = [
    {
        organisation: 'Nanyang Polytechnic',
        role: 'Diploma in Information Technology',
        detail: 'Year 3',
        period: '2024 — Present',
        dateTime: '2024',
    },
    {
        organisation: "St. Joseph's Institution",
        role: 'O-Level Programme',
        detail: '',
        period: '2019 — 2023',
        dateTime: '2019',
    },
] as const;

const interests = ['Gaming', 'Systems administration', 'Programming', 'Photography', 'Listening to music'] as const;

export const Route = createFileRoute('/about')({
    head: () => ({
        meta: [
            { title: 'About — Thaddeus Kuah' },
            {
                name: 'description',
                content: 'Experience, education, and interests of Thaddeus Kuah.',
            },
        ],
    }),
    component: AboutPage,
});

function AboutPage() {
    return (
        <main className="relative min-h-svh overflow-clip bg-background transition-colors duration-500 motion-reduce:transition-none">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -top-48 -right-56 size-136 rounded-full bg-primary/8 blur-3xl motion-safe:animate-ambient-drift dark:bg-primary/5" />
                <div className="absolute top-184 -left-72 size-128 rounded-full bg-primary/5 blur-3xl motion-safe:animate-ambient-drift-reverse dark:bg-primary/3" />
            </div>

            <article className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-32 pb-20 sm:px-10 sm:pt-40 sm:pb-28 lg:px-12">
                <header className="grid gap-8 pb-20 sm:pb-28 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.72fr)] lg:items-end lg:gap-20">
                    <div>
                        <p className="mb-5 text-xs font-semibold tracking-[0.24em] text-primary uppercase motion-safe:animate-hero-eyebrow sm:text-sm">
                            About
                        </p>
                        <h1 className="max-w-3xl text-5xl leading-[0.96] font-semibold tracking-tighter text-balance motion-safe:animate-hero-name sm:text-7xl">
                            Curious about what&apos;s running <span className="text-primary">underneath.</span>
                        </h1>
                    </div>

                    <div className="space-y-5 text-base/7 text-pretty text-muted-foreground motion-safe:animate-hero-copy sm:text-lg/8">
                        <p>
                            I&apos;m Thaddeus, an Information Technology student in Singapore with hands-on experience
                            in full-stack web development and systems administration.
                        </p>
                        <p>
                            I&apos;m highly passionate about technology and enjoy understanding how systems fit
                            together, then making them dependable, thoughtful, and simple to use.
                        </p>
                    </div>
                </header>

                <TimelineSection
                    eyebrow="01"
                    title="Experience"
                    description="Work across technology, retail, F&B, and operations."
                    items={experience}
                />

                <TimelineSection
                    eyebrow="02"
                    title="Education"
                    description="The formal side of an otherwise very hands-on education."
                    items={education}
                />

                <RevealSection
                    aria-labelledby="interests-heading"
                    className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16"
                >
                    <SectionHeading
                        eyebrow="03"
                        title="Beyond work"
                        description="The things I keep coming back to."
                        headingId="interests-heading"
                    />

                    <ol className="border-t border-border/70">
                        {interests.map((interest, index) => (
                            <li
                                key={interest}
                                data-reveal-item
                                style={{ '--reveal-delay': `${index * 70}ms` } as CSSProperties}
                                className="group flex items-center justify-between border-b border-border/70 py-4 transition-colors duration-300 hover:border-primary/30"
                            >
                                <span className="text-xl font-medium tracking-tight transition-transform duration-300 motion-safe:group-hover:translate-x-1 sm:text-2xl">
                                    {interest}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground/70">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                            </li>
                        ))}
                    </ol>
                </RevealSection>
            </article>
        </main>
    );
}

type TimelineItem = {
    readonly organisation: string;
    readonly role: string;
    readonly detail: string;
    readonly period: string;
    readonly dateTime: string;
};

function TimelineSection({
    eyebrow,
    title,
    description,
    items,
}: {
    eyebrow: string;
    title: string;
    description: string;
    items: readonly TimelineItem[];
}) {
    const headingId = `${title.toLowerCase()}-heading`;

    return (
        <RevealSection
            aria-labelledby={headingId}
            className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16"
        >
            <SectionHeading eyebrow={eyebrow} title={title} description={description} headingId={headingId} />

            <ol className="border-t border-border/70">
                {items.map(({ organisation, role, detail, period, dateTime }, index) => (
                    <li
                        key={`${organisation}-${role}`}
                        data-reveal-item
                        style={{ '--reveal-delay': `${index * 70}ms` } as CSSProperties}
                        className="group grid gap-2 border-b border-border/70 py-6 transition-colors duration-300 hover:border-primary/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8"
                    >
                        <div className="transition-transform duration-300 motion-safe:group-hover:translate-x-1">
                            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{organisation}</h3>
                            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                {role}
                                {detail && <span className="text-muted-foreground/60"> · {detail}</span>}
                            </p>
                        </div>
                        <time dateTime={dateTime} className="text-sm font-medium text-muted-foreground sm:pt-1">
                            {period}
                        </time>
                    </li>
                ))}
            </ol>
        </RevealSection>
    );
}

function SectionHeading({
    eyebrow,
    title,
    description,
    headingId,
}: {
    eyebrow: string;
    title: string;
    description: string;
    headingId: string;
}) {
    return (
        <div data-reveal-heading>
            <p className="mb-2 font-mono text-xs text-primary">{eyebrow}</p>
            <h2 id={headingId} className="text-sm font-semibold tracking-[0.16em] uppercase">
                {title}
            </h2>
            <p className="mt-3 max-w-48 text-sm/6 text-muted-foreground">{description}</p>
        </div>
    );
}
