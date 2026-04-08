import { MongoClient } from "mongodb";
import { nanoid } from "nanoid";
import { unstable_cache } from "next/cache";
import type { Announcement, AnnouncementCategory } from "@/types";

export const ANNOUNCEMENT_CACHE_TAG = "announcement";

type AnnouncementDocument = Omit<Announcement, "category"> & {
    category?: AnnouncementCategory;
};

const defaultServerSelectionTimeoutMS = 5000;
const configuredServerSelectionTimeoutMS = Number.parseInt(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? "",
    10,
);
const serverSelectionTimeoutMS =
    Number.isFinite(configuredServerSelectionTimeoutMS) && configuredServerSelectionTimeoutMS > 0 ?
        configuredServerSelectionTimeoutMS
    :   defaultServerSelectionTimeoutMS;

const options = {
    serverSelectionTimeoutMS,
};

let clientPromise: Promise<MongoClient> | undefined;

function getCachedClientPromise() {
    if (process.env.NODE_ENV === "development") {
        return global._mongoClientPromise;
    }
    return clientPromise;
}

function setCachedClientPromise(promise: Promise<MongoClient> | undefined) {
    if (process.env.NODE_ENV === "development") {
        global._mongoClientPromise = promise;
        return;
    }
    clientPromise = promise;
}

function clearCachedClientPromise() {
    setCachedClientPromise(undefined);
}

function getDatabase(client: MongoClient) {
    return client.db(process.env.MONGODB_DB || "tkkr");
}

function getUrlsCollection(client: MongoClient) {
    return getDatabase(client).collection(process.env.MONGODB_COLLECTION || "urls");
}

function getAnnouncementsCollection(client: MongoClient) {
    return getDatabase(client).collection<AnnouncementDocument>(
        process.env.MONGODB_ANNOUNCEMENTS_COLLECTION || "announcements",
    );
}

function toAnnouncement(document: AnnouncementDocument): Announcement {
    return {
        ...document,
        category: document.category ?? "announcement",
    };
}

function shouldResetConnection(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const retryableErrorNames = new Set([
        "MongoNetworkError",
        "MongoServerSelectionError",
        "MongoTopologyClosedError",
        "MongoNotConnectedError",
        "MongoPoolClosedError",
    ]);
    if (retryableErrorNames.has(error.name)) return true;

    const retryableErrorCodes = new Set([
        "ENOTFOUND",
        "ECONNREFUSED",
        "ECONNRESET",
        "ETIMEDOUT",
        "EHOSTUNREACH",
        "ENETUNREACH",
    ]);
    const code = (error as Error & { code?: string }).code;
    if (code && retryableErrorCodes.has(code)) return true;

    const message = error.message.toLowerCase();
    if (
        message.includes("server selection timed out") ||
        message.includes("topology is closed") ||
        message.includes("not connected") ||
        message.includes("enotfound") ||
        message.includes("connection refused")
    ) {
        return true;
    }

    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause) return shouldResetConnection(cause);

    return false;
}

function shouldRetryImmediately(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const immediateRetryErrorNames = new Set([
        "MongoTopologyClosedError",
        "MongoNotConnectedError",
        "MongoPoolClosedError",
    ]);
    if (immediateRetryErrorNames.has(error.name)) return true;

    const message = error.message.toLowerCase();
    if (message.includes("topology is closed") || message.includes("not connected")) {
        return true;
    }

    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause) return shouldRetryImmediately(cause);

    return false;
}

async function createClientPromise(uri: string) {
    const client = new MongoClient(uri, options);
    const promise = client.connect().catch(async (error) => {
        clearCachedClientPromise();
        try {
            await client.close();
        } catch {}
        throw error;
    });
    setCachedClientPromise(promise);
    return promise;
}

function getClientPromise() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("Invalid database URI");
    }

    const cachedPromise = getCachedClientPromise();
    if (cachedPromise) return cachedPromise;

    return createClientPromise(uri);
}

async function withClientRetry<T>(operation: (client: MongoClient) => Promise<T>): Promise<T> {
    let firstAttemptClient: MongoClient | null = null;

    try {
        firstAttemptClient = await getClientPromise();
        return await operation(firstAttemptClient);
    } catch (error) {
        if (!shouldResetConnection(error)) throw error;

        clearCachedClientPromise();
        if (firstAttemptClient) {
            try {
                await firstAttemptClient.close();
            } catch {}
        }

        if (!shouldRetryImmediately(error)) throw error;

        const client = await getClientPromise();
        return operation(client);
    }
}

export async function checkConnection() {
    const res = {
        connected: false,
        error: null as string | null,
    };
    try {
        await withClientRetry(async (client) => {
            await client.db("admin").command({ ping: 1 });
        });
        res.connected = true;
    } catch (error) {
        res.error = error instanceof Error ? error.message : String(error);
    }
    return res;
}

const getCachedAnnouncement = unstable_cache(
    async (): Promise<Announcement | null> => {
        try {
            const announcement = await withClientRetry(async (client) =>
                getAnnouncementsCollection(client).findOne({
                    _id: "site-announcement",
                }),
            );

            return announcement ? toAnnouncement(announcement) : null;
        } catch (error) {
            console.error("Database error:", error);
            return null;
        }
    },
    ["announcement", "site-announcement"],
    { tags: [ANNOUNCEMENT_CACHE_TAG] },
);

export async function getAnnouncement() {
    return getCachedAnnouncement();
}

export async function saveAnnouncement({
    message,
    category,
    updatedBy,
}: {
    message: string;
    category: AnnouncementCategory;
    updatedBy: string;
}) {
    try {
        const currentDate = new Date();

        return await withClientRetry(async (client) => {
            const collection = getAnnouncementsCollection(client);
            const existingAnnouncement = await collection.findOne({
                _id: "site-announcement",
            });

            if (existingAnnouncement) {
                await collection.updateOne(
                    { _id: "site-announcement" },
                    {
                        $set: {
                            message,
                            category,
                            updatedBy,
                            updatedAt: currentDate,
                        },
                    },
                );

                return {
                    success: true as const,
                    created: false,
                    announcement: toAnnouncement({
                        ...existingAnnouncement,
                        message,
                        category,
                        updatedBy,
                        updatedAt: currentDate,
                    }),
                };
            }

            const newAnnouncement: AnnouncementDocument = {
                _id: "site-announcement",
                message,
                category,
                updatedBy,
                createdAt: currentDate,
                updatedAt: currentDate,
            };

            await collection.insertOne(newAnnouncement);

            return {
                success: true as const,
                created: true,
                announcement: toAnnouncement(newAnnouncement),
            };
        });
    } catch (error) {
        console.error("Database error:", error);
        return { success: false as const, error: "Database error" };
    }
}

export async function deleteAnnouncement() {
    try {
        const deletedCount = await withClientRetry(async (client) => {
            const collection = getAnnouncementsCollection(client);
            const deleted = await collection.deleteOne({
                _id: "site-announcement",
            });
            return deleted.deletedCount;
        });

        if (!deletedCount) {
            return { success: false as const, error: "Announcement not found" };
        }

        return { success: true as const };
    } catch (error) {
        console.error("Database error:", error);
        return { success: false as const, error: "Database error" };
    }
}

export async function getUrlBySlug(slug: string, password: string) {
    try {
        const urlDoc = await withClientRetry(async (client) => {
            const collection = getUrlsCollection(client);

            return collection.findOne({
                slugs: slug,
                $or: [{ expiry: null }, { expiry: { $gt: new Date() } }],
            });
        });

        if (!urlDoc || (urlDoc.password && urlDoc.password.length && urlDoc.password !== password))
            return null;

        return urlDoc;
    } catch (error) {
        console.error("Database error:", error);
        return null;
    }
}

export async function shortenUrl({
    url,
    slugs,
    expiry,
    createdBy,
    password,
}: {
    url: string;
    slugs: string[];
    expiry: number | null;
    createdBy: string;
    password: string | null;
}) {
    if (!slugs || slugs.length === 0) {
        slugs = [nanoid(6)];
    }

    try {
        const currentDate = new Date();

        const newUrlDoc = {
            url,
            slugs,
            expiry: expiry ? new Date(currentDate.getTime() + expiry) : null,
            password: password || null,
            createdBy,
            createdAt: currentDate,
        };

        const inserted = await withClientRetry(async (client) => {
            const collection = getUrlsCollection(client);

            if (await collection.findOne({ slugs: { $in: slugs } })) {
                return false;
            }

            await collection.insertOne(newUrlDoc);
            return true;
        });
        if (!inserted) {
            return { success: false, error: "Slug(s) already in use" };
        }

        return { success: true, data: newUrlDoc };
    } catch (error) {
        console.error("Database error:", error);
        return { success: false, error: "Database error" };
    }
}
