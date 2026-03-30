import Clock from "@/components/Clock";
import DiscordPresence from "@/components/DiscordPresence";

export default function Footer() {
    const lanyardWsUrl = process.env.LANYARD_WS_URL || "wss://l.tkkr.dev/socket";
    const discordUserId = process.env.DISCORD_USER_ID || "275830234262142978";

    return (
        <footer className="mt-auto pt-10 text-xs text-neutral-600 transition-colors dark:text-neutral-400">
            <div className="border-t border-neutral-200 pt-3 leading-relaxed dark:border-neutral-800">
                <Clock />
                <DiscordPresence lanyardWsUrl={lanyardWsUrl} discordUserId={discordUserId} />
            </div>
        </footer>
    );
}
