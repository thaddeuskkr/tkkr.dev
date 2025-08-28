import { MongoClient } from "mongodb";
import { nanoid } from "nanoid";

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("Invalid database URI");
}
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;

export async function getUrlBySlug(slug: string, password: string) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || "tkkr");
        const collection = db.collection(process.env.MONGODB_COLLECTION || "urls");

        const urlDoc = await collection.findOneAndUpdate(
            { slugs: slug, password: password, expiry: { $gt: new Date() } },
            { $inc: { clicks: 1 } },
            { returnDocument: "after" },
        );
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
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || "tkkr");
        const collection = db.collection(process.env.MONGODB_COLLECTION || "urls");

        if (!slugs || slugs.length === 0) {
            slugs = [nanoid(6)];
        }

        if (await collection.findOne({ slugs: { $in: slugs } })) {
            return { success: false, error: "Slug(s) already in use" };
        }

        const currentDate = new Date();

        await collection.deleteMany({ expiry: { $lte: currentDate } });

        const newUrlDoc = {
            url,
            slugs,
            expiry: expiry ? new Date(currentDate.getTime() + expiry) : null,
            password: password || null,
            createdBy,
            createdAt: currentDate,
            clicks: 0,
        };

        await collection.insertOne(newUrlDoc);
        return { success: true, data: newUrlDoc };
    } catch (error) {
        console.error("Database error:", error);
        return { success: false, error: "Database error" };
    }
}
