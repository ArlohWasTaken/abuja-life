import { executeTransaction, getUserById, updateUserVitals } from "../db/ledger";
import { User as DbUser } from "../db/schema";
import { FOOD_ITEMS, HOUSING_OPTIONS, CIVIL_SERVICE_RANKS } from "./constants";

export type ActionRequest =
  | { type: "eat"; itemId: string }
  | { type: "work_shift"; skipCooldownCheck?: boolean }
  | { type: "sleep" }
  | { type: "rent_apartment"; apartmentId: string }
  | { type: "travel"; districtId: string };

export async function handleGameAction(userId: string, action: ActionRequest): Promise<DbUser> {
  const user = await getUserById(userId);
  if (!user) throw new Error("Player not found");

  const now = Date.now();

  switch (action.type) {
    case "eat": {
      const food = FOOD_ITEMS[action.itemId];
      if (!food) throw new Error(`Unknown food item: ${action.itemId}`);

      // Debit money
      await executeTransaction(userId, -food.cost, "eat", { foodId: action.itemId });

      const newHunger = Math.min(100, user.hunger + food.hungerRestore);
      const newFun = Math.min(100, user.fun + food.funRestore);

      return await updateUserVitals(userId, { hunger: newHunger, fun: newFun });
    }

    case "work_shift": {
      const rankConfig = CIVIL_SERVICE_RANKS[Math.max(0, Math.min(CIVIL_SERVICE_RANKS.length - 1, user.careerRank - 1))];

      if (user.energy < rankConfig.energyCost) {
        throw new Error(`Too exhausted to work shift! Need ${rankConfig.energyCost} Energy, current is ${user.energy}`);
      }

      // Check 3-minute cooldown unless explicitly skipped in test
      const cooldownMs = 180000;
      if (!action.skipCooldownCheck && user.lastShiftAt && now - user.lastShiftAt < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - (now - user.lastShiftAt)) / 1000);
        throw new Error(`Cooldown in effect! Director is on break. Try again in ${remainingSec}s`);
      }

      // Credit salary
      await executeTransaction(userId, rankConfig.salaryPerShift, "work_wage", { rank: user.careerRank });

      const newEnergy = Math.max(0, user.energy - rankConfig.energyCost);
      const newClout = user.clout + 10;

      return await updateUserVitals(userId, {
        energy: newEnergy,
        clout: newClout,
        lastShiftAt: now,
      });
    }

    case "sleep": {
      return await updateUserVitals(userId, { energy: 100 });
    }

    case "rent_apartment": {
      const housing = HOUSING_OPTIONS[action.apartmentId];
      if (!housing) throw new Error(`Unknown housing option: ${action.apartmentId}`);

      await executeTransaction(userId, -housing.weeklyRent, "rent", { apartmentId: action.apartmentId });

      const newClout = user.clout + housing.cloutBonus;
      return await updateUserVitals(userId, { apartmentId: action.apartmentId, clout: newClout });
    }

    case "travel": {
      return await updateUserVitals(userId, { currentLocation: action.districtId });
    }

    default:
      throw new Error(`Unsupported action type`);
  }
}
