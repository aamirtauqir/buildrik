# Templates Tab — Audit & Fix Design

**Date:** 2026-04-18
**Module:** `packages/editor/src/editor/sidebar/tabs/templates/`
**Health Score:** 4.5/10
**Status:** Pre-fix spec

---

## What This Module Does

Full-panel template browser inside the 280px left sidebar. Users browse, filter, preview, and apply pre-built HTML page templates — either replacing the current canvas or creating a new page.

---

## Audit Findings Summary

The module has good structural bones (clean hooks, state machine, accessibility, test coverage on the state machine) but has at least 4 critical functional bugs, 2 fully-built features that are completely disconnected, a visually broken layout, and dead code throughout. It is not shippable.

---

## Critical Bugs (Fix Immediately)

### BUG-1: subCategory filter always returns 0 results
- **File:** `hooks/useTemplateSelection.ts:69`
- **Root cause:** `t.category === subCategory` compares a `SiteCategory` ("landing", "portfolio") against a sub-category tag id ("hero", "features"). Namespaces never overlap.
- **Fix:** Change to `t.subCategory === subCategory`

### BUG-2: Apply flow broken for empty canvas
- **File:** `TemplatesTab.tsx:84`, `hooks/useTemplateApply.ts:119-125`
- **Root cause:** `requestApply(id)` enters "confirming" state but `confirmApply()` is never called from the component for the no-existing-content path. State machine stalls in "confirming" forever — the progress overlay never shows, template never applies.
- **Fix:** For the empty-canvas path, call `startApply()` directly instead of `requestApply(id)`, setting `pendingId.current` first.

### BUG-3: Pagination buttons are completely unstyled
- **File:** `components/TemplatePagination.tsx:36`, `TemplatesTab.css:364-396`
- **Root cause:** Component uses `tpl-pagination-btn`, `tpl-pagination-page`, `tpl-pagination-page--active`. CSS defines `tpl-page-btn`, `tpl-page-btn--active`. Mismatch — no styling applies.
- **Fix:** Update CSS class names to match the component.

### BUG-4: TemplateCard body div has wrong class name
- **File:** `components/TemplateCard.tsx:69`, `TemplatesTab.css:243`
- **Root cause:** Component renders `className="tpl-card-body"`. CSS defines `.tpl-card-info`. No padding or layout applies to the card text area.
- **Fix:** Change `tpl-card-body` to `tpl-card-info` in `TemplateCard.tsx`.

### BUG-5: ESC key does not dismiss detail panel
- **File:** `hooks/useTemplateSelection.ts:93-99`
- **Root cause:** ESC handler checks `if (selectedId)` but `selectedId` is never written from `TemplatesTab.tsx` (the component uses `detailId`). ESC does nothing when detail panel is open.
- **Fix:** Add `if (detailId) { setDetailId(null); return; }` before the `selectedId` check.

### BUG-6: `addAsNewPageRef` leaks on cancelled apply
- **File:** `TemplatesTab.tsx:75`, `handleProgressComplete`
- **Root cause:** `addAsNewPageRef.current = true` is set in `handleAddAsNewPage` but never reset on cancel. After a cancelled new-page apply, the ref remains `true`. Next "Apply to Current Page" call unexpectedly triggers `composer.elements.createPage()`.
- **Fix:** Reset `addAsNewPageRef.current = false` in cancel paths.

---

## High Priority Issues (Fix Next)

### H-1: TemplatePreviewModal is built but unreachable
- **Files:** `TemplatePreviewModal.tsx` (241 lines)
- **Problem:** Full feature — iframe, viewport toggle (D/T/M), section count. Never imported or rendered. `previewId` in `useTemplateSelection` is never written.
- **Fix:** Add a "Preview" button to `TemplateCard` hover or `TemplateDetail`. Render `TemplatePreviewModal` when `previewId` is set. Wire `setPreviewId` to the button.

### H-2: TemplateUseDrawer is built but ignored
- **Files:** `TemplateUseDrawer.tsx` (397 lines)
- **Problem:** More capable apply UX (mode/target/backup/new-site). Never imported. No CSS exists for its class names.
- **Recommendation:** Delete it. The current modal chain covers essential flows.

### H-3: 800ms fake loading on hardcoded data
- **File:** `TemplatesTab.tsx:47-50`
- **Fix:** Remove the `setTimeout` and `isLoading` state entirely. Templates are synchronous.

### H-4: ApplyProgressOverlay is fake
- **File:** `ApplyProgressOverlay.tsx`
- **Problem:** Steps advance every 300ms regardless of actual state. Real apply runs synchronously after animation ends. Step labels claim things that are not happening.
- **Fix (minimal):** Replace 5-step checklist with a simple spinner. Remove false step labels.

### H-5: ReplaceModal ignores 3 of its 5 props
- **File:** `TemplatesTabModals.tsx:24-28`
- **Problem:** `resetGlobalStyles`, `currentPageCount`, `onResetChange` are declared, passed from parent, and silently ignored. The reset-styles toggle is never shown.
- **Fix:** Render the toggle in `ReplaceModal`.

### H-6: "Go to page" button does nothing
- **File:** `TemplatesTab.tsx:388-391`
- **Problem:** `onGoToPage` and `onClose` call identical handlers. No navigation occurs.
- **Fix:** Wire `onGoToPage` to navigate to the newly created page via `onSwitchTab` or composer.

### H-7: Detail panel layout — 280px container, 420px panel
- **File:** `TemplatesTab.css:261`, `TemplatesTab.css:182-188`
- **Solution:** Full-Width Stack. When `detailId` is set, hide the grid and give detail 100% width.
- **CSS change:**
  ```css
  .tpl-content-inner--with-detail .tpl-grid-area { display: none; }
  .tpl-content-inner--with-detail .tpl-detail { width: 100%; max-width: 100%; }
  ```
  The "Back to grid" breadcrumb already exists at `TemplatesTab.tsx:154`. No new navigation needed.

---

## Improve Later (Technical Debt)

- **L-1:** Remove dead state: `selectedId`, `previewId` from `useTemplateSelection`
- **L-2:** Remove dead CSS: `.tpl-apply-overlay`, `.tpl-apply-card`, `.tpl-apply-bar`, `.tpl-apply-bar-fill`, `.tpl-apply-sub`
- **L-3:** Migrate `TemplatesTab.tsx` from legacy compat shims to the actual state machine API
- **L-4:** Remove `handleRetry` pass-through wrapper; call `retryApply()` directly
- **L-5:** Add "Recently Used" section in UI (data already written to localStorage)
- **L-6:** Add `pageCount` badge to `TemplateCard` thumbnail
- **L-7:** Verify `getTemplateById` is actually exported from `templatesData.ts` (exported in `index.ts` but not seen in data file)
- **L-8:** Remove `TopLevelGroup` type if unused

---

## Architecture Decisions

### Detail Panel: Full-Width Stack
When `detailId !== null`, hide the grid entirely. Detail takes the full 280px. Breadcrumb already implemented. No canvas disruption. ~10 lines of CSS.

### Apply Flow: Skip confirming for empty canvas
CONFIRMING is a gate for destructive replacement. For empty canvases, there is nothing to confirm — skip to APPLYING directly using `startApply()`.

### TemplateUseDrawer: Delete
Dead code with no CSS. The existing modal chain covers the essential flows.

---

## Files to Change

| File | Change |
|---|---|
| `hooks/useTemplateSelection.ts:69` | Fix subCategory filter |
| `hooks/useTemplateSelection.ts:93` | Add detailId to ESC handler |
| `TemplatesTab.tsx:47-50` | Remove fake loading |
| `TemplatesTab.tsx:84` | Fix empty-canvas apply path |
| `TemplatesTab.tsx:75+` | Fix addAsNewPageRef leak |
| `TemplatesTab.tsx:388-391` | Fix "Go to page" navigation |
| `components/TemplateCard.tsx:69` | Fix class name: tpl-card-body → tpl-card-info |
| `components/TemplatePagination.tsx` | Fix class names to match CSS |
| `TemplatesTab.css` | Full-width detail panel + fix pagination class names |
| `TemplatesTabModals.tsx:24` | Show resetGlobalStyles toggle |
| `TemplateUseDrawer.tsx` | Delete |
| `ApplyProgressOverlay.tsx` | Replace fake steps with honest spinner |
