# DARS Weekly Report Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a zero-cost serverless Cloudflare Worker that captures casual weekly notes via Telegram, formats them into a compliant report via Cloudflare Workers AI, and automatically submits the weekly director report to DARS (`dars.wearebucc.com`) every Friday at 4:00 PM WAT, sending instant Telegram alerts to prevent the ₦1,000 late fine.

**Architecture:** A single Cloudflare Worker project (`dars-reporting-bot`) using Cloudflare D1 for storage and Cloudflare Workers AI for formatting. The Worker exposes an HTTPS webhook endpoint for Telegram updates and a `scheduled` cron handler for the Friday 4:00 PM WAT (15:00 UTC) automatic filing pipeline with built-in retries and alert dispatching.

**Tech Stack:** Cloudflare Workers (TypeScript / ES modules), Cloudflare D1 (SQLite), Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`), Telegram Bot API, Vitest for unit/integration testing.

**Spec:** [docs/superpowers/specs/2026-10-03-dars-weekly-report-automation-design.md](file:///C:/Users/Kensey/Documents/antigravity/serene-nobel/docs/superpowers/specs/2026-10-03-dars-weekly-report-automation-design.md)

## Global Constraints

- Runtime: Cloudflare Workers (Node-compatible compatibility flag).
- Cost ceiling: ₦0 / $0 (strictly within Cloudflare D1 free 5M reads/day, Workers AI 10k free neurons/day, free cron triggers).
- Summary validation: String, minimum 10 characters (`summary.trim().length >= 10`).
- Body validation: HTML string with minimum 40 characters of plain text (`body.replace(/<[^>]*>/g, '').trim().length >= 40`).
- Required DARS HTML sections: `<h3>Overview</h3>`, `<h3>Activities</h3>`, `<h3>Challenges</h3>`, `<h3>Next Period</h3>`.
- Timezone: West Africa Time (WAT / UTC+1) — report window starts Monday 00:00:00 WAT, cron triggers Friday 16:00:00 WAT (`15:00:00 UTC`).

## Review Focus

1. **Empty Week Notes:** When Friday 4:00 PM triggers and no notes were sent during the week, the system must not file an empty or dummy report; it must alert the Telegram chat immediately with the deadline countdown so the user can submit notes manually.
2. **DARS Session Expiry / 401 on Submit:** The DARS sign-in cookies must be used on the immediate subsequent `GET /api/periods` and `POST /api/reports` calls without dropping cookies.
3. **AI Generation Schema Drift:** If Workers AI returns non-JSON or missing fields, a robust heuristic extractor and fallback formatter must guarantee a valid DARS-compliant HTML report with `<h3>` sections that passes the $\ge 40$ char rule.
4. **Unauthorized Telegram Messages:** Messages sent from user IDs not listed in `AUTHORIZED_TELEGRAM_USER_IDS` must be silently ignored or rejected, preventing unauthorized users from polluting reports.
5. **D1 Timezone Boundary:** The Monday 00:00 WAT calculation must properly account for UTC+1 offset in ISO string comparison so notes sent on Monday morning are never omitted.

---

## File Structure

```text
dars-reporting-bot/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── wrangler.toml
├── schema.sql
├── src/
│   ├── index.ts              # Worker entry: fetch (webhook) & scheduled (cron) handlers
│   ├── types.ts              # Environment bindings & domain interfaces
│   ├── db/
│   │   └── queries.ts        # D1 SQL queries: notes, submissions, time window
│   ├── dars/
│   │   └── client.ts         # DARS API client: signIn, getActivePeriod, submitReport
│   ├── ai/
│   │   └── formatter.ts      # Workers AI integration & fallback prompt parsing
│   ├── telegram/
│   │   └── bot.ts            # Telegram webhook updates, command dispatcher, messaging
│   └── utils/
│       └── time.ts           # WAT date range calculations
└── tests/
    ├── time.test.ts
    ├── db.test.ts
    ├── formatter.test.ts
    ├── dars.test.ts
    └── telegram.test.ts
```

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `dars-reporting-bot/package.json`
- Create: `dars-reporting-bot/tsconfig.json`
- Create: `dars-reporting-bot/wrangler.toml`
- Create: `dars-reporting-bot/schema.sql`
- Create: `dars-reporting-bot/vitest.config.ts`
- Create: `dars-reporting-bot/src/types.ts`

**Interfaces:**
- Produces: `Env` interface in `src/types.ts` containing:
  - `DB: D1Database`
  - `AI: any`
  - `DARS_BASE_URL: string`
  - `DARS_EMAIL: string`
  - `DARS_PASSWORD: string`
  - `TELEGRAM_BOT_TOKEN: string`
  - `AUTHORIZED_TELEGRAM_USER_IDS: string`
  - `ALERT_CHAT_ID: string`

- [x] **Step 1: Write `package.json` and install dev dependencies**
  Configure scripts: `"test": "vitest run"`, `"deploy": "wrangler deploy"`. Dependencies: `wrangler`, `vitest`, `@cloudflare/workers-types`, `typescript`.
- [x] **Step 2: Create `tsconfig.json` and `vitest.config.ts`**
  Configure TypeScript for ESNext, `moduleResolution: "bundler"`, and `@cloudflare/workers-types`.
- [x] **Step 3: Create `wrangler.toml`**
  Set `name = "dars-reporting-bot"`, `main = "src/index.ts"`, `compatibility_date = "2024-09-23"`, `compatibility_flags = ["nodejs_compat"]`. Configure `[triggers] crons = ["0 15 * * 5"]`, D1 database binding `DB`, and Workers AI binding `[ai] binding = "AI"`.
- [x] **Step 4: Create `schema.sql`**
  Define `notes` table (`id`, `sender_id`, `sender_name`, `text`, `created_at`, `submitted_at`) and `submissions` table (`id`, `period_id`, `summary`, `body`, `status`, `error_message`, `submitted_at`).
- [x] **Step 5: Create `src/types.ts`**
  Export `Env`, `Note`, `Submission`, `DarsPeriod`, `DarsReportPayload`, and `TelegramUpdate` types.
- [x] **Step 6: Verify build configuration**
  Run: `cd dars-reporting-bot && npm install --silent && npx tsc --noEmit`
  Expected: Successful compilation without type errors.
- [x] **Step 7: Commit scaffolding**
  ```bash
  git add dars-reporting-bot/
  git commit -m "chore: scaffold dars-reporting-bot Cloudflare Worker"
  ```

---

### Task 2: Time Window & D1 Database Access Layer

**Files:**
- Create: `dars-reporting-bot/src/utils/time.ts`
- Create: `dars-reporting-bot/src/db/queries.ts`
- Create: `dars-reporting-bot/tests/time.test.ts`
- Create: `dars-reporting-bot/tests/db.test.ts`

**Interfaces:**
- Produces:
  - `getCurrentWeekWindowWAT(referenceDate?: Date): { startISO: string, endISO: string }`
  - `saveNote(db: D1Database, note: { senderId: string, senderName: string, text: string }): Promise<number>`
  - `getUnsubmittedNotes(db: D1Database, startISO: string, endISO: string): Promise<Note[]>`
  - `markNotesAsSubmitted(db: D1Database, noteIds: number[]): Promise<void>`
  - `recordSubmission(db: D1Database, sub: { periodId: string, summary: string, body: string, status: 'success' | 'failed', errorMessage?: string }): Promise<number>`

- [x] **Step 1: Write tests for `time.ts` and `queries.ts`**
  In `tests/time.test.ts`: verify that given any day in a week (e.g. Friday Oct 9, 2026 15:00 UTC / 16:00 WAT), `getCurrentWeekWindowWAT` returns Monday Oct 5 00:00:00 WAT as `startISO` and the given reference date as `endISO`.
- [x] **Step 2: Run tests to verify failure**
  Run: `npx vitest run tests/time.test.ts`
  Expected: FAIL with module not found.
- [x] **Step 3: Implement `src/utils/time.ts`**
  Implement `getCurrentWeekWindowWAT(referenceDate = new Date())` calculating the Monday 00:00:00 WAT of the current week.
- [x] **Step 4: Implement `src/db/queries.ts`**
  Implement `saveNote`, `getUnsubmittedNotes`, `markNotesAsSubmitted`, and `recordSubmission` using D1 prepared statements (`db.prepare(...).bind(...).run()` / `.all()`).
- [x] **Step 5: Run tests to verify they pass**
  Run: `npx vitest run tests/time.test.ts tests/db.test.ts`
  Expected: PASS.
- [x] **Step 6: Commit**
  ```bash
  git add dars-reporting-bot/src/utils/time.ts dars-reporting-bot/src/db/queries.ts dars-reporting-bot/tests/
  git commit -m "feat: add time window utils and D1 database query functions"
  ```

---

### Task 3: Workers AI Report Formatter Module

**Files:**
- Create: `dars-reporting-bot/src/ai/formatter.ts`
- Create: `dars-reporting-bot/tests/formatter.test.ts`

**Interfaces:**
- Consumes: `Note` from `src/types.ts`
- Produces: `formatReport(ai: any, notes: Note[]): Promise<{ summary: string, body: string }>`

- [x] **Step 1: Write unit tests in `tests/formatter.test.ts`**
  Test cases:
  1. Parses clean JSON returned by AI into `{ summary, body }`.
  2. Extracts JSON if wrapped in markdown code blocks (` ```json ... ``` `).
  3. Verifies that `summary.length >= 10` and `body` includes `<h3>Overview</h3>`, `<h3>Activities</h3>`, `<h3>Challenges</h3>`, `<h3>Next Period</h3>`.
  4. Fallback generator activates if AI throws or returns unparseable text, generating a valid HTML report with all required sections directly from the raw notes.
- [x] **Step 2: Run test to verify failure**
  Run: `npx vitest run tests/formatter.test.ts`
  Expected: FAIL with module not found.
- [x] **Step 3: Implement `src/ai/formatter.ts`**
  Implement `formatReport` using system prompt defined in spec section 5, calling `ai.run("@cf/meta/llama-3.1-8b-instruct", { messages })`. Include JSON sanitization and fallback HTML generator that formats bullet points under `<h3>Activities</h3>`.
- [x] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/formatter.test.ts`
  Expected: PASS.
- [x] **Step 5: Commit**
  ```bash
  git add dars-reporting-bot/src/ai/formatter.ts dars-reporting-bot/tests/formatter.test.ts
  git commit -m "feat: implement Workers AI report formatting and fallback generator"
  ```

---

### Task 4: DARS REST API Client

**Files:**
- Create: `dars-reporting-bot/src/dars/client.ts`
- Create: `dars-reporting-bot/tests/dars.test.ts`

**Interfaces:**
- Produces:
  - `class DarsClient`:
    - `constructor(baseUrl: string)`
    - `signIn(email: string, password: string): Promise<{ success: boolean, cookieHeader: string, error?: string }>`
    - `getCurrentPeriod(cookieHeader: string): Promise<{ id: string, label: string }>`
    - `submitReport(cookieHeader: string, payload: { periodId: string, summary: string, body: string }): Promise<{ success: boolean, reportId?: string, error?: string }>`

- [x] **Step 1: Write unit tests in `tests/dars.test.ts`**
  Using mocked global `fetch`:
  1. `signIn`: sends credentials to `/api/auth/sign-in`, extracts `set-cookie` headers, returns cookie string.
  2. `getCurrentPeriod`: calls `/api/periods`, filters `isCurrent === true`, returns `{ id, label }`.
  3. `submitReport`: sends `{ periodId, summary, body }` to `/api/reports`, verifies response code 201/200 and returns report ID.
  4. Error handling: invalid credentials (401), validation failure (400), or server error (500) returns descriptive error string.
- [x] **Step 2: Run test to verify failure**
  Run: `npx vitest run tests/dars.test.ts`
  Expected: FAIL with module not found.
- [x] **Step 3: Implement `src/dars/client.ts`**
  Implement `DarsClient` handling cookie forwarding, JSON serialization, and error message extraction from `{ error: { message } }`.
- [x] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/dars.test.ts`
  Expected: PASS.
- [x] **Step 5: Commit**
  ```bash
  git add dars-reporting-bot/src/dars/client.ts dars-reporting-bot/tests/dars.test.ts
  git commit -m "feat: implement DARS REST API client with cookie-based auth and report submission"
  ```

---

### Task 5: Telegram Bot Webhook & Command Dispatcher

**Files:**
- Create: `dars-reporting-bot/src/telegram/bot.ts`
- Create: `dars-reporting-bot/tests/telegram.test.ts`

**Interfaces:**
- Consumes: `saveNote`, `getUnsubmittedNotes` from Task 2, `formatReport` from Task 3, `DarsClient` from Task 4
- Produces:
  - `sendTelegramMessage(botToken: string, chatId: string | number, text: string): Promise<boolean>`
  - `handleTelegramWebhook(request: Request, env: Env): Promise<Response>`

- [x] **Step 1: Write unit tests in `tests/telegram.test.ts`**
  1. Unauthorized sender (not in `AUTHORIZED_TELEGRAM_USER_IDS`): returns HTTP 200 without saving note or replying.
  2. Authorized plain text message: saves note to D1, sends reply `"✓ Saved"`.
  3. Command `/start`: sends welcome message and instructions.
  4. Command `/preview`: fetches unsubmitted notes and returns formatted list.
  5. Command `/status`: returns reporting status, database check, and next deadline.
- [x] **Step 2: Run test to verify failure**
  Run: `npx vitest run tests/telegram.test.ts`
  Expected: FAIL.
- [x] **Step 3: Implement `src/telegram/bot.ts`**
  Implement `sendTelegramMessage` using `https://api.telegram.org/bot<TOKEN>/sendMessage`. Implement `handleTelegramWebhook` parsing `TelegramUpdate`, checking sender whitelist, and routing commands.
- [x] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/telegram.test.ts`
  Expected: PASS.
- [x] **Step 5: Commit**
  ```bash
  git add dars-reporting-bot/src/telegram/bot.ts dars-reporting-bot/tests/telegram.test.ts
  git commit -m "feat: implement Telegram webhook handler, command routing, and message dispatch"
  ```

---

### Task 6: Scheduled Cron Runner & Main Worker Integration

**Files:**
- Create: `dars-reporting-bot/src/index.ts`
- Modify: `dars-reporting-bot/src/telegram/bot.ts` (link `/file_now` to the shared pipeline)
- Create: `dars-reporting-bot/tests/cron.test.ts`

**Interfaces:**
- Produces:
  - `runReportingPipeline(env: Env, triggeredBy: 'cron' | 'manual'): Promise<{ success: boolean, message: string }>`
  - Worker `export default { fetch, scheduled }`

- [x] **Step 1: Write unit tests in `tests/cron.test.ts`**
  1. If zero notes found in week window: sends reminder notification to `ALERT_CHAT_ID`, records skipped submission, does not call DARS API.
  2. If notes exist: formats via AI, signs into DARS, gets current period, posts report, marks notes as submitted in D1, sends success alert to `ALERT_CHAT_ID`.
  3. If DARS fails: retries 3 times, records failed submission in D1, sends urgent alert with remaining time before 6:00 PM.
- [x] **Step 2: Run test to verify failure**
  Run: `npx vitest run tests/cron.test.ts`
  Expected: FAIL.
- [x] **Step 3: Implement `runReportingPipeline` and `src/index.ts`**
  In `src/index.ts`, route incoming requests on `/webhook/telegram` to `handleTelegramWebhook`, and route `scheduled(controller, env, ctx)` to `runReportingPipeline(env, 'cron')`. Add retry loop with exponential backoff on network failures.
- [x] **Step 4: Run all test suites across the project**
  Run: `cd dars-reporting-bot && npx vitest run`
  Expected: All test suites PASS.
- [x] **Step 5: Verify build with wrangler**
  Run: `cd dars-reporting-bot && npx wrangler deploy --dry-run`
  Expected: Clean build bundle generated with no bundle or syntax errors.
- [x] **Step 6: Commit**
  ```bash
  git add dars-reporting-bot/src/index.ts dars-reporting-bot/tests/cron.test.ts
  git commit -m "feat: integrate scheduled cron runner, retry mechanism, and Worker entrypoint"
  ```

---

### Task 7: Deployment Documentation & Verification Guide

**Files:**
- Create: `dars-reporting-bot/README.md`

- [x] **Step 1: Write `dars-reporting-bot/README.md`**
  Document step-by-step instructions for:
  1. Creating D1 database: `npx wrangler d1 create dars-db` and putting ID in `wrangler.toml`.
  2. Applying schema: `npx wrangler d1 execute dars-db --file=./schema.sql`.
  3. Setting encrypted secrets: `wrangler secret put DARS_EMAIL`, `DARS_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `AUTHORIZED_TELEGRAM_USER_IDS`, `ALERT_CHAT_ID`.
  4. Registering Telegram webhook: `curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<worker>.<subdomain>.workers.dev/webhook/telegram"`.
  5. Testing the bot in Telegram (`/status`, `/preview`, `/file_now`).
- [x] **Step 2: Commit documentation**
  ```bash
  git add dars-reporting-bot/README.md
  git commit -m "docs: add deployment instructions and verification guide for dars-reporting-bot"
  ```
