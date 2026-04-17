# Pages Tab Module Audit Report

**Module:** Pages Tab (sidebar)
**Date:** 2026-04-17
**Auditor:** Claude Code (Senior Product Engineer, QA Lead, UX Auditor, Code Reviewer)
**Status:** Complete

---

## A. Module Summary

**What this module does:**
The Pages Tab (`PagesTab`) is the primary UI for managing website pages within the Aquibra editor sidebar. It provides page CRUD operations (create, rename, duplicate, delete, set homepage), inline page settings (SEO, social, visibility, custom code), folder organization, search, and bulk selection capabilities.

**Main files involved:**
| File | Role |
|------|------|
| `editor/sidebar/tabs/pages/PagesTab.tsx` | Shell component, orchestrates sub-components |
| `editor/sidebar/tabs/pages/usePages.ts` | Single source of truth for all pages business logic |
| `editor/sidebar/tabs/pages/components/PageList.tsx` | List renderer (zero business logic) |
| `editor/sidebar/tabs/pages/components/PageRow.tsx` | Page item + inline settings accordion |
| `editor/sidebar/tabs/pages/components/AddPageButton.tsx` | Sticky add-page button with popover |
| `editor/sidebar/tabs/pages/components/PageContextMenu.tsx` | Portal context menu |
| `editor/sidebar/tabs/pages/page-settings/usePageSettings.ts` | Settings form state machine |
| `editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx` | Legacy full-panel drawer (B-03 fix: replaced by inline accordion) |
| `editor/sidebar/tabs/pages/page-settings/SeoTab.tsx` | SEO form fields |
| `editor/sidebar/tabs/pages/page-settings/SocialTab.tsx` | Social OG form fields |
| `editor/sidebar/tabs/pages/page-settings/AdvancedTab.tsx` | Visibility, password, robots, head code |
| `editor/sidebar/tabs/pages/useFolders.ts` | Folder CRUD via localStorage |
| `editor/sidebar/tabs/pages/PagesTab.css` | ~2737-line monolithic stylesheet |

**Current overall quality:** Fair-to-good architecture, actively being refactored (Phase 2 visuals in progress), but carries significant CSS debt and some architectural inconsistencies.

**Overall health score: 6.2 / 10**

---

## B. What Is Working Well

1. **Clear separation of concerns** — `usePages` owns all business logic; components are pure renderers. This is a strong pattern.
2. **Event filtering for performance** — The `PROJECT_CHANGED` → `page:*` filter in `usePages` (line 121-123) correctly prevents canvas drag-resize spam from triggering full page list re-sync.
3. **Comprehensive guards** — Delete guards (homepage, last-page), rename case-insensitivity, slug duplicate checking, external page homepage blocking.
4. **Good error recovery** — Toast-based feedback with retry actions, `retrySync` pattern, graceful clipboard API fallback.
5. **Accessibility baseline** — ARIA labels, keyboard navigation (F2 rename, Enter select, Escape cancel), roving focus in context menu, `aria-live` regions.
6. **Auto-save with dirty tracking** — The 500ms debounced auto-save in `InlineSettings` is a good UX pattern.
7. **Undo on delete** — Delete toast with `composer.history.undo` integration.
8. **Settings form is pure** — `SeoTab`, `SocialTab`, `AdvancedTab` are pure renderers with no internal state.
9. **`committedRef` pattern** — The blur-after-Enter fix in `PageRow` (line 189-207) correctly prevents double-commit.
10. **Test coverage for rename conflict logic** — Good unit tests for the core validation edge case.

---

## C. Major Issues

### Issue 1: CSS Token Regression — Light Theme Leakage in AddPageButton Popover

**Severity:** High
**Where:** `AddPageButton.tsx` (lines 46-64) and `PagesTab.css` (lines 1164-1193)

**Why it's a problem:**
The `.pg-add-popover` CSS uses `--ls-bg-card`, `--ls-border-card`, `--ls-text-primary`, `--ls-bg-subtle` — **light theme tokens**. The entire pages panel is dark (#14141f background), but the add-page popover will render with white/light styling, creating a jarring flash of light theme.

**User impact:** Every time a user clicks "Add Page", they see a wrongly-themed popover that breaks immersion.

**Technical impact:** These token names (`ls-*`) appear to be from a legacy light-theme design system. The Phase 2 dark chrome override at line 2355 sets `background: #14141f` on `.pages-panel`, but the popover uses `var(--ls-bg-card)` which is defined elsewhere and almost certainly resolves to white.

**Recommended fix:** Replace the `.pg-add-popover` CSS in `PagesTab.css` to use dark theme tokens:
```css
.pg-add-popover {
  background: var(--aqb-surface-3, #1a1a28);
  border: 1px solid var(--aqb-border);
  /* rest of styles unchanged */
}
.pg-add-option:hover {
  background: rgba(255,255,255,0.06); /* was var(--ls-bg-subtle) */
}
```

---

### Issue 2: Emoji Used in SEO Slug Warning — Violates DESIGN.md

**Severity:** Medium
**Where:** `SeoTab.tsx` (line 255)

**Why it's a problem:**
The slug destructive change warning contains `⚠️` emoji:
```tsx
⚠️ Changing this URL will break existing links...
```
DESIGN.md explicitly prohibits emoji as design elements. This was presumably missed during Phase 2 visual audit.

**User impact:** Visual inconsistency — the entire rest of the UI uses SVG icons or text-only indicators.

**Recommended fix:** Replace emoji with an SVG icon or inline warning text ("WARNING:" styled with the warning color class).

---

### Issue 3: `InlineSettings` Renders Independently of `PageSettingsDrawer` — Confusing Architecture

**Severity:** Medium
**Where:** `PageRow.tsx` (InlineSettings, lines 75-164) + `PageSettingsDrawer.tsx`

**Why it's a problem:**
There are **two separate settings rendering systems**:
1. `InlineSettings` — rendered inside each `PageRow` as an accordion when `isExpanded`
2. `PageSettingsDrawer` — a legacy full-panel drawer (still exists, still imported)

The B-03 fix comment says "page settings no longer replace the list with a full-panel drawer. Instead, each PageRow expands inline." However, `PageSettingsDrawer` and `UnsavedWarningModal` are still present in the codebase, creating:
- Dead code that must be maintained
- Confusion about which path is actually used in production
- Risk of the wrong path being used by future developers

**User impact:** None currently — the drawer code appears to be legacy/shadow code.

**Technical impact:** Code maintenance burden, larger bundle.

**Recommended fix:** If `InlineSettings` is the intended path, **delete `PageSettingsDrawer.tsx` and `UnsavedWarningModal.tsx`**. If `PageSettingsDrawer` is still needed for some edge case, add a comment explaining why both exist.

---

### Issue 4: `useFolders` Imported in `PagesTab.tsx` But Never Used

**Severity:** Low-Medium
**Where:** `PagesTab.tsx` (line 20: `import { useFolders } from "./useFolders";` — NOT used anywhere in the component)

**Why it's a problem:**
The import exists but `useFolders` is not called anywhere in `PagesTab`. This means:
- The folders feature is either: (a) not yet integrated, (b) was removed mid-refactor, or (c) will be wired differently
- Confusing for future developers
- Could indicate incomplete work

**Recommended fix:** Either integrate `useFolders` properly or remove the import until it's needed.

---

### Issue 5: `PageFolder.tsx` Exists But Is Not Imported Anywhere

**Severity:** Low
**Where:** `editor/sidebar/tabs/pages/components/PageFolder.tsx` — untracked file (shown in git status as untracked)

**Why it's a problem:**
The file is created but not imported or used by any component. This is likely a work-in-progress file for the folders feature that's not yet integrated.

**Recommended fix:** Either wire it into `PageList` as part of the folder feature, or remove it if the approach changed.

---

## D. Missing Functionality

1. **No page reordering / drag-and-drop** — Pages appear in a fixed order. Users cannot reorder pages via drag-and-drop in the sidebar. (Drag handles CSS exists at lines 329-353 but are never rendered — `pages-row__drag` class is unused.)
2. **No page search with keyboard shortcut** — While there's a search bar, there's no `⌘F` or `/` keyboard shortcut to focus it quickly.
3. **No "Duplicate with suffix" feedback** — When duplicating, the newly created page gets a name like "Copy of X" but there's no visual feedback confirming what name was chosen.
4. **No bulk delete** — Though `useBulkSelect.ts` and `BulkToolbar.tsx` exist (untracked), bulk delete is not wired up.
5. **No pagination** — For projects with 50+ pages, the list will grow indefinitely without virtualization or pagination.
6. **No "duplicate to another project"** — Cross-project page duplication is missing.
7. **No page thumbnail preview in list** — Pages only show a generic document icon, not a miniature preview of the page content.

---

## E. UX / UI Issues

### E1. Double-Settings Path Confusion

**Problem:** The context menu "Page Settings" calls `p.openSettings(pageId)` which sets `settingsPageId` in `usePages`. But `PageSettingsDrawer` is **not rendered** in `PagesTab.tsx` — only `InlineSettings` inside `PageRow` is used. Yet `PageSettingsDrawer` still exists with a full separate `UnsavedWarningModal`. This creates confusing code.

**Recommendation:** Audit and confirm `PageSettingsDrawer` is truly legacy/dead code, then delete it.

### E2. "From Template" CTA Is Easy to Miss

**Problem:** The "From Template →" link at `PageList` footer (line 167-169) is a text link styled with `--ls-accent` (light theme). On dark theme, this may be invisible or barely visible. The primary add-page flow is the `AddPageButton` popover which does show "From template" — so the footer link may be redundant.

**Recommendation:** Audit if the footer template link is needed alongside the `AddPageButton` popover. If not, remove it. If yes, style it with dark-compatible tokens.

### E3. Empty State "Create your first page" Uses Wrong Tokens

**Problem:** The empty state CTA button (`.pg-empty__cta` lines 1216-1230 in CSS) uses `--ls-accent-bg`, `--ls-accent-border` — light theme tokens. The Phase 2 dark override (lines 2662-2672) correctly overrides this to cobalt, but the shadow rule exists.

**Recommendation:** Remove the `.pg-empty__cta` light-token definition entirely and rely only on the Phase 2 override.

### E4. Inline Settings Has No Explicit "Saved" Feedback

**Problem:** The `InlineSettings` save row shows "Saved ✓" only when `saveState === "clean" && !s.isDirty`. This means the "Saved ✓" disappears as soon as you stop typing. A user making many changes won't see persistent confirmation that their last save succeeded.

**Recommendation:** Show "Saved" for ~2 seconds after a successful save, then transition to clean/idle state.

### E5. Search Input Has No Clear Button When Focused

**Problem:** When search has text, a small "✕" button appears (line 120-128 in PageList). But on focused input, users may not notice the ✕ in the corner. The Escape key clears search (line 116-117), but that's discoverability is low.

**Recommendation:** Consider a more prominent clear affordance or keeping the ✕ always visible when there's text.

---

## F. Code / Architecture Issues

### F1. 2737-Line Monolithic CSS File

**Problem:** `PagesTab.css` is enormous. It contains:
- Legacy `.pages-*` classes (old system, lines 1-1000)
- New `.pg-*` module classes (lines 1031-2136)
- Phase 2 dark override section (lines 2355-2736)

The file has **three layers of CSS with conflicting patterns**. The Phase 2 override (line 2355 comment) uses `.pages-panel` ancestor for specificity to override the earlier rules, but this is fragile — every new selector needs to be added to the Phase 2 block, and engineers must remember to use the `.pages-panel` prefix.

**Recommendation:** Consider splitting into:
- `pages-panel-legacy.css` (old `.pages-*` system — can be deleted once migration is complete)
- `pages-panel.module.css` (new `.pg-*` system)
- Keep Phase 2 overrides in `pages-panel.css` but document clearly

### F2. `commitRename` Is Duplicated Across `PagesTab` and `PageRow`

**Problem:** `PagesTab.handleRenameCommit` (lines 50-66) validates name conflicts and calls `p.commitRename`. `PageRow` handles Enter/blur and calls `onRenameCommit` which points to `handleRenameCommit`. But `PageRow` also has its own `committedRef` logic to prevent double-fire. This interaction is complex.

**The flow:** `PageRow` blur → `commitOnce` → `onRenameCommit(pageId, value)` → `PagesTab.handleRenameCommit` → `p.commitRename` OR sets error.

This is correct but the complexity means future changes could break the double-fire protection.

### F3. Cast to Access `router.getPath` and `project.domain`

**Problem:** At `usePages.ts` line 96-97:
```ts
route: (composer as { router?: { getPath?: (id: string) => string | undefined } }).router?.getPath?.(p.id),
```
And at line 300:
```ts
const domain = composer?.getProjectMetadata?.()?.domain ?? null;
```

These casts are accessing untyped engine internals. If the engine API changes, these silently return `undefined`/`null` with no warning.

**Recommendation:** Define proper typed interfaces for these engine accessors in `shared/types` or a local type definition, so TypeScript can validate them at compile time.

### F4. `discard()` in `usePageSettings` Duplicates `useEffect` Reset Logic

**Problem:** The `discard()` function (lines 296-331) manually resets 9 fields and rebuilds `savedSnapshot`. This is the same data that's initialized in the `useEffect` at lines 109-140. If a new field is added to settings, both places must be updated — they're not DRY.

**Recommendation:** Extract the reset logic into a single `getPersistedState(page)` helper and call it from both the `useEffect` and `discard()`.

### F5. No Error Boundary Around `InlineSettings`

**Problem:** If `usePageSettings` throws (e.g., `composer` becomes null mid-render), the entire `PageRow` collapses with no user-visible error. There's no error boundary wrapping the inline settings.

**Recommendation:** Wrap `InlineSettings` in an error boundary, or add a null check at the `InlineSettings` call site.

---

## G. Data / API / Backend Issues

### G1. `setHomepage` Called Before `setContextMenu(null)` — Ordering Inconsistency

**Problem:** In `usePages.ts`:
- `setHomepage` calls `setContextMenu(null)` at line 263
- `deletePage` calls `setContextMenu(null)` at line 225
- `duplicatePage` calls `setContextMenu(null)` at line 197
- But `selectPage` does NOT call `setContextMenu(null)`

This is inconsistent. If a context menu is open and the user clicks a page to switch to it, the context menu stays open.

**Recommendation:** `selectPage` should also close the context menu, OR the context menu should have a `useEffect` that closes when `activePageId` changes.

### G2. No Network Failure Retry for `createPage`

**Problem:** `addPage` (lines 143-164) catches errors and shows a toast, but if the create fails (e.g., storage quota), the user has no way to retry from the UI — they must manually trigger `addPage` again.

**Recommendation:** Show a persistent error state in the list area (similar to `loadError` state) with a "Retry" button when `addPage` fails.

### G3. Folder Data in localStorage — No Sync on Multi-Tab

**Problem:** `useFolders.ts` persists folders to `localStorage` keyed by `composerId`. If a user has multiple editor tabs open, changes in one tab won't reflect in the other — localStorage doesn't broadcast cross-tab changes.

**Recommendation:** Either accept this as a known limitation for now, or add a `storage` event listener to sync changes across tabs.

### G4. `isOnlyPage` Guard Uses `<=` — Could Allow 0 Pages

**Problem:** At line 374:
```ts
isOnlyPage: pages.length <= 1,
```
And at line 230:
```ts
if (pages.length <= 1) {
  addToast({ message: "Can't delete — your site needs at least 1 page", ... });
```
If `pages.length` somehow becomes 0 (before the first page is created, or after a race condition), this guard would still fire correctly. But the naming `isOnlyPage` with `pages.length <= 1` means it returns `true` when `pages.length === 0`. This is semantically wrong — 0 pages is not "the only page."

**Recommendation:** Separate `isOnlyPage` (pages.length === 1) from `hasNoPages` (pages.length === 0).

### G5. No Optimistic Update for Page Add — Race with Focus

**Problem:** `addPage` uses `requestAnimationFrame` to focus the rename input after creating the page:
```ts
if (newest) {
  requestAnimationFrame(() => setRenamingPageId(newest.id));
}
```
This assumes the row will be rendered and mounted within one animation frame. If there's any delay (React render batching, heavy page), the focus may fire before the row is ready, silently missing the focus.

**Recommendation:** Use a callback ref or a `useEffect` in `PageRow` that watches `isRenaming` and focuses when it becomes true, rather than relying on rAF timing.

---

## H. Risk Areas

### Risk 1: CSS Specificity Wars Will Cause Regressions
The Phase 2 override section (lines 2355+) overrides many selectors with `.pages-panel` ancestor. Any new CSS added to the legacy section that should affect Phase 2 components will silently fail unless the engineer remembers to add it to the override block. This is a recurring maintenance burden.

### Risk 2: Inline Settings vs Drawer — Split Brain for Future Features
If the drawer was intentionally kept for a reason (e.g., future responsive design where inline doesn't work on small screens), engineers adding features to `InlineSettings` might unknowingly duplicate them in `PageSettingsDrawer`, or vice versa.

### Risk 3: localStorage Quota Failures Silently Swallowed
`useFolders.ts` line 38:
```ts
} catch {
  // localStorage quota — silently ignore, in-memory state still works
}
```
Users who hit storage quota will lose folder data silently with no warning.

### Risk 4: `slugManuallySet` Flag Could Be Forgotten
The `slugManuallySet` flag (usePageSettings line 238) is set when a slug is saved from settings. The comment says this is important for downstream rename-autosuggest behavior. If the engine's rename logic changes, this flag could silently stop working, causing auto-slugs to overwrite manual slugs.

### Risk 5: `PROJECT_CHANGED` Event Assumptions
The `usePages` sync (line 121-123) filters on `payload.type.startsWith("page:")`. This relies on the engine emitting the correct event type. If the engine emits `PROJECT_CHANGED` without a `type`, or with a `type` that doesn't start with `page:`, the sync silently fails.

---

## I. Priority Action Plan

### Fix Immediately (P0)
1. **Fix `AddPageButton` popover light theme tokens** — Replace `--ls-bg-card`, `--ls-border-card`, `--ls-text-primary`, `--ls-bg-subtle` with dark theme tokens in `PagesTab.css` lines 1164-1193.
2. **Fix emoji in SEO warning** — Replace `⚠️` in `SeoTab.tsx` line 255 with SVG icon.
3. **Delete or integrate `PageSettingsDrawer`** — Confirm it's dead code (B-03 fix complete) and delete it. If not, wire it properly and remove `InlineSettings`.
4. **Remove unused `useFolders` import** from `PagesTab.tsx` or wire it in.

### Fix Next (P1)
5. **Audit `PageFolder.tsx`** — either wire into `PageList` or remove.
6. **Separate `isOnlyPage` from `hasNoPages`** logic in `usePages`.
7. **Add error boundary** around `InlineSettings`.
8. **Extract `getPersistedState`** helper to deduplicate reset logic in `usePageSettings`.
9. **Add `setContextMenu(null)` to `selectPage`** for consistency.

### Improve Later (P2)
10. **Split `PagesTab.css`** into legacy + module + override sections.
11. **Add proper typed interfaces** for the `composer as {...}` casts in `usePages`.
12. **Add retry UI for `addPage` failures** (persistent error state).
13. **Implement page reordering / drag-and-drop** using the existing-but-unused `pages-row__drag` CSS.
14. **Add `storage` event listener** to `useFolders` for cross-tab sync.
15. **Add `⌘F` / `/` keyboard shortcut** to focus search.

---

## J. Final Scoring

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Clarity** | 7.5 | Good separation hook/component, but dual settings paths confuse. |
| **UX** | 6.5 | Solid core flows, but missing keyboard shortcuts, bulk ops, no retry on add failure. |
| **UI Quality** | 5.5 | Phase 2 dark chrome is good, but light token leakage in popover, emoji in SEO tab, inconsistent token usage throughout. |
| **Functionality** | 7.0 | All core CRUD works, guards are solid, but missing drag-reorder, search keyboard shortcut, bulk delete not wired. |
| **Performance** | 7.5 | Event filtering is excellent, auto-save debounce is good. Risk of rAF focus race. |
| **Maintainability** | 5.0 | 2737-line CSS, dual settings systems, dead imports, cast to untyped engine APIs. |
| **Scalability** | 4.5 | No pagination/virtualization for large page lists, no cross-tab sync for folders. |
| **Reliability** | 6.5 | Good error handling, but silent localStorage failures, potential sync race conditions. |
| **Production readiness** | 6.0 | Functional but carries CSS debt, unintegrated code (PageFolder, BulkToolbar), and light theme leaks that would be embarrassing in a demo. |

**Overall: 6.2 / 10**

---

## Appendix: Untracked / Incomplete Files Found

The following files exist in the repo but are not imported by any component — likely work-in-progress:

| File | Likely Status |
|------|--------------|
| `editor/sidebar/tabs/pages/components/PageFolder.tsx` | Not wired into PageList yet |
| `editor/sidebar/tabs/pages/useBulkSelect.ts` | Bulk selection hook, not integrated |
| `editor/sidebar/tabs/pages/components/BulkToolbar.tsx` | Bulk actions toolbar, not integrated |
| `editor/sidebar/tabs/pages/components/PageCommandPalette.tsx` | Command palette, not integrated |
| `editor/sidebar/tabs/pages/page-settings/UnsavedWarningModal.tsx` | Still exists but only used by legacy PageSettingsDrawer |

---

*Report generated: 2026-04-17*
*Module: Pages Tab (sidebar)*
