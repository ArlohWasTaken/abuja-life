import { describe, it, expect } from "vitest";
import { evaluateStampMinigame, evaluateTenderLobby } from "../src/lib/game/minigames";
import { triggerRandomEncounter } from "../src/lib/game/encounters";

describe("Minigames and Random Encounters", () => {
  it("should calculate Civil Service bonus based on stamp accuracy", () => {
    const perfectScore = evaluateStampMinigame(100, 1); // Rank 1 (Level 08)
    expect(perfectScore.payout).toBe(35000);
    expect(perfectScore.bonus).toBeGreaterThan(0);
    expect(perfectScore.grade).toBe("Distinction");

    const averageScore = evaluateStampMinigame(75, 1);
    expect(averageScore.payout).toBe(35000);
    expect(averageScore.bonus).toBe(0);
    expect(averageScore.grade).toBe("Satisfactory");

    const poorScore = evaluateStampMinigame(40, 1);
    expect(poorScore.payout).toBeLessThan(35000);
    expect(poorScore.bonus).toBe(0);
    expect(poorScore.grade).toBe("Queried");
  });

  it("should scale tender lobby evaluation with patience", () => {
    const impatient = evaluateTenderLobby(30, 200);
    expect(impatient.released).toBe(false);
    expect(impatient.payout).toBe(0);
  });

  it("should resolve VIO encounter based on player clout", () => {
    const lowClout = triggerRandomEncounter("cbd", 50);
    expect(["bribe", "fine"]).toContain(lowClout.mandatoryOption);

    const highClout = triggerRandomEncounter("cbd", 500); // Senator-tier clout
    expect(highClout.availableOptions).toContain("name_drop_pass");
    expect(highClout.mandatoryOption).toBeUndefined();
  });

  it("should trigger Banex gamble for non-CBD locations", () => {
    const banex = triggerRandomEncounter("wuse2", 100);
    expect(banex.id).toBe("banex_gamble");
    expect(banex.options.length).toBeGreaterThan(1);
  });
});
