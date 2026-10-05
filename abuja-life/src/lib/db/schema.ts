import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  origin: text("origin").notNull(), // 'corper' | 'contractor' | 'gwarinpa' | 'nepo'
  money: integer("money").notNull(),
  energy: integer("energy").notNull().default(100),
  hunger: integer("hunger").notNull().default(100),
  fun: integer("fun").notNull().default(100),
  clout: integer("clout").notNull().default(0),
  careerTrack: text("career_track").notNull().default("civil_service"),
  careerRank: integer("career_rank").notNull().default(1),
  carId: text("car_id"),
  apartmentId: text("apartment_id").notNull(),
  currentLocation: text("current_location").notNull().default("secretariat"),
  lastShiftAt: integer("last_shift_at").default(0),
  lastSavedAt: integer("last_saved_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const transactionLedger = sqliteTable("transaction_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  actionType: text("action_type").notNull(),
  metadata: text("metadata"),
  createdAt: integer("created_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Transaction = typeof transactionLedger.$inferSelect;
