# Build Tab UX Audit — Design Document

**Date:** 2026-02-28
**Scope:** `catalog/catalog.ts` · `blockRegistry.ts` · `useBlockInsertion.ts` · `useBuildTab.ts` · `BuildTab.tsx` · `MyComponents.tsx` · `TipsFooter.tsx` · `FavZone.tsx` · `nesting/validator.ts`
**Strategy:** Phased — Phase 1 (data correctness) → Phase 2 (feedback quality) → Phase 3 (code health)

---

## Scope Corrections (Prompt vs. Reality)

The audit prompt contained several incorrect code assumptions. This document reports ground truth:

| Prompt Assumption                              | Actual Code                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| File `buildTabData.ts`                         | Actual file is `catalog/catalog.ts`                               |
| Smart placement in `StudioPanels.tsx`          | Extracted to `useBlockInsertion.ts` (StudioPanels is layout-only) |
| `getNestingErrorMessage()` exists in validator | Does NOT exist — only `getValidDropTargets()` is available        |
| `getSuggestedParents()` exists in validator    | Does NOT exist — must be created                                  |
| Tips are in "Urdu/Hinglish"                    | Tips are in English                                               |
| Categories: single-open accordion              | Code uses `Set` — multiple categories can open simultaneously     |
| 4 blockId mismatches (C2)                      | 6+ mismatches found in actual catalog                             |

---

## Mental Model Analysis

**MM-01 · First open:** Non-developer users expect a "things I can add to my page" library, similar to Squarespace block picker. Panel title "Build" is ambiguous — "Add Elements" (internal label) is more descriptive. Risk: 20% of new users may scan the wrong panel first.

**MM-02 · Drag vs click:** Smart placement is completely invisible before clicking. When element lands inside a Container the user did not intend to target, the user reads it as a bug. No recovery path is shown.

**MM-03 · Nesting failure:** Current toast "Failed to insert 'Heading'." reads as a system error. Users retry, fail again, and give up. They need to know: (a) why it failed, (b) where it CAN go.

**MM-04 · Category taxonomy:** "Page Sections" is correctly discovered for Hero/Navbar. "Structure & Grids" requires developer vocabulary to interpret. "Flexbox" and "Grid" are opaque to non-developers.

**MM-05 · My Components:** "Components feature coming soon." communicates nothing actionable. Users assume it is a future paid tier and move on.

**MM-06 · Favorites:** No indication that favorites are browser-local. Users expect star bookmarks to sync across devices (Chrome/iOS pattern). Losing favorites when switching browsers feels like a data loss bug.

**MM-07 · Search zero results:** Users reading "No elements matching 'carousel'" conclude the element does not exist. They will not try "slider." No alternative suggestions or catalog link provided.

**MM-08 · Technical naming:** "Flexbox," "Grid," "iFrame," "Custom Code" are developer vocabulary. Non-developers navigate by outcome (e.g., "side by side boxes") not by CSS primitive names. Hover descriptions help but are not visible before hovering.

**MM-09 · Undo:** Confirmed — click-to-insert IS wrapped in `beginTransaction("insert-block-sidebar")` and is undoable with Cmd+Z. Drag insertion undo is handled by the Canvas drop handler (out of scope).

---

## Critical Issues

### C1 — Silent nesting failure (no explanation, no recovery path)

**File:** `useBlockInsertion.ts:88`
**Confirmed:** Yes

```typescript
// CURRENT — no reason, no suggestion
addToast({ message: `Failed to insert "${block.label}".`, variant: "error" });
```

**Root cause:** `insertBlock()` returns `undefined` on failure but provides no reason. The nesting check runs at `blockRegistry.ts:215` and silently returns `undefined`. `getValidDropTargets(childType)` exists in `validator.ts` and returns valid parent types.

**Required fix (two parts):**

Part 1 — In `validator.ts`, add `getSuggestedParents`:

```typescript
export function getSuggestedParents(childType: ElementType, limit = 3): ElementType[] {
  return getValidDropTargets(childType)
    .filter((t) => ["container", "section", "flex", "grid", "form"].includes(t))
    .slice(0, limit);
}
```

Part 2 — In `useBlockInsertion.ts`, detect nesting failure and show context:

```typescript
const parentEl = composer.elements.getElement(parentId);
const parentType = parentEl?.getType?.() ?? "unknown";
const suggestions = getSuggestedParents(def.elementType);
const suggestionText =
  suggestions.length > 0
    ? `Try selecting a ${suggestions.slice(0, 2).join(" or ")} first.`
    : "Select a container element and try again.";
addToast({
  message: `Can't add ${block.label} — ${parentType} doesn't allow it. ${suggestionText}`,
  variant: "warning",
  duration: 5000,
});
```

**Exact toast text example:**

> "Can't add Heading — Button doesn't allow it. Try selecting a Container or Section first."

**Duration change:** 2000ms → 5000ms for error/warning toasts that require user action.

---

### C2 — blockId mismatches in catalog.ts (6 issues)

**File:** `catalog/catalog.ts`
**Confirmed:** Yes — and broader than the prompt identified.

| Element     | Current `blockId` | Correct fix                                                   | Notes                               |
| ----------- | ----------------- | ------------------------------------------------------------- | ----------------------------------- |
| Custom Code | `"text"`          | Create `"custom-code"` block, or disable with "Coming Soon"   | No matching block in registry       |
| Analytics   | `"text"`          | Same as Custom Code                                           | No matching block in registry       |
| iFrame      | `"video-embed"`   | Keep `"video-embed"` as proxy for MVP                         | Acceptable short-term               |
| Wishlist    | `"social-icons"`  | Change to `"product-card"` or remove                          | No wishlist block exists            |
| Badge       | `"text"`          | Add `"badge"` block config OR keep `"text"` with code comment | Registry gap                        |
| Label       | `"text"`          | Change to `"label"` (labelBlockConfig exists in Forms)        | Wrong blockId, correct block exists |

**Phase 1 fixes (data-only, no new blocks):**

- `Wishlist` → remove from E-Commerce catalog (no correct block exists)
- `Label` (in Text & Buttons) → change `blockId` from `"text"` to `"label"`
- `Custom Code` and `Analytics` → add `disabled: true` field to FlatElEntry type and render as grayed-out "Coming Soon" card
- `Badge` → document as known gap with inline code comment, keep `"text"` temporarily

**Phase 3 fix (requires new block configs):**

- Create `custom-code` block config in `/blocks/Advanced/`
- Create `badge` block config in `/blocks/Basic/`

---

### C3 — My Components state (better than assumed, small gap)

**File:** `MyComponents.tsx`
**Confirmed:** Partially — component already has 3-state logic, but State 3 (list render) is not implemented.

**Current state:**

- State 1 (no `getComponents` API): "Components feature coming soon." — correct
- State 2 (API + 0 items): "No saved components yet. Select an element → right-click → Save as Component." — correct
- State 3 (API + items): No list renderer — data never loaded

**Tip 4 conflict:** `tips.ts` Tip 4 says "right-click → Save as Component" but when user is in State 1 ("coming soon"), this tip creates false expectations.

**Fix Tip 4 text in `tips.ts`:**

```typescript
// BEFORE
{ bold: "My Components", body: " — Select an element → right-click → Save as Component to reuse it." }

// AFTER
{ bold: "My Components", body: " — Once available, save any element as a reusable component from the right-click menu." }
```

**MyComponents open state:** When `!hasApi`, the section should default to collapsed. Caller in `BuildTab.tsx:73` sets initial `myCompOpen` to `false` via `useBuildTab` — already correct, no change needed.

---

## Medium Issues

**M1 — No insertion context indicator**
Before clicking a card, no panel-level indicator shows where the element will land.
Fix: Render a context pill in `BuildTab.tsx` between the search bar and the catalog when 1 or more elements are selected:

- 1 selected: `📍 Adding inside: Container`
- 2+ selected: `📍 Adding at page root`
  Source: `composer.selection.getSelectedIds()` + `getElement().getType()` — accessible from `useBuildTab` via composer prop.

**M2 — TipsFooter not dismissible**
`tipDismissed` state exists in `useBuildTab.ts` and the `BUILD_TIP_DISMISSED` storage key is wired, but `TipsFooter.tsx` receives no `dismissed` prop and has no dismiss button.
Fix: Pass `dismissed` and `onDismiss` props to `TipsFooter`. When dismissed, render `null` from `TipsFooter` and collapse the `bld-tips` wrapper via CSS height transition.

**M3 — Dead `recentIds` state**
`useBuildTab.ts:121-123` tracks `recentIds` with localStorage persistence, but no component renders a "Recent" section.
Fix (Phase 3): Delete `recentIds` state and both associated `useEffect` and `handleElClick` update unless a "Recent" section is confirmed planned.

**M4 — "Clear All Favorites" no undo**
`FavZone.tsx:58-68` — "clear" immediately calls `onClearAll()` with no guard or undo.
Fix: Capture `favs` snapshot before clearing. Show undo toast for 5000ms. Matches the element delete pattern already in `StudioPanels.tsx`.

**M5 — Favorites localStorage not communicated**
No indication that favorites are device/browser-local only.
Fix: On first `toggleFav` call, show a one-time toast: "Favorites are saved in this browser only." Store seen state in a new `BUILD_FAVS_INFORMED` localStorage key.

**M6 — Search clears to no open category**
Clearing search shows all categories collapsed. User loses their place.
Fix: In `useBuildTab.ts`, capture `openCats` before search begins and restore when `searchQuery` clears to `""`.

**M7 — Zero-results search has no path forward**
"No elements matching 'carousel'" leaves users stuck.
Fix: Add below the no-results message: `Try: "slider", "gallery", or browse all categories`.

**M8 — Tech vocabulary in element names**
"Flexbox" is developer vocabulary.
Fix: In `catalog.ts`, rename element display name from "Flexbox" → "Flex Layout". The `blockId` stays `"flex"`.

---

## Edge Cases

| #     | Current behavior                                                                                              | Fix                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| EC-01 | Drop onto void element → silent `insertBlock` failure                                                         | Same as C1 — nesting error toast with suggested parents          |
| EC-02 | No active page → toast "No active page. Please select a page first."                                          | Already handled in `useBlockInsertion.ts:41`                     |
| EC-03 | Click Custom Code → inserts plain text (wrong blockId)                                                        | Fix via C2                                                       |
| EC-04 | Insert Hero inside a small flex container → nesting rules may allow (section is valid child of flex)          | Acceptable behavior — validator decides                          |
| EC-05 | Drag into container exceeding MAX_NESTING_DEPTH → Canvas drop handler checks depth                            | Out of scope (canvas handler)                                    |
| EC-06 | Form Input outside Form container → validator allows (no strict form-only rule currently)                     | Acceptable for MVP                                               |
| EC-07 | Search input rendered as text node in SearchResults                                                           | Verify SearchResults renders query as text content, not raw HTML |
| EC-08 | localStorage cleared → `ls.getSet()` returns empty Set via try/catch                                          | Already handled                                                  |
| EC-09 | Rapid double-click → `isInsertingBlock` guard prevents second insertion                                       | Already handled (150ms timeout)                                  |
| EC-10 | Long element names at 260px width → verify CSS truncation with `text-overflow: ellipsis` in ElCard            | Low risk, verify in CSS                                          |
| EC-11 | Keyboard-only user → FavZone and MyComponents headers have role="button" + tabIndex=0 + onKeyDown             | Partially handled; verify Enter triggers search focus            |
| EC-12 | Screen reader toast announcement → verify Toast component uses `role="status"` or `aria-live="polite"`        | Verify in Toast component                                        |
| EC-13 | Drag outside canvas → browser fires `dragend` without `drop` → canvas drag handler cancels cleanly            | Out of scope (canvas)                                            |
| EC-14 | Multi-select + click → inserts at root with no warning                                                        | Fix via M1 insertion context indicator                           |
| EC-15 | E-Commerce elements on non-commerce site → no gating exists                                                   | Product decision — out of scope for this audit                   |
| EC-16 | `getBlockDefinitions().find(b => b.id === block.id)` returns undefined → toast "Block not found in registry." | Already handled at `useBlockInsertion.ts:51-54`                  |

---

## Code Quality Summary

| Anti-pattern                                  | Count | Priority | Phase   |
| --------------------------------------------- | ----- | -------- | ------- |
| SSOT violation (blockId mismatch)             | 6     | P0       | Phase 1 |
| Missing error propagation from `insertBlock`  | 1     | P0       | Phase 2 |
| Dead code (`recentIds`)                       | 1     | P2       | Phase 3 |
| Hidden side effect (auto-select after insert) | 1     | P3       | Phase 3 |
| Pass-through wrapper (`handleDragStart`)      | 1     | P3       | Phase 3 |

**Refactor priority order:**

1. Fix blockId SSOT violations — unblocks correct element insertion
2. Add `getSuggestedParents()` to `validator.ts` — unblocks C1 fix
3. Propagate nesting failure reason from `insertBlock` — enables meaningful error toasts
4. Delete dead `recentIds` state — reduces localStorage churn

**Dependency map:**

```
C2 fix (catalog.ts) → independent, Phase 1
    ↓
getSuggestedParents() in validator.ts → Phase 2 prerequisite
    ↓
insertBlock() error propagation → Phase 2 prerequisite
    ↓
useBlockInsertion.ts toast update → C1 fix complete
```

---

## Interaction Model Design

### Insertion context indicator (M1)

Render between search bar and catalog in `BuildTab.tsx`:

```
📍 Adding inside: Container   [×]
```

The `×` clears selection. Falls back to "📍 Adding at page root" when 0 or 2+ elements selected.

### Nesting error toast (C1)

```
variant: "warning"
duration: 5000ms
message: "Can't add {label} — {parentType} doesn't allow it. Try selecting a {s1} or {s2} first."
```

### My Components coming-soon header

```
▶ My Components  [Coming Soon]
```

Collapsed by default. "Coming Soon" badge on the header row. No body content in State 1.

### Favorites localStorage warning

One-time toast on first star action:

```
variant: "info"
duration: 3000ms
message: "Favorites are saved in this browser only."
```

Tooltip on FavZone header: `title="Not synced across devices or browsers"`

### Clear All undo-toast pattern

```
1. Capture snapshot: const snapshot = new Set(favs)
2. Call clearFavs()
3. Show: "Favorites cleared" toast, action { label: "Undo", onClick: () => setFavs(snapshot) }
4. Duration: 5000ms
```

### Pro Tips footer dismissal

```typescript
// TipsFooterProps additions
dismissed?: boolean;
onDismiss?: () => void;
```

When dismissed: return `null`. BuildTab's `.bld-tips` div gets `height: 0; overflow: hidden; transition: height 200ms ease` via CSS.

---

## Implementation Phases Summary

### Phase 1 — Data Correctness (catalog.ts only, ~0.5 day)

- Fix 6 blockId mis-mappings
- Add `disabled` field to `FlatElEntry` type for Custom Code and Analytics
- No logic changes

### Phase 2 — Feedback Quality (~2 days)

- Add `getSuggestedParents()` to `validator.ts`
- Update `insertBlock()` to propagate failure reason
- Update `useBlockInsertion.ts` toast for nesting failure (C1)
- Add insertion context indicator to `BuildTab.tsx` (M1)
- Fix `TipsFooter.tsx` — add dismiss button (M2)
- Fix Tip 4 text in `tips.ts` (C3)
- Add clear-all undo toast to `FavZone.tsx` (M4)
- Fix search restoration on clear (M6)

### Phase 3 — Code Health (~1 day)

- Delete dead `recentIds` state from `useBuildTab.ts`
- Add favorites localStorage warning (first-time toast) (M5)
- Add zero-results search suggestions (M7)
- Add `custom-code` and `badge` block configs
- Add TypeScript compile-time validation that catalog blockIds match registry
