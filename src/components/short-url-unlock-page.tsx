import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ShortUrlProtection } from '@/lib/shortener/store';

type UnlockPageState =
    { kind: 'idle' } | { kind: 'rejected'; attemptsRemaining?: number } | { kind: 'locked'; retryAfterSeconds: number };

type ShortUrlUnlockPageProps = {
    protection: ShortUrlProtection;
    scriptNonce?: string;
    slug: string;
    state: UnlockPageState;
};

const unlockInteractionScript = `(function(){
var toggle=document.querySelector('[data-secret-toggle]');
var secret=document.querySelector('#access-key');
if(toggle&&secret){var secretName=(toggle.getAttribute('aria-label')||'Show secret').slice(5);toggle.addEventListener('click',function(){var showing=secret.type==='text';secret.type=showing?'password':'text';toggle.setAttribute('aria-pressed',String(!showing));toggle.setAttribute('aria-label',(showing?'Show ':'Hide ')+secretName);var show=toggle.querySelector('[data-secret-show]');var hide=toggle.querySelector('[data-secret-hide]');if(show)show.classList.toggle('hidden',!showing);if(hide)hide.classList.toggle('hidden',showing);secret.focus();});}
var slots=Array.from(document.querySelectorAll('[data-pin-slot]'));
function fill(start,value){var digits=value.replace(/[^0-9]/g,'').slice(0,slots.length-start);for(var i=0;i<digits.length;i+=1){slots[start+i].value=digits[i];}var next=Math.min(start+digits.length,slots.length-1);slots[next].focus();slots[next].select();}
slots.forEach(function(slot,index){slot.addEventListener('focus',function(){slot.select();});slot.addEventListener('input',function(){var digits=slot.value.replace(/[^0-9]/g,'');slot.value=digits.slice(-1);if(digits.length>1){fill(index,digits);return;}if(slot.value&&index<slots.length-1){slots[index+1].focus();slots[index+1].select();}});slot.addEventListener('paste',function(event){var value=event.clipboardData&&event.clipboardData.getData('text');if(value){event.preventDefault();fill(index,value);}});slot.addEventListener('keydown',function(event){if(event.key==='Backspace'&&!slot.value&&index>0){event.preventDefault();slots[index-1].value='';slots[index-1].focus();}else if(event.key==='ArrowLeft'&&index>0){event.preventDefault();slots[index-1].focus();}else if(event.key==='ArrowRight'&&index<slots.length-1){event.preventDefault();slots[index+1].focus();}});});
})();`;

export function ShortUrlUnlockPage({ protection, scriptNonce, slug, state }: ShortUrlUnlockPageProps) {
    const locked = state.kind === 'locked';
    const descriptionId = state.kind === 'idle' ? 'unlock-description' : 'unlock-feedback';
    const copy = protectionCopy(protection);

    return (
        <main className="relative grid min-h-svh overflow-hidden bg-background px-5 py-10 text-foreground sm:px-8">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-36 -right-40 size-120 rounded-full bg-primary/15 blur-3xl motion-safe:animate-ambient-drift dark:bg-primary/7" />
                <div className="absolute -bottom-52 -left-44 size-112 rounded-full bg-primary/13 blur-3xl motion-safe:animate-ambient-drift-reverse dark:bg-primary/5" />
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent" />
            </div>

            <section
                aria-labelledby="unlock-heading"
                className="relative z-10 m-auto w-full max-w-md motion-safe:animate-hero-copy"
            >
                <div className="mb-7 flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.45)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
                    <LockKeyhole className="size-5" aria-hidden="true" />
                </div>

                <p className="mb-3 font-mono text-[0.68rem] font-medium tracking-[0.12em] text-primary uppercase motion-safe:animate-hero-eyebrow">
                    /{slug}
                </p>
                <h1
                    id="unlock-heading"
                    className="max-w-sm text-4xl leading-[1.02] font-semibold tracking-[-0.045em] text-balance sm:text-4xl"
                >
                    This short URL is protected.
                </h1>
                <p
                    id="unlock-description"
                    className="mt-4 max-w-sm text-sm/6 text-pretty text-muted-foreground sm:text-base/7"
                >
                    {copy.description}
                </p>

                <form method="post" action={`/${slug}`} className="mt-4" aria-describedby={descriptionId}>
                    <label
                        htmlFor={protection.kind === 'pin' ? 'pin-0' : 'access-key'}
                        className="mb-2.5 block text-sm font-medium"
                    >
                        {copy.label}
                    </label>

                    {protection.kind === 'pin' ? (
                        <PinEntry length={protection.length} invalid={state.kind === 'rejected'} disabled={locked} />
                    ) : (
                        <SecretEntry kind={protection.kind} invalid={state.kind === 'rejected'} disabled={locked} />
                    )}

                    {state.kind !== 'idle' ? <UnlockFeedback state={state} protection={protection} /> : null}

                    <Button
                        type="submit"
                        size="lg"
                        disabled={locked}
                        className="mt-5 h-11 w-full rounded-xl text-sm shadow-[0_14px_34px_-18px_var(--primary)] transition-[transform,background-color,box-shadow] duration-300 motion-safe:hover:-translate-y-0.5"
                    >
                        {locked ? 'Temporarily locked' : 'Continue'}
                        {!locked ? <ArrowRight data-icon="inline-end" className="ml-1" aria-hidden="true" /> : null}
                    </Button>
                </form>
            </section>
            <script nonce={scriptNonce} dangerouslySetInnerHTML={{ __html: unlockInteractionScript }} />
        </main>
    );
}

function PinEntry({ length, invalid, disabled }: { length: number; invalid: boolean; disabled: boolean }) {
    return (
        <div className="flex w-full justify-between gap-1.5 sm:gap-2" role="group" aria-label={`${length}-digit PIN`}>
            {Array.from({ length }, (_, index) => (
                <Input
                    key={index}
                    id={`pin-${index}`}
                    name="pinDigit"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    autoFocus={index === 0 && !disabled}
                    disabled={disabled}
                    aria-invalid={invalid || undefined}
                    aria-label={`PIN digit ${index + 1}`}
                    data-pin-slot
                    className="aspect-square h-auto max-w-16 min-w-0 flex-1 rounded-xl px-0 py-0 text-center text-xl leading-none font-semibold tabular-nums sm:text-2xl"
                />
            ))}
        </div>
    );
}

function SecretEntry({ kind, invalid, disabled }: { kind: 'key' | 'password'; invalid: boolean; disabled: boolean }) {
    return (
        <div className="relative">
            <Input
                id="access-key"
                name="accessKey"
                type="password"
                maxLength={kind === 'password' ? 128 : 256}
                autoComplete={kind === 'password' ? 'current-password' : 'off'}
                autoCapitalize="off"
                spellCheck={false}
                autoFocus={!disabled}
                disabled={disabled}
                required
                aria-invalid={invalid || undefined}
                className="h-12 rounded-xl pr-12 pl-3.5 text-base md:text-sm"
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label={`Show ${kind === 'password' ? 'password' : 'access key'}`}
                aria-pressed="false"
                data-secret-toggle
                className="absolute top-1/2 right-1.5 size-9 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground active:not-aria-[haspopup]:-translate-y-1/2"
            >
                <Eye data-secret-show aria-hidden="true" />
                <EyeOff data-secret-hide className="hidden" aria-hidden="true" />
            </Button>
        </div>
    );
}

function UnlockFeedback({
    state,
    protection,
}: {
    state: Exclude<UnlockPageState, { kind: 'idle' }>;
    protection: ShortUrlProtection;
}) {
    if (state.kind === 'locked') {
        return (
            <p id="unlock-feedback" role="alert" className="mt-3 text-sm/6 text-destructive">
                Too many attempts. Try again in {formatRetryAfter(state.retryAfterSeconds)}.
            </p>
        );
    }

    const secretName = protection.kind === 'pin' ? 'PIN' : protection.kind === 'password' ? 'password' : 'access key';
    const attempts = state.attemptsRemaining;
    return (
        <p id="unlock-feedback" role="alert" className="mt-3 text-sm/6 text-destructive">
            Incorrect {secretName}.
            {attempts === undefined ? '' : ` ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'} remaining.`}
        </p>
    );
}

function protectionCopy(protection: ShortUrlProtection): { description: string; label: string } {
    switch (protection.kind) {
        case 'pin':
            return {
                description: `Enter the ${protection.length}-digit PIN shared with you to continue.`,
                label: 'PIN',
            };
        case 'password':
            return {
                description: 'Enter the password shared with you to continue.',
                label: 'Password',
            };
        case 'key':
            return {
                description: 'Enter the private access key shared with you to continue.',
                label: 'Access key',
            };
    }
}

function formatRetryAfter(seconds: number): string {
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}
