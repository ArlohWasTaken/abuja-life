import type { Env } from './types';
import { getUnsubmittedNotes, markNotesAsSubmitted, recordSubmission } from './db/queries';
import { formatReportFromNotes } from './ai/formatter';
import { DarsClient } from './dars/client';
import { getReportingWindowWAT, isSubmissionFriday, formatWATDateTime } from './utils/time';
import { handleTelegramWebhook, sendTelegramMessage } from './telegram/bot';

export interface PipelineResult {
  success: boolean;
  message: string;
}

/**
 * Executes the bi-weekly report synthesis and submission pipeline.
 * Runs every Friday at 15:00 UTC (16:00 WAT).
 * - Week 1 Friday: sends a friendly mid-period progress check-in.
 * - Week 2 Friday: synthesizes all 14 days of notes and submits to DARS.
 * - Manual trigger (/file_now): forces immediate synthesis and submission.
 */
export async function runReportingPipeline(
  env: Env,
  triggeredBy: 'cron' | 'manual' = 'cron'
): Promise<PipelineResult> {
  const alertChatId = env.ALERT_CHAT_ID;
  const botToken = env.TELEGRAM_BOT_TOKEN;

  const client = new DarsClient(env.DARS_BASE_URL);

  // 1. Validate DARS configuration
  if (!env.DARS_EMAIL || !env.DARS_PASSWORD) {
    const errorMsg = 'DARS_EMAIL or DARS_PASSWORD secrets are not configured in environment.';
    if (botToken && alertChatId) {
      await sendTelegramMessage(
        botToken,
        alertChatId,
        `🚨 <b>DARS AUTOMATION FAILED!</b>\n\n${errorMsg}\n\n⚠️ <b>Deadline: 6:00 PM WAT today!</b>\nPlease submit manually at ${env.DARS_BASE_URL}/reports/submit to avoid the ₦1,000 fine.`,
        'HTML'
      );
    }
    return { success: false, message: errorMsg };
  }

  // 2. Authenticate to DARS
  const auth = await client.signIn(env.DARS_EMAIL, env.DARS_PASSWORD);
  if (!auth.success) {
    const failureMsg = `Failed to sign in to DARS: ${auth.error}`;
    if (botToken && alertChatId) {
      await sendTelegramMessage(
        botToken,
        alertChatId,
        `🚨 <b>DARS AUTOMATION FAILED!</b>\n\n${failureMsg}\n\n⚠️ <b>Deadline: 6:00 PM WAT today!</b>\nPlease submit manually at ${env.DARS_BASE_URL}/reports/submit to avoid the ₦1,000 fine.`,
        'HTML'
      );
    }
    await recordSubmission(env.DB, {
      periodId: 'unknown',
      summary: 'Authentication error during pipeline execution',
      body: 'Failed to sign in to DARS.',
      status: 'failed',
      errorMessage: auth.error,
    });
    return { success: false, message: failureMsg };
  }

  // 3. Get current active reporting period
  let period: { id: string; label: string; startDate?: string; endDate?: string };
  try {
    period = await client.getCurrentPeriod(auth.cookieHeader);
  } catch (err: any) {
    const periodError = `Could not determine active reporting period: ${err.message}`;
    if (botToken && alertChatId) {
      await sendTelegramMessage(
        botToken,
        alertChatId,
        `🚨 <b>DARS AUTOMATION FAILED!</b>\n\n${periodError}\n\n⚠️ <b>Deadline: 6:00 PM WAT today!</b>\nPlease submit manually at ${env.DARS_BASE_URL}/reports/submit to avoid the ₦1,000 fine.`,
        'HTML'
      );
    }
    return { success: false, message: periodError };
  }

  // 4. Fetch notes for this active period
  const { startISO, endISO } = getReportingWindowWAT(period.startDate);
  const notes = await getUnsubmittedNotes(env.DB, startISO, endISO);

  // 5. Bi-Weekly Logic: Is this Week 1 or Week 2?
  const shouldSubmitNow =
    triggeredBy === 'manual' ||
    !period.endDate ||
    isSubmissionFriday(period.endDate);

  if (!shouldSubmitNow) {
    // Week 1 Friday: Mid-period progress check-in!
    const midPeriodMsg = `ℹ️ <b>DARS Bi-Weekly Status (Week 1 of 2)</b>\n\n<b>Current Period:</b> ${period.label}\n<b>Notes Logged So Far:</b> ${notes.length}\n\nKeep dropping your updates in this chat! The full bi-weekly report will be compiled and submitted automatically next Friday at 4:00 PM WAT before the 6:00 PM deadline.`;
    if (botToken && alertChatId) {
      await sendTelegramMessage(botToken, alertChatId, midPeriodMsg, 'HTML');
    }
    return {
      success: true,
      message: `Week 1 check-in sent for ${period.label}. (${notes.length} notes logged)`,
    };
  }

  // 6. Week 2 Friday (or /file_now): Final Report Submission
  if (notes.length === 0) {
    const warningMsg = `⚠️ <b>DARS Reporting Notice</b>\n\nNo activity notes were logged during this bi-weekly period (${period.label}). No report was submitted automatically.\n\n⚠️ <b>Deadline: 6:00 PM WAT today!</b>\nPlease log updates or submit manually at ${env.DARS_BASE_URL}/reports/submit to avoid the ₦1,000 fine.`;
    if (botToken && alertChatId) {
      await sendTelegramMessage(botToken, alertChatId, warningMsg, 'HTML');
    }
    return {
      success: false,
      message: `No notes logged for period ${period.label}.`,
    };
  }

  // 7. Format report via Workers AI
  const report = await formatReportFromNotes(env.AI, notes, env.AI_MODEL);

  // 8. Submit to DARS with retry mechanism (up to 3 attempts)
  let lastError = '';
  let submissionSuccess = false;
  let reportId: string | undefined;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const subResult = await client.submitReport(auth.cookieHeader, {
      periodId: period.id,
      summary: report.summary,
      body: report.body,
    });

    if (subResult.success) {
      submissionSuccess = true;
      reportId = subResult.reportId;
      break;
    } else {
      lastError = subResult.error || 'Unknown submission error';
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  // 9. Dispatch Final Result Alerts
  if (submissionSuccess) {
    const noteIds = notes.map((n) => n.id);
    await markNotesAsSubmitted(env.DB, noteIds);

    await recordSubmission(env.DB, {
      periodId: period.id,
      summary: report.summary,
      body: report.body,
      status: 'success',
    });

    const successMsg = `✅ <b>DARS Bi-Weekly Report Submitted!</b>\n\n<b>Period:</b> ${period.label}\n<b>Time:</b> ${formatWATDateTime()}\n<b>Notes Included:</b> ${notes.length}\n<b>Trigger:</b> ${triggeredBy}\n\n<b>One-Line Summary:</b>\n<i>${report.summary}</i>\n\n<a href="${env.DARS_BASE_URL}/reports">View Report on DARS</a>`;
    if (botToken && alertChatId) {
      await sendTelegramMessage(botToken, alertChatId, successMsg, 'HTML');
    }

    return {
      success: true,
      message: `Bi-weekly report for ${period.label} submitted successfully! (ID: ${reportId})`,
    };
  } else {
    await recordSubmission(env.DB, {
      periodId: period.id,
      summary: report.summary,
      body: report.body,
      status: 'failed',
      errorMessage: lastError,
    });

    const alertMsg = `🚨 <b>DARS AUTOMATION FAILED!</b>\n\nThe bi-weekly report for <b>${period.label}</b> could not be submitted after 3 attempts.\n\n<b>Error:</b> ${lastError}\n\n⚠️ <b>Deadline: 6:00 PM WAT today!</b>\nPlease log in and submit manually at ${env.DARS_BASE_URL}/reports/submit to avoid the ₦1,000 fine.`;
    if (botToken && alertChatId) {
      await sendTelegramMessage(botToken, alertChatId, alertMsg, 'HTML');
    }

    return {
      success: false,
      message: `DARS submission failed: ${lastError}`,
    };
  }
}

export default {
  /**
   * HTTP Webhook Router for Telegram updates
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/webhook/telegram') {
      return handleTelegramWebhook(request, env, () =>
        runReportingPipeline(env, 'manual')
      );
    }

    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(
        JSON.stringify({
          service: 'dars-reporting-bot',
          mode: 'bi-weekly',
          status: 'healthy',
          watTime: formatWATDateTime(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Not Found', { status: 404 });
  },

  /**
   * Scheduled cron event trigger (Every Friday at 15:00 UTC = 16:00 WAT)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runReportingPipeline(env, 'cron'));
  },
};
