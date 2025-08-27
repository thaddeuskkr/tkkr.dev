import { CopyButton } from "@/components/CopyButton";
import * as motion from "motion/react-client";
import Link from "next/link";

const usernames: (
    | { game: string; username: string; url: string }
    | { game: string; username: string }
)[] = [
    {
        game: "discord",
        username: "thad (@t.kkr)",
        url: "https://discord.com/users/275830234262142978",
    },
    {
        game: "battle.net (overwatch)",
        username: "TeamThaddeus#1224",
    },
    {
        game: "steam community",
        username: "thaddeuskkr",
        url: "https://steamcommunity.com/id/thaddeuskkr",
    },
    {
        game: "maimai dx",
        username: "101317497430011",
    },
];

export default function More() {
    return (
        <main>
            <motion.div
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">gaming & socials</span>
                    <ul className="flex flex-col gap-1">
                        {usernames.map((game, idx) => (
                            <li key={idx} className="pl-3">
                                <div>
                                    <span className="font-medium">{game.game}</span>
                                    <p className="text-neutral-600 transition-colors dark:text-neutral-400">
                                        {"url" in game ?
                                            <a
                                                href={game.url}
                                                className="text-neutral-600 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                                                target="_blank"
                                                rel="noopener noreferrer">
                                                {game.username}
                                            </a>
                                        :   <CopyButton text={game.username}>
                                                <span className="cursor-pointer text-neutral-600 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
                                                    {game.username}
                                                </span>
                                            </CopyButton>
                                        }
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">link shortener</span>
                    <Link
                        className="max-w-fit cursor-pointer text-neutral-600 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                        href="/shorten">
                        requires sign in
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
