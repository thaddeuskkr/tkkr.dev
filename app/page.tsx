import * as motion from "motion/react-client";

const experience: { company: string; position: string; from: string; to: string; type: string }[] =
    [
        {
            company: "noel gifts",
            position: "operations assistant",
            from: "december 2023",
            to: "march 2024",
            type: "part-time",
        },
        {
            company: "koi thé",
            position: "tea barista",
            from: "march 2025",
            to: "april 2025",
            type: "part-time",
        },
        {
            company: "apple",
            position: "specialist",
            from: "august 2025",
            to: "present",
            type: "part-time",
        },
    ].reverse();

const education: { institution: string; course: string; from: string; to: string }[] = [
    {
        institution: "st. joseph’s institution",
        course: "o level programme",
        from: "2019",
        to: "2023",
    },
    {
        institution: "nanyang polytechnic",
        course: "diploma in information technology",
        from: "2024",
        to: "present",
    },
].reverse();

export default function Home() {
    return (
        <main>
            <motion.div
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">about me</span>
                    <p>
                        i’m highly tech-savvy and passionate about technology, with extensive
                        hands-on experience in full-stack web development and systems
                        administration.
                    </p>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">hobbies</span>
                    <ul className="list-inside list-['-_']">
                        <li>gaming</li>
                        <li>programming</li>
                        <li>photography</li>
                        <li>listening to music</li>
                    </ul>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">experience</span>
                    <ul className="flex flex-col gap-1">
                        {experience.map((exp, idx) => (
                            <li key={idx} className="pl-3">
                                <div>
                                    <span className="font-medium">{exp.company}</span>{" "}
                                    <span className="text-neutral-700 transition-colors dark:text-neutral-300">
                                        ({exp.from} - {exp.to})
                                    </span>
                                    <p className="text-neutral-600 transition-colors dark:text-neutral-400">
                                        {exp.position} — {exp.type}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">education</span>
                    <ul className="flex flex-col gap-1">
                        {education.map((edu, idx) => (
                            <li key={idx} className="pl-3">
                                <div>
                                    <span className="font-medium">{edu.institution}</span>{" "}
                                    <span className="text-neutral-700 transition-colors dark:text-neutral-300">
                                        ({edu.from} - {edu.to})
                                    </span>
                                    <p className="text-neutral-600 transition-colors dark:text-neutral-400">
                                        {edu.course}
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
