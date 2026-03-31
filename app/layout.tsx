import "@/globals.css";
import { Inter } from "next/font/google";
import Navigation from "@/components/Navigation";
import Summary from "@/components/Summary";
import Footer from "@/components/Footer";
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
            <script
                src="https://uptime.betterstack.com/widgets/announcement.js"
                data-id="188428"
                async={true}
                type="text/javascript"
            />
            <body className="relative m-10 min-h-[calc(100vh-5rem)]">
                <ThemeProvider attribute="class" storageKey="theme" enableSystem={true}>
                    <div
                        aria-hidden
                        className="will-change-opacity pointer-events-none fixed inset-y-0 right-0 w-[34vw] bg-linear-to-l from-violet-600/26 via-violet-400/14 to-transparent opacity-100 transition-opacity duration-400 ease-in-out motion-reduce:transition-none sm:w-[36vw] lg:w-[42vw] dark:opacity-0"
                    />
                    <div
                        aria-hidden
                        className="will-change-opacity pointer-events-none fixed inset-y-0 right-0 w-[34vw] bg-linear-to-l from-violet-900/20 via-violet-950/14 to-transparent opacity-0 transition-opacity duration-400 ease-in-out motion-reduce:transition-none sm:w-[36vw] lg:w-[42vw] lg:from-violet-900/35 lg:via-violet-950/25 dark:opacity-100"
                    />
                    <div className="relative z-10 flex min-h-[calc(100vh-5rem)] max-w-xl flex-col">
                        <Navigation />
                        <Summary />
                        {children}
                        <Footer />
                        <Toaster
                            toastOptions={{
                                descriptionClassName: "!text-neutral-700 dark:!text-neutral-400",
                                className:
                                    "dark:!bg-neutral-900 !bg-neutral-100 !text-neutral-900 dark:!text-neutral-100 !border !border-neutral-300 dark:!border-neutral-700 !shadow-md",
                            }}
                        />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
