# DARS Weekly Report Automation — System Design & Specification

**Date:** 2026-10-03  
**Status:** Draft / Ready for Review  
**Target Deadline:** Reporting begins Monday, October 5, 2026; First report due Friday, October 9, 2026 by 6:00 PM WAT  
**Cost Constraint:** ₦0 / $0 (100% Free Tier on Cloudflare Workers, Cloudflare D1, Cloudflare Workers AI, and Telegram)

---

## 1. Problem Statement & Objectives

Directors in the Babcock University Computer Club (BUCC) are required to submit a weekly activity report on the Director Activity Reporting System (DARS at `https://dars.wearebucc.com`) **every Friday before 6:00 PM WAT**. Missing this deadline incurs an automatic **₦1,000 fine**.

Manual logging throughout the week is fragmented and prone to forgetfulness. Furthermore, manual reporting requires formatting text into specific DARS sections (`Overview`, `Activities`, `Challenges`, `Next Period`).

### Objectives
1. **Effortless Note Capture:** Enable the team (Director + Lead Developer) to send plain messages to a private Telegram bot anytime during the week. The bot replies `"✓ Saved"` and timestamps each note.
2. **Deterministic Weekly Aggregation:** Every Friday at 4:00 PM WAT (15:00 UTC), aggregate notes logged since Monday 00:00 WAT.
3. **Automated AI Formatting:** Use Cloudflare Workers AI to convert raw scattered notes into DARS-compliant HTML structure and an executive one-line summary.
4. **Headless API Submission:** Submit directly via HTTP REST API (`POST /api/auth/sign-in` → `POST /api/reports`) without fragile browser automation.
5. **Fail-Safe & Anti-Penalty Alerts:** Provide immediate confirmation upon success, and urgent, conspicuous Telegram alerts upon failure, leaving an ample ~2-hour window before 6:00 PM to file manually if needed.

---

## 2. System Architecture

```text
 ┌────────────────────────────────────────────────────────┐
 │                      Telegram                          │
 │  (Director / Lead Developer sends casual updates)       │
 └───────────────────────────┬────────────────────────────┘
                             │ HTTPS Webhook
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │             Cloudflare Worker (dars-bot)               │
 │                                                        │
 │ 1. Webhook Handler (/webhook/telegram)                 │
 │    • Authorize user ID (whitelist)                     │
 │    • Write message to Cloudflare D1 (notes table)      │
 │    • Instant response: "✓ Saved"                       │
 │                                                        │
 │ 2. Helper Commands                                     │
 │    • /preview   - View this week's collected notes     │
 │    • /file_now  - Immediate emergency manual submit    │
 │    • /status    - Health check & upcoming deadline     │
 │                                                        │
 │ 3. Scheduled Cron Event (0 15 * * 5 = Fri 4:00 PM WAT) │
 │    • Query D1 notes for current week                   │
 │    • Format via Cloudflare Workers AI                  │
 │    • Call DARS API (Sign-in -> Active Period -> Submit)│
 │    • Log submission in D1 (submissions table)          │
 │    • Send Telegram Notification (Success or Alert)     │
 └───────────────────────────┬────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
 ┌──────────────────────┐          ┌──────────────────────┐
 │    Cloudflare D1     │          │ Cloudflare Workers AI│
 │   Serverless SQLite  │          │   Llama 3.1 8B / 70B │
 │  (notes, submissions)│          │ (0 external API key) │
 └──────────────────────┘          └──────────────────────┘
            │
            ▼
 ┌────────────────────────────────────────────────────────┐
 │            DARS Platform (Next.js / Supabase)          │
 │         Endpoint: https://dars.wearebucc.com           │
 └────────────────────────────────────────────────────────┘
```

---

## 3. Data Storage & Schema (Cloudflare D1)

Cloudflare D1 provides transactional SQLite with immediate consistency and generous free limits (5M reads/day, 100k writes/day).

### Tables

```sql
-- Table: notes
-- Stores incoming messages from authorized Telegram users
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT
);

-- Table: submissions
-- Stores history of report submissions and audit results
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Date Window Calculation
- Reporting week starts: **Monday at 00:00:00 WAT** (`UTC+1`).
- Report generation triggers: **Friday at 16:00:00 WAT** (`15:00:00 UTC`).
- SQL Query for current week:
  ```sql
  SELECT id, sender_name, text, created_at 
  FROM notes 
  WHERE created_at >= ? AND created_at <= ? 
  ORDER BY created_at ASC;
  ```

---

## 4. DARS API Contract & Validation Rules

Based on the [DARS repository](file:///C:/Users/Kensey/Documents/antigravity/kind-carson) analysis:

### 1. Sign-In
* **URL:** `POST https://dars.wearebucc.com/api/auth/sign-in`
* **Payload:**
  ```json
  { "email": "director@bucc.org", "password": "..." }
  ```
* **Response:** Returns `200 OK` with `session.accessToken` and `Set-Cookie` session headers.

### 2. Get Current Period
* **URL:** `GET https://dars.wearebucc.com/api/periods`
* **Response:**
  ```json
  {
    "data": {
      "periods": [
        {
          "id": "p-2026-10-05",
          "label": "Oct 5 - 18, 2026",
          "isCurrent": true,
          "closesOn": "Oct 19, 2026"
        }
      ]
    }
  }
  ```
* Automation selects `periods.find(p => p.isCurrent).id`.

### 3. Report Submission
* **URL:** `POST https://dars.wearebucc.com/api/reports`
* **Validation Requirements:**
  - `periodId`: String (required).
  - `summary`: String (minimum **10 characters**).
  - `body`: HTML String (minimum **40 characters of plain text** after stripping tags).
* **Payload Example:**
  ```json
  {
    "periodId": "p-2026-10-05",
    "summary": "Completed authentication fixes, prepared staging release for DARS portal.",
    "body": "<h3>Overview</h3><p>Maintained steady progress on backend stability...</p><h3>Activities</h3><ul><li>Finalized session handling</li><li>Tested report workflows</li></ul><h3>Challenges</h3><p>None encountered this period.</p><h3>Next Period</h3><p>Begin production migration.</p>"
  }
  ```
* **Upsert Behavior:** If a report for the period already exists, DARS updates it automatically in-place.

---

## 5. AI Formatting Pipeline (Cloudflare Workers AI)

* **Model:** `@cf/meta/llama-3.1-8b-instruct`
* **Cost:** Free (uses <100 Neurons per weekly execution; free daily quota is 10,000 Neurons).
* **System Prompt:**
  ```text
  You are an executive assistant for a directorate lead at the Babcock University Computer Club (BUCC).
  Your task is to synthesize raw weekly activity notes into a polished bi-weekly director report for DARS.

  Output MUST be valid JSON with this exact schema:
  {
    "summary": "One-line executive summary (must be at least 15 characters, maximum 120 characters)",
    "body": "<h3>Overview</h3><p>...</p><h3>Activities</h3><ul><li>...</li></ul><h3>Challenges</h3><p>...</p><h3>Next Period</h3><p>...</p>"
  }

  Rules:
  1. Plain text inside 'body' must be at least 80 characters.
  2. Maintain a professional, executive tone.
  3. Ground all points strictly in the provided notes; do not invent tasks or metrics.
  4. If notes do not mention challenges, state 'No major blockers encountered during this period.'
  ```

---

## 6. Telegram Bot Interface & Commands

1. **Passive Note Capture:**
   - Any authorized user sends a message.
   - Bot replies: `✓ Saved (Oct 6, 2:45 PM)`
2. **Commands:**
   - `/start` — Greets user and displays instructions.
   - `/preview` — Fetches all unsubmitted notes for this week and displays them as a formatted draft preview.
   - `/file_now` — Manually triggers report synthesis and DARS submission immediately (for early filing or testing).
   - `/status` — Displays current reporting period, next deadline, and bot status.

---

## 7. Reliability, Retry & Notification Logic

### Scheduled Execution (Friday 16:00 WAT / 15:00 UTC)
1. **Empty Week Fallback:** If zero notes were submitted during the week:
   - Bot sends a Telegram alert:  
     `⚠️ No notes were logged this week for DARS! Please send your updates now or use /file_now before 6:00 PM.`
2. **Submission Flow:**
   - Formats report via Workers AI.
   - Submits to DARS.
   - If DARS returns non-2xx: Retries up to 3 times with exponential backoff (10s, 30s, 60s).
3. **Success Alert:**
   ```text
   ✅ DARS Weekly Report Submitted!
   Period: Oct 5 - 18, 2026
   Time: 4:02 PM WAT

   Summary:
   Completed authentication fixes, prepared staging release for DARS portal.

   View Report: https://dars.wearebucc.com/reports
   ```
4. **Urgent Failure Alert:**
   ```text
   🚨 DARS SUBMISSION FAILED!
   Error: Unable to connect to DARS API / Invalid credentials.

   ⚠️ Deadline: 6:00 PM WAT today (1h 55m remaining)
   To avoid the ₦1,000 fine, please submit manually at:
   https://dars.wearebucc.com/reports/submit
   ```

---

## 8. Secrets & Configuration

Encrypted secrets stored via `wrangler secret put`:
* `DARS_EMAIL`: BUCC email address.
* `DARS_PASSWORD`: BUCC account password.
* `TELEGRAM_BOT_TOKEN`: Token from `@BotFather`.
* `AUTHORIZED_TELEGRAM_USER_IDS`: Comma-separated list of allowed Telegram user IDs (e.g. `12345678,87654321`).
* `ALERT_CHAT_ID`: Telegram chat or group ID for receiving filing alerts.

Environment variables in `wrangler.toml`:
* `DARS_BASE_URL`: `https://dars.wearebucc.com`
* `AI_MODEL`: `@cf/meta/llama-3.1-8b-instruct`
