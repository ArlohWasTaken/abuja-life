/**
 * Utilities for calculating West Africa Time (WAT / UTC+1) date ranges.
 */

const WAT_OFFSET_MS = 1 * 60 * 60 * 1000;

export interface WeekWindow {
  startISO: string;
  endISO: string;
}

/**
 * Returns the current week's reporting window in UTC ISO strings.
 * The week starts on Monday at 00:00:00 WAT and ends at referenceDate (default now).
 */
export function getCurrentWeekWindowWAT(referenceDate = new Date()): WeekWindow {
  // Convert referenceDate to WAT local frame
  const watTimestamp = referenceDate.getTime() + WAT_OFFSET_MS;
  const watDate = new Date(watTimestamp);

  const watDay = watDate.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysSinceMonday = watDay === 0 ? 6 : watDay - 1;

  // Midnight Monday in WAT
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

  // Convert back to UTC
  const utcMonday = new Date(watMonday.getTime() - WAT_OFFSET_MS);

  return {
    startISO: utcMonday.toISOString(),
    endISO: referenceDate.toISOString(),
  };
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
