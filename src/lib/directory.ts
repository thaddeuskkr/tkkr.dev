const selfHostedIconBase = "/icons";

// Brand assets are provided by selfh.st/icons under CC BY 4.0.
// These references have both monochrome variants in selfh.st's icon index.
const themedIconReferences = new Set([
    "github",
    "linkedin",
    "last-fm",
    "telegram",
    "pocket-id",
    "discord",
    "copyparty",
    "warpgate",
    "headscale",
]);

export type DirectoryIcon =
    | {
        kind: "brand";
        src: string;
        darkSrc?: string;
        grayscale?: boolean;
    } |
    {
        kind: "symbol";
        name: "mail" | "activity" | "globe";
    };

export type DirectoryEntry = {
    name: string;
    description: string;
    destination: string;
    href: string;
    icon: DirectoryIcon;
    access?: "Restricted";
    keywords?: readonly string[];
};

export type DirectoryGroup = {
    id: "social" | "directory";
    links: readonly DirectoryEntry[];
};

function brandIcon(reference: string, format: "svg" | "webp" = "svg"): DirectoryIcon {
    const themed = themedIconReferences.has(reference);
    return {
        kind: "brand",
        src: `${selfHostedIconBase}/${reference}${themed ? "-dark" : ""}.${format}`,
        grayscale: !themed,
        ...(themed && {
            darkSrc: `${selfHostedIconBase}/${reference}-light.${format}`,
        }),
    };
}

export const directoryGroups: readonly DirectoryGroup[] = [
    {
        id: "social",
        links: [
            {
                name: "GitHub",
                description: "Code, projects, and open-source work.",
                destination: "github.com/thaddeuskkr",
                href: "https://github.com/thaddeuskkr",
                icon: brandIcon("github"),
                keywords: ["code", "projects", "source"],
            },
            {
                name: "LinkedIn",
                description: "Experience and professional updates.",
                destination: "linkedin.com/in/thaddeuskkr",
                href: "https://www.linkedin.com/in/thaddeuskkr/",
                icon: brandIcon("linkedin"),
                keywords: ["work", "experience", "career"],
            },
            {
                name: "Last.fm",
                description: "A running record of what I listen to.",
                destination: "last.fm/user/thaddeuskkr",
                href: "https://www.last.fm/user/thaddeuskkr",
                icon: brandIcon("last-fm"),
                keywords: ["music", "listening"],
            },
            {
                name: "Telegram",
                description: "The best way to reach me for quick questions or discussions.",
                destination: "t.me/thaddeuskkr",
                href: "https://t.me/thaddeuskkr",
                icon: brandIcon("telegram"),
                keywords: ["contact", "messaging", "chat"],
            },
            {
                name: "Email",
                description: "The most direct way to reach me.",
                destination: "tk@tkkr.dev",
                href: "mailto:tk@tkkr.dev",
                icon: { kind: "symbol", name: "mail" },
                keywords: ["contact", "mail"],
            },
        ],
    },
    {
        id: "directory",
        links: [
            {
                name: "Status Page",
                description: "Uptime and incident updates for tkkr.dev.",
                destination: "status.tkkr.dev",
                href: "https://status.tkkr.dev",
                icon: { kind: "symbol", name: "activity" },
                keywords: ["uptime", "availability", "better stack"],
            },
            {
                name: "tkID",
                description: "Identity provider (IdP) to sign in to tkkr.dev systems.",
                destination: "id.tkkr.dev",
                href: "https://id.tkkr.dev",
                icon: brandIcon("pocket-id"),
                keywords: ["oidc", "identity", "login", "passkey"],
            },
            {
                name: "Lanyard",
                description: "Live Discord presence data.",
                destination: "l.tkkr.dev",
                href: "https://l.tkkr.dev",
                icon: brandIcon("discord"),
                keywords: ["discord", "presence", "api"],
            },
            {
                name: "Copyparty",
                description: "Private file browser and sharing tool.",
                destination: "f.tkkr.dev",
                href: "https://f.tkkr.dev",
                icon: brandIcon("copyparty"),
                access: "Restricted",
                keywords: ["files", "sharing", "storage"],
            },
            {
                name: "Warpgate",
                description: "A secure gateway for accessing internal systems.",
                destination: "tkkr.cc",
                href: "https://tkkr.cc",
                icon: brandIcon("warpgate"),
                access: "Restricted",
                keywords: ["gateway", "ssh", "mysql", "vnc", "rdp", "web"],
            },
            {
                name: "Headscale",
                description: "Private Tailscale network for direct access to tkkr.dev systems.",
                destination: "tkkr.net",
                href: "https://tkkr.net",
                icon: brandIcon("headscale"),
                access: "Restricted",
                keywords: ["network", "vpn", "tailscale", "headscale"],
            },
            {
                name: "Dockhand",
                description: "Container deployment and infrastructure management.",
                destination: "d.tkkr.dev",
                href: "https://d.tkkr.dev",
                icon: brandIcon("dockhand", "webp"),
                access: "Restricted",
                keywords: ["containers", "docker", "servers"],
            },
        ],
    },
] as const;
