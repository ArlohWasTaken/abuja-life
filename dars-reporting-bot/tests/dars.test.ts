import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DarsClient } from '../src/dars/client';

describe('DarsClient', () => {
  const originalFetch = global.fetch;
  const baseUrl = 'https://dars.wearebucc.com';
  let client: DarsClient;

  beforeEach(() => {
    client = new DarsClient(baseUrl);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('signIn successfully captures session cookie from response', async () => {
    const mockHeaders = new Headers();
    mockHeaders.append('set-cookie', 'sb-token=xyz123; Path=/; HttpOnly');
    mockHeaders.append('set-cookie', 'sb-refresh=ref456; Path=/; HttpOnly');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: mockHeaders,
      json: async () => ({
        data: {
          user: { id: 'user-1', name: 'Chidoziem' },
          session: { accessToken: 'jwt-access-token' },
        },
      }),
    });

    const res = await client.signIn('chidoziem@bucc.org', 'test-password');

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/auth/sign-in`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'chidoziem@bucc.org', password: 'test-password' }),
      })
    );
    expect(res.success).toBe(true);
    expect(res.cookieHeader).toContain('sb-token=xyz123');
    expect(res.accessToken).toBe('jwt-access-token');
  });

  it('signIn returns descriptive error on 401 Unauthorized', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({
        error: { code: 'unauthorized', message: 'Incorrect email or password.' },
      }),
    });

    const res = await client.signIn('wrong@bucc.org', 'bad-pass');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Incorrect email or password.');
  });

  it('getCurrentPeriod fetches periods and returns isCurrent one', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        data: {
          periods: [
            { id: 'p-old', label: 'Sept 1 - 14, 2026', isCurrent: false },
            { id: 'p-current', label: 'Oct 5 - 18, 2026', isCurrent: true, closesOn: 'Oct 19, 2026' },
          ],
        },
      }),
    });

    const period = await client.getCurrentPeriod('sb-token=xyz123');

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/periods`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: 'sb-token=xyz123',
        }),
      })
    );
    expect(period.id).toBe('p-current');
    expect(period.label).toBe('Oct 5 - 18, 2026');
  });

  it('submitReport submits report payload and returns report ID', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers(),
      json: async () => ({
        data: {
          report: {
            id: 'report-uuid-999',
            periodId: 'p-current',
            summary: 'Weekly progress summary',
          },
        },
      }),
    });

    const res = await client.submitReport('sb-token=xyz123', {
      periodId: 'p-current',
      summary: 'Weekly progress summary',
      body: '<h3>Overview</h3><p>Steady development progress recorded this period.</p>',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/reports`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Cookie: 'sb-token=xyz123',
        }),
      })
    );
    expect(res.success).toBe(true);
    expect(res.reportId).toBe('report-uuid-999');
  });

  it('submitReport returns error message on 400 validation error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers(),
      json: async () => ({
        error: { message: 'Fix the following: summary must be at least 10 characters.' },
      }),
    });

    const res = await client.submitReport('sb-token=xyz123', {
      periodId: 'p-current',
      summary: 'short',
      body: 'body text',
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('Fix the following: summary must be at least 10 characters.');
  });
});
