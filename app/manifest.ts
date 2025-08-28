import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "tkkr.dev",
        short_name: "tkkr",
        description: "thaddeus kuah’s personal website",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [
            {
                src: "/icon.png",
                sizes: "any",
                type: "image/png",
            },
            {
                src: "/favicon.ico",
                sizes: "any",
                type: "image/x-icon",
            },
        ],
    };
}
