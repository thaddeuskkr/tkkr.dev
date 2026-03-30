"use client";

import { useEffect, useRef, useState } from "react";

const RECONNECT_DELAY_MS = 3000;

type DiscordStatus = "online" | "idle" | "dnd" | "offline";
type DiscordActivity = {
    type: number;
    name: string;
    details?: string;
    state?: string;
};
type LanyardData = {
    discord_status: DiscordStatus;
    listening_to_spotify: boolean;
    spotify: { song: string; artist: string } | null;
    activities: DiscordActivity[];
};
type LanyardSocketMessage = {
    op: number;
    d?: unknown;
};
type PresenceInfo =
    | { kind: "playing"; game: string }
    | { kind: "listening"; song: string; artist: string }
    | { kind: "listening-while-playing"; song: string; artist: string; game: string }
    | { kind: "text"; text: string };
type DiscordPresenceProps = {
    lanyardWsUrl: string;
    discordUserId: string;
};

const statusDotClassMap: Record<DiscordStatus, string> = {
    online: "bg-emerald-500",
    dnd: "bg-red-500",
    idle: "bg-amber-400",
    offline: "bg-neutral-500",
};
const highlightClassName = "font-semibold text-neutral-700 dark:text-neutral-200";

function getPresenceInfo(data: LanyardData): PresenceInfo {
    const activeGame = data.activities.find((activity) => activity.type === 0);

    if (data.listening_to_spotify && data.spotify?.song && data.spotify?.artist) {
        if (activeGame) {
            return {
                kind: "listening-while-playing",
                song: data.spotify.song,
                artist: data.spotify.artist,
                game: activeGame.name,
            };
        }

        return {
            kind: "listening",
            song: data.spotify.song,
            artist: data.spotify.artist,
        };
    }

    const activeListening = data.activities.find((activity) => activity.type === 2);
    if (activeListening?.details && activeListening.state) {
        if (activeGame) {
            return {
                kind: "listening-while-playing",
                song: activeListening.details,
                artist: activeListening.state,
                game: activeGame.name,
            };
        }

        return {
            kind: "listening",
            song: activeListening.details,
            artist: activeListening.state,
        };
    }

    if (activeGame) {
        return { kind: "playing", game: activeGame.name };
    }

    return { kind: "text", text: "Currently not doing anything" };
}

function normalizeStatus(status: string): DiscordStatus {
    if (status === "online" || status === "idle" || status === "dnd") {
        return status;
    }

    return "offline";
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function toPresenceData(value: unknown): LanyardData | null {
    if (!isRecord(value) || !("discord_status" in value)) {
        return null;
    }

    return value as LanyardData;
}

function extractPresenceData(payload: unknown, discordUserId: string): LanyardData | null {
    const direct = toPresenceData(payload);
    if (direct) {
        return direct;
    }

    if (!isRecord(payload) || !(discordUserId in payload)) {
        return null;
    }

    return toPresenceData(payload[discordUserId]);
}

export default function DiscordPresence({ lanyardWsUrl, discordUserId }: DiscordPresenceProps) {
    const [discordStatus, setDiscordStatus] = useState<DiscordStatus>("offline");
    const [presenceInfo, setPresenceInfo] = useState<PresenceInfo>({
        kind: "text",
        text: "Currently offline",
    });
    const [isMultiLine, setIsMultiLine] = useState(false);
    const presenceTextRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        let isMounted = true;
        let socket: WebSocket | null = null;
        let heartbeatIntervalId: number | null = null;
        let reconnectTimeoutId: number | null = null;

        const applyPresence = (data: LanyardData) => {
            setDiscordStatus(normalizeStatus(data.discord_status));
            setPresenceInfo(getPresenceInfo(data));
        };

        const clearHeartbeat = () => {
            if (heartbeatIntervalId !== null) {
                window.clearInterval(heartbeatIntervalId);
                heartbeatIntervalId = null;
            }
        };

        const scheduleReconnect = () => {
            if (!isMounted || reconnectTimeoutId !== null) {
                return;
            }

            reconnectTimeoutId = window.setTimeout(() => {
                reconnectTimeoutId = null;
                connect();
            }, RECONNECT_DELAY_MS);
        };

        const connect = () => {
            socket = new WebSocket(lanyardWsUrl);

            socket.onmessage = (event) => {
                let message: LanyardSocketMessage;

                try {
                    message = JSON.parse(event.data as string) as LanyardSocketMessage;
                } catch {
                    return;
                }

                if (message.op === 1) {
                    if (socket?.readyState === WebSocket.OPEN) {
                        socket.send(
                            JSON.stringify({
                                op: 2,
                                d: { subscribe_to_id: discordUserId },
                            }),
                        );
                    }

                    clearHeartbeat();
                    const heartbeatIntervalMs =
                        isRecord(message.d) && typeof message.d.heartbeat_interval === "number" ?
                            message.d.heartbeat_interval
                        :   30000;

                    heartbeatIntervalId = window.setInterval(() => {
                        if (socket?.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({ op: 3 }));
                        }
                    }, heartbeatIntervalMs);
                    return;
                }

                if (message.op !== 0) {
                    return;
                }

                const presence = extractPresenceData(message.d, discordUserId);
                if (presence) {
                    applyPresence(presence);
                }
            };

            socket.onerror = () => {
                if (!isMounted) {
                    return;
                }

                setDiscordStatus("offline");
                setPresenceInfo({ kind: "text", text: "Discord status unavailable" });
            };

            socket.onclose = () => {
                clearHeartbeat();
                if (!isMounted) {
                    return;
                }

                scheduleReconnect();
            };
        };

        connect();

        return () => {
            isMounted = false;
            clearHeartbeat();

            if (reconnectTimeoutId !== null) {
                window.clearTimeout(reconnectTimeoutId);
                reconnectTimeoutId = null;
            }

            if (socket && socket.readyState !== WebSocket.CLOSED) {
                socket.close();
                socket = null;
            }
        };
    }, [lanyardWsUrl, discordUserId]);

    useEffect(() => {
        const textElement = presenceTextRef.current;
        if (!textElement) {
            return;
        }

        const updateLineCount = () => {
            const lineHeight = Number.parseFloat(window.getComputedStyle(textElement).lineHeight);
            if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
                setIsMultiLine(false);
                return;
            }

            const lines = Math.round(textElement.getBoundingClientRect().height / lineHeight);
            setIsMultiLine(lines > 1);
        };

        updateLineCount();

        const resizeObserver = new ResizeObserver(updateLineCount);
        resizeObserver.observe(textElement);
        window.addEventListener("resize", updateLineCount);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateLineCount);
        };
    }, [presenceInfo]);

    return (
        <div className="mt-1 flex items-center gap-2">
            <span
                className={`${isMultiLine ? "min-h-2 w-2 self-stretch rounded-full" : "h-2 w-2 rounded-full"} ${statusDotClassMap[discordStatus]}`}
                aria-hidden
            />
            {presenceInfo.kind === "playing" ?
                <span ref={presenceTextRef} className="leading-5">
                    Currently playing{" "}
                    <span className={highlightClassName}>{presenceInfo.game}</span>
                </span>
            : presenceInfo.kind === "listening-while-playing" ?
                <span ref={presenceTextRef} className="leading-5">
                    Currently listening to{" "}
                    <span className={highlightClassName}>{presenceInfo.song}</span> by{" "}
                    <span className={highlightClassName}>{presenceInfo.artist}</span> while playing{" "}
                    <span className={highlightClassName}>{presenceInfo.game}</span>
                </span>
            : presenceInfo.kind === "listening" ?
                <span ref={presenceTextRef} className="leading-5">
                    Currently listening to{" "}
                    <span className={highlightClassName}>{presenceInfo.song}</span> by{" "}
                    <span className={highlightClassName}>{presenceInfo.artist}</span>
                </span>
            :   <span ref={presenceTextRef} className="leading-5">
                    {presenceInfo.text}
                </span>
            }
        </div>
    );
}
