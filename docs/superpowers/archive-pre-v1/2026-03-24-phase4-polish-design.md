# Phase 4: Onboarding + Help + Global Polish — Design Spec

**Date:** 2026-03-24
**Status:** Reviewed (v2)
**PRD Refs:** Sections 5.14-5.15, 5.20 (HELP-1), 11.1-11.3, 12.1, 13.2, 16.1-16.8
**Audit Refs:** D-22, D-29, D-37, D-39, D-44, D-59

---

## 1. Problem Statement

With Phases 1-3 complete (Auth, Dashboard+Sites, Team+Billing+Notifications+Settings), the remaining gaps are: onboarding flow completion, help center, global features (offline detection, cookie consent, error pages), responsive polish, and accessibility. These are the "last mile" items needed for launch.

---

## 2. Sub-systems

| Sub-system | Components | Estimated Gaps |
|-----------|-----------|---------------|
| Onboarding (ONB-01 to ONB-05) | 4 components, 3 pages, 1 hook | 8 |
| Help Center (HELP-1) | 4 components, 1 page | 5 |
| Global Features | offline-banner, cookie-consent, error pages | 8 |
| Responsive + A11y | All components | 6 |
| Error Pages (404/500/Maintenance) | New pages | 3 |

---

## 3. Onboarding Gaps (8)

### 3.1 Role Select Page (ONB-01)

**Files:** `app/onboarding/role/page.tsx`, `components/onboarding/role-select.tsx`

**Current:** Component + page exist.

**Needed per PRD 5.14:** 72px dark sidebar + 3 role cards (Freelancer/Small Team/Agency) + Continue button disabled until selected. Accent: #E42313.

**Implementation:** Verify layout matches PRD. Wire role selection to `trpc.onboarding.selectRole`. On success → navigate to `/onboarding/setup`.

### 3.2 Project Setup Page (ONB-02)

**Files:** `app/onboarding/setup/page.tsx`, `components/onboarding/project-setup.tsx`

**Current:** Component + page exist.

**Needed per PRD 5.15:** Name input (2-100 chars) + 3 path cards (AI Generate/Template/Blank). Back arrow. Error states.

**Implementation:** Verify layout. Wire to `trpc.onboarding.setupProject`. Route based on method: AI → `/dashboard/sites/new?method=ai`, Template → `/dashboard/sites/new?method=template`, Blank → create site + redirect to editor.

### 3.3 Onboarding Sidebar (sq42Z)

**Files:** `components/onboarding/onboarding-sidebar.tsx`

**Needed per PRD 6.7:** 72px dark sidebar with step indicators. Current step highlighted.

**Implementation:** Verify component renders correctly on onboarding pages.

### 3.4 Onboarding Flow Hook Enhancement

**Files:** `lib/hooks/use-onboarding-flow.ts`

**Current:** Basic step routing.

**Needed:** Resume from any step on return visit. Handle SITE_CREATION step → should route to editor if site was created.

**Implementation:** Verify all step transitions work. Add returnUrl support for mid-onboarding session expiry.

### 3.5 Editor Tour (ONB-04) — Stub

**Needed per PRD 5.20:** 4-step guided tour in editor. But editor is a separate PRD.

**Implementation:** Mark tour step as completable via `trpc.onboarding.completeTour`. The actual tour UI lives in editor.pen — just ensure the API contract works.

### 3.6 Dashboard Checklist (ONB-05)

**Files:** `components/onboarding/dashboard-checklist.tsx`

**Current:** Component exists. Wired in dashboard page (Phase 2).

**Needed per PRD 5.20:** 7 tasks: Add text block, Upload image, Change site name, Add page, Preview site, Invite member, Publish site. Dismiss option.

**Implementation:** Verify all 7 tasks listed. Wire task completion to `trpc.onboarding.completeStep`. Verify dismiss works.

### 3.7 Onboarding Resume on Return Visit

**Files:** `app/auth/redirect/page.tsx`

**Current:** Uses `useOnboardingFlow` hook to route.

**Needed per PRD:** If onboarding incomplete on login → resume at current step. If dismissed → dashboard.

**Implementation:** Already handled by the hook. Verify edge cases.

### 3.8 Invited User Onboarding

**Needed per PRD Flow H:** Invited users go through role select + project setup (ONB-01/02), then get a 3-task dashboard checklist (not the full 7-task checklist). Editor role → gets editor tour. Viewer → view only, no edit.

**Implementation:** When user joins via invite, their OnboardingState is created normally (step: ROLE_SELECT). The difference is the checklist: invited users see 3 tasks instead of 7. Detect invited status by checking if user has multiple workspaces or was invited. Store `dashboardTasks` with the 3-item list for invited users.

---

## 4. Help Center Gaps (5)

### 4.1 Help Center Page (HELP-1)

**Files:** `components/help/help-center.tsx`, `app/dashboard/help/page.tsx`

**Current:** Component + page exist.

**Needed per PRD 5.20:** Browse by category (6 cards), Contact Support (Live Chat + Email), Search bar, Keyboard shortcuts reference.

**Implementation:** Verify category cards link to article lists. Add keyboard shortcuts section with printable view.

### 4.2 Article List + Search

**Files:** `components/help/article-list.tsx`

**Current:** Component exists.

**Needed:** Category filtering, search results display.

**Implementation:** Wire to `trpc.help.search` query. Display results with title, excerpt, read time.

### 4.3 Article Detail View + Feedback

**Files:** `app/dashboard/help/[slug]/page.tsx` (create if not exists)

**Needed per PRD F20:** Article detail page with full content rendering. "Was this helpful?" thumbs up/down below article. Wire to `trpc.help.submitFeedback`.

**Implementation:** Create article detail page. Render article content. Add thumbs up/down buttons wired to feedback mutation.

### 4.4 Contextual Help Dropdown

**Files:** `components/help/contextual-help.tsx`

**Current:** Component exists.

**Needed per PRD 3.2:** 3 articles based on current page. Static mapping: `/dashboard` → Getting Started articles, `/sites` → Managing Sites, etc.

**Implementation:** Add route-to-articles mapping. Wire to help query or use static article slugs.

### 4.4 Support Ticket Form (HELP-2/3)

**Files:** `components/help/ticket-form.tsx`

**Current:** Component exists.

**Needed per PRD:** Subject, category dropdown, description textarea, file attachments (max 5). Confirmation screen.

**Implementation:** Wire to `trpc.help.createTicket`. On success → show HELP-3 confirmation screen: "Ticket #{id} Created" with SLA per plan (Free: Help docs, Pro: 48hr email, Business: 4hr priority). This is a distinct state within the ticket form component, not a separate page.

### 4.5 Keyboard Shortcuts Reference

**Files:** `components/help/help-center.tsx`

**Needed per PRD 11.2:** Full list of shortcuts (Cmd+K, Cmd+N, etc.) with printable view.

**Implementation:** Add shortcuts section to help center with `window.print()` button.

---

## 5. Global Features (8)

### 5.1 Offline Banner Enhancement

**Files:** `components/global/offline-banner.tsx`

**Current:** Basic offline detection using `navigator.onLine` + 15s retry.

**Needed per PRD 16.6:**
- "You're offline. Auto-retrying in 15s..." + [Retry Now] button
- Auto-dismiss + "Back online" success toast on reconnection
- Form data preserved in sessionStorage

**Implementation:** Verify current behavior matches. Add toast on reconnection. The form preservation is handled per-form (already done in form components).

### 5.2 Cookie Consent Enhancement

**Files:** `components/global/cookie-consent.tsx`

**Current:** Basic consent banner with 3 options + manage preferences modal.

**Needed per PRD AD-10 + 11.3:**
- [Accept All] [Essential Only] [Manage Preferences]
- Manage modal: Essential (always on, disabled) + Analytics (on by default)
- Store in `buildrik_consent` cookie
- Dismissed permanently

**Implementation:** Verify matches PRD. Ensure cookie is set and checked by analytics.

### 5.3 Error Pages — ERR-404

**Files:** Create `app/not-found.tsx`

**Needed per PRD 13.2:** Centered card. "404 — Page Not Found." CTAs: "Go to Dashboard" + "Go Back". Sidebar visible.

**Implementation:** Next.js App Router uses `not-found.tsx` for 404s. Create with PRD layout.

### 5.4 Error Pages — ERR-500

**Files:** Create `app/error.tsx`

**Needed per PRD 13.2:** Warning icon. "500 — Something Went Wrong." "Our team has been notified." CTAs: "Try Again" (reload) + "Go to Dashboard". Error ID for support.

**Implementation:** Next.js App Router uses `error.tsx` for error boundaries.

### 5.5 Error Pages — ERR-MAINT

**Files:** Create `app/maintenance/page.tsx` or handle via middleware

**Needed per PRD 13.2:** Full-screen (no sidebar). Buildrik logo. "We'll be back shortly." Auto-refresh every 60s via `GET /health`.

**Implementation:** Create a maintenance page. Can be triggered by environment variable or health check.

### 5.6 Global Error Boundary

**Files:** `app/layout.tsx` or `components/global/global-providers.tsx`

**Needed per PRD 16.4:** React ErrorBoundary at app root. Shows ERR-500 on render errors.

**Implementation:** Add error boundary wrapper in root layout or global providers.

### 5.7 Route-Level Error Boundary

**Files:** `app/dashboard/error.tsx`

**Needed per PRD 16.4:** Per-route error boundary that catches render errors but keeps sidebar + topbar functional. Shows: "Failed to load this page. [Retry]".

**Implementation:** Create `error.tsx` in the dashboard layout folder. This is separate from the root `app/error.tsx` (global). The route-level one renders within the dashboard layout.

### 5.8 API Error Interceptor

**Files:** `lib/trpc/client.tsx`

**Needed per PRD 16.4:** tRPC client middleware. On 401 → redirect to login. On 500 → toast. On network error → toast.

**Implementation:** Add error handling in tRPC link configuration.

### 5.9 Share Password Gate Page

**Files:** Create `app/share/[token]/page.tsx`

**Needed per PRD 5.17 SHARE-PW:** Public page. Lock icon + password input + "View Site" CTA. POST verify-password.

**Pre-requisite:** Share link backend (CRUD + password verification) was built in Phase 2 (siteDetail.sharing router + share-link.service). The `POST /share/:token/verify-password` endpoint exists. This task is frontend only.

**Implementation:** Create public share page. On submit → call verify-password. On success → set `buildrik_share_auth` cookie + redirect to published site URL. On error → show "Incorrect password" inline.

---

## 6. Responsive + Accessibility (6)

### 6.1 Mobile Sidebar → Bottom Tab Bar

**Files:** `components/dashboard/sidebar.tsx`

**Needed per PRD 16.1:** Below tablet breakpoint, sidebar becomes bottom tab bar with 5 icons.

**Implementation:** Add responsive styles using Tailwind breakpoints.

### 6.2 Auth Mobile Responsive

**Files:** Auth layout

**Needed per PRD 16.1 + D-39:** Card width = `min(420px, 100vw - 32px)`. Social buttons stack below 360px.

**Implementation:** Add responsive styles to auth card component.

### 6.3 SITE-DETAIL Tab Responsive

**Files:** `components/site-detail/tab-nav.tsx`

**Needed per PRD 16.1:** Tablet → horizontal scroll. Mobile → dropdown selector.

**Implementation:** Add responsive tab behavior.

### 6.4 ARIA Labels

**Files:** Various interactive components

**Needed per PRD 16.2 + D-59:** aria-labels on: command palette, password eye toggle, OTP inputs, stat cards, bulk checkboxes.

**Implementation:** Add aria-label attributes to interactive elements.

### 6.5 Focus Indicators

**Files:** Global CSS / Tailwind config

**Needed per PRD 16.2:** 2px outline, offset 2px. Dashboard: #E42313, Auth: #3B82F6.

**Implementation:** Add focus-visible styles globally.

### 6.6 Reduced Motion

**Files:** Global CSS

**Needed per PRD 16.2:** `prefers-reduced-motion`: instant transitions, no animations.

**Implementation:** Add `@media (prefers-reduced-motion: reduce)` styles.

---

## 7. Out of Scope

- SSE real-time (use polling)
- Dark mode (Phase 2 infrastructure only)
- Editor integration (separate PRD)
- Background cron jobs (session cleanup, analytics purge, etc.)
- Lighthouse API integration
- BroadcastChannel multi-tab sync (D-22)
- i18n (English only)

---

## 8. Success Criteria

1. Onboarding flow: role select → project setup → site creation → dashboard complete
2. Help center: categories, search, contextual dropdown, ticket submission
3. 404/500/maintenance error pages render correctly
4. Cookie consent stores preference in cookie
5. Offline banner shows/hides correctly
6. Mobile responsive: sidebar → tab bar, auth cards adapt
7. ARIA labels on all interactive elements
8. Focus indicators visible on keyboard navigation
