import { CIVIL_SERVICE_RANKS } from "./constants";

export interface StampEvaluation {
  payout: number;
  bonus: number;
  grade: "Distinction" | "Satisfactory" | "Queried";
  message: string;
}

export function evaluateStampMinigame(score: number, rankIndex: number = 1): StampEvaluation {
  const rank = CIVIL_SERVICE_RANKS[Math.max(0, Math.min(CIVIL_SERVICE_RANKS.length - 1, rankIndex - 1))];
  const baseSalary = rank.salaryPerShift;

  if (score >= 90) {
    const bonus = Math.round(baseSalary * 0.25);
    return {
      payout: baseSalary,
      bonus,
      grade: "Distinction",
      message: "The Permanent Secretary praised your file routing! Bonus approved. 🎖️",
    };
  } else if (score >= 70) {
    return {
      payout: baseSalary,
      bonus: 0,
      grade: "Satisfactory",
      message: "Shift completed without queries. Attendance signed. ✍️",
    };
  } else {
    const penalty = Math.round(baseSalary * 0.2);
    return {
      payout: Math.max(5000, baseSalary - penalty),
      bonus: 0,
      grade: "Queried",
      message: "You stamped an unverified budget memo! Query issued by Auditor General. ⚠️",
    };
  }
}

export interface TenderEvaluation {
  released: boolean;
  payout: number;
  message: string;
}

export function evaluateTenderLobby(patience: number, clout: number): TenderEvaluation {
  if (patience < 50) {
    return {
      released: false,
      payout: 0,
      message: "You got tired of waiting in the reception and left before Oga arrived. 🚶🏾‍♂️",
    };
  }

  // Base release probability 40% + clout scaling
  const releaseChance = Math.min(0.85, 0.4 + (clout / 1000) * 0.35);
  const isReleased = Math.random() < releaseChance;

  if (isReleased) {
    const windfalls = [450000, 850000, 1800000, 3200000];
    const payout = windfalls[Math.floor(Math.random() * windfalls.length)];
    return {
      released: true,
      payout,
      message: "🎉 Payment voucher cleared! The Treasury single account has credited your alert!",
    };
  } else {
    return {
      released: false,
      payout: 0,
      message: "Oga says allocation for this quarter is exhausted. 'Check back on Friday, Chairman.' ⏳",
    };
  }
}
