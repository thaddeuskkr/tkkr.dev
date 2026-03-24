"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const UNLOCK_PRESSES = 4;
const HINT_THRESHOLD = 1;
const unlockedLinks = [{ href: "/shorten", label: "shorten" }];
const navRowClass = "flex items-center gap-5";

export default function Navigation() {
    const pathname = usePathname();
    const [morePresses, setMorePresses] = useState(0);
    const [secretNavUnlocked, setSecretNavUnlocked] = useState(false);
    const isOnUnlockedRoute = unlockedLinks.some((link) => pathname === link.href);
    const showSecretNav = secretNavUnlocked || isOnUnlockedRoute;

    const updatePressCount = (nextCount: number) => {
        setMorePresses(nextCount);
    };

    const unlockSecretNav = () => {
        setSecretNavUnlocked(true);
    };

    const onMoreClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (pathname !== "/more") {
            updatePressCount(0);
            return;
        }

        if (secretNavUnlocked) {
            return;
        }

        event.preventDefault();
        const nextCount = Math.min(morePresses + 1, UNLOCK_PRESSES);
        updatePressCount(nextCount);

        if (nextCount >= UNLOCK_PRESSES) {
            updatePressCount(0);
            unlockSecretNav();
        }
    };

    const hintDots =
        pathname === "/more" && !showSecretNav && morePresses >= HINT_THRESHOLD ?
            ".".repeat(morePresses - HINT_THRESHOLD + 1)
        :   "";

    const linkClass = (href: string) =>
        `transition-colors ${
            pathname === href ?
                "text-neutral-950 font-semibold dark:text-neutral-50"
            :   "text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
        }`;

    return (
        <nav>
            <div className="flex max-w-xl flex-col gap-2 pb-5">
                <div className={navRowClass}>
                    <Link href="/" className={linkClass("/")}>
                        home
                    </Link>
                    <Link href="/projects" className={linkClass("/projects")}>
                        projects
                    </Link>
                    <Link href="/more" className={linkClass("/more")} onClick={onMoreClick}>
                        <span className="inline-flex items-center">
                            more
                            {hintDots && (
                                <span
                                    className="pl-0.5 text-neutral-400 transition-colors dark:text-neutral-500"
                                    aria-hidden="true">
                                    {hintDots}
                                </span>
                            )}
                        </span>
                    </Link>
                    <ThemeToggle />
                </div>
                {showSecretNav && (
                    <div className={navRowClass}>
                        {unlockedLinks.map((link) => (
                            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
