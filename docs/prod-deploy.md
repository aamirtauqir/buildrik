# Production Deploy Runbook

V1 ship target: real users on `app.buildrik.com` (dashboard) +
`editor.buildrik.com` (editor) reaching live Vercel-deployed sites.

## TL;DR — minimum to go live

1. Vercel project for `@buildrik/dashboard` deployed
2. Vercel project for `@buildrik/editor` deployed
3. Custom domains wired (`app.buildrik.com`, `editor.buildrik.com`)
4. Prod Postgres database provisioned + `prisma migrate deploy` run
5. All env vars set in Vercel UI (see table below) — values must match
   the actual production URLs or CSRF/OAuth/sign-in will all break
6. Vercel OAuth integration re-registered with prod callback URL
7. Resend domain verified for transactional email
8. Smoke test the 7-step walk against the live site

---

## Step 1 — Prod database

Provision Postgres. Recommended: Vercel Postgres, Supabase, or Neon (any
serverless Postgres works — Prisma's connection pooling is fine).

Apply migrations against prod URL:

```bash
DATABASE_URL=<prod-postgres-url> npx prisma migrate deploy --schema packages/dashboard/prisma/schema.prisma
```

Seed if needed (typically NOT for prod — seed has test accounts).

## Step 2 — Vercel projects (two of them)

### Dashboard project

```
Vercel project name: buildrik-dashboard
Root directory:      packages/dashboard
Framework:           Next.js
Install command:     pnpm install --frozen-lockfile
Build command:       pnpm build
Output directory:    .next  (default)
Node version:        20.x
```

### Editor project

```
Vercel project name: buildrik-editor
Root directory:      packages/editor
Framework:           Vite
Install command:     pnpm install --frozen-lockfile
Build command:       pnpm build
Output directory:    dist
```

Both projects need `monorepo build` mode in Vercel UI (Vercel auto-detects
pnpm workspaces from root `pnpm-workspace.yaml`).

## Step 3 — Domains

Configure in Vercel project Settings → Domains:

- `app.buildrik.com` → `buildrik-dashboard` project
- `editor.buildrik.com` → `buildrik-editor` project

DNS records (CNAME to `cname.vercel-dns.com` for each subdomain). Vercel
auto-issues SSL via Let's Encrypt.

Production canonical URLs (used in env vars below):
- Dashboard: `https://app.buildrik.com`
- Editor:    `https://editor.buildrik.com`

## Step 4 — Env vars

Set in Vercel project Settings → Environment Variables for the
**dashboard** project. Editor only needs `VITE_*` vars (see editor table
below).

### Dashboard env vars (production)

| Var | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Prod Postgres connection string |
| `NEXTAUTH_SECRET` | `openssl rand -hex 32` | DO NOT reuse dev secret |
| `AUTH_SECRET` | same as `NEXTAUTH_SECRET` | NextAuth v5 reads `AUTH_*` |
| `AUTH_URL` | `https://app.buildrik.com` | Must match canonical |
| `NEXTAUTH_URL` | `https://app.buildrik.com` | Legacy v4 path |
| `AUTH_TRUST_HOST` | `true` | Required behind Vercel proxy |
| `NEXT_PUBLIC_APP_URL` | `https://app.buildrik.com` | CSRF allowlist |
| `EDITOR_ORIGIN` | `https://editor.buildrik.com` | CSRF allowlist for editor → dashboard POSTs |
| `SESSION_GRANT_SECRET` | `openssl rand -hex 32` | New value, NOT dev |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` | AES-256-GCM for Vercel OAuth tokens at rest |
| `CRON_SECRET` | `openssl rand -hex 32` | Worker route auth |
| `RESEND_API_KEY` | Resend project API key | Transactional email |
| `EMAIL_FROM` | `noreply@buildrik.com` | Must be on verified domain |
| `GOOGLE_CLIENT_ID` | Google OAuth web client id | Separate prod credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | |
| `GITHUB_CLIENT_ID` | GitHub OAuth App id | Separate prod credentials |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | |
| `VERCEL_INTEGRATION_ID` | `buildrik` (or prod integration slug) | |
| `VERCEL_CLIENT_ID` | Vercel Integration prod client id | NEW prod registration |
| `VERCEL_CLIENT_SECRET` | Vercel Integration prod client secret | |
| `VERCEL_OAUTH_REDIRECT_URI` | `https://app.buildrik.com/api/integrations/vercel/callback` | MUST be registered in Vercel Integration console |

### Editor env vars (production)

| Var | Value | Notes |
|---|---|---|
| `VITE_DASHBOARD_URL` | `https://app.buildrik.com` | Editor → dashboard tRPC base |
| `VITE_SENTRY_DSN` | Sentry project DSN | Error tracking |
| `VITE_FEATURE_PUBLISH` | `true` | Publish UI on |
| `VITE_FEATURE_COMPONENTS_V2` | `true` if shipping | S6 Components panel |

**Critical:** `VITE_*` vars are inlined at build time, not runtime. If you
change them after deploy, you must redeploy.

## Step 5 — Vercel OAuth integration (re-register for prod)

The dev integration (`oac_c6P5jcbaugCFxaBUCG2EjeIQ`) uses
`http://localhost:3000/api/integrations/vercel/callback`. Prod needs a
fresh registration:

1. Vercel → Integrations → Integration Console → Create Integration
2. Slug: `buildrik` (or new name if `buildrik` taken)
3. Redirect URLs: `https://app.buildrik.com/api/integrations/vercel/callback`
4. Required scopes: `deployment:create`, `project:create`, `team:read`,
   etc. (same as dev — copy from existing dev integration settings)
5. Copy new `CLIENT_ID` + `CLIENT_SECRET` into Vercel dashboard env vars
6. Publish the integration (or keep private for solo use)

## Step 6 — OAuth callbacks for Google + GitHub

Both providers need prod redirect URI added:

### Google
Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client →
add `https://app.buildrik.com/api/auth/callback/google` to "Authorized
redirect URIs".

### GitHub
GitHub Developer settings → OAuth Apps → existing app → "Authorization
callback URL": `https://app.buildrik.com/api/auth/callback/github`. (If
keeping dev + prod separate, create a new GitHub OAuth App entirely.)

## Step 7 — Resend email

1. Resend dashboard → Domains → add `buildrik.com` (or send-only subdomain
   like `mail.buildrik.com`)
2. Add the SPF + DKIM + DMARC TXT records they show — wait for "Verified"
3. Set `EMAIL_FROM=noreply@buildrik.com` in dashboard env
4. Test by triggering a magic-link or 2FA flow against the live site

## Step 7.5 — Run env preflight

Catches the deploy-killing typos before Vercel does:

```bash
# Pull prod env from Vercel into a temp file
vercel env pull .env.production --environment=production

# Run the preflight
pnpm env:check --file .env.production
```

The validator checks: required vars present, secrets are not dev
placeholders (`dev-secret-change-in-prod` etc.), URLs are https://, and
the cross-var alignments that the CSRF Origin pin + NextAuth callback
URL all depend on (NEXT_PUBLIC_APP_URL ↔ AUTH_URL ↔ NEXTAUTH_URL ↔
VITE_DASHBOARD_URL ↔ VERCEL_OAUTH_REDIRECT_URI prefix).

Exits non-zero on any failure. Print includes the specific reason per
var. Source of truth for required-var list is `scripts/check-prod-env.mjs`
— keep in sync with the env table above.

## Step 8 — Pre-deploy smoke (local against prod DB)

Once env vars set in Vercel UI, before pulling the deploy trigger:

```bash
# Local dashboard pointed at prod DB (CAREFUL — this is destructive testing)
cd packages/dashboard
DATABASE_URL=<prod-postgres-url> pnpm dev
```

Then exercise the V1 walk script against `localhost:3000` (or against the
preview URL from a feature-branch deploy). DO NOT seed prod with test
accounts.

## Step 9 — Deploy

```bash
git push origin main
```

Vercel auto-deploys both projects from `main`. Watch:
- Vercel dashboard for `buildrik-dashboard` build logs (next build, prisma generate, etc.)
- Vercel dashboard for `buildrik-editor` build logs (vite build → dist/)

Both should turn green within ~3 min. If `prisma generate` fails: add
`postinstall: prisma generate --schema=packages/dashboard/prisma/schema.prisma`
to root `package.json` (or rely on Next's build step to invoke it).

## Step 9.5 — Public-surface smoke (curl)

Run before the manual walk to catch the obvious blockers:

```bash
pnpm smoke:prod --dashboard https://app.buildrik.com \
                --editor https://editor.buildrik.com
# Optional: pass a known-published site to validate ExportEngine end-to-end:
pnpm smoke:prod --dashboard ... --editor ... --site https://your-test-site.vercel.app
```

8 checks (~3 seconds total):
- Dashboard /auth + HSTS + /robots + /favicon + /api/auth/session
- Editor `/` returns 200 + has `<script src=>` bundle + references the
  dashboard host (verifies VITE_DASHBOARD_URL baked correctly at build)
- Site body has content (catches the "empty `<div></div>` deploy"
  regression that V1 Iter 19 fix-`34807811` addressed)

Exits non-zero on any fail. Run it on every deploy; cheap insurance.

## Step 10 — Post-deploy smoke (the real walk)

Open `https://app.buildrik.com` in real Chrome (NOT incognito; cookies
matter for session). Walk the 7-step V1 script:

1. Sign in (test all 4 auth paths: credentials, magic link, Google, GitHub)
2. Create blank site
3. Open in editor (lands on `editor.buildrik.com/?siteId=...`)
4. Add a Heading + Button
5. Save (topbar green)
6. Publish (Publish Directly)
7. Curl the published URL — verify body has your elements

Each path failing on prod usually traces to a misset env var. Common ones:

| Symptom | Likely env var |
|---|---|
| 403 on tRPC mutations | `NEXT_PUBLIC_APP_URL` / `EDITOR_ORIGIN` |
| Sign-in redirects to localhost | `AUTH_URL` / `NEXTAUTH_URL` |
| Magic link email never arrives | `RESEND_API_KEY` / Resend domain not verified |
| Google sign-in 400 redirect_uri | Google OAuth callback URL not whitelisted |
| Publish 401 from editor | `VITE_DASHBOARD_URL` baked wrong at build time |
| Vercel OAuth callback "not registered" | `VERCEL_OAUTH_REDIRECT_URI` not in Integration console |

## Step 11 — Monitoring

- Sentry: confirm dashboard + editor are reporting (trigger a test error)
- Vercel Analytics: enable for both projects
- Postgres: connection pool size, slow query log
- Resend: delivery dashboard for transactional email

## Rollback

If V1 publish-flow breaks on prod:
1. Vercel dashboard → Deployments → previous successful deploy → "Promote to Production"
2. Done. Prod traffic instantly routes to old build.
3. Then investigate against preview URLs without prod pressure.

DO NOT rollback Postgres migrations unless they're explicitly reversible —
data loss risk. Prefer forward-fix migrations.

## Rate limiter — swap to Upstash before scale (Sprint 7)

Default `server/services/rate-limiter.ts` uses an in-process `Map`. Each
Vercel serverless invocation may land on a cold instance with an empty
Map — so brute-force throttling across instances doesn't actually fire.
At launch traffic this won't bite; once abuse pressure shows up it will.

Drop-in template ready at `server/services/rate-limiter.upstash.ts`.
Full enablement steps are in the file header. Summary:

1. Provision Upstash Redis (free tier ~10k req/day) → grab REST URL + token
2. Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel env
3. `pnpm --filter @buildrik/dashboard add @upstash/ratelimit @upstash/redis`
4. Uncomment the body of `rate-limiter.upstash.ts`
5. Swap 2 import lines in `server/auth.config.ts` + `server/trpc/trpc.ts`
6. Rollback = revert step 5 (single-line revert per file)

Both callers already await; the sync → Promise signature swap is clean.

## Local-dev gotchas (lessons from autonomous walk attempts)

Not prod-blocking, but bite hard during dev/QA loops:

- **Next dev lockfile leak.** `kill -9` of the dev wrapper leaves
  `packages/dashboard/.next/dev/lock`. Subsequent `pnpm dev` refuses to
  start with "Another next dev server is already running". Fix:
  `pnpm dev:clean` (kills orphans, removes lockfile, frees ports).
- **Orphan webpack-loaders + postcss workers.** Survive parent-process
  death and hold file locks. Same `dev:clean` cleans them too.
- **Multi-dashboard race.** When :3000 is held by a stuck dashboard,
  next `pnpm dev` auto-falls-back to :3001. Browser at :3000 hits the
  stuck one; debugger at :3001 finds nothing matching. Always
  `pnpm dev:clean` before starting a fresh dev cycle.
- **Cold-compile time.** First request to ANY route after a fresh
  dev-server start takes 30-90s under Turbopack with Buildrik's dep
  graph. Browse-binary's 15s navigation timeout will fail; manual
  QA in real Chrome must just wait. Subsequent requests fast.

Cleanup commands:

```bash
pnpm dev:clean    # kill orphans + remove lockfile + free ports
pnpm dev:reset    # all of above + nuke .next/ + dist/ + .vite cache (slow restart)
```

## Known prod-only gotchas (lessons from dev walks)

- **CSRF Origin pin is exact-match.** Trailing slash, wrong subdomain,
  www vs apex — all 403. Match what users actually type.
- **`AUTH_TRUST_HOST=true` is required** when behind Vercel proxy or
  NextAuth refuses to mint cookies.
- **`VITE_*` vars bake at build time.** Editor redeploy needed to change.
- **`session_grant` route** is the test-only side door. Make sure it
  requires `SESSION_GRANT_SECRET` — never expose it without auth.
- **Vercel deployment protection** SSO-gates the `<project>-<hash>-<team>`
  URL but leaves `<project>.vercel.app` public. Buildrik already saves the
  canonical (post-Iter 19 fix `5d2e127d`). Custom domain bypasses this.

## V1.1 nice-to-haves (not blocking ship)

- Production CSP headers per-site (already wired via `cspPolicy` column)
- `lastPublishedBy` audit visible in editor topbar tooltip
- Image element default `src` (Iter 6 P1 — placeholder URL is jarring)
- Magic-link rate limit polish (currently per-IP, should be per-account too)
