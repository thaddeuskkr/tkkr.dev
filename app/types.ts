import type { MongoClient, ObjectId } from "mongodb";
import type { DefaultSession } from "next-auth";

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

declare module "next-auth" {
    interface User {
        sub?: string;
        nickname?: string;
        roles?: string[];
    }

    interface Session {
        user: {
            sub?: string;
            nickname?: string;
            roles?: string[];
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        sub?: string;
        nickname?: string;
        roles?: string[];
    }
}

export interface Auth0UserProfile {
    "/roles"?: string[];
    nickname?: string;
    preferred_username?: string;
    name?: string;
    picture?: string;
    updated_at?: string;
    email?: string;
    email_verified?: boolean;
    iss: string;
    aud: string;
    sub: string;
    iat: number;
    exp: number;
    sid?: string;
    id?: string;
}

export interface ShortUrl {
    _id: ObjectId;
    url: string;
    slugs: string[];
    password: string | null;
    expiry: Date | null;
    createdBy: string;
    createdAt: Date;
    clicks: number;
}
