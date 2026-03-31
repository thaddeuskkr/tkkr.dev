"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ThemeToggle() {
    const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
    const { theme, setTheme, resolvedTheme } = useTheme();

    if (!mounted) return null;

    const effectiveTheme = theme === "system" ? resolvedTheme : theme;
    const nextTheme = effectiveTheme === "dark" ? "light" : "dark";

    return (
        <button
            onClick={() => {
                setTheme(nextTheme);
            }}
            type="button"
            aria-label={`Switch to ${nextTheme} mode`}
            className={`cursor-pointer text-neutral-600 transition-all hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100 ${
                mounted ? "opacity-100" : "opacity-0"
            }`}>
            {nextTheme}
        </button>
    );
}
