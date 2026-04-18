# Templates Tab — Audit Issues Document

Generated: 2026-04-18
Module: `packages/editor/src/editor/sidebar/tabs/templates/`
Audit scope: 17 files, full codebase trace, design system review

---

## Summary

The Templates Tab provides a full-page template browser with browse → preview → apply functionality. Core flow works but has accumulated fragmentation from parallel implementation attempts, a broken sub-category filter, CSS theme conflicts, and significant dead code.

**Health: 5.5 / 10**

---

## Priority: Fix Immediately

### 1. `subCategory` Filter Is Completely Broken
**Severity: High | File: `hooks/useTemplateSelection.ts:69`**

```ts
const ms = !subCategory || t.category === subCategory;
```

`SUB_CATEGORY_TAGS` defines tags (hero, features, pricing, testimonials, cta, footer, contact). But `TemplateItem` has no `subCategory` field — only `category` (landing, portfolio, saas, blog, ecommerce) and `type` (hero). The sub-category filter falls back to `category === subCategory`, which always fails since "hero" never equals "landing". Clicking any tag shows zero results.

**Impact:** Users who click any sub-category tag see an empty state. The entire tag UI is non-functional.

**Fix options:**
- A) Add `subCategory: string` field to `TemplateItem` and populate for each template (correct data approach)
- B) Remove tag UI entirely (quick removal approach)
- C) Map `SUB_CATEGORY_TAGS` to `category` values as a coarse filter (partial fix, 30 min)

**Recommended: A** — Populate subCategory on TemplateItem. Tags are a good UX if they work.

---

### 2. `TemplateUseDrawer` Is Dead Code
**Severity: High | File: `TemplateUseDrawer.tsx` (entire file)**

`TemplateUseDrawer.tsx` defines a complete `TemplateApplyConfig` flow with mode selection (create-page vs insert-page), target selection (new-page/replace-current/new-site), backup toggle, and new-site confirmation. This is richer than what `TemplatesTab.tsx` actually uses.

`TemplatesTab.tsx` never imports `TemplateUseDrawer`. The entire drawer system was built and abandoned.

**Impact:** Dead code confuses future developers. If the drawer was meant to replace the modal-based apply flow, the migration was never completed. Conflicting apply systems exist in parallel.

**Fix options:**
- A) Wire `TemplateUseDrawer` into `TemplatesTab` — replace modal-based flow with drawer (1-2 days)
- B) Delete `TemplateUseDrawer.tsx` and its CSS (30 min)

**Recommended: A** — The drawer design is better UX than modals. Complete the migration.

---

### 3. CSS Theme Warfare — Light Tab, Dark Overlays, Wrong Token Names
**Severity: High | Files: `TemplatesTab.css`, `TemplatePreviewModal.css`, `ApplyProgressOverlay.css`**

Three separate theme problems:

**A) Visual jarring:** `TemplatesTab.css` uses a light theme (white backgrounds, blue accent). `TemplatePreviewModal.css` and `ApplyProgressOverlay.css` use a dark theme (`#0c0c14`, `#060610`). Opening a template preview throws the user from a light sidebar into a dark overlay. The editor chrome is dark-only per DESIGN.md — this is an intentional inconstency.

**B) Wrong token names in TemplatesTab.css:**
```
--ls-bg-card        ← should be --aqb-bg-card
--ls-accent        ← should be --accent (cobalt #2D6DFF)
--ls-text-primary  ← should be --aqb-text-primary
--ls-border-light  ← should be --aqb-border
```

**C) Wrong accent colors in dark overlays:**
```
TemplatePreviewModal:     #6366F1 (indigo) — violates cobalt-only rule
ApplyProgressOverlay:      #7c6dfa (violet) — violates cobalt-only rule
```

**Impact:** Visual inconsistency, broken design system tokens, cobalt-only rule violated in overlays.

**Fix options:**
- A) Make overlays light-themed to match tab (CSS rewrite, ~1 day)
- B) Make tab dark-themed to match overlays (larger CSS + component change)
- C) Pick one theme and audit all CSS tokens (1 day)

**Recommended: A** — Tab already uses light theme tokens. Make overlays light too. Remove indigo/violet from these files entirely.

---

## Priority: Fix Next

### 4. `detailId` vs `selectedId` — Duplicate Selection State
**Severity: Medium | File: `hooks/useTemplateSelection.ts`**

`useTemplateSelection` exposes both `detailId` (setDetailId) and `selectedId` (setSelectedId). In `TemplatesTab.tsx:304`, `isSelected={sel.detailId === tpl.id}` uses `detailId`. But keyboard ArrowRight/ArrowLeft sets `selectedId`. These can get out of sync.

**Fix:** Remove `selectedId`. Use only `detailId` for the expanded panel state.

---

### 5. `TemplateDetail` Has Dead Props
**Severity: Medium | File: `components/TemplateDetail.tsx:24-25`**

```ts
previewState?: "loading" | "error" | "ready";
onPreviewRetry?: () => void;
```

`TemplatesTab.tsx:311-316` always calls `TemplateDetail` without passing these props — defaults to `"ready"` always. The loading/error preview states are dead code.

**Fix:** Remove unused props, or wire them if async preview loading is planned.

---

### 6. `hasExistingContent` Race Condition at Apply Time
**Severity: Medium | File: `TemplatesTab.tsx:77-84`**

```ts
hasExistingContent: canvasElementCount > 0,
// ...
hasExistingContent ? sel.setShowReplace(true) : startApply();
```

`canvasElementCount` is a stale snapshot from composer events. At the moment `handleApplyToCurrent` runs, the check may be wrong if elements were just deleted or the active page changed.

**Fix:** Re-query `composer.elements.getActivePage().root.getChildCount()` synchronously inside `handleApplyToCurrent` before the decision.

---

### 7. Hardcoded Purple/Violet in Template HTML
**Severity: Medium | File: `templatesData.ts`**

The `SITE_TEMPLATES` HTML strings use `#7c6dfa` (violet) as the primary accent. DESIGN.md says: "Single accent color: cobalt `#2D6DFF`" and "indigo/violet tokens in `themes/default.css` are being migrated out."

**Impact:** User previews a purple-accented template, applies it, gets cobalt-accented output. Broken promise at the moment of truth.

**Fix:** Replace `#7c6dfa` with `#2D6DFF` (cobalt) in all template HTML strings. Or label templates as "Legacy (violet)" until migrated.

---

### 8. Artificial 800ms Skeleton Delay
**Severity: Medium | File: `TemplatesTab.tsx:48`**

```ts
const t = setTimeout(() => setIsLoading(false), 800);
```

Templates are synchronous in-memory data. This fake delay creates a false sense of slowness on fast connections and fake reliability on slow ones.

**Fix:** Remove the artificial delay. Dismiss skeleton immediately on content ready.

---

### 9. Toast + Banner Redundancy on Apply Failure
**Severity: Low | File: `TemplatesTab.tsx:120-124, 333-351`**

On apply failure, user sees both a toast notification AND an inline error banner. Redundant.

**Fix:** Choose one. Error banner is sufficient for this context; toast is redundant.

---

## Priority: Improve Later

### 10. `TemplatesTab.tsx` Is 400+ Lines
**Severity: Medium | File: `TemplatesTab.tsx`**

Single file manages: loading state, filter state, apply flow, modal visibility, breadcrumb logic, 5+ handler functions, and JSX render. Per CLAUDE.md architecture rules (no mixed-responsibility files), this should be split.

**Fix:** Extract apply flow coordination into `useTemplateApplyFlow` hook. Extract filter state into `useTemplateFilters`. Keep tab as a thin shell.

---

### 11. Double-Apply Guard Gap
**Severity: Medium | File: `TemplatesTab.tsx`**

`requestApply` has a re-entry guard during `"applying"` state. But a double-click during `"confirming"` state (before confirm dialog appears) can still fire twice because `startApply` bypasses the confirming state entirely.

**Fix:** Use the proper `requestApply → confirmApply` state machine. Don't call `startApply` directly.

---

### 12. No Undo After Template Apply
**Severity: Medium | File: `TemplatesTab.tsx`**

If a user applies the wrong template, they must manually revert. `composer.history.undo()` should be called to create a history checkpoint before applying.

**Fix:** Call `composer.history.undo()` checkpoint before `importHTMLToActivePage`.

---

### 13. Missing Tests
**Severity: Medium | Files: `useTemplateSelection.ts`, `useTemplatePersistence.ts`, `TemplatesTab.tsx`**

- `useTemplateSelection` — no tests (filter logic, pagination, keyboard nav untested)
- `useTemplatePersistence` — no tests
- `TemplatesTab` — no integration test
- `TemplateDetail` — no tests
- `TemplateUseDrawer` — no tests (and likely needs deletion anyway)

**Fix:** Add tests for `useTemplateSelection` (filter/pagination), `useTemplatePersistence` (localStorage mock), and a `TemplatesTab` integration test.

---

### 14. No Live HTML Preview in Detail Panel
**Severity: Medium | File: `components/TemplateDetail.tsx`**

`TemplateDetail` shows a gradient + emoji as the preview, not actual HTML. The real HTML preview only appears in the full `TemplatePreviewModal` overlay (desktop/tablet/mobile viewport toggle). Users can't see template content without opening the modal.

**Fix options:**
- A) Render mini-HTML preview in `TemplateDetail` using an iframe at small scale (complex)
- B) Add a "Quick Preview" button that opens the modal (simpler, existing flow)
- C) Show description + feature list instead of fake gradient preview (content approach)

---

### 15. No Template Search by Description
**Severity: Low | File: `hooks/useTemplateSelection.ts:64`**

Search only matches `t.name` (line 64). Templates have `description` fields that aren't searched.

**Fix:** Add `t.description?.toLowerCase().includes(q)` to the search filter.

---

## Not Issues (Confirmed Working)

- ✅ `useTemplateApply` state machine — well-designed, fully tested
- ✅ Skeleton loading UI — good perceived performance pattern
- ✅ `TemplatePagination` — clean component with aria-current
- ✅ `TemplateCard` keyboard support — click + Enter, aria-selected
- ✅ Recent templates tracking — localStorage with 3-item cap
- ✅ CSS co-location — each component has co-located CSS
- ✅ `ApplyProgressOverlay` 15s timeout — good safety net
- ✅ Composer event listener cleanup — proper unsubscribe on unmount

---

## Files to Audit / Delete

| File | Action | Reason |
|------|--------|--------|
| `TemplateUseDrawer.tsx` | Decide: wire or delete | Dead code |
| `TemplateUseDrawer.css` | Same as above | Dead code |
| `hooks/useTemplateApply.ts` lines 173-181 | Refactor | `startApply` bypasses confirm state |
| `TemplatesTab.css` `--ls-*` tokens | Replace with `--aqb-*` | Wrong token names |
| `TemplatePreviewModal.css` `#6366F1` | Replace with `--accent` | Cobalt rule violation |
| `ApplyProgressOverlay.css` `#7c6dfa` | Replace with `--accent` | Cobalt rule violation |
| `templatesData.ts` HTML strings | Replace `#7c6dfa` with `#2D6DFF` | Cobalt rule violation |
| `TemplateDetail.tsx` unused props | Remove | Dead props |
| `TemplatesTab.tsx` 800ms delay | Remove | Fake timing |

---

## Deleted / Not Applicable

- `TemplatePreviewModal` — actually used (opened from card hover/click, needs review but not dead)
- `ApplyProgressOverlay` — actually used (portal in apply flow)
- `templatesStorage.ts` — actually used (recent templates, session persistence)

---

## Effort Estimates

| Fix | Effort | Risk |
|-----|--------|------|
| Fix subCategory filter | 2-3h (add field + populate) | Low |
| Wire or delete TemplateUseDrawer | 1-2 days | Medium |
| CSS token audit + fix | 1 day | Low |
| Remove duplicate selection state | 1-2h | Low |
| Remove TemplateDetail dead props | 30min | None |
| Fix hasExistingContent race | 1h | Low |
| Replace purple HTML with cobalt | 2h | Low |
| Remove 800ms fake delay | 15min | None |
| Fix toast+banner redundancy | 15min | None |
| Split TemplatesTab.tsx | 1 day | Medium |
| Add missing tests | 1 day | Low |
| Add undo checkpoint | 1h | Low |
| Live preview in detail panel | 1-2 days | High |

---

*End of audit issues document*
