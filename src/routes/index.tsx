import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Navigation } from '@/components/navigation';

export const Route = createFileRoute('/')({ component: App });

function App() {
    return (
        <div className="w-full">
            <div className="mx-auto">
                <p className="mt-10">Thaddeus Kuah</p>
            </div>
        </div>
    );
}
