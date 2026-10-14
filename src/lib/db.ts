import pg from "pg";
import { attachDatabasePool } from "@vercel/functions";
export interface Database {
    query<T extends Record<string, unknown> = Record<string, unknown>>(
        text: string,
        values?: unknown[],
    ): Promise<T[]>;
    withTransaction<T>(work: (db: Pick<Database, "query">) => Promise<T>): Promise<T>;
}
let pool: pg.Pool | undefined;
export function databasePool(): pg.Pool {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing. Run neon env pull.");
    if (!pool) {
        const connection = new URL(process.env.DATABASE_URL);
        connection.searchParams.set("sslmode", "verify-full");
        pool = new pg.Pool({
            connectionString: connection.href,
            max: 5,
            idleTimeoutMillis: 5000,
            connectionTimeoutMillis: 10000,
        });
        attachDatabasePool(pool);
        pool.on("error", () => console.error("Database pool connection failed."));
    }

    return pool;
}

export function database(): Database {
    const activePool = databasePool();
    const withTransaction: Database["withTransaction"] = async (work) => {
        const client = await activePool.connect();
        try {
            await client.query("BEGIN");
            const result = await work({
                query: async <T extends Record<string, unknown>>(
                    text: string,
                    values: unknown[] = [],
                ) => (await client.query<T>(text, values)).rows,
            });
            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    };

    return {
        query: async <T extends Record<string, unknown>>(text: string, values: unknown[] = []) =>
            (await activePool.query<T>(text, values)).rows,
        withTransaction,
    };
}
