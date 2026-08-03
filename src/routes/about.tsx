import { createFileRoute } from '@tanstack/react-router';
import type { CSSProperties, ReactNode } from 'react';

import { RevealSection } from '@/components/reveal-section';

const experience = [
    {
        organisation: 'TF-AMD',
        role: 'Intern · Overseas (Suzhou, China)',
        period: 'Jun 2026 — Present',
        dateTime: '2026-06',
    },
    {
        organisation: 'Apple',
        role: 'Specialist · Part-time',
        period: 'Aug 2025 — Mar 2026',
        dateTime: '2025-08',
    },
    {
        organisation: 'KOI Thé',
        role: 'Tea Barista · Part-time',
        period: 'Mar 2025 — Apr 2025',
        dateTime: '2025-03',
    },
    {
        organisation: 'Noel Gifts',
        role: 'Operations Assistant · Part-time',
        period: 'Dec 2023 — Mar 2024',
        dateTime: '2023-12',
    },
] as const;

const education = [
    {
        organisation: 'Nanyang Polytechnic',
        role: 'Diploma in Information Technology · Year 3',
        period: '2024 — Present',
        dateTime: '2024',
    },
    {
        organisation: "St. Joseph's Institution",
        role: 'O-Level Programme',
        period: '2019 — 2023',
        dateTime: '2019',
    },
] as const;

type Interest = {
    title: string;
    description: string;
};

const interests: readonly Interest[] = [
    {
        title: 'Gaming',
        description:
            'I play many online multiplayer and gacha games among others, including Overwatch, League of Legends, Minecraft, Roblox, Honkai: Star Rail, and more.',
    },
    {
        title: 'Systems administration',
        description:
            'I manage and maintain two servers, one cloud-based and one local. These two servers host most of my infrastructure and self-hosted services.',
    },
    {
        title: 'Programming',
        description:
            'I enjoy building web applications and exploring new technologies, and am well-versed in many programming languages, including TypeScript, Python, and HTML/CSS.',
    },
    {
        title: 'Photography',
        description:
            'I enjoy capturing landscapes and moments using my Nikon Z50ii, especially when traveling. I have a pretty good understanding of photography fundamentals and techniques.',
    },
    {
        title: 'Listening to music',
        description:
            'I regularly listen to music, though I usually stick to a selection of genres without exploring much. These include pop, k-pop, j-pop and some indie music.',
    },
];

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
        <main className="relative min-h-svh overflow-hidden text-foreground">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 -right-32 size-128 rounded-full bg-primary/15 blur-3xl motion-safe:animate-ambient-drift dark:bg-primary/6" />
                <div className="absolute top-184 -left-56 size-136 rounded-full bg-primary/13 blur-3xl motion-safe:animate-ambient-drift-reverse dark:bg-primary/4" />
                <div className="absolute -right-48 bottom-24 size-120 rounded-full bg-primary/12 blur-3xl motion-safe:animate-ambient-drift dark:bg-primary/4" />
            </div>

            <article className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-32 pb-16 sm:px-10 sm:pt-40 sm:pb-24 lg:px-12">
                <header className="about-page-hero pb-16 sm:pb-24">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(17rem,0.72fr)] lg:items-center lg:gap-20">
                        <h1
                            data-about-enter
                            style={{ '--about-delay': '100ms' } as CSSProperties}
                            className="max-w-2xl text-4xl leading-[1.04] font-semibold tracking-[-0.045em] text-balance sm:text-6xl"
                        >
                            Technology should feel considered, not complicated.
                        </h1>

                        <div className="space-y-5 text-base/7 text-pretty text-muted-foreground">
                            <p data-about-enter style={{ '--about-delay': '300ms' } as CSSProperties}>
                                I&apos;m an Information Technology student in Singapore with hands-on experience in
                                full-stack web development and systems administration.
                            </p>
                            <p data-about-enter style={{ '--about-delay': '430ms' } as CSSProperties}>
                                I&apos;m passionate about technology and enjoy understanding how systems fit together,
                                then making them dependable, thoughtful, and simple to use.
                            </p>
                        </div>
                    </div>
                </header>

                <TimelineSection
                    title="Experience"
                    description="Work across technology, retail, F&B, and operations."
                    items={experience}
                />

                <TimelineSection
                    title="Education"
                    description="The formal side of an otherwise hands-on education."
                    items={education}
                />

                <AboutSection title="Hobbies" description="The things I keep coming back to.">
                    <ol className="relative border-t border-transparent" data-reveal-list>
                        {interests.map(({ title, description }, index) => (
                            <li
                                key={title}
                                data-reveal-item
                                style={{ '--about-delay': `${index * 90}ms` } as CSSProperties}
                                className="group border-b border-b-transparent py-5"
                            >
                                <div className="transition-transform duration-300 motion-safe:group-hover:translate-x-1">
                                    <h3 className="font-semibold tracking-tight">{title}</h3>
                                    {description && (
                                        <p className="mt-1 max-w-2xl text-sm/6 text-muted-foreground">{description}</p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </AboutSection>
            </article>
        </main>
    );
}

type TimelineItem = {
    readonly organisation: string;
    readonly role: string;
    readonly period: string;
    readonly dateTime: string;
};

function TimelineSection({
    title,
    description,
    items,
}: {
    title: string;
    description: string;
    items: readonly TimelineItem[];
}) {
    return (
        <AboutSection title={title} description={description}>
            <ol className="relative border-t border-transparent" data-reveal-list>
                {items.map((item, index) => (
                    <li
                        key={`${item.organisation}-${item.role}`}
                        data-reveal-item
                        style={{ '--about-delay': `${index * 100}ms` } as CSSProperties}
                        className="group grid gap-2 border-b border-b-transparent py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8"
                    >
                        <div className="transition-transform duration-300 motion-safe:group-hover:translate-x-1">
                            <h3 className="font-semibold tracking-tight">{item.organisation}</h3>
                            <p className="mt-1 text-sm/6 text-muted-foreground">{item.role}</p>
                        </div>
                        <time
                            dateTime={item.dateTime}
                            className="text-sm text-muted-foreground transition-transform duration-300 motion-safe:max-sm:group-hover:translate-x-1 sm:pt-0.5"
                        >
                            {item.period}
                        </time>
                    </li>
                ))}
            </ol>
        </AboutSection>
    );
}

function AboutSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    const headingId = `about-${title.toLowerCase().replaceAll(' ', '-')}`;

    return (
        <RevealSection
            aria-labelledby={headingId}
            revealClassName="about-page-reveal"
            className="about-page-section relative grid gap-10 pt-10 sm:gap-14 sm:pt-14 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-12 md:py-16"
        >
            <div data-reveal-heading className="border-l-2 border-l-transparent pl-4 md:border-l-0 md:pl-0">
                <h2 id={headingId} className="text-xl font-semibold tracking-tight md:text-lg">
                    {title}
                </h2>
                <p className="mt-2 max-w-xl text-sm/6 text-muted-foreground md:max-w-44">{description}</p>
            </div>
            {children}
        </RevealSection>
    );
}
