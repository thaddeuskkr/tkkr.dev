export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "theme" as const;

export function readStoredTheme(): Theme | null {
    try {
        const v = window.localStorage.getItem(THEME_STORAGE_KEY);
        return v === "dark" || v === "light" ? (v as Theme) : null;
    } catch {
        return null;
    }
}

export function setStoredTheme(theme: Theme): void {
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
}

export function getSystemPrefersDark(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(theme: Theme): void {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
}

export function subscribeSystemTheme(onChange: (isDark: boolean) => void): () => void {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => onChange(e.matches);
    if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }
    if (typeof mql.addListener === "function") {
        mql.addListener(handler);
        return () => mql.removeListener(handler);
    }
    return () => {};
}

export function toggleTheme(currentIsDark: boolean): Theme {
    const next: Theme = currentIsDark ? "light" : "dark";
    applyTheme(next);
    setStoredTheme(next);
    return next;
}
