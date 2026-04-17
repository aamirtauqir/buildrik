# Component Tab — Broken Flows Fix Design

**Date:** 2026-04-17
**Author:** Claude
**Status:** Approved for implementation

---

## Overview

The Components Tab (`editor/sidebar/tabs/ComponentsTab.tsx`) has 7 broken or incomplete flows across 3 severity levels. This spec covers fixes for all 7, prioritized by severity.

**Severity breakdown:**
- **Critical (3):** Blocks core workflows — swap, insert, duplicate
- **Medium (3):** UX friction — dead link, state leak, hidden instance count
- **Low (1):** Polish — blank thumbnail placeholder

---

## Critical Fixes

### Fix #1: Swap Component Flow — Dead End

**Problem:** `handleSwapComponent()` in `useComponentsState.ts:417-424` shows a toast "Select another component from the list" then navigates away. No mechanism exists to complete the swap. The `confirmVariant` function is for swapping *variants*, not *components*.

**Root cause:** The swap flow was scaffolded but never completed. The "Swap component" button exists in `ComponentDetailScreen` but there's no second step after the toast.

**Fix approach:** Same-category picker modal. When user clicks "Swap component":
1. Instead of showing a toast, open a `Modal` listing all components in the same category as the current one
2. User clicks a component to select it as the replacement
3. On selection, call `composer.components.swapInstanceWithComponent(elementId, newComponentId)` (new engine method)
4. Navigate back to browse view with success toast

**New engine method needed:** `swapInstanceWithComponent(elementId: string, newComponentId: string)` in `ComponentManager.ts` — replaces the master tree of an instance with a different component's master tree while preserving overrides.

**Files changed:**
- `engine/components/ComponentManager.ts` — add `swapInstanceWithComponent()`
- `editor/sidebar/tabs/component-library/useComponentsState.ts` — replace `handleSwapComponent` toast with picker logic
- `ComponentsTab.tsx` — add swap picker modal (inline Modal with component list)

**Swap Picker Modal UX:**
- Shows same category components as cards/rows
- Each row shows: component name, instance count badge, thumbnail (if available)
- Search bar to filter within category
- "Cancel" button to close without swapping
- Selected instance name shown at top: "Swap [ComponentName] instance with..."

---

### Fix #2: Insert Silent Fail — No Canvas Context

**Problem:** `handleInsert()` in `ComponentDetailScreen.tsx:92-111` silently returns when `parentId` is null (no selection and no active page root). No user feedback.

**Fix:** Add a toast when insertion fails due to missing context.

```typescript
// In handleInsert, after checking parentId:
if (!parentId) {
  addToast({
    message: "Select a layer or open a page first to insert a component.",
    variant: "warning",
    duration: 4000,
  });
  return;
}
```

**Files changed:**
- `ComponentDetailScreen.tsx` — add toast on silent fail path

---

### Fix #3: Duplicate Flow — Modal Instead of Action

**Problem:** `handleDuplicate()` in `useComponentsState.ts:278-291` shows an info modal with manual steps. But `ComponentManager.duplicateComponent()` exists and performs a proper deep clone. The engine method is never called.

**Fix:** Replace the info modal with one-click duplicate using the engine method.

```typescript
const handleDuplicate = React.useCallback(
  (componentId: string) => {
    if (!composer) return;
    composer.components.duplicateComponent(componentId);
    addToast({ message: "Component duplicated", variant: "success", duration: 3000 });
    setOpenMenuId(null);
  },
  [composer, addToast]
);
```

Also remove the `DuplicateInfoState` and `duplicateInfo` modal from `useComponentsState` since it's no longer needed.

**Files changed:**
- `useComponentsState.ts` — simplify `handleDuplicate`, remove `duplicateInfo` state/modal
- `ComponentsTab.tsx` — remove `DuplicateInfoModal` JSX block

---

## Medium Fixes

### Fix #4: "Learn more" Link Does Nothing

**Problem:** `ComponentsTab.tsx:229` — `<a href="#" onClick={(e) => e.preventDefault()}>` prevents default but has no handler.

**Fix:** Wire it to open the docs URL. The `handleHelpClickFn` already exists and handles this:

```typescript
// Already defined in useComponentsState.ts:
const handleHelpClickFn = React.useCallback(() => {
  onHelpClick?.() ?? window.open("https://docs.aquibra.com/components", "_blank");
}, [onHelpClick]);

// Just wire it up:
<a href="https://docs.aquibra.com/components" target="_blank" rel="noopener noreferrer"
   className="aqb-comp-learn-more-btn">
  Learn more
</a>
```

**Files changed:**
- `ComponentsTab.tsx` — replace dead link with proper anchor tag

---

### Fix #5: Variant Picker State Leak (Informational — No Code Change)

**Problem:** In `ComponentsTab.tsx:407-443`, when user selects a variant in the picker but closes the modal, `setVariantPicker(null)` via `onClose` cleanly resets state. Closing without confirming is a valid cancel action.

**Fix:** No structural change needed. This was a false alarm — the current behavior is correct. Closing without confirming intentionally discards the selection.

---

### Fix #6: Instance Count Hidden from Detail View

**Problem:** `instanceCount` is computed in `ComponentDetailScreen.tsx:140` but only shown in the delete confirmation dialog. Users can't see how many instances exist before deciding to delete.

**Fix:** Show instance count in the info section of detail view, below the type/tags/description.

```tsx
{instanceCount > 0 && (
  <div className="aqb-component-detail-info-row">
    <span className="aqb-component-detail-info-label">Instances:</span>
    <span className="aqb-component-detail-info-value">{instanceCount} on canvas</span>
  </div>
)}
```

**Files changed:**
- `ComponentDetailScreen.tsx` — add instance count to info section

---

## Low Fixes

### Fix #7: No Thumbnail → Blank Placeholder

**Problem:** When `component.thumbnail` is missing, `ComponentDetailScreen.tsx:172-176` shows "No Preview" in an empty box. Not informative.

**Fix:** Improve the placeholder to show:
1. The component icon (generic "component" symbol)
2. Text: "No preview available"
3. If `masterTree` exists, consider rendering a minimal DOM preview (stretch goal — may be complex)

For now, improve the visual placeholder:

```tsx
<div className="aqb-component-detail-preview-placeholder">
  <ComponentIcon size={48} />
  <span className="preview-placeholder-text">No preview available</span>
  <span className="preview-placeholder-hint">Insert the component to see it on canvas</span>
</div>
```

**Files changed:**
- `ComponentDetailScreen.tsx` — improve placeholder design
- CSS for `.aqb-component-detail-preview-placeholder`

---

## Files Summary

| File | Changes |
|------|---------|
| `engine/components/ComponentManager.ts` | Add `swapInstanceWithComponent()` |
| `editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx` | Fix #2 (insert toast), Fix #6 (instance count), Fix #7 (thumbnail placeholder) |
| `editor/sidebar/tabs/component-library/useComponentsState.ts` | Fix #1 (swap picker), Fix #3 (duplicate), remove `DuplicateInfoState` |
| `editor/sidebar/tabs/ComponentsTab.tsx` | Fix #1 (swap modal), Fix #3 (remove duplicate modal), Fix #4 (learn more link) |

---

## Testing Checklist

- [ ] Insert component with no selection → shows toast, no silent fail
- [ ] Insert component with selection → inserts successfully
- [ ] Duplicate component → creates copy, shows toast
- [ ] Swap component → opens same-category picker → completes swap
- [ ] Swap component with no same-category alternatives → shows appropriate message
- [ ] Learn more link → opens docs in new tab
- [ ] Detail view shows instance count for components with instances
- [ ] Thumbnail-less component shows improved placeholder
- [ ] Variant picker closes cleanly on cancel (no state leak symptoms)

---

## Out of Scope

- Changing the filter/accordion/group structure
- Adding new component creation flows
- Build tab "My Components" section (separate tab, different code path)
- Component thumbnails auto-generation (would need separate spec)
- Undo/redo for component operations (marked TODO in code, needs backend)
