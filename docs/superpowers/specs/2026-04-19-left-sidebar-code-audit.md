# Left Sidebar Code Audit — Findings Report

**Date:** 2026-04-19
**Scope:** `src/editor/sidebar/` + `src/components/Panels/LeftSidebar/`
**Status:** Pending Codex review — NO changes to be made until review is complete

---

## Summary

The left sidebar contains significant dead code, duplicate implementations, pass-through wrappers, and a fully orphaned legacy redirect layer. This report catalogs every finding with file paths and evidence so a reviewer can verify each before any deletions or merges.

---

## A. Dead Code — Files with Zero External Consumers

These files or exports are never imported by any file outside their own module. Safe to delete after Codex verification.

### A1. Entire dead files

| File | Exports | Evidence |
|------|---------|----------|
| `src/editor/sidebar/shared/EmptyStates.tsx` | `AddEmpty`, `LayersEmpty`, `PagesEmpty`, `MediaEmpty`, `ComponentsEmpty`, `TemplatesEmpty`, `HistoryEmpty` | Not imported anywhere. Not even re-exported from `shared/index.ts`. Current tabs use their own inline empty states. |
| `src/editor/sidebar/shared/SkeletonStates.tsx` | `AddSkeleton`, `LayersSkeleton`, `PagesSkeleton`, `MediaSkeleton`, `ComponentsSkeleton`, `TemplatesSkeleton`, `SettingsSkeleton`, `HistorySkeleton` | Not imported anywhere. Not re-exported from `shared/index.ts`. Superseded by `PanelSkeleton` in `SidebarFallbacks.tsx`. |
| `src/editor/sidebar/shared/ViewSwitcher.tsx` | `ViewSwitcher`, `ViewSwitcherProps`, `ViewOption` | Exported from barrel but never imported by any consumer. |
| `src/editor/sidebar/shared/FilterChips.tsx` | `FilterChips`, `FilterChipsProps`, `FilterChip` | Exported from barrel but never imported by any consumer. |

### A2. Dead exports within live files

| File | Dead Export | Notes |
|------|-------------|-------|
| `src/editor/sidebar/tabs/componentsData.ts` | `formatDate` | Never imported. Duplicate of `formatRelativeTime` and `relativeTime` (see Section B). |
| `src/editor/sidebar/tabs/history/icons.tsx` | `VersionsIcon`, `ActivityIcon`, `UndoIcon`, `RedoIcon`, `ClearIcon`, `SaveIcon` | 6 of 8 icons never imported. Only `TimeTravelIcon` has a consumer (`ActivityView.tsx`). `ChevronIcon` is used only by the dead `ViewSwitcher`. |
| `src/editor/sidebar/tabs/history/components/DiffRow.tsx` | `DiffRow` | Exported from barrel but never imported. Superseded by `CollapsedChange`/`collapseIdenticalChanges` approach. |
| `src/editor/sidebar/tabs/history/helpers.ts` | `CollapsedChange` (type), `collapseIdenticalChanges` (fn), `groupByDate` (fn) | `groupByDate` only used in a test. `CollapsedChange` and `collapseIdenticalChanges` have zero consumers. Only `formatRelativeTime` is externally used. |
| `src/editor/sidebar/shared/headerIcons.tsx` | `PinIcon`, `HelpIcon`, `CloseIcon` | Exported from barrel but never imported. |
| `src/editor/sidebar/shared/headerStyles.ts` | `actionsContainerStyles`, `titleStyles`, `headerContainerStyles` | Exported from barrel but never imported. Only `drillInHeaderContainerStyles` is used (internally by `DrillInHeader.tsx`). |
| `src/editor/sidebar/tabs/settings/shared.tsx` | `ToggleControlled` | Marked `@deprecated`. Never imported. Alias for `Toggle`. |
| `src/editor/sidebar/tabs/settings/shared.tsx` | `SettingsNavGuard` | Used internally by `SettingsTab.tsx` but re-exported through barrel with no external consumers. Barrel export is dead. |
| `src/editor/sidebar/tabs/settings/icons.tsx` | `HistoryIcon`, `BillingIcon`, `DesignSystemIcon`, `SeoIcon` | Exported through barrel but never imported outside `SettingsTab.tsx`. |

### A3. Dead barrel re-exports (types, constants, styles only used internally)

These exports exist in barrel `index.ts` files but are never imported by any file outside their own directory:

- **`src/editor/sidebar/tabs/elements/index.ts`**: `RECENT_STORAGE_KEY`, `FAVORITES_STORAGE_KEY`, `TIP_DISMISSED_KEY`, `EXPANDED_CATEGORY_KEY`, `MAX_RECENT`, `MOST_USED_IDS`, `NEW_CATEGORY_ORDER`, `CATEGORY_REMAP`, `BLOCK_DESCRIPTIONS`, `BLOCK_ICONS`, `ElementCardProps`, `highlightMatch`, `handleDragStart`, `UseElementsStateReturn`, `AnimatedAccordionContent`
- **`src/editor/sidebar/tabs/pages/index.ts`**: `PageRow`, `AddPageButton`, `PageContextMenu`, `usePageSettings`, `UsePageSettingsReturn`, `SaveState`, `UsePagesReturn`
- **`src/editor/sidebar/tabs/templates/index.ts`**: `getRecentTemplates`, `getTemplateById`
- **`src/editor/sidebar/tabs/settings/index.ts`**: `screenStyles`, `exportOptionsStyles`, `exportOptionStyles`, `activeExportOptionStyles`, `noteStyles`, `HistoryIcon`, `BillingIcon`, `DesignSystemIcon`, `SeoIcon`, `SettingsNavGuard`, `ToggleControlled`
- **`src/editor/sidebar/tabs/component-library/index.ts`**: `containerStyles`, `searchContainerStyles`
- **`src/editor/sidebar/shared/index.ts`**: `PinIcon`, `HelpIcon`, `CloseIcon`, `ViewSwitcher`, `FilterChips`, `actionsContainerStyles`, `titleStyles`, `headerContainerStyles` + all their associated types (`ViewSwitcherProps`, `ViewOption`, `FilterChipsProps`, `FilterChip`, etc.)

---

## B. Duplicate Functionality — Same Concept, Multiple Implementations

### B1. Time formatting — 3 implementations of the same concept

| File | Function | Signature | Used By |
|------|----------|-----------|---------|
| `src/editor/sidebar/tabs/history/helpers.ts` | `formatRelativeTime` | `(timestamp: number) => string` | `VersionHistoryPanel.tsx` (external) |
| `src/editor/sidebar/tabs/pages/utils/relativeTime.ts` | `relativeTime` | `(isoString: string) => string` | Internal to pages tab |
| `src/editor/sidebar/tabs/componentsData.ts` | `formatDate` | `(timestamp: number) => string` | **Never imported** |

**Recommendation:** Unify to single function in `shared/utils/`. The `formatRelativeTime` implementation is the most complete. `relativeTime` just needs to parse ISO first. `formatDate` is dead.

### B2. `ChevronIcon` — 3 definitions

| File | Implementation | Props |
|------|---------------|-------|
| `src/editor/sidebar/tabs/history/icons.tsx` | SVG-based | `{ expanded: boolean }` |
| `src/editor/sidebar/tabs/elements/ElementCard.tsx` | Inline SVG | Exported as `ChevronIcon` |
| `src/editor/sidebar/shared/headerIcons.tsx` | SVG-based | Generic chevron |

**Recommendation:** Keep one canonical `ChevronIcon` in `shared/headerIcons.tsx`, update consumers, delete duplicates.

### B3. `FilterChip` type — 2 definitions

| File | Structure |
|------|-----------|
| `src/editor/sidebar/shared/FilterChips.tsx` | `{ id: string; label: string; active: boolean }` |
| `src/editor/sidebar/tabs/componentsData.ts` | `{ id: string; label: string }` (no `active` field) |

**Recommendation:** Single `FilterChip` type in shared. The one with `active` field is more complete.

### B4. Error fallback — 2 implementations

| File | Component | Implementation |
|------|-----------|---------------|
| `src/editor/sidebar/SidebarFallbacks.tsx` | `SidebarErrorFallback` | Inline implementation |
| `src/editor/sidebar/shared/PanelErrorState.tsx` | `PanelErrorState` | Wraps `ErrorState` from `@/shared/ui/` |

**Recommendation:** Keep `PanelErrorState` (uses shared UI primitive). Delete `SidebarErrorFallback` and update `SidebarFallbacks.tsx` to use `PanelErrorState`.

### B5. Settings dirty-guard — 2 implementations

| File | Component | Approach |
|------|-----------|----------|
| `src/editor/sidebar/LeftSidebar.tsx` | Inline `tabGuard` state + `ConfirmDialog` | Active guard in shell |
| `src/editor/sidebar/tabs/settings/shared.tsx` | `SettingsNavGuard` with inline modal | Internal to settings tab |

**Recommendation:** `LeftSidebar.tsx`'s guard appears to be the active one. Verify `SettingsNavGuard` is redundant, then remove it.

---

## C. Pass-through Wrappers — Zero Added Logic

### C1. `src/editor/sidebar/tabs/DesignSystemTab.tsx`

Pure re-export bridge:
```ts
export { DesignSystemTab } from '@/features/design-system/ui/DesignSystemTab';
export default DesignSystemTab;
```
Zero added logic. Consumer (`TabRouter.tsx`) should import directly from `features/design-system/`.

### C2. `src/components/Panels/LeftSidebar/` — Entire directory (40+ files)

Every file is a `export * from '../../../../editor/sidebar/...` redirect. **Zero** files in the entire `src/` directory import from this legacy path. The directory is completely orphaned.

Key files in this directory:
- `index.tsx`, `SidebarFallbacks.tsx`, `useSidebarState.ts`, `TabRouter.tsx`, `useSidebarKeyboard.ts`
- `shared/` — `PanelHeader`, `ViewSwitcher`, `DrillInHeader`, `FeatureCard`, `SearchBar`, `FilterChips`, `StickyFooter`, `PanelErrorState`, `headerIcons`, `headerStyles`, `usePanelNavigation`, `index.ts`
- `tabs/` — `BuildTab`, `LayersTab`, `ComponentsTab`, `ElementsTab`, `PublishTab`
- `tabs/components/` — all redirect to `component-library/`
- `tabs/elements/`, `tabs/templates/` — all redirect

**Recommendation:** Delete the entire directory. Zero risk — no consumer exists.

### C3. Dead barrel re-exports

Multiple `index.ts` barrel files re-export types, constants, and styles that are only consumed internally. These re-exports add nothing — they make internal implementation details part of the public API for no reason. Remove the dead exports from barrels, keep only what's actually used externally.

---

## D. Legacy / Superseded Code

### D1. `src/components/Panels/LeftSidebar/` — Orphaned redirect layer

Documented as "TRANSITION REDIRECT" with comments like "Remove this file in Phase 5 (barrel cleanup)." The Phase 5 cleanup never happened. No imports exist from this path. **Safe to delete entirely.**

### D2. `ToggleControlled` — Deprecated alias

In `src/editor/sidebar/tabs/settings/shared.tsx`. Marked `@deprecated` with comment: "Use Toggle with checked + onChange props instead." Never imported. Should be removed.

### D3. Per-tab skeleton/empty states — Superseded

`EmptyStates.tsx` and `SkeletonStates.tsx` were an older approach. Current code uses `PanelSkeleton` (generic, from `SidebarFallbacks.tsx`) and tab-specific inline empty states. The old files are abandoned — not even in the barrel.

### D4. `DiffRow` — Superseded by collapsed-changes approach

The history tab moved to grouping changes with `collapseIdenticalChanges`, making `DiffRow` unused. The `CollapsedChange` type and `collapseIdenticalChanges` function themselves also appear unused externally.

---

## Risk Assessment

| Action | Risk | Mitigation |
|--------|------|-----------|
| Delete `components/Panels/LeftSidebar/` | **Zero** — no imports exist | Grep for import paths before deleting |
| Delete dead files (EmptyStates, SkeletonStates, ViewSwitcher, FilterChips) | **Very low** — not even in barrel | Remove barrel exports first, then files |
| Delete dead exports from barrels | **Low** — only affects barrel consumers | Grep for each export name before removing |
| Merge duplicate time formatters | **Low** — simple utility merge | Keep most complete impl, update imports |
| Merge ChevronIcon | **Low** — visual component | Verify rendering matches after merge |
| Remove DesignSystemTab bridge | **Low** — update one import in TabRouter | Update TabRouter import path |
| Unify error fallbacks | **Low** — same visual result | Test error boundary rendering |

---

## Inventory Counts

| Category | Files Affected | Exports to Remove |
|----------|---------------|-------------------|
| Dead code (entire files) | 4 files | ~23 exports |
| Dead exports in live files | 5 files | ~20 exports |
| Dead barrel re-exports | 6 index.ts files | ~50+ exports |
| Duplicate functionality | 5 patterns | 6 redundant implementations |
| Pass-through wrappers | 41+ files (40 in legacy dir) | 41+ re-export bridges |
| Legacy/superseded | 4 patterns | 4 items |

**Total estimated removable items: ~140+**

---

## E. Codex Verification Results (2026-04-19)

Independent verification by OpenAI Codex (v0.121.0, reasoning effort: high).

### Verification Summary

| # | Claim | Verdict | Notes |
|---|-------|---------|-------|
| 1 | EmptyStates.tsx dead | **CONFIRMED** | Zero imports across src/ |
| 2 | SkeletonStates.tsx dead | **CONFIRMED** | Zero imports across src/ |
| 3 | ViewSwitcher.tsx dead | **CONFIRMED** | Only re-exported by barrel + legacy redirect, no real consumer |
| 4 | FilterChips.tsx dead | **CONFIRMED** | Only re-exported by barrel + legacy redirect, no real consumer |
| 5 | formatDate dead | **CONFIRMED** | Zero imports. ComponentsTab only imports other exports from same module |
| 6 | DiffRow dead | **CONFIRMED** | Zero imports. Only re-exported by history/index.ts barrel |
| 7 | PinIcon/HelpIcon/CloseIcon dead | **CONFIRMED** | Zero imports. Live code uses separate local defs in shared/ui/PanelHeader.tsx |
| 8 | ToggleControlled dead | **CONFIRMED** | Zero imports. Screens import Toggle, Section, Field instead |
| 9 | Legacy dir orphaned | **CONFIRMED** | Zero imports referencing components/Panels/LeftSidebar across all src/ |
| 10 | 3 time-formatting duplicates | **CONFIRMED, but understated** | Codex found 2 MORE: inline in LibraryView.tsx:375 and ConflictModal.tsx:28. Total: 5 |
| 11 | 3 ChevronIcon definitions | **DENIED — actually 4** | Codex found a 4th in shared/ui/TreeView.tsx:188 |
| 12 | DesignSystemTab.tsx is wrapper | **CONFIRMED** | Pure re-export bridge. Live via lazy imports in FullPageRouter.tsx and SettingsTab.tsx |

### Corrections to Original Audit

1. **ChevronIcon count is 4, not 3.** Missing 4th definition: `src/shared/ui/TreeView.tsx:188`
2. **Time-formatting duplicates are 5, not 3.** Additional inline duplicates:
   - `src/editor/sidebar/tabs/media/components/LibraryView.tsx:375`
   - `src/editor/sync/ConflictModal.tsx:28`
3. **shared/index.ts barrel may be fully dead.** Codex found zero imports from `editor/sidebar/shared` or `editor/sidebar/shared/index`. Not just some exports dead — the entire barrel may be orphaned.
4. **history/index.ts barrel may be fully dead.** Same pattern — only re-exports, no external consumers of the barrel itself.

### Revised Counts

| Category | Original Count | Codex-Corrected Count |
|----------|---------------|----------------------|
| ChevronIcon duplicates | 3 | **4** |
| Time-formatting duplicates | 3 | **5** |
| Potentially dead barrels | 6 (partial exports) | 6 partial + 2 possibly fully dead barrels |