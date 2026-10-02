# cPanel Deploy — buildrick.io (LiteSpeed) — SINGLE-SUBDOMAIN

Steps to deploy Buildrik (dashboard + editor mounted inside) to your
LiteSpeed cPanel host on a single subdomain. Pair with `docs/prod-deploy.md`
env table for the variable values.

## Architecture — one URL, one Node app

```
https://app.buildrick.io/              → dashboard home + auth + site list
https://app.buildrick.io/auth          → login
https://app.buildrick.io/dashboard     → site list (after login)
https://app.buildrick.io/edit/[siteId] → editor (unified — same React tree)
https://app.buildrick.io/api/...       → tRPC + auth + workers
```

Editor is transpiled into the dashboard bundle via Next.js's
`transpilePackages: ["@buildrik/editor"]`. The `/edit/[siteId]` route
imports `AquibraStudio` from `@buildrik/editor` workspace and renders
it inline (client-side, dynamic import). Same-origin = no cross-origin
CSRF issues, single set of env vars, single deploy unit.

Enabled via `NEXT_PUBLIC_UNIFIED_EDITOR=true` runtime env.

## Build artifact ready

Local-built. Re-run `pnpm build` in `packages/dashboard` after any code change.

| Artifact | Path | Size | What |
|---|---|---|---|
| Dashboard standalone (+ editor) | `/tmp/dashboard-standalone.zip` | 60 MB | Single Next.js portable Node app, contains everything |

No separate editor zip — editor module is bundled into the dashboard
build via Next.js workspace transpilation.

## Ordered deploy — audit-fix release (fix/audit-2026-09-25)

This release carries schema changes, a data backfill and a code swap that
must happen in this order. Skipping or reordering a step loses data or
500s the site. Run from a checkout of the release commit, from the repo root.

1. **Check the live env.** `pnpm run env:check:prod`. It pulls the live cPanel
   env. Fix any new failure before going further. The six Stripe live-mode
   rows have always failed.
2. **Snapshot the DB and open an editors-quiet window.** Take a `pg_dump` of
   the production database over the SSH tunnel (step 3), and keep it. From
   here until the code swap in step 5, **nobody edits or publishes**. There
   are two reasons:
   - `20261003100000_form_block_site_scoped_identity` is not atomic with a
     concurrent publish on the OLD code. The old worker still upserts
     `form_blocks` by `id = blockId`. A publish that lands while the migration
     merges duplicates and builds the `(siteId, blockId)` unique index can
     re-insert a duplicate, which fails the index build, or write to a row
     the merge then drops.
   - `reid-duplicate-elements.mjs` (step 4) writes pages and styles without
     the `lastEditedAt` CAS. An editor tab open during `--apply` can save its
     pre-backfill copy over the result without a conflict.
3. **Apply migrations: `prisma migrate deploy`.** The production host has no
   node, and its `DATABASE_URL` is `localhost:5432` on the server. Open a
   tunnel with `ssh -f -N -L 127.0.0.1:15432:127.0.0.1:5432 vortyoyz`. Both
   sides need the explicit `127.0.0.1:`, or you get P1001. Read the URL from
   `~/.cl.selector/node-selector.json` (`["apps/dashboard"]["env_vars"]["DATABASE_URL"]`)
   and rewrite its port to 15432. Then run:
   `DATABASE_URL=<tunnelled url> npx prisma migrate status --schema prisma/schema.prisma`,
   then `… npx prisma migrate deploy --schema prisma/schema.prisma`.
   - This branch adds five migrations, applied in this order:
     1. `20261001100000_notification_site_id`
     2. `20261001120000_form_block_after_submit`
     3. `20261002100000_site_version_updated_at`
     4. `20261003100000_form_block_site_scoped_identity` (merges duplicate form rows, then adds the unique index)
     5. `20261003110000_site_project_cms_bindings`
   - **Earlier `main` migrations may still be pending in production.** For
     example, the `20260909020000` / `20260909021000` pair was recorded as
     unapplied when the Blob store went live. Others are the
     `20260914*` settings pair and the three `20260924*` migrations.
     `migrate status` lists them. `migrate deploy` applies every pending one
     in timestamp order, so they go in the same run. Read the list before
     you confirm.
   - **The new code 500s against a database that lacks `20261001120000` and
     later.** Its Prisma client selects `FormBlock.successAction`,
     `SiteVersion.updatedAt`, `Site.projectCmsBindings` and the other new
     columns. Never deploy code before this step has succeeded.
4. **Backfill duplicate element ids: `scripts/audit/reid-duplicate-elements.mjs`.**
   This needs migration `20261003100000` already applied, because the
   script's idempotency check reads the `(siteId, blockId)` key. Run it
   through the same tunnel:
   - Dry run first:
     `DATABASE_URL=<tunnelled url> npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/audit/reid-duplicate-elements.mjs --i-know-this-is-production`.
     The tunnel URL is `127.0.0.1`, so the script's localhost guard cannot
     tell production from a local database. The flag is only a statement of
     intent, so check the URL yourself. Read the per-site counts. Every site should be a plausible count of
     renamed ids, form-row copies and style-rule copies. A site logged
     `FAILED` stops the release. Record the "already collapsed" pages. No
     rewrite restores those; they need a restore from a version.
   - Then add `--apply` to the same command. It runs one transaction per
     site and exits non-zero if any site failed. Re-running the dry run
     should find nothing, because the script is idempotent.
   - **Why this must run before the code swap:** the new editor re-ids
     colliding elements on load and saves the new ids. A form element that
     gets re-id'd that way has no `form_blocks` row under its new id. Its
     notify email, webhook, redirect, success message and spam setting then
     read as defaults, and the next publish writes those defaults. The
     backfill copies each row to the new id first.
5. **Deploy the code.** Build on the Mac:
   `npx prisma generate --schema prisma/schema.prisma` (`next build` does
   not run it, and the client is bundled into the standalone output), then
   `pnpm build` in `packages/dashboard`. Every `NEXT_PUBLIC_*` value must be
   in the environment at build time, via `.env.production.local`. Setting
   one on the server afterwards does nothing.
   - Copy `.next/static` into `.next/standalone/packages/dashboard/.next/static`
     and `public` into `.next/standalone/packages/dashboard/public`. Next
     omits both.
   - Run `rsync -az --delete --exclude stderr.log --exclude tmp/ .next/standalone/ vortyoyz:~/apps/dashboard/`
     and then `ssh vortyoyz touch ~/apps/dashboard/tmp/restart.txt`. The
     `--delete` is load-bearing: stale `node_modules` leftovers 500'd every
     route for 12 days in September. Confirm that the served `/auth` HTML
     carries the new `.next/BUILD_ID`, then run
     `pnpm run smoke:prod -- --dashboard https://app.buildrick.io --editor https://app.buildrick.io`
     (6/8 is healthy).
   - The editors-quiet window ends here.
6. **Sanitizer dry run on a local copy: `scripts/audit/sanitize-dry-run.mjs`.**
   Restore the step-2 snapshot into a local database. The script refuses any
   non-localhost `DATABASE_URL`, but the step-3 tunnel is `127.0.0.1` too,
   so make sure the URL names the restored copy and not the tunnel. Then
   run `DATABASE_URL=postgresql://localhost/<restored db> npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/audit/sanitize-dry-run.mjs`.
   A legitimate tag listed under `tag` means the allowlist in
   `packages/shared/schemas/element-markup.ts` needs extending. The stored
   content is sanitized on its next save or publish, so extend the allowlist
   and ship that before users re-save. Judge `review-url-attr` rows by hand.

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

## Step A — Remove old editor static (5 min)

The current static editor at `app.buildrick.io` (last updated 2026-04-28)
gets REPLACED by the unified-deploy. Move it out of the way:

1. cPanel → File Manager
2. Navigate to web root for `app.buildrick.io` (usually `public_html/`)
3. Rename existing contents to `_old/` (or backup zip)
4. Web root will be empty — ready for Node app

## Step B — Dashboard (Node.js app — includes editor inline, 30-60 min)

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
| `EDITOR_ORIGIN` | `https://app.buildrick.io` (same — unified-editor on same subdomain) |
| `NEXT_PUBLIC_UNIFIED_EDITOR` | `true` (enables /edit/[siteId] unified mode) |
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

## Step C — Cron jobs (19 routes)

`vercel.json` at the repo root is the source of truth for the schedule
column — this list is generated from it (C-2). `$CRON_SECRET` is a shell
variable, not something cron sources from the app's env — cPanel's crontab
does not run through a login shell, so it must be **defined at the top of
the crontab itself** (standard `VAR=value` crontab syntax applies to every
line below it) with the SAME value as the app's `CRON_SECRET` env var.

**cPanel's Cron Jobs UI cannot do this.** That form has one field per entry
(minute/hour/day/month/weekday/command) — there is no way to add a bare
`CRON_SECRET=<value>` line ahead of the entries, and pasting one into the
Command field just runs it as its own (failing) command. Two ways to get
the line in:

1. **Edit the raw crontab over SSH/terminal** — `crontab -e` opens the same
   file the UI edits, but as a plain text file, where a bare `VAR=value`
   line on its own row is valid. Add the `CRON_SECRET=` line first, then
   the 19 entries below it (still fine to review/re-add the individual
   lines through the cPanel UI afterwards — it renders whatever's in the
   file, it just can't add that first line itself).
2. **No SSH access** — inline the secret in each cron entry's Command field
   instead of relying on the shared variable, e.g. `curl -fsS -H
   "Authorization: Bearer <the actual value>" https://...`. Every one of
   the 19 entries needs the value substituted individually this way; there
   is no shared-variable shortcut through the UI alone.

The commands below use `$CRON_SECRET` assuming route 1 (`crontab -e`):

```bash
CRON_SECRET=<the same value as the app's CRON_SECRET env var>

*/5  * * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/scheduled-publish
0    2 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/ssl-check
0    8 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/billing-dunning
0    9 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/billing-downgrade
0    3 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/session-cleanup
0    4 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/invite-expiry
0    5 * * 0   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/token-cleanup
0    6 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/soft-delete-purge
0    1 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/analytics-purge
0    8 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/analytics-aggregate
*/5  * * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/dns-verify
0    2 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/form-submission-purge
30   2 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/ip-anonymization
0    4 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/workspace-transfer-expiry
0    11 * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/account-deletion
0    10 * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/workspace-deletion
30   * * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/publish-job-cleanup
15   * * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/ai-job-cleanup
0    3 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://app.buildrick.io/api/cron/ephemeral-purge
```

**Before enabling these on a live account**, read them backlog-first, not
trigger-first — `account-deletion`, `workspace-deletion`,
`billing-downgrade`, `soft-delete-purge` and `form-submission-purge` will
process whatever has built up since launch the first time they run. Inspect
the backlog read-only before wiring the crontab: e.g. `SELECT count(*) FROM
account_deletion_reqs WHERE "scheduledAt" <= now()`, and for
`workspace-deletion` `SELECT count(*) FROM workspaces WHERE
"deletionScheduledAt" <= now();` (and the equivalent selection query each
route's own where-clause uses) over the SSH tunnel, for each of those five. `scheduled-publish` is safe to schedule but
currently pointless — `schedulePublish` refuses every call with
`NO_RENDERER` until a server-side renderer exists (A-16), so the cron will
find nothing due.

## Step D — Smoke test

```bash
cd /Users/shahg/Desktop/pencil/buildrik
pnpm smoke:prod \
  --dashboard https://app.buildrick.io \
  --editor    https://app.buildrick.io
```

(dashboard + editor on same URL since unified mode)

8 checks. Each fails surfaces what to fix.

## Reverse-proxy IP header (S-11 — confirm before relying on rate limits)

Every place the app reads the caller's IP (rate-limit keys, session records,
new-device alerts) goes through one helper now: `clientIp()` in
`lib/request-ip.ts`. Its body reads the **leftmost** entry of
`x-forwarded-for`, falling back to `x-real-ip`.

That is deliberately provisional. Behind cPanel/LiteSpeed the app sits behind
a proxy, and "leftmost" is only correct if the proxy hop is trusted to have
either (a) set `x-forwarded-for` itself with the real client IP as the only
or first entry, or (b) appended to an existing header rather than trusting
whatever the client sent. If a client can reach the proxy directly and set
its own `x-forwarded-for: 1.2.3.4` before the proxy appends its own hop, the
**leftmost** entry is attacker-controlled and every per-IP limit in this app
keys on a spoofed value — trivially bypassable.

**Before depending on IP-based limiting in production**, a founder/ops step
outside this repo:

1. Confirm what LiteSpeed actually forwards. From the cPanel host:
   ```bash
   curl -s -H "X-Forwarded-For: 9.9.9.9" https://app.buildrick.io/api/public/track/<test-site-id> -o /dev/null -D -
   ```
   then check the app's own logs (or a temporary debug log in
   `clientIp()`) for what header value the Node process actually saw —
   does LiteSpeed pass the spoofed value through unchanged, append its own
   hop, or overwrite it? Also check whether LiteSpeed sets its own trusted
   header (commonly `X-Real-IP` from the actual upstream connection).
2. If the proxy **appends** (trusted last hop = the real client), switch
   `clientIp()`'s body to read the **rightmost** entry instead of leftmost.
   If LiteSpeed sets its own `X-Real-IP` from the raw TCP connection
   (untouched by client headers), prefer that header over `x-forwarded-for`
   entirely.
3. Change only `lib/request-ip.ts` — every caller (rate limiter keys,
   session `ip` column, device-alert emails) picks up the fix at once,
   which is the point of having one helper instead of seven copies.

A wrong hop count is not a safe default to guess at: a rightmost-hop helper
keys every user on the proxy's own IP if the hop count is off by one, and
would rate-limit-block everyone behind that IP together. That is why the
helper ships leftmost (safe-but-spoofable) rather than a guessed rightmost
(unsafe-if-wrong) until this is confirmed against the real LiteSpeed config.

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
