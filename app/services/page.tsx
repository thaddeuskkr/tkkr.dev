import * as motion from "motion/react-client";

const services: {
    name: string;
    description: string;
    links: { name: string; url: string }[];
}[] = [
    {
        name: "main website",
        description:
            "the website you're currently looking at! includes a hidden (and private) link shortener with many features.",
        links: [
            {
                name: "visit",
                url: "https://tkkr.dev",
            },
            {
                name: "source",
                url: "https://github.com/thaddeuskkr/tkkr.dev",
            },
        ],
    },
    {
        name: "status page",
        description:
            "monitors the uptime of all tkkr.dev services and provides real-time updates during incidents. experiencing issues with any tkkr.dev service? check here for updates! powered by better stack.",
        links: [
            {
                name: "live",
                url: "https://status.tkkr.dev",
            },
            {
                name: "better stack",
                url: "https://betterstack.com",
            },
        ],
    },
    {
        name: "pocket id",
        description:
            "the self-hosted identity provider used to authenticate to all tkkr.dev services. only supports passkeys.",
        links: [
            {
                name: "dashboard",
                url: "https://id.tkkr.dev",
            },
            {
                name: "source",
                url: "https://github.com/pocket-id/pocket-id",
            },
        ],
    },
    {
        name: "headscale",
        description:
            "an implementation of tailscale's control server. provides secure access to tkkr.dev services outside of the local area network.",
        links: [
            {
                name: "connect (apple)",
                url: "https://h.tkkr.dev/apple",
            },
            {
                name: "connect (windows)",
                url: "https://h.tkkr.dev/windows",
            },
            {
                name: "source",
                url: "https://github.com/juanfont/headscale",
            },
        ],
    },
    {
        name: "komodo",
        description:
            "a dashboard to manage containers running tkkr.dev services. provides an easy-to-use interface to monitor resources, view logs, and more.",
        links: [
            {
                name: "dashboard",
                url: "https://k.tkkr.dev",
            },
            {
                name: "source",
                url: "https://github.com/moghtech/komodo",
            },
        ],
    },
    {
        name: "lanyard",
        description:
            "a service that provides live updates for a user's discord presence. used on this website (in the footer) to show my current activity and status.",
        links: [
            {
                name: "live api",
                url: "https://l.tkkr.dev",
            },
            {
                name: "source",
                url: "https://github.com/thaddeuskkr/lanyard",
            },
        ],
    },
    {
        name: "copyparty",
        description:
            "a self-hosted file server. allows uploading and downloading files from anywhere. supports sharing of files, password protection, and more.",
        links: [
            {
                name: "file browser",
                url: "https://f.tkkr.dev",
            },
            {
                name: "source",
                url: "https://github.com/9001/copyparty",
            },
        ],
    },
];

export default function Services() {
    return (
        <main>
            <motion.div
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">services</span>
                    <ul className="flex flex-col gap-1">
                        {services.map((service) => (
                            <li key={service.name} className="pl-3">
                                <div>
                                    <span className="font-medium">{service.name}</span>{" "}
                                    <p className="text-body-tertiary transition-colors">
                                        {service.description}
                                    </p>
                                    <p className="text-body-muted transition-colors">
                                        {service.links.map((link, linkIdx) => (
                                            <span key={link.name}>
                                                <a
                                                    href={link.url}
                                                    className="text-body-muted hover:text-body-secondary transition-colors"
                                                    target="_blank"
                                                    rel="noopener noreferrer">
                                                    {link.name}
                                                </a>
                                                {linkIdx < service.links.length - 1 && " / "}
                                            </span>
                                        ))}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </motion.div>
        </main>
    );
}
