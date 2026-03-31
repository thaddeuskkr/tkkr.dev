import Clock from "@/components/Clock";
import DiscordPresence from "@/components/DiscordPresence";

export default function Footer() {
    const lanyardWsUrl = process.env.LANYARD_WS_URL || "wss://l.tkkr.dev/socket";
    const discordUserId = process.env.DISCORD_USER_ID || "275830234262142978";

    return (
        <footer className="text-body-tertiary mt-auto pt-10 text-[0.825rem] transition-colors">
            <div className="relative pt-3 leading-relaxed">
                <span
                    aria-hidden
                    className="bg-separator-light pointer-events-none absolute inset-x-0 top-0 h-px opacity-100 transition-opacity duration-200 dark:opacity-0"
                />
                <span
                    aria-hidden
                    className="bg-separator-dark pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-200 dark:opacity-100"
                />
                <Clock />
                <DiscordPresence lanyardWsUrl={lanyardWsUrl} discordUserId={discordUserId} />
            </div>
        </footer>
    );
}

