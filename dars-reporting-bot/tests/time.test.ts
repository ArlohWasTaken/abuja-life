import { describe, it, expect } from 'vitest';
import {
  getCurrentWeekWindowWAT,
  getReportingWindowWAT,
  isSubmissionFriday,
} from '../src/utils/time';

describe('time utils: bi-weekly and WAT calculations', () => {
  it('correctly calculates the start of the week for Friday Oct 9, 2026 16:00 WAT (15:00 UTC)', () => {
    const fridayRef = new Date('2026-10-09T15:00:00.000Z');
    const window = getCurrentWeekWindowWAT(fridayRef);

    expect(window.startISO).toBe('2026-10-04T23:00:00.000Z');
    expect(window.endISO).toBe('2026-10-09T15:00:00.000Z');
  });

  it('getReportingWindowWAT uses period startDate if provided', () => {
    const ref = new Date('2026-10-16T15:00:00.000Z');
    const window = getReportingWindowWAT('2026-10-05', ref);

    // 2026-10-05 00:00:00 WAT = 2026-10-04T23:00:00.000Z
    expect(window.startISO).toBe('2026-10-04T23:00:00.000Z');
    expect(window.endISO).toBe('2026-10-16T15:00:00.000Z');
  });

  it('isSubmissionFriday returns false for Week 1 Friday and true for Week 2 Friday', () => {
    const periodEndDate = '2026-10-18'; // Period ends Sunday Oct 18

    // Friday of Week 1: Oct 9, 2026 (9 days before end)
    const fridayWeek1 = new Date('2026-10-09T15:00:00.000Z');
    expect(isSubmissionFriday(periodEndDate, fridayWeek1)).toBe(false);

    // Friday of Week 2: Oct 16, 2026 (2 days before end)
    const fridayWeek2 = new Date('2026-10-16T15:00:00.000Z');
    expect(isSubmissionFriday(periodEndDate, fridayWeek2)).toBe(true);
  });
});
