import { resetDbConnection } from "../../src/lib/db/index";
import { initDatabase } from "../../src/lib/db/ledger";

/**
 * Call in beforeEach to get a fresh in-memory SQLite DB per test.
 * Must be called before any import that uses db/ledger functions.
 */
export async function initTestDb() {
  process.env.DATABASE_URL = "file::memory:?cache=shared";
  resetDbConnection();
  await initDatabase();
}
