# DARS Weekly Report Automation Bot

A 100% free serverless automation system deployed on Cloudflare Workers. It enables the team to casually log updates on Telegram throughout the week, formats them into a compliant report via Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`), and automatically submits the bi-weekly report to DARS (`https://dars.wearebucc.com`) every Friday at 4:00 PM WAT (2 hours before the 6:00 PM deadline, avoiding the ₦1,000 late fine).

---

## Architecture Overview

```text
[ During the Week ]
You & Lead Developer ──> Telegram Bot ──> Cloudflare Worker (Webhook)
                                                    │
                                           Saves note to D1 (SQLite)
                                           Replies "✓ Saved"

[ Friday 4:00 PM WAT (15:00 UTC) ]
Cloudflare Cron Trigger
         │
         ▼
Fetches unsubmitted notes (Monday 00:00 -> Friday 16:00 WAT)
         │
         ▼
Cloudflare Workers AI (Llama 3.1 8B Instruct)
Formats to DARS schema:
• One-line summary (>= 10 chars)
• HTML body with <h3>Overview</h3>, <h3>Activities</h3>, <h3>Challenges</h3>, <h3>Next Period</h3> (>= 40 plain text chars)
         │
         ▼
DARS REST API Client
1. POST /api/auth/sign-in (captures session cookies)
2. GET  /api/periods (gets current active period)
3. POST /api/reports (submits or updates report)
         │
    ┌────┴──────────────────────────┐
    ▼                               ▼
[ SUCCESS ]                    [ FAILURE ]
Telegram Notification:         Urgent Telegram Alert:
"✅ Weekly Report Filed"        "🚨 FAILED! Deadline 6:00 PM (1h 55m left)
                                Please submit manually to avoid ₦1,000 fine"
```

---

## 5-Minute Setup & Deployment Guide

### 1. Create Cloudflare D1 Database
In the `dars-reporting-bot` directory:
```bash
npx wrangler d1 create dars-db
```
Wrangler will output something like:
```toml
[[d1_databases]]
binding = "DB"
database_name = "dars-db"
database_id = "xxxx-xxxx-xxxx-xxxx"
```
Copy that `database_id` into your [wrangler.toml](./wrangler.toml) under `[[d1_databases]]`.

### 2. Initialize the Database Schema
Execute the SQL schema on your remote D1 database:
```bash
npx wrangler d1 execute dars-db --remote --file=./schema.sql
```

### 3. Set Your Encrypted Secrets
Set each secret securely on Cloudflare:
```bash
npx wrangler secret put DARS_EMAIL
# Enter your BUCC email (e.g., director@bucc.org)

npx wrangler secret put DARS_PASSWORD
# Enter your DARS password

npx wrangler secret put TELEGRAM_BOT_TOKEN
# Enter the Bot token obtained from @BotFather

npx wrangler secret put AUTHORIZED_TELEGRAM_USER_IDS
# Enter comma-separated Telegram User IDs allowed to submit notes (e.g., "12345678,87654321")
# (You can get your Telegram ID by messaging @userinfobot)

npx wrangler secret put ALERT_CHAT_ID
# Enter the Telegram Chat ID where success & urgent failure alerts should be sent
```

### 4. Deploy the Worker
```bash
npx wrangler deploy
```
Wrangler will print your worker's live URL, e.g.:
`https://dars-reporting-bot.<your-subdomain>.workers.dev`

### 5. Link the Telegram Webhook
Register your Cloudflare Worker URL with the Telegram Bot API:
```bash
curl -F "url=https://<your-worker-url>/webhook/telegram" "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook"
```
You should see:
`{"ok":true,"result":true,"description":"Webhook was set"}`

---

## How to Use

### 1. Casual Logging (Throughout the Week)
Just send any plain message to your Telegram bot:
> *"Met with the frontend team to review PRs and finalize marketplace components."*

The bot will instantly reply:
> `✓ Saved (Oct 6, 2:45 PM WAT)`

Both you and the lead developer (or anyone in `AUTHORIZED_TELEGRAM_USER_IDS`) can message the bot anytime.

### 2. Bot Commands
* `/start` — Shows bot guide and available commands.
* `/preview` — Displays all unsubmitted notes logged for the current week.
* `/status` — Displays current time in WAT, target DARS URL, unsubmitted note count, and next deadline.
* `/file_now` — **Manual emergency override.** Immediately triggers report synthesis and submits to DARS without waiting for Friday 4:00 PM.

### 3. Automated Friday Filing
* The cron job triggers automatically every **Friday at 15:00 UTC (16:00 WAT)**.
* If successful, you will receive a confirmation message with the generated summary and link to DARS.
* If any error occurs (network down, bad credentials, DARS maintenance), the system retries 3 times, then fires an urgent alarm warning you that the 6:00 PM deadline is approaching.

---

## Local Development & Testing

Run all unit and integration tests:
```bash
npm test
```

Verify build bundle:
```bash
npx wrangler deploy --dry-run
```
