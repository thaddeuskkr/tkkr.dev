"use client";

export default function Summary() {
    const linkProps = {
        target: "_blank",
        rel: "noopener noreferrer",
        className:
            "text-neutral-600 hover:text-neutral-800 transition-colors dark:text-neutral-300 dark:hover:text-neutral-100",
    };
    return (
        <div>
            <h1 className="pb-1 text-3xl font-semibold">Thaddeus Kuah</h1>
            <div className="pb-2 font-medium">
                <p>avid gamer, self-taught hobbyist programmer</p>
                <p>full-time student at nanyang polytechnic, part-time specialist at apple</p>
            </div>
            <ul className="flex gap-5 pb-5">
                <li>
                    <a href="https://github.com/thaddeuskkr" {...linkProps}>
                        github
                    </a>
                </li>
                <li>
                    <a href="https://www.linkedin.com/in/thaddeuskkr/" {...linkProps}>
                        linkedin
                    </a>
                </li>
                <li>
                    <a href="https://www.last.fm/user/thaddeuskkr" {...linkProps}>
                        last.fm
                    </a>
                </li>
                <li>
                    <a href="mailto:hi@tkkr.dev" {...linkProps}>
                        email
                    </a>
                </li>
            </ul>
        </div>
    );
}
