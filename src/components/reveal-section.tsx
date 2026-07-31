import { useEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

export function RevealSection({ className, ...props }: ComponentPropsWithoutRef<'section'>) {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

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
                rootMargin: '0px 0px -10% 0px',
                threshold: 0.12,
            }
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section {...props} ref={sectionRef} data-reveal-state="pending" className={cn('about-reveal', className)} />
    );
}
