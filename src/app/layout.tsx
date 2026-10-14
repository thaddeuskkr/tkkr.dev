import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
const description =
    "A self-taught hobbyist programmer and student who builds things with care for thoughtful details and dependable systems.";
export const metadata: Metadata = {
    title: "Thaddeus Kuah — tkkr.dev",
    description,
    openGraph: {
        title: "Thaddeus Kuah",
        description,
        type: "website",
    },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark" data-scroll-behavior="smooth">
            <body>{children}</body>
        </html>
    );
}
