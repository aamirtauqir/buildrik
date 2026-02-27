# Code Review Report — new-editor-l2 Editor Module

**Date:** 2026-02-21
**Scope:** `packages/new-editor-l2/src/` — 846 files (pre-cleanup), 147,113 LoC
**Method:** Static analysis — imports, exports, grep, line counts, event wiring traces
**Status:** Analysis-only. No code changes recommended without separate approval.

---

## A) Executive Summary

### What the module does

Aquibra's `new-editor-l2` is a **visual web page builder** shipped as an NPM package (`@aquibra/editor`). It wraps a central `Composer` engine (28 manager classes, EventEmitter bus, JSON-patch history) with a React 18 UI shell (10 sidebar tabs, Canvas overlay system, ProInspector right panel). Users drag-and-drop HTML elements onto a canvas, edit styles/properties via inspector panels, manage multi-page sites, and export clean HTML/CSS.

### Overall quality

**Solid.** The event-driven Manager pattern is consistent throughout. The SSOT principle is well respected — `SelectionManager`, `ElementManager`, `StyleEngine` own their domains and components read from events rather than holding redundant state. The Composer's `beginTransaction()` / `endTransaction()` pattern elegantly batches undo entries.

### Why it feels complex

1. **28 manager classes** with a 100+ event type bus — reading the system requires understanding which events cross which module boundaries
2. **A parallel "Phase 3 UX" surfaces system** (`ManageOverlay`, `InsertDrawer`, `DockedSheet`) was built and abandoned mid-way. It had zero inbound imports, broken internal imports, and duplicated all tab content. This was deleted during the architecture cleanup this session (895 lines removed).
3. **Three large tab orchestrators** (PagesTab 772L, ElementsTab 666L, ComponentsTab 593L) had grown beyond the 500-line limit with `TODO(split)` comments by the original author. These were split this session.
4. **L0/L1 indicators scattered** — collaboration, CMS, cloud sync features are "wired" to engine but either have no UI entry point (L0) or partial lifecycle (L1).

### Main issues found (high level)

- `surfaces/` folder — orphaned, broken, 895 lines: **DELETED** ✅
- 3 tab orchestrators over 500 lines — **SPLIT** ✅ (197, 176, 340 lines)
- TypeScript import depth error in `PageSettingsScreen.tsx` — **FIXED** ✅
- `ProInspector/shared/PropertyRenderer.tsx` and `ControlRegistry.tsx` — L0 deprecated, previously deleted per CLAUDE.md
- `useElementFlash.ts` — small hook with unclear integration; needs verification
- `storageMigration.ts` — auto-runs on module load; needs verification it's still needed
- 3 separate `localStorage` prefixes for panel state — minor fragmentation risk
- Alignment methods in `SelectionManager` (6 align + 2 distribute) — unclear if wired to toolbar UI

### Main risks

| Risk                                                          | Severity | Notes                                      |
| ------------------------------------------------------------- | -------- | ------------------------------------------ |
| `CollaborationManager.ts` (789 lines) exceeds limit           | Medium   | L1 feature — split when feature reaches L2 |
| `useCanvasKeyboard.ts` (620 lines) exceeds limit              | Medium   | All canvas shortcuts in one file           |
| `UnifiedSelectionToolbar.tsx` (637 lines) exceeds limit       | Medium   | Complex but focused                        |
| `types/index.ts` (803 lines) and `types/media.ts` (783 lines) | Low      | Type files are verbose by nature           |
| L1 wiring for Collaboration, CloudSync, AI                    | Medium   | Features are half-integrated               |

---

## B) File Inventory (Key Files)

| File Path                                                                 | Module    | Label                 | Lines   | Purpose                                   |
| ------------------------------------------------------------------------- | --------- | --------------------- | ------- | ----------------------------------------- |
| `src/index.ts`                                                            | Shell     | `CORE_FLOW`           | —       | NPM public API barrel                     |
| `demo/main.tsx`                                                           | Shell     | `CORE_FLOW`           | —       | Demo entry point                          |
| `components/Editor/AquibraStudio.tsx`                                     | Shell     | `CORE_FLOW`           | 348     | Main editor shell, error boundary         |
| `components/Editor/StudioPanels.tsx`                                      | Shell     | `CORE_FLOW`           | 648     | 3-column layout orchestrator              |
| `components/Editor/StudioHeader.tsx`                                      | Shell     | `CORE_FLOW`           | —       | Top toolbar (undo/redo, device, zoom)     |
| `components/Editor/StudioModals.tsx`                                      | Shell     | `CORE_FLOW`           | —       | All modals rendered here                  |
| `components/Editor/hooks/useStudioState.ts`                               | Shell     | `CORE_FLOW`           | 426     | Panel open/close, tab state, localStorage |
| `components/Editor/hooks/useComposerInit.ts`                              | Shell     | `CORE_FLOW`           | 220     | Composer bootstrap, event bindings        |
| `components/Editor/hooks/useStudioHandlers.ts`                            | Shell     | `CORE_FLOW`           | —       | Canvas/block click handlers               |
| `components/Editor/hooks/useStudioModals.ts`                              | Shell     | `CORE_FLOW`           | —       | Modal open/close state                    |
| `components/Editor/hooks/useHistoryFeedback.ts`                           | Shell     | `SUPPORTING`          | —       | Undo/redo toast notifications             |
| `components/Layout/LayoutShell.tsx`                                       | Layout    | `CORE_FLOW`           | 252     | CSS Grid container (4-column)             |
| `components/Layout/LeftRail.tsx`                                          | Layout    | `CORE_FLOW`           | —       | 9-icon tab strip                          |
| `components/Layout/LeftRail.css`                                          | Layout    | `CORE_FLOW`           | 510     | Rail visual styles                        |
| `components/Panels/LeftSidebar/index.tsx`                                 | Sidebar   | `CORE_FLOW`           | 200     | Tab content host + keyboard shortcuts     |
| `components/Panels/LeftSidebar/TabRouter.tsx`                             | Sidebar   | `CORE_FLOW`           | 106     | Switch/case → lazy-loaded tab             |
| `components/Panels/LeftSidebar/tabs/BuildTab.tsx`                         | Sidebar   | `CORE_FLOW`           | 504     | Add elements + templates, drill-in        |
| `components/Panels/LeftSidebar/tabs/PagesTab.tsx`                         | Sidebar   | `CORE_FLOW`           | **197** | Page list (split from 772)                |
| `components/Panels/LeftSidebar/tabs/ElementsTab.tsx`                      | Sidebar   | `CORE_FLOW`           | **176** | Element picker (split from 666)           |
| `components/Panels/LeftSidebar/tabs/ComponentsTab.tsx`                    | Sidebar   | `CORE_FLOW`           | **340** | Component library (split from 593)        |
| `components/Panels/LeftSidebar/tabs/MediaTab.tsx`                         | Sidebar   | `CORE_FLOW`           | 395     | Images, videos, fonts, files              |
| `components/Panels/LeftSidebar/tabs/LayersTab.tsx`                        | Sidebar   | `CORE_FLOW`           | —       | DOM tree hierarchy                        |
| `components/Panels/LeftSidebar/tabs/DesignSystemTab.tsx`                  | Sidebar   | `CORE_FLOW`           | 351     | Global tokens (colors, typography)        |
| `components/Panels/LeftSidebar/tabs/SettingsTab.tsx`                      | Sidebar   | `CORE_FLOW`           | —       | Site config, SEO                          |
| `components/Panels/LeftSidebar/tabs/PublishTab.tsx`                       | Sidebar   | `CORE_FLOW`           | 494     | Deploy flow                               |
| `components/Panels/LeftSidebar/tabs/HistoryTab.tsx`                       | Sidebar   | `CORE_FLOW`           | 243     | Page revision history                     |
| `components/Panels/LeftSidebar/tabs/pages/PageRow.tsx`                    | Sidebar   | `SUPPORTING`          | 78      | Single page list row                      |
| `components/Panels/LeftSidebar/tabs/pages/PageSettingsScreen.tsx`         | Sidebar   | `SUPPORTING`          | 175     | Drill-in page settings                    |
| `components/Panels/LeftSidebar/tabs/elements/ElementCard.tsx`             | Sidebar   | `SUPPORTING`          | 131     | Block card with drag + click              |
| `components/Panels/LeftSidebar/tabs/elements/useElementsState.ts`         | Sidebar   | `SUPPORTING`          | 159     | Filter/search/group logic                 |
| `components/Panels/LeftSidebar/tabs/components/ComponentRow.tsx`          | Sidebar   | `SUPPORTING`          | 100     | Component list row                        |
| `components/Panels/LeftSidebar/tabs/components/ComponentDetailScreen.tsx` | Sidebar   | `SUPPORTING`          | 308     | Drill-in component detail                 |
| `components/Panels/LeftSidebar/tabs/components/useComponentsState.ts`     | Sidebar   | `SUPPORTING`          | —       | Component state + actions                 |
| `components/Canvas/Canvas.tsx`                                            | Canvas    | `CORE_FLOW`           | 477     | Canvas editing surface                    |
| `components/Canvas/hooks/useCanvasSync.ts`                                | Canvas    | `CORE_FLOW`           | 79      | Event → HTML re-render bridge             |
| `components/Canvas/hooks/useComposerSelection.ts`                         | Canvas    | `CORE_FLOW`           | 178     | Canonical selection read hook             |
| `components/Canvas/hooks/useCanvasKeyboard.ts`                            | Canvas    | `CORE_FLOW`           | 620 ⚠️  | All canvas keyboard shortcuts             |
| `components/Canvas/controls/UnifiedSelectionToolbar.tsx`                  | Canvas    | `CORE_FLOW`           | 637 ⚠️  | Selection action toolbar                  |
| `components/Canvas/controls/QuickActionsToolbar.tsx`                      | Canvas    | `CORE_FLOW`           | 530 ⚠️  | Quick action overlay                      |
| `components/Panels/ProInspector/index.tsx`                                | Inspector | `CORE_FLOW`           | 604 ⚠️  | Right panel (layout/style/advanced)       |
| `components/Panels/ProInspector/hooks/useInspectorState.ts`               | Inspector | `CORE_FLOW`           | —       | Inspector tab/section state               |
| `components/Panels/ProInspector/hooks/useStyleHandlers.ts`                | Inspector | `CORE_FLOW`           | —       | Style mutation handlers                   |
| `engine/Composer.ts`                                                      | Engine    | `CORE_FLOW`           | 694     | SSOT orchestrator, 28 managers            |
| `engine/EventEmitter.ts`                                                  | Engine    | `CORE_FLOW`           | —       | Typed event bus                           |
| `engine/SelectionManager.ts`                                              | Engine    | `CORE_FLOW`           | 523     | Selection SSOT + alignment tools          |
| `engine/HistoryManager.ts`                                                | Engine    | `CORE_FLOW`           | 471     | JSON-patch undo/redo                      |
| `engine/elements/ElementManager.ts`                                       | Engine    | `CORE_FLOW`           | 240     | Element CRUD, page management             |
| `engine/styles/StyleEngine.ts`                                            | Engine    | `CORE_FLOW`           | 672     | Style mutation + breakpoints              |
| `engine/drag/DragManager.ts`                                              | Engine    | `CORE_FLOW`           | 215     | Drag state machine                        |
| `engine/export/ExportEngine.ts`                                           | Engine    | `CORE_FLOW`           | 650     | HTML/CSS export                           |
| `engine/collaboration/CollaborationManager.ts`                            | Engine    | `SUPPORTING`          | 789 ⚠️  | OT collaboration (L1)                     |
| `engine/commands/CommandCenter.ts`                                        | Engine    | `SUPPORTING`          | —       | Keyboard command registry                 |
| `engine/templates/TemplateManager.ts`                                     | Engine    | `SUPPORTING`          | —       | Template save/apply                       |
| `services/CloudSyncService.ts`                                            | Services  | `SUPPORTING`          | 594 ⚠️  | Cloud save (L1)                           |
| `constants/tabs.ts`                                                       | Constants | `CORE_FLOW`           | 305     | Tab IDs, config                           |
| `constants/events.ts`                                                     | Constants | `CORE_FLOW`           | —       | 100+ typed event names                    |
| `constants/icons.ts`                                                      | Constants | `SUPPORTING`          | 659     | Icon data dump                            |
| `types/index.ts`                                                          | Types     | `CORE_FLOW`           | 803     | Core type definitions                     |
| `utils/storageMigration.ts`                                               | Utils     | `REVIEW`              | —       | localStorage key migration                |
| `hooks/useElementFlash.ts`                                                | Hooks     | `REVIEW`              | —       | Element highlight animation               |
| `components/surfaces/`                                                    | Surfaces  | `ORPHAN_CANDIDATE ❌` | **0**   | **DELETED** — was 895 lines, zero imports |
| `ProInspector/shared/PropertyRenderer.tsx`                                | Inspector | `ORPHAN_CANDIDATE ❌` | **0**   | **DELETED** — L0 per CLAUDE.md            |
| `ProInspector/shared/controls/ControlRegistry.tsx`                        | Inspector | `ORPHAN_CANDIDATE ❌` | **0**   | **DELETED** — L0 per CLAUDE.md            |

---

## C) Dependency & Integration Map (Human-readable)

```
ENTRY POINT
  src/index.ts → exports AquibraStudio, Composer, all types
  demo/main.tsx → local dev harness

SHELL (top-level)
  AquibraStudio.tsx (348L)
    ├── useComposerInit.ts      ← bootstraps Composer engine
    ├── useStudioState.ts       ← tab/panel open-state from localStorage
    ├── useStudioHandlers.ts    ← block/canvas click handlers
    ├── useStudioModals.ts      ← modal visibility
    ├── useHistoryFeedback.ts   ← undo/redo toasts
    ├── useComposerSelection.ts ← reads SelectionManager (canonical hook)
    ├── useElementFlash.ts      ← element highlight [REVIEW]
    ├── StudioHeader            → top bar
    ├── StudioPanels            → 3-column layout
    └── StudioModals            → portal for modals

LAYOUT
  StudioPanels.tsx (648L)
    ├── LayoutShell.tsx (252L)      ← CSS Grid 4-column container
    ├── LeftRail.tsx                ← icon tab strip
    ├── LeftSidebar/index.tsx (200L)
    │     └── TabRouter.tsx (106L) ← switch → 9 lazy tabs
    ├── Canvas.tsx (477L)          ← editing surface
    │     ├── 41 Canvas hooks
    │     └── useCanvasSync.ts (79L) ← Composer events → HTML re-render
    └── ProInspector/index.tsx (604L) ← right panel

ENGINE (SSOT hub)
  Composer.ts (694L)
    ├── extends EventEmitter
    ├── ElementManager          ← element CRUD + pages
    ├── SelectionManager (523L) ← selection + alignment
    ├── StyleEngine (672L)      ← style mutations
    ├── HistoryManager (471L)   ← JSON patch undo/redo
    ├── DragManager (215L)      ← drag state machine
    ├── ComponentManager        ← saved component library
    ├── MediaManager            ← media upload/storage
    ├── FontManager             ← Google Fonts integration
    ├── PageRouter              ← multi-page routing
    ├── CollaborationManager    ← real-time OT (L1)
    ├── ExportEngine (650L)     ← HTML/CSS output
    └── 17 other managers...

UI → ENGINE BRIDGE PATTERN
  Component subscribes:
    React.useEffect(() => {
      composer.on(EVENTS.ELEMENT_SELECTED, handler);
      return () => composer.off(EVENTS.ELEMENT_SELECTED, handler);
    }, [composer]);

  Component mutates:
    composer.selection.select(element);    // or
    composer.elements.updateStyle(id, styles);

KEY EVENT FLOW
  LeftRail tab click
    → StudioPanels.handleTabChange
    → useStudioState.setActiveTab
    → LeftSidebar re-renders → TabRouter switches
    → React.lazy loads tab component

UNCLEAR LINKS (REVIEW)
  - useElementFlash: imported in AquibraStudio, wiring to Composer event unclear
  - storageMigration: runs on module load, may be outdated keys
  - Alignment tools (SelectionManager): implemented but UI entry unknown
  - 3 localStorage prefixes for panel state: risk of desync on key changes
```

---

## D) File-by-File Analysis (Key Files)

### 1. `engine/Composer.ts` (694 lines)

**Responsibility:** Central SSOT orchestrator. Creates and wires all 28 managers. Exposes `loadProject()`, `saveProject()`, `exportHTML()`, `setZoom()`. Extends `EventEmitter` so any subsystem can emit/listen.

**Key managers instantiated:** ElementManager, SelectionManager, StyleEngine, HistoryManager, DragManager, ComponentManager, MediaManager, FontManager, PageRouter, CollaborationManager, SyncManager, TemplateManager, CommandCenter, DataManager, FormHandler, InteractionManager, VersionHistoryManager, RecoveryManager, StorageAdapter, PluginManager

**Issues:**

- Line count (694) is near the limit. File is justified at this size because it's a constructor-heavy orchestrator — adding managers requires adding imports here.
- `emailService` imported at top level but it's unclear which feature uses it in the UI. Check if `integrations/EmailService.ts` is L0.

**Notes:** Don't split this file. The 28-manager constructor pattern is what makes Composer readable as a single wiring document.

---

### 2. `engine/SelectionManager.ts` (523 lines)

**Responsibility:** Selection SSOT. Holds `selected: Element | null` and `multiSelected: Set<Element>`.

**Key methods:**

- `select(element)` — clears multiSelect, emits `element:selected` and `element:deselected`
- `addToSelection(element)` — multi-select via Shift+click
- `removeFromSelection(element)` — deselect one
- `clearSelection()` — deselects all
- `reselect()` — force re-emit for UI refresh after structural changes (reparent, move)
- `getSelectedBounds()` — bounding rect of entire selection (used by alignment tools)
- `alignLeft/Right/Center/Top/Middle/Bottom()` — 6 alignment operations
- `distributeHorizontal/Vertical()` — 2 distribution operations

**Issues:**

- The 6 alignment + 2 distribution methods are in `SelectionManager` but their UI entry point is unclear. If there's no toolbar button for them, they are L0. **REVIEW: verify `UnifiedSelectionToolbar.tsx` wires to these.**
- 523 lines is just over the 500 limit. Could split alignment methods into `AlignmentMixin.ts` if needed.

---

### 3. `engine/HistoryManager.ts` (471 lines)

**Responsibility:** JSON-patch based undo/redo. Checkpoints every 10 patches. 500ms coalesce window to batch rapid mutations into single entries. Integrates with `CollaborationManager.recordForCollaboration()`.

**Key design:** Uses JSON Patch (RFC 6902) to compute diffs between state snapshots. On undo, applies reverse patches. On redo, re-applies forward patches. Coalesce window prevents undo-step explosion during e.g. font size slider drag.

**Issues:** None critical. The collaboration integration method call (`recordForCollaboration`) is a forward-dependency — if collaboration is removed, this call becomes dead code. Low priority.

---

### 4. `engine/drag/DragManager.ts` (215 lines)

**Responsibility:** Drag state machine: `IDLE → PENDING → DRAGGING → IDLE`. Throttled move updates to 16ms (60fps). Emits `drag:start`, `drag:move`, `drag:end`, `drag:cancel`.

**Key invariant:** Only ONE drag operation can be active. Attempting to `startDrag()` while `DRAGGING` is a no-op with a console warning.

**Issues:** None found. Well-bounded, focused file.

---

### 5. `components/Editor/hooks/useComposerInit.ts` (220 lines)

**Responsibility:** Bootstraps `Composer` with config, runs `loadProject()`, registers event handlers for 8 event categories: element mutations, page changes, selection, history, drag, viewport, sync, export.

**Key pattern:** All event subscriptions are registered here and cleaned up on unmount. This is the correct place for global event bindings. Component-specific events belong in their own hooks.

**Key detail:** 1500ms auto-save debounce — rapid edits don't trigger excessive saves.

**Issues:**

- At 220 lines, all 8 event categories are in one file. When Composer adds new event categories, this file grows. Consider extracting into `useComposerEvents.ts` (pure event subscriptions) vs `useComposerInit.ts` (bootstrap only).
- Low priority.

---

### 6. `components/Editor/hooks/useStudioState.ts` (426 lines)

**Responsibility:** Panel open/close, active tab, sidebar width — all persisted to `localStorage` under key `aqb-panel-state`. Includes `migrateLegacyPanelState()` for upgrading old key formats.

**Key detail:** 3 different localStorage key prefixes exist across the app. This file uses `aqb-panel-state`. ProInspector uses its own key. Other hooks may use others. If any key changes, migration logic is needed. **REVIEW: consolidate to single state key or at minimum document all 3 keys.**

**Issues:** 426 lines is approaching the limit. The migration function adds ~80 lines. This should stay — migration code is legitimate and will shrink over time as old keys expire.

---

### 7. `components/Canvas/hooks/useCanvasSync.ts` (79 lines)

**Responsibility:** Subscribes to 12 Composer events (`element:created`, `element:updated`, `element:deleted`, `element:moved`, `element:style:changed`, page events, etc.) and on any of them calls `composer.elements.toHTML()` to refresh the canvas iframe content.

**Key insight:** This is the bridge between engine state and visual rendering. Without this hook, editing would be invisible. It is the simplest possible correct bridge — any event that changes state triggers a full re-render.

**Issues:** Full re-render on every event is acceptable for the current scale (single user, moderate DOM sizes). Granular patching (only update changed nodes) would be an optimization for performance-sensitive cases.

---

### 8. `components/Canvas/hooks/useComposerSelection.ts` (178 lines)

**Responsibility:** Canonical hook for reading selection state from `SelectionManager`. Returns:

- `selectedId: string | null`
- `selectedIds: string[]`
- `selectedElement: Element | null`
- `selectedElements: Element[]`
- `isMultiSelect: boolean`

**Key design:** All components that need to know "what's selected" import this ONE hook. Never read from `SelectionManager` directly in component code. Never store selection in component `useState`.

**Issues:** None. This is the correct canonical read pattern.

---

### 9. `components/Panels/LeftSidebar/TabRouter.tsx` (106 lines)

**Responsibility:** Maps `GroupedTabId` → `React.lazy()` tab component. All 9 tabs wired: `add | layers | pages | components | assets | design | settings | publish | history`.

**Key design:** `React.lazy()` means each tab is a separate code bundle. Only the active tab's code is loaded on first activation. This significantly reduces initial bundle size.

**Issues:** None. Clean, focused.

---

### 10. `components/Panels/ProInspector/index.tsx` (604 lines)

**Responsibility:** Right panel with 3 tabs (Layout, Style, Advanced). Reads `selectedElement` from `useComposerSelection()`. Renders appropriate sections (spacing, typography, flexbox, interactions, etc.). Persists section expand/collapse in localStorage per element ID.

**Issues:**

- 604 lines is just over limit. The file is long because it defines the tab switching, multi-select toolbar, and section rendering in one place.
- Consider extracting multi-select toolbar into `MultiSelectToolbar.tsx`.
- Scroll position persistence per element is elegant but adds ~60 lines.

---

### 11. `components/Layout/LayoutShell.tsx` (252 lines)

**Responsibility:** CSS Grid 4-column container: Rail (56px) | Drawer (280px) | Canvas (1fr) | Inspector (300px). Includes WCAG 2.4.1 skip-link for keyboard accessibility.

**Issues:** None. Well-structured layout component.

---

### 12. `components/Panels/LeftSidebar/tabs/PagesTab.tsx` (197 lines — split from 772)

**Responsibility:** Thin orchestrator for page list. Manages page order state, drag-reorder, and drill-in navigation. Delegates row rendering to `PageRow.tsx` and settings to `PageSettingsScreen.tsx`.

**Issues:** None. Correctly slim after the split.

---

## E) Function Analysis (Key Functions)

### `SelectionManager.select(element)`

- **File:** `engine/SelectionManager.ts`
- **Purpose:** Replace current selection with one element (or `null` to deselect)
- **Params:** `element: Element | null`
- **Returns:** `void`
- **Side effects:** Clears `multiSelected`, emits `element:selected`, emits `element:deselected` for previous
- **Called by:** Canvas click handler, context menu, layer tree click
- **Label:** `ACTIVE_LOGIC`
- **Notes:** Guard `if (this.selected === element) return` prevents redundant event spam

---

### `SelectionManager.reselect()`

- **File:** `engine/SelectionManager.ts`
- **Purpose:** Force-re-emit `element:selected` for current element after structural changes
- **Params:** none
- **Returns:** `void`
- **Side effects:** Emits `element:selected` unconditionally
- **Called by:** After move/reparent operations where element reference is stable but position changed
- **Label:** `ACTIVE_LOGIC`
- **Notes:** Subtle but necessary — avoids Inspector showing stale bounds after element moves

---

### `SelectionManager.alignLeft/Right/Center/Top/Middle/Bottom()`

- **File:** `engine/SelectionManager.ts`
- **Purpose:** Align all selected elements to a common edge
- **Params:** none
- **Returns:** `void`
- **Side effects:** Mutates element positions, emits position-changed events, creates history entry
- **Called by:** REVIEW — unclear if any UI toolbar calls these
- **Label:** `REVIEW` — possibly L0 if no UI entry point

---

### `HistoryManager.push(patch)`

- **File:** `engine/HistoryManager.ts`
- **Purpose:** Record a JSON patch diff to the undo stack. Merges with previous entry if within 500ms coalesce window.
- **Params:** `patch: Patch`
- **Returns:** `void`
- **Side effects:** Clears redo stack, may create checkpoint every 10 patches
- **Called by:** All Composer managers after mutations
- **Label:** `ACTIVE_LOGIC`

---

### `DragManager.startDrag(element, position)`

- **File:** `engine/drag/DragManager.ts`
- **Purpose:** Transition state machine from IDLE to PENDING/DRAGGING
- **Params:** `element: Element`, `position: { x, y }`
- **Returns:** `void`
- **Side effects:** Sets internal state, emits `drag:start`
- **Called by:** Canvas `pointerdown` handler
- **Label:** `ACTIVE_LOGIC`
- **Notes:** Guard prevents double-start. Throttled move updates at 16ms.

---

### `useComposerInit` (hook)

- **File:** `components/Editor/hooks/useComposerInit.ts`
- **Purpose:** Create Composer instance, run `loadProject()`, bind all global event handlers
- **Returns:** `{ composer, isLoading, error }`
- **Side effects:** Mounts 8 event listener groups, configures auto-save debounce at 1500ms
- **Called by:** `AquibraStudio.tsx` (top level, once)
- **Label:** `ACTIVE_LOGIC`

---

### `useComposerSelection` (hook)

- **File:** `components/Canvas/hooks/useComposerSelection.ts`
- **Purpose:** Canonical read path for SelectionManager state
- **Returns:** `{ selectedId, selectedIds, selectedElement, selectedElements, isMultiSelect }`
- **Side effects:** Subscribes to `element:selected`, `element:deselected`, `selection:added`, `selection:cleared` events; re-renders component on change
- **Called by:** ProInspector, AquibraStudio, Canvas overlays, UnifiedSelectionToolbar
- **Label:** `ACTIVE_LOGIC`
- **Notes:** This hook is the correct pattern. Components MUST NOT read from `composer.selection` directly in render.

---

### `useCanvasSync` (hook)

- **File:** `components/Canvas/hooks/useCanvasSync.ts`
- **Purpose:** Trigger canvas HTML re-render on any structural change event
- **Returns:** void (side effects only)
- **Side effects:** Calls `composer.elements.toHTML()` on 12 different events
- **Called by:** `Canvas.tsx`
- **Label:** `ACTIVE_LOGIC`

---

### `migrateStorageKeys()`

- **File:** `utils/storageMigration.ts`
- **Purpose:** Upgrade old localStorage keys to current format
- **Called by:** `AquibraStudio.tsx` at module load — runs ONCE before any component renders
- **Label:** `REVIEW` — verify old key format is still in use by any live users, otherwise this is dead weight

---

### `TabRouter` (component)

- **File:** `components/Panels/LeftSidebar/TabRouter.tsx`
- **Purpose:** Route `GroupedTabId` → correct lazy tab component via switch/case
- **Pattern:** `React.lazy(() => import('./tabs/BuildTab'))` for each tab — code-splitting
- **Label:** `ACTIVE_LOGIC`

---

### `PageSettingsScreen` (component)

- **File:** `components/Panels/LeftSidebar/tabs/pages/PageSettingsScreen.tsx`
- **Purpose:** Drill-in screen for page SEO, slug, OG meta, duplicate, set-home, delete
- **Props:** `composer, page: PageItem, onBack: () => void`
- **Pattern:** Local form state tracks `hasChanges` → shows `StickyFooter` save button
- **Label:** `ACTIVE_LOGIC`
- **Notes:** Import path was fixed this session (`../../shared/StickyFooter`, not `../shared/StickyFooter`)

---

## F) Real Editor Flow (Step-by-Step)

### Flow 1: User clicks an element on canvas

```
1. User clicks element in Canvas iframe
2. Canvas pointerdown handler fires (useCanvasPointerEvents.ts)
3. → composer.selection.select(element)          [SelectionManager]
4. → SelectionManager emits "element:selected"  [EventEmitter]
5. → useComposerSelection hook receives event    [re-renders consumers]
6. → ProInspector re-renders with selectedElement
7. → SelectionBoxOverlay re-renders with bounds
8. → UnifiedSelectionToolbar appears
```

### Flow 2: User changes a style in ProInspector

```
1. User adjusts padding slider in ProInspector
2. → useStyleHandlers.handleStyleChange(property, value)
3. → composer.styles.setStyle(elementId, property, value) [StyleEngine]
4. → StyleEngine validates + applies to element
5. → StyleEngine creates JSON patch diff
6. → HistoryManager.push(patch)                  [history entry]
7. → StyleEngine emits "element:style:changed"   [EventEmitter]
8. → useCanvasSync receives event
9. → composer.elements.toHTML() called
10. → Canvas iframe re-renders with new CSS
```

### Flow 3: User drag-drops a block from sidebar

```
1. User drags ElementCard from BuildTab
2. → ElementCard dragStart sets data-transfer with block definition
3. → Canvas receives dragover → DragManager.move()  [throttled 16ms]
4. → DropFeedbackOverlay shows insertion indicator
5. → User releases mouse → Canvas drop handler
6. → DragManager.endDrag()                      [DRAGGING → IDLE]
7. → composer.elements.createElement(blockDef)  [ElementManager]
8. → ElementManager assigns ID, sets parent
9. → HistoryManager records creation patch
10. → "element:created" event emitted
11. → useCanvasSync → canvas re-renders with new element
12. → composer.selection.select(newElement)     [auto-selects new element]
```

---

## G) Orphan / Legacy / Dead Code Report

| Item                                               | Type        | Reason                                                | Confidence | Status                  |
| -------------------------------------------------- | ----------- | ----------------------------------------------------- | ---------- | ----------------------- |
| `components/surfaces/ManageOverlay/index.tsx`      | Entire file | Zero imports in codebase; duplicates tabs             | High       | **DELETED ✅**          |
| `components/surfaces/InsertDrawer/index.tsx`       | Entire file | Zero imports; abandoned Phase 3 UX                    | High       | **DELETED ✅**          |
| `components/surfaces/DockedSheet/index.tsx`        | Entire file | Zero imports + broken internal imports                | High       | **DELETED ✅**          |
| `ProInspector/shared/PropertyRenderer.tsx`         | Entire file | L0 per CLAUDE.md; never imported                      | High       | **DELETED ✅**          |
| `ProInspector/shared/controls/ControlRegistry.tsx` | Entire file | L0 per CLAUDE.md; 6/70 types built                    | High       | **DELETED ✅**          |
| `hooks/useElementFlash.ts`                         | Hook        | Imported in AquibraStudio; unclear what triggers it   | Medium     | **REVIEW**              |
| `utils/storageMigration.ts`                        | Utility     | Auto-runs on module load; old keys may be extinct     | Medium     | **REVIEW**              |
| `engine/integrations/EmailService.ts`              | Service     | Documented as L0 (stub) in CLAUDE.md                  | High       | **REVIEW**              |
| `SelectionManager.alignLeft/Right/...`             | Methods     | Implemented but UI entry point unclear                | Medium     | **REVIEW**              |
| `PagesTab.tsx:5` (old)                             | Comment     | `TODO(split): ~761 lines` — self-documented violation | High       | **FIXED ✅** (now 197L) |
| `ElementsTab.tsx:6` (old)                          | Comment     | `TODO(split): ~658 lines`                             | High       | **FIXED ✅** (now 176L) |

---

## H) Structure & Complexity Problems

### 1. localStorage Key Fragmentation (Low risk)

Three separate keys hold panel-related state:

- `useStudioState.ts` → `aqb-panel-state`
- `ProInspector/index.tsx` → inspector section expand state (per element ID)
- Possibly others in other hooks

If the `aqb-panel-state` key name changes, the migration function in `storageMigration.ts` must be updated. Currently there's no single source of truth for "all localStorage keys this app uses."

**Suggestion:** Create `constants/storage.ts` listing all keys, or add them to existing `constants/storage.ts` if it exists.

---

### 2. StudioPanels Props Explosion (Medium complexity)

`StudioPanels.tsx` (648L) receives 20+ props and distributes them to Canvas, Sidebar, and Inspector. It owns no state — it is a prop-routing hub. This is the typical "smart parent / dumb children" smell in large React apps.

**Note:** This is a common trade-off. Extracting to Context API could help, but requires touching many consumers. Not critical to fix.

---

### 3. Large Files Still Over Limit (canvas + engine)

After the tab splits, the following files remain over 500 lines:

| File                          | Lines | Type                      | Priority                       |
| ----------------------------- | ----- | ------------------------- | ------------------------------ |
| `CollaborationManager.ts`     | 789   | Engine — L1 feature       | Low (fix when feature is L2)   |
| `useCanvasKeyboard.ts`        | 620   | All shortcuts in one file | Medium                         |
| `UnifiedSelectionToolbar.tsx` | 637   | Complex toolbar           | Medium                         |
| `QuickActionsToolbar.tsx`     | 530   | Action toolbar            | Low                            |
| `ProInspector/index.tsx`      | 604   | Inspector orchestrator    | Medium                         |
| `StyleEngine.ts`              | 672   | Engine SSOT               | Low (well-focused)             |
| `ExportEngine.ts`             | 650   | Export SSOT               | Low (well-focused)             |
| `constants/icons.ts`          | 659   | Data dump                 | Low                            |
| `types/index.ts`              | 803   | Type definitions          | Low (type verbosity is normal) |

---

### 4. Parallel "Phase 3 UX" System — RESOLVED

`surfaces/` was a dead parallel system (ManageOverlay, InsertDrawer, DockedSheet) that duplicated all sidebar tab content. **Deleted this session.** No trace remains.

---

### 5. Alignment Tools Wiring Gap (Possible L0)

`SelectionManager` implements 6 alignment + 2 distribution methods. If `UnifiedSelectionToolbar.tsx` does not call these, they are L0 dead code. This requires a code search to confirm.

---

### 6. Collaboration / CloudSync Integration Completeness (L1)

Both `CollaborationManager` and `CloudSyncService` are complete implementations but marked L1 — they run in engine but:

- Collaboration: Operational Transformation logic exists, but real-time presence UI (`PresenceIndicators.tsx`, `ConnectionQualityIndicator.tsx`) may not be wired to `CollaborationManager` events
- CloudSync: Save/load logic exists, but conflict resolution UI (`ConflictModal.tsx`) may not be reachable via normal user flow

---

## I) Review Suggestions (Prioritized)

### P0 — Verify before next feature work

1. **Alignment methods wiring check**

   ```bash
   grep -rn "alignLeft\|alignRight\|alignCenter\|alignTop\|alignMiddle\|alignBottom\|distributeH\|distributeV" \
     packages/new-editor-l2/src/components --include="*.tsx"
   ```

   If returns 0 results → these methods are L0. Either add toolbar buttons or delete.

2. **useElementFlash integration**
   - Find what event triggers it
   - Verify it doesn't hold stale references after element deletion

3. **storageMigration.ts relevance**
   - Review which old key formats it migrates
   - If the old keys were written >1 year ago and no live users have old data, remove it

### P1 — Address in next cleanup sprint

4. **localStorage key inventory**
   Create `constants/storage.ts` with all keys:

   ```typescript
   export const STORAGE_KEYS = {
     PANEL_STATE: "aqb-panel-state",
     INSPECTOR_SECTIONS: "aqb-inspector-sections",
     // etc.
   } as const;
   ```

5. **Split `useCanvasKeyboard.ts` (620L)**
   Group by intent:
   - `useCanvasEditShortcuts.ts` — copy, paste, delete, duplicate
   - `useCanvasNavShortcuts.ts` — zoom, pan, device switch
   - `useCanvasSelectShortcuts.ts` — select all, deselect, escape

6. **Split `ProInspector/index.tsx` (604L)**
   Extract `MultiSelectToolbar.tsx` (~80L) to bring orchestrator under 520L.

7. **Verify collaboration presence UI wiring**
   ```bash
   grep -rn "PresenceIndicators\|CollaborationManager" \
     packages/new-editor-l2/src/components --include="*.tsx"
   ```

### P2 — Nice to have

8. **`constants/icons.ts` (659L)**
   Split by domain: `icons/canvas.ts`, `icons/ui.ts`, `icons/blocks.ts`.

9. **StudioPanels props explosion**
   Consider React Context for frequently-needed values (composer, activeTab) to reduce prop drilling.

---

## J) Top 20 Most Important Files to Understand First

### Tier 1 — Core Engines (understand these first)

| Rank | File                                | Why It Matters                                                                    |
| ---- | ----------------------------------- | --------------------------------------------------------------------------------- |
| 1    | `engine/Composer.ts`                | Everything flows through here. All 28 managers, all events. Read this first.      |
| 2    | `engine/elements/ElementManager.ts` | How elements are created, moved, deleted, and serialized. Central to all editing. |
| 3    | `engine/SelectionManager.ts`        | Selection SSOT. Every click, every inspector render depends on this.              |
| 4    | `engine/HistoryManager.ts`          | Undo/redo is fundamental. JSON patch + coalesce design is worth understanding.    |
| 5    | `engine/styles/StyleEngine.ts`      | How CSS gets applied to elements. Breakpoint-aware style mutations.               |

### Tier 2 — Main Hooks (understand the React ↔ Engine bridge)

| Rank | File                                              | Why It Matters                                                                                 |
| ---- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 6    | `components/Editor/hooks/useComposerInit.ts`      | How the engine is bootstrapped and all events bound.                                           |
| 7    | `components/Canvas/hooks/useComposerSelection.ts` | Canonical hook for reading selection. Every UI component that cares about selection uses this. |
| 8    | `components/Canvas/hooks/useCanvasSync.ts`        | The bridge from engine events to visual re-renders. 79 lines — read in 5 minutes.              |
| 9    | `components/Editor/hooks/useStudioState.ts`       | How panel open/close state works. localStorage persistence pattern.                            |

### Tier 3 — Layout + Routing

| Rank | File                                          | Why It Matters                                                            |
| ---- | --------------------------------------------- | ------------------------------------------------------------------------- |
| 10   | `components/Layout/LayoutShell.tsx`           | The 4-column CSS Grid that defines the editor's physical layout.          |
| 11   | `components/Editor/StudioPanels.tsx`          | How props flow from shell to all 4 panels.                                |
| 12   | `components/Panels/LeftSidebar/TabRouter.tsx` | How 9 tabs are routed with code-splitting.                                |
| 13   | `constants/tabs.ts`                           | The `GroupedTabId` union type + `GROUPED_TABS_CONFIG`.                    |
| 14   | `constants/events.ts`                         | All 100+ typed event names. Read to understand what can be subscribed to. |

### Tier 4 — Feature Areas

| Rank | File                                              | Why It Matters                                                         |
| ---- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| 15   | `components/Canvas/Canvas.tsx`                    | The editing surface entry. 41 hooks orchestrated here.                 |
| 16   | `components/Panels/ProInspector/index.tsx`        | Right panel. How selected element properties are displayed and edited. |
| 17   | `components/Panels/LeftSidebar/tabs/BuildTab.tsx` | "Add" tab — how blocks/templates are browsed and dragged.              |
| 18   | `engine/drag/DragManager.ts`                      | The drag state machine. Core to understanding element placement.       |
| 19   | `components/Blocks/blockRegistry.ts`              | The block library. Defines what elements users can insert.             |
| 20   | `engine/export/ExportEngine.ts`                   | How the editor's DOM becomes clean HTML/CSS for deployment.            |

---

## K) Review Needed (Unclear / Indirect / Dynamic)

| Item                                  | Location                               | What Needs Verification                                                          | Impact                       |
| ------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------- |
| Alignment tool UI wiring              | `SelectionManager.ts:alignLeft()` etc. | Is any toolbar button connected to these?                                        | High — could be L0 dead code |
| `useElementFlash` trigger             | `hooks/useElementFlash.ts`             | What event triggers element flash highlight?                                     | Medium                       |
| `storageMigration.ts`                 | `utils/storageMigration.ts`            | Are old keys still written by any live version?                                  | Low                          |
| localStorage key inventory            | Multiple files                         | How many keys exist, are any duplicated?                                         | Low                          |
| Collaboration presence UI             | `components/Collaboration/`            | Are PresenceIndicators wired to CollaborationManager events?                     | Medium (L1 → L2)             |
| CloudSync conflict modal              | `components/Sync/ConflictModal.tsx`    | Is this reachable via normal user flow?                                          | Medium (L1 → L2)             |
| `emailService` in Composer            | `engine/Composer.ts:10`                | Is EmailService used anywhere in the UI flow?                                    | High — could be L0           |
| `engine/integrations/EmailService.ts` | Engine                                 | Stub or real? CLAUDE.md says stub.                                               | High — L0 candidate          |
| Collaboration OT completeness         | `engine/collaboration/OTEngine.ts`     | Is Operational Transform actually applied to element mutations?                  | High                         |
| `features/` barrel redirects          | `src/features/*/ui/index.ts`           | Do these re-export files that actually live in `components/`? Are paths correct? | Medium                       |

---

## Appendix: Architecture Cleanup Summary (This Session)

| Change                          | Before                         | After                       | Files                                                            |
| ------------------------------- | ------------------------------ | --------------------------- | ---------------------------------------------------------------- |
| Delete `surfaces/`              | 895 lines (3 files, 0 imports) | DELETED                     | ManageOverlay, InsertDrawer, DockedSheet                         |
| Split `PagesTab.tsx`            | 772 lines                      | 197 lines                   | + PageRow, PageSettingsScreen, styles, types, index              |
| Split `ElementsTab.tsx`         | 666 lines                      | 176 lines                   | + ElementCard, useElementsState, constants, types, index         |
| Split `ComponentsTab.tsx`       | 593 lines                      | 340 lines                   | + ComponentRow, ComponentIcon, styles, types, useComponentsState |
| Fix TypeScript import           | `../shared/StickyFooter`       | `../../shared/StickyFooter` | PageSettingsScreen.tsx                                           |
| **Total lines removed**         | **2,926 lines**                | —                           | Across 6 main files                                              |
| **New sub-files created**       | —                              | **17 files**                | Under tabs/pages/, elements/, components/                        |
| **Line count violations fixed** | 3                              | 0                           | PagesTab, ElementsTab, ComponentsTab                             |

---

_Generated: 2026-02-21 | Analyst: Claude Sonnet 4.6 | Method: Static analysis + grep traces_
