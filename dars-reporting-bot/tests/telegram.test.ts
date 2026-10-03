import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleTelegramWebhook, sendTelegramMessage } from '../src/telegram/bot';
import type { Env, TelegramUpdate } from '../src/types';

describe('telegram bot', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockEnv: Env = {
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
          all: vi.fn().mockResolvedValue({ results: [] }),
        }),
      }),
    } as unknown as D1Database,
    AI: {},
    DARS_BASE_URL: 'https://dars.wearebucc.com',
    TELEGRAM_BOT_TOKEN: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
    AUTHORIZED_TELEGRAM_USER_IDS: '111,222',
    ALERT_CHAT_ID: '111',
  };

  it('silently ignores updates from unauthorized users', async () => {
    const update: TelegramUpdate = {
      update_id: 100,
      message: {
        message_id: 1,
        from: { id: 999, first_name: 'Stranger' },
        chat: { id: 999, type: 'private' },
        date: 1728000000,
        text: 'Hello bot',
      },
    };

    const req = new Request('https://worker/webhook/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });

    const res = await handleTelegramWebhook(req, mockEnv);

    expect(res.status).toBe(200);
    // Fetch should not have been called to send a message
    expect(global.fetch).not.toHaveBeenCalled();
    // DB prepare should not have been called to insert
    expect(mockEnv.DB.prepare).not.toHaveBeenCalled();
  });

  it('saves casual note from authorized user and replies with confirmation', async () => {
    const update: TelegramUpdate = {
      update_id: 101,
      message: {
        message_id: 2,
        from: { id: 111, first_name: 'Kensey' },
        chat: { id: 111, type: 'private' },
        date: 1728000000,
        text: 'Met with the frontend team to review PRs.',
      },
    };

    const req = new Request('https://worker/webhook/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });

    const res = await handleTelegramWebhook(req, mockEnv);

    expect(res.status).toBe(200);
    expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO notes')
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('✓ Saved'),
      })
    );
  });

  it('handles /start command and sends guide', async () => {
    const update: TelegramUpdate = {
      update_id: 102,
      message: {
        message_id: 3,
        from: { id: 222, first_name: 'Lead' },
        chat: { id: 222, type: 'private' },
        date: 1728000000,
        text: '/start',
      },
    };

    const req = new Request('https://worker/webhook/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });

    const res = await handleTelegramWebhook(req, mockEnv);

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('DARS Notes Bot'),
      })
    );
  });

  it('handles /preview command and shows unsubmitted notes', async () => {
    const envWithNotes = {
      ...mockEnv,
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({
              results: [
                {
                  id: 1,
                  sender_id: '111',
                  sender_name: 'Kensey',
                  text: 'Fixed auth bug',
                  created_at: '2026-10-06T10:00:00.000Z',
                  submitted_at: null,
                },
              ],
            }),
          }),
        }),
      } as unknown as D1Database,
    };

    const update: TelegramUpdate = {
      update_id: 103,
      message: {
        message_id: 4,
        from: { id: 111, first_name: 'Kensey' },
        chat: { id: 111, type: 'private' },
        date: 1728000000,
        text: '/preview',
      },
    };

    const req = new Request('https://worker/webhook/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });

    const res = await handleTelegramWebhook(req, envWithNotes);

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({
        body: expect.stringContaining('Fixed auth bug'),
      })
    );
  });
});
