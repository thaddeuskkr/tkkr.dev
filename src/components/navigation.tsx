import { Link as RouterLink, useSearch } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';
import { Home, UserRound, Link as LinkIcon } from 'lucide-react';

const navigationLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/about', label: 'About', icon: UserRound },
] as const;

const navigationItemClassName =
    'rounded-lg px-2 text-muted-foreground hover:bg-background/30 hover:text-foreground motion-safe:hover:-translate-y-px min-[430px]:px-2.5 dark:hover:bg-white/5';

const activeNavigationItemClassName =
    'bg-primary/[0.11] text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_8px_20px_-16px_rgb(77_45_130/0.4)] ring-1 ring-primary/25 ring-inset backdrop-blur-md duration-500 hover:bg-primary/[0.15] hover:ring-primary/35 aria-expanded:bg-primary/[0.11] dark:bg-primary/10 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.1)] dark:ring-primary/20 dark:hover:bg-primary/14 dark:aria-expanded:bg-primary/10';

export function Navigation() {
    const { links } = useSearch({ from: '__root__' });

    return (
        <nav
            aria-label="Primary navigation"
            className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 motion-safe:animate-nav-enter sm:px-4"
        >
            <div className="pointer-events-auto mx-auto mt-4 grid h-14 w-full max-w-4xl grid-cols-[1fr_auto] items-center rounded-xl border border-border/70 bg-background/75 px-2 shadow-[0_12px_40px_-26px_var(--foreground)] backdrop-blur-lg backdrop-saturate-150 transition-[border-color,background-color,box-shadow] duration-500 hover:border-primary/20 supports-backdrop-filter:bg-background/65 sm:mt-5 sm:grid-cols-3 sm:px-2.5">
                <div className="flex gap-0.5">
                    {navigationLinks.map(({ to, label, icon: Icon }) => (
                        <RouterLink
                            key={to}
                            to={to}
                            aria-label={label}
                            activeOptions={{ exact: true }}
                            className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), navigationItemClassName)}
                            activeProps={{ className: activeNavigationItemClassName }}
                        >
                            <Icon className="transition-transform duration-300 group-hover/button:scale-110 min-[430px]:mr-0.5" />
                            <span className="hidden min-[430px]:inline">{label}</span>
                        </RouterLink>
                    ))}
                    {/* Restore the Projects item when the projects page is ready.
                    <Button aria-label="Projects" variant="ghost" size="lg" className={navigationItemClassName}>
                        <Briefcase className="transition-transform duration-300 group-hover/button:scale-110 min-[430px]:mr-0.5" />
                        <span className="hidden min-[430px]:inline">Projects</span>
                    </Button>
                    */}
                </div>

                <div aria-hidden="true" className="hidden sm:block" />

                <div className="flex justify-end gap-1">
                    <RouterLink
                        to="."
                        search={(previous) => ({ ...previous, links: true })}
                        mask={{ to: '/links', search: {}, unmaskOnReload: true }}
                        resetScroll={false}
                        onPointerDownCapture={captureLinksScrollPosition}
                        onClickCapture={captureLinksScrollPositionIfNeeded}
                        onKeyDownCapture={(event) => {
                            if (event.key === 'Enter') captureLinksScrollPosition();
                        }}
                        aria-label="Open links and services"
                        aria-haspopup="dialog"
                        aria-expanded={links === true}
                        className={cn(
                            buttonVariants({ variant: 'outline', size: 'lg' }),
                            'rounded-lg px-2 md:px-3',
                            links && activeNavigationItemClassName
                        )}
                    >
                        <LinkIcon className="transition-transform duration-300 group-hover/button:-rotate-12 md:mr-0.5" />
                        <span className="hidden md:inline">Quick Links</span>
                    </RouterLink>
                    <ModeToggle />
                </div>
            </div>
        </nav>
    );
}

function captureLinksScrollPosition() {
    const { dataset } = document.documentElement;
    dataset.linksScrollX = String(window.scrollX);
    dataset.linksScrollY = String(window.scrollY);
}

function captureLinksScrollPositionIfNeeded() {
    if (document.documentElement.dataset.linksScrollY === undefined) {
        captureLinksScrollPosition();
    }
}
