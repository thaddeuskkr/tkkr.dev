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

export default function Clock() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());

        const interval = window.setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => window.clearInterval(interval);
    }, []);

    return (
        <div suppressHydrationWarning>
            {now ? `${dateTimeFormatter.format(now)} (GMT+8)` : "SGT (GMT+8): --"}
        </div>
    );
}
