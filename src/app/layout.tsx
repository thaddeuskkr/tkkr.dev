import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@fontsource-variable/inter";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
const description =
    "A self-taught hobbyist programmer and student who builds things with care for thoughtful details and dependable systems.";
const previewImage = {
    url: "/images/misty-mountains.jpg",
    width: 2560,
    height: 1707,
    alt: "Misty mountains and forest",
};
export const metadata: Metadata = {
    metadataBase: new URL("https://tkkr.dev"),
    title: "Thaddeus Kuah — tkkr.dev",
    description,
    openGraph: {
        title: "Thaddeus Kuah",
        description,
        type: "website",
        siteName: "tkkr.dev",
        url: "/",
        images: [previewImage],
    },
    twitter: {
        card: "summary_large_image",
        title: "Thaddeus Kuah",
        description,
        images: [previewImage],
    },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark" data-scroll-behavior="smooth">
            <body>
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}
