import "@/globals.css";
import { Instrument_Sans } from "next/font/google";
import Navigation from "@/components/Navigation";
import Summary from "@/components/Summary";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const font = Instrument_Sans({
    subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${font.className} theme-preload bg-neutral-50 text-base text-neutral-900 transition-colors dark:bg-neutral-950 dark:text-neutral-100`}>
            <head>
                <script
                    id="theme-init"
                    dangerouslySetInnerHTML={{
                        __html: `(()=>{try{const r=document.documentElement,s=localStorage.getItem('theme'),d=s?s==='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.classList[d?'add':'remove']('dark');r.classList.remove('theme-preload')}catch{}})()`,
                    }}
                />
                <title>Thaddeus Kuah</title>
                <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
                <link rel="manifest" href="/site.webmanifest" />
            </head>
            <body className="m-10 flex max-w-xl flex-col">
                <Navigation />
                <Summary />
                {children}
                <Toaster
                    toastOptions={{
                        className:
                            "dark:!bg-neutral-900 !bg-neutral-100 !text-neutral-900 dark:!text-neutral-100 !border !border-neutral-300 dark:!border-neutral-700 !shadow-md",
                    }}
                />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
