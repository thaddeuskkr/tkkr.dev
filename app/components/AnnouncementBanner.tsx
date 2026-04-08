import type { Announcement } from "@/types";

export function AnnouncementBanner({ announcement }: { announcement: Announcement | null }) {
    if (!announcement) return null;

    return (
        <div className="pb-5">
            <div className="relative -mt-2 py-3 text-[0.825rem] leading-relaxed">
                <span
                    aria-hidden
                    className="bg-separator-light pointer-events-none absolute inset-x-0 top-0 h-px opacity-100 transition-opacity duration-200 dark:opacity-0"
                />
                <span
                    aria-hidden
                    className="bg-separator-dark pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-200 dark:opacity-100"
                />
                <span
                    aria-hidden
                    className="bg-separator-light pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-100 transition-opacity duration-200 dark:opacity-0"
                />
                <span
                    aria-hidden
                    className="bg-separator-dark pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity duration-200 dark:opacity-100"
                />
                <p className="text-body-secondary transition-colors">
                    <span className="text-body-muted mr-1 transition-colors">
                        {announcement.category}:
                    </span>{" "}
                    {announcement.message}
                </p>
            </div>
        </div>
    );
}
