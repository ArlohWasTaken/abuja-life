import { describe, it, expect } from 'vitest';
import { getCurrentWeekWindowWAT } from '../src/utils/time';

describe('time utils: getCurrentWeekWindowWAT', () => {
  it('correctly calculates the start of the week for Friday Oct 9, 2026 16:00 WAT (15:00 UTC)', () => {
    // 2026-10-09T15:00:00.000Z is 16:00 WAT
    const fridayRef = new Date('2026-10-09T15:00:00.000Z');
    const window = getCurrentWeekWindowWAT(fridayRef);

    // Monday Oct 5, 2026 00:00:00 WAT = 2026-10-04T23:00:00.000Z in UTC
    expect(window.startISO).toBe('2026-10-04T23:00:00.000Z');
    expect(window.endISO).toBe('2026-10-09T15:00:00.000Z');
  });

  it('correctly calculates the start of the week for Monday Oct 5, 2026 09:00 WAT (08:00 UTC)', () => {
    const mondayRef = new Date('2026-10-05T08:00:00.000Z');
    const window = getCurrentWeekWindowWAT(mondayRef);

    expect(window.startISO).toBe('2026-10-04T23:00:00.000Z');
    expect(window.endISO).toBe('2026-10-05T08:00:00.000Z');
  });

  it('correctly calculates the start of the week for Sunday Oct 11, 2026 22:00 WAT (21:00 UTC)', () => {
    const sundayRef = new Date('2026-10-11T21:00:00.000Z');
    const window = getCurrentWeekWindowWAT(sundayRef);

    expect(window.startISO).toBe('2026-10-04T23:00:00.000Z');
    expect(window.endISO).toBe('2026-10-11T21:00:00.000Z');
  });
});
