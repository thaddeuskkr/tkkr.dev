"use client";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, Copy, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
    saveDirectoryEntry,
    deleteDirectoryEntry,
    saveShortLink,
    deleteShortLink,
} from "@/app/admin/actions";
import type { ManagedDirectoryEntry, DirectoryEntryInput } from "@/lib/admin/directory";
import type { ManagedShortLink, ShortLinkInput } from "@/lib/admin/short-links";
import { formatAdminDate, localExpiryToISO, toLocalDateTime } from "@/lib/admin/dates";
import { authClient } from "@/lib/auth-client";
import { DirectoryEntryIcon } from "@/components/directory-entry-icon";
import { DirectoryEntryForm } from "./admin/directory-entry-form";
import { ShortUrlForm } from "./admin/short-url-form";
import { FormField } from "./admin/form-fields";

function emptyDirectoryEntry(order: number): DirectoryEntryInput {
    return {
        groupId: "directory",
        name: "",
        description: "",
        href: "",
        destination: "",
        iconKind: "globe",
        iconReference: "",
        iconFormat: "svg",
        iconThemed: true,
        restricted: false,
        keywords: "",
        sortOrder: order,
        enabled: true,
    };
}

function directoryEntryForm(link: ManagedDirectoryEntry): DirectoryEntryInput {
    const icon = link.icon;
    const file = icon.kind === "brand" ? (icon.src.split("/").at(-1) ?? "") : "";
    return {
        id: link.id,
        version: link.updatedAt,
        groupId: link.groupId,
        name: link.name,
        description: link.description,
        href: link.href,
        destination: link.destination,
        iconKind: icon.kind === "brand" ? "selfhst" : icon.name,
        iconReference: file.replace(/\.(svg|webp|png)$/, "").replace(/-(light|dark)$/, ""),
        iconFormat: file.split(".").at(-1) || "svg",
        iconThemed: icon.kind === "brand" && Boolean(icon.darkSrc),
        restricted: Boolean(link.access),
        keywords: link.keywords?.join(", ") ?? "",
        sortOrder: link.sortOrder,
        enabled: link.enabled,
    };
}

function shortForm(link?: ManagedShortLink): ShortLinkInput {
    return {
        id: link?.id,
        version: link?.updatedAt,
        destination: link?.destination ?? "",
        slugs: link?.slugs.join(", ") ?? "",
        expiresAt: link?.expiresAt != null ? toLocalDateTime(link.expiresAt) : "",
        protection: link ? "keep" : "public",
        secret: "",
    };
}

function subscribeToTimeZone(callback: () => void) {
    window.addEventListener("focus", callback);
    document.addEventListener("visibilitychange", callback);
    return () => {
        window.removeEventListener("focus", callback);
        document.removeEventListener("visibilitychange", callback);
    };
}

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverTimeZone = () => null;
type Deletion = {
    kind: "directory" | "short";
    id: string;
    version: number;
    label: string;
};

export function AdminDashboard({
    directoryEntries,
    shortLinks,
    userName,
}: {
    directoryEntries: ManagedDirectoryEntry[];
    shortLinks: ManagedShortLink[];
    userName: string;
}) {
    const router = useRouter();
    const [tab, setTab] = useState("directory");
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [link, setLink] = useState<DirectoryEntryInput | null>(null);
    const [short, setShort] = useState<ShortLinkInput | null>(null);
    const [expiryEnabled, setExpiryEnabled] = useState(false);
    const timeZone = useSyncExternalStore(subscribeToTimeZone, browserTimeZone, serverTimeZone);
    const [deletion, setDeletion] = useState<Deletion | null>(null);
    const [credentials, setCredentials] = useState<{
        accessKey?: string;
        handoffSecret?: string;
    } | null>(null);
    const [pending, setPending] = useState(false);
    const [formError, setFormError] = useState("");
    const needle = query.trim().toLowerCase();
    const visibleDirectory = directoryEntries.filter(
        (item) =>
            (filter === "all" ||
                item.groupId === filter ||
                (filter === "hidden" && !item.enabled)) &&
                [item.name, item.href, item.description].join(" ").toLowerCase().includes(needle),
    );
    const visibleShort = shortLinks.filter(
        (item) =>
            (filter === "all" ||
                (filter === "protected" && item.protection !== "public") ||
                (filter === "expired" && item.expired)) &&
                [item.destination, ...item.slugs].join(" ").toLowerCase().includes(needle),
    );
    function updateDirectoryEntry(fields: Partial<DirectoryEntryInput>) {
        setLink((current) => (current ? { ...current, ...fields } : null));
    }

    function updateShortUrl(fields: Partial<ShortLinkInput>) {
        setShort((current) => (current ? { ...current, ...fields } : null));
    }

    function editDirectoryEntry(item?: ManagedDirectoryEntry) {
        setFormError("");
        setLink(
            item ?
                    directoryEntryForm(item) :
                    emptyDirectoryEntry(
                        Math.max(
                            -1,
                            ...directoryEntries
                                .filter((l) => l.groupId === "directory")
                                .map((l) => l.sortOrder),
                        ) + 1,
                    ),
        );
    }

    function editShort(item?: ManagedShortLink) {
        setFormError("");
        setExpiryEnabled(item?.expiresAt != null);
        setShort(shortForm(item));
    }

    async function submitDirectoryEntry(event: FormEvent) {
        event.preventDefault();
        if (!link || pending) return;
        setPending(true);
        setFormError("");
        try {
            const result = await saveDirectoryEntry(link);
            if (!result.ok) {
                setFormError(result.error);
                return;
            }

            setLink(null);
            toast.success("Directory entry saved.");
            router.refresh();
        } catch {
            setFormError("Unable to save. Please try again.");
        } finally {
            setPending(false);
        }
    }

    async function submitShort(event: FormEvent) {
        event.preventDefault();
        if (!short || pending) return;
        setPending(true);
        setFormError("");
        try {
            const result = await saveShortLink({
                ...short,
                expiresAt:
                    expiryEnabled ?
                            localExpiryToISO(
                                short.expiresAt,
                                shortLinks.find((item) => item.id === short.id)?.expiresAt ?? null,
                            ) :
                        "",
            });
            if (!result.ok) {
                setFormError(result.error);
                return;
            }

            setShort(null);
            toast.success("Short URL saved.");
            router.refresh();
            if (result.data.accessKey || result.data.handoffSecret) setCredentials(result.data);
        } catch (error) {
            setFormError(
                error instanceof Error ?
                    error.message :
                    "Unable to save. Please check the fields and try again.",
            );
        } finally {
            setPending(false);
        }
    }

    async function confirmDelete() {
        if (!deletion || pending) return;
        setPending(true);
        try {
            const result =
                deletion.kind === "directory" ?
                        await deleteDirectoryEntry(deletion.id, deletion.version) :
                        await deleteShortLink(deletion.id, deletion.version);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            setDeletion(null);
            toast.success("Link deleted.");
            router.refresh();
        } catch {
            toast.error("Unable to delete. Please try again.");
        } finally {
            setPending(false);
        }
    }

    async function copy(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied.");
        } catch {
            toast.error("Couldn't copy. Select and copy the address manually.");
        }
    }

    async function signOut() {
        setPending(true);
        try {
            const result = await authClient.signOut();
            if (result.error) throw new Error();
            router.refresh();
        } catch {
            toast.error("Unable to sign out. Please try again.");
        } finally {
            setPending(false);
        }
    }

    return (
        <>
            <header className="mb-10 mt-8 flex flex-wrap items-end justify-between gap-5">
                <div>
                    <h1 className="text-3xl font-medium tracking-tight">Admin</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Manage the links on tkkr.dev.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{userName}</span>
                    <Button variant="outline" onClick={signOut} disabled={pending}>
                        <LogOut className="size-3.5" /> Sign out
                    </Button>
                </div>
            </header>
            <Tabs
                value={tab}
                onValueChange={(value) => {
                    setTab(String(value));
                    setQuery("");
                    setFilter("all");
                }}>
                <TabsList variant="line" className="mb-6 gap-6">
                    <TabsTrigger value="directory">
                        Directory{" "}
                        <span className="ml-1 text-xs text-muted-foreground">
                            {directoryEntries.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="short">
                        Short URLs{" "}
                        <span className="ml-1 text-xs text-muted-foreground">
                            {shortLinks.length}
                        </span>
                    </TabsTrigger>
                </TabsList>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex w-full flex-wrap gap-3 sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                aria-label={
                                    tab === "directory" ?
                                        "Search directory entries" :
                                        "Search short URLs"
                                }
                                placeholder="Search links…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="h-10 pl-9"
                            />
                        </div>
                        <NativeSelect
                            aria-label="Filter links"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="h-10 [&_select]:h-full">
                            <NativeSelectOption value="all">All links</NativeSelectOption>
                            {tab === "directory" ?
                                    (
                                        <>
                                            <NativeSelectOption value="social">Social</NativeSelectOption>
                                            <NativeSelectOption value="directory">
                                                Directory
                                            </NativeSelectOption>
                                            <NativeSelectOption value="hidden">Hidden</NativeSelectOption>
                                        </>
                                    ) :
                                    (
                                        <>
                                            <NativeSelectOption value="protected">
                                                Protected
                                            </NativeSelectOption>
                                            <NativeSelectOption value="expired">Expired</NativeSelectOption>
                                        </>
                                    )}
                        </NativeSelect>
                    </div>
                    <Button
                        onClick={() => (tab === "directory" ? editDirectoryEntry() : editShort())}
                        className="h-10"
                        disabled={pending}>
                        <Plus className="size-4" />
                        {tab === "directory" ? "Add directory entry" : "Add short URL"}
                    </Button>
                </div>
                <TabsContent value="directory">
                    <div className="rounded-xl border border-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-5">Link</TableHead>
                                    <TableHead>Group</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Visibility</TableHead>
                                    <TableHead className="text-right pr-5">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleDirectory.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="py-4 pl-5">
                                            <div className="flex items-center gap-3">
                                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary/50">
                                                    <DirectoryEntryIcon icon={item.icon} />
                                                </span>
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <a
                                                        href={item.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-1 block max-w-72 truncate text-xs text-muted-foreground hover:text-foreground">
                                                        {item.destination}
                                                    </a>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {item.groupId === "social" ? "Social" : "Directory"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.sortOrder}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.enabled ? "secondary" : "outline"}>
                                                {item.enabled ?
                                                    item.access ?
                                                        "Private" :
                                                        "Visible" :
                                                    "Hidden"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Edit ${item.name}`}
                                                onClick={() => editDirectoryEntry(item)}
                                                disabled={pending}>
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Delete ${item.name}`}
                                                onClick={() =>
                                                    setDeletion({
                                                        kind: "directory",
                                                        id: item.id,
                                                        version: item.updatedAt,
                                                        label: item.name,
                                                    })}
                                                disabled={pending}>
                                                <Trash2 className="size-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!visibleDirectory.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-16 text-center text-muted-foreground">
                                            No directory entries found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
                <TabsContent value="short">
                    <div className="rounded-xl border border-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-5">Aliases</TableHead>
                                    <TableHead>Destination</TableHead>
                                    <TableHead>Access</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead className="pr-5 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleShort.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="py-4 pl-5">
                                            <div className="flex max-w-52 flex-wrap gap-1.5">
                                                {item.slugs.map((slug) => (
                                                    <a
                                                        href={`/${slug}`}
                                                        key={slug}
                                                        target="_blank"
                                                        rel="noopener noreferrer">
                                                        <Badge variant="secondary">/{slug}</Badge>
                                                    </a>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p
                                                className="max-w-80 truncate text-sm"
                                                title={item.destination}>
                                                {item.destination}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Created {formatAdminDate(item.createdAt, timeZone)}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {item.expired ? "Expired" : item.protection}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                            {formatAdminDate(item.expiresAt, timeZone)}
                                        </TableCell>
                                        <TableCell className="pr-4 text-right whitespace-nowrap">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Copy ${item.slugs[0]}`}
                                                onClick={() =>
                                                    copy(
                                                        new URL(
                                                            `/${item.slugs[0]}`,
                                                            window.location.origin,
                                                        ).href,
                                                    )}>
                                                <Copy className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Edit ${item.slugs[0]}`}
                                                onClick={() => editShort(item)}
                                                disabled={pending}>
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Delete ${item.slugs[0]}`}
                                                onClick={() =>
                                                    setDeletion({
                                                        kind: "short",
                                                        id: item.id,
                                                        version: item.updatedAt,
                                                        label: item.slugs
                                                            .map((s) => `/${s}`)
                                                            .join(", "),
                                                    })}
                                                disabled={pending}>
                                                <Trash2 className="size-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!visibleShort.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-16 text-center text-muted-foreground">
                                            No short URLs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
            <DirectoryEntryForm
                value={link}
                onChange={updateDirectoryEntry}
                onClose={() => setLink(null)}
                onSubmit={submitDirectoryEntry}
                pending={pending}
                error={formError}
            />
            <ShortUrlForm
                value={short}
                onChange={updateShortUrl}
                onClose={() => setShort(null)}
                onSubmit={submitShort}
                pending={pending}
                error={formError}
                expiryEnabled={expiryEnabled}
                onExpiryEnabledChange={setExpiryEnabled}
                timeZone={timeZone}
            />
            <AlertDialog
                open={Boolean(deletion)}
                onOpenChange={(open) => {
                    if (!open && !pending) setDeletion(null);
                }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete {deletion?.kind === "short" ? "short URL" : "directory entry"}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Delete {deletion?.label}?{" "}
                            {deletion?.kind === "short" ?
                                "All of its aliases will stop working." :
                                "It will be removed from the website."}{" "}
                            This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={pending}>
                            {pending && <Loader2 className="animate-spin" />} Delete link
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Dialog
                open={Boolean(credentials)}
                onOpenChange={(open) => {
                    if (!open) setCredentials(null);
                }}>
                <DialogContent className="sm:max-w-lg p-6">
                    <DialogHeader>
                        <DialogTitle>Save your credentials</DialogTitle>
                        <DialogDescription>
                            Store these securely. They won’t be shown again.
                        </DialogDescription>
                    </DialogHeader>
                    {credentials?.accessKey && (
                        <FormField label="Access key" id="new-access-key">
                            <div className="flex gap-2">
                                <Input id="new-access-key" readOnly value={credentials.accessKey} />
                                <Button
                                    variant="outline"
                                    aria-label="Copy access key"
                                    onClick={() => copy(credentials.accessKey!)}>
                                    <Copy />
                                </Button>
                            </div>
                        </FormField>
                    )}
                    {credentials?.handoffSecret && (
                        <details className="text-sm">
                            <summary className="cursor-pointer text-muted-foreground">
                                Destination handoff secret
                            </summary>
                            <p className="my-3 text-xs leading-5 text-muted-foreground">
                                Use this only if the destination verifies signed access tokens.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    aria-label="Handoff secret"
                                    readOnly
                                    value={credentials.handoffSecret}
                                />
                                <Button
                                    variant="outline"
                                    aria-label="Copy handoff secret"
                                    onClick={() => copy(credentials.handoffSecret!)}>
                                    <Copy />
                                </Button>
                            </div>
                        </details>
                    )}
                    <Button onClick={() => setCredentials(null)}>Done</Button>
                </DialogContent>
            </Dialog>
            <Toaster richColors />
        </>
    );
}
