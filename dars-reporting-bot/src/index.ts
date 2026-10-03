import type { Env } from './types';
import { getUnsubmittedNotes, markNotesAsSubmitted, recordSubmission } from './db/queries';
import { formatReportFromNotes } from './ai/formatter';
import { DarsClient } from './dars/client';
import { getCurrentWeekWindowWAT, formatWATDateTime } from './utils/time';
import { handleTelegramWebhook, sendTelegramMessage } from './telegram/bot';

export interface PipelineResult {
  success: boolean;
  message: string;
}

/**
 * Executes the weekly report synthesis and submission pipeline.
 * Can be triggered automatically by cron or manually via /file_now.
 */
export async function runReportingPipeline(
  env: Env,
  triggeredBy: 'cron' | 'manual' = 'cron'
): Promise<PipelineResult> {
  const alertChatId = env.ALERT_CHAT_ID;
  const botToken = env.TELEGRAM_BOT_TOKEN;

  // 1. Fetch unsubmitted notes for the current week (Monday 00:00 WAT to now)
  const { startISO, endISO } = getCurrentWeekWindowWAT();
  const notes = await getUnsubmittedNotes(env.DB, startISO, endISO);

  // 2. Handle empty week
  if (notes.length === 0) {
    const warningMsg = `⚠️ <b>DARS Reporting Notice</b>\n\nNo activity notes were logged this week between Monday 00:00 and now. No report was submitted automatically.\n\n⚠️ <b>Deadline: 6:00 PM WAT today!</b>\nPlease log updates or submit manually at ${env.DARS_BASE_URL}/reports/submit to avoid the ₦1,000 fine.`;
    if (botToken && alertChatId) {
      await sendTelegramMessage(botToken, alertChatId, warningMsg, 'HTML');
    }
    return {
      success: false,
      message: 'No notes logged for this week.',
    };
  }

  // 3. Format report via Workers AI (with automatic heuristic fallback)
  const report = await formatReportFromNotes(env.AI, notes, env.AI_MODEL);

  // 4. Authenticate to DARS
  const client = new DarsClient(env.DARS_BASE_URL);
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
    await recordSubmission(env.DB, {
      periodId: 'unknown',
      summary: report.summary,
      body: report.body,
      status: 'failed',
      errorMessage: errorMsg,
    });
    return { success: false, message: errorMsg };
  }

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
      summary: report.summary,
      body: report.body,
      status: 'failed',
      errorMessage: auth.error,
    });
    return { success: false, message: failureMsg };
  }

  // 5. Get current active reporting period
  let period: { id: string; label: string };
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
    await recordSubmission(env.DB, {
      periodId: 'unknown',
      summary: report.summary,
      body: report.body,
      status: 'failed',
      errorMessage: err.message,
    });
    return { success: false, message: periodError };
  }

  // 6. Submit to DARS with retry mechanism (up to 3 attempts)
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
      // Wait briefly before retrying (mockable)
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  // 7. Handle Result
  if (submissionSuccess) {
    // Mark notes as submitted in D1
    const noteIds = notes.map((n) => n.id);
    await markNotesAsSubmitted(env.DB, noteIds);

    // Record submission record in D1
    await recordSubmission(env.DB, {
      periodId: period.id,
      summary: report.summary,
      body: report.body,
      status: 'success',
    });

    // Notify Telegram
    const successMsg = `✅ <b>DARS Weekly Report Submitted Successfully!</b>\n\n<b>Period:</b> ${period.label}\n<b>Time:</b> ${formatWATDateTime()}\n<b>Notes Included:</b> ${notes.length}\n<b>Trigger:</b> ${triggeredBy}\n\n<b>One-Line Summary:</b>\n<i>${report.summary}</i>\n\n<a href="${env.DARS_BASE_URL}/reports">View Report on DARS</a>`;
    if (botToken && alertChatId) {
      await sendTelegramMessage(botToken, alertChatId, successMsg, 'HTML');
    }

    return {
      success: true,
      message: `Report for ${period.label} submitted successfully! (ID: ${reportId})`,
    };
  } else {
    // Record failed submission in D1
    await recordSubmission(env.DB, {
      periodId: period.id,
      summary: report.summary,
      body: report.body,
      status: 'failed',
      errorMessage: lastError,
    });

    // Urgent failure alert to Telegram
    const alertMsg = `🚨 <b>DARS AUTOMATION FAILED!</b>\n\nThe report for <b>${period.label}</b> could not be submitted after 3 attempts.\n\n<b>Error:</b> ${lastError}\n\n⚠️ <b>Deadline: 6:00 PM WAT today!</b>\nPlease log in and submit manually at ${env.DARS_BASE_URL}/reports/submit to avoid the ₦1,000 fine.`;
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
          status: 'healthy',
          watTime: formatWATDateTime(),
          periodWindow: getCurrentWeekWindowWAT(),
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
