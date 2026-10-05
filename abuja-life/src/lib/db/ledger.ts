import { getClient, getDb } from "./index";
import { users, transactionLedger, User } from "./schema";
import { eq } from "drizzle-orm";
import { ORIGINS, OriginType } from "../game/constants";

export async function initDatabase() {
  const client = getClient();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      origin TEXT NOT NULL,
      money INTEGER NOT NULL,
      energy INTEGER NOT NULL DEFAULT 100,
      hunger INTEGER NOT NULL DEFAULT 100,
      fun INTEGER NOT NULL DEFAULT 100,
      clout INTEGER NOT NULL DEFAULT 0,
      career_track TEXT NOT NULL DEFAULT 'civil_service',
      career_rank INTEGER NOT NULL DEFAULT 1,
      car_id TEXT,
      apartment_id TEXT NOT NULL,
      current_location TEXT NOT NULL DEFAULT 'secretariat',
      last_shift_at INTEGER DEFAULT 0,
      last_saved_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS transaction_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL
    );
  `);
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] || null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0] || null;
}

export async function createUser(username: string, origin: OriginType): Promise<User> {
  await initDatabase();
  const db = getDb();
  const existing = await getUserByUsername(username);
  if (existing) return existing;

  const config = ORIGINS[origin];
  const now = Date.now();
  const id = `usr_${Math.random().toString(36).slice(2, 10)}`;

  const newUser = {
    id,
    username,
    origin,
    money: config.startingCash,
    energy: 100,
    hunger: 100,
    fun: 100,
    clout: config.cloutBonus,
    careerTrack: "civil_service",
    careerRank: 1,
    carId: null,
    apartmentId: config.startingApartment,
    currentLocation: config.startingLocation,
    lastShiftAt: 0,
    lastSavedAt: now,
    createdAt: now,
  };

  await db.insert(users).values(newUser);

  // Initial deposit ledger entry
  await db.insert(transactionLedger).values({
    id: `tx_${Math.random().toString(36).slice(2, 10)}`,
    userId: id,
    amount: config.startingCash,
    balanceAfter: config.startingCash,
    actionType: "initial_grant",
    metadata: JSON.stringify({ origin }),
    createdAt: now,
  });

  return newUser as User;
}

export async function executeTransaction(
  userId: string,
  amount: number,
  actionType: string,
  metadata?: Record<string, unknown>
): Promise<{ newBalance: number }> {
  const db = getDb();
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  const newBalance = user.money + amount;
  if (newBalance < 0) {
    throw new Error(`Insufficient funds: requires ₦${Math.abs(amount).toLocaleString()}, available ₦${user.money.toLocaleString()}`);
  }

  const now = Date.now();
  const txId = `tx_${Math.random().toString(36).slice(2, 10)}`;

  // Record ledger entry
  await db.insert(transactionLedger).values({
    id: txId,
    userId,
    amount,
    balanceAfter: newBalance,
    actionType,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: now,
  });

  // Update user balance
  await db.update(users).set({ money: newBalance, lastSavedAt: now }).where(eq(users.id, userId));

  return { newBalance };
}

export async function updateUserVitals(
  userId: string,
  updates: Partial<Pick<User, "energy" | "hunger" | "fun" | "clout" | "careerRank" | "apartmentId" | "carId" | "currentLocation" | "lastShiftAt">>
): Promise<User> {
  const db = getDb();
  const now = Date.now();
  await db.update(users).set({ ...updates, lastSavedAt: now }).where(eq(users.id, userId));
  const updated = await getUserById(userId);
  if (!updated) throw new Error("User update failed");
  return updated;
}
