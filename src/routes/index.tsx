import { createFileRoute } from '@tanstack/react-router';
import { HeroPortrait } from '@/components/hero-portrait';

export const Route = createFileRoute('/')({ component: App });

function App() {
    return (
        <main className="relative min-h-svh overflow-hidden bg-background transition-colors duration-500 motion-reduce:transition-none">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -top-32 -right-40 size-120 rounded-full bg-primary/9 blur-3xl motion-safe:animate-ambient-drift dark:bg-primary/6" />
                <div className="absolute -bottom-48 -left-48 size-112 rounded-full bg-primary/6 blur-3xl motion-safe:animate-ambient-drift-reverse dark:bg-primary/4" />
            </div>

            <section
                aria-labelledby="home-heading"
                className="relative z-10 mx-auto grid min-h-svh w-full max-w-6xl items-center gap-10 px-6 pt-28 pb-12 sm:gap-12 sm:px-10 sm:pt-32 sm:pb-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.82fr)] lg:gap-20 lg:px-12"
            >
                <div>
                    <p className="mb-4 text-xs font-semibold tracking-[0.24em] text-primary uppercase motion-safe:animate-hero-eyebrow sm:text-sm">
                        Hello, I&apos;m
                    </p>
                    <h1
                        id="home-heading"
                        className="max-w-3xl text-5xl leading-[0.94] font-semibold tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl"
                    >
                        <span className="inline-block motion-safe:animate-hero-name">Thaddeus</span>{' '}
                        <span className="inline-block text-primary motion-safe:animate-hero-name-accent">Kuah</span>
                    </h1>
                    <p className="mt-7 max-w-xl text-base/7 text-pretty text-muted-foreground motion-safe:animate-hero-copy sm:text-lg/8">
                        I&apos;m a student who builds things with care for thoughtful details, dependable systems, and
                        keeping things simple.
                    </p>
                </div>

                <HeroPortrait />
            </section>
        </main>
    );
}
