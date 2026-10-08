# PRODUCT ARCHITECTURE — Buildrik

Read-only audit, 2026-09-30. Route / module / API / data / dependency map.

## 1. Top-level monorepo

```
buildrik/
├── packages/
│   ├── dashboard/         Next.js 16 (App Router, Turbopack) — app + components + emails
│   ├── editor/            Vite editor — chrome + engine + canvas + blocks + templates
│   └── shared/            Transport-safe contracts — API client + Zod schemas
├── server/
│   ├── auth.ts            NextAuth init
│   ├── auth.config.ts     NextAuth providers config
│   ├── trpc/
│   │   ├── trpc.ts        context + base procedures
│   │   ├── router.ts      36 routers, single export
│   │   ├── guards.ts      requireAgencyLayer, requireWorkspaceRole, assertSiteAccess
│   │   └── routers/       One file per domain
│   └── services/          65 service files, one domain each
├── lib/
│   ├── prisma.ts          Prisma singleton
│   ├── utils.ts           cn + helpers
│   └── trpc/client.tsx    tRPC client + React Query provider
├── prisma/
│   ├── schema.prisma      53 models, 1615 lines
│   └── migrations/        Hand-authored partial indexes preserved
└── scripts/               Gates + verifiers
```

## 2. Layer rules (root CLAUDE.md)

```
Page → tRPC mutation → Router → Service → Prisma / External API
```

- Pages call tRPC mutations (never services directly).
- Routers call services (never Prisma directly).
- Services own all business logic + DB access.
- Routers may define endpoint-input `z.object` inline (~110 today);
  anything used by 2+ consumers or crossing the transport boundary
  lives in `packages/shared/schemas/`.

## 3. tRPC router aggregation

`server/trpc/router.ts` aggregates 36 routers:

| Router | Domain |
|---|---|
| `auth` | NextAuth session, sign-in/sign-up, 2FA |
| `dashboard` | Stats, recent sites, activity, health, usage, partner |
| `sites` | CRUD sites + publish + scheduled publish + folders + limits |
| `siteDetail` | Per-site page/folder/component queries |
| `templates` | Site + page templates |
| `team` | Invites, members, roles |
| `billing` | Stripe Checkout + Portal + status |
| `account` | Profile, password, 2FA, sessions, deletion |
| `help` | Help center content |
| `learn` | Learn tracks + lessons |
| `notifications` | User notifications + SSE |
| `activity` | Activity feed |
| `onboarding` | Onboarding flow state |
| `pages` | Page CRUD + reorder + duplicate + translate |
| `forms` | Form blocks + submissions |
| `upload` | Presigned uploads (media + favicon/og) |
| `ai` | Content/page/layout/summarize/edit/plan/schema/stream + actionConfirmation |
| `media` | Library + folders + versions |
| `apiTokens` | Workspace API tokens |
| `integrations` | Nested `vercel` sub-router (OAuth + deploy) |
| `actions` | Workspace action audit |
| `features` | Server-side feature flag reads |
| `clients` | Agency client workspace |
| `reviews` | Agency review requests |
| `handover` | Workspace handover |
| `clientReview` | External reviewer surface |
| `comments` | Pinned comments on canvas |
| `webhooks` | Workspace webhooks + deliveries |
| `cms` | CMS collections + entries + dynamic pages |
| `theme` | Theme tokens per workspace |
| `siteVersions` | Publish-log history |
| `siteComponents` | Workspace-shared components library |
| `userTemplates` | User-saved templates |
| `marketplace` | Workspace apps install + config |

## 4. Service domain map (65 services)

Per-domain, one file each. Cross-domain imports go through services, never
back to Prisma from a router.

| Domain | Service(s) |
|---|---|
| Auth | `auth.service.ts` (NextAuth credentials, 2FA) |
| Account | `account.service.ts` (profile, password, sessions) |
| Workspace | `workspace.service.ts` (create, switch, transfer) |
| Sites | `sites.service.ts`, `publish.service.ts`, `site-versions.service.ts` |
| Pages | `pages.service.ts`, `site-pages.service.ts` |
| Folders | `page-folders.service.ts` |
| Forms | `forms.service.ts`, `form-submissions.service.ts` |
| AI | `ai.service.ts` (1392 lines — content/layout/edit/plan/schema/stream) |
| Media | `media.service.ts`, `media-folders.service.ts`, `media-versions.service.ts` |
| Upload | `upload.service.ts` (presign), `favicon.service.ts`, `og-image.service.ts` |
| Billing | `billing.service.ts`, `stripe-webhook.service.ts` |
| Notifications | `notifications.service.ts` (SSE) |
| Activity | `activity.service.ts` |
| Onboarding | `onboarding.service.ts` |
| Templates | `templates.service.ts`, `user-templates.service.ts` |
| Team | `team.service.ts`, `invite.service.ts` |
| API tokens | `api-tokens.service.ts` |
| Integrations | `vercel-oauth.service.ts`, `vercel.service.ts` |
| Marketplace | `workspace-apps.service.ts` |
| Webhooks | `webhooks.service.ts`, `webhook-deliveries.service.ts` |
| Comments | `comment.service.ts` (page-level + element-pinned) |
| Reviews | `review.service.ts`, `handover.service.ts`, `client-review.service.ts` |
| CMS | `cms.service.ts` (DOMPurify at write, scheme check at substitution) |
| Theme | `theme.service.ts` |
| Collab | `collab.service.ts` (SSE ops; flag-gated server-side) |
| Cron | `cron.service.ts`, individual cron handlers |
| Sessions | `session.service.ts`, `rate-limit.service.ts` |
| Email | `email.service.ts` (lazy SMTP init) |
| Tokens | `token.service.ts` (AES-256-GCM, NEXTAUTH_SECRET-derived) |
| Storage | `blob.service.ts`, `pending-upload.service.ts` |

## 5. Prisma data model (53 models)

Anchor model — `User`, `Workspace`, `Site`. Children:

```
User ─┬─ WorkspaceMember ── Workspace ─┬─ Site ── Page ── PageFolder
      ├─ Account (NextAuth)            │     ├─ SiteComponent (component lib)
      ├─ Session (NextAuth)            │     ├─ CmsCollection ── CmsEntry
      ├─ TwoFactorSecret               │     ├─ FormBlock / FormSubmission
      ├─ ApiToken                      │     ├─ MediaFolder / MediaAsset / MediaAssetVersion
      ├─ Notification                  │     ├─ SiteVersion / PublishBuildJob / ScheduledPublish
      ├─ Comment (with target + pin)   │     ├─ ReviewRequest / Reviewer
      ├─ WorkspaceApp                  │     ├─ Referral (partner)
      └─ AccountDeletionReq            │     ├─ WorkspaceWebhook ── WebhookDelivery
                                       │     ├─ SiteTemplate
                                       │     ├─ SiteComponent (workspace-shared)
                                       │     ├─ PendingUpload (presign)
                                       │     ├─ RateLimitBucket
                                       │     ├─ ProcessedWebhookEvent
                                       │     └─ CollabOperation
                                       └─ Subscription
```

Partial unique indexes (hand-authored SQL, must NOT migrate-auto-add):
- `publish_build_jobs_active_unique` — at-most-one non-terminal job per site
- `publish_scheduled_jobs_pending_unique` — at-most-one PENDING per site (also asserted in service)
- `page_folders_unique_per_parent` — slug unique per parent
- `cms_collections_unique_per_site` — name unique per site

## 6. Dashboard route tree (102 pages)

```
app/
├── (auth)/                      27 routes — sign-in, sign-up, 2FA, magic-link, error pages
├── auth/                        NextAuth callbacks + verify routes
├── api/                         30+ API routes
│   ├── auth/[...nextauth]/
│   ├── asset-upload/            Vercel Blob presign
│   ├── cron/                    12 cron endpoints (CRON_SECRET-gated)
│   ├── integrations/vercel/     OAuth callback + ops
│   ├── webhooks/stripe/         Stripe webhook (raw signature, 5-min replay check)
│   ├── upload/[fileId]/         favicon/og put
│   ├── collab/[siteId]/ops/     flag-gated SSE ops
│   └── sse/collab/[siteId]/     flag-gated SSE stream
├── dashboard/                   60+ dashboard routes
│   ├── (home)/page.tsx
│   ├── sites/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── pages/
│   │       ├── feedback/
│   │       ├── publish/
│   │       ├── history/
│   │       ├── settings/
│   │       ├── seo/
│   │       └── components/
│   ├── onboarding/
│   ├── billing/
│   ├── notifications/
│   └── ...
├── agency/                      Agency workspaces (clients, reviews, theme, handover, library, partner)
├── onboarding/                  13 onboarding routes
├── settings/                    account, ai, api-tokens, billing, danger, domains, integrations, notifications, plans, profile, security, team, usage, workspace
├── edit/[siteId]/               Unified editor (NEXT_PUBLIC_UNIFIED_EDITOR=true)
├── review/[token]/              External reviewer surface
├── share/[token]/               Public draft share
└── transfer/accept/             Workspace transfer accept
```

## 7. Editor package structure

```
packages/editor/src/
├── engine/                       CORE — Composer + 25 managers, no React
│   ├── Composer.ts               central orchestrator
│   ├── managers/                 elements, styles, history, selection, …
│   └── state/                    selectors + reducers
├── editor/                       UI layer
│   ├── shell/                    AquibraStudio + Topbar
│   ├── canvas/                   Canvas + selection + drag
│   ├── sidebar/                  Left panels + tabs
│   ├── inspector/                Right panel — element properties
│   ├── panels/                   Shared panel components (layers)
│   ├── rail/                     Left icon rail
│   ├── media/                    Media library feature
│   ├── onboarding/               Onboarding flow
│   ├── collaboration/            Real-time collab (flag-gated)
│   ├── ecommerce/                E-commerce features
│   ├── export/                   Export functionality
│   ├── sync/                     Sync features
│   ├── animation/                Animation components
│   ├── chrome-ui/                Single public surface (flowbite-react + tw: + --bk-*)
│   ├── design-system/            Site-builder tokens (different domain)
│   └── ui/                       DELETED 2026-07-31 (Task 13)
├── shared/                       Types, utils, hooks (leaf dependency)
│   ├── types/, constants/, hooks/, utils/, forms/
├── blocks/                       Pre-built element templates (read-only)
├── templates/                    Page templates (read-only)
├── services/                     External integrations
├── ai/                           AI utilities
├── themes/                       Generated tokens + global styles
└── styles/                       Global CSS
```

Import direction rules (strict):
- `engine/` → `shared/` ONLY
- `editor/` → `engine/`, `shared/`, `blocks/`, `templates/`
- `services/` → `shared/` ONLY
- `shared/` is a leaf — EXCEPT `shared/forms/` MAY import `@/editor/chrome-ui`
- `blocks/`, `templates/`, `themes/` → `shared/` ONLY

## 8. Editor DS contract (post-flowbite-bigbang)

| Concept | Canonical home |
|---|---|
| Chrome tokens (`--bk-*`) | `src/themes/tokens.generated.css` (generated from Figma) |
| Component library | `src/editor/chrome-ui/` + `flowbite-react` primitives |
| Tailwind class pipeline | `.flowbite-react/class-list.json` via `pnpm flowbite:classlist` |
| a11y | `src/themes/design-system/a11y.css` (only file with `@media (prefers-*)`) |
| Site-builder tokens | `src/editor/design-system/` + `themes/design-system/design.css` |

Closed wrapper set (only 2):
- `TextInput` (`chrome-ui/TextInput.tsx`) — `BK_TEXT_INPUT_THEME`
- `Select` (`chrome-ui/Select.tsx`) — `BK_SELECT_BASE_THEME`

All other primitives re-exported from `flowbite-react` via `chrome-ui/index.ts`.

## 9. Editor → dashboard integration

```
Editor opens in dashboard iframe-like embed at /edit/[siteId] when
NEXT_PUBLIC_UNIFIED_EDITOR=true (otherwise falls back to
NEXT_PUBLIC_EDITOR_URL standalone demo on :5050).

Editor chrome consumes tRPC endpoint at VITE_DASHBOARD_URL.
Cross-origin requires EDITOR_ORIGIN env.

Feature flags read twice: VITE_FEATURE_X ?? NEXT_PUBLIC_FEATURE_X
(only NEXT_PUBLIC_ reaches prod).
```

## 10. Publish flow

```
sites.publish (tRPC mutation)
  → sites service marks PublishBuildJob QUEUED
  → sites publish service runPrePublishChecks
       - Vercel connection present
       - pages > 0
       - SEO check
       - domain check
       - empty page check
  → publish worker picks up QUEUED job (cron:publish-worker)
  → either runVercelDeploy (real) OR runSimulation (dev-only opt-in)
  → PublishBuildJob COMPLETED with deploy URL
  → editor polls every 2s via sites.publish.getJob
```

`PUBLISH_ALLOW_SIMULATION` is the ONLY way to skip Vercel. Never keyed on `NODE_ENV`.

## 11. Stripe billing flow

```
billing.createCheckoutSession
  → resolve/creates Stripe customer
  → returns Checkout URL
  → user completes Checkout
  → stripe webhook → /api/webhooks/stripe
  → handleCheckoutCompleted flips Subscription to ACTIVE
  → ONLY path that activates; createCheckoutSession never does
```

Five events subscribed:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Webhook uses raw signature (5-min replay window). Field drift:
- `invoice.subscription` → `invoice.parent.subscription_details.subscription`
- `subscription.current_period_*` → `subscription.items.data[N].current_period_*`

Tests build payloads through `invoiceParent()` / `subItem()` helpers in
`__tests__/stripe-webhook-service.test.ts`.

## 12. Auth flow

NextAuth v5 (both `NEXTAUTH_SECRET` and `AUTH_SECRET` set; both `NEXTAUTH_URL` and `AUTH_URL` set). `AUTH_TRUST_HOST=true` behind cPanel proxy.

Providers: credentials (email + password + 2FA TOTP), Google, GitHub, magic link (email). Magic link uses Nodemailer SMTP (lazy-init transport).

Session version (`User.sessionVersion`): four triggers invalidate by bumping it:
1. Password reset
2. Change password
3. Revoke all other sessions
4. Member removal

NextAuth callback re-reads `sessionVersion` per request; mismatch → sign out.

## 13. Cron routes (12)

All under `/api/cron/*`, gated by `CRON_SECRET`. Each runs independently:

| Cron | Cleans | Failure mode if starved |
|---|---|---|
| `session-cleanup` | RateLimitBucket, PendingUpload, stale sessions | Rows accumulate |
| `publish-job-cleanup` | Completed publish jobs + logs | Service cap mitigates |
| `soft-delete-purge` | Soft-deleted Sites | Soft-deletes linger |
| `form-submission-purge` | Old FormSubmissions | Storage grows |
| `billing-dunning` | PAST_DUE emails | No dunning emails (Stripe Portal still does) |
| `ip-anonymization` | Analytics events | IPs retained |
| `ai-job-cleanup` | Finished AI jobs + payloads | Storage grows |
| `scheduled-publish` | ScheduledPublish PENDING | Scheduled publishes never fire |
| `workspace-transfer-expiry` | PENDING transfers | Stuck PENDING |
| `account-deletion` | AccountDeletionReq.gracePeriod ended | Account stuck in PENDING |
| `media-cleanup` | Orphaned MediaAsset rows | Storage grows |
| `publish-worker` | Picks up PublishBuildJob QUEUED | Publishes hang |

## 14. Real-time surface (SSE)

- `/api/sse/collab/[siteId]` — flag-gated, presence + ops stream
- `/api/sse/notifications/[userId]` — user notifications

`collab.service.ts` `isCollabEnabled` is the server-side kill switch
(both button and routes read this; routes return 404 when off).

## 15. Feature flag inventory

`packages/shared/schemas/feature-flags.ts` defines the canonical list.
Editor reads twice (`VITE_FEATURE_X ?? NEXT_PUBLIC_FEATURE_X`).
Dashboard inlines `NEXT_PUBLIC_FEATURE_X` at build.

| Flag | Editor behaviour | Dashboard behaviour |
|---|---|---|
| `NEXT_PUBLIC_FEATURE_PUBLISH` | Publish dropdown + flow | n/a |
| `NEXT_PUBLIC_FEATURE_DS_AI` | AI entry points in Brand panel | n/a |
| `NEXT_PUBLIC_FEATURE_COLLAB` | Presence avatars + connection pill | n/a (server kill switch) |
| `NEXT_PUBLIC_UNIFIED_EDITOR` | n/a | Enables `/edit/[siteId]` route |

`gate:baked-flags` fails the build when `NEXT_PUBLIC_FEATURE_COLLAB === "true"` is baked (deliberate friction).

## 16. ENV dependency matrix

Per root `CLAUDE.md` env-var tables. Critical for prod:
- `DATABASE_URL` (root + `packages/dashboard/.env` for Prisma CLI)
- `NEXTAUTH_SECRET` / `AUTH_SECRET`, `NEXTAUTH_URL` / `AUTH_URL`, `AUTH_TRUST_HOST`
- `NEXT_PUBLIC_APP_URL`, `EDITOR_ORIGIN`, `NEXT_PUBLIC_UNIFIED_EDITOR`
- `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, four price ids
- `BLOB_READ_WRITE_TOKEN`
- `VERCEL_INTEGRATION_ID`, `VERCEL_CLIENT_ID/SECRET`, `ENCRYPTION_KEY`
- `OPENAI_API_KEY`
- `CRON_SECRET`
- `SMTP_HOST/PORT/USER/PASS[_B64]`, `EMAIL_FROM`

`scripts/check-prod-env.mjs` enforces ALL of the above before deploy.

## 17. Gate / verifier inventory

| Gate | Catches |
|---|---|
| `env:check:prod` | Missing env vars before deploy |
| `gate:baked-flags` | Accidentally baked collab flag |
| `gate:chrome-ui-surface` | `flowbite-react` import outside `chrome-ui/` |
| `gate:vibcoder-ratchet` | Deleted vibcoder/shared-ui paths re-imported |
| `gate:editor-ui-gone` | `@/editor/ui` re-imported |
| `gate:tokens-generated` | Hand-edit of generated tokens |
| `gate:ds-ssot` | ComponentDuplicates / keyframeDuplicates / tokenAliasSSOT |
| `gate:figma` | Accent drift (`#406ED6` re-introduced) |
| `gate:buildrick-baseline` | `.buildrick-*` refs growth per panel |
| `gate:rules-audit` | CLAUDE.md / AGENTS.md drift |

Pre-push hook runs `verify:ds` (full gate suite) and refuses push on failure. `BLOCK_ON_FAIL=true` per CLAUDE.md.

## 18. Test layout

- Editor + shared + engine: Vitest + React Testing Library, `__tests__/` co-located.
- Dashboard: Vitest for services + Playwright for e2e.
- DB-backed: `__tests__/db/setup.ts` globalSetup derives `<host>/buildrik_test` from `DATABASE_URL`; refuses non-localhost.
- Stripe webhook: payloads via `invoiceParent()` / `subItem()` helpers.

## 19. Cross-package boundaries

- `packages/shared` is the only folder exported across packages.
- API client in `packages/shared/api-client/` consumes dashboard tRPC.
- Zod schemas in `packages/shared/schemas/` are the transport boundary; nothing in `packages/editor/` calls dashboard tRPC directly (calls go through `@buildrik/dashboard/api-client`).
- Editor token consumption: tRPC client reads `VITE_DASHBOARD_URL`, falls back to dashboard's own origin when bundled into Next.

## 20. Where each type lives (SSOT)

| Type | Location |
|---|---|
| Prisma types | Generated from `prisma/schema.prisma` |
| Domain Zod schemas | `packages/shared/schemas/<domain>.ts` |
| Endpoint-input Zod schemas | Inline in routers (~110 today) |
| Component types | Co-located with component file |
| Constants | `lib/constants/` (dashboard) or `packages/editor/src/shared/constants/` |
| Auth config | `server/auth.config.ts` |
| Email templates | `packages/dashboard/emails/` |
| Feature flags schema | `packages/shared/schemas/feature-flags.ts` |
| Plan limits | `lib/constants/plan-limits.ts` |

## 21. Memory integration (from MEMORY.md)

| Memory | What it tells the architecture |
|---|---|
| `cms-architecture-2026-09-28.md` | CMS C0 = data authority; PD-1 build types, PD-10 right dock, per-collection sources + Views + constants |
| `flagged-features-are-planned-not-dead.md` | Publish / Collab / DS-AI are flagged-viable (not dead); gating is intentional |
| `qa-workspace-real-vercel.md` | qa workspace has live Vercel; local publish ≠ simulation |
| `worktree-locations.md` | lanes live in `~/Desktop/buildrik-worktrees/` since 09-26 |
| `code-figma-gap-audit-progress.md` | 36 owner decisions closed (Sept 21) |
| `buildrik-prod-deploy-reality.md` | cPanel rsync MUST use `--delete`; SSH tunnel for migrations |
| `feedback_no_stash_mid_execution` | git stash forbidden mid-execution |
| `worktree-dev-server-env.md` | non-3000 dev port needs APP/AUTH URL override |

## 22. Diagram

```
            ┌──────────────────────────────────────────────────────────┐
            │                       Browser                            │
            │  ┌─────────────────────┐    ┌──────────────────────────┐ │
            │  │ Dashboard (Next 16) │    │ Editor chrome (React 18) │ │
            │  │ /dashboard, /agency │    │ /edit/[siteId] embed     │ │
            │  │ /settings, /onboard │    │ via NEXT_PUBLIC_UNIFIED_ │ │
            │  └──────────┬──────────┘    └────────────┬─────────────┘ │
            └─────────────┼───────────────────────────┼───────────────┘
                          │ tRPC over fetch           │ tRPC + SSE
                          ▼                           ▼
            ┌──────────────────────────────────────────────────────────┐
            │                  Next.js Server                          │
            │  ┌────────────┐ ┌──────────┐ ┌─────────────┐ ┌────────┐  │
            │  │  tRPC      │ │ NextAuth │ │ API routes  │ │ Cron   │  │
            │  │  router.ts │ │ v5       │ │ /api/*      │ │ /api/  │  │
            │  │  36 routers│ │          │ │             │ │ cron/* │  │
            │  └──────┬─────┘ └────┬─────┘ └──────┬──────┘ └────┬───┘  │
            │         │            │              │             │       │
            │         └────────────┴──────────────┴─────────────┘       │
            │                              ▼                            │
            │                   ┌────────────────────┐                  │
            │                   │   Services (65)    │                  │
            │                   │ domain each        │                  │
            │                   └────────┬───────────┘                  │
            │                            ▼                              │
            │                   ┌────────────────────┐                  │
            │                   │     Prisma 5       │                  │
            │                   └────────┬───────────┘                  │
            └────────────────────────────┼──────────────────────────────┘
                                         ▼
                                 ┌───────────────┐
                                 │  PostgreSQL   │
                                 └───────────────┘
```

External services (called from services):
- Stripe (Checkout + Customer Portal + Webhooks)
- Vercel (per-workspace OAuth, deployments)
- Vercel Blob (media + favicon/og)
- Cloudflare Turnstile (post-failed-login captcha)
- Sentry (errors, traces)
- OpenAI (AI drafting)
- SMTP (transactional email, lazy-init)

## 23. Acceptance

This architecture is the map. To verify it matches reality:
```bash
pnpm run audit:rules     # CLAUDE.md / AGENTS.md drift
pnpm run verify:ds       # all gates green
```

For a feature's full data flow:
```
entry-point → route → page → component → action →
tRPC mutation → router → service → prisma → response
```

Trace end-to-end before claiming a feature works (CLAUDE.md goal-mode).
