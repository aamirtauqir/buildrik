# BROKEN AND INCOMPLETE — Buildrik

Read-only audit, 2026-09-30. Findings organized by severity. Evidence uses
`file:line` and `path`.

## 1. Production-broken (P0)

### 1.1 Social OAuth (Google + GitHub) silently dead in prod
- **Status**: 🔴 broken in production. Dev works.
- **Why**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`,
  `GITHUB_CLIENT_SECRET` were absent from production for months. NextAuth
  still redirects to the provider with `client_id=undefined`, the provider
  shows an error page.
- **Evidence**: root `CLAUDE.md` env-var table (lines on Auth providers); the
  same table previously did NOT list these vars until it was amended after the
  `2026-07-14` incident.
- **Detection**: `scripts/check-prod-env.mjs` already required them at the
  deploy step but nobody pointed it at production; now wired.
- **Owner**: founder/deploy.

### 1.2 Real Vercel publish impossible without per-workspace OAuth connection
- **Status**: 🔴 in production when no workspace has completed the Vercel
  OAuth handshake.
- **Why**: Sites deploy into the workspace's own Vercel account via OAuth
  (`vercel-oauth.service.ts`). Without `getActiveVercelConnection(workspaceId)`,
  `runVercelDeploy` throws `VERCEL_NOT_CONNECTED` and the publish dies after
  the job has been queued.
- **Mitigation**: `PUBLISH_ALLOW_SIMULATION=true` falls through to `runSimulation`
  — explicit opt-in, **never** keyed on `NODE_ENV` per the `PUBLISH_ALLOW_SIMULATION`
  row in root `CLAUDE.md`.
- **Evidence**: `server/services/publish.service.ts` (publishApprovalBlock /
  prePublishChecks), `server/trpc/routers/integrations.ts`.

### 1.3 Live Stripe price ids missing
- **Status**: 🔴 production.
- **Why**: `STRIPE_PRICE_PRO_MONTHLY`/`PRO_YEARLY`/`BUSINESS_MONTHLY`/`BUSINESS_YEARLY`
  are required for the webhook to flip a subscription to ACTIVE. Live-mode
  Products/Prices have not been created in the Stripe dashboard; only test-mode
  ids exist in `.env.local`.
- **Evidence**: root `CLAUDE.md` Stripe table.
- **Owner**: founder.

### 1.4 Media upload + favicon/og load-bearing on `BLOB_READ_WRITE_TOKEN`
- **Status**: 🔴 when env missing in prod.
- **Why**: `app/api/asset-upload/route.ts` (presign client mint) and
  `app/api/upload/[fileId]/route.ts:70` (favicon/og `put()`) both fail
  cleanly with "Blob upload failed" when the token is absent.
- **Mitigation now present**: `scripts/check-prod-env.mjs:218` `requirePresent`s
  it (with a `vercel_blob_rw_` shape warning) so the missing token is caught
  before deploy — per root `CLAUDE.md` history.
- **Evidence**: same.

## 2. Production-shape / hard-to-trust (P1)

### 2.1 `dashboardRouter.partner` only gated client-side
- **Status**: 🟡 functional but unprotected server-side.
- **Why**: Every sibling (clients, reviews, theme, handover) was hardened with
  `requireAgencyLayer` at the procedure level since E0. `dashboard.partner` is
  not — only the dashboard route guard calls it. Per inline comment
  `dashboard.ts:86-94`, the original client-side redirect was deliberately
  flagged "UX, not security".
- **Evidence**: `server/trpc/routers/dashboard.ts:85-94`.
- **Fix**: Add `requireAgencyLayer` inside the procedure (mirror siblings).

### 2.2 Real-time collab is server-side flag-gated off by default
- **Status**: 🟣 gated off in prod.
- **Why**: `NEXT_PUBLIC_FEATURE_COLLAB` must equal `"true"` for
  `/api/collab/:siteId/ops` and `/api/sse/collab/:siteId` to be reachable
  (`collab.service.ts` `isCollabEnabled`). The flag is also baked at build time
  on the server via Next's inline — routes + button agree.
- **Evidence**: root `CLAUDE.md` (Editor feature flags); memory
  `flagged-features-are-planned-not-dead.md`.
- **Risk** if set `"true"` without intent: `gate:baked-flags` fails the build
  (deliberate friction).

### 2.3 `User.passwordChangedAt` column has zero readers and zero writers
- **Status**: ⚫ dead schema.
- **Why**: Confirmed by CLAUDE.md schema comment for `User.sessionVersion`
  (lines 47-52). All four session-revocation triggers (password reset,
  change password, revoke-all-other-sessions, member removal) update
  `sessionVersion` instead. `passwordChangedAt` is purely vestigial.
- **Mitigation path**: Drain in a single migration; rerun any scanner to
  confirm zero references.

### 2.4 `Site.deletedAt` soft-delete relies on `cron/soft-delete-purge`
- **Status**: 🟡 partial.
- **Why**: Listing queries already filter `deletedAt: null` but hard-deletes
  happen ONLY when `cron/soft-delete-purge` runs. If the cron is starved,
  soft-deleted rows linger forever.
- **Evidence**: API routes `/api/cron/soft-delete-purge`.
- **Risk**: Low — bounded retention is enforced inside the cron. But this
  is load-bearing for GDPR-style deletion flows.

### 2.5 Publish log retention per-service, not global
- **Status**: 🟡 partial.
- **Why**: `PublishBuildJob.log` is retained on COMPLETED (P1) so a prior
  version can be re-deployed, pruned to 20 most-recent per site.
- **Risk**: Service-layer cap means an outage that doesn't run the cleanup
  job retains more than expected. Health-gate could be added.

### 2.6 Rate-limit + pending-upload pruning depend on `cron/session-cleanup`
- **Status**: 🟡 partial.
- **Why**: `RateLimitBucket` + `PendingUpload` rows are pruned by the same
  cron; if it stalls, expired rows persist (low blast radius, but the
  indexes accumulate).
- **Evidence**: schema annotations on both models.

## 3. Partial / incomplete (P2)

### 3.1 `app/dashboard/sites/[id]/feedback/page.tsx` is thin
- **Status**: 🟡 route exists; behavior not deeply exercised in the current
  build.
- **Why**: Comments exist server-side (`comment.service.ts`, `Comment` model
  with x/y pin + target selector + reviewer pinning). The site-level feedback
  view in the dashboard is a thinner bridge compared to the reviewer surface.

### 3.2 `Site.permissionsPolicy` / CSP / HSTS / X-Frame-Options / Referrer-Policy are configured but emit status uncertain
- **Status**: 🟡 partial.
- **Why**: Columns exist on `Site` (`cspPolicy`, `hstsMaxAge`, `xFrameOptions`,
  `referrerPolicy`, `permissionsPolicy`). The publish pipeline reading them
  is the gap — would need a verifier pass to confirm what's actually emitted
  on the published HTML.

### 3.3 `Site.{defaultLocale,enabledLocales,localeAutoRedirect}` configured but per-page i18n end-to-end unclear
- **Status**: 🟡 partial.
- **Why**: Schema supports per-site locale, settings S2 (Clone 3397:32376)
  added a first-visit auto-redirect. Page-level translations (`Page.translations`)
  exist but the actual export engine emission is what to verify.

### 3.4 Agency reviews + handover flows lighter on UX polish
- **Status**: 🟡 partial.
- **Why**: `reviewsRouter` and `handoverRouter` exist; the `agency/(tabs)`
  surfaces are functional but read as earlier-stage vs. settings/dashboard
  surfaces.

### 3.5 Form-submission email/webhook delivery observability is light
- **Status**: 🟡 partial.
- **Why**: `FormBlock.notifyEmail` and `webhookUrl` are wired, but there is
  no per-delivery UI like `WebhookDelivery` provides for workspace webhooks.

### 3.6 CMS dynamic-page binding (pageSlugPattern + pageTemplatePath) partially wired
- **Status**: 🟡 partial.
- **Why**: `cms.service.ts` exports `appendDynamicPagesToPublish` and
  `findStaleTemplateBindings`, called from `publish.service.ts`. The pattern
  is in place; what needs verification is the actual rendered HTML quality
  per entry.

### 3.7 Marketplace app → published site injection end-to-end
- **Status**: 🟡 partial.
- **Why**: `WorkspaceApp.config` validated per appId at install; what runs on
  the published page (config snippet injection) is what to verify.

### 3.8 Per-page SEO columns (`seoTitle`, `seoDescription`) plus site-level meta coexist
- **Status**: 🟡 partial.
- **Why**: Schema permits both. The publish path choosing which wins is the
  unresolved question.

### 3.9 Partner program referral flows
- **Status**: 🟡 partial.
- **Why**: `Referral` model + indexes; partner dashboard endpoint exists; the
  referral-tracking flow that creates rows is described as "not yet wired"
  per the schema comment.

## 4. Mock / stub / scaffolding (P3)

| Surface | Status | Notes |
|---|---|---|
| None confirmed | — | Search for `TODO`/`FIXME`/`XXX`/`HACK` in routers + services returned only inside `__tests__` and harmless XXXX placeholders (`app/auth/2fa/backup/page.tsx` placeholder, `app/dashboard/sites/[id]/layout.tsx` server-renderer TODOS, `app/onboarding/ai/preview/page.tsx` track TODOS). No blocking mock paths. |

## 5. Dead / unused (cleanup candidates)

| Item | Why | Action |
|---|---|---|
| `User.passwordChangedAt` | Zero readers + zero writers (CLAUDE.md schema comment `prisma/schema.prisma:47-52`) | Migration: drop column |
| `app/auth/error/social-error` and similar error pages | Lives but trigger is post-OAuth, which is broken | Decide: drop until OAuth fixed, or leave as user-visible failure surface |
| `AccountDeletionReq.processedAt` vs `cancelledAt` vs `scheduledAt` | Read by `cron/account-deletion` only; verify nothing reads both `cancelledAt` AND `processedAt` | Audit-only |

## 6. Risks that are not bugs

- `CmsCollection` write boundary uses DOMPurify at write time + scheme check at
  substitution sink. URL-bearing fields are scheme-checked at render time.
  Both layers defended-in-depth; not a defect.
- `ReviewRequest.snapshotPages` is frozen at submit, NOT the live draft. This
  is intentional per E7 contract; clients see the version they were sent.
- `PublishBuildJob` partial unique index (`publish_build_jobs_active_unique`)
  is hand-authored SQL; the `@@unique([siteId])` analogue would conflict.
  Don't auto-add via schema migration.
- `ScheduledPublish` partial unique rule (at-most-one PENDING per site) lives
  in the service, not SQL.

## 7. Live but load-bearing on a single cron

If any of these crons stop firing, the system degrades silently rather than
alerting:
- `cron/soft-delete-purge` — soft-deleted sites accumulate.
- `cron/session-cleanup` — `RateLimitBucket` + `PendingUpload` + stale sessions
  accumulate.
- `cron/publish-job-cleanup` — completed publish jobs + logs accumulate
  (per-site 20-job cap mitigated by service).
- `cron/form-submission-purge` — form submissions accumulate.
- `cron/billing-dunning` — dunning emails would not go out (but Stripe
  Customer Portal dunning still does).
- `cron/ip-anonymization` — analytics events retain IP.
- `cron/ai-job-cleanup` — finished AI jobs + their payload accumulate.
- `cron/scheduled-publish` — scheduled publishes would never fire.
- `cron/workspace-transfer-expiry` — `PENDING` transfers stay PENDING forever.

These are operational concerns, not feature defects. Each cron route is
`/api/cron/*`, gated by `CRON_SECRET`.

## 8. Test-trap notes (from CLAUDE.md)

| Test class | Trap |
|---|---|
| Stripe webhook | Unit tests hand-build payloads — use `invoiceParent()` / `subItem()` helpers in `__tests__/stripe-webhook-service.test.ts` (per root `CLAUDE.md` Stripe table). Re-verify against a real `stripe listen` delivery before trusting green. |
| `feature-flags` | Editor flags read twice (`VITE_FEATURE_X ?? NEXT_PUBLIC_FEATURE_X`). Only `NEXT_PUBLIC_` reaches production. |
| `gate:baked-flags` | Fails bundle with `NEXT_PUBLIC_FEATURE_COLLAB === "true"` baked. |
| `gate:figma` | Wired to pre-push hook 2026-08-19 — accent drift now caught. |
| `gate:chrome-ui-surface` | Locked at 0 — any non-`chrome-ui/` import of `flowbite-react` fails. |
| `gate:vibcoder-ratchet` | Locked at 0 — deleted vibcoder/shared-ui paths cannot be re-imported. |
| `gate:editor-ui-gone` | Locked at 0 — `@/editor/ui` cannot be re-imported. |

## 9. Quick verification commands

```bash
# Production env presence (uses LIVE cPanel env)
pnpm run env:check:prod

# Baked-flag check
pnpm run gate:baked-flags

# DS SSOT gate
pnpm run gate:ds-ssot

# Figma conformance
pnpm run gate:figma

# Build the editor + dashboard
pnpm run verify:ds
```
