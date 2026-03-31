"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as motion from "motion/react-client";
import type {
    DiscordPresenceProps,
    DiscordStatus,
    LanyardData,
    LanyardSocketMessage,
    PresenceInfo,
} from "@/types";

const RECONNECT_DELAY_MS = 3000;

const statusDotClassMap: Record<DiscordStatus, string> = {
    online: "bg-status-online",
    dnd: "bg-status-dnd",
    idle: "bg-status-idle",
    offline: "bg-status-offline",
};
const highlightClassName = "font-semibold text-highlight transition-colors duration-200";
const texts = {
    unavailable: "Discord status unavailable",
    idle: "Currently not doing anything",
    offline: "Currently offline",
    mobileOnline: "Currently online on mobile",
} as const;

function Highlight({ children }: { children: string }) {
    return <span className={highlightClassName}>{children}</span>;
}

function getListeningInfo(data: LanyardData): { song: string; artist: string } | null {
    if (data.listening_to_spotify && data.spotify?.song && data.spotify?.artist) {
        return {
            song: data.spotify.song,
            artist: data.spotify.artist,
        };
    }

    const activeListening = data.activities.find((activity) => activity.type === 2);
    if (activeListening?.details && activeListening.state) {
        return {
            song: activeListening.details,
            artist: activeListening.state,
        };
    }

    return null;
}

function getPresenceInfo(data: LanyardData, status: DiscordStatus): PresenceInfo {
    if (status === "offline") {
        return { kind: "text", text: texts.offline };
    }

    const activeGame = data.activities.find((activity) => activity.type === 0)?.name;
    const listening = getListeningInfo(data);

    if (listening && activeGame) {
        return { kind: "listening-while-playing", ...listening, game: activeGame };
    }

    if (listening) {
        return { kind: "listening", ...listening };
    }

    if (activeGame) {
        return { kind: "playing", game: activeGame };
    }

    if (status === "online" && data.active_on_discord_mobile) {
        return { kind: "text", text: texts.mobileOnline };
    }

    return { kind: "text", text: texts.idle };
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

function parseSocketMessage(raw: string): LanyardSocketMessage | null {
    try {
        return JSON.parse(raw) as LanyardSocketMessage;
    } catch {
        return null;
    }
}

function renderPresenceText(presenceInfo: PresenceInfo): ReactNode {
    switch (presenceInfo.kind) {
        case "playing":
            return (
                <>
                    Currently playing <Highlight>{presenceInfo.game}</Highlight>
                </>
            );
        case "listening-while-playing":
            return (
                <>
                    Currently listening to <Highlight>{presenceInfo.song}</Highlight> by{" "}
                    <Highlight>{presenceInfo.artist}</Highlight> while playing{" "}
                    <Highlight>{presenceInfo.game}</Highlight>
                </>
            );
        case "listening":
            return (
                <>
                    Currently listening to <Highlight>{presenceInfo.song}</Highlight> by{" "}
                    <Highlight>{presenceInfo.artist}</Highlight>
                </>
            );
        case "text":
            return presenceInfo.text;
    }
}

function getPresenceAnimationKey(presenceInfo: PresenceInfo): string {
    switch (presenceInfo.kind) {
        case "playing":
            return `playing:${presenceInfo.game}`;
        case "listening-while-playing":
            return `listening-while-playing:${presenceInfo.song}:${presenceInfo.artist}:${presenceInfo.game}`;
        case "listening":
            return `listening:${presenceInfo.song}:${presenceInfo.artist}`;
        case "text":
            return `text:${presenceInfo.text}`;
    }
}

export default function DiscordPresence({ lanyardWsUrl, discordUserId }: DiscordPresenceProps) {
    const [discordStatus, setDiscordStatus] = useState<DiscordStatus>("offline");
    const [presenceInfo, setPresenceInfo] = useState<PresenceInfo>({
        kind: "text",
        text: texts.offline,
    });
    const presenceAnimationKey = getPresenceAnimationKey(presenceInfo);
    const [isMultiLine, setIsMultiLine] = useState(false);
    const presenceTextRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        let isMounted = true;
        let socket: WebSocket | null = null;
        let heartbeatIntervalId: number | null = null;
        let reconnectTimeoutId: number | null = null;

        const applyPresence = (data: LanyardData) => {
            const status = normalizeStatus(data.discord_status);
            setDiscordStatus(status);
            setPresenceInfo(getPresenceInfo(data, status));
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
                if (typeof event.data !== "string") {
                    return;
                }

                const message = parseSocketMessage(event.data);
                if (!message) {
                    return;
                }

                switch (message.op) {
                    case 1: {
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
                            (
                                isRecord(message.d) &&
                                typeof message.d.heartbeat_interval === "number"
                            ) ?
                                message.d.heartbeat_interval
                            :   30000;

                        heartbeatIntervalId = window.setInterval(() => {
                            if (socket?.readyState === WebSocket.OPEN) {
                                socket.send(JSON.stringify({ op: 3 }));
                            }
                        }, heartbeatIntervalMs);
                        return;
                    }
                    case 0: {
                        const presence = extractPresenceData(message.d, discordUserId);
                        if (presence) {
                            applyPresence(presence);
                        }
                        return;
                    }
                    default:
                        return;
                }
            };

            socket.onerror = () => {
                if (!isMounted) {
                    return;
                }

                setDiscordStatus("offline");
                setPresenceInfo({ kind: "text", text: texts.unavailable });
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
                className={`${isMultiLine ? "min-h-2 w-2 self-stretch rounded-full" : "h-2 w-2 rounded-full"} ${statusDotClassMap[discordStatus]} transition-colors duration-200`}
                aria-hidden
            />
            <span ref={presenceTextRef} className="leading-5">
                <motion.span
                    key={presenceAnimationKey}
                    className="inline-block"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}>
                    {renderPresenceText(presenceInfo)}
                </motion.span>
            </span>
        </div>
    );
}

