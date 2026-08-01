import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const MAX_TILT_X = 4;
const MAX_TILT_Y = 5;
const MAX_SHIFT = 3;

export function HeroPortrait() {
    const portraitRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    const resetPortrait = useCallback(() => {
        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        const portrait = portraitRef.current;
        if (!portrait) return;

        portrait.style.setProperty('--portrait-rotate-x', '0deg');
        portrait.style.setProperty('--portrait-rotate-y', '0deg');
        portrait.style.setProperty('--portrait-shift-x', '0px');
        portrait.style.setProperty('--portrait-shift-y', '0px');
        portrait.style.setProperty('--portrait-glow-x', '50%');
        portrait.style.setProperty('--portrait-glow-y', '38%');
        delete portrait.dataset.tilting;
    }, []);

    useEffect(() => {
        const resetOutsidePortrait = (event: PointerEvent) => {
            const portrait = portraitRef.current;
            if (!portrait || portrait.dataset.tilting !== 'true') return;

            const bounds = portrait.getBoundingClientRect();
            const isOutside =
                event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom;

            if (isOutside) resetPortrait();
        };

        window.addEventListener('pointermove', resetOutsidePortrait, { passive: true });
        return () => {
            window.removeEventListener('pointermove', resetOutsidePortrait);
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [resetPortrait]);

    const movePortrait = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const clientX = event.clientX;
        const clientY = event.clientY;
        event.currentTarget.dataset.tilting = 'true';

        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = window.requestAnimationFrame(() => {
            const portrait = portraitRef.current;
            if (!portrait) return;

            const bounds = portrait.getBoundingClientRect();
            const horizontal = Math.min(1, Math.max(-1, ((clientX - bounds.left) / bounds.width - 0.5) * 2));
            const vertical = Math.min(1, Math.max(-1, ((clientY - bounds.top) / bounds.height - 0.5) * 2));

            portrait.style.setProperty('--portrait-rotate-x', `${(-vertical * MAX_TILT_X).toFixed(2)}deg`);
            portrait.style.setProperty('--portrait-rotate-y', `${(horizontal * MAX_TILT_Y).toFixed(2)}deg`);
            portrait.style.setProperty('--portrait-shift-x', `${(horizontal * MAX_SHIFT).toFixed(2)}px`);
            portrait.style.setProperty('--portrait-shift-y', `${(vertical * MAX_SHIFT).toFixed(2)}px`);
            portrait.style.setProperty('--portrait-glow-x', `${((horizontal + 1) * 50).toFixed(1)}%`);
            portrait.style.setProperty('--portrait-glow-y', `${((vertical + 1) * 50).toFixed(1)}%`);
            animationFrameRef.current = null;
        });
    };

    return (
        <div className="motion-safe:animate-portrait-enter">
            <div className="motion-safe:animate-portrait-float">
                <div
                    ref={portraitRef}
                    onPointerMove={movePortrait}
                    onPointerLeave={resetPortrait}
                    onMouseLeave={resetPortrait}
                    className="hero-portrait group/portrait relative mx-auto w-full max-w-92 transition-transform duration-180 ease-[cubic-bezier(0.2,0.75,0.25,1)] will-change-transform transform-3d motion-reduce:transform-none motion-reduce:transition-none motion-reduce:will-change-auto lg:mr-0"
                >
                    <div
                        aria-hidden="true"
                        className="hero-portrait__frame absolute -inset-2 z-0 rounded-[2rem] border border-primary/15 bg-primary/6 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none dark:border-primary/10"
                    />
                    <figure className="relative z-10 aspect-5/6 transform-[translateZ(18px)] overflow-hidden rounded-[1.7rem] border border-border/80 bg-muted shadow-[0_24px_70px_-38px_color-mix(in_oklch,var(--primary)_70%,transparent)] sm:aspect-5/7">
                        <img
                            src="/robin.jpeg"
                            alt="Robin - Honkai Star Rail"
                            decoding="async"
                            fetchPriority="high"
                            className="size-full object-cover object-[50%_38%] will-change-transform motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-out motion-safe:group-hover/portrait:scale-[1.035]"
                        />
                        <div
                            aria-hidden="true"
                            className="hero-portrait__glow absolute inset-0 opacity-0 transition-opacity duration-350 ease-[ease] motion-reduce:transition-none"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute inset-y-[-10%] left-[-45%] w-1/3 bg-linear-to-r from-transparent via-white/18 to-transparent opacity-0 blur-sm motion-safe:animate-portrait-sheen"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 ring-1 ring-white/20 ring-inset dark:ring-white/10"
                        />
                    </figure>
                </div>
            </div>
        </div>
    );
}
