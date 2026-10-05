import { describe, it, expect, beforeEach } from "vitest";
import { initTestDb } from "./helpers/db";
import { createUser } from "../src/lib/db/ledger";
import { handleGameAction } from "../src/lib/game/actions";
import { evaluateStampMinigame } from "../src/lib/game/minigames";
import { triggerRandomEncounter } from "../src/lib/game/encounters";

describe("Full Game Loop Integration", () => {
  beforeEach(async () => {
    await initTestDb();
  });

  it("should take a Corper from arrival, through shift work, eating, sleeping, and traveling", async () => {
    const user = await createUser("tunde_integration", "corper");
    expect(user.money).toBe(33000);
    expect(user.apartmentId).toBe("kubwa_bq");
    expect(user.currentLocation).toBe("secretariat");

    // 1. Minigame shift evaluation
    const stampResult = evaluateStampMinigame(95, user.careerRank);
    expect(stampResult.grade).toBe("Distinction");
    expect(stampResult.payout).toBe(35000);

    // 2. Perform work shift on server
    const afterShift = await handleGameAction(user.id, { type: "work_shift" });
    expect(afterShift.money).toBe(68000); // 33,000 + 35,000
    expect(afterShift.energy).toBe(75); // 100 - 25

    // 3. Eat Mama Put pounded yam to replenish hunger
    const afterEat = await handleGameAction(user.id, { type: "eat", itemId: "mama_put" });
    expect(afterEat.money).toBe(65500); // 68,000 - 2,500
    expect(afterEat.hunger).toBe(100);

    // 4. Sleep to recharge energy back to 100
    const afterSleep = await handleGameAction(user.id, { type: "sleep" });
    expect(afterSleep.energy).toBe(100);

    // 5. Travel to Wuse 2
    const afterTravel = await handleGameAction(user.id, { type: "travel", districtId: "wuse2" });
    expect(afterTravel.currentLocation).toBe("wuse2");

    // 6. Encounter trigger in Wuse 2
    const encounter = triggerRandomEncounter(afterTravel.currentLocation, afterTravel.clout);
    expect(encounter.id).toBe("banex_gamble");
  });

  it("should allow a high-clout Contractor to rent Gwarinpa Flat", async () => {
    const contractor = await createUser("oga_contractor", "contractor");
    expect(contractor.money).toBe(150000);
    expect(contractor.clout).toBe(35);

    // Rent flat in Gwarinpa (₦120,000)
    const afterRent = await handleGameAction(contractor.id, {
      type: "rent_apartment",
      apartmentId: "gwarinpa_flat",
    });
    expect(afterRent.money).toBe(30000);
    expect(afterRent.apartmentId).toBe("gwarinpa_flat");
    expect(afterRent.clout).toBe(35 + 30); // 65
  });
});
