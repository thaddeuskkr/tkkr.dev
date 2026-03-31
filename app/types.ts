import type { MongoClient, ObjectId } from "mongodb";

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export interface ShortUrl {
    _id: ObjectId;
    url: string;
    slugs: string[];
    password: string | null;
    expiry: Date | null;
    createdBy: string;
    createdAt: Date;
}

export type DiscordStatus = "online" | "idle" | "dnd" | "offline";

export type DiscordActivity = {
    type: number;
    name: string;
    details?: string;
    state?: string;
};

export type LanyardData = {
    discord_status: DiscordStatus;
    active_on_discord_mobile?: boolean;
    listening_to_spotify: boolean;
    spotify: { song: string; artist: string } | null;
    activities: DiscordActivity[];
};

export type LanyardSocketMessage = {
    op: number;
    d?: unknown;
};

export type PresenceInfo =
    | { kind: "playing"; game: string }
    | { kind: "listening"; song: string; artist: string }
    | { kind: "listening-while-playing"; song: string; artist: string; game: string }
    | { kind: "text"; text: string };

export type DiscordPresenceProps = {
    lanyardWsUrl: string;
    discordUserId: string;
};
