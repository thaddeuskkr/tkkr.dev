import type { MongoClient, ObjectId } from "mongodb";

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export interface ShortUrl {
    _id: ObjectId;
    url: string;
    slugs: string[];
    password: string | null;
    expiry: Date | null;
    createdBy: string;
    createdAt: Date;
}
