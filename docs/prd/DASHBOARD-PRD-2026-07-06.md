# Buildrik Dashboard — Product Requirements Document (reverse-engineered)

## 1. Header

| | |
|---|---|
| **Source repo** | `/Users/shahg/Desktop/pencil/buildrik` (pnpm monorepo) |
| **Package in scope** | `@buildrik/dashboard` (`packages/dashboard`) + `server/`, `lib/`, `prisma/` |
| **Branch / HEAD** | `main` @ `e5624ca1` (HEAD commit dated 2026-07-05) |
| **Generated** | 2026-07-06 |
| **Stack** | Next.js 16 (App Router) · React 19 · Tailwind 4 · tRPC 11 · NextAuth 5 · Prisma 5 · PostgreSQL · Resend · Zod (`CLAUDE.md`) |
| **Data-flow contract** | Page → tRPC router → Service → Prisma (`CLAUDE.md`; routers never touch Prisma except noted inline reads) |
| **Method** | Reverse-engineered from code. Nothing invented. Uncertainty marked `[TBC]`. Every concrete claim cites `file:line`. |

**Scope:** the *dashboard* surface — "run the business" (home, sites mgmt, team, billing, settings, notifications, help, agency layer) + "start a site" + onboarding. The editor package (`packages/editor`) and the public marketing site are out of scope.

---

## 2. Executive summary

Buildrik's dashboard is the account/workspace chrome around an AI website builder: it lets a solo designer or agency create sites (blank / template / AI), manage them across a workspace, run a team, and administer settings — with an agency layer (clients, white-label, shared-theme push, client reviews) built behind the `agency_layer` feature flag. The security-authorization hardening plan is substantially shipped, and the surface breadth is high (≈35 routes, full state components).

**The single biggest risk: the product cannot take money or measure itself.** `billing.upgrade` permanently throws `PAYMENTS_NOT_CONFIGURED` (`server/services/billing.service.ts:158,173`) — there is no Stripe Checkout session creation, so no FREE→PRO/BUSINESS conversion can occur; the entire plan-limit/paywall system (§8) gates usage toward an upgrade that doesn't exist. Compounding it, **there is no product analytics** — greps for posthog/segment/mixpanel/amplitude/gtag return zero (§4); the only telemetry is env-gated Sentry plus a 3-event AI-adoption log. The business is monetization-blocked *and* funnel-blind at the same time.

---

## 3. Users & jobs

| User type | Entry path | Job to be done |
|---|---|---|
| **Solo designer (workspace owner)** | Signup → onboarding role/setup (`app/onboarding/role/page.tsx:7`, `setup/page.tsx:8`) | Create + run client sites without Webflow/Framer overhead |
| **Invited team member** (ADMIN / EDITOR / DESIGNER / VIEWER) | Invite email → `acceptInvite` (`server/trpc/routers/auth.ts:226`) | Edit the sites they're granted; VIEWER = read-only |
| **Agency owner** | Onboarding "agency" turns on `agency_layer` flag (`project-setup.tsx` via `onboarding/setup/page.tsx:41`) | Manage clients, white-label, push shared theme, run client reviews |
| **External client / reviewer** | Share link `app/share/[token]/page.tsx` | Review a site and sign off — **currently dead-ends** (§13-A) |
| **Workspace admin** | Dashboard → Team / Billing / Settings | Seats, roles, plan, workspace config |

---

## 4. Success metrics — REQUIRED *(proposed — NOT instrumented)*

**Finding #1: there is no product/funnel analytics in the codebase.** Explicit greps for `posthog|segment|mixpanel|amplitude|gtag|datadog|logrocket|heap` across `server/ lib/ packages/dashboard/ src/` returned **zero** (scan 3). No signup→activation→conversion event stream exists. What exists:
- **Sentry** — error monitoring only, env-gated (`packages/dashboard/instrumentation.ts:12`; `tracesSampleRate 0.1`); **editor-route errors not even wired** (TODO `EditorClient.tsx:19`, `EditorErrorBoundary.tsx:26`).
- **AI-adoption log** — exactly 3 first-party events `edit.applied | edit.reverted | agent.run` (`packages/shared/schemas/ai-adoption.ts:15-19`), ingested via `ai.logAdoption` (`server/trpc/routers/ai.ts:412`). Structural metrics only; covers AI-edit trust, nothing about onboarding/billing/publish/retention.
- **Site traffic analytics** (`server/services/analytics.service.ts`) — a *customer-facing feature*, not internal PM telemetry.
- **Audit log** — security trail (`logAuditEvent`), not a funnel.

**Proposed metric set (to instrument):**

| Metric | Definition | Proposed target |
|---|---|---|
| Onboarding completion | users reaching `OnboardingStep.COMPLETED` / signups (`onboarding.service.ts:111`) | ≥ 70% |
| Time-to-first-site | signup → first `Site` row (`sites.service.ts:163`) | < 10 min median |
| Activation (first publish) | workspaces with ≥1 `PUBLISHED` site within 7d | ≥ 40% |
| Checklist completion | `dashboardTasks` all-done rate (`onboarding.service.ts:99`) | ≥ 50% |
| Invite acceptance | `INVITE_ACCEPTED` / invites sent (`auth.ts:286`) | ≥ 60% |
| FREE→paid conversion | plan transitions FREE→PRO/BUSINESS | **unmeasurable + impossible today** (payments off, §2) |
| Near-limit → upgrade | `isNearLimit` (`dashboard.ts:99`) sessions that convert | instrument once payments live |

Whole section marked **(proposed — not instrumented)**. Naming the absence is the finding.

---

## 5. User journeys (as built)

1. **Onboarding** — `role` (pick editor *density*, not persona) → `setup` (project name + method) → site creation → dashboard 7-task checklist. Read-repair skips `EDITOR_TOUR` (`onboarding.service.ts:38-55`).
2. **Run the business** — `/dashboard` home (stats, activity, quick actions, health, needs-attention, dunning) → Sites / Team / Billing / Settings.
3. **Start a site** — `/dashboard/sites/new` → blank | template gallery | AI 3-step wizard → opens editor (`sites/new/page.tsx:77,88,93`).
4. **Manage a site** — `sites/[id]` shell → Overview / Settings / SEO / Domains / Redirects / Access / Analytics / Publish tabs.
5. **Agency (flag `agency_layer`)** — Clients → assign sites + white-label → Shared-theme capture/push → Reviews/Comments sign-off (agency side only; client side broken).
6. **Publish** — pre-publish checks → SSE progress (cancel/retry) → success with URLs.

---

## 6. Functional requirements (per surface; defects inline)

Validation SSOT lives in `packages/shared/schemas/`; components add inline/client validation.

### Home — `app/dashboard/page.tsx:21`
Stat cards (Total/Published/Visits/Collaborators `:188-235`), QuickActions `:239`, RecentSites `:242`, ActivityFeed all/mine/team `:249`, WorkspaceHealth (only when a metric >50% `:58`), NeedsAttention (agency `:178`), Checklist FAB `:272`. Banners: dunning `:124`, workspace-deletion grace `:137`, account-deletion grace `:154`. States: loading `:66`, **error** `:101`, role-variant empty `:180`.
- **DEFECT (broken link):** `EmptyState` `editor_no_sites` CTA → `/dashboard/settings/team` which does not exist (`components/dashboard/empty-state.tsx:53`; real route `/dashboard/team`).

### My Sites — `app/dashboard/sites/page.tsx:22`
Grid/list toggle `:326`, folder tabs incl. Archived `:343`, advanced filters `:364`, bulk bar (cap **25**, `bulk-action-bar.tsx:16`), pagination `:475`. Actions `handleSiteAction:229`: edit/manage/rename/duplicate/archive/delete/transfer/copyUrl/viewPublished. Validation: `createSiteSchema` name 2–100 + method enum (`schemas/sites.ts:3`), slug min3/max50/regex (`:51`), folder 1–50 (`:37`), bulk 1–25 ids (`:41`). States: loading `:389`, **error** `:403`, filtered-empty vs true-empty `:414/:424`.

### Create Site — `app/dashboard/sites/new/page.tsx:19`
Views: choose → template gallery/preview | AI wizard | blank. AI wizard: type (Next disabled until selected `ai-wizard/step-type.tsx:49`), pages 1–8 + description ≤500 (Home locked `step-pages.tsx:47`), progress polls 2s `:67`. Credits-exhausted → upgrade/template modal `:99`. CreateSiteModal: live slug `:56`, at-limit paywall `:69`, AI credits `:99`.

### Site Detail shell — `sites/[id]/layout.tsx:10`
Tabs Overview/Settings/SEO/Domains/Redirects/Access/Analytics (`tab-nav.tsx:7`). SiteHeader: View Site (disabled if unpublished `:46`), Edit, Publish (DRAFT only `:58`), Unpublish (PUBLISHED only `:61`). States: loading `:32`, not-found `:42` (no error/denied at shell).
- **Overview** `overview-tab.tsx:79` — stat boxes, health breakdown, form blocks + submissions table w/ CSV export `:145`; states loading/error/empty ✔.
- **Settings** `settings-tab.tsx:34` — general, favicon upload (presign→PUT→confirm `:62`), **Pro-gated** password `:226` + custom code `:264`, social links. **DEFECT: returns `null` on no data — no error state** (`page.tsx:26`).
- **SEO** `seo-tab.tsx:30` — read-only preview + editable Technical SEO (canonical/indexing/robots); loading + **error** ✔.
- **Domains** `domains-tab.tsx:43` — connect (FREE→paywall `:49`), DNS records, set-primary; poll 30s. **No error / no explicit empty state.**
- **Redirects** `redirects-tab.tsx:25` — from/to/301|302, CSV import/export, plan gate. **No error state**; `canEdit` hardcoded `true` (`page.tsx:50`). Missing "saved, not live" notice (spec F4).
- **Access/Sharing** `access-tab.tsx:87` — share links (name/password/expiry chips gated by plan), QR per link. **No error state.** Note: share links ≠ access control `:112`.
- **Analytics** `analytics-tab.tsx:34` — range chips, bar chart, sources/countries/devices. **No error state.**
- **Publish** `sites/[id]/publish/page.tsx:12` — pre-publish checks (Publish disabled unless `checks.ready`), SSE progress w/ cancel+retry, success w/ URLs.
  - **DEFECT (broken link):** PublishSuccess "Share with Client" → `/dashboard/sites/${id}/sharing`; real segment is `access` → 404 (`publish-success.tsx:73`).

### Team — `app/dashboard/team/page.tsx:15`
Stat cards, sortable members table + role picker (`members-table.tsx:165`), pending invites resend/revoke, activity, invite modal. Invite validation: email regex + max-10 (`invite-modal.tsx:33`), backend `inviteMembersSchema` emails 1–10, role∈{ADMIN,EDITOR,DESIGNER,VIEWER}, message ≤500 (`schemas/team.ts:3`). States: loading/error/empty ✔.

### Media — `media-library.tsx:26`
`@vercel/blob/client` upload → `createAsset:47`, search, folders, storage quota footer w/ 80% warning `:176`. **No error state** for asset query.

### Billing — `app/dashboard/billing/page.tsx:76`
PlanCard, UsageBars (**bandwidth omitted — no pipeline** `:56`), PaymentMethodCard, InvoiceTable, dunning `:192`, cancel→CancelModal. Prices from `PLAN_LIMITS` SSOT `:29`. States loading/error ✔.
- **Intentional "not live":** "Payment processing coming soon" `:159`; upgrades disabled (`plan-comparison.tsx:240`); interval switch removed to avoid desync `:239`; card update "coming soon" (`payment-method-card.tsx:112`).

### Settings (tabs: Profile/Account/Security/Notifications/Workspace/Integrations/API Tokens/AI & Credits/Danger)
- **Profile** `profile-form.tsx:64` — avatar upload (presign `:91`), name/bio(≤500)/lang/tz; email read-only. No error state.
- **Account** `account-tab.tsx:68` — change/set password (inline match+min8), change email (inline), connect/disconnect Google/GitHub.
- **Security** `security-tab.tsx:31` — 2FA enable (QR→backup→verify6), sessions, login history.
  - **DEFECT (dead control):** `security/page.tsx:6` passes no `currentSessionId` → "Revoke all other sessions" early-returns (dead button `:108`); "Current" badge never renders `:426`; current session shows a live Revoke `:449`.
- **Workspace** `workspace-form.tsx:80` — general, branding (accent hex validated), collaboration approval, sharing; transfer ownership; delete (type-to-confirm, real mutation `:113`).
- **Integrations** `integrations-tab.tsx:331` — Vercel OAuth + GA/Mailchimp/Zapier/Slack cards; team picker server route `:22`.
- **API Tokens** `api-tokens-tab.tsx:39` — create (name+scopes+expiry), shown-once plaintext. No error state.
- **AI & Credits** `ai-credits-tab.tsx:49` — usage, generate CTA (disabled at 0), history; **4 permanently-disabled "Coming Soon" cards** `:204`.
- **Danger Zone** `danger-zone-tab.tsx:53` — export, delete-account (type "DELETE").
  - **DEFECT (dead guard):** sole-owner/active-sub pre-check block never renders — `danger/page.tsx:20` never passes `isSoleOwner`/`hasActiveSubscription` props `:177`.

### Onboarding — `app/onboarding/`
`role` = editor density Simple/Advanced (reversible pref, not persona) → `setup` = solo/agency (agency flips `agency_layer`) + project name 2–100 + method ai/template/blank.

### Agency (flag `agency_layer`; strongest state coverage — all use `DeniedState` when off)
Clients CRUD + white-label branding (`prisma/schema.prisma:466`), Client detail assign/branding/scoped-invite, Comments queue, Reviews approve/request-changes, Shared-theme capture/push. **Client-side sign-off broken** (§13).

---

## 7. State machines

All status/role/plan columns are Prisma **`String`** (no native DB enums) — values enforced only at the Zod boundary + `lib/constants/enums.ts`.

| Machine | States | Transitions (file:line) | Dead states |
|---|---|---|---|
| **SiteStatus** (`enums.ts:36`) | DRAFT · PUBLISHED · ARCHIVED | create→DRAFT (`sites.service.ts:197`); archive→ARCHIVED `:457`; unarchive→DRAFT `:464`; publish→PUBLISHED (job pipeline **or** bulk direct `:587`); unpublish→DRAFT `:594`; delete = soft `deletedAt` | — (but **two publish paths**, §13-A) |
| **InviteStatus** (`enums.ts:48`) | PENDING · ACCEPTED · DECLINED · EXPIRED | PENDING→ACCEPTED (`auth.ts:283`); PENDING→EXPIRED (cron `api/cron/invite-expiry/route.ts:13`); revoke = row **deleted** | **DECLINED never written** — dead |
| **SubscriptionStatus** (`enums.ts:66`) | ACTIVE · PAST_DUE · CANCELLED · INCOMPLETE | Stripe webhook →PAST_DUE `:19`, →CANCELLED `:86` | **INCOMPLETE never assigned** — dead |
| **OnboardingStep** (`enums.ts:248` + dup `onboarding.service.ts:4`) | ROLE_SELECT → PROJECT_SETUP → SITE_CREATION → EDITOR_TOUR → CHECKLIST → COMPLETED | linear `nextStep:15`; read-repair SITE_CREATION→CHECKLIST `:38` | **EDITOR_TOUR effectively unreachable** (tour procs removed `onboarding.ts:76`) |
| **MemberStatus** (`enums.ts:55`) | ACTIVE · SUSPENDED | ACTIVE→SUSPENDED via revoke (`team.service.ts:168`) | **No un-suspend path** — SUSPENDED terminal (only delete removes row) |
| **DomainStatus** (`enums.ts:85`) | PENDING · VERIFIED · FAILED | PENDING→VERIFIED (`domain.service.ts:99`) | — |

---

## 8. Business & plan rules — REQUIRED

**SSOT: `lib/constants/plan-limits.ts` (`PLAN_LIMITS`, lines 26-90).** Tiers `FREE | PRO | BUSINESS`; `-1` = unlimited.

| Rule | FREE | PRO | BUSINESS | Enforced at |
|---|---|---|---|---|
| sites | 3 | 15 | 50 | `sites.service.ts:174,362`; downgrade reconcile `billing.service.ts:184` |
| pagesPerSite | 10 | 30 | 50 | `page.service.ts:64` |
| customDomains | 0 | 3 | 20 | `domain.service.ts:53` |
| teamMembers (seats) | 1 | 5 | 25 | `team.service.ts:70,97` (throws `TEAM_LIMIT`) |
| storageMB | 500 | 5120 | 51200 | `media.service.ts:135,476` (FORBIDDEN on upload) |
| bandwidthMB | 1024 | 10240 | 102400 | **declared, no enforcement found `[TBC]`**; `usedMB` hardcoded 0 (`dashboard.service.ts:374`) |
| aiGenerations | 3 | 20 | ∞ | `account.service.ts:340` |
| aiPromptsPerDay | 10 | 200 | ∞ | atomic reserve `quota.service.ts:58-100`, UTC reset |
| fileUploadMaxMB | 10 | 50 | 200 | media upload |
| formSubmissions | 100 | 2500 | ∞ | `form-submission.service.ts:42` |
| urlRedirects | 100 | 500 | ∞ | redirect service |
| integrations | 0 | 2 | ∞ | integration gate |
| analyticsRetentionDays | 7 | 30 | 90 | analytics window |
| shareLinkExpiryMaxDays | 7 | 30 | 90 | `share-link.service.ts:35` (throws `EXPIRY_EXCEEDS_PLAN`) |
| shareLinkPasswords | ✗ | ✓ | ✓ | `share-link.service.ts` (throws `PASSWORD_LINKS_NOT_AVAILABLE`) |
| assetVersionsCap | 5 | 25 | 100 | media versions |
| **priceMonthly (USD)** | 0 | 29 | 79 | `plan-limits.ts:45/66/87` |
| **priceYearly (USD/mo)** | 0 | 23 | 63 | `plan-limits.ts:46/67/88` |

**AI model policy** (`PLAN_MODELS` `plan-limits.ts:103-121`, server-authoritative `quota.service.ts:119`): FREE→haiku-4-5, PRO→sonnet-4-6, BUSINESS→opus-4-7; lower tier requesting premium silently downgraded.

**SSOT leaks (hardcoded, NOT in `PLAN_LIMITS` — repricing hazard):**
- Share links per site: FREE=**3**, paid=∞ — hardcoded `share-link.service.ts:48` (throws `SHARE_LINK_LIMIT`).
- Near-limit nudge at **80%** (`dashboard.ts:99`).
- bcrypt cost 10 for share-link passwords (`share-link.service.ts:59`).
- Invite resend max **2** (`team.service.ts:200`).

**TTLs / lockouts / rate limits (security-numeric):**

| Rule | Value | file:line |
|---|---|---|
| Login IP rate limit | 5 / 5 min | `server/auth.config.ts:11,44` |
| Account lockout | 5 fails → 15 min | `rate-limit.service.ts:3,22` |
| Auth "strict" limiter | 5 / 15 min | `routers/auth.ts:19` |
| Auth "normal" limiter | 10 / 15 min | `auth.ts:21` |
| Privileged-action limiter | 20 / 60s | `routers/actions.ts:28` |
| Email-verify token | 24 h | `auth.service.ts:171` |
| Password-reset token | 1 h | `auth.service.ts:231` |
| Magic-link token | 15 min | `auth.service.ts:259` |
| 2FA temp / session-grant | 5 min | `auth.service.ts:143`; `auth.ts:47` |
| Team invite | 7 days | `team.service.ts:105` |
| Workspace transfer | 48 h | `workspace-transfer.service.ts:34` |
| Session cookie maxAge | 30 days | `auth.config.ts:172` |

Rate limiter is **Postgres-backed atomic upsert**, shared across serverless instances (`server/services/rate-limiter.ts:10-41`).

---

## 9. API surface (condensed; validation SSOT `packages/shared/schemas/`)

Root: `server/trpc/router.ts:31`. All dashboard procedures use `protectedProcedure` (`trpc.ts:87` — denies bearer tokens; API tokens must use `scopedProcedure`).

| Router | Key procedures | Authz |
|---|---|---|
| `dashboard` (`routers/dashboard.ts`) | stats, recentSites, attentionQueue, activity, health, quickActions | member of workspace |
| `sites` (`sites.ts`) | list/get/create/rename/duplicate/archive/unarchive/delete/bulk/checkSlug/transfer/publish/unpublish/saveProject(Data)/folders.* | per-op role: read=member, edit=EDITOR, settings=ADMIN, destructive=OWNER |
| `team` (`team.ts`) | stats/list/auditLog/invite/changeRole/revoke/delete/pendingInvites/revokeInvite/resendInvite | mutations = `requireAdmin` (ADMIN) |
| `billing` (`billing.ts`) | overview/plans/usage/invoices/upgrade/cancel/switchInterval/reactivate | protected; **`upgrade` always throws `PAYMENTS_NOT_CONFIGURED`** |
| `account` (`account.ts`) | profile/changeEmail/changePassword/2FA/sessions/notifications/preferences/workspace.*/integrations/dangerZone | userId-scoped; workspace.update = ADMIN |
| `onboarding` (`onboarding.ts`) | getState/selectRole/setupProject/completeStep/completeDashboardTask/dismiss | protected |
| `theme` (`theme.ts`) | getShared/capture/push/setLock/**previewPush**/**rollback**/**snapshots**/presets.* | agency (`agency_layer`) |
| `reviews`/`comments`/`clients`/`notifications`/`help`/`api-tokens` | sign-off, comment queue, client CRUD+branding, SSE notifications, support tickets, token mgmt | flag/role/user-scoped |

Full input schemas in scan appendix; e.g. `listSitesSchema` (`schemas/sites.ts:19`) = page/perPage(1-50)/status/sort/search/folderId/clientId/dateRange/hasCustomDomain/hasTraffic.

---

## 10. Enums (with drift)

Source: `lib/constants/enums.ts` (`as const`; no DB enums). Full values in §7 + §3. **Drift flags:**
1. **`OnboardingRole` {FREELANCER,SMALL_TEAM,AGENCY} is fully dead** — zero consumers; the `OnboardingState.role` column actually stores editor **density** `"full"/"fewer"` (`onboarding.service.ts:71`). Misleading column name.
2. **Dead states:** `InviteStatus.DECLINED`, `SubscriptionStatus.INCOMPLETE`, `OnboardingStep.EDITOR_TOUR` (§7).
3. **Creation-method case drift:** DB constants UPPERCASE `BLANK/TEMPLATE/AI` vs input schemas lowercase `blank/template/ai` (`schemas/sites.ts:5`); onboarding stores lowercase.
4. **DB statuses with no app-constant:** `Comment (OPEN|RESOLVED)`, `ReviewRequest (PENDING|APPROVED|CHANGES_REQUESTED)`, `CmsEntry (DRAFT|PUBLISHED)`, `PublishBuildJob (QUEUED|BUILDING|DEPLOYING|FAILED)` — string literals only.
5. **Sequence duplicated** in `enums.ts:248` and `onboarding.service.ts:4` (two SSOTs).
6. `DESIGNER` shares `EDITOR` rank exactly (rank 1, `permission.service.ts:7`) — intentional, no design-only capability.

---

## 11. Non-functional

**Security posture — strong, hardening plan (`docs/plans/2026-06-09-001-...`) substantially shipped:**
- Edge middleware decodes the JWT (not mere cookie presence) `middleware.ts:51`; workspace-switch IDOR-guarded (`auth.config.ts:134`).
- `protectedProcedure` denies bearer; bearer fails closed (`trpc.ts:34`). RBAC ranks VIEWER0<EDITOR/DESIGNER1<ADMIN2<OWNER3 (`permission.service.ts:4`).
- Fixed + verified: VIEWER-edit at both router (`pages.ts:27`) **and page loader** (`app/edit/[siteId]/page.tsx:20` → `userCanEditSite` → `notFound()` for VIEWER; test `userCanEditSite.test.ts:47` asserts viewer→false), invite email-mismatch (`auth.ts:259`), team IDOR (`team.ts:32`), account/session IDOR (`account.ts:115`).
- **Rate limiting is Postgres-backed** (atomic upsert into `rate_limit_buckets`, `rate-limiter.ts:21`) — cross-serverless-instance-safe. The hardening plan's "H5 wire Redis" was resolved *this way* instead; no Redis/Upstash dependency exists (confirmed: zero `upstash|redis` references).

**Resilience layer (a real strength):** 18 cron jobs (`app/api/cron/*`) — `billing-dunning`, `invite-expiry`, `ssl-check`, `publish-job-cleanup`, `session-cleanup`, `token-cleanup`, `soft-delete-purge`, `workspace-transfer-expiry`, `ai-job-cleanup`, `ip-anonymization`, etc. Background hygiene is not an afterthought here.

**Known debt / residual risk (all confirmed in code, no open `[TBC]`):**
- **No product analytics** (§4) — the single biggest measurement hole. **Editor errors not sent to Sentry** (TODOs `EditorClient.tsx:19`, `EditorErrorBoundary.tsx:26`).
- **Payments not integrated** — upgrade stubbed (§2).
- **Published-site password** enforcement depends on external Vercel deployment protection, asserted in a code comment but not implemented in-repo (`app/share/[token]/page.tsx:11-13`) — the share verify-cookie path is real, the published-render boundary is not. **Decision-open, not unknown.**
- **`bandwidthMB`** declared (`plan-limits.ts:33`) but has **no tracking pipeline** — `usedMB` hardcoded 0 and the code says so (`billing.service.ts:39` comment); the UI hides the bar. Honest stub, not a silent bug.
- **Team router uses first-membership, not active workspace** (`team.ts:22` `findFirst` by userId) — multi-workspace users can act on the wrong workspace.
- **Bulk-publish bypasses the deploy pipeline** — `bulkAction` "publish" does `updateMany status:"PUBLISHED"` directly (`sites.service.ts:587`), no `PublishBuildJob`. Status flips without a real build.
- Dead states + broken links + dead controls (§13).

---

## 12. Spec-vs-built delta — REQUIRED

Docs read: `docs/prd/BUILDRIK-PRD-COMPLETE.md` (scoped to Auth/Onboarding; billing+team "out of scope" `:41`), `docs/reviews/2026-06-19-ceo-review-dashboard.md`, `docs/plans/2026-06-09-001-fix-dashboard-authz-hardening-plan.md`, `design-gaps-extensibility-audit-20260630.md`, `complete-feature-list-20260623.md`. Git recency: last 15 touches on `packages/dashboard`+`docs` are **mostly docs/spec work** — dashboard feature-code has quieted.

### Shared-theme "change contract" (CEO review keystone)
| Item | Status | Evidence |
|---|---|---|
| Capture + push, partial-fail tolerant | **BUILT** | `theme.ts:82,112` |
| Per-site lock (excluded from push) | **BUILT** | `theme.ts:96`; `theme-manager.tsx:212` |
| Confirm dialog w/ baked count "Push to N" | **BUILT** | `theme-manager.tsx:104-147` |
| **Item 1 — dry-run / blast-radius** (`previewPush`) | **PARTIAL — backend built, UI orphan** | `theme.ts:126`; **0 UI callers** |
| **Item 3 — push-time per-site override resolution** | **SPEC-ONLY** | `ceo-review:46`; UI offers only pre-set lock (the flagged footgun) |
| **Item 4 — push history (`ThemePushRun`)** | **NOT BUILT** | no such Prisma model; result is ephemeral React state |
| **Item 5 — per-site rollback** | **PARTIAL — backend built, UI orphan** | `theme.ts:140`, `SiteThemeSnapshot` `schema:297`; 0 UI callers |

### Dashboard home + platform
| Item | Status | Evidence |
|---|---|---|
| 7-task activation checklist | BUILT | `dashboard-checklist.tsx`, mounted `page.tsx:272` |
| **Invited-member 3-task variant** | **SPEC-ONLY / orphan** | coded but never mounted with `variant` prop (`page.tsx:273`) |
| Resume-cap / snooze rules | SPEC-ONLY | `08-dashboard-checklist.md:32` |
| Account/API-tokens/2FA/sessions | BUILT | `components/settings/*`, `api-tokens.ts` |
| Team invite/roles/revoke/transfer | BUILT | `team.ts`, `workspace-transfer.service.ts` |
| Clients + white-label (agency wedge) | **BUILT, flag-OFF** | `clients.ts:28`, branding `schema:466` |
| Notifications (SSE), Integrations (Vercel OAuth) | BUILT (env-gated) | `notifications.ts`, `vercel-oauth.service.ts` |
| Billing usage/invoices/plans | BUILT | `billing/page.tsx:82` |
| **Upgrade / paywall / payment** | **PARTIAL — cosmetic stub** | `billing.service.ts:158,173` throws |
| Sites list/detail/bulk | PARTIAL | bulk-publish = DB flip not real deploy; move/export no backend |
| New-site blank/template/**AI** | BUILT, env-gated | `sites/new/page.tsx:93` (doc-internal drift on AI status) |

### Authz hardening plan (verified — no open `[TBC]`)
C1 role-gate mutations **BUILT** (`pages.ts:27`) AND the **edit-page loader VIEWER-block is BUILT + tested** (`app/edit/[siteId]/page.tsx:20` → `userCanEditSite` → `notFound()`; `userCanEditSite.test.ts:47` asserts viewer→false — resolves the two-agent contradiction: the earlier "not found" grep looked for `checkSiteRole` and missed `userCanEditSite`). H1/H2/H3 IDOR fixes **BUILT**. H4 published-site password **PARTIAL** — decision-open (external Vercel protection). H5 Redis limiter **resolved differently** — Postgres-backed limiter (`rate-limiter.ts:21`), cross-instance-safe, no Redis dependency.

### Client sign-off
Agency side **BUILT** (`reviews.ts:44-69`); **client-side approve/reject SPEC-ONLY/broken** — share page just redirects (`share/[token]/page.tsx:35`), P1 dead-end (`design-gaps-20260630.md:16`).

**Biggest built-but-invisible surprise:** the whole agency wedge (clients, shared-theme incl. preview/rollback/preset-library `theme.ts:167`, reviews) ships **dark behind `agency_layer`** — richer than spec, but flag-off.

---

## 13. Gaps & decisions register

**A — broken / dead in code**
- A1. `billing.upgrade` throws `PAYMENTS_NOT_CONFIGURED` — no Stripe Checkout (`billing.service.ts:173`).
- A2. Broken links → 404: publish "Share with Client"→`/sharing` (real `access`) (`publish-success.tsx:73`); home editor-empty CTA→`/dashboard/settings/team` (`empty-state.tsx:53`); billing "Invite member"→same bad route (`usage-bars.tsx:17`).
- A3. Dead control: Security "Revoke all other sessions" (missing `currentSessionId`, `security/page.tsx:6`).
- A4. Dead guard: Danger-zone sole-owner/active-sub warnings never render (`danger/page.tsx:20`).
- A5. Dead states: `InviteStatus.DECLINED`, `SubscriptionStatus.INCOMPLETE`, `OnboardingStep.EDITOR_TOUR`, `OnboardingRole` enum, MemberStatus un-suspend.
- A6. `bandwidthMB` limit unenforced; `usedMB` hardcoded 0.
- A7. Theme preview/rollback backends have **no UI callers**; invited-member checklist variant never mounted.
- A8. Two publish paths (`bulk` direct-flip vs job pipeline) can diverge.

**B — product decision needed**
- B1. Turn payments on (Stripe) — or explicitly stay free? Everything gates toward an upgrade that can't happen.
- B2. Ship `agency_layer` on, or keep dark? The differentiated wedge is built but invisible.
- B3. Wire the theme push-time safety (CEO items 3/4/5) — mostly UI-wiring of existing backend.
- B4. Instrument a product-analytics funnel (§4) — pick a provider.
- B5. Client-side sign-off flow — build it or drop the "review" promise.

**C — security**
- C1. Published-site password boundary depends on external Vercel deployment protection, asserted in a comment but not implemented in-repo (`app/share/[token]/page.tsx:11`). **Decision-open** — enforce at publish or drop the feature.
- C2. Team router uses first-membership, not active workspace (`team.ts:22`) — cross-workspace action risk for multi-workspace users. **Real bug, low-effort fix** (use `resolveWorkspaceId`).
- C3. ~~Edit-page loader VIEWER-block~~ **RESOLVED** — loader blocks VIEWER via `userCanEditSite` (`app/edit/[siteId]/page.tsx:20`), covered by test. No action.

**D — spec-only (from §12)**
- D1. Theme push history (`ThemePushRun`), push-time override resolution, resume-cap checklist rules, invited-member checklist variant.

**E — design↔code drift** *(Figma `M2 · Onboarding` in scope this session)*
- E1. **Persona vs density mismatch.** Figma M2 `S1` asks "What best describes you?" with persona options (Web Designer / Freelancer …) — reads as a *persona* picker. Code stores editor **density** (`"full"/"fewer"`) in the `OnboardingState.role` column (`onboarding.service.ts:71`), and the `OnboardingRole {FREELANCER,SMALL_TEAM,AGENCY}` enum is **dead** (zero consumers). So the design implies persona-based tailoring the code never does. Decide which is real before building either side.
- E2. **Onboarding step model differs.** Figma flow: S1 workspace → S2 client → S3 path → build → editor. Code flow: `ROLE_SELECT → PROJECT_SETUP → SITE_CREATION → (EDITOR_TOUR dead) → CHECKLIST → COMPLETED` (`onboarding.service.ts:4`). The "client" (S2) step in Figma has no code equivalent in the onboarding state machine; clients live in the agency layer. Reconcile the wizard shape.
- E3. **Cross-module exits map to real routes.** Figma "Skip → M3 Dashboard" / "→ M5 Editor" chips correspond to real code routes (`dashboard-home-getting-started` = `/dashboard`; editor = `/edit/[siteId]`). The Figma prototype couldn't wire cross-page (same-page NAVIGATE limit); the code has the destinations. Not a defect — a prototyping-tool constraint.
- E4. **Doc-internal drift (code docs, not design):** AI-site-generation marked both "stub" and "wired e2e" in `complete-feature-list-20260623.md` (`:56` vs `:24`) — the newer code-verify (`:24`, wired-but-env-gated) supersedes; the stale row should be struck.

---

## 14. Release readiness

**Must-fix before charging / GA**
- Payments integration (A1/B1) — no revenue path today.
- Broken links A2 (3 × 404 on core CTAs) — cheap, high-visibility.
- Security C1/C3 (published-site enforcement + edit-loader VIEWER block) — verify or close.
- Analytics funnel (B4) — cannot measure activation/conversion without it.

**Should-fix**
- Dead controls A3/A4; theme safety wiring B3; team active-workspace bug C2; missing error/denied states on Settings/Domains/Redirects/Access/Analytics/Media (§6).
- Decide `agency_layer` GA (B2); SSOT leaks in §8 (share-link 3, near-limit 80%) into `PLAN_LIMITS`.

**Can-ship (low risk / intentional)**
- "Coming soon" AI tools, billing interval switch removal, agency layer staying dark for now.

**Open questions**
1. Is Buildrik launching paid, or free-only for now? (blocks half this register)
2. Is `agency_layer` the launch differentiator or a later phase?
3. Does the onboarding `role` step mean persona or editor density? (E1 — design & code disagree)
4. Published-site password: enforce at publish (Vercel protection) or drop the feature? (C1)
5. Analytics provider of record?

---

## 15. Launch strategy (approved 2026-07-06 — office-hours + CEO review)

The PRD diagnoses; this section carries the decision. Approach **"Measure → Safeguard → Charge"** (design doc `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-20260706-022448.md`, adversarially reviewed).

**Confirmed premises:** (1) activation/analytics is the true #1, not payments — you can't optimize a funnel you can't see; (2) the agency layer ships (it's the moat) but only after theme-push preview + rollback UI lands (blast-radius is the #1 risk); (3) free-only is fine short-term, but payments gets a committed date, not drift.

**Sequence (each sprint gated on the prior):**
1. **Measure** — PostHog Cloud funnel: `signup_completed → onboarding_completed → first_site_created → first_publish → near_limit → limit_blocked`. + consent/DPA. + fix the 3 broken-link 404s (they sit on the activation path). *Build gate: 6 events visible in PostHog.*
2. **Safeguard** — wire theme-push **preview + rollback** UI onto existing backends (`theme.ts:126,140`); preview shows "N will change · M locked" (M = pre-set locks, `theme.setLock`). Full-surface agency smoke QA → flip `agency_layer` ON. Push-time override + `ThemePushRun` history = v1.1. *Build gate: reversible push, clicked through.*
3. **Charge** — Stripe Checkout on `billing.service.ts:158` (products/prices per `PLAN_LIMITS`, webhook + idempotency, happy-path). Lifecycle (proration/portal/failed-payment) = v1.1. *Build gate: test-mode upgrade → `Subscription` row.*

**CEO pressure-test — the load-bearing caveat:** measure/charge both assume a funnel that has traffic. There are **no user/traffic numbers anywhere in the repo**. Two questions gate the whole sequence and must be answered from real data, not the codebase:
- Do you have signups/traffic today? If ~zero, the real #1 is **distribution** (get 10-20 agencies in), and analytics-first is one level too late.
- Is anyone currently at a plan limit asking to pay? If yes, pull Stripe forward; if no, holding payments is correct and "payments urgency" is theater.

**Honest limit:** measurement-first de-risks **activation**, not willingness-to-pay — conversion stays unfalsifiable until Sprint 3 (Stripe) exists.

**First action (this week):** create a PostHog Cloud project, fire ONE event — `signup_completed` — end to end, visible in the dashboard. Smallest step that turns "we think people activate" into a number.

---

## Definition of 10-star (what closes the gap)
This PRD is decision-grade when: every finding in §13 resolves (fixed / deferred-with-reason / rejected), every `[TBC]` is closed with evidence (**done** — this pass), §8 business rules are complete (**done**), §12 spec-delta reflects the newest code-verify (**done**), and §15 carries an approved, adversarially-reviewed forward plan (**done**). Remaining to reach a *shipped* 10-star product (not doc): the §14 must-fix tier — payments, broken links, published-password decision, and the activation funnel.

---
*Every claim above is checkable at the cited `file:line` on `main@e5624ca1`. All `[TBC]` from the first pass are now resolved in code (§11, §12, §13-C). Grounded end to end: nothing invented.*
