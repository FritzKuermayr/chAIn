# Deployment guide — Vercel

chAIn is now a single Next.js app with Route Handlers. One repo → one Vercel
project. No separate backend, no Docker, no Fly.io.

End-to-end: ~10 minutes.

---

## 0 · Prerequisites

You need:

- A GitHub account (the repo is at https://github.com/FritzKuermayr/chAIn)
- A Vercel account — sign up at https://vercel.com with the same GitHub
- Your two API keys:
  - `OPENAI_API_KEY` — primary model path
  - `TINKER_API_KEY` — secondary path (Kimi K2.6 via Tinker)

Optional, for local dev:

- Node 20 (`brew install node@20`)

---

## 1 · Local sanity check (optional but recommended)

```bash
git clone https://github.com/FritzKuermayr/chAIn.git
cd chAIn/apps/web

cp .env.example .env.local
# open .env.local and paste both keys

npm install
npm run dev
```

Open http://localhost:3000.

- `/` shows the two-tile landing
- `/gateway` should classify a pasted message and produce a rewrite
- `/network` shows 8 seed posts
- `/api/health` returns `{ openai_configured: true, tinker_configured: true }`

If that all works, deployment will work.

---

## 2 · Push the repo to GitHub *(skip if already pushed)*

The repo lives at https://github.com/FritzKuermayr/chAIn — if your local
clone is already pushed, jump to step 3.

```bash
# from the repo root
git status                       # confirm .env.local is NOT staged (gitignore handles it)
git push origin main
```

> **Never commit `.env.local`** — it's in `.gitignore`. Confirm with
> `git ls-files | grep env` (should be empty).

---

## 3 · Import the project into Vercel (browser, ~3 minutes)

1. Go to https://vercel.com/new
2. **Add GitHub Account** if not already linked → grant access to
   `FritzKuermayr/chAIn`
3. Click **Import** next to `FritzKuermayr/chAIn`
4. **Configure Project** screen:
   - **Project Name:** `chain` (or whatever)
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** click **Edit** → choose **`apps/web`**
     (this is the only non-default — Vercel needs to know the Next.js
     project lives in a subfolder)
   - **Build & Output Settings:** leave defaults (Vercel reads them from
     `apps/web/package.json`)
5. **Environment Variables** — paste these four (you can add the optional
   ones too if you want non-defaults):

   | Name | Value |
   |---|---|
   | `OPENAI_API_KEY` | *your sk-proj-… key* |
   | `OPENAI_MODEL` | `gpt-4o-mini` *(optional, this is the default)* |
   | `TINKER_API_KEY` | *your tml-… key* |
   | `TINKER_MODEL` | `moonshotai/Kimi-K2-Instruct` *(optional)* |

   Tick **Production**, **Preview** and **Development** for each.

6. Click **Deploy**. Wait ~90 seconds for the first build.
7. Vercel shows the production URL — typically `https://chain-<hash>.vercel.app`.

---

## 3b · Same thing via the Vercel CLI *(if you prefer terminal)*

```bash
npm i -g vercel
cd apps/web
vercel link               # answer: project name "chain", scope = your account
vercel env add OPENAI_API_KEY     production preview development
vercel env add OPENAI_MODEL       production preview development   # → gpt-4o-mini
vercel env add TINKER_API_KEY     production preview development
vercel env add TINKER_MODEL       production preview development   # → moonshotai/Kimi-K2-Instruct
vercel --prod
```

Either path produces the same project.

---

## 4 · Verify the live deploy

```bash
# 1. Provider config visible from health
curl https://<your-deploy>.vercel.app/api/health
# expect: {"ok":true,"openai_configured":true,"tinker_configured":true,...}

# 2. Seed posts loaded
curl -s https://<your-deploy>.vercel.app/api/posts | jq 'length'   # → 8

# 3. OpenAI path classifying live
curl -s -X POST https://<your-deploy>.vercel.app/api/classify \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hi Mr Schneider, IBAN DE89 3704 0044 0532 0130 00.","model":"openai"}'

# 4. UI
open https://<your-deploy>.vercel.app/gateway
open https://<your-deploy>.vercel.app/network
```

If `/api/health` returns 200 and `openai_configured: true`, you're done.

---

## 5 · Custom domain (optional)

In the Vercel dashboard:

1. Project → **Settings** → **Domains** → **Add**
2. Enter `chain.your-domain.com`
3. Vercel prints DNS records — paste them at your registrar
4. Wait for DNS propagation (usually <2 min)

No env-var changes needed; everything is same-origin.

---

## 6 · Updating the deploy

Every push to `main` triggers a production deploy automatically. Pushes to
other branches create preview deploys.

```bash
git commit -am "feat: tweak rewrite prompt"
git push
# watch the build in the Vercel dashboard
```

---

## 7 · Rotating keys

```bash
# CLI
vercel env rm OPENAI_API_KEY production
vercel env add OPENAI_API_KEY production
vercel --prod                  # redeploy to pick it up
```

Or use the dashboard: Project → Settings → Environment Variables → edit /
delete → Redeploy.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `/api/health` shows `openai_configured: false` | Env var not set in this environment (Production vs Preview vs Development). Add it for all three. |
| Build fails: "Cannot find module 'next'" | Vercel Root Directory not set to `apps/web`. Project → Settings → General → Root Directory. |
| Classify returns `[]` for everything | Both providers misconfigured — falls back to regex which only catches obvious patterns. Check `/api/health`. |
| 404 on `/api/extract` for a PDF | `pdf-parse` lazy-load failed in the serverless runtime. Check the function log in Vercel; usually a node version mismatch. |
| Posts disappear after a while | Expected. Store is in-memory and resets on cold start. Wire Vercel KV if you need persistence. |
