import type { DarsPeriod, DarsReportPayload } from '../types';

export interface SignInResult {
  success: boolean;
  cookieHeader: string;
  accessToken?: string;
  error?: string;
}

export interface SubmitReportResult {
  success: boolean;
  reportId?: string;
  error?: string;
}

export class DarsClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Signs in to DARS and captures session cookies and JWT access token.
   */
  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = (await res.json().catch(() => null)) as any;

      if (!res.ok || !body?.data?.session) {
        const errorMsg =
          body?.error?.message ||
          (res.status === 401 ? 'Incorrect email or password.' : `Sign in failed (${res.status})`);
        return { success: false, cookieHeader: '', error: errorMsg };
      }

      // Extract set-cookie headers
      let cookies: string[] = [];
      if (typeof (res.headers as any).getSetCookie === 'function') {
        cookies = (res.headers as any).getSetCookie();
      } else {
        const headerVal = res.headers.get('set-cookie');
        if (headerVal) cookies = [headerVal];
      }

      // Format as Cookie header: key=val; key2=val2
      const cookieHeader = cookies
        .map((c) => c.split(';')[0].trim())
        .filter(Boolean)
        .join('; ');

      const accessToken = body.data.session.accessToken;

      return {
        success: true,
        cookieHeader: cookieHeader || (accessToken ? `sb-access-token=${accessToken}` : ''),
        accessToken,
      };
    } catch (err: any) {
      return { success: false, cookieHeader: '', error: err.message || 'Network error signing in' };
    }
  }

  /**
   * Retrieves all reporting periods and returns the active current one.
   */
  async getCurrentPeriod(cookieHeader: string): Promise<DarsPeriod> {
    const res = await fetch(`${this.baseUrl}/api/periods`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
      },
    });

    const body = (await res.json().catch(() => null)) as any;
    if (!res.ok || !body?.data?.periods) {
      throw new Error(body?.error?.message || `Failed to fetch periods (${res.status})`);
    }

    const periods: DarsPeriod[] = body.data.periods;
    const current = periods.find((p) => p.isCurrent) ?? periods[0];

    if (!current) {
      throw new Error('No active reporting period found on DARS.');
    }

    return current;
  }

  /**
   * Submits a bi-weekly report to DARS.
   */
  async submitReport(
    cookieHeader: string,
    payload: DarsReportPayload
  ): Promise<SubmitReportResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => null)) as any;

      if (!res.ok || !body?.data?.report) {
        const errorMsg = body?.error?.message || `Submission failed (${res.status})`;
        return { success: false, error: errorMsg };
      }

      return {
        success: true,
        reportId: body.data.report.id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error submitting report',
      };
    }
  }
}
