import { describe, it, expect, beforeEach } from "vitest";
import { initTestDb } from "./helpers/db";

// Re-import after env reset happens in initTestDb
async function getLedger() {
  return await import("../src/lib/db/ledger");
}

describe("Ledger — createUser", () => {
  beforeEach(async () => {
    await initTestDb();
  });

  it("creates a corper with correct starting cash of ₦33,000", async () => {
    const { createUser } = await getLedger();
    const user = await createUser("testCorper", "corper");
    expect(user.money).toBe(33000);
    expect(user.origin).toBe("corper");
    expect(user.username).toBe("testCorper");
  });

  it("creates a contractor with correct starting cash of ₦150,000", async () => {
    const { createUser } = await getLedger();
    const user = await createUser("testContractor", "contractor");
    expect(user.money).toBe(150000);
  });

  it("creates a gwarinpa landlord with correct starting cash of ₦80,000", async () => {
    const { createUser } = await getLedger();
    const user = await createUser("testGwarinpa", "gwarinpa");
    expect(user.money).toBe(80000);
  });

  it("creates a nepo with correct starting cash of ₦2,500,000", async () => {
    const { createUser } = await getLedger();
    const user = await createUser("testNepo", "nepo");
    expect(user.money).toBe(2500000);
  });

  it("returns existing user if username already taken", async () => {
    const { createUser } = await getLedger();
    const first = await createUser("dupUser", "corper");
    const second = await createUser("dupUser", "nepo");
    expect(second.id).toBe(first.id);
    expect(second.money).toBe(33000); // original origin preserved
  });

  it("sets nepo starting apartment to maitama_mansion", async () => {
    const { createUser } = await getLedger();
    const user = await createUser("bigMan", "nepo");
    expect(user.apartmentId).toBe("maitama_mansion");
  });

  it("sets corper starting apartment to kubwa_bq", async () => {
    const { createUser } = await getLedger();
    const user = await createUser("freshCorper", "corper");
    expect(user.apartmentId).toBe("kubwa_bq");
  });
});

describe("Ledger — executeTransaction", () => {
  beforeEach(async () => {
    await initTestDb();
  });

  it("credits money correctly", async () => {
    const { createUser, executeTransaction, getUserById } = await getLedger();
    const user = await createUser("creditTest", "corper");
    await executeTransaction(user.id, 10000, "test_credit");
    const updated = await getUserById(user.id);
    expect(updated!.money).toBe(43000);
  });

  it("debits money correctly", async () => {
    const { createUser, executeTransaction, getUserById } = await getLedger();
    const user = await createUser("debitTest", "corper");
    await executeTransaction(user.id, -10000, "test_debit");
    const updated = await getUserById(user.id);
    expect(updated!.money).toBe(23000);
  });

  it("throws Insufficient funds when balance would go negative", async () => {
    const { createUser, executeTransaction } = await getLedger();
    const user = await createUser("brokeTest", "corper"); // starts with 33000
    await expect(
      executeTransaction(user.id, -50000, "overspend")
    ).rejects.toThrow("Insufficient funds");
  });

  it("does not update balance when transaction is rejected", async () => {
    const { createUser, executeTransaction, getUserById } = await getLedger();
    const user = await createUser("atomicTest", "corper");
    try {
      await executeTransaction(user.id, -50000, "will_fail");
    } catch {
      // expected
    }
    const unchanged = await getUserById(user.id);
    expect(unchanged!.money).toBe(33000);
  });
});

describe("Ledger — getUserById / getUserByUsername", () => {
  beforeEach(async () => {
    await initTestDb();
  });

  it("returns null for unknown id", async () => {
    const { getUserById } = await getLedger();
    const result = await getUserById("nonexistent_id");
    expect(result).toBeNull();
  });

  it("returns null for unknown username", async () => {
    const { getUserByUsername } = await getLedger();
    const result = await getUserByUsername("nobody");
    expect(result).toBeNull();
  });

  it("retrieves a created user by id", async () => {
    const { createUser, getUserById } = await getLedger();
    const user = await createUser("lookupTest", "gwarinpa");
    const found = await getUserById(user.id);
    expect(found).not.toBeNull();
    expect(found!.username).toBe("lookupTest");
  });
});
