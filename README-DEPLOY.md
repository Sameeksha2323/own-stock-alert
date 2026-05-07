# 🚀 OWN Stock Alert — Deployment Guide
## Vercel + GitHub Actions · No database · Continuous Telegram alerts

---

## WHAT THIS DOES

- Checks the product page **every minute**, 24/7, from the cloud
- The moment it goes in stock:
  - Sends you **one email**
  - Sends **Telegram messages every 10 seconds** until you reply **STOP**
  - Auto-stops after **30 minutes** if you don't reply
  - **Disables itself** after alerts end
- Your dashboard has **Start / Stop buttons** to control monitoring anytime
- Your laptop stays completely off — everything runs on GitHub + Vercel

---

## ACCOUNTS TO CREATE (all free)

| Service | Purpose | Link |
|---|---|---|
| GitHub | Hosts code + runs cron job | https://github.com |
| Vercel | Hosts dashboard + API | https://vercel.com |
| Resend | Sends the one-time email | https://resend.com |
| Telegram | Continuous phone alerts | Already on your phone |

---

## STEP 1 — GitHub repo (3 min)

1. Go to https://github.com → sign up / log in
2. Click **+** → **New repository**
3. Name: `own-stock-alert` → set to **Public** → click **Create repository**
4. Click **uploading an existing file**
5. Extract the ZIP on your laptop → drag ALL files/folders into GitHub
6. Click **Commit changes**

Your repo should look like this:
```
own-stock-alert/
├── api/
│   ├── check-stock.js
│   ├── control.js
│   └── status.js
├── public/
│   └── index.html
├── .github/
│   └── workflows/
│       └── stock-checker.yml
└── vercel.json
```

⚠️ Mac users: `.github` folder is hidden — press **Cmd+Shift+.** to show hidden files before dragging.

---

## STEP 2 — Telegram bot setup (3 min)

1. Open Telegram → search **@BotFather** → send `/newbot`
2. Follow prompts → name it anything e.g. "OWN Stock Alert"
3. BotFather gives you a **token** like `7123456789:AAFxxx...` → save it
4. Search for your new bot in Telegram → open it → send `/start`
5. Get your **Chat ID** — open this URL in your browser (replace YOUR_TOKEN):
   ```
   https://api.telegram.org/botYOUR_TOKEN/getUpdates
   ```
   Find `"id":` inside `"chat"` → that number is your Chat ID (e.g. `987654321`)
6. **Mute all Telegram notifications** except this bot:
   - Telegram Settings → Notifications → disable all
   - Open your bot chat → tap bot name → Notifications → unmute this chat only

---

## STEP 3 — Resend email setup (2 min)

1. Go to https://resend.com → sign up free
2. Click **API Keys** → **Create API Key** → name: "StockAlert"
3. Copy the key — looks like `re_abc123xyz...` → save it

---

## STEP 4 — GitHub Personal Access Token (2 min)
Needed so the dashboard Start/Stop buttons can control GitHub Actions.

1. GitHub → click your profile photo top-right → **Settings**
2. Scroll to bottom → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token (classic)**
4. Name: `StockAlertControl`
5. Expiration: **No expiration**
6. Tick only: ✅ **workflow**
7. Click **Generate token** → copy immediately (shown only once!)
   Looks like: `ghp_abc123xyz...`

---

## STEP 5 — Add GitHub Secrets (2 min)

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add each one:

| Secret Name | Value |
|---|---|
| `CRON_SECRET` | Make up any password e.g. `mysecret2024` |
| `VERCEL_URL` | Leave blank for now — add after Step 6 |
| `TELEGRAM_BOT_TOKEN` | Your bot token from Step 2 |
| `TELEGRAM_CHAT_ID` | Your chat ID from Step 2 |
| `RESEND_API_KEY` | Your Resend key from Step 3 |
| `ALERT_EMAIL` | Your email address |
| `GH_PAT` | Your GitHub Personal Access Token from Step 4 |

---

## STEP 6 — Deploy to Vercel (3 min)

1. Go to https://vercel.com → **Add New → Project**
2. Find your `own-stock-alert` repo → click **Import**
3. Leave all settings as default → click **Deploy**
4. Wait ~30 seconds → you'll see "Congratulations!"
5. Note your URL e.g. `https://own-stock-alert.vercel.app`

### Add environment variables in Vercel:
Go to your project → **Settings → Environment Variables** → add each:

| Variable | Value |
|---|---|
| `CRON_SECRET` | Same password as GitHub secret |
| `RESEND_API_KEY` | Your Resend API key |
| `ALERT_EMAIL` | Your email address |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID |
| `GH_PAT` | Your GitHub Personal Access Token |
| `GH_REPO` | `yourusername/own-stock-alert` |

After adding all → **Deployments tab → three dots → Redeploy**

---

## STEP 7 — Add Vercel URL to GitHub (1 min)

1. GitHub repo → **Settings → Secrets → Actions**
2. Edit `VERCEL_URL` → enter: `https://own-stock-alert.vercel.app`
   (use your actual URL from Step 6)

---

## STEP 8 — Test everything (2 min)

### Test the cron manually:
1. GitHub repo → **Actions** tab → **Stock Checker** → **Run workflow**
2. Click into the running job → watch the logs
3. You should see: `Stock status: out_of_stock` → `Not in stock yet. Exiting.`

### Check your dashboard:
Visit your Vercel URL. You should see:
- Stock status (red = out of stock currently)
- Green "Monitoring active" badge
- Start / Stop buttons working

---

## HOW ALERTS WORK WHEN IN STOCK

```
Every 60 seconds:
  GitHub checks product page
  "Notify Me" found? → wait, check again next minute
  "Order Now" found? →
      → Send ONE email to your inbox
      → Start Telegram loop:
            Send message: "🚨 IN STOCK! Order now!"
            Wait 10 seconds
            Did you reply STOP? → send confirmation, stop
            No STOP? → send next message, repeat
            After 30 min → auto-stop
      → Disable the cron job (no more checks)
      → You press Start on dashboard when needed again
```

---

## REPLYING STOP TO THE BOT

When your phone is pinging every 10 seconds:
1. Open Telegram → go to your Stock Alert bot chat
2. Type **STOP** (all caps) and send
3. Bot replies "✅ Alerts stopped" and pings stop immediately

---

## FAQ

**Does the email come just once?**
Yes — exactly one email, no matter how long the Telegram loop runs.

**What if I miss the STOP window and alerts run for 30 min?**
The loop stops automatically after 30 minutes and sends a final "auto-stopped" message.

**What if the product sells out again before I order?**
The dashboard does a live stock check every 30 seconds — visit it to see current status.

**GitHub says the workflow was disabled when it tries to disable itself?**
Harmless — this just means you manually stopped it from the dashboard first.

**Will GitHub Actions cron always fire exactly every 60 seconds?**
Usually yes, occasionally 5–15 min late during GitHub's peak hours. Still far better than manual checking.
