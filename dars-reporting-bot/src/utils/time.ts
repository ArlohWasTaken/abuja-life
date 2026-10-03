/**
 * Utilities for calculating West Africa Time (WAT / UTC+1) date ranges
 * and Bi-Weekly reporting cycles.
 */

const WAT_OFFSET_MS = 1 * 60 * 60 * 1000;

export interface WeekWindow {
  startISO: string;
  endISO: string;
}

/**
 * Returns the reporting window in UTC ISO strings.
 * If periodStartDateStr (e.g. '2026-10-05') is provided, starts at 00:00:00 WAT of that date.
 * Otherwise, defaults to Monday 00:00:00 WAT of the current week.
 */
export function getReportingWindowWAT(
  periodStartDateStr?: string,
  referenceDate = new Date()
): WeekWindow {
  if (periodStartDateStr) {
    // Parse YYYY-MM-DD as WAT midnight
    const [year, month, day] = periodStartDateStr.split('-').map(Number);
    const watMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const utcStart = new Date(watMidnight.getTime() - WAT_OFFSET_MS);
    return {
      startISO: utcStart.toISOString(),
      endISO: referenceDate.toISOString(),
    };
  }

  // Fallback to weekly Monday 00:00:00 WAT
  return getCurrentWeekWindowWAT(referenceDate);
}

/**
 * Legacy/fallback: Returns the current week's reporting window starting Monday 00:00:00 WAT.
 */
export function getCurrentWeekWindowWAT(referenceDate = new Date()): WeekWindow {
  const watTimestamp = referenceDate.getTime() + WAT_OFFSET_MS;
  const watDate = new Date(watTimestamp);

  const watDay = watDate.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysSinceMonday = watDay === 0 ? 6 : watDay - 1;

  const watMonday = new Date(
    Date.UTC(
      watDate.getUTCFullYear(),
      watDate.getUTCMonth(),
      watDate.getUTCDate() - daysSinceMonday,
      0,
      0,
      0,
      0
    )
  );

  const utcMonday = new Date(watMonday.getTime() - WAT_OFFSET_MS);

  return {
    startISO: utcMonday.toISOString(),
    endISO: referenceDate.toISOString(),
  };
}

/**
 * Checks whether the reference date is the final submission Friday of a bi-weekly period.
 * In a 14-day period ending on Sunday (e.g. Oct 18), the submission Friday is 2 days prior (Oct 16).
 * Returns true if referenceDate is within 3 days of periodEndDateStr.
 */
export function isSubmissionFriday(
  periodEndDateStr: string,
  referenceDate = new Date()
): boolean {
  const [year, month, day] = periodEndDateStr.split('-').map(Number);
  // End date is Sunday 23:59:59 WAT
  const watEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  const utcEnd = new Date(watEnd.getTime() - WAT_OFFSET_MS);

  const diffMs = utcEnd.getTime() - referenceDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // If we are within 3.5 days of the period ending (i.e. Friday, Saturday, or Sunday of Week 2), it's submission time!
  return diffDays <= 3.5 && diffDays >= -0.5;
}

/**
 * Formats an ISO string to a human-readable WAT string.
 * Example: "Oct 6, 2:45 PM WAT"
 */
export function formatWATDateTime(date = new Date()): string {
  const watDate = new Date(date.getTime() + WAT_OFFSET_MS);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const month = months[watDate.getUTCMonth()];
  const day = watDate.getUTCDate();
  let hours = watDate.getUTCHours();
  const minutes = watDate.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${month} ${day}, ${hours}:${minutes} ${ampm} WAT`;
}
