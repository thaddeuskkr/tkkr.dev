"use client";

import { useEffect, useState } from "react";

const dateTimeFormatter = new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
});

export default function ClockFooter() {
    const [now, setNow] = useState<Date>(() => new Date());

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => window.clearInterval(interval);
    }, []);

    return (
        <footer className="mt-auto pt-10 text-xs text-neutral-600 transition-colors dark:text-neutral-400">
            <div className="border-t border-neutral-200 pt-3 dark:border-neutral-800">
                {dateTimeFormatter.format(now)}
            </div>
        </footer>
    );
}
