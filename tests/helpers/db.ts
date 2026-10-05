import { resetDbConnection } from "../../src/lib/db/index";
import { initDatabase } from "../../src/lib/db/ledger";
import { randomBytes } from "crypto";
import { join } from "path";
import { tmpdir } from "os";

/**
 * Call in beforeEach to get a fresh in-memory SQLite DB per test.
 * Uses a unique temp file path so each test suite gets its own isolated DB.
 */
export async function initTestDb() {
  // Use a unique temp file so each test run gets an isolated SQLite db
  const uniqueName = `abuja_test_${randomBytes(8).toString("hex")}.db`;
  const dbPath = join(tmpdir(), uniqueName);
  process.env.DATABASE_URL = `file:${dbPath}`;
  resetDbConnection();
  await initDatabase();
}
