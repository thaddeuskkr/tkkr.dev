import { MoonStar, SunMedium } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/theme-provider';

export function ModeToggle() {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="outline"
                        size="icon-lg"
                        className="group/theme relative overflow-hidden rounded-lg"
                        title="Choose colour theme"
                    >
                        <span
                            aria-hidden="true"
                            className="absolute inset-1 scale-75 rounded-full bg-primary/8 opacity-40 blur-sm transition-[scale,opacity] duration-500 ease-out motion-reduce:transition-none dark:scale-125 dark:opacity-80"
                        />
                        <span
                            aria-hidden="true"
                            className="relative flex size-5 items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/theme:-rotate-12 motion-reduce:transition-none dark:group-hover/theme:rotate-12"
                        >
                            <SunMedium className="absolute size-[1.05rem] translate-x-0 translate-y-0 scale-100 rotate-0 text-primary opacity-100 transition-[translate,rotate,scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none dark:translate-x-2 dark:-translate-y-5 dark:scale-50 dark:rotate-90 dark:opacity-0" />
                            <MoonStar className="absolute size-[1.05rem] -translate-x-2 translate-y-5 scale-50 -rotate-90 text-primary opacity-0 transition-[translate,rotate,scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none dark:translate-x-0 dark:translate-y-0 dark:scale-100 dark:rotate-0 dark:opacity-100" />
                        </span>
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                }
            />
            <DropdownMenuContent align="end" className="mt-1 border border-border/70 bg-popover/90 shadow-lg">
                <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
