// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [tailwindcss()],
    },
    experimental: {
        fonts: [
            {
                provider: fontProviders.google(),
                name: "Geist",
                weights: ["100 900"],
                cssVariable: "--font-geist",
                fallbacks: ["sans-serif"],
            },
            {
                provider: fontProviders.google(),
                name: "Geist Mono",
                weights: ["100 900"],
                cssVariable: "--font-geist-mono",
                fallbacks: ["monospace"],
            },
        ],
    },
});
