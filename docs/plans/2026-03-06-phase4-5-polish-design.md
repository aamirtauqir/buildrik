# Phase 4–5 Polish: Design Document
**Date:** 2026-03-06
**Prompts:** P-36, P-22, P-24, P-25, P-27
**Status:** Approved — ready for implementation plan

---

## Context

Phases 0–3 of the UX audit are complete (P-1 through P-20, plus P-21, P-23, P-26, P-28 done piecemeal). This document covers the 5 remaining prompts from Phase 4 (Polish) and Phase 5 (Accessibility).

---

## P-36: Click Feedback Under 100ms

**Problem:** `useElementFlash` hook exists and wires to canvas events, but the CSS class it applies (`aqb-element-flash`) is undefined — so the flash does nothing. Button `:active` states also lack scale feedback.

**Solution:**

1. `src/themes/default.css` — Add:
   - `@keyframes aqb-flash`: scale 1 → 1.04 → 1, 300ms ease-out
   - `.aqb-element-flash { animation: aqb-flash 0.3s ease-out; }` wrapped in `@media (prefers-reduced-motion: no-preference)`
   - `.aqb-btn:active { transform: scale(0.97); }` and `.aqb-icon-btn:active { transform: scale(0.95); }` — CSS-only, zero-delay

**Files:** `src/themes/default.css`

---

## P-22: First-Time Onboarding Tour

**Problem:** No spotlight-based tour exists. `OnboardingModal.tsx` is a centered dialog (not a tour), uses Emotion `css` prop incorrectly (TS errors). `useOnboarding` hook tracks a 9-step progress checklist — different purpose.

**Solution:**

Create `src/editor/onboarding/OnboardingTour.tsx` — a new component alongside `OnboardingModal`. Uses plain inline styles (no Emotion). Spotlight via large `box-shadow` on a transparent overlay div.

**Architecture:**
- localStorage key: `buildrik_onboarding_tour_v1` (separate from existing `buildrik_onboarding_complete`)
- Targets DOM elements by ID: `rail-tab-templates`, `rail-tab-build` (from LeftRail), `.pillPublish` button (Topbar)
- Uses `getBoundingClientRect()` + `ResizeObserver` for position tracking
- Tooltip positioned right of element with a left-pointing arrow; fallback to center if element missing
- 3 steps:
  1. `rail-tab-templates` → "Choose a template — Start with a professionally designed template or build from scratch"
  2. Canvas center (no specific anchor) → "Edit your page — Click any element to edit. Drag to rearrange."
  3. `.pillPublish` → "Publish when ready — Hit Publish to make your site live"
- Skip/Next/Done buttons; Escape key skips; focus moves to tooltip on step change
- `aria-describedby` linking tooltip to target element

**Wire-up:** `AquibraStudio.tsx` — add `<OnboardingTour>` alongside existing `<OnboardingModal>`. Show after `OnboardingModal` completes/skips via `onComplete` callback.

**Files:**
- `src/editor/onboarding/OnboardingTour.tsx` (create)
- `src/editor/onboarding/index.ts` (add export)
- `src/editor/shell/AquibraStudio.tsx` (wire up)

---

## P-24: Page Naming Guidance

**Problem:** Pages created with vague defaults:
- `usePages.ts` — unknown default name
- `PageTabBar.tsx:128` — `"Page ${pageCount}"`
- `AquibraStudio.tsx:408` — `"Untitled Page"`

**Solution:**

Extract `getDefaultPageName(existingPages: PageData[]): string` to `src/shared/utils/pageUtils.ts`:
- 0 existing pages → `"Home"`
- 1 existing page → `"About"`
- 2+ existing pages → `"Page ${count + 1}"`
- Duplicate → `"${page.name} (copy)"` (handled at call site)

Update 3 call sites to use this helper. Update `AquibraStudio.tsx:408` hardcoded `"Untitled Page"` → `"Home"`.

**Files:**
- `src/shared/utils/pageUtils.ts` (create helper)
- `src/editor/sidebar/tabs/pages/usePages.ts` (use helper)
- `src/editor/shell/PageTabBar.tsx` (use helper)
- `src/editor/shell/AquibraStudio.tsx` (fix hardcoded "Untitled Page")

---

## P-25: Rail Tooltip Improvements

**Problem:** Rail tooltips have a slow show delay and minimal content (name + kbd shortcut only). No subtitle descriptions.

**Solution:**

1. `src/editor/rail/LeftRail.css` — Find tooltip transition-delay and reduce to `200ms`
2. `src/editor/rail/tabsConfig.ts` — Add `subtitle?: string` field to each tab slot with descriptive text:
   - Templates: "Browse page templates"
   - Pages: "Manage site pages"
   - Build: "Add elements and components"
   - Media: "Images, videos, and files"
   - Design: "Colors, typography, and spacing"
   - Settings: "Site settings and SEO"
3. `src/editor/rail/LeftRail.tsx` — Render `<span className="left-rail__tooltip-sub">{slot.subtitle}</span>` below the name span
4. `src/editor/rail/LeftRail.css` — Add `.left-rail__tooltip-sub` style: 11px, `var(--aqb-text-muted)`, margin-top 2px

**Files:**
- `src/editor/rail/tabsConfig.ts`
- `src/editor/rail/LeftRail.tsx`
- `src/editor/rail/LeftRail.css`

---

## P-27: Placeholder-Only Input Labels (Verification)

**Problem:** Audit flagged possible inputs with placeholder as sole label (WCAG A-UND-4).

**Verification approach:** Grep `src/editor/sidebar/tabs/settings/` and SEO tabs for `<input` without associated `<label>` or `htmlFor`. The `Field` component in `settings/shared.tsx` already wraps inputs with labels — likely already fixed. If any bare `<input placeholder=` found without label, add `<label>` above (12px/500, `var(--aqb-text-muted)`, mb-4px).

**Files:** Verification only — `src/editor/sidebar/tabs/settings/` screens if any gaps found.

---

## Execution Order

```
1. P-36  — default.css only, no dependencies (5 min)
2. P-24  — create pageUtils.ts helper, update 3 call sites (15 min)
3. P-25  — tabsConfig.ts + LeftRail.tsx + LeftRail.css (15 min)
4. P-27  — verify + fix if needed (10 min)
5. P-22  — OnboardingTour.tsx new component (45 min)
```

---

## Constraints

- No Emotion CSS-in-JS in new files — use plain inline styles or CSS classes in existing CSS files
- No new npm packages
- Spotlight overlay must not block keyboard navigation (pointer-events: none on overlay, interactive on tooltip)
- `OnboardingTour` must degrade gracefully if target elements are not mounted (skip step or center fallback)
