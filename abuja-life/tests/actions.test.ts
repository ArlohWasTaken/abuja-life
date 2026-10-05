import { describe, it, expect, beforeEach } from "vitest";
import { initTestDb } from "./helpers/db";
import { createUser, updateUserVitals } from "../src/lib/db/ledger";
import { handleGameAction } from "../src/lib/game/actions";

describe("Game Action Rules & Vitals", () => {
  beforeEach(async () => {
    await initTestDb();
  });

  it("should process eating Al-Basha Shawarma with correct vitals and cash deduction", async () => {
    const user = await createUser("amina_test", "corper"); // 33,000 cash, 100 energy, 100 hunger
    // Reduce hunger first so we can verify restoration
    await updateUserVitals(user.id, { hunger: 50 });

    const result = await handleGameAction(user.id, { type: "eat", itemId: "shawarma_wuse2" });
    
    expect(result.money).toBe(28500); // 33000 - 4500
    expect(result.hunger).toBe(90);    // 50 + 40
  });

  it("should enforce shift cooldowns to block macro spamming", async () => {
    const user = await createUser("ahmed_civil", "corper");
    const shift1 = await handleGameAction(user.id, { type: "work_shift" });
    expect(shift1.money).toBe(33000 + 35000); // 68,000

    await expect(
      handleGameAction(user.id, { type: "work_shift" })
    ).rejects.toThrow(/Cooldown in effect/);
  });

  it("should bypass shift cooldown when skipCooldownCheck is true", async () => {
    const user = await createUser("skip_cooldown_user", "contractor"); // 150,000
    const shift1 = await handleGameAction(user.id, { type: "work_shift" });
    expect(shift1.money).toBe(150000 + 35000);

    const shift2 = await handleGameAction(user.id, { type: "work_shift", skipCooldownCheck: true });
    expect(shift2.money).toBe(150000 + 70000);
  });

  it("should reject shift work when energy is lower than required", async () => {
    const user = await createUser("tired_worker", "corper");
    await updateUserVitals(user.id, { energy: 10 }); // Level 08 requires 25 energy

    await expect(
      handleGameAction(user.id, { type: "work_shift" })
    ).rejects.toThrow(/Too exhausted/);
  });

  it("should restore energy to 100 when sleeping", async () => {
    const user = await createUser("sleepy_user", "corper");
    await updateUserVitals(user.id, { energy: 20 });

    const result = await handleGameAction(user.id, { type: "sleep" });
    expect(result.energy).toBe(100);
  });

  it("should deduct rent and upgrade clout when renting an apartment", async () => {
    const user = await createUser("renter", "contractor"); // 150,000 cash, 35 clout
    const result = await handleGameAction(user.id, { type: "rent_apartment", apartmentId: "gwarinpa_flat" });

    expect(result.money).toBe(150000 - 120000); // 30,000
    expect(result.apartmentId).toBe("gwarinpa_flat");
    expect(result.clout).toBe(35 + 30); // 65
  });

  it("should fail when renting an apartment with insufficient funds", async () => {
    const user = await createUser("poor_corper", "corper"); // 33,000 cash
    // Maitama luxury duplex costs ₦1,500,000
    await expect(
      handleGameAction(user.id, { type: "rent_apartment", apartmentId: "maitama_mansion" })
    ).rejects.toThrow(/Insufficient funds/);
  });

  it("should update current location when traveling", async () => {
    const user = await createUser("traveler", "corper");
    const result = await handleGameAction(user.id, { type: "travel", districtId: "wuse2" });
    expect(result.currentLocation).toBe("wuse2");
  });
});
