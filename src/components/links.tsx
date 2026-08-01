import { useId, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpRight, LockKeyhole, Search } from 'lucide-react';

import { RevealSection } from '@/components/reveal-section';
import { Input } from '@/components/ui/input';
import { quickLinkGroups } from '@/lib/quick-links';
import type { QuickLink, QuickLinkIcon } from '@/lib/quick-links';
import { cn } from '@/lib/utils';

const linkIconContentClassName =
    '[transition:color_300ms_ease,transform_420ms_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transition-none';

export function Links({ variant = 'page', query = '' }: { variant?: 'dialog' | 'page'; query?: string }) {
    const linksId = useId();
    const normalizedQuery = variant === 'dialog' ? query.trim().toLowerCase() : '';

    const filteredGroups = useMemo(
        () =>
            quickLinkGroups
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
        <div className="links min-h-0" data-links-variant={variant}>
            {filteredGroups.length > 0 ? (
                <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16" data-links-groups>
                    {filteredGroups.map((group, groupIndex) => (
                        <RevealSection
                            key={group.id}
                            aria-labelledby={`${linksId}-${group.id}`}
                            revealClassName="links-group-reveal"
                            rootMargin="0px 0px -6% 0px"
                            threshold={0.08}
                            data-links-group
                            style={
                                {
                                    '--links-group-delay': `${groupIndex * 70}ms`,
                                } as CSSProperties
                            }
                        >
                            <div
                                className="mb-5 border-l-2 border-foreground/20 pl-4 opacity-0 sm:border-l-0 sm:pl-0"
                                data-links-heading
                            >
                                <h2
                                    id={`${linksId}-${group.id}`}
                                    className="text-xl font-semibold tracking-tight sm:text-lg"
                                >
                                    {group.title}
                                </h2>
                                <p className="mt-2 text-sm/6 text-muted-foreground">{group.description}</p>
                            </div>

                            <ul className="relative border-t border-transparent" data-links-list>
                                {group.links.map((link, rowIndex) => (
                                    <QuickLinkRow
                                        key={`${group.id}-${link.name}`}
                                        link={link}
                                        motionIndex={rowIndex}
                                        variant={variant}
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
                    data-links-empty
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

export function LinksSearch({
    value,
    onValueChange,
    className,
}: {
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
}) {
    const searchId = useId();

    return (
        <div className={cn('group/search relative w-full min-w-0', className)} data-links-search>
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
                value={value}
                onChange={(event) => onValueChange(event.currentTarget.value)}
                placeholder="Search links and services…"
                autoComplete="off"
                className="h-12 rounded-xl border-border/75 bg-background/60 pr-5 pl-12 text-sm shadow-[inset_0_1px_0_rgb(255_255_255/0.025)] backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-muted-foreground/75 hover:border-primary/20 hover:bg-background/75 focus-visible:border-primary/35 focus-visible:bg-background/85 focus-visible:ring-3 focus-visible:ring-primary/10 md:text-sm dark:bg-white/2.5 dark:hover:bg-white/4 dark:focus-visible:bg-white/5"
            />
        </div>
    );
}

function QuickLinkRow({
    link,
    motionIndex,
    variant,
}: {
    link: QuickLink;
    motionIndex: number;
    variant: 'dialog' | 'page';
}) {
    const opensNewContext = link.href.startsWith('http');

    return (
        <li
            className="border-b border-border/70 opacity-0"
            data-links-row
            style={
                {
                    '--links-row-index': motionIndex,
                    '--links-row-delay': `${motionIndex * 48}ms`,
                } as CSSProperties
            }
        >
            <a
                href={link.href}
                target={opensNewContext ? '_blank' : undefined}
                rel={opensNewContext ? 'noopener noreferrer' : undefined}
                className="group relative grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4 transition-[border-color,background-color] duration-300 outline-none hover:bg-primary/[0.035] focus-visible:bg-primary/5.5 sm:gap-4 sm:px-2"
            >
                <span className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-white/75 shadow-xs [transition:transform_420ms_cubic-bezier(0.16,1,0.3,1),border-color_300ms_ease,box-shadow_420ms_cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:scale-[1.035] group-hover:border-[color-mix(in_oklab,var(--primary)_24%,var(--border))] group-hover:shadow-[0_10px_24px_-14px_color-mix(in_oklab,var(--primary)_45%,transparent)] group-focus-visible:-translate-y-0.5 group-focus-visible:scale-[1.035] group-focus-visible:border-[color-mix(in_oklab,var(--primary)_24%,var(--border))] group-focus-visible:shadow-[0_10px_24px_-14px_color-mix(in_oklab,var(--primary)_45%,transparent)] motion-reduce:transition-none dark:bg-white/90">
                    <LinkIcon icon={link.icon} />
                </span>

                <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="inline-block font-semibold tracking-tight [transition:color_300ms_ease,transform_420ms_cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:text-primary group-focus-visible:translate-x-0.5 group-focus-visible:text-primary motion-reduce:transition-none">
                            {link.name}
                        </span>
                        {link.access && (
                            <span className="inline-flex items-center gap-1 text-[0.625rem] font-medium tracking-wider text-muted-foreground uppercase">
                                <LockKeyhole aria-hidden="true" className="size-3" />
                                {link.access}
                            </span>
                        )}
                    </span>
                    <span className="mt-0.5 block text-sm/5 text-muted-foreground">{link.description}</span>
                    <span
                        className={cn(
                            'mt-1 block truncate font-mono text-[0.6875rem] text-muted-foreground/65',
                            variant === 'page' && 'max-sm:hidden'
                        )}
                    >
                        {link.destination}
                    </span>
                </span>

                <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 text-muted-foreground transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                />
                {opensNewContext && <span className="sr-only"> (opens in a new tab)</span>}
            </a>
        </li>
    );
}

function LinkIcon({ icon }: { icon: QuickLinkIcon }) {
    if (icon.kind === 'symbol') {
        const Icon = icon.icon;
        return <Icon aria-hidden="true" className={cn('size-5 text-primary', linkIconContentClassName)} />;
    }

    return (
        <img
            src={icon.src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className={cn('size-6 object-contain', linkIconContentClassName)}
        />
    );
}
