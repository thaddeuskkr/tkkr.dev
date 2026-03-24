"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const MORE_PRESS_KEY = "more-nav-press-count";
const UNLOCK_PRESSES = 6;
const HINT_THRESHOLD = 3;

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [morePresses, setMorePresses] = useState(0);

    useEffect(() => {
        const storedCount = window.sessionStorage.getItem(MORE_PRESS_KEY);
        if (storedCount) {
            const parsed = Number.parseInt(storedCount, 10);
            if (!Number.isNaN(parsed)) {
                setMorePresses(parsed);
            }
        }
    }, []);

    const updatePressCount = (nextCount: number) => {
        setMorePresses(nextCount);
        window.sessionStorage.setItem(MORE_PRESS_KEY, `${nextCount}`);
    };

    const onMoreClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (pathname !== "/more") {
            updatePressCount(0);
            return;
        }

        event.preventDefault();
        const nextCount = Math.min(morePresses + 1, UNLOCK_PRESSES);
        updatePressCount(nextCount);

        if (nextCount >= UNLOCK_PRESSES) {
            updatePressCount(0);
            router.push("/shorten");
            return;
        }
    };

    const hintDots =
        pathname === "/more" && morePresses >= HINT_THRESHOLD ?
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
            <div className="flex max-w-xl justify-between pb-5">
                <div className="flex items-center gap-5">
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
            </div>
        </nav>
    );
}
