import "@/globals.css";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Inter } from "next/font/google";
import ContentViewport from "@/components/ContentViewport";
import Navigation from "@/components/Navigation";
import Summary from "@/components/Summary";
import Footer from "@/components/Footer";
import { getAnnouncement } from "@/lib/db";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import Script from "next/script";

const font = Inter({
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

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const announcement = await getAnnouncement();
    const gridRowsClass =
        announcement ?
            "grid-rows-[auto_auto_auto_minmax(0,1fr)_auto]"
        :   "grid-rows-[auto_auto_minmax(0,1fr)_auto]";

    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${font.className} bg-page text-body text-base`}>
            <head>
                <Script strategy="afterInteractive" id="activate-transitions">
                    {`document.documentElement.classList.add('transition-colors');`}
                </Script>
            </head>
            <body className="relative box-border h-dvh overflow-hidden p-10">
                <ThemeProvider attribute="class" storageKey="theme" enableSystem={true}>
                    <div
                        aria-hidden
                        className="will-change-opacity from-glow-light-from via-glow-light-via pointer-events-none fixed inset-y-0 right-0 w-[34vw] bg-linear-to-l to-transparent opacity-100 transition-opacity duration-400 ease-in-out motion-reduce:transition-none sm:w-[36vw] lg:w-[42vw] dark:opacity-0"
                    />
                    <div
                        aria-hidden
                        className="will-change-opacity from-glow-dark-from via-glow-dark-via lg:from-glow-dark-from-lg lg:via-glow-dark-via-lg pointer-events-none fixed inset-y-0 right-0 w-[34vw] bg-linear-to-l to-transparent opacity-0 transition-opacity duration-400 ease-in-out motion-reduce:transition-none sm:w-[36vw] lg:w-[42vw] dark:opacity-100"
                    />
                    <div className={`relative z-10 grid h-full max-w-xl ${gridRowsClass}`}>
                        {announcement && <AnnouncementBanner announcement={announcement} />}
                        <Navigation />
                        <Summary />
                        <ContentViewport>{children}</ContentViewport>
                        <Footer />
                        <Toaster
                            toastOptions={{
                                descriptionClassName: "!text-toast-fg-subtle",
                                className:
                                    "!bg-toast-bg !text-toast-fg !border !border-toast-border !shadow-md",
                            }}
                        />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
