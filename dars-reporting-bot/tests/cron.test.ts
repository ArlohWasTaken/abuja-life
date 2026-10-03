import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runReportingPipeline } from '../src/index';
import type { Env } from '../src/types';

describe('scheduled cron reporting pipeline', () => {
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
          summary: 'Weekly progress completed on DARS automation',
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

  it('notifies and skips submission if zero notes were logged during the week', async () => {
    const env = createMockEnv([]); // No notes

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    const result = await runReportingPipeline(env, 'cron');

    expect(result.success).toBe(false);
    expect(result.message).toContain('No notes logged');
    // Telegram alert should be sent to ALERT_CHAT_ID
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('No activity notes were logged this week'),
      })
    );
  });

  it('formats, logs in, submits to DARS and notifies success when notes exist', async () => {
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

    const mockHeaders = new Headers();
    mockHeaders.append('set-cookie', 'sb-token=abc12345; Path=/;');

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/auth/sign-in')) {
        return {
          ok: true,
          status: 200,
          headers: mockHeaders,
          json: async () => ({
            data: { session: { accessToken: 'jwt123' }, user: { id: 'u1' } },
          }),
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
                { id: 'p-2026-10-05', label: 'Oct 5 - 18, 2026', isCurrent: true },
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
      return { ok: false, status: 404, json: async () => ({}) };
    });

    const result = await runReportingPipeline(env, 'cron');

    expect(result.success).toBe(true);
    expect(result.message).toContain('submitted successfully');
    // Verify Telegram success message sent
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('DARS Weekly Report Submitted Successfully'),
      })
    );
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
    // Urgent failure alert must be sent to Telegram
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('DARS AUTOMATION FAILED'),
      })
    );
  });
});
