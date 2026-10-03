import type { Env, TelegramUpdate } from '../types';
import { saveNote, getUnsubmittedNotes } from '../db/queries';
import { getCurrentWeekWindowWAT, formatWATDateTime } from '../utils/time';

/**
 * Sends a text message to a Telegram chat.
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  parseMode?: 'HTML' | 'Markdown'
): Promise<boolean> {
  try {
    const payload: any = {
      chat_id: chatId,
      text,
    };
    if (parseMode) {
      payload.parse_mode = parseMode;
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Validates whether a Telegram user ID is authorized.
 */
export function isUserAuthorized(userId: number, authorizedIdsStr?: string): boolean {
  if (!authorizedIdsStr) return false;
  const authorized = authorizedIdsStr
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return authorized.includes(String(userId));
}

/**
 * Handles incoming webhook POST requests from the Telegram Bot API.
 */
export async function handleTelegramWebhook(
  request: Request,
  env: Env,
  onFileNowTrigger?: () => Promise<{ success: boolean; message: string }>
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message;

  if (!message || !message.from || !message.chat) {
    // Return 200 so Telegram acknowledges non-message updates (reactions, edits, etc.)
    return new Response('OK', { status: 200 });
  }

  const userId = message.from.id;
  const chatId = message.chat.id;
  const botToken = env.TELEGRAM_BOT_TOKEN;

  // Authorization check
  if (!isUserAuthorized(userId, env.AUTHORIZED_TELEGRAM_USER_IDS)) {
    return new Response('OK', { status: 200 });
  }

  if (!botToken) {
    return new Response('Bot token not configured', { status: 500 });
  }

  const text = (message.text || '').trim();
  const senderName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ');

  // Command: /start
  if (text.startsWith('/start')) {
    const welcome = `👋 <b>DARS Notes Bot</b>\n\nSend casual text messages anytime during the week describing what you or the team worked on.\n\nEvery Friday at <b>4:00 PM WAT</b>, I will automatically synthesize your notes and submit the bi-weekly report to DARS before the 6:00 PM deadline!\n\n<b>Commands:</b>\n/preview — View this week's unsubmitted notes\n/status — Check bot status & upcoming deadline\n/file_now — Trigger report generation and DARS submission immediately`;
    await sendTelegramMessage(botToken, chatId, welcome, 'HTML');
    return new Response('OK', { status: 200 });
  }

  // Command: /preview
  if (text.startsWith('/preview')) {
    const { startISO, endISO } = getCurrentWeekWindowWAT();
    const notes = await getUnsubmittedNotes(env.DB, startISO, endISO);

    if (notes.length === 0) {
      await sendTelegramMessage(
        botToken,
        chatId,
        '📝 No notes logged for this week yet. Send any update here to record it!'
      );
    } else {
      const formatted = notes
        .map((n, i) => `${i + 1}. [${n.sender_name}]: ${n.text}`)
        .join('\n\n');
      await sendTelegramMessage(
        botToken,
        chatId,
        `📝 <b>Current Week's Notes (${notes.length}):</b>\n\n${formatted}`,
        'HTML'
      );
    }
    return new Response('OK', { status: 200 });
  }

  // Command: /status
  if (text.startsWith('/status')) {
    const nowWAT = formatWATDateTime();
    const { startISO, endISO } = getCurrentWeekWindowWAT();
    const notes = await getUnsubmittedNotes(env.DB, startISO, endISO);

    const statusMsg = `ℹ️ <b>DARS Bot Status:</b>\n• Current Time: ${nowWAT}\n• Target Platform: ${env.DARS_BASE_URL}\n• Unsubmitted Notes This Week: ${notes.length}\n• Next Auto-Filing: Every Friday at 4:00 PM WAT\n• Deadline: Friday 6:00 PM WAT (₦1,000 fine for late filing)`;
    await sendTelegramMessage(botToken, chatId, statusMsg, 'HTML');
    return new Response('OK', { status: 200 });
  }

  // Command: /file_now (Manual trigger)
  if (text.startsWith('/file_now')) {
    if (onFileNowTrigger) {
      await sendTelegramMessage(botToken, chatId, '⏳ Generating report and submitting to DARS now…');
      const res = await onFileNowTrigger();
      await sendTelegramMessage(botToken, chatId, res.message);
    } else {
      await sendTelegramMessage(
        botToken,
        chatId,
        '⚠️ Manual submission handler not initialized in this context.'
      );
    }
    return new Response('OK', { status: 200 });
  }

  // Default: Plain casual text note
  if (text.length > 0) {
    await saveNote(env.DB, {
      senderId: String(userId),
      senderName,
      text,
    });

    const reply = `✓ Saved (${formatWATDateTime()})`;
    await sendTelegramMessage(botToken, chatId, reply);
  }

  return new Response('OK', { status: 200 });
}
