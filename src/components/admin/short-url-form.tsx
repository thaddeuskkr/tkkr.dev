import type { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { FormField, FormActions, FormError } from "./form-fields";
import type { ShortLinkInput } from "@/lib/admin/short-links";
export function ShortUrlForm({
    value,
    onChange,
    onClose,
    onSubmit,
    pending,
    error,
    expiryEnabled,
    onExpiryEnabledChange,
    timeZone,
}: {
    value: ShortLinkInput | null;
    onChange: (fields: Partial<ShortLinkInput>) => void;
    onClose: () => void;
    onSubmit: (event: FormEvent) => void;
    pending: boolean;
    error: string;
    expiryEnabled: boolean;
    onExpiryEnabledChange: (enabled: boolean) => void;
    timeZone: string | null;
}) {
    return (
        <Dialog
            open={Boolean(value)}
            onOpenChange={(open) => {
                if (!open && !pending) onClose();
            }}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto p-6 sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{value?.id ? "Edit short URL" : "Add short URL"}</DialogTitle>
                    <DialogDescription>
                        Manage the destination, aliases, expiry, and access.
                    </DialogDescription>
                </DialogHeader>
                {value && (
                    <form onSubmit={onSubmit} className="space-y-5">
                        <fieldset disabled={pending} className="space-y-4">
                            <FormField label="Destination URL" id="short-destination">
                                <Input
                                    id="short-destination"
                                    required
                                    maxLength={2048}
                                    placeholder="https://example.com"
                                    value={value.destination}
                                    onChange={(e) =>
                                        onChange({
                                            destination: e.target.value,
                                        })}
                                />
                            </FormField>
                            <FormField
                                label="Aliases"
                                id="short-aliases"
                                hint="Separate aliases with commas. Each alias opens the same destination.">
                                <Input
                                    id="short-aliases"
                                    required
                                    value={value.slugs}
                                    placeholder="my-link, another-alias"
                                    onChange={(e) => onChange({ slugs: e.target.value })}
                                />
                            </FormField>
                            <Field orientation="horizontal">
                                <Switch
                                    id="short-expiry-enabled"
                                    checked={expiryEnabled}
                                    disabled={pending}
                                    onCheckedChange={onExpiryEnabledChange}
                                    aria-controls={expiryEnabled ? "short-expiry" : undefined}
                                />
                                <div>
                                    <FieldLabel htmlFor="short-expiry-enabled">
                                        Set expiry
                                    </FieldLabel>
                                    <FieldDescription>
                                        {expiryEnabled ?
                                            "Choose when this short URL stops working." :
                                            "This short URL will never expire."}
                                    </FieldDescription>
                                </div>
                            </Field>
                            {expiryEnabled && (
                                <FormField
                                    label="Expiry (local time)"
                                    id="short-expiry"
                                    hint={`Your time zone: ${timeZone ?? "local time"}.`}>
                                    <Input
                                        id="short-expiry"
                                        type="datetime-local"
                                        required
                                        step="0.001"
                                        value={value.expiresAt}
                                        onChange={(e) =>
                                            onChange({
                                                expiresAt: e.target.value,
                                            })}
                                    />
                                </FormField>
                            )}
                            <FormField label="Protection" id="short-protection">
                                <NativeSelect
                                    id="short-protection"
                                    className="w-full"
                                    value={value.protection}
                                    onChange={(e) =>
                                        onChange({
                                            protection: e.target.value,
                                            secret: "",
                                        })}>
                                    {value.id && (
                                        <NativeSelectOption value="keep">
                                            Keep existing protection
                                        </NativeSelectOption>
                                    )}
                                    <NativeSelectOption value="public">Public</NativeSelectOption>
                                    <NativeSelectOption value="pin">PIN</NativeSelectOption>
                                    <NativeSelectOption value="password">
                                        Password
                                    </NativeSelectOption>
                                    <NativeSelectOption value="key">
                                        Generated access key
                                    </NativeSelectOption>
                                </NativeSelect>
                            </FormField>
                            {(value.protection === "pin" || value.protection === "password") && (
                                <FormField
                                    label={value.protection === "pin" ? "New PIN" : "New password"}
                                    id="short-secret"
                                    hint={
                                        value.protection === "pin" ?
                                            "4–8 digits." :
                                            "8–128 characters."
                                    }>
                                    <Input
                                        id="short-secret"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        inputMode={
                                            value.protection === "pin" ? "numeric" : undefined
                                        }
                                        minLength={value.protection === "pin" ? 4 : 8}
                                        maxLength={value.protection === "pin" ? 8 : 128}
                                        pattern={
                                            value.protection === "pin" ? "[0-9]{4,8}" : undefined
                                        }
                                        value={value.secret}
                                        onChange={(e) => onChange({ secret: e.target.value })}
                                    />
                                </FormField>
                            )}
                            {value.protection === "key" && (
                                <FieldDescription>
                                    A new random access key will be shown once after saving.
                                </FieldDescription>
                            )}
                            {value.id && value.protection !== "keep" && (
                                <FieldDescription>
                                    Changing protection replaces the current PIN, password, or key.
                                </FieldDescription>
                            )}
                        </fieldset>
                        <FormError error={error} />
                        <FormActions
                            pending={pending}
                            onCancel={onClose}
                            submitLabel="Save short URL"
                        />
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
