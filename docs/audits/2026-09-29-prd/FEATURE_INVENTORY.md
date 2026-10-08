# FEATURE INVENTORY — Buildrik

Read-only reverse-engineering pass, 2026-09-30. Format: `Feature → Path → Status → Evidence → Notes`. Status legend: 🟢 live · 🟡 partial/locked · 🔴 broken · ⚪ scaffold · 🔵 placeholder · 🟠 mock · 🟣 gated off in prod · ⚫ dead · ❓ unverifiable.

## A. Auth + Identity

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| A01 | Email+password signup | `/auth/signup` | 🟢 | `app/auth/signup/page.tsx`, `auth.service.ts` | bcrypt + sessionVersion mint |
| A02 | Email+password login | `/auth/login` | 🟢 | `app/auth/login/page.tsx` | Captcha after N failures |
| A03 | Magic-link sign-in | `/auth/magic-link` | 🟢 | `app/auth/magic-link/page.tsx`, `check-inbox` | Single-use token, `VerificationToken` |
| A04 | Email verification | `/auth/verify-email` | 🟢 | `VerificationToken` | Token expiry enforced |
| A05 | Password reset | `/auth/reset-password` | 🟢 | `auth.service.ts` resetPassword | Bumps `User.sessionVersion` |
| A06 | Forgot-password request | `/auth/forgot-password` | 🟢 | same | Rate-limited |
| A07 | Change password | settings/account | 🟢 | `accountRouter.changePassword` | Bumps `User.sessionVersion` |
| A08 | Change email | `/auth/change-email` + `/auth/email-exists` | 🟢 | `accountRouter.changeEmail` | Re-verify before swap |
| A09 | 2FA TOTP enable / verify / disable | `/auth/2fa` | 🟢 | `auth.service.ts` | AES-256-GCM encrypted secret |
| A10 | 2FA backup codes | `/auth/2fa/backup` | 🟢 | `User.backupCodes[]` | Regenerable |
| A11 | 2FA locked error | `/auth/error/2fa-locked` | 🟢 | route | Display only |
| A12 | Session list / revoke / revoke all others | settings/security | 🟢 | `accountRouter`, `Session` model | JWT-strategy so `Session` is display; gate is `User.sessionVersion` |
| A13 | Known device detection + alert | `/auth/device-alert` | 🟢 | `device-alert.service.ts`, `KnownDevice` | HMAC fingerprint |
| A14 | Captcha on repeat failures | `/auth/error/captcha` | 🟢 | `turnstile.service.ts` | TURNSTILE_SECRET_KEY optional |
| A15 | Account lock screen + auto-unlock | `/auth/error/locked`, `/auth/account-unlocked` | 🟢 | `User.lockedUntil`, `failedAttempts` | TTL-based |
| A16 | Suspicious sign-in block | `/auth/error/suspicious` | 🟢 | route | Triggered by IP/UA delta |
| A17 | Rate-limited screen | `/auth/error/rate-limited` | 🟢 | `RateLimitBucket` model, `rate-limiter.ts` | DB-backed so serverless-safe |
| A18 | Session-expired screen | `/auth/error/session-expired` | 🟢 | route | Display |
| A19 | Expired link / invite-expired | `/auth/error/expired-link`, `invite-expired` | 🟢 | route | Display |
| A20 | Social OAuth: Google | login button | 🔴 | `accounts` table + NextAuth provider config | Requires `GOOGLE_CLIENT_ID/SECRET` in prod; per CLAUDE.md was silently absent for months → buttons dead in prod, dev works |
| A21 | Social OAuth: GitHub | login button | 🔴 | same | Same root cause |
| A22 | OAuth conflict (account exists) | `/auth/oauth-conflict` | 🟢 | route | Account-link choice |
| A23 | Access-removed screen | `/auth/access-removed` | 🟢 | route | Triggered when membership removed |
| A24 | Workspace select post-login | `/auth/workspace-select` | 🟢 | route | Multi-workspace users |
| A25 | Workspace setup post-signup | `/auth/workspace-setup` | 🟢 | route | First-time flow |
| A26 | Join workspace via invite token | `/auth/join-workspace` + `/auth/invite` | 🟢 | `Invite` model | Invite-expiry cron enforces |
| A27 | Auth redirect post-action | `/auth/redirect` | 🟢 | route | Bounce target |
| A28 | Session-version invalidation on revoke | internal | 🟢 | `User.sessionVersion`, `auth.config.ts` jwt callback | Real gate (Sessions table is display only) |

## B. Dashboard shell + landing

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| B01 | Dashboard home | `/dashboard` | 🟢 | `app/dashboard/page.tsx` | Stats + recent + attention |
| B02 | Stats card (sites, members, storage, AI) | `/dashboard` | 🟢 | `dashboardRouter.stats`, `dashboard.service.ts` | Plan-aware via `PLAN_LIMITS` |
| B03 | Recent sites list | `/dashboard` | 🟢 | `dashboardRouter.recentSites` | `UserPreference.siteViewMode` (grid/list) |
| B04 | Attention queue (admin) | `/dashboard` | 🟢 | `dashboardRouter.attentionQueue` | Failures + invites + expiring |
| B05 | Activity feed | `/dashboard/activity` + dashboard card | 🟢 | `dashboardRouter.activity`, `activityRouter` | all/mine/team filters |
| B06 | Workspace health | `/dashboard` | 🟢 | `dashboardRouter.health` | Aggregator |
| B07 | Workspace usage | `/dashboard` | 🟢 | `dashboardRouter.usage`, `usage.service.ts` | Sites / storage / members / AI |
| B08 | Quick actions | `/dashboard` | 🟢 | `dashboardRouter.quickActions` | Plan-aware |
| B09 | Getting-started checklist | `/dashboard/getting-started` | 🟢 | `OnboardingState` | Steps + tour |
| B10 | Notifications list | `/dashboard/notifications` | 🟢 | `notificationsRouter` | Filter, mark-read |
| B11 | Notification bell + SSE | top bar | 🟢 | `/api/sse/notifications` | Per-user channel |
| B12 | Resources | `/dashboard/resources` | 🟢 | route | Curated links |
| B13 | Help center | `/dashboard/help` | 🟢 | `helpRouter` | Categories + search |
| B14 | Help article | `/dashboard/help/[slug]` | 🟢 | `HelpArticle` model | Helpful yes/no counters |
| B15 | Learn (lessons) | `/dashboard/learn` | 🟢 | `learnRouter`, `packages/shared/schemas/learn.ts` | Code-constant lessons, `LessonProgress` rows |
| B16 | Marketplace | `/dashboard/marketplace` | 🟢 | `marketplaceRouter` | Install/Configure apps |
| B17 | Media library (server-backed) | `/dashboard/media` | 🟢 | `mediaRouter` | Folders + versions |
| B18 | Activity log | `/dashboard/activity` | 🟢 | `activityRouter` | Full workspace timeline |

## C. Sites

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| C01 | Sites list | `/dashboard/sites` (via dashboard) | 🟢 | `sitesRouter.list` | Folder/Client filters |
| C02 | Create site (blank/template/AI) | `/dashboard/sites/new` | 🟢 | `sitesRouter.create`, `createSiteSchema` | Quota-checked |
| C03 | Site detail | `/dashboard/sites/[id]` | 🟢 | `app/dashboard/sites/[id]/page.tsx` | Tabs container |
| C04 | Site analytics | `/dashboard/sites/[id]/analytics` | 🟢 | `analytics.service.ts`, `SiteAnalytics` | Aggregated daily |
| C05 | Site publish tab | `/dashboard/sites/[id]/publish` | 🟢 | `sitesRouter.publish*` | Triggers `PublishBuildJob` |
| C06 | Site settings tab | `/dashboard/sites/[id]/settings` | 🟢 | `site-settings.service.ts` | Name, slug, favicon, social, head/body code |
| C07 | Site SEO tab | `/dashboard/sites/[id]/seo` | 🟢 | same | metaTitle/Description/ogImage/canonical/robotsTxt |
| C08 | Site domains tab | `/dashboard/sites/[id]/domains` | 🟢 | `domain.service.ts`, `Domain`/`DnsRecord` | SSL status + autoRenew |
| C09 | Site access | `/dashboard/sites/[id]/access` | 🟢 | `SitePermission` | Per-site role override |
| C10 | Site redirects | `/dashboard/sites/[id]/redirects` | 🟢 | `redirect.service.ts`, `Redirect` | 301/302 + query match |
| C11 | Site feedback | `/dashboard/sites/[id]/feedback` | 🟡 | route exists | Thin surface, behavior not deeply exercised |
| C12 | Folder CRUD + drag | `/dashboard/sites` folder UI | 🟢 | `folder.service.ts`, `Folder` | Position ordering |
| C13 | Bulk action | `/dashboard/sites` | 🟢 | `sitesRouter.bulkAction`, `bulkActionSchema` | Archive/delete/move |
| C14 | Slug availability + history | `sitesRouter.checkSlugAvailability` | 🟢 | `SlugHistory` model | Tracked per rename |
| C15 | Duplicate site | per-site action | 🟢 | `sitesRouter.duplicate` | Clones pages, theme, settings |
| C16 | Archive / unarchive | per-site action | 🟢 | `sites.service.ts` | Sets `Site.deletedAt` |
| C17 | Delete site | per-site action | 🟢 | same | Soft-delete; purged by cron |
| C18 | Transfer site | per-site action | 🟢 | `transferSiteSchema` | Workspace move |
| C19 | Edit in editor | `/edit/[siteId]` | 🟢 | `app/edit/[siteId]/page.tsx`, `NEXT_PUBLIC_UNIFIED_EDITOR` | Inlined editor |
| C20 | Page folders (per-user) | editor Pages panel | 🟢 | `page-folder.service.ts`, `PageFolder` | Personal grouping |
| C21 | Site version history | editor History panel + server | 🟢 | `site-version.service.ts`, `SiteVersion` | Auto + named |
| C22 | Reusable component library | editor Components panel | 🟢 | `site-component.service.ts`, `SiteComponent` | Per-site server sync |
| C23 | Save-as-template ("My Templates") | editor | 🟢 | `user-template.service.ts`, `UserTemplate` | Workspace-scoped |
| C24 | Theme rollback (per-site) | agency/theme | 🟢 | `theme.service.ts`, `SiteThemeSnapshot` | Bounded retention |
| C25 | Theme presets (workspace brand library) | agency/library | 🟢 | `theme.service.ts`, `WorkspacePreset` | Multi-brand |
| C26 | Shared-theme push | agency/theme | 🟢 | `theme.service.ts`, `Workspace.sharedTheme` | Per-site opt-out via `Site.themeLocked` |
| C27 | Publish preflight checks | `sitesRouter.publish` | 🟢 | `runPrePublishChecks` | Vercel/pages/SEO/domain/favicon/empty checks |
| C28 | Publish job creation | `sitesRouter.publish` | 🟢 | `PublishBuildJob`, worker `/api/workers/publish/[jobId]` | Real Vercel path |
| C29 | Publish history with rollback | `/dashboard/sites/[id]/publish` | 🟢 | `getPublishHistory`, `rollbackPublish` | `rolledBackFrom` provenance |
| C30 | Publish diff | same | 🟢 | `getPublishDiff` | Per-page snapshot compare |
| C31 | Cancel publish | same | 🟢 | `cancelPublish` | Sets status CANCELLED |
| C32 | Unpublish | same | 🟢 | `unpublishSite` | Removes deployment |
| C33 | Schedule publish | same | 🟢 | `scheduled-publish.service.ts`, `ScheduledPublish`, `cron/scheduled-publish` | At-most-one PENDING enforced |
| C34 | Cancel scheduled publish | same | 🟢 | `cancelScheduledPublish` | |
| C35 | SSE publish progress | `/api/sse/publish/[jobId]` | 🟢 | route | Live updates |
| C36 | Forms CRUD | per-site form blocks | 🟢 | `formsRouter`, `FormBlock` | Per siteId+blockId unique |
| C37 | Form public submit | `/api/public/forms/[siteId]/[formBlockId]` | 🟢 | route | CAPTCHA + spam protection |
| C38 | Form submissions inbox | per-site | 🟢 | `form-submission.service.ts`, `FormSubmission` | Read/archive/spam |
| C39 | Form webhook delivery | per-form | 🟢 | `FormBlock.webhookUrl` | Signed or raw (TBD verify) |
| C40 | Form submission purge | cron | 🟢 | `cron/form-submission-purge` | TTL |
| C41 | Share link (token + optional password) | editor publish panel | 🟢 | `share-link.service.ts`, `ShareLink` | View-count, expiry |
| C42 | Share link verify-password | `/api/share/[token]/verify-password` | 🟢 | route | |
| C43 | Public share view | `/share/[token]` | 🟢 | `app/share/[token]/page.tsx` | |
| C44 | Site-thumbnail generation | `/api/site-thumbnail/[siteId]` | 🟢 | route | For grid/list |
| C45 | Public analytics ingest | `/api/public/track/[siteId]` | 🟢 | route, `AnalyticsEvent` | |
| C46 | Analytics aggregate cron | cron | 🟢 | `cron/analytics-aggregate` | Daily rollup |
| C47 | Analytics purge cron | cron | 🟢 | `cron/analytics-purge` | Retention |
| C48 | IP anonymization cron | cron | 🟢 | `cron/ip-anonymization` | Privacy |
| C49 | Form-driven email | per-form | 🟢 | `FormBlock.notifyEmail`, `email.service.ts` | |

## D. Templates

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| D01 | Template gallery | `/dashboard/templates` | 🟢 | `templatesRouter`, `Template` | Global seeded + workspace-private |
| D02 | Template detail | `/dashboard/templates/[id]` | 🟢 | route | Versions + preview |
| D03 | Template versions + restore | detail panel | 🟢 | `TemplateVersion` model | Unlimited retention |
| D04 | Clone-as-template (workspace private) | editor → save | 🟢 | `Template.workspaceId` nullable | Per workspace |
| D05 | User templates ("My Templates") | editor | 🟢 | `user-template.service.ts`, `UserTemplate` | |

## E. Settings

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| E01 | Profile | `/dashboard/settings/profile` | 🟢 | `accountRouter`, `UserPreference` | |
| E02 | Account (change email/password, delete account) | `/dashboard/settings/account` | 🟢 | `accountRouter` | |
| E03 | Danger zone | `/dashboard/settings/danger` | 🟢 | `AccountDeletionReq` model | 7-day scheduled |
| E04 | Security (sessions, 2FA, devices) | `/dashboard/settings/security` | 🟢 | `accountRouter`, `Session`/`KnownDevice` | |
| E05 | Workspace settings | `/dashboard/settings/workspace` | 🟢 | `workspace-settings.service.ts` | name/slug/icon/accent |
| E06 | Team (members + invites + roles) | `/dashboard/settings/team` | 🟢 | `teamRouter`, `team.service.ts`, `Invite` | Suspend support |
| E07 | Invite expiry cron | cron | 🟢 | `cron/invite-expiry` | |
| E08 | Billing (plans + portal) | `/dashboard/settings/billing` | 🟢 | `billingRouter`, `billing.service.ts` | Stripe Checkout + Portal |
| E09 | Plans / upgrade screen | `/dashboard/settings/plans` | 🟢 | `PLAN_LIMITS` | |
| E10 | AI settings | `/dashboard/settings/ai` | 🟢 | `quota.service.ts` | |
| E11 | Notification preferences | `/dashboard/settings/notifications` | 🟢 | `NotificationPref` model | |
| E12 | Usage meter | `/dashboard/settings/usage` | 🟢 | `usage.service.ts` | |
| E13 | API tokens (mint, list, revoke, scopes) | `/dashboard/settings/api-tokens` | 🟢 | `apiTokensRouter`, `ApiToken` | |
| E14 | Integrations list | `/dashboard/settings/integrations` | 🟢 | `vercelIntegrationsRouter` | |
| E15 | Vercel team picker | `/dashboard/settings/integrations/vercel-team-picker` | 🟢 | `vercel-oauth.service.ts` | |
| E16 | Vercel connect | `/api/integrations/vercel/authorize` | 🟢 | route | OAuth start |
| E17 | Vercel callback | `/api/integrations/vercel/callback` | 🟢 | route | Token exchange |
| E18 | Domains per site | `/dashboard/sites/[id]/domains` and `/dashboard/settings/domains` | 🟢 | `domain.service.ts` | |
| E19 | Stripe webhook | `/api/webhooks/stripe` | 🟢 | route, `stripe-webhook.service.ts` | 5 events |
| E20 | Billing downgrade cron | cron | 🟢 | `cron/billing-downgrade` | |
| E21 | Billing dunning cron | cron | 🟢 | `cron/billing-dunning` | |
| E22 | Scheduled-publish sweep | cron | 🟢 | `cron/scheduled-publish` | |
| E23 | Workspace transfer flow | `/transfer/accept` | 🟢 | `workspace-transfer.service.ts`, `WorkspaceTransfer` | |
| E24 | Workspace transfer expiry | cron | 🟢 | `cron/workspace-transfer-expiry` | |

## F. Onboarding wizard

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| F01 | Wizard entry | `/onboarding` | 🟢 | `app/onboarding/page.tsx` | |
| F02 | Role select + state | internal | 🟢 | `OnboardingState` model, `onboarding.service.ts` | `wizardData` JSON |
| F03 | Workspace setup | `/onboarding/workspace` | 🟢 | route | |
| F04 | Path picker | `/onboarding/path` | 🟢 | route | template / blank / AI |
| F05 | Template browse | `/onboarding/template` | 🟢 | route | |
| F06 | Template preview | `/onboarding/template/preview` | 🟢 | route | |
| F07 | Template selected | `/onboarding/template/selected` | 🟢 | route | |
| F08 | Blank starter | `/onboarding/blank` | 🟢 | route | |
| F09 | AI goal | `/onboarding/ai/goal` | 🟢 | route | |
| F10 | AI basics | `/onboarding/ai/basics` | 🟢 | route | |
| F11 | AI brand | `/onboarding/ai/brand` | 🟢 | route | |
| F12 | AI generating | `/onboarding/ai/generating` | 🟢 | route, `ai-generate-worker` | SSE/poll |
| F13 | AI preview | `/onboarding/ai/preview` | 🟢 | route | |
| F14 | Site confirmation | `/onboarding/site` | 🟢 | route | |
| F15 | Ready screen | `/onboarding/ready` | 🟢 | route | |

## G. Agency layer

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| G01 | Partner dashboard | `/dashboard/agency/(tabs)/partner` | 🟢 | `dashboardRouter.partner`, `partner.service.ts` | Gated by `WorkspaceFeature` `agency_layer` (one unprotected sibling per `dashboard.ts:87-94`) |
| G02 | Clients CRUD + branding | `/dashboard/agency/[id]` + `/dashboard/clients` proxy | 🟢 | `clientsRouter`, `clients.service.ts`, `Client` | `hideBuildrik` white-label |
| G03 | Agency theme push | `/dashboard/agency/(tabs)/theme` | 🟢 | `theme.service.ts`, `Workspace.sharedTheme` | Site opt-out via `Site.themeLocked` |
| G04 | Theme rollback | same | 🟢 | `SiteThemeSnapshot` | |
| G05 | Agency reviews inbox | `/dashboard/agency/(tabs)/reviews` | 🟢 | `reviewsRouter`, `ReviewRequest` | Approve/changes-requested |
| G06 | Agency library | `/dashboard/agency/(tabs)/library` | 🟢 | components + user-templates tabs | |
| G07 | Handover | `/dashboard/agency/(tabs)/handover` | 🟢 | `handoverRouter` | Workspace ownership transfer |
| G08 | Edits-require-approval workflow | agency settings | 🟢 | `Workspace.editsRequireApproval`, `publish-approval.ts` | Block at publish time |
| G09 | Approval block at publish | `publish-approval.ts` | 🟢 | `sitesRouter.publish` consults flag | |

## H. Client review surface

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| H01 | Token-gated review page | `/review/[token]` | 🟢 | `app/review/[token]/page.tsx`, `clientReviewRouter` | Account-less |
| H02 | Frozen snapshot render | same | 🟢 | `ReviewRequest.snapshotPages` | Re-render on resend |
| H03 | Approve / request-changes | same | 🟢 | `client-review.service.ts` | |
| H04 | Resend review | per-site | 🟢 | same | Issues fresh token |
| H05 | Token revoke | per-site | 🟢 | `ReviewRequest.revokedAt` | |
| H06 | 90-day expiry | same | 🟢 | `ReviewRequest.expiresAt` | |
| H07 | Reviewer identity capture | first visit | 🟢 | `Reviewer` model | name+email |
| H08 | Invited-email match guard | per-visit | 🟢 | `ReviewRequest.invitedEmail` | Prevents forgeries |
| H09 | Comment pin (x/y + selector) | review surface | 🟢 | `comment.service.ts`, `Comment` | |
| H10 | Comment resolution | same | 🟢 | `Comment.status` OPEN/RESOLVED | |

## I. AI

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| I01 | Onboarding AI site generation | `/onboarding/ai/generating` | 🟢 | `ai-generation.service.ts`, `AIGenerationJob`, worker `/api/workers/ai-generate/[jobId]` | DEFAULT_MODEL constant |
| I02 | AI page generation (pageType+style+tone) | editor | 🟢 | `aiRouter.generatePage` | ANTI-SLOP rules |
| I03 | AI content (text/section/layout) | editor | 🟢 | `aiRouter.generateContent` | |
| I04 | AI edit commands | editor | 🟢 | `aiRouter.generateEditCommands` | `editCommandToRow` |
| I05 | AI page-edit commands | editor | 🟢 | `aiRouter.generatePageEditCommands` | |
| I06 | AI plan generation | editor | 🟢 | `aiRouter.generatePlan` | Multi-step |
| I07 | AI summarize changes | editor | 🟢 | `aiRouter.summarizeChanges` | |
| I08 | AI milestone suggest | editor | 🟢 | `aiRouter.suggestMilestone` | |
| I09 | AI schema generation | editor | 🟢 | `aiRouter.generateComponentSchema` | |
| I10 | AI streaming | editor | 🟢 | `aiRouter.streamContent` | |
| I11 | AI quota reserve + release | router-level | 🟢 | `reserveAiUnit`, `safeReleaseQuota` | Daily + per-tier |
| I12 | AI daily limit + reset | internal | 🟢 | `AIUsage.dayBucket`, `RateLimitBucket` | |
| I13 | AI adoption telemetry | internal | 🟢 | `ai-adoption.service.ts`, `AiAdoptionEvent` | Separate from ActivityLog |
| I14 | AI adoption summary | internal | 🟢 | `ai-adoption.summary.ts` | |
| I15 | Action confirmation grants | internal | 🟢 | `action-confirmation.service.ts`, `ActionConfirmation` | Single-use, session-bound |
| I16 | Alt-text AI (images) | media | 🟢 | `alt-text.service.ts` | |
| I17 | Ollama dev override | internal | 🟢 | `ollama.client.ts`, `resolveModelForUser` | Dev only |
| I18 | OpenAI client (lazy) | internal | 🟢 | `openai.client.ts` | Lazy init |
| I19 | AI settings page (provider, quota, model) | `/dashboard/settings/ai` | 🟢 | `aiRouter` | |

## J. Collaboration

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| J01 | Collab ops POST | `/api/collab/[siteId]/ops` | 🟢 | route, `collab.service.ts`, `CollabOperation` | Server kill-switch via `NEXT_PUBLIC_FEATURE_COLLAB` |
| J02 | SSE collab stream | `/api/sse/collab/[siteId]` | 🟢 | route | seq-based replay |
| J03 | Presence avatars | editor topbar | 🟢 | editor `collaboration/` | Flag-gated |
| J04 | Connection pill | editor | 🟢 | editor chrome | |
| J05 | Remote cursors | editor canvas | 🟢 | editor canvas | |
| J06 | Last-write-wins merge | engine | 🟢 | engine | Flag-gated |

## K. Cron + maintenance

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| K01 | `analytics-aggregate` | cron | 🟢 | route | |
| K02 | `analytics-purge` | cron | 🟢 | route | |
| K03 | `account-deletion` | cron | 🟢 | route | 7-day schedule |
| K04 | `billing-downgrade` | cron | 🟢 | route | |
| K05 | `billing-dunning` | cron | 🟢 | route | invoice.payment_failed |
| K06 | `dns-verify` | cron | 🟢 | route | |
| K07 | `ephemeral-purge` | cron | 🟢 | route | |
| K08 | `form-submission-purge` | cron | 🟢 | route | |
| K09 | `invite-expiry` | cron | 🟢 | route | |
| K10 | `ip-anonymization` | cron | 🟢 | route | |
| K11 | `publish-job-cleanup` | cron | 🟢 | route | |
| K12 | `scheduled-publish` | cron | 🟢 | route | |
| K13 | `session-cleanup` | cron | 🟢 | route | |
| K14 | `soft-delete-purge` | cron | 🟢 | route | |
| K15 | `ssl-check` | cron | 🟢 | route | |
| K16 | `token-cleanup` | cron | 🟢 | route | |
| K17 | `workspace-transfer-expiry` | cron | 🟢 | route | |
| K18 | `ai-job-cleanup` | cron | 🟢 | route | |
| K19 | Maintenance page | `/maintenance` | 🟢 | route | |
| K20 | Dev states | `/dev/states` | 🟢 | route | Dev only |

## L. Editor

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| L01 | Canvas (Composer + 25+ managers) | editor `engine/` | 🟢 | `engine/Composer.ts` | |
| L02 | Canvas renderer | editor `editor/canvas` | 🟢 | `editor/canvas/Canvas.tsx` | |
| L03 | Inspector | editor `editor/inspector` | 🟢 | `editor/inspector/` | Density-aware via `UserPreference.editorDensity` |
| L04 | Sidebar | editor `editor/sidebar` | 🟢 | `editor/sidebar/` | Tabs per section |
| L05 | Top bar | editor `editor/shell` | 🟢 | `editor/shell/Topbar.tsx` | |
| L06 | Layer tree | editor `editor/panels/layers` | 🟢 | `editor/panels/layers` | |
| L07 | History panel | editor `editor/sidebar/tabs/history` | 🟢 | `editor/sidebar/tabs/history` | Server-mirrored |
| L08 | Settings panel (per-site) | editor `editor/sidebar/tabs/settings` | 🟢 | | |
| L09 | Marketplace browser | editor `editor/sidebar/tabs/marketplace` | 🟢 | | Server-backed |
| L10 | Media tab | editor `editor/media` | 🟢 | `editor/media/` | |
| L11 | E-commerce editors | editor `editor/ecommerce` | 🟢 | `editor/ecommerce/` | |
| L12 | Onboarding panel (editor-side) | editor `editor/onboarding` | 🟢 | | |
| L13 | Export | editor `editor/export` | 🟢 | | |
| L14 | Sync | editor `editor/sync` | 🟢 | | |
| L15 | Animation | editor `editor/animation` | 🟢 | | |
| L16 | Collaboration | editor `editor/collaboration` | 🟢 | | Flag-gated |
| L17 | AI panel (in-editor AI) | editor `ai/` + chrome | 🟢 | `ai/`, `services/` | |
| L18 | Publish dropdown | editor topbar | 🟢 | `services/PublishService.ts` | Flag-gated `NEXT_PUBLIC_FEATURE_PUBLISH` |
| L19 | DS-AI entries | editor brand panel | 🟢 | editor sidebar brand | Flag-gated `NEXT_PUBLIC_FEATURE_DS_AI` |
| L20 | Chrome design tokens (`--bk-*`) | editor `themes/` | 🟢 | generated tokens | Figma SSOT |
| L21 | `chrome-ui/` component library | editor `editor/chrome-ui/` | 🟢 | `chrome-ui/` | flowbite-react + `tw:` utilities |
| L22 | Page folders (per-user, server-backed) | editor Pages | 🟢 | `page-folder.service.ts` | |
| L23 | Component library (server-backed) | editor Components panel | 🟢 | `site-component.service.ts` | |
| L24 | Save-as-template (server-backed) | editor | 🟢 | `user-template.service.ts` | |
| L25 | Live preview | editor canvas | 🟢 | engine | |

## M. Webhooks (workspace-scoped)

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| M01 | Workspace webhook endpoint (HMAC-SHA256, `whsec_*`) | settings/integrations | 🟢 | `WorkspaceWebhook`, `webhook.service.ts` | One endpoint per workspace |
| M02 | Subscribed events `site.publish`, `form.submit` | same | 🟢 | `WorkspaceWebhook.events` | |
| M03 | Delivery log | same | 🟢 | `WebhookDelivery` model | Last-4m display |
| M04 | Webhook delivery retry semantics | internal | 🟢 | `webhook.service.ts` | Retry strategy |

## N. Notifications + SSE

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| N01 | Notification bell | editor topbar | 🟢 | | |
| N02 | In-app notifications | `/dashboard/notifications` | 🟢 | `Notification` model | |
| N03 | SSE live updates | `/api/sse/notifications` | 🟢 | route | |
| N04 | Per-category preferences | settings/notifications | 🟢 | `NotificationPref` | |
| N05 | Site-scoped notifications | internal | 🟢 | `Notification.siteId` | editor bell filter |
| N06 | Email-out send | internal | 🟢 | `email.service.ts`, `Notification.emailSent` | |

## O. Storage + uploads

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| O01 | Media upload (presign + PUT + confirm) | `/api/asset-upload` | 🟢 | route, `PendingUpload` model | Serverless-safe (DB-backed, not in-memory) |
| O02 | Asset metadata + dims | internal | 🟢 | `MediaAsset.{width,height,altText,...}` | width/height column added for boards 146:2 / 146:32 |
| O03 | Media folders (tree) | media library | 🟢 | `media-folder.service.ts`, `MediaFolder` | Delete moves assets to root |
| O04 | Media versions (per-asset edits) | media library | 🟢 | `media.service.ts`, `MediaAssetVersion` | Capped per tier |
| O05 | Small-file upload (favicon, og-image) | `/api/upload/[fileId]` | 🟢 | route | Vercel Blob `put()` |
| O06 | Stock photo search (Pexels/Unsplash) | media library | 🟢 | `stock.service.ts` | Optional keys |
| O07 | Site-thumbnail generation | `/api/site-thumbnail/[siteId]` | 🟢 | route | |

## P. Marketplace + integrations

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| P01 | Marketplace browse | `/dashboard/marketplace` + editor | 🟢 | `marketplaceRouter`, `lib/marketplace-catalog.ts` | Install + configure |
| P02 | WorkspaceApp install | settings/integrations | 🟢 | `WorkspaceApp` model | Per-app config JSON |
| P03 | WorkspaceIntegration (third-party OAuth) | settings/integrations | 🟢 | `WorkspaceIntegration` model | e.g., Vercel |
| P04 | Vercel OAuth flow | `/api/integrations/vercel/{authorize,callback}` | 🟢 | routes | |
| P05 | Stripe Checkout session | `/dashboard/settings/billing` | 🟢 | `billingRouter.createCheckoutSession` | Customer resolved/created; NEVER sets plan to ACTIVE on this call (security invariant `billing.service.ts:190`) |
| P06 | Stripe Customer Portal | settings/billing | 🟢 | `billingRouter.createPortalSession` | |
| P07 | Stripe webhook (5 events) | `/api/webhooks/stripe` | 🟢 | `stripe-webhook.service.ts` | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed` |
| P08 | Webhook idempotency | `/api/webhooks/stripe` | 🟢 | `ProcessedWebhookEvent` ledger | |

## Q. CMS

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| Q01 | CMS collection list | editor | 🟢 | `cmsRouter.listCollections`, `cms.service.ts` | Per-site |
| Q02 | CMS collection upsert (create/update) | editor | 🟢 | `cmsRouter.upsertCollection` | |
| Q03 | CMS collection delete | editor | 🟢 | `cmsRouter.deleteCollection` | |
| Q04 | CMS entry list | editor | 🟢 | `cmsRouter.listEntries` | |
| Q05 | CMS entry upsert | editor | 🟢 | `cmsRouter.upsertEntry` | Defense-in-depth DOMPurify on write |
| Q06 | CMS entry delete | editor | 🟢 | `cmsRouter.deleteEntry` | |
| Q07 | CMS CSV import | editor | 🟢 | `cmsRouter.importCsv` | Bounded by `CSV_IMPORT_MAX_*` |
| Q08 | CMS dynamic-page binding (pageSlugPattern) | collection settings | 🟢 | `CmsCollection.{pageSlugPattern,pageTemplatePath,...}` | `findStaleTemplateBindings` invoked at publish |
| Q09 | CMS appendDynamicPagesToPublish | publish pipeline | 🟢 | `cms.service.ts` | Rendered per entry |
| Q10 | CMS entry publish status (DRAFT/PUBLISHED) | editor | 🟢 | `CmsEntry.status` | |
| Q11 | CMS server sanitize (markup-strip + sink escape) | write + render | 🟢 | `sanitizeEntryData`, `substituteOutsideScriptStyle` | URL scheme check at substitution sink |

## R. Other

| # | Feature | Path | Status | Evidence | Notes |
|---|---|---|---|---|---|
| R01 | Privacy policy | `/privacy` | 🟢 | route | |
| R02 | Terms of service | `/terms` | 🟢 | route | |
| R03 | Support ticket | `/dashboard/help` | 🟢 | `SupportTicket` model | |
| R04 | Workspace transfer accept | `/transfer/accept` | 🟢 | `WorkspaceTransfer` model | |
| R05 | Account deletion request | `/dashboard/settings/danger` | 🟢 | `AccountDeletionReq`, `cron/account-deletion` | 7-day schedule |
| R06 | Sentry server | internal | 🟢 | `sentry.server.config.ts` | Init only when `NODE_ENV=production` |
| R07 | Sentry edge | internal | 🟢 | `sentry.edge.config.ts` | |
| R08 | Sentry client | internal | 🟢 | `sentry.client.config.ts` | Skipped when `NEXT_PUBLIC_SENTRY_DSN` unset |
| R09 | Workspace-level webhooks | settings/integrations | 🟢 | `WorkspaceWebhook` | HMAC-SHA256 |

## Gated-off features (per `flagged-features-are-planned-not-dead.md`)

| Feature | Flag | Default | Owner stance |
|---|---|---|---|
| Publish dropdown + flow (editor) | `NEXT_PUBLIC_FEATURE_PUBLISH` | `false` in dev, `true` once pipeline live | FLAGGED-VIABLE |
| Real-time collab (server + UI) | `NEXT_PUBLIC_FEATURE_COLLAB` | `false` | FLAGGED-VIABLE; gate wired to bundle + server routes |
| DS-AI entry points | `NEXT_PUBLIC_FEATURE_DS_AI` | `false` | FLAGGED-VIABLE |
| Design (next arc) | `NEXT_PUBLIC_FEATURE_DESIGN` (paraphrased) | — | PLANNED — listed in current board inventory |

## Feature-flag wiring (VITE_/NEXT_PUBLIC_ trap)

Every editor flag is read twice (`packages/editor/src/shared/utils/runtimeEnv.ts:85-101`): `VITE_FEATURE_X ?? NEXT_PUBLIC_FEATURE_X`. Only the `NEXT_PUBLIC_` half reaches production. Bundling is the gate.
