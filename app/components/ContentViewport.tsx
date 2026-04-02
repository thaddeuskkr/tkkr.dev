"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function ContentViewport({ children }: { children: React.ReactNode }) {
    const fadeSize = 24;
    const pathname = usePathname();
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [showTopFade, setShowTopFade] = useState(false);
    const [showBottomFade, setShowBottomFade] = useState(false);

    useEffect(() => {
        const viewport = viewportRef.current;
        const content = contentRef.current;

        if (!viewport || !content) return;

        const updateFadeState = () => {
            const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
            const hasOverflow = maxScrollTop > 1;

            setShowTopFade(hasOverflow && viewport.scrollTop > 1);
            setShowBottomFade(hasOverflow && viewport.scrollTop < maxScrollTop - 1);
        };

        viewport.scrollTo({ top: 0, behavior: "auto" });
        updateFadeState();

        viewport.addEventListener("scroll", updateFadeState, { passive: true });

        const resizeObserver = new ResizeObserver(() => {
            updateFadeState();
        });

        resizeObserver.observe(viewport);
        resizeObserver.observe(content);
        window.addEventListener("resize", updateFadeState);

        return () => {
            viewport.removeEventListener("scroll", updateFadeState);
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateFadeState);
        };
    }, [pathname]);

    const maskImage =
        showTopFade && showBottomFade ?
            `linear-gradient(to bottom, transparent 0, black ${fadeSize}px, black calc(100% - ${fadeSize}px), transparent 100%)`
        : showTopFade ? `linear-gradient(to bottom, transparent 0, black ${fadeSize}px, black 100%)`
        : showBottomFade ?
            `linear-gradient(to bottom, black 0, black calc(100% - ${fadeSize}px), transparent 100%)`
        :   "none";

    return (
        <div className="relative min-h-0 overflow-hidden">
            <div
                ref={viewportRef}
                className="h-full overflow-y-auto overscroll-contain"
                style={{
                    WebkitMaskImage: maskImage,
                    maskImage,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                }}>
                <div ref={contentRef}>{children}</div>
            </div>
        </div>
    );
}
