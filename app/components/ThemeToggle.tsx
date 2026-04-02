"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
            className={`text-link hover:text-link-hover cursor-pointer transition-all ${
                mounted ? "opacity-100" : "opacity-0"
            }`}>
            {nextTheme}
        </button>
    );
}
