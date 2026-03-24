# Phase 2: Dashboard + Sites Completeness — Design Spec

**Date:** 2026-03-24
**Status:** Reviewed (v2 — fixes from spec review applied)
**PRD Refs:** Sections 3.1-3.7, 5.6-5.11, 5.20, 6.1-6.2, 13.1, 13.4-13.6
**Audit Refs:** D-7, D-9, D-10, D-19, D-20, D-25, D-29, D-30, D-33, D-36

---

## 1. Problem Statement

The dashboard and sites modules have complete scaffolding (routers, services, components, pages) but ~50 gaps between the PRD spec and current implementation. The backend services are 80-90% complete — most gaps are in frontend wiring, missing UI states, and a few missing service features.

### Sub-systems

| Sub-system | Backend | Frontend | Gap Count |
|-----------|---------|----------|-----------|
| Dashboard (DASH-1/2) | 90% — stats, recent, activity, health all working | 85% — all sections render, missing visual polish | 12 gaps |
| Sites List (SITE-1/2) | 85% — CRUD, bulk, folders, publish all working | 80% — grid/list/filters/modals exist, missing advanced features | 11 gaps |
| Site Detail (SD-01 through SD-08) | 75% — overview, settings, redirects, domains, sharing, analytics services exist | 70% — all 6 tab pages exist, missing expanded specs | 18 gaps |
| Site Creation (SITE-3, TPL, AI-WIZ) | 80% — create, templates, AI services exist | 75% — modal, gallery, wizard exist, missing wiring | 9 gaps |

---

## 2. Approach

Fix-in-place. No new service files or router files. New functions and endpoints are added to existing files. Organized by priority:

**P0 (Blocks the daily loop):** Dashboard → Sites → Site Detail navigation must work end-to-end.
**P1 (Feature completeness):** All PRD-specified features working.
**P2 (Polish):** Sparklines, animations, advanced filters, CSV import/export.

---

## 3. Dashboard Gaps (12)

### 3.1 Stat Card Visual Enhancements

**Files:** `components/dashboard/stat-card.tsx`

**Current:** Text-only stat cards with title, value, subtitle, href.

**Needed per PRD 5.6 + 6.1-6.2:**
- **Total Sites card:** Mini donut chart showing published/draft/archived breakdown. Data already available in `stats.publishedSites`, `stats.draftSites`, `stats.archivedSites`.
- **Monthly Visits card:** 30-day sparkline inline chart. Needs new data — add `dailyVisitors: number[]` (last 30 days) to `getDashboardStats` return.
- **Monthly Visits card:** % change arrow (green up / red down). `visitsChange` exists but always returns 0. Fix: compute from current vs previous 30-day period.
- **Collaborators card:** Avatar stack (max 4 + overflow). Needs member avatars — add `memberAvatars: {name: string, avatar: string | null}[]` to stats.

**Implementation:**
- Add `MiniDonut` component (pure SVG, ~30 lines) to `stat-card.tsx` or as a child component.
- Add `Sparkline` component (SVG polyline from array of numbers) — ~20 lines.
- Add `AvatarStack` component — ~15 lines.
- Fix `visitsChange` calculation in `dashboard.service.ts`: compare current 30d vs previous 30d aggregates.
- Add `dailyVisitors` query: `GROUP BY date ORDER BY date` for last 30 days.
- Add `memberAvatars` query: first 5 members with avatar + fullName.

### 3.2 Activity Feed Grouping + Filter Tabs

**Files:** `server/services/dashboard.service.ts`, `components/dashboard/activity-feed.tsx`

**Current:** Flat list of 5 entries, no grouping, no filters.

**Needed per PRD 5.6:**
- Group by: Today / Yesterday / This Week / Older.
- Same-actor + same-type entries within 1hr collapsed (e.g., "Ali published 3 sites" instead of 3 separate entries).
- Filter tabs: All / My Activity / Team Activity.
- Default 5 entries, "View all activity" expands inline to 15 with Load More. This does NOT navigate to a separate page (NOTIF-6 Activity Log is Phase 2). The link is an inline expand action only.

**Implementation:**
- Service: `getActivityFeed(workspaceId, { userId?, limit?, offset? })` — add userId filter param. Grouping + collapsing done in service, not frontend.
- Frontend: Add tab state (all/mine/team), pass userId for "mine" filter. Render grouped sections with collapsible headers.

### 3.3 Empty State Per Role

**Files:** `components/dashboard/empty-state.tsx`, `app/dashboard/page.tsx`

**Current:** Single `EmptyState` variant `"owner_new"`.

**Needed per PRD 5.6 (DASH-2):**
- `owner_new` — "Welcome to Buildrik! Build your first site." + 3 creation CTAs + video thumbnail.
- `owner_empty` — "Your workspace is empty. Ready for something new?" + 3 CTAs, no onboarding tone.
- `editor_no_sites` — "You haven't been assigned to any sites yet." + [View Team ->].
- `viewer` — "No published sites to view yet."

**Implementation:**
- Pass `role` from WorkspaceMember to page. Query member role in dashboard page.
- Determine variant: if `isEmpty && role === "OWNER"` → check if user ever had sites (check `activityLog` for `SITE_CREATED`). Fresh signup = `owner_new`, deleted all = `owner_empty`. If `role === "EDITOR"` → `editor_no_sites`. If `role === "VIEWER"` → `viewer`.
- Update `EmptyState` component to accept variant prop with 4 layouts.

### 3.4 Dunning Banner Wiring

**Files:** `app/dashboard/page.tsx`, `components/dashboard/dunning-banner.tsx`

**Current:** `DunningBanner` component exists but not queried or conditionally rendered.

**Needed per PRD 5.6:**
- Show when `subscription.status === "PAST_DUE"`.
- Red banner: "Payment failed. Update payment method to avoid losing Pro features."
- CTA: "Update Payment" → `/dashboard/billing`.
- Dismissible per session but reappears on login.
- Countdown: "X days remaining" (14-day grace from first failed charge).

**Implementation:**
- Add subscription status to dashboard stats query or add a separate `billing.overview` query.
- Conditional render in dashboard page. Dismiss state in `sessionStorage`.

### 3.5 Recent Sites Section Enhancement

**Files:** `components/dashboard/recent-sites.tsx`, `components/dashboard/site-card.tsx`

**Current:** Renders cards with basic info.

**Needed per PRD 5.6:**
- Card shows: thumbnail, name, status badge, last editor name, "edited 2h ago", page count, visitor count.
- **Hover overlay:** [Edit] primary + [Manage ->] secondary buttons.
- **Quick Publish:** Draft sites show "Publish" icon on hover. Published show "Copy URL".
- **Empty slot:** 4th slot is animated dashed placeholder "Create your next project" with 3 mini icons.
- "View All ->" link in section header.

**Implementation:**
- Enhance `SiteCard` with hover state using CSS group-hover.
- Add last editor info to `getRecentSites` query (join with User on `createdBy`).
- Add visitor count from `SiteAnalytics` aggregation.
- Add empty slot component when < 4 sites returned.

### 3.6 Quick Actions Hide After 30 Days

**Files:** `app/dashboard/page.tsx`

**Current:** Always shows based on isEmpty check.

**Needed per PRD 5.6:** Hidden after 30 days of active usage.

**Implementation:** Check `user.createdAt`. If > 30 days old AND has sites, hide quick actions section.

### 3.7 Workspace Health Conditional Visibility

**Files:** `app/dashboard/page.tsx`

**Current:** Always renders WorkspaceHealth.

**Needed per PRD 5.6:** Only show when any metric > 50%.

**Implementation:** Check `health.data` values. If all `used/limit < 0.5`, don't render.

### 3.8 Sidebar Plan Usage

**Files:** `components/dashboard/sidebar.tsx`

**Current:** Need to verify — likely missing plan indicator.

**Needed per PRD 5.6:** Bottom of sidebar shows "My Workspace" + "Free 3/5" usage + "Upgrade" link.

**Implementation:** Query workspace plan + site count. Display at sidebar bottom.

### 3.9 Topbar Completeness

**Files:** `components/dashboard/topbar.tsx`

**Current:** Need to verify elements: Logo, Search, Bell, Help, Avatar, Breadcrumbs.

**Needed per PRD 3.2:**
- Logo → Home.
- Search (Cmd+K) → Command palette.
- Bell icon → notification dropdown → NOTIF-1.
- ? Help → contextual dropdown (3 articles based on current page).
- Avatar → DASH-4 dropdown.
- Breadcrumbs on nested pages.

**Implementation:** Verify each element exists and is wired. Add missing connections.

### 3.10 Visits Change Calculation

**Files:** `server/services/dashboard.service.ts`

**Current:** `visitsChange: 0` hardcoded.

**Needed:** Actual % change vs previous 30-day period.

**Implementation:**
```
const previousMonth = new Date(startOfMonth);
previousMonth.setMonth(previousMonth.getMonth() - 1);
// Query previous month aggregate, compute: ((current - previous) / previous) * 100
```

### 3.11 Activity Feed Actor Name Resolution

**Files:** `server/services/dashboard.service.ts`

**Current:** `actorName: log.description ?? "System"` — uses description field instead of actor name.

**Needed:** Resolve `actorId` → User.fullName.

**Implementation:** Join with User table on `actorId` to get fullName + avatar.

### 3.12 Dashboard Skeleton Loading State

**Files:** `app/dashboard/page.tsx`

**Current:** Basic skeleton with 4 gray boxes.

**Needed per PRD:** Full skeleton matching actual layout — stat cards + quick actions + recent sites + activity + health.

**Implementation:** Expand skeleton to match all sections.

---

## 4. Sites List Gaps (11)

### 4.1 Saved View Preference

**Files:** `app/dashboard/sites/page.tsx`, `server/trpc/routers/account.ts`

**Current:** View mode and sort default to "grid" / "lastEdited" on every page load.

**Needed per PRD 5.20:** Persist sort + view mode via `UserPreference.siteViewMode` and `siteViewSort`.

**Implementation:**
- On mount: load preferences via `trpc.account.preferences.get`.
- On change: save via `trpc.account.preferences.update`.
- Schema exists (`UserPreference` model). **The account router currently has NO preferences CRUD.** Must add:
  - `account.preferences.get` — query `UserPreference` by userId, return defaults if none exists.
  - `account.preferences.update` — upsert `UserPreference` with partial fields.
  - Add `getPreferences` + `updatePreferences` functions to `server/services/account.service.ts`.
  - Add Zod schema `updatePreferencesSchema` to `lib/validations/account.ts`.

### 4.2 Pagination Controls

**Files:** `app/dashboard/sites/page.tsx`

**Current:** Hardcoded `page: 1`, no pagination UI.

**Needed:** Next/Previous buttons, page count display, wire page state to query.

**Implementation:** Add pagination state, wire to `sitesQuery` input, render pagination controls below grid/list.

### 4.3 Advanced Filtering (7 Types)

**Files:** `components/sites/site-filters.tsx`, `lib/validations/sites.ts`, `server/services/sites.service.ts`

**Current:** Only status + search + sort.

**Needed per PRD 5.20:** 7 filter types:
1. Status (multi-select chips) — exists but single-select
2. Created by (member dropdown) — missing
3. Date range (Last 7d/30d/90d/Custom) — missing
4. Template used (dropdown) — missing
5. Has custom domain (toggle) — missing
6. Has traffic (range) — missing
7. Folder (dropdown) — exists

**Implementation:**
- Expand `listSitesSchema` with new optional fields.
- Expand `listSites` service `where` clause.
- Expand `SiteFilters` component with new filter controls.
- Load team members + templates for dropdown options.

### 4.4 Context Menu Completeness

**Files:** `components/sites/context-menu.tsx`

**Current:** Need to verify which of the 11 PRD actions are implemented.

**Needed per PRD 5.20 (SITE-5):** Edit, Manage, Rename, Duplicate, Move to Folder, Transfer Site, Export Site, View Published (disabled if draft), Copy Site URL, Archive, Delete.

**Implementation:** Add missing actions. Wire each to appropriate mutation or navigation. Transfer Site → SITE-TRANSFER-MODAL. View Published → conditional disabled state with tooltip.

### 4.5 Site Transfer Modal

**Files:** New component needed in `components/sites/transfer-modal.tsx`

**Needed per PRD 13.6:** Member selector dropdown (Admin/Editor only), confirmation text, POST /sites/:id/transfer. Endpoint exists in PRD Section 9.9.

**Implementation:**
- Add `transferSite` mutation to sites router.
- Add `transferSite` function to sites service: change `site.createdBy`, create SitePermission for original owner.
- Create modal component.

### 4.6 Bulk Operations Completeness

**Files:** `components/sites/bulk-action-bar.tsx`, `app/dashboard/sites/page.tsx`

**Current:** Bulk bar exists. Verify which actions are wired.

**Needed per PRD 5.20:** Publish All, Unpublish All, Archive All, Move to Folder, Delete All. Max 25 selection. Shift+click range select. (Export All deferred — see Out of Scope.)

**Implementation:**
- Verify all bulk actions are wired to `sites.bulk` mutation.
- Add "Move to Folder" (folder picker dropdown in bulk bar).
- Add shift+click range selection logic.
- Cap selection at 25.

### 4.7 List View Additional Columns

**Files:** `components/sites/site-list-view.tsx`

**Current:** Need to verify columns.

**Needed per PRD 5.20:** Name, Pages, Visitors (30d), Domain, Folder, Status, Last Edited, Actions.

**Implementation:** Add missing columns. May need to expand `listSites` service select to include domain info.

### 4.8 Site Card Grid Enhancement

**Files:** `components/sites/site-card-full.tsx`

**Current:** Need to verify content.

**Needed per PRD 5.20:** Thumbnail + name + status badge + URL + page count + visitor count + "Edited 2h ago by Ali" + [Edit] + [...].

**Implementation:** Verify and add missing data points. "Edited by" requires joining last editor info.

### 4.9 Folder Rename

**Files:** `server/services/folder.service.ts`, `server/trpc/routers/sites.ts`

**Current:** Create + delete exist. No rename.

**Needed:** Rename folder.

**Implementation:** Add `renameFolder(folderId, name)` in service + router. Add inline rename UI in FolderTabs component.

### 4.10 Site Slug Global Uniqueness

**Files:** `server/services/sites.service.ts`

**Current:** `generateUniqueSlug` checks uniqueness within workspace only, but `Site.slug` is `@unique` globally.

**Needed:** Check global uniqueness.

**Implementation:** Change `findFirst({ where: { slug: candidate, workspaceId } })` to `findFirst({ where: { slug: candidate } })`.

---

## 5. Site Detail Gaps (18)

> **Note:** Template trending in empty state (PRD 5.6 DASH-2) is a Dashboard gap — covered in Section 3.3 as part of the `owner_new` empty state variant which shows "3 trending templates".

### 5.1 Overview Tab Stat Cards

**Files:** `components/site-detail/overview-tab.tsx`

**Current:** Need to verify — likely renders basic data.

**Needed per PRD 5.7:** 6 stat cards with visual elements:
1. Total Pages — number + "last added: {name}, {time ago}"
2. Monthly Visitors — sparkline + % change
3. Last Published — date + relative time + who
4. Team Members — avatar stack + "Manage ->" link
5. Form Submissions — "{N} this month - {M} unread" with badge
6. Site Health — composite score + expandable panel

**Implementation:** Data already returned from `getSiteOverview`. Need to render as stat cards with the visual components from Section 3.1.

### 5.2 Form Submissions Section in Overview

**Files:** `components/site-detail/overview-tab.tsx`

**Current:** Not implemented in overview.

**Needed per PRD 5.7 + 13.5:** List form blocks with submission counts, click to expand last 3 inline, "View All" link to full table.

**Implementation:**
- Add `formBlocks` to `getSiteOverview` return: query `FormBlock WHERE siteId AND isActive`, include submission counts.
- Render form list in overview tab with inline expansion.

### 5.3 Form Submissions Full Table (FORM-SUBMISSIONS)

**Files:** Need to verify if exists. Likely needs component in `components/site-detail/` or a new page.

**Needed per PRD 13.5:** Table with columns: Submitted, Form, Page, Data Preview, Read/Unread, Spam. Filters by form block + isSpam. Pagination 20/pg. Export CSV. "Reply by Email" mailto link.

**Implementation:**
- `forms` router already has listing. Wire to a table component in the overview or access tab.
- Add CSV export endpoint or client-side CSV generation.

### 5.4 Form Submission Detail Drawer

**Files:** New component in `components/site-detail/submission-drawer.tsx`

**Needed per PRD 13.5:** Right slide drawer, 480px. All fields as label:value. Metadata. isRead/isSpam/isArchived toggles. Delete button.

**Implementation:** Create drawer component. Wire to `forms.getSubmission` + `forms.updateSubmission` + `forms.deleteSubmission`.

### 5.5 Site Health Score Enhancement

**Files:** `server/services/site-detail.service.ts`

**Current:** Basic health score: `hasPages * 40 + hasPublished * 30 + hasDomain * 30`.

**Needed per PRD 5.7 + 13.6:** Composite from: SEO completeness, content fill rate, SSL status. Lighthouse deferred (needs PSI API key).

**Implementation:**
- SEO completeness: check Site-level `metaTitleTemplate` (exists on Site model) + count of Pages with `seoTitle` AND `seoDescription` set vs total pages. No new Site model fields needed — `seoTitle`/`seoDescription` live on the `Page` model, `metaTitleTemplate` lives on `Site`.
- Content fill rate: `pages with ≥3 non-empty blocks / total pages × 100%`. Query `Page.blocks` JSONB length.
- SSL: check if any domain has `sslStatus === "ACTIVE"`.
- Favicon: check if `Site.touchIcon` is set (field exists on Site model).
- Return breakdown per metric for the expandable panel.

### 5.6 Site Settings Expanded (SD-03)

**Files:** `components/site-detail/settings-tab.tsx`, `server/services/site-settings.service.ts`

**Needed per PRD 5.20:** Favicon upload + preview, touch icon, custom 404 toggle, site password (Pro+), custom code head/body (Pro+), social links editor.

**Implementation:**
- Schema fields exist (`headCode`, `bodyCode`, `socialLinks`, `publishedPassword`, `touchIcon`).
- Wire upload endpoints for favicon/touchIcon.
- Add Pro+ gate for custom code and site password fields.
- Add social links editor (platform list with add/remove).

### 5.7 SEO Tab Expanded (SD-04)

**Files:** `components/site-detail/seo-tab.tsx`

**Needed per PRD 5.20:** Meta title + description with character counters + live Google preview. og:image upload with social card previews. Meta title template. Redirects management section (CRUD + CSV import/export).

**Implementation:**
- Add character counter components.
- Add Google search preview component (title, URL, description).
- Add social card preview component (og:image + title).
- Redirects section: table with inline CRUD. CSV import via file upload. CSV export via download link.
- Add redirect import/export endpoints to router (audit D-10).

### 5.8 Domains Tab Expanded (SD-05)

**Files:** `components/site-detail/domains-tab.tsx`

**Needed per PRD 5.20:** Primary domain toggle, SSL details expandable, provider-specific guide links. Auto-verify every 30s.

**Schema change required:** Add `isPrimary Boolean @default(false)` to the `Domain` model in `prisma/schema.prisma`. Run `npx prisma db push` to apply. Convention: only one domain per site can be primary. Setting a domain as primary sets all others for that site to `isPrimary: false` in a transaction.

**Implementation:**
- Add `isPrimary` field to Domain model (schema migration).
- Add primary domain toggle (PATCH domain with isPrimary flag).
- Add SSL details section with expand/collapse.
- Add provider guide links (static mapping).
- Add polling for domain verification status.

### 5.9 Sharing Tab Expanded (SD-06)

**Files:** `components/site-detail/access-tab.tsx`

**Needed per PRD 5.20:** Multiple named share links, QR code per link (downloadable PNG), password option, expiry, view count, revoke individual.

**Share link expiry max enforcement (audit D-19):** Server-side validation in `share-link.service.ts` — if `expiresIn` exceeds plan max (Free: 7d, Pro: 30d, Business: 90d), return `400 EXPIRY_EXCEEDS_PLAN`. Frontend disables expiry options beyond plan limit.

**Implementation:**
- `ShareLink.name` field exists in schema.
- Add QR code generation (use `qrcode` npm package or generate SVG client-side).
- Wire all CRUD to existing `siteDetail.sharing` router.
- Add plan limit check in `createShareLink` service function.

### 5.10 Analytics Tab Expanded (SD-08)

**Files:** `components/site-detail/analytics-tab.tsx`, `server/services/analytics.service.ts`

**Needed per PRD 5.20:** Date range picker (7d/30d/90d/custom), compare toggle, 6 metric cards, traffic sources bar chart, geographic data, device/browser breakdown.

**Implementation:**
- Date range and granularity already in `siteAnalyticsQuerySchema`.
- 6 metric cards: Page Views, Unique Visitors, Avg Session, Bounce Rate, Pages per Session, Top Entry Page.
- Traffic sources/geo/device: aggregate from `AnalyticsEvent` table.
- Expand `getSiteAnalytics` to return breakdowns.
- **Plan retention limit (audit D-20):** Server-side clamping in `analytics.service.ts` — if requested range exceeds plan limit, clamp to max allowed (Free: 7d, Pro: 30d, Business: 90d). Return `clampedRange` in response so frontend can show "Upgrade to Pro for 30-day analytics" tooltip on disabled date options. This is enforced at the service layer, not just UI.

### 5.11 Skeleton + Error States

**Files:** All 6 tab components + `components/site-detail/` area

**Needed per PRD 13.1:**
- DETAIL-SKEL: Tab bar static + ghost content.
- DETAIL-ERR: "Failed to load" + Retry + Back to My Sites.

**Implementation:** Add loading/error conditional rendering in each tab's parent page.

### 5.12 View Published Disabled State

**Files:** `components/site-detail/site-header.tsx`

**Current:** "View Site" button likely always enabled.

**Needed per audit D-25:** Disabled with tooltip when site is draft.

**Implementation:** Conditional `disabled` + title attribute tooltip.

### 5.13 Redirect Import/Export Endpoints

**Files:** `server/trpc/routers/site-detail.ts`, `server/services/redirect.service.ts`

**Current:** CRUD exists. Import/export missing.

**Needed per audit D-10:**
- `POST /redirects/import` — parse CSV, validate, bulk create.
- `GET /redirects/export` — generate CSV download.

**Implementation:**
- Import: accept CSV string, parse rows, validate each, bulk create via Prisma.
- Export: query all redirects for site, format as CSV, return as downloadable response.

### 5.14 Form Submission Plan Limit Enforcement

**Files:** `app/api/public/forms/[siteId]/[formBlockId]/route.ts`

**Current:** Only checks rate limit (10/min/IP) and spam (honeypot). No monthly plan limit check.

**Needed per audit D-9:** Check `FormSubmission COUNT WHERE siteId IN (workspace sites) AND createdAt > startOfMonth`. If >= plan limit: return 402.

**Implementation:**
- Resolve workspace from siteId.
- Count submissions this month.
- Compare against plan limit (Free: 100, Pro: 2500, Business: unlimited).

### 5.15 Site Transfer Endpoint

**Files:** `server/trpc/routers/sites.ts`, `server/services/sites.service.ts`

**Current:** No transfer endpoint.

**Needed per PRD 9.9:** `POST /sites/:id/transfer {newOwnerId}`. Changes `site.createdBy`, original owner gets Editor SitePermission.

**Implementation:**
- Add `transferSite(siteId, newOwnerId, currentUserId)` in sites.service.
- Validate: current user is owner (createdBy), new owner is workspace member.
- Change `createdBy`, create `SitePermission` for original owner.

### 5.16 Pre-Publish Checks Enhancement

**Files:** `components/publish/pre-publish-checks.tsx`

**Current:** Component exists with basic checks.

**Needed per PRD 5.20 SITE-10:** "Notify team members when published" checkbox option. Large images warning.

**Implementation:** Add notify checkbox. Add image size check (query blocks for image URLs > 2MB — may need to defer since we'd need to HEAD check CDN URLs).

### 5.17 Publish Progress Polling

**Files:** `components/publish/publish-progress.tsx`, `app/dashboard/sites/[id]/publish/page.tsx`

**Current:** Component exists but likely not wired to polling.

**Needed per PRD 5.20 SITE-11:** Step-by-step progress. Cancel button. Poll every 2s.

**Implementation:**
- Wire `sites.publishStatus` query with `refetchInterval: 2000`.
- Show step indicators from job.steps.
- Wire cancel button to `sites.cancelPublish`.
- On completion, redirect to publish success page.

### 5.18 Publish Success Enhancement

**Files:** `components/publish/publish-success.tsx`

**Current:** Component exists.

**Needed per PRD 5.20 SITE-12:** Live URL + domain URL + copy/open buttons. Lighthouse score (async). CTAs: Share with Client, View Analytics, Edit Site, Dashboard.

**Implementation:** Wire published URL from job result. Lighthouse score display — show "Calculating..." initially, poll for result. Defer actual Lighthouse API call to future (show placeholder for now).

---

## 6. Site Creation Gaps (9)

### 6.1 Create Site Modal — Slug Live Check

**Files:** `components/sites/create-site-modal.tsx`

**Current:** Name input exists but no slug preview or availability check.

**Needed per PRD 5.8:** Auto-generated slug preview as user types, debounced 300ms availability check (checkmark "Available" / X "Taken").

**Implementation:**
- Add `checkSlugAvailability` query to sites router.
- Debounce input, show slug preview below name field.

### 6.2 Create Site Modal — AI Credit Indicator

**Files:** `components/sites/create-site-modal.tsx`

**Current:** AI card exists but no credit display.

**Needed per PRD 5.8:** "{N}/{limit} credits remaining". Lock if 0 credits.

**Implementation:** Query AI credits from workspace stats. Display in AI card.

### 6.3 Template Cloning Logic

**Files:** `server/services/sites.service.ts`

**Current:** `createSite` creates an empty site regardless of method.

**Needed per PRD 5.9:** When `method === 'template'`, clone `Template.pages` JSONB → create `Page` records. Increment `Template.usageCount`.

**Implementation:**
- In `createSite`, when `templateId` is provided:
  1. Fetch template by ID.
  2. Parse `template.pages` (JSONB array of page configs).
  3. Create `Page` records from the template data.
  4. Set `site.pages` count.
  5. Increment `template.usageCount`.

### 6.4 Template Difficulty Badges + Usage Count

**Files:** `components/templates/template-card.tsx`

**Current:** Need to verify card content.

**Needed per PRD AD-7 + 5.9:** Difficulty badge (Beginner/Intermediate). Usage count ("2.4K sites").

**Schema change required:** Add `difficulty String @default("BEGINNER")` to the `Template` model in `prisma/schema.prisma`. Values: `"BEGINNER"` or `"INTERMEDIATE"`. Set per template in seed data. This is simpler and more explicit than deriving from page count.

**Implementation:** Display `template.difficulty` as badge on card. Display `template.usageCount` formatted (e.g., "2.4K sites").

### 6.5 AI Wizard — Content Preferences

**Files:** `components/ai-wizard/step-pages.tsx`

**Current:** Page selection exists.

**Needed per PRD 5.11:** Tone selector (6 options), Content mode (3 options), Image mode (3 options). Description textarea (500 chars).

**Implementation:** Add preference selectors below page list. Store in `AIGenerationJob.metadata`.

### 6.6 AI Generation Progress Polling

**Files:** `components/ai-wizard/generation-progress.tsx`

**Current:** Component exists.

**Needed per PRD 5.20:** Poll `GET /sites/generate/:jobId/status` every 2s. Show step indicators. Handle: QUEUED → GENERATING_STRUCTURE → GENERATING_CONTENT → GENERATING_STYLES → COMPLETED.

**Implementation:** Wire polling with `refetchInterval: 2000`. Display progress steps. On COMPLETED → redirect to editor. On FAILED → show retry + fallback options.

### 6.7 AI Cancel with useBlocker

**Files:** `components/ai-wizard/generation-progress.tsx`

**Needed per PRD 13.1 WIZ-CANCEL:** Browser back or navigate away triggers cancel dialog. Cancel → `DELETE /sites/generate/:jobId`.

**Implementation:** Use Next.js `useRouter` events or `beforeunload` handler. Show confirmation modal before navigation.

### 6.8 AI Credits Exhausted Modal

**Files:** New component or part of AI wizard flow.

**Needed per PRD 13.4:** Modal when generation limit reached. Plan-specific upgrade CTA + "Use a Template Instead" fallback.

**Implementation:** Check credit count before starting generation. Show modal if at limit.

### 6.9 Command Palette Completeness

**Files:** `components/search/command-palette.tsx`

**Current:** Component exists.

**Needed per PRD 3.2 + 13.6:** 6 search scopes: Sites, Pages, Team, Settings, Actions, Help. Keyboard navigation (arrow keys + Enter). Esc to close. Recent items section.

**Implementation:** Verify all 6 scopes are wired. Add keyboard navigation handlers. Wire search queries per scope.

---

## 7. Files Modified Summary

### Schema

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `isPrimary Boolean @default(false)` to Domain model. Add `difficulty String @default("BEGINNER")` to Template model. |

### Backend (Services + Routers)

| File | Changes |
|------|---------|
| `server/services/dashboard.service.ts` | Fix visitsChange (rolling 30d vs prior 30d), add dailyVisitors, memberAvatars, activity grouping, actor name resolution |
| `server/services/sites.service.ts` | Template cloning in createSite, slug global uniqueness fix, transferSite function |
| `server/services/site-detail.service.ts` | Enhanced health score (SEO + content fill + SSL + favicon), formBlocks in overview |
| `server/services/redirect.service.ts` | Import/export CSV functions |
| `server/services/folder.service.ts` | Add renameFolder |
| `server/services/analytics.service.ts` | Traffic sources, geo, device breakdowns, plan retention clamping (D-20) |
| `server/services/share-link.service.ts` | Expiry max validation per plan (D-19) |
| `server/services/account.service.ts` | Add getPreferences, updatePreferences |
| `server/trpc/routers/sites.ts` | checkSlugAvailability, transferSite, folder rename |
| `server/trpc/routers/site-detail.ts` | Redirect import/export |
| `server/trpc/routers/account.ts` | Add preferences sub-router (get + update) |
| `app/api/public/forms/[siteId]/[formBlockId]/route.ts` | Plan limit enforcement |

### Validation Schemas

| File | Changes |
|------|---------|
| `lib/validations/sites.ts` | Expand listSitesSchema with 7 filter types, add transferSiteSchema |
| `lib/validations/site-detail.ts` | Add redirectImportSchema |
| `lib/validations/account.ts` | Add updatePreferencesSchema |

### Frontend (Components + Pages)

| File | Changes |
|------|---------|
| `components/dashboard/stat-card.tsx` | MiniDonut, Sparkline, AvatarStack |
| `components/dashboard/activity-feed.tsx` | Grouping, filter tabs, expand |
| `components/dashboard/empty-state.tsx` | 4 role-based variants |
| `components/dashboard/recent-sites.tsx` | Hover overlay, quick publish, empty slot |
| `components/dashboard/sidebar.tsx` | Plan usage at bottom |
| `app/dashboard/page.tsx` | Role-based empty state, dunning wiring, health conditional, quick actions hide |
| `app/dashboard/sites/page.tsx` | Pagination, saved preferences, advanced filters |
| `components/sites/site-filters.tsx` | 7 filter types |
| `components/sites/context-menu.tsx` | Missing actions (transfer, export, view published) |
| `components/sites/bulk-action-bar.tsx` | Move to folder, shift+click, max 25 |
| `components/sites/create-site-modal.tsx` | Slug live check, AI credit indicator |
| `components/site-detail/overview-tab.tsx` | 6 stat cards, form submissions section, health panel |
| `components/site-detail/settings-tab.tsx` | Expanded fields (favicon, code, social) |
| `components/site-detail/seo-tab.tsx` | Google preview, og:image, redirects |
| `components/site-detail/domains-tab.tsx` | Primary toggle, SSL details, auto-verify |
| `components/site-detail/access-tab.tsx` | QR codes, named links |
| `components/site-detail/analytics-tab.tsx` | Expanded metrics, breakdowns, plan limits |
| `components/publish/publish-progress.tsx` | Polling wiring, cancel |
| `components/publish/publish-success.tsx` | URLs, copy, CTAs |
| `components/ai-wizard/generation-progress.tsx` | Polling, cancel, useBlocker |
| `components/ai-wizard/step-pages.tsx` | Content preferences |
| `components/templates/template-card.tsx` | Difficulty badge, usage count |

### New Files (minimal)

| File | Purpose |
|------|---------|
| `components/sites/transfer-modal.tsx` | Site transfer confirmation |
| `components/site-detail/submission-drawer.tsx` | Form submission detail drawer |

---

## 8. Out of Scope

- Lighthouse API integration (needs PSI API key + async worker)
- SSE real-time updates (use polling for now)
- Drag-and-drop sites into folders (mouse-based DnD)
- Template live demo iframe preview (PRD Phase 2)
- Export site as ZIP / Export All bulk action (complex build pipeline integration, deferred). SITE-5 "Export Site" context menu action also deferred.
- Redirect import CSV validation UI (basic import, advanced validation later)
- Sparkline/chart library selection (use inline SVG, no external dependency)
- Analytics compare mode (dotted overlay line)
- Geographic data GeoIP resolution (needs MaxMind or similar)

---

## 9. Success Criteria

### Dashboard
1. 4 stat cards render with visual elements (donut, sparkline, avatar stack, trend arrow)
2. Activity feed groups by day with filter tabs
3. Empty state varies by user role
4. Dunning banner shows when subscription is PAST_DUE
5. Quick actions hide after 30 days for active users
6. Workspace health only shows when metrics > 50%
7. Recent sites have hover overlay with Edit/Manage

### Sites List
8. View mode and sort saved per user
9. Pagination works
10. All 11 context menu actions functional
11. Advanced filtering with 7 types
12. Bulk operations complete with max 25 cap

### Site Detail
13. 6 stat cards with visual elements
14. Form submissions section with inline expand
15. Site health score computed from SEO + content + SSL
16. All 6 tabs render with expanded specs
17. Redirect import/export works
18. Form submission plan limits enforced

### Site Creation
19. Create modal has slug live check + AI credit display
20. Template creation clones pages
21. AI wizard has content preferences
22. AI generation polls for progress
