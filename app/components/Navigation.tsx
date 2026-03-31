"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const UNLOCK_PRESSES = 5;
const HINT_THRESHOLD = 2;

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [morePresses, setMorePresses] = useState(0);

    const onMoreClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (pathname !== "/more") {
            setMorePresses(0);
            return;
        }

        event.preventDefault();
        const nextCount = Math.min(morePresses + 1, UNLOCK_PRESSES);
        setMorePresses(nextCount);

        if (nextCount >= UNLOCK_PRESSES) {
            setMorePresses(0);
            router.push("/admin");
        }
    };

    const hintDots =
        pathname === "/more" && morePresses >= HINT_THRESHOLD ?
            ".".repeat(morePresses - HINT_THRESHOLD + 1)
        :   "";

    const linkClass = (href: string) =>
        `transition-colors ${
            pathname === href ?
                "text-body-strong font-semibold"
            :   "text-link hover:text-link-hover"
        }`;

    return (
        <nav>
            <div className="flex max-w-xl items-center gap-5 pb-5">
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
                                className="pl-0.5 text-body-faint transition-colors"
                                aria-hidden="true">
                                {hintDots}
                            </span>
                        )}
                    </span>
                </Link>
                <ThemeToggle />
            </div>
        </nav>
    );
}

