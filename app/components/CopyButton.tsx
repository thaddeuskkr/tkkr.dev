"use client";

import { toast } from "sonner";

interface CopyButtonProps {
    text: string;
    children: React.ReactNode;
    className?: string;
    successMessage?: string;
    errorMessage?: string;
}

export function CopyButton({
    text,
    children,
    className,
    successMessage = "Copied to clipboard!",
    errorMessage = "Clipboard unavailable. Please copy manually.",
}: CopyButtonProps) {
    const handleCopy = async () => {
        try {
            if (!navigator?.clipboard) {
                throw new Error("clipboard-missing");
            }
            await navigator.clipboard.writeText(text);
            toast.success(successMessage);
        } catch {
            toast.error(errorMessage);
        }
    };

    return (
        <button type="button" onClick={handleCopy} className={className}>
            {children}
        </button>
    );
}
