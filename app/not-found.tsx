"use client";
import { motion } from "motion/react";

export default function NotFound() {
    return (
        <main>
            <motion.div
                className="pb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                <p className="font-medium">404 - not found</p>
                <p>
                    sorry, the page you&apos;re looking for doesn&apos;t exist.
                    <br />
                    if you think this is a mistake, please{" "}
                    <a
                        href="mailto:hi@tkkr.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline transition-colors hover:text-purple-800 dark:hover:text-purple-300">
                        contact me
                    </a>
                    .
                </p>
            </motion.div>
        </main>
    );
}
