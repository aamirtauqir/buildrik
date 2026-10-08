# REMEDIATION BACKLOG — Buildrik

Read-only audit, 2026-09-30. Prioritized P0 → P3 engineering backlog.
Each item: status, why, evidence, fix sketch, owner, verify condition.

Status legend (matches CLAUDE.md status palette):
🟢 good · 🟡 partial · 🔴 broken · ⚪ unknown · 🔵 planned · 🟠 in-progress · 🟣 gated · ⚫ dead · ❓ unverified

Severity is OWN classification. `P0` = money/safety/data, `P1` = trust/visibility, `P2` = polish/completeness, `P3` = cleanup.

## P0 — production-broken

### P0-1 · Social OAuth dead in prod
- **Status**: 🔴
- **Why**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` absent in prod for months (root `CLAUDE.md` Auth providers table).
- **Fix**: set vars in cPanel Passenger env, confirm `auth.providers` reads them at build, run `pnpm run env:check:prod`.
- **Verify**: sign in via Google + GitHub in prod, reach `/dashboard`. Pre-push gate (`pnpm run env:check:prod`) must refuse deploy with these missing.
- **Owner**: founder.

### P0-2 · Live Stripe price ids missing
- **Status**: 🔴
- **Why**: webhook cannot flip subscriptions to ACTIVE (root `CLAUDE.md` Stripe table).
- **Fix**: create live-mode Products + Prices in Stripe dashboard for PRO/BUSINESS × monthly/yearly; copy ids into the four `STRIPE_PRICE_*` env vars.
- **Verify**: `stripe trigger checkout.session.completed` → subscription flips to ACTIVE in prod within seconds. Real Checkout + Customer Portal flow works end-to-end.
- **Owner**: founder.

### P0-3 · Real Vercel publish requires per-workspace OAuth
- **Status**: 🔴 when no workspace connected
- **Why**: per-workspace OAuth is the deployment model (root `CLAUDE.md` Publishing section).
- **Fix**: ship in-app **Connect Vercel** flow + `runPrePublishChecks` already hard-fails without it. Verify `runSimulation` does NOT activate (`PUBLISH_ALLOW_SIMULATION` env var explicitly NOT in production).
- **Verify**: complete Connect Vercel → publish → live URL resolves within 60s. `PUBLISH_ALLOW_SIMULATION` returns 0 matches in prod env.
- **Owner**: founder + agency surface QA.

### P0-4 · `BLOB_READ_WRITE_TOKEN` load-bearing
- **Status**: 🔴 when env missing
- **Why**: media upload + favicon/og both fail (root `CLAUDE.md` Optional section).
- **Fix**: env var set in prod; `scripts/check-prod-env.mjs:218` already enforces presence + shape.
- **Verify**: upload PNG and MP4 to media library; `curl https://<site>/favicon.ico` returns 200 with the right bytes.
- **Owner**: founder.

## P1 — production-shape / hard-to-trust

### P1-1 · `dashboardRouter.partner` server-side gate missing
- **Status**: 🟡
- **Why**: `dashboard.ts:85-94` comment explicitly notes "UX, not security" — every sibling hardened with `requireAgencyLayer` since E0.
- **Fix**: add `await requireAgencyLayer(member.workspaceId)` inside the procedure (already there for siblings).
- **Verify**: hit `trpc.dashboard.partner` as a non-agency workspace member → tRPC `FORBIDDEN`. Add a unit test in `dashboard.test.ts` covering the negative case.
- **Owner**: dashboard.

### P1-2 · Real-time collab kill switch
- **Status**: 🟣
- **Why**: gated behind `NEXT_PUBLIC_FEATURE_COLLAB === "true"` (root `CLAUDE.md` Editor feature flags).
- **Fix**: ship collab UI. Drop from `check-baked-flags.mjs` `FORBIDDEN` list when ready.
- **Verify**: two browser tabs editing same site show presence avatars + remote cursors; last-write-wins merge applies.
- **Owner**: collab arc.

### P1-3 · `User.passwordChangedAt` dead column
- **Status**: ⚫
- **Why**: zero readers + zero writers (CLAUDE.md schema comment).
- **Fix**: drain — single migration to drop column; rerun scanner; update any docs.
- **Verify**: `grep -r "passwordChangedAt"` returns 0 matches.
- **Owner**: data arc.

### P1-4 · `Site.deletedAt` hard-delete depends on cron
- **Status**: 🟡
- **Why**: `cron/soft-delete-purge` is the only path; soft-deleted rows linger if cron stalls.
- **Fix**: add an alert if cron fails twice in a row (cron returns metric); confirm cron schedule (e.g. hourly).
- **Verify**: delete site → wait for cron → row absent from `Site` table.
- **Owner**: infra.

### P1-5 · Publish log retention health-gate
- **Status**: 🟡
- **Why**: per-site 20-job cap lives in service, not SQL.
- **Fix**: add a worker that asserts no site has > 25 completed jobs older than 30 days; Sentry alert if any.
- **Verify**: spike > 25 completed jobs → Sentry event fires within 1 hour.
- **Owner**: ops.

### P1-6 · Rate-limit + pending-upload pruning health-gate
- **Status**: 🟡
- **Why**: depends on `cron/session-cleanup`.
- **Fix**: same as P1-4 — alert if prune counts hit zero twice in a row.
- **Verify**: insert a `PendingUpload` row with `expiresAt < now()`, wait cron → row gone.
- **Owner**: infra.

### P1-7 · Cron health Sentry alerts
- **Status**: 🟡
- **Why**: silent degradation per root `CLAUDE.md` ("Live but load-bearing on a single cron").
- **Fix**: each `/api/cron/*` route emits a metric (rows-affected) → Sentry breadcrumb on 0-affected; Sentry event on consecutive misses.
- **Verify**: stop a cron for 2 cycles → Sentry event fires.
- **Owner**: infra.

## P2 — partial / incomplete

### P2-1 · Site feedback tab thin
- **Why**: `app/dashboard/sites/[id]/feedback/page.tsx` route exists, bridge to comments service not deeply exercised.
- **Fix**: surface all comment-thread types (page-level + element-level pinned) in the tab with filter by status.
- **Verify**: post comment from reviewer → appears in feedback tab within 1s (SSE refresh).
- **Owner**: agency surface.

### P2-2 · CSP / HSTS / X-Frame-Options / Referrer-Policy emit verification
- **Why**: Site columns exist (`cspPolicy`, `hstsMaxAge`, `xFrameOptions`, `referrerPolicy`, `permissionsPolicy`); publish-pipeline emitter status unclear.
- **Fix**: write a verifier that hits a published URL with `curl -I`, asserts each header present + sane values.
- **Verify**: published site shows `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY` (or configured value), `Referrer-Policy`.
- **Owner**: publish.

### P2-3 · Per-page i18n end-to-end verification
- **Why**: Site.locale columns + Page.translations exist; export engine emission unclear.
- **Fix**: build a site with two locales + a translated page, verify `<html lang>` flips + content swaps.
- **Verify**: published site with `defaultLocale=en`, `enabledLocales=[es, fr]` serves correct `/es/...` + `/fr/...` paths.
- **Owner**: editor + publish.

### P2-4 · Agency reviews + handover polish
- **Why**: routers exist, surfaces early-stage.
- **Fix**: walk the agency tabs Figma board, apply `gate:figma` conformance; ship copy + states.
- **Verify**: every board in agency family passes conformance; QA walks the flow with real data.
- **Owner**: agency surface.

### P2-5 · Form submission email/webhook delivery observability
- **Why**: notifyEmail + webhookUrl wired, no per-delivery UI like `WebhookDelivery` for workspace webhooks.
- **Fix**: add a `FormSubmissionDelivery` log per attempt with status + last error; surface in submissions list.
- **Verify**: trigger webhook failure → appears in submissions UI with red status + error.
- **Owner**: forms.

### P2-6 · CMS dynamic-page binding render verifier
- **Why**: `appendDynamicPagesToPublish` wired; HTML quality per entry unclear.
- **Fix**: ship a verifier rendering a sample CMS collection to a published URL; assert content present + sanitization applied.
- **Verify**: collection entry with `<script>` injected shows no script tag in published HTML.
- **Owner**: CMS.

### P2-7 · Marketplace app injection verifier
- **Why**: `WorkspaceApp.config` validated at install; injection at runtime unclear.
- **Fix**: install a marketplace app on a real workspace → publish → verify snippet present + functional.
- **Verify**: installed app's snippet runs on every page; removal cleans up.
- **Owner**: marketplace.

### P2-8 · SEO precedence (page vs site)
- **Why**: both `Page.seoTitle` + site-level meta exist; publish path precedence unclear.
- **Fix**: document in CLAUDE.md and verify `<title>` matches page-level override when set, falls back to site-level otherwise.
- **Verify**: page with `seoTitle` set → published HTML `<title>` equals it; page without → equals site-level.
- **Owner**: publish + SEO.

### P2-9 · Partner program referral flow
- **Why**: `Referral` model exists, dashboard endpoint exists, creation flow not wired per schema comment.
- **Fix**: implement signup → Referral row creation + attribution logic; partner dashboard already reads.
- **Verify**: new signup via partner link → `Referral` row created with `referredUserId` + `status`.
- **Owner**: partner arc.

## P3 — cleanup / debt

### P3-1 · `User.passwordChangedAt` drop
- See P1-3.

### P3-2 · `app/auth/error/social-error` decision
- Page exists but the OAuth flow that triggers it is broken (P0-1).
- **Fix**: either fix OAuth + keep page, or remove until OAuth ships.
- **Verify**: page reaches from a deliberate OAuth error or is gone.
- **Owner**: auth.

### P3-3 · `AccountDeletionReq.{processedAt, cancelledAt, scheduledAt}` audit
- Read by `cron/account-deletion` only; verify no consumer reads both `cancelledAt` AND `processedAt`.
- **Fix**: drop one if no consumer.
- **Verify**: `grep -r "AccountDeletionReq"` shows one and only one status flow.
- **Owner**: account.

### P3-4 · Schema doc drift audit
- **Fix**: run `pnpm run audit:rules`; fix any drift found. Quarterly cadence.
- **Verify**: scan returns 0 stale rows.
- **Owner**: founder.

### P3-5 · `pnpm run verify:ds` green
- **Fix**: keep editor + dashboard gates green; pre-push hook already enforces.
- **Verify**: `pnpm run verify:ds` exits 0.
- **Owner**: every PR.

## P0 — already locked gates (no work, just maintain)

| Gate | Status | Why |
|---|---|---|
| `gate:chrome-ui-surface` | locked at 0 | any non-`chrome-ui/` import of `flowbite-react` fails build |
| `gate:vibcoder-ratchet` | locked at 0 | deleted vibcoder/shared-ui paths cannot be re-imported |
| `gate:editor-ui-gone` | locked at 0 | `@/editor/ui` cannot be re-imported |
| `gate:tokens-generated` | generated | hand-edit fails |
| `gate:ds-ssot` | ERROR-mode locked | componentDuplicates / keyframeDuplicates / tokenAliasSSOT |
| `gate:figma` | wired to pre-push 2026-08-19 | accent drift caught |
| `gate:baked-flags` | baked-flag check | `NEXT_PUBLIC_FEATURE_COLLAB === "true"` baked fails |
| `env:check:prod` | pointed at prod | catches env drift pre-deploy |

## Priority execution order

```
P0-1, P0-2, P0-3, P0-4 → all blockers; ship together
P1-1                    → small, do next
P1-2                    → collab arc own pace
P1-3, P1-7              → cleanup + ops health, batch
P1-4, P1-5, P1-6        → cron observability, batch
P2-1..P2-9              → polish arc, batch by surface
P3-*                    → quarterly
```

## Owned by arc (memory map)

| Memory | What it covers |
|---|---|
| `flagged-features-are-planned-not-dead.md` | Publish / Collab / DS-AI = viable, not dead |
| `cms-architecture-2026-09-28.md` | CMS C0 + per-collection sources |
| `code-figma-gap-audit-progress.md` | 36 owner decisions closed (Sept 21) |
| `qa-workspace-real-vercel.md` | qa workspace has live Vercel |
| `worktree-locations.md` | lanes live in `~/Desktop/buildrik-worktrees/` since 09-26 |
| `feedback_no_stash_mid_execution` | git stash forbidden mid-exec |

## Acceptance: how this backlog closes

Each item's `Verify` line is the gate. Until the gate holds, the item is
not closed. Tests alone are not enough (CLAUDE.md goal-mode rules — live
app is verifier).

```bash
pnpm run env:check:prod        # env presence
pnpm run gate:baked-flags      # baked flags
pnpm run gate:ds-ssot          # DS SSOT
pnpm run gate:figma            # design conformance
pnpm run verify:ds             # all the gates
```
