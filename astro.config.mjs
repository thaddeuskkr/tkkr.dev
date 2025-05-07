// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
    image: {
        domains: ["*.tkkr.dev", "tkkr.dev"],
    },
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
