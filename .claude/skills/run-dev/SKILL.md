---
name: run-dev
description: Start Buildrik's dashboard locally, sign in as the seeded QA user, and confirm a change in the running app. Use whenever a done-condition says "in the running app", or when asked to run, start, screenshot or verify the dashboard or the embedded editor.
---

# Run and verify Buildrik locally

The live app is the verifier (CLAUDE.md §Work against a stated goal). This is
the shortest path to a logged-in browser on a real project.

## 1. Preconditions — check, don't assume

```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN      # Postgres up? If not: docker compose up -d db
lsof -nP -iTCP:3000 -sTCP:LISTEN      # Something already on :3000? Reuse it or stop it
test -f .env.local && test -f packages/dashboard/.env || echo "env missing — see README.md"
pnpm exec prisma migrate status       # pending migrations = 500s on new columns
```

**In a git worktree** (factory developer / QA): `.env.local` and
`packages/dashboard/.env` are gitignored, so a fresh worktree has neither and the
dashboard fails to boot. Link them from the main checkout rather than copying
secrets: `ln -s <main-checkout>/.env.local .env.local` and the same for
`packages/dashboard/.env`; then `pnpm install --frozen-lockfile`. Only one dev
server can own :3000 at a time.

Apply pending migrations with `pnpm exec prisma migrate deploy` (never
`db:push`). If the QA user is missing, run `pnpm db:seed`.

## 2. Start the dashboard

```bash
cd packages/dashboard && pnpm dev     # :3000; first compile of a route is slow
```

Not `pnpm --filter @buildrik/dashboard dev` — the root `package.json` has the
same name, so the filter also runs `next dev` at the repo root, which dies
("Couldn't find any `pages` or `app` directory") and pnpm stops both.

Run it in the background and wait for `curl -s -o /dev/null -w '%{http_code}' localhost:3000/auth`
to return 200. Other ports break every mutation (the tRPC origin allowlist
403s them). After changing server code, if behaviour looks stale: stop the
server, `node scripts/dev-clean.mjs`, `rm -rf packages/dashboard/.next`,
start again.

## 3. Sign in

```bash
cd packages/dashboard && pnpm exec playwright test --project=setup
```

This mints a magic-link token for `qa@buildrik.local` directly in the DB and
saves the session to `packages/dashboard/e2e/.auth/user.json`. Load that file
as `storageState` in any Playwright/browser session. Do it **once** per
session: `auth.verifyMagicLink` is rate-limited to 5 tries per 15 minutes,
and the limit is stored in the DB, so restarting does not clear it.

On a fresh server the first run can report `1 failed` while the route compiles,
even though `user.json` was written and works (seen 2026-10-15; the re-run passed
in 30 s). Judge by loading `/dashboard` with the saved state: logged in, the h1
reads "Good …, QA"; logged out, you land on `/auth`.

An `/auth/error/expired-link` page after a manual callback is not proof the
login failed. StrictMode runs the callback twice; check the session cookie.

## 4. Verify

- Dashboard routes: `/dashboard`, `/dashboard/sites`, settings drill-ins.
- Editor: open a site the QA user is a member of → `/edit/<siteId>`
  (needs `NEXT_PUBLIC_UNIFIED_EDITOR=true` at build/dev time).
- Measure with `getComputedStyle` or DOM reads. Do not judge from a screenshot.
- A blank or failing result is a harness problem until shown otherwise:
  tooltips and dev overlays eat clicks, and a portal renders outside the
  subtree you scraped.

## 5. Report

State what was checked live, what was not, and stop the dev server you
started.
