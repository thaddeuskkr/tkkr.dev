"use client";

import { toast } from "sonner";

interface CopyButtonProps {
    text: string;
    children: React.ReactNode;
}

export function CopyButton({ text, children }: CopyButtonProps) {
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return <button onClick={handleCopy}>{children}</button>;
}
