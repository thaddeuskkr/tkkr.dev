import { Link as RouterLink } from '@tanstack/react-router';
import { Button, buttonVariants } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';
import { Briefcase, Home, Info, Link as LinkIcon } from 'lucide-react';

const navigationLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/about', label: 'About', icon: Info },
] as const;

const navigationItemClassName =
    'rounded-lg bg-transparent px-2 text-muted-foreground hover:bg-background/30 hover:text-foreground motion-safe:hover:-translate-y-px min-[430px]:px-2.5 dark:hover:bg-white/5';

const activeNavigationItemClassName =
    'border-primary/12 bg-primary/[0.07] text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-md hover:border-primary/16 hover:bg-primary/11 dark:bg-primary/9 dark:hover:bg-primary/13';

export function Navigation() {
    return (
        <nav
            aria-label="Primary navigation"
            className="fixed inset-x-0 top-0 z-50 px-3 motion-safe:animate-nav-enter sm:px-4"
        >
            <div className="mx-auto mt-4 grid h-14 w-full max-w-4xl grid-cols-[1fr_auto] items-center rounded-xl border border-border/70 bg-background/75 px-2 shadow-[0_12px_40px_-26px_var(--foreground)] backdrop-blur-lg backdrop-saturate-150 transition-[border-color,background-color,box-shadow] duration-500 hover:border-primary/20 supports-backdrop-filter:bg-background/65 sm:mt-5 sm:grid-cols-3 sm:px-2.5">
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
                    <Button aria-label="Projects" variant="ghost" size="lg" className={navigationItemClassName}>
                        <Briefcase className="transition-transform duration-300 group-hover/button:scale-110 min-[430px]:mr-0.5" />
                        <span className="hidden min-[430px]:inline">Projects</span>
                    </Button>
                </div>

                <div aria-hidden="true" className="hidden sm:block" />

                <div className="flex justify-end gap-1">
                    <Button variant="outline" size="lg" className="hidden rounded-lg sm:inline-flex md:px-3">
                        <LinkIcon className="transition-transform duration-300 group-hover/button:-rotate-12 md:mr-0.5" />
                        <span className="hidden md:inline">Quick Links</span>
                    </Button>
                    <ModeToggle />
                </div>
            </div>
        </nav>
    );
}
