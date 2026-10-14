import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
export function FormField({
    label,
    id,
    hint,
    children,
}: {
    label: string;
    id: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {children}
            {hint && <FieldDescription>{hint}</FieldDescription>}
        </Field>
    );
}

export function FormError({ error }: { error: string }) {
    return error ?
            (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            ) :
        null;
}

export function FormActions({
    pending,
    onCancel,
    submitLabel,
}: {
    pending: boolean;
    onCancel: () => void;
    submitLabel: string;
}) {
    return (
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
                Cancel
            </Button>
            <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />} {submitLabel}
            </Button>
        </div>
    );
}
