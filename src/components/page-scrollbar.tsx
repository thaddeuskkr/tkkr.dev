import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const MIN_THUMB_HEIGHT = 48;

type ScrollMetrics = {
    maxScroll: number;
    maxThumbOffset: number;
};

type DragState = {
    pointerId: number;
    startY: number;
    startScroll: number;
};

export function PageScrollbar() {
    const trackRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const metricsRef = useRef<ScrollMetrics>({ maxScroll: 0, maxThumbOffset: 0 });
    const dragRef = useRef<DragState | null>(null);

    useEffect(() => {
        const root = document.documentElement;
        const track = trackRef.current;
        const thumb = thumbRef.current;

        if (!track || !thumb) return;

        let animationFrame = 0;

        const update = () => {
            animationFrame = 0;

            const viewportHeight = root.clientHeight;
            const pageHeight = root.scrollHeight;
            const trackHeight = track.clientHeight;
            const maxScroll = Math.max(pageHeight - viewportHeight, 0);
            const scrollable = maxScroll > 1 && trackHeight > 0;

            track.dataset.scrollable = String(scrollable);

            if (!scrollable) {
                metricsRef.current = { maxScroll: 0, maxThumbOffset: 0 };
                return;
            }

            const thumbHeight = Math.min(
                Math.max((trackHeight * viewportHeight) / pageHeight, MIN_THUMB_HEIGHT),
                trackHeight
            );
            const maxThumbOffset = Math.max(trackHeight - thumbHeight, 0);
            const thumbOffset = (Math.min(Math.max(window.scrollY, 0), maxScroll) / maxScroll) * maxThumbOffset;

            metricsRef.current = { maxScroll, maxThumbOffset };
            thumb.style.height = `${thumbHeight}px`;
            thumb.style.transform = `translate3d(-50%, ${thumbOffset}px, 0)`;
        };

        const scheduleUpdate = () => {
            if (animationFrame) return;
            animationFrame = window.requestAnimationFrame(update);
        };

        const handleWindowPointerMove = (event: PointerEvent) => {
            const drag = dragRef.current;
            const { maxScroll, maxThumbOffset } = metricsRef.current;

            if (!drag || drag.pointerId !== event.pointerId || maxThumbOffset <= 0) return;

            event.preventDefault();

            const top = Math.min(
                Math.max(drag.startScroll + ((event.clientY - drag.startY) / maxThumbOffset) * maxScroll, 0),
                maxScroll
            );
            window.scrollTo({ top });
        };

        const finishDrag = (pointerId?: number) => {
            const drag = dragRef.current;

            if (!drag || (pointerId !== undefined && drag.pointerId !== pointerId)) return;

            dragRef.current = null;
            delete root.dataset.pageScrollbarDragging;
            if (track.hasPointerCapture(drag.pointerId)) track.releasePointerCapture(drag.pointerId);
        };

        const handleWindowPointerEnd = (event: PointerEvent) => finishDrag(event.pointerId);
        const handleWindowBlur = () => finishDrag();

        const resizeObserver = new ResizeObserver(scheduleUpdate);
        resizeObserver.observe(root);
        resizeObserver.observe(document.body);
        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate, { passive: true });
        window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
        window.addEventListener('pointerup', handleWindowPointerEnd);
        window.addEventListener('pointercancel', handleWindowPointerEnd);
        window.addEventListener('blur', handleWindowBlur);
        update();

        return () => {
            if (animationFrame) window.cancelAnimationFrame(animationFrame);
            resizeObserver.disconnect();
            window.removeEventListener('scroll', scheduleUpdate);
            window.removeEventListener('resize', scheduleUpdate);
            window.removeEventListener('pointermove', handleWindowPointerMove);
            window.removeEventListener('pointerup', handleWindowPointerEnd);
            window.removeEventListener('pointercancel', handleWindowPointerEnd);
            window.removeEventListener('blur', handleWindowBlur);
            delete root.dataset.pageScrollbarDragging;
        };
    }, []);

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;

        const thumb = thumbRef.current;
        const { maxScroll, maxThumbOffset } = metricsRef.current;

        if (!thumb || maxScroll <= 0 || maxThumbOffset <= 0) return;

        event.preventDefault();

        const thumbBounds = thumb.getBoundingClientRect();
        const pressedThumb = event.clientY >= thumbBounds.top && event.clientY <= thumbBounds.bottom;

        if (!pressedThumb) {
            const trackBounds = event.currentTarget.getBoundingClientRect();
            const thumbOffset = Math.min(
                Math.max(event.clientY - trackBounds.top - thumbBounds.height / 2, 0),
                maxThumbOffset
            );
            const top = (thumbOffset / maxThumbOffset) * maxScroll;

            window.scrollTo({
                top,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            });
            return;
        }

        window.getSelection()?.removeAllRanges();
        dragRef.current = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startScroll: window.scrollY,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        document.documentElement.dataset.pageScrollbarDragging = 'true';
    };

    return (
        <>
            <div
                aria-hidden="true"
                className="page-scrollbar-drag-shield fixed inset-0 z-39 hidden cursor-default touch-none select-none"
            />
            <div
                ref={trackRef}
                aria-hidden="true"
                className="page-scrollbar group/scrollbar pointer-events-none fixed inset-y-2 right-1 z-40 hidden w-3 cursor-default touch-none opacity-0 transition-opacity duration-300 select-none data-[scrollable=true]:pointer-events-auto data-[scrollable=true]:opacity-100"
                onPointerDown={handlePointerDown}
            >
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 rounded-full bg-[color-mix(in_oklab,var(--border)_70%,transparent)] opacity-0 transition-opacity duration-200 group-hover/scrollbar:opacity-100" />
                <span
                    ref={thumbRef}
                    className="absolute top-0 left-1/2 min-h-12 w-1 rounded-full bg-[color-mix(in_oklab,var(--muted-foreground)_38%,transparent)] transition-[width,background-color] duration-200 will-change-transform group-hover/scrollbar:w-1.5 group-hover/scrollbar:bg-[color-mix(in_oklab,var(--primary)_58%,var(--muted-foreground))] group-active/scrollbar:bg-[color-mix(in_oklab,var(--primary)_76%,var(--muted-foreground))]"
                />
            </div>
        </>
    );
}
