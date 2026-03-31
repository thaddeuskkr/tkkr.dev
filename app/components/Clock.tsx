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
    const [now, setNow] = useState<Date>(() => new Date());

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => window.clearInterval(interval);
    }, []);

    return <div suppressHydrationWarning>{`${dateTimeFormatter.format(now)} (GMT+8)`}</div>;
}
