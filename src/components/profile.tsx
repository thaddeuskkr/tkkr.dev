"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight, Search, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DirectoryGroup } from "@/lib/directory";
import { cn } from "@/lib/utils";
import { DirectoryEntryIcon } from "./directory-entry-icon";

export function Profile({ groups }: { groups: readonly DirectoryGroup[] }) {
    const socialLinks = groups.find((group) => group.id === "social")?.links ?? [];
    const directoryEntries = groups.find((group) => group.id === "directory")?.links ?? [];
    const [search, setSearch] = useState("");
    const pageRef = useRef<HTMLElement>(null);
    const heroRef = useRef<HTMLElement>(null);
    const directoryRef = useRef<HTMLElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const page = pageRef.current;
        const hero = heroRef.current;
        const directorySection = directoryRef.current;
        if (!page || !hero || !directorySection) return;

        let frame: number | null = null;
        let transitionUntil = 0;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const desktopScroll = window.matchMedia("(hover: hover) and (pointer: fine)");
        // Read 100svh from CSS so toolbar changes do not shift the reveal thresholds.
        let viewportHeight = Number.parseFloat(window.getComputedStyle(hero).minHeight);
        const clamp = (value: number) => Math.min(1, Math.max(0, value));
        const update = () => {
            frame = null;
            const heroBounds = hero.getBoundingClientRect();
            const directoryTop = directorySection.getBoundingClientRect().top;
            page.style.setProperty(
                "--scroll-progress",
                String(clamp(-heroBounds.top / heroBounds.height)),
            );
            page.style.setProperty(
                "--directory-reveal",
                String(
                    clamp((viewportHeight * 0.9 - directoryTop) / (viewportHeight * 0.65)),
                ),
            );
        };

        const scheduleUpdate = () => {
            if (frame === null) frame = requestAnimationFrame(update);
        };

        const onResize = () => {
            viewportHeight = Number.parseFloat(window.getComputedStyle(hero).minHeight);
            scheduleUpdate();
        };

        const onWheel = (event: WheelEvent) => {
            if (
                !desktopScroll.matches ||
                event.ctrlKey ||
                event.defaultPrevented ||
                Math.abs(event.deltaY) < 4 ||
                Math.abs(event.deltaY) <= Math.abs(event.deltaX)
            ) {
                return;
            }

            if (performance.now() < transitionUntil) {
                event.preventDefault();
                return;
            }

            const directoryStart = directorySection.getBoundingClientRect().top + window.scrollY;
            // Let oversized sections scroll normally until their boundary.
            const atHeroEnd =
                window.scrollY >= directoryStart - viewportHeight - 2 &&
                window.scrollY < directoryStart - 2;
            const atDirectoryStart = Math.abs(window.scrollY - directoryStart) <= 2;
            if ((event.deltaY > 0 && atHeroEnd) || (event.deltaY < 0 && atDirectoryStart)) {
                event.preventDefault();
                transitionUntil = performance.now() + (reducedMotion.matches ? 150 : 700);
                (event.deltaY > 0 ? directorySection : hero).scrollIntoView({
                    behavior: reducedMotion.matches ? "instant" : "smooth",
                });
            }
        };

        const onKey = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                directorySection.scrollIntoView({
                    behavior: reducedMotion.matches ? "instant" : "smooth",
                });
                searchRef.current?.focus({ preventScroll: true });
            }
        };

        update();
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("resize", onResize);
        window.addEventListener("keydown", onKey);
        const observer = new ResizeObserver(scheduleUpdate);
        observer.observe(hero);
        return () => {
            window.removeEventListener("scroll", scheduleUpdate);
            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("keydown", onKey);
            observer.disconnect();
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, []);

    const query = search.trim().toLowerCase();
    const links = directoryEntries.filter((link) =>
        [link.name, link.description, link.destination, ...(link.keywords ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(query),
    );

    return (
        <main ref={pageRef} className="profile-page relative isolate">
            <div className="landscape" aria-hidden="true" />
            <div className="landscape-shade" aria-hidden="true" />
            <section
                ref={heroRef}
                id="top"
                className="relative grid min-h-svh snap-start snap-always place-items-center px-6 pt-20 pb-30 outline-none [@media(max-width:640px)]:px-5 [@media(max-width:640px)]:pt-16"
                aria-labelledby="profile-name"
                tabIndex={-1}>
                <div className="profile-card-wrap w-full max-w-140">
                    <div
                        className={cn(
                            "w-full rounded-3xl border border-[#ffffff24] bg-[#20231feb] px-10.5 pt-8.5 pb-7 backdrop-blur-[24px]",
                            "shadow-[0_32px_90px_#07100840,inset_0_1px_0_#ffffff0a] animate-card-enter",
                            "[@media(max-width:640px)]:rounded-[20px] [@media(max-width:640px)]:px-7 [@media(max-width:640px)]:pt-7 [@media(max-width:640px)]:pb-6",
                        )}>
                        <div>
                            <h1
                                id="profile-name"
                                className="mt-3.5 mb-6.25 font-display text-[clamp(50px,5.3vw,68px)] leading-[1.04] font-normal tracking-[-1.7px] [@media(max-width:640px)]:text-[57px]">
                                Thaddeus <span className="block text-[#ddd9ca] italic">Kuah</span>
                            </h1>
                            <p className="max-w-[385px] text-sm leading-[1.85] text-pretty text-[#b5b8b0] [@media(max-width:640px)]:text-[13px]">
                                I’m a self-taught hobbyist programmer, gamer, and student who builds
                                things with care for thoughtful details and dependable systems.
                            </p>
                        </div>
                        <nav
                            className="-mx-1.75 mt-5 flex flex-wrap items-center gap-x-2 gap-y-1"
                            aria-label="Social and contact links">
                            {socialLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    target={link.href.startsWith("https:") ? "_blank" : undefined}
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-11 items-center justify-center gap-1.75 rounded-md px-1.75 text-[13px] font-medium text-[#dddcd3] transition-[color,background,transform] duration-200 ease-[ease] hover:transform-[translateY(-2px)] hover:bg-[#ffffff08] hover:text-foreground">
                                    <DirectoryEntryIcon icon={link.icon} />
                                    <span>{link.name}</span>
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>
                <a
                    href="#directory"
                    className="scroll-cue absolute bottom-7 left-1/2 z-1 flex transform-[translateX(-50%)] flex-col items-center gap-1.5 px-4 py-2 text-[11px] tracking-[0.03em] whitespace-nowrap text-[#e0e2d8] transition-colors duration-200 ease-[ease] hover:text-white">
                    <span>Scroll down to explore</span>
                    <span className="grid h-6 animate-scroll-invitation place-items-center">
                        <ArrowDown className="size-4" aria-hidden="true" />
                    </span>
                </a>
            </section>
            <section
                ref={directoryRef}
                id="directory"
                className={cn(
                    "relative grid min-h-svh snap-start snap-always place-items-center px-12 pt-20 pb-27.5 outline-none",
                    "bg-[linear-gradient(180deg,#171b17e8,#171b17f5)] before:pointer-events-none before:absolute before:-top-20 before:inset-x-0 before:h-20 before:bg-[linear-gradient(180deg,transparent,#171b17e8)] before:content-['']",
                    "[@media(640px<width<=800px)]:px-7 [@media(640px<width<=800px)]:pt-16 [@media(max-width:640px)]:px-6 [@media(max-width:640px)]:pt-10",
                )}
                aria-labelledby="directory-heading"
                tabIndex={-1}>
                <div
                    className={cn(
                        "grid w-full max-w-235 grid-cols-[280px_minmax(0,1fr)] items-start gap-21",
                        "[@media(max-width:800px)]:max-w-140 [@media(max-width:800px)]:grid-cols-1 [@media(640px<width<=800px)]:gap-7.5 [@media(max-width:640px)]:gap-6",
                    )}>
                    <div className="directory-intro pt-2">
                        <a
                            href="#top"
                            className="inline-flex min-h-11 items-center gap-2 text-[11px] text-muted-foreground transition-colors duration-200 ease-[ease] hover:text-foreground">
                            <ArrowUp className="size-3.5" aria-hidden="true" /> Back to top
                        </a>
                        <h2
                            id="directory-heading"
                            className="mt-6 mb-4 font-display text-[76px] leading-[1.1] font-normal tracking-[-1.7px] text-[#ddd9ca] [@media(max-width:800px)]:mt-3 [@media(max-width:800px)]:text-[60px]">
                            Directory
                        </h2>
                        <p className="text-[13px] leading-[1.8] text-muted-foreground">
                            Links to all the services I host.
                        </p>
                        <div className="relative mt-7 [@media(max-width:800px)]:mt-5.5">
                            <Search
                                className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <Input
                                ref={searchRef}
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Find a link…"
                                aria-label="Search directory"
                                className="h-11 rounded-xl pl-10"
                            />
                        </div>
                    </div>
                    <nav className="min-h-122.5" aria-label="Directory">
                        {links.length ?
                                links.map((link, index) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            "directory-entry group/directory-entry flex min-h-17.5 items-center gap-4 rounded-sm border-b border-[#ffffff10] px-3 py-3.5",
                                            "transition-[background] duration-200 ease-[ease] hover:bg-[#ffffff07] focus-visible:bg-[#ffffff07] [@media(max-width:640px)]:pr-2 [@media(max-width:640px)]:pl-0",
                                        )}
                                        style={{ "--order": index } as CSSProperties}>
                                        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#ffffff08] bg-[#ffffff06] text-[#c7cbbb] [&_img]:size-5.5">
                                            <DirectoryEntryIcon icon={link.icon} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-2 text-sm font-medium">
                                                {link.name}
                                                {link.access && (
                                                    <span className="rounded-[4px] border border-[#ffffff12] px-1.25 py-0.25 text-[9px] font-normal text-[#969a8d]">
                                                        Private
                                                    </span>
                                                )}
                                            </span>
                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                {link.destination}
                                            </span>
                                        </span>
                                        <ArrowUpRight
                                            className="size-4 text-[#757d6c] transition-[transform,color] duration-200 ease-[ease] group-hover/directory-entry:transform-[translate(2px,-2px)] group-hover/directory-entry:text-[#d5d9c5]"
                                            aria-hidden="true"
                                        />
                                    </a>
                                )) :
                                (
                                    <p
                                        role="status"
                                        className="py-10 text-center text-sm text-muted-foreground">
                                        No links found. Try another search.
                                    </p>
                                )}
                    </nav>
                </div>
                <footer
                    className={cn(
                        "absolute inset-x-12 bottom-6.5 flex items-center justify-between text-[10px] text-[#ffffff90]",
                        "[@media(max-width:640px)]:inset-x-6 [@media(max-width:640px)]:bottom-5.5 [@media(max-width:640px)]:flex-col [@media(max-width:640px)]:items-start [@media(max-width:640px)]:gap-1.5",
                    )}>
                    <span>© 2026 Thaddeus Kuah</span>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <a
                            href="https://unsplash.com/photos/FN-3TXezroI"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 transition-colors duration-200 ease-[ease] hover:text-white">
                            Photo by Jonathan Cooper{" "}
                            <ArrowDownRight className="size-3" aria-hidden="true" />
                        </a>
                        <a
                            href="https://selfh.st/icons/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 transition-colors duration-200 ease-[ease] hover:text-white">
                            Icons by selfh.st
                        </a>
                        <Link
                            href="/admin"
                            className="-m-1.75 inline-flex size-7 items-center justify-center gap-1.5 rounded-md opacity-75 transition-[color,opacity] duration-200 ease-[ease] hover:text-white hover:opacity-100 focus-visible:opacity-100"
                            aria-label="Admin"
                            title="Admin">
                            <Settings2 className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                        </Link>
                    </div>
                </footer>
            </section>
        </main>
    );
}
