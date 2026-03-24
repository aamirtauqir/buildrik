# Phase 4: Onboarding + Help + Global Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete onboarding flow, help center, error pages, cookie consent, offline detection, responsive layout, and accessibility for launch readiness.

**Architecture:** Fix-in-place for existing files. Create 4-5 new pages (error pages, share gate, article detail). No new services or routers.

**Tech Stack:** Next.js 16, tRPC 11, Prisma 5, React 19, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-03-24-phase4-polish-design.md`

---

## PART A: ONBOARDING (Tasks 1-3)

### Task 1: Onboarding Pages — Role Select + Project Setup

**Files:**
- Modify: `app/onboarding/role/page.tsx`
- Modify: `app/onboarding/setup/page.tsx`
- Modify: `components/onboarding/role-select.tsx`
- Modify: `components/onboarding/project-setup.tsx`
- Modify: `components/onboarding/onboarding-sidebar.tsx`

- [ ] **Step 1: Verify and enhance role select page**

Read all onboarding files. Ensure:
- 72px dark sidebar (`#0D0D0D` bg) with step indicators
- 3 role cards: Freelancer, Small Team, Agency — each with icon + title + description
- Continue button disabled until one selected
- Wire selection to `trpc.onboarding.selectRole`
- On success → navigate to `/onboarding/setup`
- Accent color: #E42313

- [ ] **Step 2: Verify and enhance project setup page**

Ensure:
- Name input (2-100 chars) with validation
- 3 path cards: AI Generate (sparkle icon), Template (grid icon), Blank (file icon)
- Back arrow → `/onboarding/role`
- On method select: store via `trpc.onboarding.setupProject`
- Route: AI → `/dashboard/sites/new?method=ai`, Template → `/dashboard/sites/new?method=template`, Blank → create site via `trpc.sites.create` + redirect to editor

- [ ] **Step 3: Verify onboarding sidebar**

Ensure sidebar shows current step highlighted with step names: Role, Setup, Create, Tour, Checklist.

- [ ] **Step 4: Commit**

```bash
git add app/onboarding/ components/onboarding/
git commit -m "feat(onboarding): verify and enhance role select + project setup pages"
```

---

### Task 2: Onboarding — Checklist + Flow Hook + Invited Users

**Files:**
- Modify: `components/onboarding/dashboard-checklist.tsx`
- Modify: `lib/hooks/use-onboarding-flow.ts`

- [ ] **Step 1: Verify dashboard checklist**

Read `dashboard-checklist.tsx`. Ensure 7 tasks listed:
1. Add your first text block
2. Upload an image
3. Change your site name
4. Add a second page
5. Preview your site
6. Invite a team member
7. Publish your site

Wire each task completion to `trpc.onboarding.completeStep`. Add dismiss button.

- [ ] **Step 2: Handle invited user 3-task checklist**

Add variant handling: if user was invited (detect via prop or query), show only 3 tasks:
1. Edit a page
2. Preview your site
3. Invite a team member

- [ ] **Step 3: Verify onboarding flow hook**

Read `use-onboarding-flow.ts`. Verify all step transitions work correctly:
- ROLE_SELECT → /onboarding/role
- PROJECT_SETUP → /onboarding/setup
- SITE_CREATION → /onboarding/setup (with AI/template/blank in progress)
- EDITOR_TOUR / CHECKLIST → /dashboard
- COMPLETED → /dashboard

- [ ] **Step 4: Commit**

```bash
git add components/onboarding/dashboard-checklist.tsx lib/hooks/use-onboarding-flow.ts
git commit -m "feat(onboarding): checklist with 7 tasks, invited user 3-task variant, flow hook"
```

---

### Task 3: Tour Step Completion API

**Files:**
- Modify: `server/services/onboarding.service.ts`
- Modify: `server/trpc/routers/onboarding.ts`

- [ ] **Step 1: Verify tour completion functions**

Read both files. Ensure:
- `completeTourStep(userId, step)` increments `tourStep` field
- `completeTour(userId)` sets `tourCompleted: true` and advances to CHECKLIST step
- Router has `completeTourStep` and `completeTour` mutations

These are called by the editor (separate PRD), so we just ensure the API contract works.

- [ ] **Step 2: Commit**

```bash
git add server/services/onboarding.service.ts server/trpc/routers/onboarding.ts
git commit -m "feat(onboarding): verify tour step completion API contract"
```

---

## PART B: HELP CENTER (Tasks 4-5)

### Task 4: Help Center Page + Article Detail + Search

**Files:**
- Modify: `components/help/help-center.tsx`
- Modify: `components/help/article-list.tsx`
- Create: `app/dashboard/help/[slug]/page.tsx`
- Modify: `app/dashboard/help/page.tsx`

- [ ] **Step 1: Enhance help center page**

Read `help-center.tsx`. Ensure:
- 6 category cards (Getting Started, Sites, Team, Billing, Domains, AI)
- Search bar wired to `trpc.help.search`
- Contact Support section: Email card + Live Chat placeholder
- Keyboard shortcuts section with Cmd+K, Cmd+N, etc. + "Print" button (`window.print()`)

- [ ] **Step 2: Enhance article list**

Read `article-list.tsx`. Wire to display search results with: title, excerpt, read time, category badge.

- [ ] **Step 3: Create article detail page**

Create `app/dashboard/help/[slug]/page.tsx`:
- Fetch article via `trpc.help.getArticle({ slug })`
- Render title, category badge, read time, full content
- "Was this helpful?" thumbs up/down → `trpc.help.submitFeedback`
- "Back to Help Center" link

- [ ] **Step 4: Commit**

```bash
git add components/help/ app/dashboard/help/
git commit -m "feat(help): help center with search, article detail with feedback, shortcuts"
```

---

### Task 5: Contextual Help + Ticket Form

**Files:**
- Modify: `components/help/contextual-help.tsx`
- Modify: `components/help/ticket-form.tsx`

- [ ] **Step 1: Wire contextual help dropdown**

Read `contextual-help.tsx`. Add route-to-articles static mapping:
```typescript
const CONTEXT_MAP: Record<string, string[]> = {
  "/dashboard": ["getting-started", "dashboard-guide", "quick-actions"],
  "/dashboard/sites": ["managing-sites", "publishing", "templates"],
  "/dashboard/team": ["team-permissions", "inviting-members", "roles"],
  "/dashboard/billing": ["billing-plans", "payment-methods", "invoices"],
  "/dashboard/settings": ["account-settings", "security", "workspace"],
};
```
Show 3 articles based on current pathname.

- [ ] **Step 2: Enhance ticket form**

Read `ticket-form.tsx`. Ensure:
- Subject, category dropdown, description textarea
- File attachments (max 5, accept PNG/JPG/PDF)
- On submit → `trpc.help.createTicket`
- On success → HELP-3 confirmation: "Ticket #{id} Created" + SLA per plan

- [ ] **Step 3: Commit**

```bash
git add components/help/contextual-help.tsx components/help/ticket-form.tsx
git commit -m "feat(help): contextual dropdown with route mapping, ticket form with confirmation"
```

---

## PART C: GLOBAL FEATURES (Tasks 6-8)

### Task 6: Error Pages — 404, 500, Maintenance

**Files:**
- Create: `app/not-found.tsx`
- Create: `app/error.tsx`
- Create: `app/dashboard/error.tsx`
- Create: `app/maintenance/page.tsx`

- [ ] **Step 1: Create 404 page**

`app/not-found.tsx`:
- Centered card with "404 — Page Not Found"
- CTAs: "Go to Dashboard" (primary) + "Go Back" (ghost, `router.back()`)
- Sidebar visible (if in dashboard layout)

- [ ] **Step 2: Create global error page**

`app/error.tsx`:
- "use client" (required by Next.js)
- Warning icon + "500 — Something Went Wrong" + "Our team has been notified"
- Error ID display (from error props)
- CTAs: "Try Again" (reload) + "Go to Dashboard"

- [ ] **Step 3: Create route-level error boundary**

`app/dashboard/error.tsx`:
- Renders within dashboard layout (sidebar + topbar stay functional)
- "Failed to load this page" + Retry button + "Back to Dashboard" link

- [ ] **Step 4: Create maintenance page**

`app/maintenance/page.tsx`:
- Full-screen (no sidebar, no layout)
- Buildrik logo centered
- "We'll be back shortly" + estimated return time if available
- Auto-refresh every 60s checking `GET /health`

- [ ] **Step 5: Commit**

```bash
git add app/not-found.tsx app/error.tsx app/dashboard/error.tsx app/maintenance/page.tsx
git commit -m "feat(global): 404, 500, route-level error boundary, maintenance pages"
```

---

### Task 7: Offline Banner + Cookie Consent + API Interceptor

**Files:**
- Modify: `components/global/offline-banner.tsx`
- Modify: `components/global/cookie-consent.tsx`
- Modify: `lib/trpc/client.tsx`

- [ ] **Step 1: Enhance offline banner**

Read `offline-banner.tsx`. Add:
- "Back online" success toast on reconnection (import toast from toast-provider)
- Retry countdown display: "Auto-retrying in {N}s..."

- [ ] **Step 2: Verify cookie consent**

Read `cookie-consent.tsx`. Verify:
- 3 buttons: Accept All, Essential Only, Manage Preferences
- Manage modal: Essential (disabled toggle) + Analytics (on by default)
- Stores `buildrik_consent` cookie
- Dismissed permanently
- Bottom bar: 64px, bg: #FFFFFF, border-top: 1px #E8E8E8

- [ ] **Step 3: Add tRPC error interceptor**

Read `lib/trpc/client.tsx`. Add error handling in the tRPC link:
- On 401 (UNAUTHORIZED): redirect to `/auth/login`
- On 500: show toast "Something went wrong"
- On network error: show toast "Network error. Check your connection."

- [ ] **Step 4: Commit**

```bash
git add components/global/offline-banner.tsx components/global/cookie-consent.tsx lib/trpc/client.tsx
git commit -m "feat(global): offline reconnection toast, cookie consent verify, tRPC error interceptor"
```

---

### Task 8: Share Password Gate Page

**Files:**
- Create: `app/share/[token]/page.tsx`

- [ ] **Step 1: Create share password gate**

Public page (no auth required):
- Centered card with lock icon
- "This site is password protected"
- Password input + "View Site" CTA
- On submit: POST to share link verify-password endpoint
- On success: set `buildrik_share_auth` cookie + redirect to published site URL
- On error: "Incorrect password" inline error, red input border

- [ ] **Step 2: Commit**

```bash
git add app/share/[token]/page.tsx
git commit -m "feat(global): share link password gate page"
```

---

## PART D: RESPONSIVE + ACCESSIBILITY (Tasks 9-10)

### Task 9: Responsive Layout — Sidebar + Auth + Tabs

**Files:**
- Modify: `components/dashboard/sidebar.tsx`
- Modify: `components/auth/auth-card.tsx`
- Modify: `components/site-detail/tab-nav.tsx`

- [ ] **Step 1: Sidebar → bottom tab bar on mobile**

Read `sidebar.tsx`. Add responsive behavior:
- Desktop (>= 1024px): current 220px sidebar
- Tablet (768-1023px): collapsible hamburger menu
- Mobile (< 768px): bottom tab bar with 5 icons (Home, Sites, Team, Billing, Settings)

Use Tailwind: `hidden lg:flex` for desktop sidebar, `fixed bottom-0 lg:hidden` for mobile tab bar.

- [ ] **Step 2: Auth card mobile responsive**

Read `auth-card.tsx`. Add: `max-w-[420px] w-[calc(100vw-32px)]` for mobile adaptation. Social buttons stack vertically below 360px.

- [ ] **Step 3: Site detail tabs responsive**

Read `tab-nav.tsx`. Add:
- Desktop: horizontal tabs
- Tablet: horizontal scroll with overflow-x-auto
- Mobile: dropdown selector

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/sidebar.tsx components/auth/auth-card.tsx components/site-detail/tab-nav.tsx
git commit -m "feat(responsive): mobile tab bar, auth card adaptation, site detail tab dropdown"
```

---

### Task 10: Accessibility — ARIA + Focus + Reduced Motion

**Files:**
- Modify: Various components (5-6 files)
- Modify: `app/globals.css` or Tailwind config

- [ ] **Step 1: Add ARIA labels**

Add `aria-label` to:
- Command palette search input: "Search Buildrik"
- Password eye toggle: "Toggle password visibility"
- OTP inputs: "Digit {N} of verification code"
- Stat cards (clickable): "View {title} details"
- Bulk action checkboxes: "Select {siteName}"
- Modal close buttons: "Close dialog"
- Notification bell: "Notifications ({count} unread)"

- [ ] **Step 2: Add focus-visible styles**

In global CSS or Tailwind:
```css
*:focus-visible {
  outline: 2px solid var(--color-primary, #E42313);
  outline-offset: 2px;
}
/* Auth pages override */
.auth-layout *:focus-visible {
  outline-color: #3B82F6;
}
```

- [ ] **Step 3: Add reduced motion**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ app/globals.css
git commit -m "feat(a11y): ARIA labels, focus-visible indicators, reduced motion support"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`

- [ ] **Step 2: Git log — verify all 4 phases**

Run: `git log --oneline -60`

- [ ] **Step 3: Trace critical paths**

| Path | Expected |
|------|----------|
| New user signup → onboarding → dashboard | Role select → setup → create site → dashboard with checklist |
| Help center → search → article → feedback | Category cards → search → article detail → thumbs up/down |
| 404 page | Navigate to `/nonexistent` → 404 page with dashboard link |
| Offline → online | Kill network → banner appears → restore → "Back online" toast |
| Cookie consent | First visit → banner → accept → cookie set → no banner |
| Mobile dashboard | < 768px → bottom tab bar, no sidebar |
