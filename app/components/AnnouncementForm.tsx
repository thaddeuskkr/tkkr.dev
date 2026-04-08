"use client";

import { toast } from "sonner";
import type { Announcement, AnnouncementCategory } from "@/types";
import {
    deleteAnnouncementAction,
    saveAnnouncementAction,
    type AnnouncementActionState,
} from "@/lib/announcement";
import { redirect, useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

const initialState: AnnouncementActionState = {
    success: false,
    issues: [],
    result: "idle",
};

export function AnnouncementForm({
    initialAnnouncement,
}: {
    initialAnnouncement: Announcement | null;
}) {
    const router = useRouter();
    const [message, setMessage] = useState(initialAnnouncement?.message ?? "");
    const [category, setCategory] = useState<AnnouncementCategory>(
        initialAnnouncement?.category ?? "",
    );
    const [saveState, saveFormAction, savePending] = useActionState(
        saveAnnouncementAction,
        initialState,
    );
    const [deleteState, deleteFormAction, deletePending] = useActionState(
        deleteAnnouncementAction,
        initialState,
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessage(initialAnnouncement?.message ?? "");
        setCategory(initialAnnouncement?.category ?? "");
    }, [initialAnnouncement?.message, initialAnnouncement?.category]);

    useEffect(() => {
        if (savePending || (!saveState.success && saveState.issues.length === 0)) return;

        if (saveState.success) {
            toast.success(
                saveState.result === "created" ?
                    "Announcement published."
                :   "Announcement updated.",
            );
            redirect(window.location.pathname);
        }

        saveState.issues.forEach((issue) => toast.error(issue));
    }, [router, savePending, saveState]);

    useEffect(() => {
        if (deletePending || (!deleteState.success && deleteState.issues.length === 0)) return;

        if (deleteState.success) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMessage("");
            toast.success("Announcement deleted.");
            router.refresh();
            return;
        }

        deleteState.issues.forEach((issue) => toast.error(issue));
    }, [deletePending, deleteState, router]);

    const trimmedMessage = message.trim();
    const isPending = savePending || deletePending;
    const hasAnnouncement = Boolean(initialAnnouncement);
    const isUnchanged =
        trimmedMessage === (initialAnnouncement?.message ?? "") &&
        category === (initialAnnouncement?.category ?? "");
    const inputClass =
        "w-full text-body-secondary placeholder:text-body-tertiary select-none focus:outline-none";

    return (
        <div className="flex flex-col gap-2">
            <form className="flex flex-col gap-1.5" action={saveFormAction}>
                <input
                    type="text"
                    name="category"
                    placeholder="enter category (e.g. announcement, update, news, etc., optional)"
                    className={inputClass}
                    autoComplete="off"
                    maxLength={24}
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    disabled={isPending}
                />
                <input
                    type="text"
                    name="message"
                    placeholder="enter announcement message"
                    className={inputClass}
                    autoComplete="off"
                    maxLength={200}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    disabled={isPending}
                />
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={isPending || !trimmedMessage.length || isUnchanged}
                        aria-busy={savePending}
                        className="text-body-muted hover:text-body-tertiary disabled:text-body-faint max-w-fit cursor-pointer appearance-none border-0 bg-transparent p-0 leading-none transition-colors disabled:cursor-not-allowed">
                        {savePending ?
                            "saving..."
                        : hasAnnouncement ?
                            "update announcement"
                        :   "publish announcement"}
                    </button>
                    <span className="text-body-faint transition-colors">
                        {trimmedMessage.length}/200
                    </span>
                </div>
            </form>
            {hasAnnouncement && (
                <form action={deleteFormAction}>
                    <button
                        type="submit"
                        disabled={isPending}
                        aria-busy={deletePending}
                        className="text-body-muted hover:text-body-tertiary disabled:text-body-faint max-w-fit cursor-pointer appearance-none border-0 bg-transparent p-0 leading-none transition-colors disabled:cursor-not-allowed">
                        {deletePending ? "deleting..." : "delete announcement"}
                    </button>
                </form>
            )}
        </div>
    );
}
