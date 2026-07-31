import { useId, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpRight, LockKeyhole, Search } from 'lucide-react';

import { RevealSection } from '@/components/reveal-section';
import { Input } from '@/components/ui/input';
import { serviceLinkGroups } from '@/lib/service-links';
import type { ServiceLink, ServiceLinkIcon } from '@/lib/service-links';

export function ServiceHub({ variant = 'page' }: { variant?: 'dialog' | 'page' }) {
    const searchId = useId();
    const [query, setQuery] = useState('');
    const normalizedQuery = query.trim().toLowerCase();

    const filteredGroups = useMemo(
        () =>
            serviceLinkGroups
                .map((group) => ({
                    ...group,
                    links: group.links.filter((link) => {
                        if (!normalizedQuery) return true;

                        return [link.name, link.description, link.destination, ...(link.keywords ?? [])]
                            .join(' ')
                            .toLowerCase()
                            .includes(normalizedQuery);
                    }),
                }))
                .filter((group) => group.links.length > 0),
        [normalizedQuery]
    );

    return (
        <div className="service-hub min-h-0" data-hub-variant={variant}>
            <div className="group/search relative w-full" data-hub-search>
                <label htmlFor={searchId} className="sr-only">
                    Search links and services
                </label>
                <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-primary/70 transition-colors duration-200 group-focus-within/search:text-primary"
                />
                <Input
                    id={searchId}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    placeholder="Search links and services…"
                    autoComplete="off"
                    className="h-12 rounded-xl border-border/75 bg-background/60 pr-5 pl-12 text-sm shadow-[inset_0_1px_0_rgb(255_255_255/0.025)] backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-muted-foreground/75 hover:border-primary/20 hover:bg-background/75 focus-visible:border-primary/35 focus-visible:bg-background/85 focus-visible:ring-3 focus-visible:ring-primary/10 md:text-sm dark:bg-white/2.5 dark:hover:bg-white/4 dark:focus-visible:bg-white/5"
                />
            </div>

            {filteredGroups.length > 0 ? (
                <div className="mt-10 grid items-start gap-12 lg:grid-cols-2 lg:gap-16" data-hub-groups>
                    {filteredGroups.map((group, groupIndex) => (
                        <RevealSection
                            key={group.id}
                            aria-labelledby={`${searchId}-${group.id}`}
                            revealClassName="links-group-reveal"
                            rootMargin="0px 0px -6% 0px"
                            threshold={0.08}
                            data-hub-group
                            style={
                                {
                                    '--hub-group-index': groupIndex,
                                    '--hub-group-delay': `${groupIndex * 70}ms`,
                                    '--hub-offset': groupIndex % 2 === 0 ? '-0.8rem' : '0.8rem',
                                } as CSSProperties
                            }
                        >
                            <div
                                className="mb-5 grid gap-2 sm:grid-cols-[2rem_minmax(0,1fr)] sm:gap-3"
                                data-hub-heading
                            >
                                <p className="font-mono text-xs text-primary">{group.eyebrow}</p>
                                <div>
                                    <h2
                                        id={`${searchId}-${group.id}`}
                                        className="text-sm font-semibold tracking-[0.16em] uppercase"
                                    >
                                        {group.title}
                                    </h2>
                                    <p className="mt-1 text-sm/6 text-muted-foreground">{group.description}</p>
                                </div>
                            </div>

                            <ul className="border-t border-border/70" data-hub-list>
                                {group.links.map((link, rowIndex) => (
                                    <ServiceLinkRow
                                        key={`${group.id}-${link.name}`}
                                        link={link}
                                        motionIndex={rowIndex}
                                    />
                                ))}
                            </ul>
                        </RevealSection>
                    ))}
                </div>
            ) : (
                <div
                    className="flex min-h-52 items-center justify-center border-y border-border/70 text-center"
                    role="status"
                    data-hub-empty
                >
                    <div>
                        <p className="font-medium">No matching links</p>
                        <p className="mt-1 text-sm text-muted-foreground">Try a service name, domain, or category.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function ServiceLinkRow({ link, motionIndex }: { link: ServiceLink; motionIndex: number }) {
    const opensNewContext = link.href.startsWith('http');

    return (
        <li
            className="border-b border-border/70"
            data-hub-row
            style={
                {
                    '--hub-row-index': motionIndex,
                    '--hub-row-delay': `${motionIndex * 48}ms`,
                } as CSSProperties
            }
        >
            <a
                href={link.href}
                target={opensNewContext ? '_blank' : undefined}
                rel={opensNewContext ? 'noopener noreferrer' : undefined}
                className="group relative grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4 transition-[border-color,background-color] duration-300 outline-none hover:bg-primary/[0.035] focus-visible:bg-primary/5.5 sm:gap-4 sm:px-2"
            >
                <span className="service-link-icon flex size-10 items-center justify-center rounded-xl border border-border/70 bg-white/75 shadow-xs dark:bg-white/90">
                    <ServiceIcon icon={link.icon} />
                </span>

                <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="service-link-name font-semibold tracking-tight">{link.name}</span>
                        {link.access && (
                            <span className="inline-flex items-center gap-1 text-[0.625rem] font-medium tracking-wider text-muted-foreground uppercase">
                                <LockKeyhole aria-hidden="true" className="size-3" />
                                {link.access}
                            </span>
                        )}
                    </span>
                    <span className="mt-0.5 block text-sm/5 text-muted-foreground">{link.description}</span>
                    <span className="mt-1 block truncate font-mono text-[0.6875rem] text-muted-foreground/65">
                        {link.destination}
                    </span>
                </span>

                <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 text-muted-foreground transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:rotate-6 group-hover:text-primary"
                />
                {opensNewContext && <span className="sr-only"> (opens in a new tab)</span>}
            </a>
        </li>
    );
}

function ServiceIcon({ icon }: { icon: ServiceLinkIcon }) {
    if (icon.kind === 'symbol') {
        const Icon = icon.icon;
        return <Icon aria-hidden="true" className="size-5 text-primary" />;
    }

    return (
        <img
            src={icon.src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="size-6 object-contain"
        />
    );
}
