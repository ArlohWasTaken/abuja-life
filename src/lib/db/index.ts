import { createClient, Client } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

let _client: Client | null = null;
let _db: LibSQLDatabase<typeof schema> | null = null;

export function getClient(): Client {
  if (!_client) {
    const dbUrl = process.env.DATABASE_URL || "file:abuja_life.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;
    _client = createClient({ url: dbUrl, authToken });
    _db = drizzle(_client, { schema });
  }
  return _client;
}

export function getDb(): LibSQLDatabase<typeof schema> {
  getClient(); // ensure initialized
  return _db!;
}

/** Reset singletons — call in tests after setting process.env.DATABASE_URL */
export function resetDbConnection() {
  _client = null;
  _db = null;
}

// Convenience re-exports that lazily resolve — used by production paths
export const client = new Proxy({} as Client, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});

export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});
