"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { readStoredTheme, subscribeSystemTheme, toggleTheme } from "@/lib/theme";

export default function Navigation() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const isDarkFromDOM = document.documentElement.classList.contains("dark");
        setIsDark(isDarkFromDOM);
        setMounted(true);

        document.documentElement.classList.remove("theme-preload");

        const stored = readStoredTheme();
        if (!stored) {
            return subscribeSystemTheme((isDark) => {
                setIsDark(isDark);
            });
        }
    }, []);

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
                    <Link href="/more" className={linkClass("/more")}>
                        more
                    </Link>
                    <button
                        onClick={() => {
                            const nextTheme = toggleTheme(isDark);
                            setIsDark(nextTheme === "dark");
                        }}
                        className={`${linkClass("")} cursor-pointer transition-opacity ${
                            mounted ? "opacity-100" : "opacity-0"
                        }`}>
                        {mounted ?
                            isDark ?
                                "light"
                            :   "dark"
                        :   "dark"}
                    </button>
                </div>
            </div>
        </nav>
    );
}
