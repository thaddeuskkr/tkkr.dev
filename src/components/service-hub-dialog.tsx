import { useLayoutEffect } from 'react';
import { useRouter, useSearch } from '@tanstack/react-router';
import { X } from 'lucide-react';

import { ServiceHub } from '@/components/service-hub';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function ServiceHubDialog() {
    const router = useRouter();
    const { links } = useSearch({ from: '__root__' });
    useDocumentScrollLock(links === true);

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
                overlayClassName="service-hub-dialog__overlay"
                className="service-hub-dialog top-0 left-0 grid h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-none border-0 bg-popover/95 p-0 text-foreground ring-0 backdrop-blur-xl sm:top-1/2 sm:left-1/2 sm:h-[min(88dvh,56rem)] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[min(calc(100vw-2.5rem),72rem)] sm:max-w-6xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-[rgb(124_84_220/0.28)] sm:shadow-[0_32px_90px_-28px_rgb(48_34_74/0.26),inset_0_1px_0_rgb(255_255_255/0.65)] dark:sm:border-[rgb(174_130_255/0.34)] dark:sm:shadow-[0_36px_100px_-26px_rgb(0_0_0/0.72),inset_0_1px_0_rgb(255_255_255/0.08)]"
            >
                <DialogHeader className="service-hub-dialog__header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 px-5 py-5 sm:px-8 sm:py-7">
                    <div>
                        <DialogTitle className="service-hub-dialog__title text-2xl font-semibold tracking-tight sm:text-3xl">
                            Links &amp; services
                        </DialogTitle>
                        <DialogDescription className="service-hub-dialog__description mt-2 max-w-3xl text-sm/6 sm:text-base/7 lg:whitespace-nowrap">
                            The places I&apos;m active and the public entry points into the systems I maintain.
                        </DialogDescription>
                    </div>

                    <DialogClose
                        render={
                            <Button
                                variant="outline"
                                size="icon-lg"
                                className="service-hub-dialog__close size-10 rounded-xl bg-background/45"
                                aria-label="Close links and services"
                            />
                        }
                    >
                        <X aria-hidden="true" />
                    </DialogClose>
                </DialogHeader>

                <div className="service-hub-dialog__body min-h-0 overflow-y-auto overscroll-contain px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
                    <ServiceHub variant="dialog" />
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
        const scrollPosition = consumeServiceHubScrollPosition();
        const scrollX = scrollPosition?.x ?? window.scrollX;
        const scrollY = scrollPosition?.y ?? window.scrollY;
        const rootStyles = {
            overflow: root.style.overflow,
            scrollbarGutter: root.style.scrollbarGutter,
        };
        const bodyStyles = {
            position: body.style.position,
            top: body.style.top,
            right: body.style.right,
            bottom: body.style.bottom,
            left: body.style.left,
            width: body.style.width,
        };

        Object.assign(root.style, {
            overflow: 'hidden',
            scrollbarGutter: 'stable',
        });
        Object.assign(body.style, {
            position: 'fixed',
            top: `${-scrollY}px`,
            right: '0',
            bottom: 'auto',
            left: `${-scrollX}px`,
            width: '100%',
        });

        return () => {
            Object.assign(root.style, rootStyles);
            Object.assign(body.style, bodyStyles);
            window.scrollTo(scrollX, scrollY);
        };
    }, [locked]);
}

function consumeServiceHubScrollPosition() {
    const { dataset } = document.documentElement;
    const x = Number(dataset.serviceHubScrollX);
    const y = Number(dataset.serviceHubScrollY);

    delete dataset.serviceHubScrollX;
    delete dataset.serviceHubScrollY;

    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    return { x, y };
}
