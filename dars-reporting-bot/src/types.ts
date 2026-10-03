export interface Env {
  DB: D1Database;
  AI: any;
  DARS_BASE_URL: string;
  AI_MODEL?: string;
  DARS_EMAIL?: string;
  DARS_PASSWORD?: string;
  TELEGRAM_BOT_TOKEN?: string;
  AUTHORIZED_TELEGRAM_USER_IDS?: string;
  ALERT_CHAT_ID?: string;
}

export interface Note {
  id: number;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
  submitted_at: string | null;
}

export interface Submission {
  id: number;
  period_id: string;
  summary: string;
  body: string;
  status: 'success' | 'failed';
  error_message: string | null;
  submitted_at: string;
}

export interface DarsPeriod {
  id: string;
  label: string;
  closesOn: string;
  isCurrent: boolean;
  startDate?: string;
  endDate?: string;
}

export interface DarsReportPayload {
  periodId: string;
  summary: string;
  body: string;
}

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}
