export function toLocalDateTime(value: number) {
    const date = new Date(value);
    const pad = (value: number, length = 2) => String(value).padStart(length, "0");
    return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

export function localExpiryToISO(value: string, originalTimestamp: number | null = null) {
    const parts = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
    if (!parts) throw new Error("Choose a complete expiry date and time.");
    const normalized = `${parts[1]}:${parts[2] ?? "00"}.${(parts[3] ?? "0").padEnd(3, "0")}`;
    // Keep an unchanged instant, including the repeated hour when daylight saving ends.
    if (originalTimestamp !== null && toLocalDateTime(originalTimestamp) === normalized) {
        return new Date(originalTimestamp).toISOString();
    }

    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || toLocalDateTime(date.getTime()) !== normalized) {
        throw new Error("Choose a valid expiry date and time in your local time zone.");
    }

    return date.toISOString();
}

export function formatAdminDate(value: number | null, timeZone: string | null) {
    if (value === null) return "Never";
    if (!timeZone) return "…";
    return new Intl.DateTimeFormat(undefined, {
        timeZone,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(new Date(value));
}
