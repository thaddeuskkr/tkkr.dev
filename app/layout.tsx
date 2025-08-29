import "@/globals.css";
import { Instrument_Sans } from "next/font/google";
import Navigation from "@/components/Navigation";
import Summary from "@/components/Summary";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import Script from "next/script";

const font = Instrument_Sans({
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Thaddeus Kuah",
    applicationName: "tkkr.dev",
    authors: [{ name: "Thaddeus Kuah", url: "https://tkkr.dev" }],
    creator: "Thaddeus Kuah",
    description:
        "hi! i’m thaddeus, a 19 year-old self-taught hobbyist programmer studying in singapore.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${font.className} bg-neutral-50 text-base text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}>
            <head>
                <Script strategy="afterInteractive" id="activate-transitions">
                    {`document.documentElement.classList.add('transition-colors');`}
                </Script>
            </head>
            <body className="m-10 flex max-w-xl flex-col">
                <ThemeProvider attribute="class" storageKey="theme" enableSystem={true}>
                    <Navigation />
                    <Summary />
                    {children}
                    <Toaster
                        toastOptions={{
                            descriptionClassName: "!text-neutral-700 dark:!text-neutral-400",
                            className:
                                "dark:!bg-neutral-900 !bg-neutral-100 !text-neutral-900 dark:!text-neutral-100 !border !border-neutral-300 dark:!border-neutral-700 !shadow-md",
                        }}
                    />
                    <Analytics />
                    <SpeedInsights />
                </ThemeProvider>
            </body>
        </html>
    );
}
