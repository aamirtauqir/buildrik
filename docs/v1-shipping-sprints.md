# V1 Shipping Sprints — Post-Publish-Arc Roadmap

Goal: Buildrik live on `app.buildrik.com` for real users, with confidence.

Iter 19 (`/qa` skill walk on 2026-05-24) closed the publish-can't-go-live
arc: ExportEngine fresh-tree fix (`34807811`) + Vercel canonical URL fix
(`5d2e127d`) verified end-to-end against real Vercel deploy. Code-side
publish is done.

This doc is the path from "code green on main" to "real users on prod" —
broken into 8 sprints with explicit gates, time estimates, and risk
notes per sprint.

## TL;DR

| # | Sprint | Owner | ETA | Blocks |
|---|---|---|---|---|
| 1 | Real-Chrome walk + auth coverage | user | ~2 hr | unfreeze |
| 2 | Test infra rescue (vitest setup) | me | 0.5 day | regression safety |
| 3 | Untested editor surfaces walk | user + me | 1 day | confidence |
| 4 | Production env + domain wire | user | 2-3 hr | go-live |
| 5 | Prod smoke + monitoring | user + me | 2-3 hr | launch ack |
| 6 | P1 fix backlog | me | 2-3 days | v1.1 polish |
| 7 | Pre-launch hardening | me | 1-2 days | scale safety |
| 8+ | V1.1 features | TBD | open | growth |

Total to launch: ~4-5 days of focused work + your walk time.

## Audit findings (this session, beyond V1 publish arc)

Catalogued during Iter 19's deeper scan after publish fixes shipped.
Severity tags use V1_WALK_AND_FIX.md triage rules.

### P0 (would-block-prod, not yet hit)

- **In-memory rate limiter on Vercel serverless** — `server/services/rate-limiter.ts`
  uses `Map`. On serverless, each invocation may land on a cold instance
  with empty Map. Effectively no rate limiting in prod. Brute-force
  attacks against `auth.login` / `auth.checkEmail` / `auth.resendVerification`
  not throttled. Fix: swap to Upstash Redis or `@vercel/kv`. (Sprint 7)

### P1 (works but not safe / not verified)

- **Test infra broken** — root `vitest.config.ts` missing
  `setupFiles: ["packages/editor/src/test-setup.ts"]`. 253 / 2499 tests
  fail with `Invalid Chai property: toBeInTheDocument` / `toHaveAttribute`
  / `toHaveClass`. `@testing-library/jest-dom` never registered. ~10% of
  suite. **Hides any real product regressions in those test files.**
  1-line config fix. (Sprint 2)
- **Old published sites still serve SSO-gated URLs** — `sites.publishedUrl`
  rows from before `5d2e127d` (e.g., `test-site-iter5`, `My New Site`)
  still point to `<project>-<hash>-<team>.vercel.app`. Users with sites
  published before the fix won't benefit until they republish. Fix
  options: SQL backfill (regex risky) or auto-republish on next site
  open (intrusive) or do-nothing (Topbar "Not saved" indicator nudges
  republish naturally). (Sprint 7, decide)
- **18 malformed style rules dropped on editor init** — console warning
  on every blank-site mount. Likely stale starter/template data failing
  validation in `StyleEngine.importStyles`. Doesn't break UI. (Sprint 6)

### P2 (deferred, not blocking)

- 10 TODO/FIXME comments in source (mostly minor: AI suggest button
  placeholder, soft-delete-with-undo unimplemented, window.prompt → modal
  follow-ups)
- `claude-in-chrome` extension UI bleeds into browse snapshots (test-tool
  noise, not product)
- gstack snoozed at 1.17 — 1.44 available

### Untested surfaces (need real Chrome walk to confirm)

- **Auth paths:** magic link, 2FA enrollment + login, Google OAuth,
  GitHub OAuth, forgot-password (Iter 18 P0 fix `5380cb7e` covers them
  server-side but no one walked the UI)
- **Publish flows:** Submit for Review, Unpublish, Cancel mid-publish,
  Republish-after-failure
- **Editor tabs:** AI, Templates browse + apply, Components catalog,
  Layers reorder, Pages CRUD (Iter 8 stale), Tokens / DS editing,
  Settings (SEO, custom code, publishing), History (version timeline +
  restore), Preview window
- **Mobile breakpoint:** Topbar has Desktop/Tablet/Mobile toggle —
  never walked at non-Desktop. Note: this is canvas viewport switch,
  not editor chrome responsiveness — editor itself is desktop-only per
  DESIGN.md
- **Background:** 15 cron routes (DNS verify every 5 min, daily
  cleanups, weekly token rotation, etc.) — never invoked in walk. Cron
  config IS wired (`vercel.json` `crons` array, verified). Just untested
  end-to-end.

### Infra-positive confirmations (good — already shipped)

- ✓ Sentry wired (edge / server / client configs in dashboard)
- ✓ Type check green (`tsc --noEmit` EXIT=0)
- ✓ Dashboard prod build green (`pnpm build` EXIT=0)
- ✓ Pre-push DS gates green (32 gates pass — editor 25 + dashboard 7)
- ✓ Vercel cron config exists (`vercel.json` has 15 schedules)
- ✓ CRON_SECRET enforced on all worker routes
- ✓ Plan limits enforced server-side (PLAN_LIMITS in dashboard / page /
  domain / template / billing services)

---

## Sprint 1 — Real-Chrome walk + auth coverage

**Owner:** user (manual walk required)
**ETA:** ~2 hours
**Gate criteria:** all 7 walk steps + 4 auth paths green in real Chrome
**Blocks:** tech-debt freeze lift (per CLAUDE.md V1 freeze policy)

### Scope

1. Walk V1_WALK_AND_FIX.md 7-step script in your daily Chrome (NOT
   headless, NOT incognito — cookies + extensions matter):
   - Login `qa@buildrik.local` / `walktest123`
   - Create blank site
   - Open in editor
   - Add Section + Heading + Image + Button
   - Save
   - Publish Directly
   - Curl the published URL — body has elements
   - Close + reopen — canvas hydrates correctly

2. Walk each of the 4 non-credentials auth paths once:
   - Magic link — request email, click link, land authed
   - 2FA — if account has 2FA enrolled, walk login-then-OTP
   - Google OAuth — fresh sign-in via Google account
   - GitHub OAuth — fresh sign-in via GitHub account

3. For each path, screenshot any P0/P1 you hit. Don't try to fix yet.

### Exit

If green: log Iter 20 entry in V1_WALK_AND_FIX.md, lift tech-debt
freeze, proceed to Sprint 2.

If broke: hand the screenshots back. Iter 20 = fix loop. Stay in V1
scope.

### Risk

claude-in-chrome extension may still bleed UI into your manual walk
(Iter 1 caveat unchanged). Disable extension before walking to avoid
confusing yourself with overlays.

---

## Sprint 2 — Test infra rescue

**Owner:** me (post-unfreeze)
**ETA:** half-day (depends on whether matchers-loading surfaces real
test bugs underneath)
**Gate criteria:** 0 failing tests in `npx vitest run` from repo root
**Blocks:** regression safety net for all subsequent work

### Scope

1. Add `setupFiles: ["packages/editor/src/test-setup.ts"]` to root
   `vitest.config.ts`
2. Run full suite — expect 253 failures → 0
3. If real test bugs surface (hidden behind matcher errors), fix them
   one-by-one with atomic commits
4. Optionally tighten pre-push hook to fail on test failures (currently
   only DS gates fail-blocking)

### Risk

Some of the 253 "failures" may turn out to be real product bugs the
matcher error was masking. Triage as found. Time estimate could double
if 10+ real bugs surface.

---

## Sprint 3 — Untested editor surfaces walk

**Owner:** user (manual walk) + me (fix loop)
**ETA:** ~1 day
**Gate criteria:** each tab walked + observations logged
**Blocks:** launch confidence

### Scope

Walk one tab per session. Each walk produces a Sprint-3 sub-entry in
V1_WALK_AND_FIX.md (or a new V1_SURFACES.md if it grows large):

- **AI tab** — open, send a prompt, observe streaming, check error
  states (no key configured, rate limit, malformed response)
- **Templates** — open templates panel, apply template to blank page,
  verify elements land, verify undo works
- **Components catalog** (S6 V2) — open Components tab, drag a
  component to canvas, verify schema-driven placement, verify
  AI-add-component flow if available
- **Layers** — reorder, nested drag, multi-select drag
- **Pages CRUD** — create / rename / delete page with confirm dialog,
  verify slug history + redirect on rename
- **Tokens (DS)** — edit a color token, verify cascade, verify
  binding-chip in inspector, verify export
- **Settings** — change SEO, custom code (free vs Pro gate), publishing
  password, save + reload
- **History** — make 3 edits, open version timeline, restore an older
  version, verify canvas matches
- **Preview** — open preview window, verify it renders the same as
  canvas, verify viewport switch (Desktop / Tablet / Mobile)

### Exit

Each walk: PASS = log + move on. FAIL = atomic commit fix + re-walk.

### Risk

Some surfaces have known issues (per memory):
- Image element needs-asset auto-picker missing (Iter 6 P1)
- Right-click context menu not opening from browse-binary (Iter 13 P1-4
  — but maybe works in real Chrome)
- Element tab text input missing for headings (Iter 10 P1-2 retracted
  as false-positive)
Confirm one way or the other via real Chrome.

---

## Sprint 4 — Production env + domain wire

**Owner:** user (Vercel + DNS + OAuth provider UIs)
**ETA:** 2-3 hours
**Gate criteria:** `docs/prod-deploy.md` steps 1-7 done
**Blocks:** go-live trigger

### Scope

Execute `docs/prod-deploy.md` step-by-step:

1. Provision prod Postgres + `prisma migrate deploy`
2. Create two Vercel projects (`buildrik-dashboard`, `buildrik-editor`)
3. Wire custom domains (`app.buildrik.com`, `editor.buildrik.com`) + DNS
4. Set all dashboard env vars from the table in the runbook
5. Set editor `VITE_*` env vars
6. Re-register Vercel OAuth integration with prod callback URL
7. Add prod Google + GitHub OAuth callback URLs
8. Verify Resend domain in Resend dashboard

### Risk

Most common pitfall: env var typos, especially the URLs (trailing slash
matters for CSRF Origin pin). `docs/prod-deploy.md` has a symptom →
env-var lookup table to debug.

Vercel Integration prod registration is a one-time setup — don't
accidentally publish the integration to the public marketplace if you
want it solo-use.

---

## Sprint 5 — Prod smoke + monitoring

**Owner:** user (walk) + me (Sentry / Vercel Analytics setup)
**ETA:** 2-3 hours
**Gate criteria:** walk green on real prod URLs + Sentry receives events
**Blocks:** launch announcement

### Scope

1. `git push origin main` — triggers Vercel auto-deploy of both
   projects
2. Watch Vercel build logs — both projects must turn green within ~3 min
3. Walk V1 7-step against `https://app.buildrik.com` in real Chrome
4. Walk all 4 auth paths against the live URLs
5. Trigger a deliberate error → confirm it lands in Sentry
6. Open Vercel Analytics → verify request data flowing
7. Smoke test 1-2 background crons by invoking `/api/cron/<name>` with
   `Authorization: Bearer $CRON_SECRET`

### Exit

If green: launch. If broke: rollback via Vercel Deployments → Promote
Previous → debug against preview URLs.

### Risk

First-deploy gotchas are usually env-var-related. The runbook's lookup
table covers the common ones.

---

## Sprint 6 — P1 fix backlog

**Owner:** me
**ETA:** 2-3 days
**Gate criteria:** each P1 closed with atomic commit + regression test
**Blocks:** v1.1 polish, not launch

### Scope

Drain the deferred-but-known-broken list:

1. **Image element default `src`** — when user adds Image without
   picking an asset, currently ships with `via.placeholder.com` URL.
   Should open Media tab auto-picker per `useBlockInsertion.ts:121-127`'s
   `element:needs-asset` event. Wire that event into the Media tab open.
2. **Right-click context menu confirm** — Iter 13 P1-4 says menu may
   work in real Chrome but didn't via browse. Sprint 3 walk will tell
   us — if broken, fix.
3. **18 malformed style rules** — root cause `StyleEngine.importStyles`
   rejection. Likely stale starter/template data. Fix the source rules
   AND make the importer more forgiving (warn-but-load instead of drop).
4. **10 source TODOs** — drain or convert to tracked issues
5. **gstack upgrade** 1.17 → 1.44

---

## Sprint 7 — Pre-launch hardening

**Owner:** me
**ETA:** 1-2 days
**Gate criteria:** prod-grade rate limiting + cron observability + backfill done
**Blocks:** scale safety (won't block initial users but will bite at >10 req/min)

### Scope

1. **Rate limiter prod-safe** — swap `server/services/rate-limiter.ts`
   from in-memory `Map` to Upstash Redis (`@upstash/ratelimit`) or
   `@vercel/kv`. Server-side touch — no UI change. Add `UPSTASH_*` env
   vars to runbook.
2. **Cron observability** — current cron routes return 200 OK on
   success but have no metrics. Add a `cron_runs` table or Sentry
   breadcrumb per run so we can verify "DNS verify ran in last hour"
   without reading logs.
3. **Backfill old publish URLs** — decide: do nothing (let users
   republish), or SQL backfill via regex (`UPDATE sites SET publishedUrl
   = regexp_replace(...)`), or auto-republish on next site open. Memory
   `project_v1_walk_iter19_20260524.md` should capture the decision.
4. **Rollback drill** — actually do a fake rollback on Vercel to make
   sure the runbook's step works under stress.

---

## Sprint 8+ — V1.1 features

User picks scope. Candidates (open backlog):

- Templates marketplace polish
- AI tab streaming UX (per-token, not full-response)
- Multi-page publish edge cases (drafts vs published per-page)
- Collaboration cursors (CollaborationManager already shipped per memory)
- Image upload to Vercel Blob (already shipped per Phase B memory —
  re-verify in real Chrome)
- DS export presets
- Analytics + funnels dashboard

Sprint 8 starts only after Sprints 1-5 green. Sprint 6-7 can run in
parallel with Sprint 8 if you parallelize humans.

---

## Risk matrix

| Risk | Severity | Mitigation | Sprint |
|---|---|---|---|
| Auth path X breaks in real Chrome | High | Real-Chrome walk before launch | 1 |
| Prod env var typo → 403/500 cascade | High | Runbook's symptom table | 4-5 |
| Rate limiter useless on serverless | Med | Upstash swap | 7 |
| 253 test failures hide real bugs | Med | Setup fix + suite re-run | 2 |
| OAuth callback URL drift between dev/prod | Med | Re-register prod integration explicitly | 4 |
| First-user publish hits canonical URL race | Low | `pickPublicUrl` fallback to projectName | shipped Iter 19 |
| Sentry quota hit on first error storm | Low | Sentry rate-limit + sampling | 5 |
| Vercel cron not firing | Low | `vercel.json` validated; cron smoke in Sprint 5 | 5 |

## Dependencies graph

```
Sprint 1 (walk)──gate──┐
                       ├─→ Sprint 2 (tests) ──┐
                       │                       ├─→ Sprint 6 (P1 backlog)
                       └─→ Sprint 3 (surfaces)─┤
                                                └─→ Sprint 7 (hardening)
Sprint 4 (env)──┐
                ├─→ Sprint 5 (prod smoke) ──→ Sprint 8 (V1.1)
                │     (depends on Sprint 4 + freeze lifted)
                └────────────────────────────┘
```

Sprint 4 can run in parallel with Sprint 1-3. Sprint 5 needs both 1 (walk
green) and 4 (env done). Sprints 6-7 are post-launch, parallel to Sprint
8 if desired.

## Memory entries to write at sprint exits

Per V1 protocol "Memory entries allowed (record what happened)":

- Sprint 1 close: `project_v1_real_chrome_walk_<date>.md` — what worked,
  what didn't, freeze-lift confirmation
- Sprint 4 close: `project_v1_prod_env_wired_<date>.md` — env table
  snapshot, OAuth callback URLs registered
- Sprint 5 close: `project_v1_launched_<date>.md` — go-live timestamp,
  first-user health, monitoring URLs
- Sprint 7 close: `feedback_serverless_rate_limit_pattern.md` —
  in-memory rate limiter bug class for future projects

## What changes after Sprint 5 launch

- Tech-debt freeze fully lifted (Sprint 1 lifts it for development,
  Sprint 5 confirms it production-side)
- V1.1 backlog opens
- Codex review cadence on PRs resumes
- Memory MEMORY.md trimmed below 200-line cap (current: 201 — at limit)

---

Last updated: 2026-05-24 (Iter 19 close).
Next update: after Sprint 1 completes — append walk result + revise Sprint 2 scope if test bugs surface.
