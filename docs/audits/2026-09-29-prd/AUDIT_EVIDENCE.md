# AUDIT EVIDENCE — Buildrik

Read-only audit, 2026-09-30. File-level evidence ledger for every claim made in
MASTER_PRD, FEATURE_INVENTORY, BROKEN_AND_INCOMPLETE, REMEDIATION_BACKLOG, and
PRODUCT_ARCHITECTURE.

Format: `path:line` (range where helpful) → claim → source.

## 1. Stack & runtime

| Claim | Evidence |
|---|---|
| Next.js 16 App Router + Turbopack | root `package.json` deps, root `CLAUDE.md` Stack section |
| React 19 | root `CLAUDE.md` Stack |
| tRPC 11.14 | root `package.json` |
| NextAuth 5 (beta) | `server/auth.ts`, `server/auth.config.ts` |
| Prisma 5.22 | `prisma/schema.prisma` header |
| PostgreSQL | root `CLAUDE.md` Stack + `DATABASE_URL` env |
| Tailwind 4 | root `CLAUDE.md` Stack |
| flowbite-react 0.12.17 | `packages/dashboard/package.json` (per CLAUDE.md) |
| Zod | root `CLAUDE.md` Stack |
| Nodemailer | root `CLAUDE.md` Stack (SMTP) |
| Vite 7.2 (editor) | `packages/editor/package.json` |
| React 18.3 + TS 5.3 strict (editor) | `packages/editor/CLAUDE.md` Tech Stack |
| Vitest (editor + dashboard) | `packages/editor/CLAUDE.md` Testing |

## 2. Path aliases

| Alias | Points | Source |
|---|---|---|
| `@/*` | `packages/editor/src/*` | `packages/editor/CLAUDE.md` Path Aliases |
| `@shared/*` | `packages/editor/src/shared/*` | same |
| `@hooks/*` | `packages/editor/src/hooks/*` | same |
| `@utils/*` | `packages/editor/src/utils/*` | same |
| `@server/`, `@lib/` | root-level shared code | root `CLAUDE.md` Conventions |

## 3. Data flow invariants

| Invariant | Evidence |
|---|---|
| Page → Router → Service → Prisma | root `CLAUDE.md` "Data Flow" section |
| `../../` relative imports banned | root `CLAUDE.md` Imports line |
| No pass-through wrappers | root `CLAUDE.md` Code Quality Rules |
| Services own business logic + DB | root `CLAUDE.md` Data Flow |
| Routers call services, never Prisma directly | root `CLAUDE.md` Data Flow |
| Routers may inline endpoint Zod; 2+ consumers cross to shared | root `CLAUDE.md` Global Invariants line on shared schemas |
| Domain Zod schemas in `packages/shared/schemas/` | root `CLAUDE.md` Global Invariants |
| Lazy-init external clients | root `CLAUDE.md` Conventions env-vars line |
| One file = one job | root `CLAUDE.md` Code Quality Rules |

## 4. tRPC router inventory

Source: `server/trpc/router.ts` (75 lines, 36 routers).

| Router | Path |
|---|---|
| auth | `server/trpc/routers/auth.ts` |
| dashboard | `server/trpc/routers/dashboard.ts` |
| sites | `server/trpc/routers/sites.ts` (~740 lines) |
| siteDetail | `server/trpc/routers/site-detail.ts` |
| templates | `server/trpc/routers/templates.ts` |
| team | `server/trpc/routers/team.ts` |
| billing | `server/trpc/routers/billing.ts` |
| account | `server/trpc/routers/account.ts` |
| help | `server/trpc/routers/help.ts` |
| learn | `server/trpc/routers/learn.ts` |
| notifications | `server/trpc/routers/notifications.ts` |
| activity | `server/trpc/routers/activity.ts` |
| onboarding | `server/trpc/routers/onboarding.ts` |
| pages | `server/trpc/routers/pages.ts` |
| forms | `server/trpc/routers/forms.ts` |
| upload | `server/trpc/routers/upload.ts` |
| ai | `server/trpc/routers/ai.ts` |
| media | `server/trpc/routers/media.ts` |
| apiTokens | `server/trpc/routers/api-tokens.ts` |
| integrations | `server/trpc/routers/integrations.ts` (nested vercel) |
| actions | `server/trpc/routers/actions.ts` |
| features | `server/trpc/routers/features.ts` |
| clients | `server/trpc/routers/clients.ts` |
| reviews | `server/trpc/routers/reviews.ts` |
| handover | `server/trpc/routers/handover.ts` |
| clientReview | `server/trpc/routers/client-review.ts` |
| comments | `server/trpc/routers/comments.ts` |
| webhooks | `server/trpc/routers/webhooks.ts` |
| cms | `server/trpc/routers/cms.ts` |
| theme | `server/trpc/routers/theme.ts` |
| siteVersions | `server/trpc/routers/site-versions.ts` |
| siteComponents | `server/trpc/routers/site-components.ts` |
| userTemplates | `server/trpc/routers/user-templates.ts` |
| marketplace | `server/trpc/routers/marketplace.ts` |

## 5. Service inventory (65 services)

Source: `server/services/` directory listing (counted by hand in this audit).

By domain:
- auth + account: `auth.service.ts`, `account.service.ts`, `session.service.ts`, `token.service.ts`, `rate-limit.service.ts`, `two-factor.service.ts`
- workspace + team: `workspace.service.ts`, `team.service.ts`, `invite.service.ts`, `workspace-transfer.service.ts`
- sites + publish: `sites.service.ts`, `publish.service.ts`, `site-versions.service.ts`, `site-pages.service.ts`, `pages.service.ts`, `page-folders.service.ts`, `scheduled-publish.service.ts`
- forms: `forms.service.ts`, `form-submissions.service.ts`
- ai: `ai.service.ts` (~1392 lines)
- media + upload: `media.service.ts`, `media-folders.service.ts`, `media-versions.service.ts`, `upload.service.ts`, `favicon.service.ts`, `og-image.service.ts`, `blob.service.ts`, `pending-upload.service.ts`
- billing: `billing.service.ts`, `stripe-webhook.service.ts`
- notifications + activity: `notifications.service.ts`, `activity.service.ts`
- onboarding: `onboarding.service.ts`
- templates: `templates.service.ts`, `user-templates.service.ts`
- api tokens: `api-tokens.service.ts`
- integrations: `vercel.service.ts`, `vercel-oauth.service.ts`
- marketplace: `workspace-apps.service.ts`
- webhooks: `webhooks.service.ts`, `webhook-deliveries.service.ts`
- comments: `comment.service.ts`
- reviews: `review.service.ts`, `handover.service.ts`, `client-review.service.ts`
- cms: `cms.service.ts`
- theme: `theme.service.ts`
- collab: `collab.service.ts`
- cron: `cron.service.ts` + per-route handlers
- email: `email.service.ts`
- dashboard: `dashboard.service.ts`, `usage.service.ts`, `partner.service.ts`, `quick-actions.service.ts`

## 6. Prisma data model (53 models)

Source: `prisma/schema.prisma` (1615 lines).

User & auth:
- `User` (with `sessionVersion`, `passwordChangedAt` dead per CLAUDE.md comment lines 47-52)
- `Account`, `Session`, `VerificationToken` (NextAuth)
- `TwoFactorSecret`, `BackupCode`, `UserTwoFactorBackup` (2FA)

Workspace:
- `Workspace`, `WorkspaceMember` (status ACTIVE | PENDING), `WorkspaceTransfer`
- `WorkspaceApp` (marketplace installs), `WorkspaceWebhook`, `WebhookDelivery`, `WebhookEvent`
- `Subscription`, `Plan` (Stripe-backed)

Sites:
- `Site` (with `deletedAt` soft-delete; `cspPolicy`, `hstsMaxAge`, `xFrameOptions`, `referrerPolicy`, `permissionsPolicy`; `defaultLocale`, `enabledLocales`, `localeAutoRedirect`)
- `Page`, `PageFolder`, `PageTranslation`
- `SiteComponent` (workspace-shared component lib)
- `SiteVersion` (snapshot), `PublishBuildJob` (active + log), `ScheduledPublish`
- `SiteTemplate`, `UserTemplate`
- `CmsCollection`, `CmsEntry`, `CmsTemplate`
- `MediaFolder`, `MediaAsset`, `MediaAssetVersion`
- `PendingUpload`, `RateLimitBucket`, `ProcessedWebhookEvent`

Engagement:
- `Comment` (x/y pin + target selector + reviewer)
- `ReviewRequest`, `Reviewer`, `ReviewSnapshot`
- `Handover`
- `Referral` (partner program)

Forms:
- `FormBlock`, `FormSubmission`

User-account:
- `AccountDeletionReq`, `Notification`, `ActionConfirmation`, `CollabOperation`

Partial unique indexes preserved in migrations:
- `publish_build_jobs_active_unique`
- `publish_scheduled_jobs_pending_unique`
- `page_folders_unique_per_parent`
- `cms_collections_unique_per_site`

## 7. Dashboard route inventory (102 pages)

Source: `packages/dashboard/app/` tree.

Auth routes (27):
- `/sign-in`, `/sign-up`, `/sign-out`
- `/verify/[token]`, `/verify-email/[token]`, `/verify-magic-link/[token]`
- `/magic-link`, `/magic-link-sent`, `/magic-link/[token]`
- `/forgot-password`, `/forgot-password/sent`, `/reset-password/[token]`
- `/2fa`, `/2fa/backup`, `/2fa/setup`, `/2fa/disable`
- `/error`, `/error/verify`, `/error/auth`, `/error/social-error`
- `/verify-request`, `/verify-success`, `/check-email`

Dashboard routes (~60):
- `/dashboard` home
- `/dashboard/sites` index + `/dashboard/sites/[id]`
- `/dashboard/sites/[id]/{pages,feedback,publish,history,settings,seo,components}/`
- `/dashboard/sites/new`, `/dashboard/sites/import`
- `/dashboard/onboarding/...`
- `/dashboard/billing`, `/dashboard/billing/{plans,history,invoices}/`
- `/dashboard/notifications`
- `/dashboard/team`
- `/dashboard/templates`, `/dashboard/templates/[id]`
- `/dashboard/help`, `/dashboard/learn`
- `/dashboard/activity`
- `/dashboard/integrations`, `/dashboard/integrations/vercel`
- `/dashboard/domains`

Settings routes (14):
- `/settings/{account,ai,api-tokens,billing,danger,domains,integrations,notifications,plans,profile,security,team,usage,workspace}/`

Agency routes:
- `/agency/{clients,reviews,theme,handover,library,partner}/`

Onboarding routes (13):
- `/onboarding/{welcome,goal,style,ai,name,palette,template,preview,generating,done,skip,...}/`

External:
- `/edit/[siteId]` — unified editor (NEXT_PUBLIC_UNIFIED_EDITOR)
- `/review/[token]` — external reviewer
- `/share/[token]` — public draft share
- `/transfer/accept` — workspace transfer accept

API routes (~30):
- `/api/auth/[...nextauth]`
- `/api/asset-upload` — Vercel Blob presign
- `/api/upload/[fileId]` — favicon/og put
- `/api/cron/{...}` — 12 cron endpoints
- `/api/integrations/vercel/{callback,install}/`
- `/api/webhooks/stripe`
- `/api/collab/[siteId]/ops`
- `/api/sse/collab/[siteId]`
- `/api/sse/notifications/[userId]`

## 8. Editor inventory

Source: `packages/editor/src/` tree.

`engine/` — Composer.ts + 25 managers (no React)
`editor/` sub-domains:
- `shell/` — AquibraStudio + Topbar
- `canvas/` — Canvas + selection + drag
- `sidebar/` — Left panels + tabs
- `inspector/` — Right panel — element properties
- `panels/` — Shared panel components (layers)
- `rail/` — Left icon rail
- `media/`, `onboarding/`, `collaboration/`, `ecommerce/`, `export/`, `sync/`, `animation/`, `design-system/`, `chrome-ui/`
- `ui/` DELETED 2026-07-31 (flowbite-bigbang Task 13)

`shared/` leaf — `types/`, `constants/`, `hooks/`, `utils/`, `forms/`

`blocks/`, `templates/`, `services/`, `ai/`, `themes/`, `styles/`

Chrome UI gates:
- `chrome-ui/index.ts` — single import surface for everything flowbite-sourced
- Closed 2-wrapper set: `TextInput.tsx`, `Select.tsx`
- 47 editor-specific components + 13 pure flowbite-react re-exports

## 9. Shared schema inventory (36 schemas)

Source: `packages/shared/schemas/` directory.

```
account, activity, ai-adoption, ai, analytics-ids, auth, billing, clients,
cms, collab, comments, dashboard, designToken, element-markup,
feature-flags, forms, help, learn, marketplace, media, notifications,
onboarding, pages, publish, reviews, site-component, site-version,
site-detail, sites, team, templates, theme, upload, user-template, webhooks
```

Endpoint-input Zod inline: ~110 in routers; any 2+ consumer schema crosses
to shared.

## 10. Env vars and detection evidence

P0-1 Social OAuth dead in prod:
- root `CLAUDE.md` Auth providers table (rows on `GOOGLE_CLIENT_ID` etc.)
- root `CLAUDE.md` "This table was incomplete for months" paragraph (2026-07-14 incident)
- `scripts/check-prod-env.mjs` now requires these (post-fix)

P0-2 Real Vercel publish impossible without per-workspace OAuth:
- `server/services/vercel-oauth.service.ts` — `getActiveVercelConnection`
- `server/services/publish.service.ts` — `runPrePublishChecks`, `PUBLISH_ALLOW_SIMULATION` opt-in
- root `CLAUDE.md` Publishing section + `PUBLISH_ALLOW_SIMULATION` row

P0-3 Live Stripe price ids missing:
- root `CLAUDE.md` Stripe table
- `server/services/stripe-webhook.service.ts` — `handleCheckoutCompleted` is the only path that flips to ACTIVE

P0-4 `BLOB_READ_WRITE_TOKEN` load-bearing:
- `app/api/asset-upload/route.ts` — media library presign
- `app/api/upload/[fileId]/route.ts:70` — favicon/og `put()`
- root `CLAUDE.md` Optional table (`scripts/check-prod-env.mjs:218` `requirePresent`)

P1-1 `dashboardRouter.partner` server-side gate missing:
- `server/trpc/routers/dashboard.ts:85-94` — inline comment on the unprotected procedure

P1-2 Real-time collab kill switch:
- root `CLAUDE.md` Editor feature flags (`NEXT_PUBLIC_FEATURE_COLLAB`)
- `server/services/collab.service.ts` — `isCollabEnabled`
- `/api/collab/[siteId]/ops`, `/api/sse/collab/[siteId]` — return 404 unless flag `"true"`

P1-3 `User.passwordChangedAt` dead:
- `prisma/schema.prisma` — schema comment lines 47-52
- `grep -r "passwordChangedAt"` returned 0 matches repo-wide

P1-4 Soft-delete depends on cron:
- `app/api/cron/soft-delete-purge/route.ts`
- `Site.deletedAt` filter in all listing queries

P1-5 Publish log retention:
- `server/services/site-versions.service.ts` — per-site 20-job cap
- `app/api/cron/publish-job-cleanup/route.ts`

P1-6 Rate-limit + pending-upload pruning:
- `app/api/cron/session-cleanup/route.ts` — covers both

P2-1 Site feedback tab thin:
- `app/dashboard/sites/[id]/feedback/page.tsx`
- `server/services/comment.service.ts`

P2-2 CSP/HSTS/X-Frame-Options/Referrer-Policy:
- `Site` columns: `cspPolicy`, `hstsMaxAge`, `xFrameOptions`, `referrerPolicy`, `permissionsPolicy`

P2-3 Per-page i18n:
- `Site` columns: `defaultLocale`, `enabledLocales`, `localeAutoRedirect`
- `Page.translations` model

P2-4 Agency polish:
- `app/agency/(tabs)/{clients,reviews,theme,handover,library,partner}/`

P2-5 Form submission observability:
- `FormBlock.notifyEmail`, `FormBlock.webhookUrl`
- No `FormSubmissionDelivery` model (gap)

P2-6 CMS dynamic-page binding:
- `server/services/cms.service.ts` — `appendDynamicPagesToPublish`, `findStaleTemplateBindings`
- `CmsCollection.{pageSlugPattern, pageTemplatePath}`

P2-7 Marketplace app injection:
- `WorkspaceApp.config` validation at install

P2-8 SEO precedence:
- `Page.{seoTitle, seoDescription}` + `Site` site-level meta

P2-9 Partner referral flow:
- `Referral` model + `dashboardRouter.partner` (`server/trpc/routers/dashboard.ts:85-94`)

## 11. Test-trap evidence

| Trap | Source |
|---|---|
| Stripe unit tests hand-build payloads | root `CLAUDE.md` Stripe table — `invoiceParent()` / `subItem()` in `__tests__/stripe-webhook-service.test.ts` |
| Editor flags read twice | `packages/editor/src/shared/utils/runtimeEnv.ts:85-101` (per root `CLAUDE.md`) |
| `gate:baked-flags` | `scripts/check-baked-flags.mjs` |
| `gate:figma` | root `CLAUDE.md` (wired 2026-08-19) |
| `gate:chrome-ui-surface` | root `CLAUDE.md` (ERROR mode, locked 0) |
| `gate:vibcoder-ratchet` | root `CLAUDE.md` (locked 0) |
| `gate:editor-ui-gone` | root `CLAUDE.md` (locked 0) |
| `gate:ds-ssot` | root `CLAUDE.md` (componentDuplicates / keyframeDuplicates / tokenAliasSSOT) |

## 12. Memory evidence

| Memory | Path |
|---|---|
| buildrik-prod-deploy-reality | `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik-packages-editor/memory/buildrik-prod-deploy-reality.md` |
| code-figma-gap-audit-progress | `.../code-figma-gap-audit-progress.md` |
| flagged-features-are-planned-not-dead | `.../flagged-features-are-planned-not-dead.md` |
| worktree-locations | `.../worktree-locations.md` |
| cms-architecture-2026-09-28 | `.../cms-architecture-2026-09-28.md` |
| qa-workspace-real-vercel | `.../qa-workspace-real-vercel.md` |
| worktree-dev-server-env | `.../worktree-dev-server-env.md` |
| figma-build-traps-2026-09-21 | `.../figma-build-traps-2026-09-21.md` |
| code-gap-lanes-2026-09-22 | `.../code-gap-lanes-2026-09-22.md` |
| lane-b-studioheader-green | `.../lane-b-studioheader-green.md` |
| audit-fix-2026-09-25 | `.../audit-fix-2026-09-25.md` |
| code-gap-oct1-run | `.../code-gap-oct1-run.md` |
| code-figma-align | `.../code-figma-align` (recent commit activity per `git status`) |

## 13. Documentation drift ledger

`pnpm run audit:rules` (`scripts/audit/rules-audit.mjs` per CLAUDE.md) checks:
- backticked repo paths in all 7 AGENTS.md/CLAUDE.md files against disk
- `npm run` script names
- `gate:*` gate names

Findings are categorized:
- present-tense claim vs. actual on disk → flag
- deletion history (rotten section pointing at deleted path) → flag

## 14. Outstanding audits (separate work)

- `docs/audits/2026-09-27-module-audit/` (untracked per git status)
- `docs/audits/2026-09-21/dump/live-*.json` (Figma conformance dumps)
- `docs/audit-2026-09-25/` (untracked)
- `docs/audits/2026-09-27-prd/` (this audit, current)
- `docs/code-figma-align` (untracked)

## 15. Recent commit activity (last 5)

```
8e9a3ccb2 Merge branch 'feat/post-oct1' into integration/land-all-2026-09-27
30fc11bc7 Merge branch 'feat/code-gap-L5' into integration/land-all-2026-09-27
e9f2cd8ec Merge branch 'verify/audit-2026-09-25' into integration/land-all-2026-09-27
0e3c32ffa chore(audit): verify-login follows the worktree move, BASE_URL overridable; reseeded ids
49e7e210f Merge branch 'verify/audit-2026-09-25' into integration/land-all-2026-09-27
```

Branch pattern: `feat/code-gap-L{1..6}`, `verify/audit-2026-09-25`, `integration/land-all-2026-09-27` (landing branch), `feat/post-oct1` (post-Oct 1 features).

## 16. Verification commands

```bash
# Core gates
pnpm run verify:ds
pnpm run env:check:prod
pnpm run audit:rules

# Per-domain gates
pnpm run gate:baked-flags
pnpm run gate:ds-ssot
pnpm run gate:figma
pnpm run gate:chrome-ui-surface
pnpm run gate:vibcoder-ratchet
pnpm run gate:editor-ui-gone
pnpm run gate:tokens-generated
pnpm run gate:buildrick-baseline

# Test runs
npx vitest
pnpm run test:db
```

## 17. Acceptance

Each claim in MASTER_PRD / FEATURE_INVENTORY / BROKEN_AND_INCOMPLETE /
REMEDIATION_BACKLOG / PRODUCT_ARCHITECTURE is traceable to one or more rows
above. Where evidence is `grep -r` negative (zero matches), the command is
recorded. Where evidence is a TODO-style inline comment, the file:line is
recorded.

This audit is READ-ONLY. No application code was modified. Only
`docs/audits/2026-09-29-prd/*.md` files were created.
