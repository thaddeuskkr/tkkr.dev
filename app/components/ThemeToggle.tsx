"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

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
            className={`cursor-pointer text-link transition-all hover:text-link-hover ${
                mounted ? "opacity-100" : "opacity-0"
            }`}>
            {nextTheme}
        </button>
    );
}

