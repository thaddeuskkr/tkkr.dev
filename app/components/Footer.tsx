import Clock from "@/components/Clock";
import DiscordPresence from "@/components/DiscordPresence";

export default function Footer() {
    return (
        <footer className="mt-auto pt-10 text-xs text-neutral-600 transition-colors dark:text-neutral-400">
            <div className="border-t border-neutral-200 pt-3 leading-relaxed dark:border-neutral-800">
                <Clock />
                <DiscordPresence />
            </div>
        </footer>
    );
}
