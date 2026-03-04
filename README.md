# SGB Tracker — Deployment Guide

## What's in this project

```
sgbtracker/
├── index.html        ← The website (all UI + calculations)
├── vercel.json       ← Vercel configuration
├── api/
│   ├── prices.js     ← Serverless function: fetches LTPs from NSE
│   └── gold.js       ← Serverless function: fetches gold price
└── README.md         ← This file
```

---

## Step 1 — Get a free GoldAPI key (optional but recommended)

1. Go to https://goldapi.io
2. Click "Sign Up Free"
3. Copy your API key (looks like: `goldapi-abc123xyz`)
4. You'll use this in Step 3

> Without this key the site still works — it falls back to metals.live + frankfurter.app for gold price.

---

## Step 2 — Create a GitHub account and upload the project

1. Go to https://github.com and sign up (free)
2. Click the **+** button → **New repository**
3. Name it `sgbtracker`, make it **Public**, click **Create repository**
4. On the next screen click **uploading an existing file**
5. Upload ALL files keeping the folder structure:
   - `index.html`
   - `vercel.json`
   - `api/prices.js`
   - `api/gold.js`
6. Click **Commit changes**

---

## Step 3 — Deploy on Vercel (free)

1. Go to https://vercel.com and click **Sign Up** → **Continue with GitHub**
2. Click **Add New Project**
3. Find your `sgbtracker` repo and click **Import**
4. On the configuration screen, **do not change anything** — click **Deploy**
5. Wait ~60 seconds. Vercel will give you a URL like `sgbtracker.vercel.app` 🎉

---

## Step 4 — Add your GoldAPI key (optional)

If you got a GoldAPI key in Step 1:

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `GOLDAPI_KEY`
   - **Value:** your key (e.g. `goldapi-abc123xyz`)
3. Click **Save**
4. Go to **Deployments** → click the three dots on your latest deployment → **Redeploy**

---

## Step 5 — Custom domain (optional)

1. Buy a domain (e.g. from Namecheap or GoDaddy — ~₹800/year)
2. In Vercel → **Settings** → **Domains** → add your domain
3. Follow the DNS instructions Vercel shows you

---

## How the site works

- **Gold price**: Fetched every 5 minutes by the `/api/gold` serverless function. You can always override it manually.
- **SGB LTPs**: Fetched from NSE by the `/api/prices` serverless function. Click "Refresh prices" to update, or enter any price manually by clicking "edit" on a row.
- **All calculations** (PV of interest, YTM, Discount/Premium) run instantly in the browser and update when you change the discount rate.
- **Bond data** (issue dates, maturity dates, issue prices, coupon rates) is hardcoded from RBI circulars — it never changes.

---

## Troubleshooting

**Gold price shows "Fetch failed"**
→ Enter it manually in the "Manual Gold Override" box. The API may be rate-limited.

**LTPs show "—" for most bonds**
→ NSE sometimes blocks automated requests. Enter LTPs manually or try refreshing during market hours (9am–3:30pm IST).

**Calculations show "—"**
→ You need both a gold price AND an LTP for a bond to show calculations. Set the gold price first.

---

## Contact / Issues

This is a single-file static site + 2 serverless functions. Everything is readable and editable.
