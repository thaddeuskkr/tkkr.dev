import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Briefcase, Home, Info, Link } from 'lucide-react';

const navigationItems = [
    { page: 'home', label: 'Home', icon: Home },
    { page: 'about', label: 'About', icon: Info },
    { page: 'projects', label: 'Projects', icon: Briefcase },
];

export function Navigation({ currentPage }: { currentPage: string }) {
    return (
        <nav className="fixed inset-x-0 top-0 z-50 px-4">
            <div className="mx-auto mt-5 grid w-full max-w-4xl grid-cols-3 items-center rounded-md bg-sidebar/25 p-2.5 outline-1 outline-accent backdrop-blur-sm">
                <div className="flex gap-0.5">
                    {navigationItems.map(({ page, label, icon: Icon }) => (
                        <Button key={page} variant={currentPage === page ? 'secondary' : 'ghost'}>
                            <Icon className="mr-0.5" />
                            {label}
                        </Button>
                    ))}
                </div>

                <div>{/* optional centered content */}</div>

                <div className="flex justify-end gap-1">
                    <Button variant="outline">
                        <Link className="mr-0.5" />
                        Quick Links
                    </Button>
                    <ModeToggle />
                </div>
            </div>
        </nav>
    );
}
