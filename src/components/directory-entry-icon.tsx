import Image from "next/image";
import { Mail, Activity, Globe } from "lucide-react";
import type { DirectoryIcon } from "@/lib/directory";
import { cn } from "@/lib/utils";

export function DirectoryEntryIcon({ icon }: { icon: DirectoryIcon }) {
    const Symbol =
        icon.kind === "symbol" ?
                { mail: Mail, activity: Activity, globe: Globe }[icon.name] :
            Globe;
    return icon.kind === "symbol" ?
            <Symbol className="size-4" aria-hidden="true" /> :
            (
                <>
                    <Image
                        src={icon.src}
                        width={18}
                        height={18}
                        alt=""
                        className={cn(
                            "size-4.5 shrink-0 object-contain",
                            icon.darkSrc && "dark:hidden",
                            icon.grayscale && "grayscale",
                        )}
                        unoptimized
                    />
                    {icon.darkSrc && (
                        <Image
                            src={icon.darkSrc}
                            width={18}
                            height={18}
                            alt=""
                            className="hidden size-4.5 shrink-0 object-contain dark:block"
                            unoptimized
                        />
                    )}
                </>
            );
}
