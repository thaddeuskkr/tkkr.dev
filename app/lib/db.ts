import { MongoClient } from "mongodb";
import { nanoid } from "nanoid";

const options = {};

let clientPromise: Promise<MongoClient> | undefined;

function getClientPromise() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("Invalid database URI");
    }

    if (process.env.NODE_ENV === "development") {
        if (!global._mongoClientPromise) {
            const client = new MongoClient(uri, options);
            global._mongoClientPromise = client.connect();
        }
        return global._mongoClientPromise;
    }

    if (!clientPromise) {
        const client = new MongoClient(uri, options);
        clientPromise = client.connect();
    }
    return clientPromise;
}

export async function checkConnection() {
    const res = {
        connected: false,
        error: null as string | null,
    };
    try {
        const client = await getClientPromise();
        await client.db("admin").command({ ping: 1 });
        res.connected = true;
    } catch (error) {
        res.error = error instanceof Error ? error.message : String(error);
    }
    return res;
}

export async function getUrlBySlug(slug: string, password: string) {
    try {
        const client = await getClientPromise();
        const db = client.db(process.env.MONGODB_DB || "tkkr");
        const collection = db.collection(process.env.MONGODB_COLLECTION || "urls");

        const urlDoc = await collection.findOne({
            slugs: slug,
            $or: [{ expiry: null }, { expiry: { $gt: new Date() } }],
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
    try {
        const client = await getClientPromise();
        const db = client.db(process.env.MONGODB_DB || "tkkr");
        const collection = db.collection(process.env.MONGODB_COLLECTION || "urls");

        if (!slugs || slugs.length === 0) {
            slugs = [nanoid(6)];
        }

        if (await collection.findOne({ slugs: { $in: slugs } })) {
            return { success: false, error: "Slug(s) already in use" };
        }

        const currentDate = new Date();

        const newUrlDoc = {
            url,
            slugs,
            expiry: expiry ? new Date(currentDate.getTime() + expiry) : null,
            password: password || null,
            createdBy,
            createdAt: currentDate,
        };

        await collection.insertOne(newUrlDoc);
        return { success: true, data: newUrlDoc };
    } catch (error) {
        console.error("Database error:", error);
        return { success: false, error: "Database error" };
    }
}
