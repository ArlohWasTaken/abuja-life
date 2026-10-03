import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runReportingPipeline } from '../src/index';
import type { Env } from '../src/types';

describe('bi-weekly scheduled cron reporting pipeline', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const createMockEnv = (notes: any[] = []): Env => ({
    DB: {
      prepare: vi.fn().mockImplementation((sql: string) => ({
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: notes }),
          run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
        }),
      })),
    } as unknown as D1Database,
    AI: {
      run: vi.fn().mockResolvedValue({
        response: JSON.stringify({
          summary: 'Bi-weekly progress completed on DARS automation',
          body: '<h3>Overview</h3><p>Steady progress.</p><h3>Activities</h3><ul><li>Tested bot</li></ul><h3>Challenges</h3><p>None.</p><h3>Next Period</h3><p>Deploy.</p>',
        }),
      }),
    },
    DARS_BASE_URL: 'https://dars.wearebucc.com',
    DARS_EMAIL: 'director@bucc.org',
    DARS_PASSWORD: 'secret-password',
    TELEGRAM_BOT_TOKEN: '123:token',
    ALERT_CHAT_ID: '999',
  });

  it('sends mid-period check-in and does NOT submit on Week 1 Friday', async () => {
    const sampleNotes = [
      {
        id: 1,
        sender_id: '111',
        sender_name: 'Kensey',
        text: 'Week 1 note',
        created_at: '2026-10-06T12:00:00.000Z',
        submitted_at: null,
      },
    ];

    const env = createMockEnv(sampleNotes);

    // Mock active period with endDate far in future (Week 1)
    const futureEndDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/auth/sign-in')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ data: { session: { accessToken: 'jwt' } } }),
        };
      }
      if (url.includes('/api/periods')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            data: {
              periods: [
                {
                  id: 'p-1',
                  label: 'Oct 5 - 18, 2026',
                  isCurrent: true,
                  startDate: '2026-10-05',
                  endDate: futureEndDate, // 10 days away -> Week 1!
                },
              ],
            },
          }),
        };
      }
      if (url.includes('/sendMessage')) {
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      if (url.includes('/api/reports')) {
        throw new Error('Should not call /api/reports on Week 1 Friday!');
      }
      return { ok: false, status: 404 };
    });

    const result = await runReportingPipeline(env, 'cron');

    expect(result.success).toBe(true);
    expect(result.message).toContain('Week 1 check-in sent');
    // Telegram mid-period check-in message sent
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('Week 1 of 2'),
      })
    );
  });

  it('submits full bi-weekly report to DARS on Week 2 submission Friday', async () => {
    const sampleNotes = [
      {
        id: 1,
        sender_id: '111',
        sender_name: 'Kensey',
        text: 'Integrated DARS API client with session cookie persistence',
        created_at: '2026-10-06T12:00:00.000Z',
        submitted_at: null,
      },
    ];

    const env = createMockEnv(sampleNotes);

    // Mock active period where endDate is 2 days from now (Week 2 submission Friday!)
    const nearEndDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/auth/sign-in')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ data: { session: { accessToken: 'jwt123' } } }),
        };
      }
      if (url.includes('/api/periods')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            data: {
              periods: [
                {
                  id: 'p-2026-10-05',
                  label: 'Oct 5 - 18, 2026',
                  isCurrent: true,
                  startDate: '2026-10-05',
                  endDate: nearEndDate,
                },
              ],
            },
          }),
        };
      }
      if (url.includes('/api/reports')) {
        return {
          ok: true,
          status: 201,
          headers: new Headers(),
          json: async () => ({
            data: { report: { id: 'rep-uuid-1' } },
          }),
        };
      }
      if (url.includes('/sendMessage')) {
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      return { ok: false, status: 404 };
    });

    const result = await runReportingPipeline(env, 'cron');

    expect(result.success).toBe(true);
    expect(result.message).toContain('submitted successfully');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('DARS Bi-Weekly Report Submitted'),
      })
    );
  });

  it('submits immediately when triggered manually (/file_now) even on Week 1', async () => {
    const sampleNotes = [
      {
        id: 1,
        sender_id: '111',
        sender_name: 'Kensey',
        text: 'Early manual filing',
        created_at: '2026-10-06T12:00:00.000Z',
        submitted_at: null,
      },
    ];

    const env = createMockEnv(sampleNotes);

    const futureEndDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/auth/sign-in')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ data: { session: { accessToken: 'jwt123' } } }),
        };
      }
      if (url.includes('/api/periods')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            data: {
              periods: [
                {
                  id: 'p-early',
                  label: 'Oct 5 - 18, 2026',
                  isCurrent: true,
                  startDate: '2026-10-05',
                  endDate: futureEndDate,
                },
              ],
            },
          }),
        };
      }
      if (url.includes('/api/reports')) {
        return {
          ok: true,
          status: 201,
          headers: new Headers(),
          json: async () => ({
            data: { report: { id: 'rep-early-1' } },
          }),
        };
      }
      if (url.includes('/sendMessage')) {
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      return { ok: false, status: 404 };
    });

    const result = await runReportingPipeline(env, 'manual');

    expect(result.success).toBe(true);
    expect(result.message).toContain('submitted successfully');
  });

  it('sends urgent failure alert with deadline warning if DARS returns error', async () => {
    const sampleNotes = [
      {
        id: 1,
        sender_id: '111',
        sender_name: 'Kensey',
        text: 'Working on backend tasks',
        created_at: '2026-10-06T12:00:00.000Z',
        submitted_at: null,
      },
    ];

    const env = createMockEnv(sampleNotes);

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/auth/sign-in')) {
        return {
          ok: false,
          status: 401,
          headers: new Headers(),
          json: async () => ({ error: { message: 'Invalid credentials' } }),
        };
      }
      if (url.includes('/sendMessage')) {
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      return { ok: false, status: 500 };
    });

    const result = await runReportingPipeline(env, 'cron');

    expect(result.success).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('DARS AUTOMATION FAILED'),
      })
    );
  });
});
