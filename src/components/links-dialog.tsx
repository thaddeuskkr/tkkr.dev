import { useEffect, useLayoutEffect, useState } from 'react';
import { useRouter, useSearch } from '@tanstack/react-router';
import { X } from 'lucide-react';

import { Links, LinksSearch } from '@/components/links';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function LinksDialog() {
    const router = useRouter();
    const { links } = useSearch({ from: '__root__' });
    const [query, setQuery] = useState('');
    useDocumentScrollLock(links === true);

    useEffect(() => {
        if (links) setQuery('');
    }, [links]);

    return (
        <Dialog
            modal="trap-focus"
            open={links === true}
            onOpenChange={(open) => {
                if (!open) router.history.back();
            }}
        >
            <DialogContent
                showCloseButton={false}
                overlayClassName="links-dialog__overlay"
                className="links-dialog top-0 left-0 grid h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-none border-0 bg-popover/95 p-0 text-foreground ring-0 backdrop-blur-xl sm:top-1/2 sm:left-1/2 sm:h-[min(88dvh,56rem)] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[min(calc(100vw-2.5rem),72rem)] sm:max-w-6xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-[rgb(124_84_220/0.28)] sm:shadow-[0_32px_90px_-28px_rgb(48_34_74/0.26),inset_0_1px_0_rgb(255_255_255/0.65)] dark:sm:border-[rgb(174_130_255/0.34)] dark:sm:shadow-[0_36px_100px_-26px_rgb(0_0_0/0.72),inset_0_1px_0_rgb(255_255_255/0.08)]"
            >
                <DialogHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-5 sm:gap-4 sm:px-8 sm:pt-8 sm:pb-5 lg:px-10">
                    <DialogTitle className="sr-only">Quick links</DialogTitle>
                    <DialogDescription className="sr-only">Search profiles and public services.</DialogDescription>

                    <LinksSearch value={query} onValueChange={setQuery} className="links-dialog__search opacity-0" />

                    <DialogClose
                        render={
                            <Button
                                variant="outline"
                                size="icon-lg"
                                className="links-dialog__close size-12 rounded-xl bg-background/45"
                                aria-label="Close quick links"
                            />
                        }
                    >
                        <X aria-hidden="true" />
                    </DialogClose>
                </DialogHeader>

                <div className="links-dialog__body min-h-0 overflow-y-auto overscroll-contain px-5 pt-3 pb-7 sm:px-8 sm:pt-2 sm:pb-9 lg:px-10">
                    <Links variant="dialog" query={query} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function useDocumentScrollLock(locked: boolean) {
    useLayoutEffect(() => {
        if (!locked) return;

        const root = document.documentElement;
        const body = document.body;
        const scrollPosition = consumeLinksScrollPosition();
        const scrollX = scrollPosition?.x ?? window.scrollX;
        const scrollY = scrollPosition?.y ?? window.scrollY;
        const rootOverflow = root.style.overflow;
        const bodyStyles = {
            position: body.style.position,
            top: body.style.top,
            right: body.style.right,
            bottom: body.style.bottom,
            left: body.style.left,
            width: body.style.width,
        };

        root.style.overflow = 'hidden';
        Object.assign(body.style, {
            position: 'fixed',
            top: `${-scrollY}px`,
            right: '0',
            bottom: 'auto',
            left: `${-scrollX}px`,
            width: '100%',
        });

        return () => {
            root.style.overflow = rootOverflow;
            Object.assign(body.style, bodyStyles);
            window.scrollTo(scrollX, scrollY);
        };
    }, [locked]);
}

function consumeLinksScrollPosition() {
    const { dataset } = document.documentElement;
    const x = Number(dataset.linksScrollX);
    const y = Number(dataset.linksScrollY);

    delete dataset.linksScrollX;
    delete dataset.linksScrollY;

    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    return { x, y };
}
