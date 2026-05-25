# cPanel Deploy — buildrick.io (LiteSpeed)

Steps to deploy dashboard (Next.js) + editor (Vite) to your LiteSpeed
cPanel host. Pair with `docs/prod-deploy.md` env table for the variable
values.

## Build artifacts ready

Local-built. Re-build via `pnpm build` in each package after any code change.

| Artifact | Path | Size | What |
|---|---|---|---|
| Editor SPA | `/tmp/editor-build.zip` | 862 KB | Vite static → unzip to web root |
| Dashboard standalone | `/tmp/dashboard-standalone.zip` | 60 MB | Next.js portable Node app |

## Subdomain layout (recommended)

| Subdomain | Hosts | Stack |
|---|---|---|
| `app.buildrick.io` | Dashboard | Next.js (Node.js app) |
| `editor.buildrick.io` | Editor | Static Vite SPA |

> If you keep editor at `app.buildrick.io` (current state), the
> dashboard needs a different subdomain like `dashboard.buildrick.io`
> or `api.buildrick.io`. Pick one, then **rebuild the editor with
> `VITE_DASHBOARD_URL` pointing at that subdomain.**

## Pre-deploy — DB + Resend

### 1. Postgres database

LiteSpeed cPanel usually = MySQL. Dashboard requires **Postgres**. Cheapest path:

- **Neon free tier** (https://neon.tech) — 0.5GB DB, no card. Good for solo + small team.
- **Supabase free tier** — 500MB.
- Note the connection string: `postgresql://USER:PASS@HOST/DBNAME?sslmode=require`

Apply migrations from your local machine pointing at prod DB:

```bash
cd /Users/shahg/Desktop/pencil/buildrik
DATABASE_URL='postgresql://...prod-url...' \
  npx prisma migrate deploy \
    --schema packages/dashboard/prisma/schema.prisma
```

### 2. Resend (transactional email)

- Sign up at resend.com (free 100 emails/day)
- Add a sender domain or use Resend's default
- Grab API key → `RESEND_API_KEY`

### 3. Generate secrets locally

```bash
openssl rand -hex 32   # → NEXTAUTH_SECRET (use for AUTH_SECRET too)
openssl rand -hex 32   # → SESSION_GRANT_SECRET
openssl rand -hex 32   # → ENCRYPTION_KEY
openssl rand -hex 32   # → CRON_SECRET
```

## Step A — Editor (static, 5 min)

Editor zip is at `/tmp/editor-build.zip` (already built with
`VITE_DASHBOARD_URL=https://app.buildrick.io` baked in — see "rebuild
editor" below if dashboard goes to a different subdomain).

1. cPanel → File Manager
2. Navigate to web root for editor subdomain. Examples:
   - `public_html/editor.buildrick.io/`
   - or `public_html/editor/`
3. Delete existing contents (current 2026-04-28 build)
4. Upload `/tmp/editor-build.zip`
5. Right-click → Extract → contents become `dist/...`
6. Move `dist/*` to subdomain web root (or unzip and cut paste)
7. Visit `https://editor.buildrick.io/` → editor should mount

If you need to rebuild editor with a different `VITE_DASHBOARD_URL`:

```bash
cd packages/editor
VITE_DASHBOARD_URL='https://dashboard.buildrick.io' \
VITE_FEATURE_PUBLISH=false \
VITE_FEATURE_COMPONENTS_V2=true \
  pnpm build
# new build at packages/editor/dist/
zip -r /tmp/editor-build.zip dist/
```

`VITE_FEATURE_PUBLISH=false` recommended for first deploy — publish flow
needs Vercel OAuth integration which adds setup time. Turn on later.

## Step B — Dashboard (Node.js app, 30-60 min)

### B.1 Create Node.js App in cPanel

1. cPanel → "Setup Node.js App" (look under SOFTWARE section)
2. Click "Create Application"
3. Fill:
   - **Node.js version:** 22 (or highest available; minimum 20)
   - **Application mode:** Production
   - **Application root:** e.g. `apps/dashboard` (relative to home)
   - **Application URL:** `app.buildrick.io` (subdomain you assign)
   - **Application startup file:** `packages/dashboard/server.js`
4. Click "Create"

cPanel will create a virtualenv-style isolated Node install.

### B.2 Upload standalone bundle

Two paths:

**Via File Manager (slower, click-driven):**
1. cPanel → File Manager → navigate to Application root (`apps/dashboard/`)
2. Upload `/tmp/dashboard-standalone.zip`
3. Right-click → Extract → produces `standalone/` directory
4. Move contents of `standalone/*` up one level so `packages/`,
   `node_modules/` sit directly in `apps/dashboard/`
5. Delete the now-empty `standalone/` and zip file

**Via SSH (faster if you have terminal access):**
```bash
ssh user@buildrick.io
mkdir -p ~/apps/dashboard
cd ~/apps/dashboard
# Upload zip first via scp from your local machine:
#   scp /tmp/dashboard-standalone.zip user@buildrick.io:~/apps/dashboard/
unzip dashboard-standalone.zip
mv standalone/* .
rmdir standalone
rm dashboard-standalone.zip
```

### B.3 Set environment variables

cPanel Node app UI has an "Environment Variables" section. Add each one:

| Var | Value |
|---|---|
| `DATABASE_URL` | (from Neon/Supabase, must be `postgresql://...?sslmode=require`) |
| `NEXTAUTH_SECRET` | (from `openssl rand -hex 32`) |
| `AUTH_SECRET` | same as NEXTAUTH_SECRET |
| `AUTH_URL` | `https://app.buildrick.io` |
| `NEXTAUTH_URL` | `https://app.buildrick.io` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_URL` | `https://app.buildrick.io` |
| `EDITOR_ORIGIN` | `https://editor.buildrick.io` (where editor lives) |
| `SESSION_GRANT_SECRET` | (random 32 bytes) |
| `ENCRYPTION_KEY` | (random 32 bytes) |
| `CRON_SECRET` | (random 32 bytes) |
| `RESEND_API_KEY` | (from Resend dashboard) |
| `EMAIL_FROM` | `noreply@buildrick.io` (or your verified Resend sender) |
| `NODE_ENV` | `production` |
| `PORT` | (whatever cPanel assigns — often automatic) |

> OAuth (Google/GitHub/Vercel) defer to v2. Skip those env vars for
> first deploy.

### B.4 Generate Prisma client on host

The standalone bundle includes `@prisma/client` but the engine binary
must match the host OS. SSH into host:

```bash
cd ~/apps/dashboard/packages/dashboard
# Make sure DATABASE_URL is set in env
npx prisma generate
```

If cPanel doesn't expose SSH, you can pre-generate locally with
`PRISMA_GENERATE_DATAPROXY=true` for Edge runtime, but native is better.

### B.5 Start the app

In cPanel Node.js App UI:
1. Click "Run NPM Install" (idempotent — confirms deps land)
2. Click "Restart" (or first start)
3. Tail logs via cPanel's "Logs" or `~/logs/passenger.log`

### B.6 Verify

```bash
# From your local machine
curl -I https://app.buildrick.io/auth
# → expect 200 (auth page)

curl -I https://app.buildrick.io/api/auth/session
# → expect 200 (empty session)

curl -I https://app.buildrick.io/api/trpc/auth.checkEmail
# → 405 Method Not Allowed (GET on POST-only route) is OK
```

## Step C — Cron jobs (15 routes)

cPanel → Cron Jobs. Add each one (schedules in `vercel.json`):

```bash
# 5-min interval
*/5 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/dns-verify

# Daily
0 2 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/ssl-check
# ... (15 total — full list in /Users/shahg/Desktop/pencil/buildrik/vercel.json)
```

Use the SAME `$CRON_SECRET` value from the env vars.

## Step D — Smoke test

```bash
cd /Users/shahg/Desktop/pencil/buildrik
pnpm smoke:prod \
  --dashboard https://app.buildrick.io \
  --editor    https://editor.buildrick.io
```

8 checks. Each fails surfaces what to fix.

## Common failures

| Symptom | Cause |
|---|---|
| 502/503 from app.buildrick.io | Node app not started; check cPanel Logs |
| 403 on tRPC POSTs | `NEXT_PUBLIC_APP_URL` doesn't match subdomain exactly |
| 500 on `/api/auth/session` | `DATABASE_URL` wrong or migrations not run |
| Magic link doesn't arrive | Resend API key bad or domain not verified |
| Editor at app.buildrick.io still showing OLD version | Browser cache — hard reload or curl directly |
| Prisma engine mismatch | Run `npx prisma generate` on host |

## What's NOT in this deploy (defer)

- Google + GitHub OAuth callback registration
- Vercel OAuth Integration for publish flow (`VITE_FEATURE_PUBLISH=true`)
- Custom OAuth providers
- Upstash rate-limiter swap (Sprint 7 — currently in-memory, OK at launch traffic)
- DKIM / SPF for Resend custom domain (Resend default sender works for testing)

Add each later as you scale past team-walk traffic.
