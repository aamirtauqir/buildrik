# Buildrik Product Audit — Full Application excluding Editor

**Date:** 2026-07-22 · **Mode:** report-only (no code changed)
**Scope:** IA, journeys, roles/permissions, UI states, live UI — everything except `packages/editor` and `/edit/*` internals (seams noted only).
**Sources:** PRDs (`docs/prd/DASHBOARD-PRD-2026-07-06.md`, `BUILDRIK-PRD-COMPLETE.md`), three-way audit (`docs/audits/2026-07-22-three-way-product-audit.md`), 4 parallel code sweeps (IA/nav, roles, journeys, states) with file:line evidence, and a live logged-in browser pass on `localhost:3000` (owner role, Northwind Studio workspace).
**Baseline honesty:** the 07-06 PRD is stale in places — Stripe billing now exists, templates moved to the topbar ecosystem, onboarding was rebuilt (14 screens), `/dashboard/sites` list became `/dashboard/projects`. Everything below was re-verified against today's code; stale PRD claims were dropped.

---

## 0. Executive summary — why the product feels fragmented

The app is **not** missing features. It has ~130 routes, a real state-component system, agency layer, publish pipeline, Stripe, SSE notifications, 18 cron jobs. The fragmentation feeling comes from five structural causes, all verified:

1. **Two permission worlds.** The UI renders almost everything for every role and lets the backend reject; meanwhile several destructive/billing backends have **no role gate at all**. A read-only VIEWER can wipe a site's pages via apply-template, cancel the workspace subscription, and edit client form submissions. The product feels "loose" because it *is* loose — authorization is not a designed layer, it's per-router happenstance.
2. **Second-class connective tissue.** Emails and notifications — the surfaces that pull users back in — point at routes that no longer exist (8 dead email links incl. the entire dunning/billing path, and the member-joined notification). The IA moved (sites→projects, team/billing→settings) but nothing outside the React nav was migrated, and no middleware redirects catch the legacy URLs.
3. **Error states masquerade as empty states.** On 5+ surfaces (site Domains, Redirects, Access, Analytics, API tokens, media assets grid) a failed query renders "No X yet." The product silently lies when it breaks, which reads as "something is off" without ever saying what.
4. **Numbers don't agree with each other.** Sites list says "5 pages", site overview says "Total pages 0" (two sources of truth for page count). Billing shows "$79/yr" for a $79/**month** plan and raw `0 / -1` for unlimited quotas. Visitors "0" gets a rising green sparkline. When a product's numbers contradict themselves, users stop trusting all of them.
5. **Concept conflation at the edges.** "Recent activity → View all" lands on **Notifications** (different concept, no activity page exists). Tab labels don't match URLs (Traffic→`/analytics`, Sharing→`/access`, Submissions→`/feedback`). "Sites" nav lives at `/projects`. None of these individually hurts; together they create the "stitched together" texture.

6. **Backends without fronts, fronts without backends.** Theme-push preview/rollback/snapshots/presets: built server-side, zero UI callers. Data export: UI promises "you'll be notified" — no processor exists. API tokens: full CRUD UI + scope picker — nothing on the server accepts a token (`scopedProcedure` has zero consumers). Marketplace "Install": persists a row nothing reads. Resend invite: toasts success, sends nothing. This half-wired layer is the single biggest source of the "logically incomplete" feeling — surfaces make promises the system doesn't keep.
7. **The money path has a literal dead end.** A paying PRO/BUSINESS customer has **no working control to change tier** — the "Change Plan" button can never render, and "View Plans" only shows for FREE. Combined with the 404ing dunning emails and the missing post-Stripe-checkout return handling, the billing journey is broken at its start, middle, and end.

**What is genuinely healthy:** the nav SSOT (`nav.ts`) is clean and consistently consumed; template surfaces converged on one canonical browser; the analytics pipeline is real end-to-end (beacon → track → aggregate cron → charts, no fake numbers); domains are cleanly scoped (site tab = actions, workspace page = read-only monitor); workspaces/transfer/invites-accept/logout are fully wired; the agency cluster has model-quality state coverage; destructive confirms on delete-site/workspace/account are best-in-class type-to-confirm; the projects list page is the state-coverage gold standard.

---

## 1. Findings — prioritized register

### CRITICAL

| # | Finding | Where (evidence) | Impact | Fix |
|---|---------|------------------|--------|-----|
| C1 | `templates.applyToSite` destructively replaces all site pages with **no role gate** — VIEWER can execute | `server/trpc/routers/templates.ts:51-64`, `server/services/template.service.ts:192-229`; UI offered to all roles `components/site-detail/site-header.tsx:146` | Read-only invitee wipes a client site | `checkSiteRole(ADMIN)` |
| C2 | All `billing.*` mutations ungated — any member can cancel subscription, open Stripe portal, switch interval | `server/trpc/routers/billing.ts:30-71`; `switchInterval` also writes Prisma directly in the router (`:61-66`) | VIEWER cancels the workspace's paid plan; invite-modal copy even promises "except billing" (`components/team/invite-modal.tsx:9`) | OWNER (or ADMIN) gate; move DB write to service |
| C3 | Bulk publish = raw `updateMany status:"PUBLISHED"` — bypasses approval gate **and** the deploy pipeline | `server/trpc/routers/sites.ts:176-177`, `server/services/sites.service.ts:564-570` | Unreviewed sites flip to "Published" without any build/deploy — status lies; approval wedge defeated | Route bulk publish through `startPublish` per site, or drop the bulk action |
| C4 | `templates.get` unscoped `findUnique` — cross-tenant IDOR reads any workspace's private template incl. full page content | `templates.ts:27-33`, `template.service.ts:89-91` | Any authed user reads another agency's cloned site content by ID | Scope `OR:[{workspaceId:null},{workspaceId}]` (pattern already exists at `template.service.ts:205-210`) |
| C5 | 8 dead email links, incl. the **entire dunning/billing path** (`/settings/billing` without `/dashboard` prefix), account-deletion cancel, AI-complete, SSL-expiring, form-submission links | `server/services/email.service.ts:140-215` (8 URLs), detail table §5.1 | Revenue-recovery and retention emails 404; user cannot act on payment failure | Fix URLs; add legacy redirects in middleware as belt-and-braces |
| C6 | Team member remove (single + bulk) fires with **no confirmation of any kind** | `app/dashboard/settings/team/page.tsx:82-93`, `components/team/members-table.tsx:213-216` | One misclick removes members (bulk!) — no undo, membership row semantics make re-invite of suspended members impossible (`auth.ts:271-276`) | Confirm modal; type-to-confirm for bulk |
| C7 | **Paid users have no in-app path to change tier.** `PlanCard` gets a bare always-true `isCurrent`, and "Change Plan" renders only when `!isCurrent` — never; "View Plans" is FREE-only. `PlanComparison` — the only caller of `createCheckoutSession` — is unreachable for PRO/BUSINESS | `settings/billing/page.tsx:219-229,170`, `components/billing/plan-card.tsx:78` | PRO↔BUSINESS upgrade/downgrade impossible in-app — revenue-blocking dead end | `isCurrent={planId===currentPlanId}` + always-visible "Compare plans" |

### MAJOR

| # | Finding | Where | Impact | Fix |
|---|---------|-------|--------|-----|
| M1 | Query-error-as-empty on 5 site surfaces, unfixed since 07-06 audit: Domains, Redirects, Access, Analytics, API tokens (+ media assets grid inner query) | `sites/[id]/domains/page.tsx:52`, `redirects/page.tsx:48`, `access/page.tsx:43`, `analytics-tab.tsx:116-120`, `api-tokens-tab.tsx:92-99`, `media-library.tsx:276-287` | Failures display as "No X yet" — actively misleading | `isError → ErrorState` (pattern already in repo) |
| M2 | VIEWER can mutate: form submissions (edit/delete), site versions, site components, user templates; also create sites/folders, mint API tokens with any scopes, add outbound webhook integrations | `forms.ts:29-51`, `site-version.ts:24-50`, `site-component.ts:28-54`, `user-template.ts:22-41`, `sites.ts:71-90,436-450`, `api-tokens.ts:40-60`, `account.ts:235-243` | Role model advertises read-only; backend disagrees | EDITOR/ADMIN gates per table §6 |
| M3 | `team.ts` resolves workspace by `findFirst({userId})` — no ACTIVE filter, ignores active workspace | `server/trpc/routers/team.ts:20-28` | Multi-workspace admins mutate the *wrong* workspace's team; SUSPENDED members still read team data | Use `resolveWorkspaceId` + ACTIVE (pattern exists in `workspace-ctx.ts`) |
| M4 | Billing display: current plan shows "$79/yr" (Business = $79/mo; yearly = $63/mo ⇒ $756/yr); usage shows raw `0 / -1` for unlimited; plan features hardcoded next to `PLAN_LIMITS` SSOT | live screenshot; `components/billing/plan-card.tsx:30` (interval suffix on a monthly figure), `settings/billing/page.tsx:38` (hardcoded features), usage rows `0 / -1` | Wrong price on the money page; `-1` sentinel leaks to users | Format from `PLAN_LIMITS`; map `-1 → "Unlimited"` |
| M5 | Plans page renders **$0 / 0-limit** plans while loading and on error (no loading or error state at all) | `app/dashboard/settings/plans/page.tsx:73-81` | Pricing page shows false $0 pricing | Add loading skeleton + ErrorState |
| M6 | Page-count has two sources of truth: list reads denormalized `Site.pages`, overview counts `Page` rows — observed live as "5 pages" vs "Total pages 0" | `sites.service.ts:93,120` vs `site-detail.service.ts:42`; `page.service.ts:87-127` maintains the counter but other writers don't | Contradictory numbers on adjacent screens | Pick one source (count rows), or reconcile all writers |
| M7 | One-click destructive with no confirm: Unpublish (takes live site down), remove domain (breaks DNS), delete media asset, revoke API token | `site-header.tsx:113-114`, `domains-tab.tsx:135`, `media-library.tsx:318`, `api-tokens-tab.tsx:146` | Production-impacting misclicks | Confirm dialogs |
| M8 | No unsaved-changes protection anywhere (exactly 1 `beforeunload` in the app, for AI generation) — worst on site settings head/body code fields | `site-detail/settings-tab.tsx:36-54`, `workspace-form.tsx:94-109`, `profile-form.tsx:66-75` | Silent loss of pasted custom code / long edits | Dirty-state guard on the 3-4 heavy forms |
| M9 | Silent mutation failures: bulk site actions (incl. bulk delete) have no `onError`; session revoke gets stuck + unhandled rejection; avatar upload chain has no catch; onboarding wizard saves swallow errors (`catch {}`) | `projects/page.tsx:187-194`, `security-tab.tsx:102-113`, `profile-form.tsx:101-117`, `onboarding/wizard/wizard-context.tsx:24,67` | Failures vanish; UI state desyncs | onError + toasts; try/catch with feedback |
| M10 | Modal primitive has no focus trap (Tab cycles into background; no focus restore) — inherited by every dashboard dialog | `components/dashboard/primitives/modal.tsx:27-38` | Keyboard/AT users escape modals into a blocked page | Trap + restore focus |
| M11 | `Settings → Account` has no error branch — query failure renders a broken form with `email=""`, `hasPassword=false` | `app/dashboard/settings/account/page.tsx:43-46` | User sees an empty/actionable-looking form that can't work | ErrorState branch |
| M12 | Approval gate: ADMIN can approve their own review request (no self-approval block); OWNER exemption is intentional but undocumented in UI | `server/services/review.service.ts:176-197` | Sign-off wedge weakened | Reject `resolverId === requestedById` |
| M13 | Activity has no home: "Recent activity → View all" routes to **Notifications**; no activity-history page exists | live-verified; `app/dashboard/page.tsx` activity card | Dead-end + concept conflation | Either an activity page or scope the link to a filtered view |
| M14 | Template detail page has no preview — gray placeholder, no page list, no screenshots; the discover→preview→select journey is missing its middle step | `app/dashboard/templates/[id]/page.tsx` (live-verified) | Users commit to a template blind | Add preview (rendered pages or screenshots) |
| M15 | `sites.checkSlug` unscoped (global slug enumeration); `help.feedback` public + un-rate-limited | `sites.ts:194-198`, `help.ts:33-38` | Cross-tenant probing; spam | Scope + rate-limit |
| M16 | No post-Stripe-checkout return handling: success/cancel URLs land on `/dashboard/settings/plans?checkout=…` but **nothing reads the param** (zero `checkout=` handlers in the app); Plans-page CTAs navigate to Billing instead of starting checkout | `server/services/billing.service.ts:224-225`, `settings/plans/page.tsx:230-248` | User pays, returns to a page with no confirmation, plan looks stale until the webhook | Handle `?checkout=` + wire CTAs to `createCheckoutSession` |
| M17 | `resendInvite` never re-sends the email — only bumps expiry/count; UI toasts "Invitation resent" | `server/services/team.service.ts:202-214`, `settings/team/page.tsx:74-80` | Invitee gets nothing; false success | Call `sendTeamInviteEmail` after the update |
| M18 | "Revoke all other sessions" dead + current session self-revocable — `SecurityTab` rendered with no `currentSessionId`; handler early-returns; no "Current" badge; every row (incl. current) shows Revoke. 07-06 defect **still open** | `settings/security/page.tsx:6`, `components/settings/security-tab.tsx:32,108-113,409,425-435` | Security control no-ops; user can kill own session | Pass `currentSessionId` (or `sessions.current` proc) |
| M19 | Data export is a stub: creates an `exportJob` row, **no processor exists**, `sendExportReadyEmail` has zero callers; UI promises "you'll be notified when ready" | `server/services/account.service.ts:205-212`, `settings/danger/page.tsx:30` | Promise never resolves — GDPR-adjacent trust hole | Build the worker or remove the button |
| M20 | Sole-owner/active-subscription guard on account deletion dead on **both** layers: backend has no check, UI warning block exists but never receives its props. 07-06 defect **still open** | `account.service.ts:185-203`, `settings/danger/page.tsx:85-90`, `danger-zone-tab.tsx:166-189` | Sole owner deletes account, workspace orphans with live subscription | Wire the check server-side + pass the props |
| M21 | AI site generation strands users: status-poll error is swallowed (`isError` ignored, `??"QUEUED"`/`??0` fallbacks) → permanent "Queued 0%" spinner; retry-gate counter resets on remount | `sites/new/page.tsx:204,210-211,223-226`, `routers/templates.ts:87` | Silent dead end on the flagship creation path | Handle `jobStatusQuery.isError` in the wizard |
| M22 | Media folders are unfillable from the dashboard: upload never sends `folderId`, and `media.moveAsset` has no dashboard caller — folders filter a set that can never contain anything | `components/media/media-library.tsx:133,136`, `server/trpc/routers/media.ts:190` | Users create folders that stay empty forever | Pass active folder on upload + add "Move to folder" |
| M23 | Dashboard "Send for Review" silently **rotates and kills the client's active review link**: every `reviews.submit` mints a fresh token and invalidates the old one, but the dashboard modal collects no client email and never surfaces the URL — the new token goes nowhere. Button also renders in non-agency workspaces where submit throws FORBIDDEN | `components/reviews/send-review-modal.tsx:20,43` (no email/URL), `server/services/review.service.ts:78-85`, `reviews.ts:57-61` (`requireAgencyLayer`) | Agency sends client a link from the editor; anyone pressing the dashboard button breaks that link with zero feedback | Either collect email/show link in the modal, or make dashboard submit not rotate the client token; hide button when flag off |
| M24 | API tokens are decorative: full CRUD UI + scope picker, but `scopedProcedure` has **zero** consumers and `protectedProcedure` rejects bearer — a minted token can call nothing | `components/settings/api-tokens-tab.tsx:9-19,42-64`, `server/trpc/trpc.ts:109-116,127-142` | Settings page sells an API that doesn't exist | Adopt `scopedProcedure` on target endpoints or hide the page |
| M25 | Theme-push safety layer still unwired: `previewPush`, `rollback`, `snapshots`, `presets.*` all built and ADMIN-gated server-side, **zero UI callers** — the blast-radius controls the CEO review required before agency GA | `server/trpc/routers/theme.ts:126-204` vs `components/theme/theme-manager.tsx:28-49` (only getShared/targets/capture/setLock/push) | Irreversible multi-site pushes with no preview or undo | Wire preview + rollback UI (backends done) |
| M26 | Marketplace "Install" persists a row nothing consumes — catalog is static, first-party installs (Commerce, Analytics Pro) have no behavior; the page itself notes real connections live in Integrations | `app/dashboard/marketplace/page.tsx:22,34-45`, `lib/marketplace-catalog.ts` | "Installed" state is a fiction | Point cards at real capabilities or label as directory |

### MINOR

| # | Finding | Where |
|---|---------|-------|
| N1 | "1 sites" pluralization in templates browser | `app/dashboard/templates/page.tsx:137` |
| N2 | Label↔URL drift: Traffic→`/analytics`, Sharing→`/access`, Submissions→`/feedback`; nav "Sites"→`/projects` (deliberate, documented at `nav.ts:26-29`) | `tab-nav.tsx:7-16` |
| N3 | Overview "SEO" health card links to the settings tab, not the SEO tab | `overview-tab.tsx:24` |
| N4 | Decorative rising sparklines on zero-value stat cards ("Visitors 0 ↑0%" with green up-trend) | dashboard home + site overview (live) |
| N5 | Site Health "0/100" styled in accent blue, not warning color; empty bar | site overview (live) |
| N6 | ⌘K "Generate with AI" uses `?ai=true` but page reads `?method` — lands on chooser, not wizard; `?invite=true` on team route is ignored | `command-palette.tsx:58-59`, `initial-view.ts:15-17` |
| N7 | Orphan routes (URL-only reachable): `/privacy`, `/terms`, `/maintenance`, `/auth/error/{captcha,session-expired,suspicious}`, `/dev/states` (by design) | §5.2 |
| N8 | Middleware `authenticatedAuthRoutes` lists phantom `/auth/success` | `middleware.ts:6` |
| N9 | `dashboard.quickActions` backend orphan (no UI caller) and its hrefs are all legacy 404s if ever wired | `dashboard.service.ts:219-333` |
| N10 | Sites/new: typed site name is dropped when choosing "Use a Template" (no param carried into the browser) | live-verified, `sites/new/page.tsx:117` |
| N11 | `/dashboard/sites/new` has no back link/breadcrumb in page body; publish page renders no active tab in TabNav | `sites/new/page.tsx:95-158`, `tab-nav.tsx:34` |
| N12 | Help pages: no active state anywhere in topbar/sidebar (full-width route but not an Explore tab) | `nav.ts:52-66` |
| N13 | Media copy says "images, video, or fonts" — filter chips only All/Images/Logos | live-verified |
| N14 | SEO tab Google preview shows placeholder "yoursite.com" instead of the site's real domain | live-verified |
| N15 | "Google Domains" DNS guide link (defunct provider) | site domains tab (live) |
| N16 | Icon-only buttons without aria-label (share-link QR/copy/revoke, media copy/delete, domain trash has NO accessible name); member online-dot color-only | `access-tab.tsx:180-182`, `media-library.tsx:315-318`, `domains-tab.tsx:135`, `members-table.tsx:96-97` |
| N17 | Shared `DataTable` wrapper uses `overflow-hidden` (clips instead of scrolls) — inherited by domains/partner/invoices/redirects tables | `primitives/data-table.tsx:30` |
| N18 | Top-nav has zero responsive handling (crowds at phone widths); mobile bottom-bar exists and is nav-derived — dashboard is NOT desktop-only, but the topbar wasn't told | `top-nav.tsx:39-56` |
| N19 | Notifications empty copy not filter-aware ("all caught up" on every tab); marketplace installed-query flash; invoices/integrations silent query errors | `notification-page.tsx:120-126`, `marketplace/page.tsx:34` |
| N20 | Attribution spoofable: `createdBy` accepted from client input on versions/components/user-templates | `site-version.ts:28`, `site-component.ts:32`, `user-template.ts:26` |
| N21 | Suspended members: no un-suspend path (delete + re-invite only); `acceptInvite` rejects any existing row incl. SUSPENDED | `team.service.ts:168`, `auth.ts:271-276` |
| N22 | Sidebar/shell pre-hydration shows generic fallback ("Workspace", "0 / ∞ GB", missing Agency item) instead of skeletons | live-verified on `/sites/new`, `/agency` |
| N23 | "Workspace deleted" toast on what is a 30-day soft delete | `settings/danger/page.tsx:19-27` vs `workspace-settings.service.ts:150-157` |
| N24 | Usage page "Bandwidth over time" chart actually renders form-submission data | `settings/usage/page.tsx:56,63` |
| N25 | Pending-invite per-row resend/revoke spinners never activate (props not passed) — double-fire risk | `settings/team/page.tsx:175-179` |
| N26 | Onboarding `template/selected` "Open in Editor" routes to `/onboarding/ready` | `onboarding/template/selected/page.tsx:71` |
| N27 | Stripe portal entry hidden when no `paymentMethod` row — subscriber without stored card has no portal link | `settings/billing/page.tsx:270-272` |
| N28 | Bandwidth + build-minutes usage hardcoded 0 ("est." pill shown — honest stub); build caps live outside `PLAN_LIMITS` | `usage.service.ts:29,68,71`, `billing.service.ts:42` |

*(Journey-specific findings are integrated in §7; any additional items from the journey sweep appear there with the same severity scale.)*

---

## 2. As-built sitemap (code-canonical)

```
/                       → redirect /auth
/auth                   email-first hub + 33 routes (2fa, magic-link, invite, join-workspace,
                        workspace-select/setup, change-email, device-alert, 9 error pages…)
/onboarding             resume-router → workspace → site → path →
                        { blank | template (→preview→selected) | ai/(basics→goal→brand→generating→preview) } → ready
/dashboard              Home (sidebar shell: Home · Getting started · Sites→/projects · [Agency] · Media · Settings)
  /projects             sites list (folders, filters, bulk, grid/list)
  /sites/new            create chooser (name + Template|AI|Blank)
  /sites/[id]           Overview + tabs: analytics(Traffic) · domains · seo · feedback(Submissions) ·
                        redirects · access(Sharing) · settings · publish (header-only, no tab)
  /templates, /templates/[id]     ecosystem browser + detail (full-width, no sidebar)
  /media  /notifications  /getting-started  /help(+[slug])  /learn  /resources  /marketplace
  /agency (flag)        tabs: clients · reviews · theme · partner ; /agency/[id] client detail
  /settings             card hub → workspace · security · notifications · team · plans · usage · billing ·
                        domains · integrations(+vercel-team-picker) · api-tokens · ai · account · profile · danger
/edit/[siteId]          editor seam (excluded)
/share/[token]  /review/[token]  /transfer/accept  /maintenance  /privacy  /terms  /dev/states
```

**Confirmed absences:** no `/dashboard/sites` (list = `/projects`; bare URL 404s), no `/dashboard/team`, no `/dashboard/billing` — and **no legacy redirects** for any of them (middleware has no rewrite map), which is what turns every stale reference into a hard 404.

## 3. Navigation model — assessment

- **SSOT is real and good:** `components/dashboard/shell/nav.ts` feeds sidebar, topbar, mobile bar, and ⌘K. Active-state logic maps all `/dashboard/sites*` to the Sites item. Full-width predicate keeps sidebar/topbar consistent.
- **Two-layer model is sound:** sidebar = workspace ops (Home/Sites/Agency/Media/Settings), topbar Explore = ecosystem (Marketplace/Learn/Resources/Templates). Templates as a topbar destination is the right call (discover-mindset), matching the three-way audit's model.
- **Gaps:** Help belongs to neither layer (no active state, §N12); site-detail Publish has no tab; `/sites/new` floats without breadcrumb; drill-in back-links exist everywhere else (settings "‹ Settings", template detail history-aware back, agency [id] back).

**Proposed corrections (nav only):**
1. Add legacy redirects: `/dashboard/sites → /dashboard/projects`, `/dashboard/team → /dashboard/settings/team`, `/dashboard/billing → /dashboard/settings/billing` (middleware, 3 lines each — makes C5/M-class dead links degrade gracefully forever).
2. Give Help an owning home: either an Explore tab or keep "Resources → Help" and highlight Resources when inside `/dashboard/help`.
3. Add a Publish entry to the site TabNav (it is a destination, not just an action).
4. Rename either the tab labels or the route segments so support/docs/deep-links speak one language (recommend keeping labels, renaming segments at the next breaking-change window; low priority).

## 4. Template placement — answer to the standing question

Model is correct as shipped; needs *statement*, not rebuild (consistent with the three-way audit):

| Job | Home | Verdict |
|-----|------|---------|
| Discover/browse | Topbar → `/dashboard/templates` (+detail) | ✅ canonical, all entry points converge (⌘K, home quick-action, empty states, sites/new chooser, `?method=template` redirects) |
| Start a site | `sites/new` + onboarding route INTO the browser / wizard-scoped picker | ✅ borrow, don't fork (onboarding keeps a thin wizard-framed picker — acceptable) |
| Apply to existing site | Site detail → More → Apply template (confirmed destructive) | ✅ placement; ❌ needs the C1 role gate |
| Gap | Detail page has **no preview** (M14); name typed in sites/new is dropped (N10); "1 sites" (N1) | fix within the model |

## 5. Connective-tissue detail

### 5.1 Dead links (all verified live in code)
| Source | Target | Should be |
|--------|--------|-----------|
| `auth.ts:316` MEMBER_JOINED notification | `/dashboard/team` | `/dashboard/settings/team` |
| `email.service.ts:140,145,150,195` (dunning ×3, plan-limit) | `/settings/billing` | `/dashboard/settings/billing` |
| `email.service.ts:160` account-deletion cancel | `/settings/danger-zone` | `/dashboard/settings/danger` |
| `email.service.ts:170,215,256` (AI done, transfer, review) | `/sites/<id>` | `/dashboard/sites/<id>` |
| `email.service.ts:175` AI failed retry | `/sites/new` | `/dashboard/sites/new` |
| `email.service.ts:185` workspace transfer | `/settings/workspace` | `/dashboard/settings/workspace` |
| `email.service.ts:190` SSL expiring | `/domains/<id>` (no such family) | `/dashboard/sites/<siteId>/domains` |
| `email.service.ts:210` form submission | `/forms/<id>` (no such family) | `/dashboard/sites/<siteId>/feedback` |

Same file builds correct URLs elsewhere (`/dashboard/agency/reviews`, `/review/<token>`, `/transfer/accept`) — the broken set predates the IA move and was never migrated.

### 5.2 Orphan routes
`/privacy`, `/terms` (modal used instead — fine as permalinks), `/maintenance` (nothing points at it), `/auth/error/captcha` (captcha renders inline on /auth), `/auth/error/session-expired` (flows use `/auth?reason=…`), `/auth/error/suspicious` (no inbound anywhere), `/dev/states` (by design).

### 5.3 Backend orphans (built, zero UI callers)
`dashboard.quickActions` (UI hardcodes its own; every branch href is a legacy 404 — delete or fix), `scopedProcedure` (API tokens are deny-all in practice: tokens can be minted but nothing accepts them — the API-tokens settings page sells a capability that doesn't exist yet).

---

## 6. Role-permission matrix (code truth) + conflicts

Ranks: VIEWER 0 · EDITOR = DESIGNER 1 · ADMIN 2 · OWNER 3; CLIENT = token-scoped reviewer (not a workspace role). DESIGNER has zero capability delta vs EDITOR (`permission.service.ts:4-11`).

| Surface / action | VIEWER | EDITOR=DESIGNER | ADMIN | OWNER | Token client |
|---|---|---|---|---|---|
| View dashboard, sites, media, team list | ✅ | ✅ | ✅ | ✅ | — |
| Edit pages/CMS/content | ❌ | ✅ | ✅ | ✅ | ❌ |
| Create site / folder | ⚠ **✅ today** → ❌ | ✅ | ✅ | ✅ | ❌ |
| Rename/duplicate/save project | ❌ | ✅ | ✅ | ✅ | ❌ |
| Publish (single) | ❌ | ✅ *if approved* | ✅ | ✅ (exempt) | ❌ |
| Publish (bulk) | ❌ | ❌ | ⚠ **status-flip only, no deploy/gate (C3)** | same | ❌ |
| Unpublish / archive / cancel publish | ❌ | ❌ | ✅ | ✅ | ❌ |
| Delete / transfer site | ❌ | ❌ | ❌ | ✅ | ❌ |
| Apply template to site | ⚠ **✅ today (C1)** → ❌ | → ❌ | ✅ | ✅ | ❌ |
| Use/clone template, AI generate | ⚠ **✅ today** → ❌ | ✅ | ✅ | ✅ | ❌ |
| Form submissions edit/delete | ⚠ **✅ today (M2)** → ❌ | ✅ | ✅ | ✅ | ❌ |
| Site versions/components create/delete | ⚠ **✅ today (M2)** → ❌ | ✅ | ✅ | ✅ | ❌ |
| Share links create | ❌ | ✅ (workspace policy can restrict) | ✅ | ✅ | ❌ |
| Share links revoke; redirects; domains; site settings save | ❌ | redirects ✅ / rest ❌ | ✅ | ✅ | ❌ |
| Team invite/roles/revoke; audit log | ❌ | ❌ | ✅ (⚠ wrong-workspace bug M3) | ✅ | ❌ |
| Workspace settings / sharing policy | ❌ | ❌ | ✅ | ✅ | ❌ |
| Workspace delete / transfer | ❌ | ❌ | ❌ | ✅ | ❌ |
| Billing (checkout, cancel, portal, interval) | ⚠ **✅ today (C2)** → ❌ | → ❌ | read | ✅ | ❌ |
| Integrations add | ⚠ **✅ today** → ❌ | → ❌ | ✅ | ✅ | ❌ |
| Integrations remove/update | ❌ | ❌ | ✅ | ✅ | ❌ |
| API tokens create/revoke | ⚠ **✅ today, any scopes** | same | ✅ | ✅ | ❌ |
| Agency: clients/theme/reviews resolve | ❌ | reviews submit ✅ | ✅ | ✅ | ❌ |
| Client review: comment / approve / request changes | — | — | — | — | ✅ (after email identify) |

**Access-denied behavior today:** agency cluster = proper `DeniedState`; agency flag off = redirect to /dashboard; editor loader = 404 for VIEWER (correct); everywhere else = full render + FORBIDDEN toast on click (billing: no denial at all — C2). There is no role-aware UI layer (`useRole` doesn't exist); recommendation: add one hook + gate the six worst surfaces (billing actions, team mutations, site settings save, domains, danger zone, apply-template).

---

## 7. Journey audit (page → tRPC → service)

Severity-registered items live in §1 (referenced by ID); this section records per-journey verdicts.

| Journey | Verdict | Notes |
|---|---|---|
| **Auth** (33 routes) | ✅ solid | Email-first flow, 2FA, magic link, reset, invites accept/decline all wired. 3 orphan error pages remain (`captcha`, `session-expired`, `suspicious` — N7); middleware lists phantom `/auth/success` (N8) |
| **Invites** | ⚠ M17 | Send → email → accept/decline/expiry-cron all correct (`email.service.ts:127` link is valid). **Resend is a lie** (M17); per-row spinner props never passed (minor) |
| **Onboarding** (rebuilt, 14 screens) | ✅ mostly | All three creation paths land in editor via `getEditorHref`; wizard resume via saved `wizardData.route`. Gaps: wizard state saves swallow errors (`wizard-context.tsx:24,67` — M9), template-picker error→fake-empty (minor), "Open in Editor" on `template/selected` actually routes to `/onboarding/ready` (minor) |
| **Workspaces** | ✅ solid | Create/switch (NextAuth `update({workspaceId})`), transfer initiate/accept/cancel + expiry cron, delete + grace banners on home — all wired. "Workspace deleted" toast wording misleads about the 30-day soft delete (minor) |
| **Site creation** | ⚠ M21 | Template/AI/Blank all wired; old inline gallery confirmed deleted (redirects to `/dashboard/templates`). AI path strands on poll error (M21); typed site name dropped when entering template browser (N10) |
| **Site management** (8 tabs) | ⚠ M1 | All tabs render; publish flow has checks + SSE + cancel/retry. Old "Share with Client →/sharing" 404 is **fixed** (route audit found no such href). Domains/Redirects/Access/Analytics error-as-empty (M1); pages-count contradiction (M6) |
| **Templates** | ✅ model is right | One canonical browser; apply-to-existing has proper 2-step destructive confirm (but no role gate — C1). No preview on detail (M14). Two parallel template→site procedures (`templates.use` vs `sites.create` template branch used by onboarding) — consistent but duplicated (minor). `templates.cloneFromSite` orphan |
| **Billing/subscriptions** | ❌ C7+M16+M4+M5 | Stripe checkout/portal/cancel/reactivate wired for FREE→paid, **but no tier-change path for paid users (C7)**, no checkout-return handling (M16), wrong price display (M4), $0 plans flash (M5). Dunning banner + cron OK. `billing.usage`/`switchInterval` orphans (the latter also does a raw unpriced DB write — C2 adjunct) |
| **Agency/clients/theme** | ⚠ M25 | Clients CRUD + detail + white-label wired with model states; reviews queue + comments queue mounted and live (verified — an earlier "unmounted" claim was false). Theme capture/lock/push wired; **preview/rollback/snapshots/presets orphaned (M25)** |
| **Client review loop** | ⚠ M23 | `/review/[token]` identify→view→comment→approve/request-changes wired and deliberately public-by-token; stale-approval acknowledge path exists (`sites.ts:294`). The dashboard Send-for-Review modal breaks the loop (M23) |
| **Notifications** | ✅ + 1 dead link | Page + SSE + prefs wired; MEMBER_JOINED actionUrl → dead `/dashboard/team` (C5 family); mark-read/delete silent-fail (minor) |
| **Activity** | ❌ M13 | No activity page; home card "View all" → notifications. `team.auditLog` procedure orphaned — the data exists, no surface |
| **Analytics** | ✅ real | Beacon → `/api/public/track` → event rows → aggregate cron → charts. No fake numbers. Granularity locked to daily (minor) |
| **Domains** | ✅ clean | Site tab = connect/DNS-instructions/remove/set-primary + 30s polling; verification via `dns-verify`/`ssl-check` crons (no manual "verify now" — minor); workspace Settings→Domains page is a correctly-scoped read-only monitor |
| **Media** | ⚠ M22 | Upload path guarded (auth/quota/size/folder-ownership) with toasts; quota bar + 80% warning. Folders unfillable (M22); assets-grid error-as-empty (M1) |
| **Account/security** | ⚠ M18-M20 | Profile/2FA/backup-codes/login-history/change-email/providers all wired. Revoke-all dead (M18), export stub (M19), sole-owner guard dead (M20) |
| **API tokens / AI settings** | ❌ M24, D2 | Token CRUD works; nothing accepts tokens (M24). AI credits real; 4 permanent "Coming Soon" cards (minor, known) |
| **Help/Learn/Resources/Marketplace/Getting-started** | ✅ / ⚠ M26 | Help articles + search + tickets wired (feedback endpoint public — M15); Learn/Getting-started query-backed with states; Resources static launcher; Marketplace install is decorative (M26) |
| **Logout** | ✅ | All entry points use `POST /api/auth/logout` (deletes sessions, clears cookie, audits). Orphan tRPC `auth.logout` never clears cookie — remove (minor) |

### Orphan backend inventory (zero UI callers — delete or wire)
`theme.previewPush` / `theme.rollback` / `theme.snapshots` / `theme.presets.*` (M25) · `dashboard.quickActions` (every href a legacy 404 — N9) · `billing.usage` + `billing.switchInterval` (unsafe raw write) · `team.auditLog` · `auth.logout` (tRPC) · `templates.cloneFromSite` · `media.moveFolder` (orphan everywhere; `moveAsset`/`updateAsset`/`generateAltText`/asset-versions/stock-search are editor-only by design) · `sendExportReadyEmail` (M19) · `scopedProcedure` (M24). No UI call targets a non-existent procedure — the drift is all one-directional (server ahead of UI).

---

## 8. Missing-state checklist (page × state)

✓ handled · ✗ gap · — n/a. Full evidence in the state sweep; gaps ranked in §1.

| Page | Loading | Error | Empty | Denied |
|---|---|---|---|---|
| Home | ✓ | ✓ | ✓ (role variants) | — (activity error → fake-empty, minor) |
| Projects list | ✓ | ✓ | ✓ true+filtered | — |
| Templates / detail | ✓ | ✓ | ✓ | — |
| Sites/new + AI wizard | ✓ | ✓ + retry + beforeunload | — | — |
| Site Overview / Settings / SEO / Feedback / Publish | ✓ | ✓ | ✓ | ~ (shell merges not-found+denied, no back action) |
| **Site Domains / Redirects / Access / Analytics** | ✓ | **✗ error→fake-empty (M1)** | ~ | ✗ |
| Media | ✓ | ✓ page-level / **✗ assets grid (M1)** | ✓ (search-aware) | — |
| Notifications | ✓ | ✓ | ✓ (not filter-aware) | — |
| Help / Learn / Getting started | ✓ | ✓ | ✓ | — |
| Marketplace | ✗ installed-flash | ~ mutations only | — | — |
| Agency cluster (clients/reviews/theme/partner/[id]) | ✓ | ✓ | ✓ | ✓ **model implementation** |
| Settings hub | ~ | ✗ silent | — | — |
| Settings: Profile / Security / Notifications / Workspace / Team / Usage / Domains / AI | ✓ | ✓ | ✓ where relevant | ✗ (workspace FORBIDDEN → generic error) |
| **Settings: Account** | ✓ | **✗ broken empty form (M11)** | — | ✗ |
| **Settings: Plans** | **✗ $0 flash (M5)** | **✗** | — | — |
| Settings: Billing | ✓ | ✓ | ~ invoices silent | ✗ (C2 — no denial concept) |
| **Settings: API tokens** | ✓ | **✗ error→fake-empty (M1)** | ✓ | ✗ |
| Onboarding screens | ✓ | ✓ (template picker: error→fake-empty, minor) | ✓ | — |
| Transfer accept | — | ✓ + retry | — | — |

Cross-cutting state gaps: unsaved-changes (M8 — one `beforeunload` in the whole app), destructive-confirm coverage (C6/M7), mutation feedback (M9), focus trap (M10).

---

## 9. Broken-UI report (live pass, owner role, desktop 1551px)

Verified rendering clean: dashboard home, projects (grid+folders), site detail all 8 tabs, templates browser+detail, sites/new, media, agency (4 tabs), settings hub, billing, notifications, marketplace, account menu. Zero console errors across the visited set. Specific visual defects found live: M4 ($79/yr, 0/-1), M6 (5 pages vs 0), M13 (View-all→notifications), M14 (no template preview), N1 (1 sites), N4-N5 (sparkline/health honesty), N10 (dropped site name), N13-N15 (copy nits), N22 (fallback-not-skeleton hydration). Mobile could not be live-tested (window resize blocked by tooling); code-level: real mobile bottom-bar exists, top-nav lacks any responsive handling (N18), shared DataTable clips instead of scrolls (N17).

---

## 10. Corrected end-to-end flows (recommendations)

1. **Money loop (highest priority):** upgrade → checkout → **return with confirmation** (M16) → correct price shown (M4/M5) → later change tier via a reachable control (C7) → if payment fails, dunning email → **working** billing link (C5) → portal. Today the loop is broken at entry (C7), return (M16), display (M4/M5), and recovery (C5).
2. **Role loop:** invite VIEWER → viewer sees read-only UI → server enforces read-only. Today both halves leak (C1/C2/M2 + no role-aware UI). Gate the six backends, add `useRole`, hide/disable gated actions.
3. **Publish loop:** edit → send for review → approve → publish → live URL; bulk publish must run the same pipeline or not exist (C3); add self-approval block (M12).
4. **Template loop:** browse → **preview** → use → editor; site name carried through; apply-to-existing stays behind confirm + ADMIN.
5. **Trust loop (states):** any failed query shows an error with retry — never "No X yet" (M1); any destructive action confirms (C6/M7); any long form guards unsaved changes (M8).
6. **Activity loop:** either ship `/dashboard/activity` (audit log exists server-side) or relabel the home card and remove "View all" (M13).

## 11. Prioritized fix sequence

**Week 1 — money + trust (all small diffs): ✅ DONE 2026-07-22** — C7 tier-change control (paid→Portal, FREE→checkout) · M16 checkout return handling · C5 email URLs + join-notification + 3 middleware legacy redirects + N8 phantom route · M4 unlimited display · M5 plans loading/error · C6 remove-member confirm (per-row + bulk) · M17 resend-invite email · N1 plural. 8 atomic commits `6b8a0807`..`5d0babe8`; 333 server tests green; live-verified in browser. Not pushed.
**Week 2 — authorization: ✅ DONE 2026-07-22** — C1 applyToSite→ADMIN (+ cloneFromSite/use→EDITOR) · C4 templates.get workspace-scoped · C2 billing.*→OWNER · C3 bulk publish/unpublish removed (schema+service+router+UI dead branch) + sites.create/folders.create→EDITOR · M2 VIEWER-mutable resources gated via new `guardSiteRole` (forms submissions, site versions/components, user templates) + api-tokens→ADMIN + integrations.add→ADMIN · N20 createdBy stamped server-side · M3 team resolves via `resolveWorkspaceId` (active+ACTIVE). 6 commits `56de0d4d`..`13f44811` + 6 new authz regression tests; 355 server tests green; tsc 0; owner live-smoke clean. Still open from this tier: M12 self-approval block, M23 review-token rotation. Not pushed.
**Week 3 — states + dead ends: ✅ MOSTLY DONE 2026-07-22** — M1 error-as-empty (Domains/Redirects/Access/Analytics/API-tokens/media grid) + M11 account page → real ErrorState with retry · M7 confirms (unpublish, remove-domain, delete-asset) + N16 aria-labels · M9 silent failures (bulk onError, session-revoke try/finally, avatar-upload catch, + missing onError toasts on domain-remove/redirect-delete/share-revoke/token-revoke+delete/asset-delete) · M10 focus trap + restore in the shared Modal (fixes every dialog) · M21 AI poll-error surfaced · M22 media folder upload (pass folderId). 6 commits `343f560d`..`695ca5bc`; 355 server tests green; tsc 0; unpublish-confirm + billing + media browser-verified. **Week-3.5 followup — ✅ DONE 2026-07-22** — M18 revoke-all-sessions + Current badge (baked DB session id into JWT as `sid` claim, survives NextAuth rotation; `getActiveSessions` flags isCurrent by id; dead prop removed) · M20 sole-owner + active-subscription account-deletion guard (backend `getAccountDeletionEligibility` + `AccountDeletionBlockedError`, UI warning + disabled button wired) · M8 `useUnsavedChanges` beforeunload guard on site-settings (custom code) + workspace form. 3 commits `af0ffce9`..`48053243` + 2 regression tests (M18 session-flag, M20 deletion-guard); 363 server tests green; both browser-verified (Current badge + revoke shown correctly; deletion warning + disabled button). Not pushed.
**Week 4 — honesty + IA polish:** decide build-or-remove for M19 export, M24 API tokens, M26 marketplace, M25 theme safety UI (wire it — backends done, and it gates agency GA) · M13 activity home · M14 template preview · N6/N10/N11/N12 · a11y batch (N16-N17).

---

*Every claim traces to file:line in this repo at `main` (2026-07-22) or to a live screenshot taken during the audit session. No code was modified.*
