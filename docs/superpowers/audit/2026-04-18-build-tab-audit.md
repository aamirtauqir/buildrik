# Build Tab — Full Module Audit
**Module:** Add / Build Tab (`editor/sidebar/tabs/build/`)
**Date:** 2026-04-18
**Auditor:** GStack plan-ceo-review + manual code review
**Files in scope:** 19 source files + 1 CSS file

---

## Executive Summary

The Build Tab is the primary element insertion surface for the editor. It loads a 53-element catalog and 54 section templates, supports drag-to-canvas, click-to-insert, search, favorites, and personalization. The module has one critical broken path, three design token violations, three reliability risks, and multiple minor polish issues.

**Critical broken path: click-to-insert is wired but never connected.**

---

## A. Purpose & Role

**What it does:**
The Build Tab is the "Add" panel in the left sidebar. It lets users browse a categorized element catalog (53 entries, 6 categories) and a sections library (54 templates, 9 families), then insert those blocks onto the canvas via drag or click.

**What's broken:**
`handleElClick` in `useBuildTab.ts:278-283` calls `onBlockClick?.()`, but `onBlockClick` is never passed to `BuildTab` from `TabRouter.tsx`. The entire click-to-insert path is a dead code path.

---

## B. Flow & Logic Audit

### B1. Click-to-Insert Path (BROKEN — CRITICAL)

```
TabRouter.tsx:82
  ↓ BuildTab receives composer + onBlockClick (undefined)
    ↓ useBuildTab.ts:278 — handleElClick(el) → onBlockClick?.({ id, label, category })
      ↓ onBlockClick === undefined → NO-OP
```

**Root cause:** `TabRouter.tsx` line 82 passes `onBlockClick` to `BuildTab` but `onBlockClick` is never received as a prop by `TabRouter` itself. It's a closing-over `undefined` from the outer scope.

**Fix:** Either wire `onBlockClick` through `commonTabProps` in `TabRouter`, or pass it explicitly as its own prop to `BuildTab`.

### B2. Drag-to-Canvas Path (WORKS)

```
ElCard drag → dataTransfer.setData("block", JSON) → canvas drop handler → composer.elements.addBlock()
```
Correctly wired. MIME type `"block"` handled by canvas.

### B3. Section Click Path (WORKS)

```
SectionsMode → useSectionInsert.handleSectionClick
  → composer.beginTransaction → insertHTMLToElement → endTransaction
```
Transaction-wrapped, toast feedback, null guard, 150ms spam guard.

### B4. Search Flow (WORKS)

```
SearchBar → setSearchQuery (debounced 150ms) → searchElements() → SearchResults
```
Pure function, no mutations, debounce at SearchBar component level.

---

## C. File & Architecture Review

### Architecture — Good

- `flatCatalog` and `flatCatalogByCatId` computed once at module load (O(1) lookups)
- `SECTION_CARDS_BY_FAMILY` pre-grouped at module load
- `SvgIcon` memoized to prevent re-render cascades
- CatAccordion conditional mount (closed = no DOM cost)
- SectionsMode lazy-loaded (~92KB chunk on first "Sections" tab click)
- Search is a pure function, no side effects

### Architecture — Concerns

- `useBuildTab.ts` is a 363-line god hook managing 18 state variables
- `ls` storage helper is manually implemented persistence with scattered localStorage/sessionStorage calls
- `blockIdMap` in QuickPicks is module-level but `flatCatalog` import means full 53-element array always in memory

---

## D. Functional Audit

### D1. Click-to-Insert (BROKEN — CRITICAL) — See B1

### D2. BlockId Validation — No Registry Check

`el.blockId` from the catalog is trusted without verifying the block registry has a matching entry. A renamed or removed block silently fails insertion with no error toast.

### D3. Section Spam Guard (OK)

150ms guard prevents double-click re-insertion.

### D4. Favorite Persistence — Silent Quota Failures

`ls.saveSet` silently catches quota exceptions. Users with full localStorage get zero feedback.

### D5. Search Debounce (OK)

Debounce applied at SearchBar component level. `searchResults` useMemo depends only on `searchQuery`.

### D6. Section Insert State Machine (OK)

`finally` always calls `endTransaction`. Early returns on lines 42/46/49 are before `beginTransaction` — correct.

---

## E. Frontend / UI / UX Audit

### E1. CSS Design Token Violations (HIGH)

`BuildTab.css` uses hardcoded `#1D4ED8` (indigo-700) instead of CSS variables at multiple locations:
- Line 167: `.bld-pin-row-check` color
- Lines 198, 260, 295: outline + hover stroke colors
- Line 311: `.bld-el-name:hover`
- Lines 434, 436, 439: section chip hover/focus
- Line 465: section card hover border
- Lines 525, 536, 538, 558: quick pick chip hover

Should be `var(--ls-accent)` which maps to cobalt `#2D6DFF`.

### E2. Hardcoded Font Family (MEDIUM)

`TipsFooter.tsx:54`: `fontFamily: "monospace"` — not a design token.

### E3. Ghost Chip Magic Number (LOW)

`QuickPicks.tsx:80, 87`: `7` hardcoded as max picks. Should be `MAX_QUICK_PICKS = 7` constant.

### E4. Tips Shortcut Inaccuracy (LOW)

`catalog/tips.ts:22`: tip says `⌘F` but actual shortcut is `/` (BuildTab.tsx:64).

### E5. FTUE Keyboard Dismiss (LOW)

`QuickPicks.tsx:100`: FTUE tooltip has `onClick` but no keyboard handler. Cannot be dismissed via keyboard.

### E6. OnboardingTip ARIA Role (LOW)

`OnboardingTip.tsx:19`: `role="note"` should be `role="status"` or `role="alert"`.

---

## F. Backend / API / Data Audit

### F1. MyComponents Duck-Typing (MEDIUM)

`MyComponents.tsx:19-23`: checks for `getComponents` by string key on `composer.elements`. Fragile — method rename silently breaks this.

### F2. Storage Quota Errors — Silent Failures

All `ls` helper methods silently catch exceptions. No user feedback on localStorage full.

### F3. No blockId Registry Validation — See D2

---

## G. Performance Audit

### G1. `blockIdMap` in QuickPicks (OK — module-level)

Computed once at module load. No per-render cost.

### G2. `filterSectionCards` Linear Scan (MINOR)

54 cards filtered on every keystroke. Fine at current scale. Would need indexing for 500+.

### G3. Search useMemo (OK)

`flatCatalog` is module-level reference. Debounce prevents excessive recomputation.

### G4. SectionsMode Lazy Load (GOOD)

~92KB loaded on first Sections tab click. Elements-only users never pay cost.

### G5. CatAccordion Conditional Mount (GOOD)

Closed accordions don't render their grid — conditional `{isOpen && ...}` instead of CSS-only hide.

---

## H. Security & Permissions Audit

### H1. SvgIcon HTML Injection (OK)

Catalog `iconHtml` strings rendered as SVG innerHTML. All values are string literals from source, never user input. Previous DOMParser implementation was a performance bug, not a security issue.

### H2. Section HTML Insertion (OK)

`sections.ts` HTML blobs are string literals. `insertHTMLToElement` is the correct insertion API.

### H3. Drag Data Transfer (OK)

`dataTransfer.setData("block", JSON.stringify(...))` — `blockId` from hardcoded catalog, no user-controlled content.

### H4. No User Input Paths

Build Tab reads zero user-controlled strings. No XSS, injection, or CSRF vectors.

---

## I. QA / Edge Cases

### Edge Case | Status

Zero picks shown | FTUE shows correctly
7 picks filled | "+" chip hidden correctly
Search no results | Sparkle icon + AI handoff card + Clear button
No active page | Toast error, no transaction started
No root element | Toast error, no transaction started
HTML insert failure | Error toast, transaction ended, isInserting reset
Multiple selection | insertionContext returns null (correct)
Accordion last-in-wins | Opens clicked, closes others (correct)
Search clears cats | Restores on clear (correct)
Fast double-click | 150ms spam guard works (correct)

---

## J. Product Quality Audit

### J1. Core JTBD

**"Add an element to my canvas."** Drag works. Click does not. This is the single most important flow and it is broken.

### J2. Information Architecture

Elements mode hierarchy matches spec §10.1. Sections mode shows section hint copy. Good.

### J3. Section Catalog Quality

54 templates across 9 families. Production-quality HTML. Inline style constants (`BG_WHITE`, `ACCENT`, etc.) easy to update when inspector theming lands.

### J4. Design System Compliance

- FAIL: `#1D4ED8` indigo in CSS instead of cobalt
- FAIL: `fontFamily: "monospace"` in TipsFooter
- OK: Most colors use `ls-*` CSS variables
- OK: No inline style objects in React components (sections are HTML blobs — exception is intentional)

### J5. Keyboard Navigation

Mode switch: Arrow keys + Home/End ✓. Search: Escape clears ✓. Cards: Enter/Space ✓. Accordion: Enter/Space ✓. TipsFooter expand: Enter/Space ✓. `/` shortcut: focuses search ✓.

### J6. Accessibility

ARIA roles, labels, `aria-expanded`, `aria-live`, `aria-disabled`, `aria-pressed`, `tabIndex` throughout. Ghost chips `aria-hidden` ✓. Issue: FTUE not keyboard dismissible (E5).

---

## Priority Action Plan

### Fix Immediately (breaks core UX)

**1. Wire `onBlockClick` in TabRouter** — `TabRouter.tsx:82`
Click-to-insert is dead code. The parent component calling `TabRouter` must supply the actual insertion handler.

**2. Replace `#1D4ED8` with CSS variable** — `BuildTab.css`
All indigo-700 references → `var(--ls-accent)`.

### Fix Next (reliability / correctness)

**3. `useSectionInsert` transaction lifecycle comment** — `useSectionInsert.ts`
Document that early returns at lines 42/46/49 are safe because they precede `beginTransaction`. Or restructure to make it obvious.

**4. BlockId registry validation** — `useBuildTab.ts:278`
`console.warn` in dev mode when `el.blockId` has no registry match.

**5. MyComponents formal interface** — `MyComponents.tsx:19`
Replace duck-typing with a typed `Composer` extension or `canUseComponents` boolean flag.

**6. `MAX_QUICK_PICKS` constant** — `QuickPicks.tsx`
Named constant instead of magic number `7`.

### Improve Later (Polish)

**7. Fix tips shortcut text** — `catalog/tips.ts:22` — `⌘F` → `/`

**8. Fix TipsFooter monospace** — `TipsFooter.tsx:54` — use CSS variable

**9. FTUE keyboard dismiss** — `QuickPicks.tsx:100`

**10. OnboardingTip aria role** — `OnboardingTip.tsx:19` — `role="status"`

**11. `onSuggestionClick` stub** — wire to placeholder or remove

---

## What Already Exists

- Drag-to-canvas: fully wired, works ✓
- Section insertion: fully wired, transaction-wrapped, toast feedback ✓
- Search: pure function, debounced, categorized results ✓
- Accordion conditional mount ✓
- Sections lazy loading (~92KB) ✓
- SvgIcon memoization ✓
- Favorites persistence with localStorage ✓
- Keyboard navigation throughout ✓
- ARIA accessibility throughout ✓

## Not in Scope

- `SearchBar` component (not in build/ directory)
- `PanelHeader` component (not reviewed)
- `useBlockInsertion` hook (does not exist — the click path needs to be built)
- Inspector-driven theming for section HTML (future work)
- AI suggestion backend (front-end stubs only)
