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
import { Textarea } from "@/components/ui/textarea";
import type { DirectoryEntryInput } from "@/lib/admin/directory";
export function DirectoryEntryForm({
    value,
    onChange,
    onClose,
    onSubmit,
    pending,
    error,
}: {
    value: DirectoryEntryInput | null;
    onChange: (fields: Partial<DirectoryEntryInput>) => void;
    onClose: () => void;
    onSubmit: (event: FormEvent) => void;
    pending: boolean;
    error: string;
}) {
    return (
        <Dialog
            open={Boolean(value)}
            onOpenChange={(open) => {
                if (!open && !pending) onClose();
            }}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl p-6">
                <DialogHeader>
                    <DialogTitle>
                        {value?.id ? "Edit directory entry" : "Add directory entry"}
                    </DialogTitle>
                    <DialogDescription>Update the links shown on your website.</DialogDescription>
                </DialogHeader>
                {value && (
                    <form onSubmit={onSubmit} className="space-y-5">
                        <fieldset disabled={pending} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="Name" id="link-name">
                                    <Input
                                        id="link-name"
                                        required
                                        maxLength={100}
                                        value={value.name}
                                        onChange={(e) => onChange({ name: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Group" id="link-group">
                                    <NativeSelect
                                        id="link-group"
                                        className="w-full"
                                        value={value.groupId}
                                        onChange={(e) =>
                                            onChange({
                                                groupId: e.target.value,
                                            })}>
                                        <NativeSelectOption value="directory">
                                            Directory
                                        </NativeSelectOption>
                                        <NativeSelectOption value="social">
                                            Social
                                        </NativeSelectOption>
                                    </NativeSelect>
                                </FormField>
                            </div>
                            <FormField label="URL" id="link-url">
                                <Input
                                    id="link-url"
                                    required
                                    maxLength={2048}
                                    placeholder="https://example.com"
                                    value={value.href}
                                    onChange={(e) => onChange({ href: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Displayed address" id="link-address">
                                <Input
                                    id="link-address"
                                    required
                                    maxLength={2048}
                                    placeholder="example.com"
                                    value={value.destination}
                                    onChange={(e) =>
                                        onChange({
                                            destination: e.target.value,
                                        })}
                                />
                            </FormField>
                            <FormField label="Description" id="link-description">
                                <Textarea
                                    id="link-description"
                                    maxLength={500}
                                    value={value.description}
                                    onChange={(e) =>
                                        onChange({
                                            description: e.target.value,
                                        })}
                                />
                            </FormField>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="Icon" id="directory-icon">
                                    <NativeSelect
                                        id="directory-icon"
                                        className="w-full"
                                        value={value.iconKind}
                                        onChange={(e) =>
                                            onChange({
                                                iconKind: e.target.value,
                                            })}>
                                        <NativeSelectOption value="globe">
                                            Website
                                        </NativeSelectOption>
                                        <NativeSelectOption value="mail">Email</NativeSelectOption>
                                        <NativeSelectOption value="activity">
                                            Status
                                        </NativeSelectOption>
                                        <NativeSelectOption value="selfhst">
                                            selfh.st logo
                                        </NativeSelectOption>
                                    </NativeSelect>
                                </FormField>
                                <FormField
                                    label="Order"
                                    id="link-order"
                                    hint="Lower numbers appear first.">
                                    <Input
                                        id="link-order"
                                        type="number"
                                        min={0}
                                        max={10000}
                                        required
                                        value={value.sortOrder}
                                        onChange={(e) =>
                                            onChange({
                                                sortOrder: Number(e.target.value),
                                            })}
                                    />
                                </FormField>
                            </div>
                            {value.iconKind === "selfhst" && (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            label="Icon reference"
                                            id="icon-ref"
                                            hint="The name from selfh.st/icons, e.g. dockhand.">
                                            <Input
                                                id="icon-ref"
                                                required
                                                value={value.iconReference}
                                                onChange={(e) =>
                                                    onChange({
                                                        iconReference: e.target.value,
                                                    })}
                                            />
                                        </FormField>
                                        <FormField label="Icon format" id="icon-format">
                                            <NativeSelect
                                                id="icon-format"
                                                className="w-full"
                                                value={value.iconFormat}
                                                onChange={(e) =>
                                                    onChange({
                                                        iconFormat: e.target.value,
                                                    })}>
                                                <NativeSelectOption value="svg">
                                                    SVG
                                                </NativeSelectOption>
                                                <NativeSelectOption value="webp">
                                                    WebP
                                                </NativeSelectOption>
                                                <NativeSelectOption value="png">
                                                    PNG
                                                </NativeSelectOption>
                                            </NativeSelect>
                                        </FormField>
                                    </div>
                                    <Field orientation="horizontal">
                                        <Switch
                                            id="icon-themed"
                                            checked={value.iconThemed}
                                            onCheckedChange={(checked) =>
                                                onChange({
                                                    iconThemed: checked,
                                                })}
                                        />
                                        <FieldLabel htmlFor="icon-themed">
                                            Icon has light/dark variants
                                        </FieldLabel>
                                    </Field>
                                </>
                            )}
                            <FormField
                                label="Search keywords"
                                id="link-keywords"
                                hint="Separate keywords with commas.">
                                <Input
                                    id="link-keywords"
                                    maxLength={500}
                                    value={value.keywords}
                                    onChange={(e) => onChange({ keywords: e.target.value })}
                                />
                            </FormField>
                            <div className="flex flex-wrap gap-5">
                                <Field orientation="horizontal" className="w-auto">
                                    <Switch
                                        id="link-visible"
                                        checked={value.enabled}
                                        onCheckedChange={(checked) =>
                                            onChange({ enabled: checked })}
                                    />
                                    <FieldLabel htmlFor="link-visible">Show on website</FieldLabel>
                                </Field>
                                <Field orientation="horizontal" className="w-auto">
                                    <Switch
                                        id="link-private"
                                        checked={value.restricted}
                                        onCheckedChange={(checked) =>
                                            onChange({ restricted: checked })}
                                    />
                                    <FieldLabel htmlFor="link-private">Private badge</FieldLabel>
                                </Field>
                            </div>
                            <FieldDescription>
                                The Private badge is a label; access is controlled by the
                                destination.
                            </FieldDescription>
                        </fieldset>
                        <FormError error={error} />
                        <FormActions pending={pending} onCancel={onClose} submitLabel="Save link" />
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
