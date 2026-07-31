import { useEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type RevealSectionProps = ComponentPropsWithoutRef<'section'> & {
    revealClassName?: string;
    rootMargin?: string;
    threshold?: number;
};

export function RevealSection({
    className,
    revealClassName = 'about-reveal',
    rootMargin = '0px 0px -10% 0px',
    threshold = 0.12,
    ...props
}: RevealSectionProps) {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const bounds = section.getBoundingClientRect();
        section.dataset.revealEntry =
            bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0 ? 'initial' : 'scroll';

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            section.dataset.revealState = 'visible';
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;

                section.dataset.revealState = 'visible';
                observer.unobserve(section);
            },
            {
                rootMargin,
                threshold,
            }
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, [rootMargin, threshold]);

    return (
        <section {...props} ref={sectionRef} data-reveal-state="pending" className={cn(revealClassName, className)} />
    );
}
