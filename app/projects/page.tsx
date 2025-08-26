"use client";
import { motion } from "motion/react";

const projects: {
    name: string;
    description: string;
    from: string;
    to: string;
    links: { name: string; url: string }[];
}[] = [
    {
        name: "tkkr.dev",
        description:
            "my personal website, built with next.js and a bunch of love. you’re looking at it!",
        from: "december 2023",
        to: "present",
        links: [
            {
                name: "live",
                url: "https://tkkr.dev",
            },
            {
                name: "github",
                url: "https://github.com/thaddeuskkr/tkkr.dev",
            },
        ],
    },
    {
        name: "nova",
        description:
            "a self-hosted link shortener built with typescript and bun, designed to be fast and powerful yet easy to set up and use.",
        from: "august 2024",
        to: "august 2025",
        links: [
            {
                name: "github",
                url: "https://github.com/thaddeuskkr/nova",
            },
        ],
    },
    {
        name: "dev-container",
        description:
            "an ubuntu-based development environment packaged as a docker container, purpose-built for remote development workflows.",
        from: "february 2024",
        to: "june 2025",
        links: [
            {
                name: "github",
                url: "https://github.com/thaddeuskkr/dev-container",
            },
        ],
    },
    {
        name: "pay2live",
        description:
            "a web application designed to streamline patient management for small clinics, feature-rich and cloud-native. built for a school project.",
        from: "november 2024",
        to: "february 2025",
        links: [
            {
                name: "github",
                url: "https://github.com/thaddeuskkr/pay2live",
            },
        ],
    },
    {
        name: "garbage-detect",
        description:
            "a comprehensive litter detection, monitoring, and notification system built on aws services. uses ai/ml to identify litter and notifies personnel if it piles up.",
        from: "june 2021",
        to: "february 2022",
        links: [
            {
                name: "presentation",
                url: "https://docs.google.com/presentation/d/1tg1i3RpwaPwS0hSP5i6Yp2AIZppvJkLqKeJ9uFer8y0/edit?usp=sharing",
            },
            {
                name: "architecture diagram",
                url: "https://docs.google.com/presentation/d/14wRFLxzZ38-xjqa2_f8_KkQ7a_W2Am8Cn2DfwKe9ezY/edit?usp=sharing",
            },
        ],
    },
    {
        name: "anti-scam student champions",
        description:
            "researched scam prevention strategies and raised anti-scam awareness using an educational video. secured 1st place out of 14 participating schools.",
        from: "february 2020",
        to: "january 2021",
        links: [
            {
                name: "video",
                url: "https://drive.google.com/file/d/1vDW8ynUtmJHooHRkLkQ_n7V55_HvCfrJ/view",
            },
        ],
    },
];

export default function Projects() {
    return (
        <main>
            <motion.div
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">projects</span>
                    <ul className="flex flex-col gap-1">
                        {projects.map((project, idx) => (
                            <li key={idx} className="pl-3">
                                <div>
                                    <span className="font-medium">{project.name}</span>{" "}
                                    <span className="text-neutral-700 transition-colors dark:text-neutral-300">
                                        ({project.from} - {project.to})
                                    </span>
                                    <p className="text-neutral-600 transition-colors dark:text-neutral-400">
                                        {project.description}
                                    </p>
                                    <p className="text-neutral-500 transition-colors dark:text-neutral-500">
                                        {project.links.map((link, linkIdx) => (
                                            <span key={linkIdx}>
                                                <a
                                                    href={link.url}
                                                    className="text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                                                    target="_blank"
                                                    rel="noopener noreferrer">
                                                    {link.name}
                                                </a>
                                                {linkIdx < project.links.length - 1 && " / "}
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
