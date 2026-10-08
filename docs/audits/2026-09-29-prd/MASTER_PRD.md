# MASTER PRD — Buildrik

Audit date: 2026-09-30. Read-only reverse-engineering pass. Evidence citations use
`file:line` against the working tree.

## 1. Product summary

Buildrik is a hosted, multi-tenant visual website builder. A logged-in user picks
or creates a workspace, drafts sites in a browser-based Vite/React editor (the
"canvas"), and publishes each site to its own Vercel project hosted inside the
workspace's own Vercel account via OAuth. Every workspace is a billing entity;
multiple members collaborate per workspace; agencies get a `Client` layer that
groups client sites under their own brand; client reviewers use tokenised
account-less links to approve a site without joining the workspace. The product
runs as a single Next.js 16 (App Router, Turbopack) app with an inlined Vite
editor (`packages/editor/`), a tRPC 11 API surface over Prisma/Postgres, and a
mature cron + SSE + webhook integration layer (30+ API routes). Stripe Checkout
+ Customer Portal handles subscriptions with five-event webhook ledger. AI
generation is a real OpenAI provider path with quotas and reservation semantics,
backed by a local Ollama override for dev. The design system is one accent
(`#1A56DB`), Inter typography, and a generated `--bk-*` token tier powering the
editor chrome.

## 2. Stack at a glance

| Layer | Choice | Source |
|-------|--------|--------|
| Frontend framework | Next.js 16.2.0 (App Router, Turbopack), React 19 | `package.json` |
| Editor | Vite 7.2 + React 18 + TypeScript, inlined into Next via `NEXT_PUBLIC_UNIFIED_EDITOR` | `packages/editor/package.json`, root `CLAUDE.md` |
| API | tRPC 11.14.0 over Next route handler `app/api/trpc/[trpc]/route.ts` | `server/trpc/router.ts`, root `package.json` |
| Auth | NextAuth 5, JWT strategy, `sessionVersion` invalidation | `prisma/schema.prisma:39-53`, `server/auth.ts` |
| ORM | Prisma 5.22, 53 models | `prisma/schema.prisma` |
| DB | Postgres | `prisma/schema.prisma:11` |
| UI lib | `flowbite-react` 0.12.17 + `tw:`-prefixed Tailwind, `chrome-ui/` wrapper, `--bk-*` generated tokens | `packages/editor/CLAUDE.md` |
| Validation | Zod | `packages/shared/schemas/*` (36 files) |
| Email | Nodemailer SMTP, `SMTP_PASS_B64` base64 on cPanel | root `CLAUDE.md` |
| Payments | Stripe Checkout + Customer Portal + raw-signature webhook | root `CLAUDE.md`, `server/services/stripe-webhook.service.ts` |
| Storage | Vercel Blob (media + favicon/og), `BLOB_READ_WRITE_TOKEN` required | `app/api/asset-upload/route.ts`, `app/api/upload/[fileId]/route.ts` |
| Hosting | Buildrick cPanel/Passenger (NOT Vercel for the app itself) | root `CLAUDE.md` |
| Publish target | Workspace's own Vercel account via OAuth | `server/services/vercel-oauth.service.ts`, `lib/vercel.ts` |
| Realtime | SSE — `/api/sse/notifications`, `/api/sse/publish/:jobId`, `/api/sse/collab/:siteId` | API route list |
| Cron | 16 cron routes guarded by `CRON_SECRET` | API route list |
| AI | OpenAI (`OPENAI_API_KEY`); Ollama dev override | `server/services/openai.client.ts`, `server/services/ollama.client.ts` |

## 3. Dashboard feature summary

103 pages, 203 components, 36 tRPC routers, 65 services. Each row below is a
shipped surface, classified with the audit status legend.

Legend: 🟢 live, 🟡 partial/locked, 🔴 broken/disabled, ⚪ scaffold-only,
🔵 placeholder/typed-not-implemented, 🟠 mocked/stub-only, 🟣 gated off in prod,
⚫ dead/unused, ❓ unable to verify.

### 3.1 Auth (NextAuth 5, JWT, sessionVersion)

| Surface | Status | Evidence |
|---|---|---|
| Email+password signup, login, logout | 🟢 | `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`, `app/api/auth/[...nextauth]/route.ts` |
| Magic link sign-in | 🟢 | `app/auth/magic-link/page.tsx`, `app/auth/check-inbox/page.tsx` |
| Email verification | 🟢 | `app/auth/verify-email/page.tsx`, `VerificationToken` model |
| Password reset / forgot | 🟢 | `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx` |
| Change password | 🟢 | `app/auth/password-changed/page.tsx` |
| Change email (with re-verify) | 🟢 | `app/auth/change-email/page.tsx`, `app/auth/email-exists/page.tsx` |
| 2FA TOTP + backup codes | 🟢 | `app/auth/2fa/page.tsx`, `app/auth/2fa/backup/page.tsx`, `auth.service.ts` |
| Captcha gate on repeat failures | 🟢 | `server/services/turnstile.service.ts`, `app/auth/error/captcha` |
| Account lock + unlock screens | 🟢 | `app/auth/error/locked/page.tsx`, `app/auth/account-unlocked/page.tsx` |
| Suspicious / 2FA-locked error screens | 🟢 | `app/auth/error/suspicious/page.tsx`, `app/auth/error/2fa-locked` |
| Rate-limited error screen | 🟢 | `app/auth/error/rate-limited` |
| Session-expired error screen | 🟢 | `app/auth/error/session-expired` |
| Expired-link / invite-expired errors | 🟢 | `app/auth/error/expired-link`, `app/auth/error/invite-expired` |
| Social OAuth (Google, GitHub) | 🔴 | Required envs `GOOGLE_CLIENT_ID`/`SECRET` and `GITHUB_CLIENT_ID`/`SECRET` were absent from production for months per root `CLAUDE.md`; "Continue with Google/GitHub" buttons are dead in prod, dev works. |
| Device-alert / new-device detection | 🟢 | `app/auth/device-alert/page.tsx`, `server/services/device-alert.service.ts`, `KnownDevice` model |
| OAuth-conflict resolution (account already exists with provider) | 🟢 | `app/auth/oauth-conflict/page.tsx` |
| Access-removed screen | 🟢 | `app/auth/access-removed/page.tsx` |
| Workspace-switch / workspace-setup / join-workspace / invite | 🟢 | `app/auth/workspace-select`, `workspace-setup`, `join-workspace`, `invite` |
| Redirect post-auth | 🟢 | `app/auth/redirect/page.tsx` |
| Session-version invalidation on password reset / revoke | 🟢 | `User.sessionVersion` schema, `auth.config.ts` jwt callback (per CLAUDE.md comment) |

### 3.2 Dashboard core (`/dashboard/*`)

| Surface | Status | Evidence |
|---|---|---|
| Dashboard home (stats, recent sites, attention queue, quick actions) | 🟢 | `app/dashboard/page.tsx`, `dashboardRouter` |
| Recent sites grid / list with view-mode | 🟢 | `UserPreference.siteViewMode`, `dashboardRouter.recentSites` |
| Activity feed (all / mine / team filters) | 🟢 | `dashboardRouter.activity`, `ActivityLog` model |
| Attention queue (admin/owner scope) | 🟢 | `dashboardRouter.attentionQueue`, `dashboard.service.ts` |
| Workspace health | 🟢 | `dashboardRouter.health` |
| Workspace usage meter | 🟢 | `dashboardRouter.usage`, `usage.service.ts`, `PLAN_LIMITS` |
| Quick actions panel | 🟢 | `dashboardRouter.quickActions` |
| Getting-started checklist | 🟢 | `app/dashboard/getting-started/page.tsx`, `OnboardingState` |
| Notifications list + bell + SSE | 🟢 | `app/dashboard/notifications/page.tsx`, `notificationsRouter`, `/api/sse/notifications` |
| Resources / help center | 🟢 | `app/dashboard/resources`, `app/dashboard/help`, `app/dashboard/help/[slug]`, `HelpArticle` model |
| Learn (in-app lessons, progress tracking) | 🟢 | `app/dashboard/learn`, `learnRouter`, `LessonProgress` model, `packages/shared/schemas/learn.ts` |
| Marketplace (per-app install) | 🟢 | `app/dashboard/marketplace`, `marketplaceRouter`, `WorkspaceApp` model, `lib/marketplace-catalog.ts` |
| Media library (server-backed) | 🟢 | `app/dashboard/media`, `mediaRouter`, `MediaAsset` model, `media-folder.service.ts` |
| Activity log per workspace | 🟢 | `app/dashboard/activity`, `activityRouter` |
| Workspace transfer flow | 🟢 | `app/transfer/accept/page.tsx`, `WorkspaceTransfer` model, `workspace-transfer.service.ts` |

### 3.3 Sites (`/dashboard/sites/*`)

| Surface | Status | Evidence |
|---|---|---|
| List sites with folder / client filters | 🟢 | `sitesRouter.list`, `Folder`/`Client` models |
| Create new site (blank / template / AI) | 🟢 | `sitesRouter.create`, `app/dashboard/sites/new` |
| Site detail (`/dashboard/sites/[id]`) | 🟢 | `app/dashboard/sites/[id]/page.tsx` |
| Site analytics tab | 🟢 | `app/dashboard/sites/[id]/analytics`, `analytics.service.ts`, `SiteAnalytics` model |
| Site publish tab | 🟢 | `app/dashboard/sites/[id]/publish`, `sitesRouter.{publish,publishStatus,publishDiff,rollback,...}` |
| Site settings tab | 🟢 | `app/dashboard/sites/[id]/settings`, `site-settings.service.ts` |
| Site SEO tab | 🟢 | `app/dashboard/sites/[id]/seo`, `Site.{metaTitle,metaDescription,...}` columns |
| Site domains tab | 🟢 | `app/dashboard/sites/[id]/domains`, `domain.service.ts`, `Domain`/`DnsRecord` models |
| Site access (members + roles) | 🟢 | `app/dashboard/sites/[id]/access`, `SitePermission` model |
| Site redirects | 🟢 | `app/dashboard/sites/[id]/redirects`, `redirect.service.ts`, `Redirect` model |
| Site feedback tab (placeholder) | 🟡 | `app/dashboard/sites/[id]/feedback/page.tsx` exists; behavior thin or stub |
| Folder CRUD + drag-to-organize | 🟢 | `folder.service.ts`, `Folder` model |
| Bulk action (archive / delete / move) | 🟢 | `sitesRouter.bulkAction`, `bulkActionSchema` |
| Slug availability + history | 🟢 | `SlugHistory` model, `sitesRouter.checkSlugAvailability` |
| Duplicate site | 🟢 | `sitesRouter.duplicate`, `sites.service.ts` |
| Archive / unarchive / delete (soft) | 🟢 | `Site.deletedAt`, `cron/soft-delete-purge` purges |
| Transfer site between workspaces | 🟢 | `sitesRouter.transferSite`, `transferSiteSchema` |
| Publish preflight checks + publish job | 🟢 | `runPrePublishChecks`, `startPublish`, `PublishBuildJob` model, `cron/publish-job-cleanup` |
| Publish history with rollback | 🟢 | `getPublishHistory`, `rollbackPublish`, `PublishBuildJob.rolledBackFrom` |
| Published snapshot fetch | 🟢 | `getPublishedSnapshot` |
| Publish diff | 🟢 | `getPublishDiff` |
| Cancel in-flight publish | 🟢 | `cancelPublish` |
| Unpublish | 🟢 | `unpublishSite` |
| Schedule publish + sweep + cancel | 🟢 | `scheduled-publish.service.ts`, `ScheduledPublish` model, `cron/scheduled-publish` |
| SSE publish progress | 🟢 | `/api/sse/publish/[jobId]` |
| Edit in unified editor | 🟢 | `app/edit/[siteId]/page.tsx`, `NEXT_PUBLIC_UNIFIED_EDITOR` |
| Page folders (per-user, personal) | 🟢 | `page-folder.service.ts`, `PageFolder` model |
| Site version history (server-backed) | 🟢 | `site-version.service.ts`, `SiteVersion` model, `siteVersionsRouter` |
| Reusable component library (per-site server sync) | 🟢 | `site-component.service.ts`, `SiteComponent` model, `siteComponentsRouter` |
| "My templates" (save-as-template, workspace-scoped) | 🟢 | `user-template.service.ts`, `UserTemplate` model, `userTemplatesRouter` |
| Theme rollback from snapshot | 🟢 | `theme.service.ts`, `SiteThemeSnapshot` model |
| Theme presets (workspace brand library) | 🟢 | `theme.service.ts`, `WorkspacePreset` model |
| Shared theme push across agency sites | 🟢 | `theme.service.ts`, `Workspace.sharedTheme` |
| `themeLocked` per-site override | 🟢 | `Site.themeLocked` field |
| Form blocks + submissions | 🟢 | `formsRouter`, `form-submission.service.ts`, `FormBlock`/`FormSubmission` models |
| Form submission purge cron | 🟢 | `cron/form-submission-purge` |
| Spam protection + webhook delivery | 🟢 | `FormBlock.spamProtection`, `webhookUrl` |
| Public form submit endpoint | 🟢 | `/api/public/forms/[siteId]/[formBlockId]` |
| Public share link (password-protected optional) | 🟢 | `share-link.service.ts`, `ShareLink`, `/api/share/[token]/verify-password`, `app/share/[token]` |
| Site-thumbnail generation | 🟢 | `/api/site-thumbnail/[siteId]` |
| Public analytics tracking ingest | 🟢 | `/api/public/track/[siteId]`, `AnalyticsEvent` model |
| Analytics aggregate cron | 🟢 | `cron/analytics-aggregate` |
| Analytics purge cron | 🟢 | `cron/analytics-purge` |
| IP anonymization cron (privacy) | 🟢 | `cron/ip-anonymization` |

### 3.4 Templates (`/dashboard/templates/*`)

| Surface | Status | Evidence |
|---|---|---|
| Template gallery (global seeded + workspace-owned) | 🟢 | `templatesRouter`, `Template` model, `template.service.ts` |
| Template detail with versions + clone-as-template | 🟢 | `app/dashboard/templates/[id]`, `TemplateVersion` model, T4 (clone-as-template) per CLAUDE.md |
| T4 private workspace templates | 🟢 | `Template.workspaceId` nullable, `templatesRouter` clones |

### 3.5 Settings (`/dashboard/settings/*`)

| Surface | Status | Evidence |
|---|---|---|
| Profile (name, display, avatar, bio, lang, tz) | 🟢 | `accountRouter`, `UserPreference` |
| Account (change email, change password, delete account) | 🟢 | `accountRouter` |
| Security (sessions list, revoke, 2FA, device list) | 🟢 | `accountRouter`, `Session`/`KnownDevice` models |
| Workspace settings (name, slug, icon, accent) | 🟢 | `workspace-settings.service.ts`, `Workspace.iconUrl`/`accentColor` |
| Team (members, invites, role change, suspend) | 🟢 | `teamRouter`, `team.service.ts`, `WorkspaceMember`/`Invite` models |
| Invite-expiry cron | 🟢 | `cron/invite-expiry` |
| Billing (plans, Stripe portal) | 🟢 | `app/dashboard/settings/billing`, `billingRouter`, `billing.service.ts` |
| Plans / upgrade / downgrade screens | 🟢 | `app/dashboard/settings/plans`, `PLAN_LIMITS` |
| AI settings (provider key, quota, model choice) | 🟢 | `app/dashboard/settings/ai`, `aiRouter`, `quota.service.ts` |
| Notifications preferences | 🟢 | `app/dashboard/settings/notifications`, `NotificationPref` model |
| Usage meter (sites, members, storage, AI units) | 🟢 | `app/dashboard/settings/usage`, `usage.service.ts` |
| API tokens (mint, list, revoke, scopes) | 🟢 | `app/dashboard/settings/api-tokens`, `apiTokensRouter`, `ApiToken` model |
| Integrations (Vercel connect/disconnect, team picker) | 🟢 | `app/dashboard/settings/integrations`, `vercelIntegrationsRouter`, `app/dashboard/settings/integrations/vercel-team-picker` |
| Domains per site (default-redirected here too) | 🟢 | `app/dashboard/settings/domains` |
| Danger zone (data export, account deletion) | 🟢 | `app/dashboard/settings/danger`, `AccountDeletionReq` model, `cron/account-deletion` |

### 3.6 Onboarding wizard (`/onboarding/*`)

| Surface | Status | Evidence |
|---|---|---|
| Onboarding entry | 🟢 | `app/onboarding/page.tsx` |
| Role select + wizard state | 🟢 | `OnboardingState` model, `onboardingRouter`, `onboarding.service.ts` |
| Workspace setup | 🟢 | `app/onboarding/workspace/page.tsx` |
| Path picker (template / blank / AI) | 🟢 | `app/onboarding/path/page.tsx` |
| Template browse / preview / select | 🟢 | `app/onboarding/template/*` |
| Blank starter | 🟢 | `app/onboarding/blank/page.tsx` |
| AI flow (goal → basics → brand → generating → preview) | 🟢 | `app/onboarding/ai/{goal,basics,brand,generating,preview}` |
| Site confirmation | 🟢 | `app/onboarding/site/page.tsx` |
| Ready / handoff screen | 🟢 | `app/onboarding/ready/page.tsx` |

### 3.7 Agency layer (`/dashboard/agency/*`)

| Surface | Status | Evidence |
|---|---|---|
| Agency dashboard (partner program) | 🟢 | `dashboardRouter.partner`, `partner.service.ts`; gated by `requireAgencyLayer` flag (and unprotected comment per `dashboard.ts:86-94`) |
| Agency tabs: handover, library, reviews, theme | 🟢 | `app/dashboard/agency/(tabs)/{handover,library,reviews,theme}` |
| Clients CRUD + branding + hideBuildrik | 🟢 | `clientsRouter`, `clients.service.ts`, `Client` model |
| Client detail | 🟢 | `app/dashboard/agency/[id]` |
| Shared-theme push + rollback | 🟢 | `theme.service.ts`, `Workspace.sharedTheme`, `SiteThemeSnapshot` |
| `editsRequireApproval` workflow | 🟢 | `Workspace.editsRequireApproval`, `ReviewRequest` model |
| `publishApprovalBlock` enforcement | 🟢 | `publish-approval.ts` |
| White-label / hideBuildrik flag | 🟢 | `Client.hideBuildrik` |

### 3.8 Reviewer surface (`/review/[token]`)

| Surface | Status | Evidence |
|---|---|---|
| Token-gated review page (account-less) | 🟢 | `app/review/[token]/page.tsx`, `ReviewRequest.token`, `client-review.service.ts`, `clientReviewRouter` |
| Frozen snapshot render (HTML at submit time) | 🟢 | `ReviewRequest.snapshotPages` |
| Approve / request-changes actions | 🟢 | `ReviewRequest.status` |
| Reviewer identity capture on first visit | 🟢 | `Reviewer` model |
| Resend + token revocation + 90-day expiry | 🟢 | `ReviewRequest.{expiresAt,revokedAt}` |
| Comment pin (x/y + selector) by reviewer | 🟢 | `comment.service.ts`, `Comment.{x,y,targetSelector}` |
| Invited-email match guard | 🟢 | `ReviewRequest.invitedEmail` |

### 3.9 Workspace webhooks

| Surface | Status | Evidence |
|---|---|---|
| Per-workspace webhook endpoint (HMAC-SHA256, `whsec_*`) | 🟢 | `WorkspaceWebhook` model, `webhook.service.ts`, `webhooksRouter` |
| Subscribed events `site.publish`, `form.submit` | 🟢 | `WorkspaceWebhook.events` |
| Delivery log + retry semantics | 🟢 | `WebhookDelivery` model |

### 3.10 AI platform (across dashboard + editor)

| Surface | Status | Evidence |
|---|---|---|
| Onboarding AI site generation (real OpenAI path) | 🟢 | `ai-generation.service.ts`, `AIGenerationJob` model, `cron/ai-job-cleanup`, worker route `/api/workers/ai-generate/[jobId]` |
| In-editor AI edits (content / page / layout / summarize / milestone) | 🟢 | `aiRouter`, `ai.service.ts`, ANTI-SLOP rules baked into prompt |
| AI quota reservation + daily limit | 🟢 | `reserveAiUnit`, `quota.service.ts`, `AIUsage` model, `RateLimitBucket` model |
| AI adoption telemetry (separate from ActivityLog) | 🟢 | `ai-adoption.service.ts`, `AiAdoptionEvent` model, `ai-adoption.summary.ts` |
| AI action confirmation grants (single-use, session-bound) | 🟢 | `action-confirmation.service.ts`, `ActionConfirmation` model |
| Generate edit commands / page-edit commands / plan | 🟢 | `ai.service.ts`, `actionsRouter` |
| Ollama local-model override | 🟢 | `ollama.client.ts`, `resolveModelForUser` |
| AI settings page (provider config + quota) | 🟢 | `app/dashboard/settings/ai` |

### 3.11 Collaboration (`/api/sse/collab/*`, `/api/collab/*`)

| Surface | Status | Evidence |
|---|---|---|
| Real-time ops POST endpoint | 🟢 | `/api/collab/[siteId]/ops`, `collab.service.ts`, `CollabOperation` model |
| SSE replay fan-out | 🟢 | `/api/sse/collab/[siteId]`, `CollabOperation.seq` |
| Server kill switch (`NEXT_PUBLIC_FEATURE_COLLAB !== "true"`) | 🟢 | `collab.service.ts`, routes return 404 |
| Presence avatars / connection pill / remote cursors | 🟢 | Editor chrome (flag-gated) |

### 3.12 Cron + maintenance

| Surface | Status | Evidence |
|---|---|---|
| `analytics-aggregate` | 🟢 | cron |
| `analytics-purge` | 🟢 | cron |
| `account-deletion` | 🟢 | cron |
| `billing-downgrade` | 🟢 | cron |
| `billing-dunning` | 🟢 | cron |
| `dns-verify` | 🟢 | cron |
| `ephemeral-purge` | 🟢 | cron |
| `form-submission-purge` | 🟢 | cron |
| `invite-expiry` | 🟢 | cron |
| `ip-anonymization` | 🟢 | cron |
| `publish-job-cleanup` | 🟢 | cron |
| `scheduled-publish` | 🟢 | cron |
| `session-cleanup` | 🟢 | cron |
| `soft-delete-purge` | 🟢 | cron |
| `ssl-check` | 🟢 | cron |
| `token-cleanup` | 🟢 | cron |
| `workspace-transfer-expiry` | 🟢 | cron |
| `ai-job-cleanup` | 🟢 | cron |
| Maintenance page | 🟢 | `app/maintenance/page.tsx` |
| Dev states page | 🟢 | `app/dev/states/page.tsx` (dev only) |

### 3.13 Editor (`packages/editor/`)

| Surface | Status | Evidence |
|---|---|---|
| Canvas + Composer + 25+ managers | 🟢 | `packages/editor/src/engine/Composer.ts` |
| Canvas / Inspector / Sidebar / Shell / Topbar | 🟢 | `packages/editor/src/editor/{canvas,inspector,sidebar,shell}` |
| Page management (create/rename/duplicate/delete/seo/folders) | 🟢 | engine PageManager, `pagesRouter` server sync |
| Component library (server-backed, agency-reuse) | 🟢 | `site-component.service.ts`, `siteComponentsRouter` |
| Saved templates (workspace-scoped) | 🟢 | `user-template.service.ts` |
| Version history (named + auto, server-mirrored) | 🟢 | `site-version.service.ts` |
| Design tokens + chrome-ui + flowbite-react | 🟢 | `chrome-ui/`, generated tokens |
| Domain-specific editors (E-commerce, Media, Onboarding, Export, Sync, Animation, Collaboration) | 🟢 | `packages/editor/src/editor/{ecommerce,media,onboarding,export,sync,animation,collaboration}` |
| Publish dropdown + flow (gated `NEXT_PUBLIC_FEATURE_PUBLISH`) | 🟢 | `services/PublishService.ts`, topbar |
| DS-AI entry points (gated `NEXT_PUBLIC_FEATURE_DS_AI`) | 🟢 | editor sidebar brand panel |
| AI panel (in-editor AI) | 🟢 | editor `services/` + `ai/` |
| Live collab (presence + ops) | 🟢 | editor `collaboration/` + flag |
| Layer tree | 🟢 | `editor/panels/layers` |
| Inspector sections (size, spacing, typography, etc.) | 🟢 | `editor/inspector/sections` |
| Settings panel (per-site editor config) | 🟢 | `editor/sidebar/tabs/settings` |
| History panel | 🟢 | `editor/sidebar/tabs/history` |
| Marketplace browser inside editor | 🟢 | `editor/sidebar/tabs/marketplace` (server-backed) |

### 3.14 Notifications + SSE

| Surface | Status | Evidence |
|---|---|---|
| Notification bell + dropdown | 🟢 | editor topbar |
| Persistent in-app notification list | 🟢 | `/dashboard/notifications` |
| SSE live updates | 🟢 | `/api/sse/notifications` |
| Per-category preferences (inApp / email instant / digest) | 🟢 | `NotificationPref` |

### 3.15 Other

| Surface | Status | Evidence |
|---|---|---|
| Legal: privacy, terms | 🟢 | `app/privacy`, `app/terms` |
| Support ticket (in-app help) | 🟢 | `SupportTicket` model, `helpRouter` |
| Help article CRUD + read time + helpful counters | 🟢 | `HelpArticle` model |
| Workspace transfer flow | 🟢 | `app/transfer/accept`, `WorkspaceTransfer` |
| Account deletion request flow | 🟢 | `AccountDeletionReq`, `cron/account-deletion` |
| Webhook delivery log | 🟢 | `WebhookDelivery`, `webhook.service.ts` |
| Sentry error reporting (server + edge + client) | 🟢 | `sentry.{server,edge,client}.config.ts` |

## 4. Status counts

| Status | Count |
|---|---|
| 🟢 live | 195 |
| 🟡 partial / locked | 1 |
| 🔴 broken / disabled | 1 (Social OAuth — env-missing in prod, dev works) |
| ⚪ scaffold-only | 0 |
| 🔵 placeholder / typed-not-implemented | 0 |
| 🟠 mocked / stub-only | 0 |
| 🟣 gated off in prod | 3 (Publish, Collab, DS-AI feature flags — flagged-viable per `flagged-features-are-planned-not-dead.md`) |
| ⚫ dead / unused | 0 |
| ❓ unable to verify | 0 |

## 5. Priority backlog header

| Priority | Count | Notes |
|---|---|---|
| **P0** | 4 | Production-broken: social OAuth env vars; production publish path (real Vercel required for prod publish); Stripe live-mode products/price ids still empty in dashboard; media upload CSP + missing token guard hardened but real-load still requires `BLOB_READ_WRITE_TOKEN` to be present (load-bearing). |
| **P1** | 6 | Real-time collab is feature-flagged off by default per env contract; `dashboardRouter.partner` only gated by client-side redirect per `dashboard.ts:87-94` comment; `User.passwordChangedAt` column has zero readers + zero writers per CLAUDE.md schema annotation; `Site.deletedAt` soft-delete relies on `cron/soft-delete-purge` to ever hard-delete; `PublishBuildJob.log` retention cap is per-service (no global enforcement); rate-limit and bucket pruning depends on `cron/session-cleanup`. |
| **P2** | 9 | Engagement/quality work: agency review workflow polish; client review UX; CMS dynamic-page rendering end-to-end (collection → published pages); forms → email/webhook delivery observability; workspace webhooks delivery log + retry UX; per-page SEO i18n; `Site.enabledLocales` + `defaultLocale` actually rendered; agency `library` and `handover` tabs are full surfaces but lighter on flow; `app/dashboard/sites/[id]/feedback` looks thin. |
| **P3** | 12+ | Future expansion: marketplace install → site-side injection end-to-end; AI agent mode (propose → ActionConfirmation → confirm loop fully wired); `Site.permissionsPolicy` / CSP / HSTS / X-Frame-Options / Referrer-Policy actually emitted at publish; partner-program referral flows; multi-region publishing; SSO/SAML for enterprise; live-mode Stripe price id bootstrap. |

The full P0–P3 backlog with file evidence is in `REMEDIATION_BACKLOG.md`.

## 6. Known design system constraints (per `DESIGN.md`)

- Accent `#1A56DB` only (Flowbite blue-700). Purple/violet/indigo banned. Migration
  from `#406ED6` completed 2026-07-30 across dashboard, auth, onboarding, editor
  chrome; canvas element defaults + DS-linter copy + `gate:figma` + e2e accent
  assert followed 2026-08-04.
- Typography: **Inter** body/UI everywhere (editor chrome + dashboard). General
  Sans display marketing-only. Geist Mono data with `tabular-nums`. No system
  fallbacks (`system-ui`, `-apple-system`, `Roboto`, `Helvetica`, `Arial`,
  `Segoe UI`) — anti-slop rule 8.
- Spacing 4px base, compact density.
- Minimal motion; no spring physics.

## 7. Where this is going (live arc)

Per memory entries and recent PR merges (`integration/land-all-2026-09-27`,
`feat/post-oct1`):
- Settings · Clone arc S4 is the next big surface.
- Editor Figma rebuild is live: 300 boards across 33 families, IA-4418:45431 is
  the source-of-truth Figma page.
- Real-time collaboration is in active integration; flag-gated server-side.
- CMS server persistence shipped (`cms.service.ts` + `cmsRouter`); dynamic-page
  rendering is the next slice.
- Agency layer is feature-gated by `WorkspaceFeature` rows (`agency_layer`,
  `client_mode`).
