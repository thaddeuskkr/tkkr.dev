"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navigation() {
    const pathname = usePathname();

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
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}
