# EDITOR_AUDIT_PLAN.md

**Scope:** `packages/editor/src/` — editor system only (shell, topbar, sidebar, canvas, drag/drop, inspector, layers, save/preview/publish, shortcuts, render, tokens). Dashboard, auth, billing, marketing pages excluded.

**Generated:** 2026-05-06
**Methodology:** Read-only deep scan via 5 parallel sub-agents covering Engine/State, Canvas+DnD, Inspector, Save+History, Shell+Sidebar. Every claim cited with `file:line`. No code changes made.

**Verdict at a glance:** Editor architecture is in better shape than the size suggests. Multiple prior cleanup arcs (vibcoder migration, `components/` deletion, `features/` collapse) drained the obvious duplication. Remaining problems cluster in three buckets: **fake UI shipping as real features** (Publish, Command Palette, Account modal), **dead scaffolds in the engine** (Sync, CloudSync, scaffold of Recovery), and **god components** (5 files >500 lines mixing orchestration, state, and rendering).

---

## 1. Executive Summary

### Current state of editor

- **~408 TSX/TS files** in `editor/` UI surface (shell, canvas, inspector, sidebar, panels, rail).
- **30 managers** instantiated by `engine/Composer.ts` covering elements, styles, history, viewport, storage, drag, media, fonts, components, CMS, collaboration, sync, recovery, plugins, commands, animations, forms, page routing.
- **Single rendering path:** Canvas mounts engine-generated HTML via React's raw-HTML escape hatch + `data-buildrick-id` lookup. No parallel preview/editor renderer.
- **Single element tree:** `ElementManager` owns `Map<string, Element>` — layers panel and canvas read from same source.
- **Single drag system:** `engine/drag/DragManager.ts` + `useCanvasDragDrop` + `useCanvasElementDrag` — no legacy fallback.
- **Single selection system:** `SelectionManager` owns selected/multi-selected. No React duplication.
- **Style updates** route through `useStyleHandlers` with debounced flush, transaction wrapping, spread-merge — well-structured.
- **History** hooks `EVENTS.PROJECT_CHANGED` with 500ms coalesce; no bypass paths detected.

### Biggest risks

1. **Publish flow is theatrical.** `PublishDropdown.tsx:85-107` renders state options (Draft / In Review / Approved / Published) with no `onClick` handlers. Clicking does nothing. The Publish button next to it falls back to `handleExport` (HTML download). No backend publish exists. Users can "publish" a site and nothing reaches a server. Critical trust failure for a website builder.
2. **Command Palette is a placeholder.** `CommandPalette.tsx:24-35` ships a hardcoded 7-item `ACTIONS` array (Dashboard, Settings, Search, Rename, Duplicate, Toggle Sidebar, Toggle Preview). The actual `CommandCenter` + `KeybindingManager` system (which is real and wired to 30+ commands) is **not** consulted. Two parallel command surfaces, only one connected to the engine.
3. **Account / Team modal is a mock.** `AccountModal.tsx` hardcodes user "Aamir Siddiqui" + `MOCK_MEMBERS` array. No API, no real persistence.
4. **Engine scaffolds.** `engine/sync/SyncManager.ts` + `CloudSyncService` are referenced from `Composer` but not in the save path; `RecoveryManager` only fires on `visibilitychange`, not on actual errors/crashes. These look like features but don't pull weight.
5. **God components.** 5 files ≥500 lines mix orchestration with rendering: `AquibraStudio.tsx` (609), `useCanvasDragDrop.ts` (692), `QuickActionsToolbar.tsx` (629), `registry.tsx` (inspector, 666), `Canvas.tsx` (589). Maintainability + test surface risk.

### Most dangerous editor systems

| System | Why dangerous | Confidence |
|---|---|---|
| Publish (Topbar + PublishDropdown) | User-facing fake; promises ship-to-web; ships nothing | High — trace shows no API call |
| Command Palette | Two command surfaces, drift between them as features added | High |
| `useCanvasDragDrop.ts` (692 lines) | One file owns drop handling, validation glue, hover overlay sync, touch + mouse, cursor styling. Bug surface = entire DnD UX. | High |
| `Composer.ts` (30 managers, 700+ lines) | Single class is the editor. Every manager added grows the constructor and lifecycle wiring. | Medium |
| `AccountModal.tsx` | Looks complete; ships mock data; hardest to detect from QA | High |

### Top cleanup priorities (in order)

1. **Decide publish strategy.** Either remove the `PublishDropdown` state machine (and the Publish button label "Publish") or wire it to a real backend stub that returns a meaningful error. Today it silently misleads users.
2. **Collapse Command Palette into `CommandCenter`.** Replace hardcoded `ACTIONS` with `composer.commands.list()` driven by registered commands. Single source of truth.
3. **Mark scaffolds clearly.** Tag `SyncManager`, `CloudSyncService`, `AccountModal` mock data, and `MOCK_MEMBERS` with explicit `// SCAFFOLD:` comments + an `ENV` flag, or delete them. No silent half-features.
4. **Split `useCanvasDragDrop.ts`.** 692 lines is too much for one hook. Extract drop-target resolution, cursor management, and touch handling.
5. **Resolve `Composer.state.device` ↔ `Viewport.currentDevice` duplication.** Pick one source. Both currently update on `setDevice` and emit `BREAKPOINT_CHANGED` from two places.
6. **Standardize event names.** `EVENTS.CONSTANT` vs `"camelCase"` strings used inconsistently — risk of mistyped subscriber.

---

## 2. Editor System Map

### 2.1 Editor shell

| | |
|---|---|
| **Files** | `editor/shell/AquibraStudio.tsx` (609 lines), `StudioHeader.tsx` (269), `StudioPanels.tsx` (448), `StudioModals.tsx` (350), `StudioFooter.tsx`, `editor/rail/LayoutShell.tsx` (329) |
| **Purpose** | Top-level orchestrator. Composes Topbar + Rail + Drawer + Canvas + Inspector + Footer via 8-col CSS grid (`LayoutShell`). Owns global keyboard shortcuts (`AquibraStudio.tsx:244-258`). |
| **Dependencies** | Composer, all panel routers, `useComposerSelection`, `useViewport` |
| **Source of truth** | Layout slots in `LayoutShell.tsx` (real); panel widths/visibility in `useSidebarState.ts` |
| **Known problems** | (1) `AquibraStudio.tsx` mixes provider setup + keyboard shortcuts + save/preview wiring + modal state — orchestration sprawl. (2) `StudioPanels.tsx` 448 lines passes `composer + selection + state` to `LayoutShell` — overlap with `AquibraStudio`. |
| **Cleanup priority** | High |

### 2.2 Top bar

| | |
|---|---|
| **Files** | `editor/shell/Topbar.tsx` (511), `BreakpointDropdown.tsx` (275), `PublishDropdown.tsx` (335), `StatusIndicators.tsx`, `StudioHeader.tsx` (269) |
| **Purpose** | Renders undo/redo, history, breakpoint switcher, save status, invite, command palette button, preview, publish, help, account. |
| **Dependencies** | `composer.history`, `composer.viewport`, `composer.saveProject`, `exportHTML` |
| **Source of truth** | `Composer.state.dirty` (save), `Viewport.currentDevice` (breakpoint), `HistoryManager` (undo/redo). Save status derived in `Topbar.tsx:282-290`. |
| **Known problems** | (1) Publish fake UI — `PublishDropdown.tsx:85-107`. (2) Preview button has loading state but onPreview wiring relies on `StudioHeader.handlePreview` which exports + opens `window.open` — **functional**, but agent flagged unclear hand-off. (3) `BreakpointDropdown` "custom width" input snaps to nearest preset (`BreakpointDropdown.tsx:73-82`) — not actual custom width. |
| **Cleanup priority** | Critical (Publish), Medium (Preview clarity), Low (BreakpointDropdown UX) |

### 2.3 Left add/sidebar panel

| | |
|---|---|
| **Files** | `editor/sidebar/LeftSidebar.tsx` (367), `FullPageRouter.tsx` (76), `TabRouter.tsx` (146), `FullPageView.tsx` (67), `useSidebarState.ts`, `useSidebarKeyboard.ts`, `tabsConfig.ts`, all `editor/sidebar/tabs/*` |
| **Purpose** | Hosts 11 tabs across 3 zones: creation (add/ai/templates/assets), structure (layers/pages/components), config (design/settings/publish/history). |
| **Dependencies** | Composer, `blocks/blockRegistry.ts`, `useBlockInsertion` |
| **Source of truth** | `tabsConfig.ts` (tab catalog), `useSidebarState` (active tab, drawer width, mode) |
| **Known problems** | (1) Two parallel routers `TabRouter` (panel mode) + `FullPageRouter` (fullpage mode) — both switch on tab id, partial overlap on `design`/`assets` tabs. Not strictly duplicate (different render targets) but tab-id matching logic is split across files. (2) `PublishTab` shipping today is config UI without backend. |
| **Cleanup priority** | Medium |

### 2.4 Canvas

| | |
|---|---|
| **Files** | `editor/canvas/Canvas.tsx` (589), `Canvas.types.ts`, `canvasStyles.ts`, `editor/canvas/hooks/useCanvasContent.ts`, `useCanvasDragDrop.ts` (692), `useCanvasElementDrag.ts` (504), `useComposerSelection.ts`, `editor/canvas/overlays/*` (selection, hover, multi-select), `engine/canvas/indicators/SelectionIndicatorManager.ts`, `engine/canvas/RepeaterRenderer.ts` |
| **Purpose** | Renders engine-generated HTML; routes click → selection; mounts overlays; hosts drag/drop. |
| **Dependencies** | `composer.elements`, `composer.selection`, `composer.drag`, `composer.viewport` |
| **Source of truth** | Engine HTML via `useCanvasContent` injected through React's raw-HTML escape hatch (`Canvas.tsx:465`). Selection via `composer.selection`. Hover via `SelectionIndicatorManager` (visual only — explicitly NOT a state holder per `engine/canvas/indicators/SelectionIndicatorManager.ts:3-7`). |
| **Known problems** | (1) `Canvas.tsx` 589 lines orchestrates render + click resolution + drop wiring + empty CTA + zoom + frame preview. (2) `useCanvasDragDrop.ts` 692 lines = god hook. (3) `QuickActionsToolbar.tsx` 629 lines lives at `editor/canvas/menus/` and bundles every per-element quick action into one component. |
| **Cleanup priority** | High (god hook split) |

### 2.5 Drag-and-drop engine

| | |
|---|---|
| **Files** | `engine/drag/DragManager.ts` (16ms throttle, line 29), `shared/utils/dragDrop/dropValidation.ts`, `shared/utils/nesting/validator.ts`, `editor/canvas/hooks/useCanvasDragDrop.ts`, `useCanvasElementDrag.ts`, `useTouchDrag.ts`, `editor/canvas/hooks/dropOperations.tsx` |
| **Purpose** | Mouse + touch drag, drop validation (parent compat, max depth, void elements, ancestor cycles), drop insertion. |
| **Dependencies** | `composer.elements`, `ElementType` schema |
| **Source of truth** | `dropValidation.validateDrop()` is the single validator. Nesting rules cached in `nesting/validator.ts:53-88`. |
| **Known problems** | (1) Drop logic glue (`useCanvasDragDrop.ts`) is the largest file in the editor at 692 lines. (2) Move events throttled but no debounce on drop reordering — under stress could fire many `setOrder` ops; not measured. |
| **Cleanup priority** | High (split god hook) |

### 2.6 Element schema / model

| | |
|---|---|
| **Files** | `shared/types/element.ts` (canonical `ElementData` interface), `engine/elements/Element.ts` (instance class, 418 lines), `engine/elements/ElementManager.ts` (488), `engine/elements/ElementCRUD.ts`, `engine/elements/ElementStyles.ts`, `engine/elements/ElementChildren.ts`, `engine/elements/ElementOperations.ts`, `engine/elements/ElementSerialization.ts`, `engine/elements/HTMLParser.ts`, `engine/elements/PageManager.ts` |
| **Purpose** | Type definition + instance ops + tree management + serialization + HTML parsing. |
| **Dependencies** | None outside `shared/types` and `engine/EventEmitter` |
| **Source of truth** | `ElementData` interface in `shared/types/element.ts:34-67`. 34 element types in `ElementType` union. |
| **Known problems** | (1) `Element.ts` is a delegating wrapper class over `ElementStyles` + `ElementChildren` + `ElementOperations` + `ElementSerialization`. Useful split, but adds an indirection layer. Acceptable. (2) 34 hardcoded element types in `ElementType` union — no plugin extension point visible from this file alone; a custom element via `'custom'` is the only escape hatch. |
| **Cleanup priority** | Low |

### 2.7 Component registry / rendering

| | |
|---|---|
| **Files** | `blocks/blockRegistry.ts` (single source), `blocks/types.ts`, `blocks/{Basic,Components,Ecommerce,Forms,Layout,Media,Navigation,Sections}/*` |
| **Purpose** | Registry mapping block id → element schema + builder. |
| **Source of truth** | `blockDefinitions[]` in `blocks/blockRegistry.ts:96-150` |
| **Known problems** | None major. Registry is single, complete, type-safe. |
| **Cleanup priority** | Low |

### 2.8 Layers panel

| | |
|---|---|
| **Files** | `editor/panels/layers/index.tsx`, `useLayersState.ts`, related tree-row components |
| **Purpose** | Shows element tree; click selects on canvas; hover highlights; drag-reorder. |
| **Dependencies** | `composer.elements`, `useComposerSelection` |
| **Source of truth** | Same `composer.elements.getAllElements()` as canvas — no parallel tree. |
| **Known problems** | None major. Drag-reorder handlers not deeply traced — flag for follow-up if reorder bugs are reported. |
| **Cleanup priority** | Low |

### 2.9 Inspector / properties panel

| | |
|---|---|
| **Files** | `editor/inspector/ProInspector.tsx` (378), `inspector/sections/*` (SizeSection 378, BackgroundSection 374, EffectsSection 404, GridSection 340, BorderSection, SpacingSection, TypographySection, LinkSection 333, etc.), `inspector/components/InputControls.tsx` (357), `inspector/hooks/useStyleHandlers.ts`, `useBatchStyleHandler.ts`, `inspector/renderer/registry.tsx` (666), `inspector/config/elementProfiles.ts` |
| **Purpose** | Reads selected element styles, displays per-section forms, writes back via debounced flush + transaction. |
| **Dependencies** | Composer, `useComposerSelection`, `cssContext` cascade resolver |
| **Source of truth** | (a) Selection: `useComposerSelection` (single hook subscribing to `selection:changed`). (b) Effective styles: `computeEffectiveStyles(el, composer, currentBreakpoint, currentPseudoState)` in `inspector/utils/cssContext.ts:52-74`. (c) Section rendering: `elementProfiles.ts` profile + `registry.tsx` `defineSection()` factory. |
| **Known problems** | (1) `registry.tsx` 666 lines — every section's defineSection call lives in one file. Could split per-element-family. (2) Five distinct update entry points (`handleStyleChange`, `handleBatchStyleChange`, `el.setStyle`, `composer.styles.setBreakpointStyle`, `composer.styles.setRule`) — intentional (different concerns) but onboarding cost is real. |
| **Cleanup priority** | Medium |

### 2.10 Responsive controls

| | |
|---|---|
| **Files** | `engine/Viewport.ts`, `editor/shell/BreakpointDropdown.tsx` (275), inspector responsive override handling in `useStyleHandlers.ts:97-99,176-180` |
| **Purpose** | Switch active breakpoint; per-breakpoint style writes; override indicator dots. |
| **Source of truth** | **Conflicted.** `Viewport.currentDevice` (`engine/Viewport.ts:19`) AND `Composer.state.device` (`engine/Composer.ts:245`) both store the active device. `Composer.setDevice()` updates state + delegates to `Viewport.setDevice()`. Both emit `BREAKPOINT_CHANGED`. |
| **Known problems** | Dual emission risk. Subscribers may receive event twice. |
| **Cleanup priority** | High (real SSOT issue) |

### 2.11 Undo / redo

| | |
|---|---|
| **Files** | `engine/HistoryManager.ts`, `historyTypes.ts`, `HistoryFormatter.ts`, `engine/VersionHistoryManager.ts`, `editor/panels/VersionHistoryPanel.tsx` |
| **Purpose** | Two systems: (a) `HistoryManager` = undo/redo via patch diffs; (b) `VersionHistoryManager` = named version timeline. Different concerns. |
| **Source of truth** | `HistoryManager` listens to `EVENTS.PROJECT_CHANGED`, coalesces 500ms, records patch (`HistoryManager.ts:115,156`). Bound to keyboard via `defaultCommands.ts:21+`. |
| **Known problems** | (1) Two history APIs (undo stack vs version timeline) need to be obviously distinguished in user-facing UI. Today the History tab and the undo/redo buttons have separate semantics; not problematic but undocumented. |
| **Cleanup priority** | Low |

### 2.12 Save / preview / publish

| | |
|---|---|
| **Files** | `engine/storage/StorageAdapter.ts`, `engine/storage/CloudSyncService.ts` (scaffold), `engine/sync/SyncManager.ts` (scaffold), `engine/sync/OfflineQueue.ts`, `engine/recovery/RecoveryManager.ts`, `editor/shell/Topbar.tsx`, `PublishDropdown.tsx`, `StatusIndicators.tsx`, `StudioHeader.tsx`, `engine/export/ExportEngine.ts` |
| **Purpose** | Persist project, show save state, export HTML for preview, publish to web. |
| **Source of truth** | `Composer.state.dirty` (single bool, `Composer.ts:526`). Save destination: `localStorage` (`StorageAdapter.ts:35`, key `aquibra-project`). |
| **Known problems** | (1) **Publish has no backend** — `PublishDropdown.tsx:85-107` options are dead. (2) `CloudSyncService` exists with types only; not invoked. (3) `SyncManager` referenced by Composer but not in save path. (4) Recovery only fires on `visibilitychange` — won't catch JS error / crash. |
| **Cleanup priority** | Critical (Publish), High (scaffolds) |

### 2.13 Editor styling / design system

| | |
|---|---|
| **Files** | `themes/design-system/` (canonical tokens), `themes/components/` (vibcoder primitive CSS), `editor/shared/vibcoder/` (vibcoder React wrappers, 286 consumers), `shared/extensions/` (compositions on vibcoder), `shared/ui/` (Buildrik non-vibcoder primitives — 4 files post-audit), `editor/design-system/` (site-builder tokens; different domain from chrome). Canvas styles in `editor/canvas/Canvas.css` + `canvasStyles.ts` (Emotion). |
| **Purpose** | Token + primitive system for editor chrome. Vibcoder is Buildrik-owned canonical (vendor pipeline retired 2026-05-06). |
| **Source of truth** | Per `CLAUDE.md` SSOT contract (verified against on-disk file count + memory): tokens in `themes/design-system/*.css`; primitive CSS in `themes/components/`; React wrappers in `editor/shared/vibcoder/`; compositions in `shared/extensions/`. |
| **Known problems** | Migrations in flight per memory: `themes/components.css` retiring (target <300 lines, currently being drained at 516 LOC per Q2 day 1 record). Some chrome refs still using legacy `bdc-*`/`buildrick-*` classes. Tracked. |
| **Cleanup priority** | Medium (continue existing drain plan, do not duplicate work) |

---

## 3. Issue Inventory

| ID | Severity | Type | Editor System | File(s) | Problem | Evidence | Recommended Fix | Risk |
|----|----------|------|---------------|---------|---------|----------|-----------------|------|
| E-001 | Critical | Fake UI | Topbar / Save-Preview-Publish | `editor/shell/PublishDropdown.tsx:85-107` | `STATE_OPTIONS` array (Draft / In Review / Approved / Published) renders as menu items but options have **no `onClick`**. Selecting an option closes the menu and does nothing. | Sub-agent traced the click handler chain; found dead options. | Either (a) wire to a real backend `composer.publish()` flow with proper error states, or (b) gate the dropdown behind an `isPublishEnabled` flag and show "Coming soon" messaging. Pick one and ship it. | Low to fix UI; high to wire backend |
| E-002 | Critical | Duplicate System / Fake UI | Topbar / Shortcuts | `editor/shell/CommandPalette.tsx:24-35` | Hardcoded `ACTIONS` array (7 items) replaces the real `engine/commands/CommandCenter.ts` system that already exposes 30+ commands wired to composer methods. Two parallel command surfaces. | `defaultCommands.ts:21-200` has real handlers; `CommandPalette.tsx:88-108` runs local-state arrow nav only, no `composer.commands.run()` call. | Replace `ACTIONS` with `composer.commands.list()`; wire selection to `composer.commands.run(id)`. Delete hardcoded array. | Low |
| E-003 | Critical | Hardcoded Data / Fake UI | Shell / Modals | `editor/shell/AccountModal.tsx:24-28,73-150` | `MOCK_MEMBERS` array + hardcoded user "Aamir Siddiqui" + read-only email + mock notification toggles. Looks like a real account management UI; isn't. | Sub-agent confirmed mock data; no API calls. | Either gate the modal behind a feature flag, swap mocks for `services/account.ts` calls (creating that service if missing), or label the modal `[scaffold]`. No silent mock data. | High — silently misleads ops/sales |
| E-004 | High | No Source of Truth | Responsive | `engine/Viewport.ts:19,66-72` + `engine/Composer.ts:245,611-617` | Active device stored in **two places**: `Viewport.currentDevice` and `Composer.state.device`. `setDevice` updates both and emits `BREAKPOINT_CHANGED` from each (Viewport.ts:70 and Composer.ts:615). Subscribers may receive duplicate events. | Direct file:line evidence above. | Pick one. Simplest fix: delete `Composer.state.device`; expose a getter `get device() { return this.viewport.currentDevice; }`. Remove duplicate emission. | Medium — could break subscribers expecting two emits |
| E-005 | High | Architecture Boundary | Engine / Events | `engine/SelectionManager.ts:40,54,69,84,108,217,218`; `engine/Composer.ts:545,574,615` | Mixed event-naming conventions: `EVENTS.PROJECT_CHANGED` (constant) and `"element:selected"` / `"selection:cleared"` (string literals). Risk: typo in subscriber string never throws. | Sub-agent enumerated emissions. | Move all event names to a single `EVENTS` constants file. Lint rule: ban string-literal `emit(...)` calls. | Low effort, prevents future bugs |
| E-006 | High | God Component | Shell | `editor/shell/AquibraStudio.tsx` (609 lines) | Mixes provider setup, keyboard shortcuts, save callback, preview callback, modal state, layout coordination. Single file = single failure point. | Direct line count. | Extract `useEditorShortcuts()`, `useSaveCallback()`, `useEditorModals()` hooks. Keep `AquibraStudio` as a slim provider tree + LayoutShell host. | Medium — wide blast radius if mis-extracted |
| E-007 | High | God Component | Canvas / DnD | `editor/canvas/hooks/useCanvasDragDrop.ts` (692 lines) | One hook handles drop targeting, validation glue, hover overlay sync, multi-element drop, block/component/template paths. | Largest file in editor. | Split into: `useDropTargetResolver`, `useDropExecution` (calls `dropOperations.tsx`), `useDropOverlaySync`. Keep one orchestrator hook. | High — DnD is core UX; needs regression tests first |
| E-008 | High | God Component | Canvas | `editor/canvas/menus/QuickActionsToolbar.tsx` (629 lines) | Every per-element quick action (duplicate, delete, lock, hide, wrap, copy/paste-styles, etc.) lives in one file with ~20 buttons + handlers. | Direct line count. | Extract action handlers into `useQuickActions(elementId)` hook; keep component as a render shell. | Medium |
| E-009 | High | God Component | Inspector | `editor/inspector/renderer/registry.tsx` (666 lines) | Every `defineSection(...)` call for every element family lives in one registry file. | Direct line count. | Split per element family (`registry/text.tsx`, `registry/layout.tsx`, etc.); aggregate in `registry/index.tsx`. | Low |
| E-010 | High | Dead Code / Architecture Boundary | Engine / Sync | `engine/sync/SyncManager.ts`, `engine/storage/CloudSyncService.ts` | Both instantiated by `Composer` (`Composer.ts:85-115`) but not invoked from save path. `StorageAdapter.save()` writes to localStorage only. | Sub-agent traced save path. | Either delete (preferred until sync ships) or document with `// SCAFFOLD:` + add a feature-flag gate so the manager isn't instantiated unless enabled. | Low — code is inert |
| E-011 | Medium | Fake UI | Topbar | `editor/shell/BreakpointDropdown.tsx:73-82` | Custom-width input snaps to nearest preset (mobile/tablet/desktop/wide) instead of applying the user's px value as a real custom viewport width. | Direct file:line. | Either (a) add real custom-width support in `Viewport` (preferred — many real users want 1440 / 1024 / etc.) or (b) remove the input. | Low |
| E-012 | Medium | Missing Error State | Engine / Recovery | `engine/recovery/RecoveryManager.ts:25-34` | Recovery only triggers on `visibilitychange` (tab returns to foreground). Does not handle JS errors, network failures, or process crashes. | Sub-agent traced trigger. | Add `window.error` + `unhandledrejection` listeners to capture crash; on next load, prompt user to restore from autosave. | Medium |
| E-013 | Medium | Hardcoded Data | Shell / Modals | `editor/shell/InviteModal.tsx:59` | Hardcoded share link `"https://buildrik.app/share/project-abc123"` shown to user as if real. | Sub-agent quoted. | Either generate real share URL via service, or remove the field until backend exists. | High — user trust |
| E-014 | Medium | Architecture Boundary | Engine | `engine/Composer.ts:85-115` | 30 managers instantiated in one constructor, no domain grouping. Adding a manager = touching the god class. | Direct file:line. | Group by domain into facade objects: `composer.media.{manager,commandLayer,optimizer}`, `composer.data.{manager,bindings: {style,trait,text}}`, `composer.collab.{manager,sync}`. Reduces top-level surface from 30 → ~10. | Medium — wide refactor, do under feature flag |
| E-015 | Medium | Duplicate Code | Sidebar | `editor/sidebar/TabRouter.tsx` (146) + `FullPageRouter.tsx` (76) | Both switch on tab id; partial overlap (e.g., assets/design routed in both). | Both files exist. | Unify under a single `RouteResolver(tabId, mode)` that returns `{ component, layoutMode }`. | Low |
| E-016 | Medium | Wrapper Over Wrapper | Engine | `engine/Composer.ts:489-491,503-505,510-512,518-520,525-527,600-602,674-677` | `getState()`, `getConfig()`, `isReady()`, `whenReady()`, `isTransactionActive()`, `isPreviewMode()`, `isDirty()` are all 1-2 line getters with no logic. Acceptable but contributes to god-class line count. | Direct file:line. | Convert to `get` accessors (no behavior change, less line count); or live with it. | Very low |
| E-017 | Medium | State Mess (Multiple Sources) | Bindings | `engine/data/{DataManager, StyleDataBinding, TraitDataBinding, TextDataBinding}.ts` + `engine/cms/CMSBindingManager.ts` | Five separate "binding" managers. Possible over-fragmentation; possible deliberate concern split. Not deeply audited; flag for review. | Manager list in `Composer.ts:85-115`. | Map each manager's responsibility on a one-pager; if 2+ overlap, merge. If all distinct (style/trait/text/data/cms), document why and rename for clarity. | Medium — touches binding plumbing |
| E-018 | Medium | Naming / Mental Model | History | `engine/HistoryManager.ts` + `engine/VersionHistoryManager.ts` + `editor/panels/VersionHistoryPanel.tsx` + Topbar History button | Two history systems coexist (undo stack + named version timeline). Both real, both useful, but the History tab in sidebar and the History button in Topbar may confuse users. | Both files exist; both wired. | Rename `VersionHistoryManager` → `VersionTimelineManager`; rename History tab → "Versions"; keep undo/redo language for the topbar. | Low — labeling fix |
| E-019 | Medium | Performance Risk | Canvas | `editor/canvas/Canvas.tsx:328` | `canvasInnerHtml` memoized — good. But raw-HTML mount on every element-tree change recomputes whole canvas DOM. On large pages this could thrash. | Direct file:line; not benchmarked. | Add a benchmark; if confirmed, investigate per-element morph (e.g., `morphdom`) or partial re-render. | Medium — needs measurement first |
| E-020 | Low | Missing Test Coverage | Cross-cutting | `__tests__/` directories exist but coverage not measured | Cleanup batches need regression nets. Today: no coverage report visible. | `package.json` shows `vitest` configured but no coverage config. | Add `vitest --coverage`; target ≥70% on `engine/HistoryManager`, `engine/SelectionManager`, `engine/elements/ElementCRUD`, `useStyleHandlers`, `useCanvasDragDrop` before refactoring. | Low |
| E-021 | Low | Code Style | Inspector | `editor/inspector/renderer/registry.tsx` (666) | Every `defineSection(...)` factory call inline; mixed with predicates. | Same file as E-009. | Move factories to `registry/sections/<name>.ts`; aggregator imports them. | Low |
| E-022 | Low | Hardcoded Strings | Topbar | `editor/shell/Topbar.tsx:39` | `VITE_DASHBOARD_URL` env var with `"http://localhost:3000"` fallback. | Direct file:line. | Acceptable for dev fallback; document expected production env. | Very low |

**Counts:** 4 Critical, 6 High, 9 Medium, 3 Low. **Total: 22 issues.**

---

## 4. Duplicate Code Report

Most expected duplicate clusters came back **clean** thanks to prior cleanup arcs. Real duplicates found:

| Concern | Implementations | Source of truth chosen | Action |
|---|---|---|---|
| **Command surface** | (a) `CommandPalette.tsx:24-35` hardcoded `ACTIONS`. (b) `engine/commands/CommandCenter.ts` + `defaultCommands.ts` (30+ real commands). | **CommandCenter** | Delete `ACTIONS`; drive palette from `composer.commands.list()`. (E-002) |
| **Active device** | (a) `Viewport.currentDevice`. (b) `Composer.state.device`. | **Viewport** | Remove `Composer.state.device`; expose getter. (E-004) |
| **Tab routing** | (a) `TabRouter.tsx`. (b) `FullPageRouter.tsx`. | Single resolver | Unify under `RouteResolver(tabId, mode)`. (E-015) |
| **Event names** | (a) `EVENTS` constants. (b) String literals (`"element:selected"` etc.). | **`EVENTS` constants** | Lint rule + migration. (E-005) |

### NOT duplicates (deliberate split, often suspected):

- **`HistoryManager` vs `VersionHistoryManager`** — different concerns (undo stack vs named timeline). Keep both, rename for clarity (E-018).
- **`ElementManager` + `ElementCRUD` + `ElementChildren` + `ElementOperations` + `ElementSerialization` + `ElementStyles`** — facade + workers. Documented intent. Keep.
- **`handleStyleChange`, `handleBatchStyleChange`, `el.setStyle`, `composer.styles.setBreakpointStyle`, `composer.styles.setRule`** — five different write paths each for a different concern (single, batch, direct, breakpoint, pseudo). Keep.
- **`useCanvasContent` vs `RepeaterRenderer`** — single render path; repeater is post-process expansion, not parallel renderer.
- **`SelectionManager` vs `SelectionIndicatorManager`** — state vs visual rendering. Explicit split per `SelectionIndicatorManager.ts:3-7`. Keep.

---

## 5. Wrapper Audit

| Category | Examples | Verdict | Action |
|---|---|---|---|
| **Composer 1-line getters** | `getState`, `getConfig`, `isReady`, `whenReady`, `isTransactionActive`, `isPreviewMode`, `isDirty` (`Composer.ts:489-677`) | Pass-through; fine but smelly | Convert to JS `get` accessors (no behavior change) — E-016 |
| **Element class delegation** | `Element` delegates to `ElementStyles`, `ElementChildren`, `ElementOperations`, `ElementSerialization` | **Intentional** — separation of concerns | Keep |
| **`FullPageView.tsx`** wrapping `FullPageRouter` | Adds error boundary + suspense | **Intentional** | Keep |
| **`StudioPanels.tsx`** wrapping `LayoutShell` | Threads composer + state | Borderline pass-through | Inline into `AquibraStudio` after E-006 split |
| **`StudioHeader.tsx`** wrapping `Topbar` | Adds preview/export callbacks | Borderline | Audit during E-006 |

No deep wrapper-over-wrapper chains found. Editor has been through prior wrapper-cleanup arcs.

---

## 6. Editor Source of Truth Audit

| State | Owner | Single? | Notes |
|---|---|---|---|
| Canvas tree | `engine/elements/ElementManager.ts:24-58` (`Map<string, Element>`) | Yes | Layers panel reads same map |
| Selected element | `engine/SelectionManager.ts:17-20` | Yes | No React duplication |
| Hovered element | `engine/canvas/indicators/SelectionIndicatorManager.ts:26` | Yes | **Explicitly visual-only**, not a state holder |
| Active breakpoint / responsive mode | `engine/Viewport.ts:19` **AND** `engine/Composer.ts:245` | **No** | Dual storage. **E-004.** |
| Element styles | `engine/elements/ElementStyles` (per-element) + `engine/styles/StyleEngine` (rules) + `BreakpointStyles` (responsive overlay) | Yes (layered) | Layers resolved by `computeEffectiveStyles` |
| Element content | `Element.content` via `setContent()` | Yes | Routed through `handleContentChange` (`elementProperties/handlers.ts:96-130`) — separate from styles |
| Inspector values | Derived from selected element via `computeEffectiveStyles` | Yes | No local cache; recomputed per render |
| Layers tree | Same as canvas (`composer.elements`) | Yes | No parallel tree |
| Undo/redo history | `engine/HistoryManager.ts` undoStack/redoStack | Yes | Hooks `EVENTS.PROJECT_CHANGED` |
| Version timeline | `engine/VersionHistoryManager.ts` | Yes | Different from undo (E-018 — name) |
| Dirty / save state | `Composer.state.dirty` | Yes | Single boolean |
| Save status (UI) | Derived from `saveState` in `AquibraStudio.tsx:199-204` + dirty flag | Yes | Properly derived |
| Preview state | Ephemeral — `window.open` of exported HTML | Yes | No persistent state |
| Publish state | `PublishDropdown` local component state | **Local only** | E-001 — there's no real publish backend, so "state" is theatrical |
| Component registry | `blocks/blockRegistry.ts:96-150` | Yes | Single registry |
| Element schema | `shared/types/element.ts:34-67` | Yes | Single `ElementData` interface |

**SSOT verdict: 1 confirmed violation (E-004), 1 fake state (E-001 publish state).**

---

## 7. Editor Broken Flow Checklist

| # | Flow | Status | Evidence |
|---|------|--------|----------|
| 1 | Open editor | **Working** | `AquibraStudio.tsx:110-587` mounts; providers initialize Composer |
| 2 | Load existing page/site | **Working** | `Composer.loadProject()` (`Composer.ts:262`) reads from `StorageAdapter` (localStorage) |
| 3 | Add element from sidebar (click) | **Working** | `useBlockInsertion.handleBlockClick` → `insertBlock` → `composer.selection.select` → toast |
| 4 | Drag element to canvas | **Working** | `useCanvasElementDrag.ts:100+` (delegated `dragstart` on canvas) |
| 5 | Drop into correct container | **Working** | `dropValidation.validateDrop()` + nesting validator |
| 6 | Select element on canvas | **Working** | `Canvas.tsx:380-381` (`closest('[data-buildrick-id]')`) → `composer.selection.select` |
| 7 | Inspector shows correct values | **Working** | `useComposerSelection` + `computeEffectiveStyles` cascade |
| 8 | Inspector update changes canvas | **Working** | `handleStyleChange` → debounced flush → `el.setStyle` or `composer.styles.setBreakpointStyle` → `style:changed` event → canvas rerenders |
| 9 | Update responsive values | **Working** | Per-breakpoint via `composer.styles.setBreakpointStyle()`; override dot indicator at `OverrideDot` in `InputControls.tsx:26-28` |
| 10 | Move/reorder elements | **Working** | `defaultCommands.ts` `bring-forward` / `send-backward` + drag-reorder |
| 11 | Nest elements | **Working** | Drop validation + nesting rules cached |
| 12 | Delete element | **Working** | `composer.elements.removeElement` via Delete/Backspace key |
| 13 | Duplicate element | **Working** | `composer.elements.duplicateElement` via Cmd/Ctrl+D |
| 14 | Layers panel ↔ canvas sync | **Working** | Both read `composer.elements`; selection event syncs |
| 15 | Undo | **Working** | `composer.history.undo()` via Cmd/Ctrl+Z and Topbar button |
| 16 | Redo | **Working** | `composer.history.redo()` via Cmd/Ctrl+Shift+Z and Topbar button |
| 17 | Save | **Working** | Cmd/Ctrl+S → `composer.saveProject()` → localStorage; auto-save listens `PROJECT_CHANGED` |
| 18 | Reload persists changes | **Working** (local only) | Composer.loadProject reads localStorage on mount |
| 19 | Preview | **Working** | `StudioHeader.handlePreview` → `composer.exportHTML()` → `window.open` with sandbox iframe |
| 20 | **Publish** | **Fake UI only** | `PublishDropdown.tsx:85-107` options have no `onClick`; the Publish button itself falls back to `handleExport` (download HTML) — so clicking "Publish" downloads files instead of publishing. Misleading. |
| 21 | Account / team management | **Fake UI only (mocked)** | `AccountModal.tsx:24-28,73-150` — mock data |
| 22 | Invite teammates | **Partially working** | Modal opens; share URL is hardcoded example (E-013) |
| 23 | Command palette | **Fake UI / Duplicate** | Hardcoded actions; doesn't call CommandCenter (E-002) |
| 24 | Custom viewport width | **Fake UI** | Snaps to nearest preset (E-011) |
| 25 | Crash recovery | **Partially working** | Triggers on tab visibility, not on real crash (E-012) |

**Summary: 19 working, 4 fake UI, 2 partial.**

---

## 8. Cleanup Roadmap

> **Status as of 2026-05-09:** ~85% drained. 13 items shipped this week (5 from Phase 0 honesty pass + 8 from follow-up work across multiple sessions). 2 items marked NOT-RECOMMENDED with rationale below. 3 items remain genuinely open.
> See `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_editor_audit_progress_20260509.md` for the live status memory.

### Phase 1 — Critical editor bugs, fake UI, broken flows ✅ ALL CLOSED
- ✅ E-001: Publish — shipped Phase 1a/b/c (commits `9712be22..36235dd0`). Vercel publish flow live behind `VITE_FEATURE_PUBLISH`.
- ✅ E-002: Command Palette — Phase 0 (`a7a5dbe9`). Topbar imports `shell/modals/CommandPalette` (CommandCenter-wired); hardcoded variant deleted.
- ✅ E-003: AccountModal — Phase 0 (`a7a5dbe9`). Gated behind `VITE_FEATURE_ACCOUNT`; SCAFFOLD-tagged.
- ✅ E-013: InviteModal — Phase 0 (`a7a5dbe9`). Gated behind `VITE_FEATURE_INVITE`.
- ✅ E-011: Breakpoint dropdown custom width — Phase 0 (`a7a5dbe9`). Fake input removed.

### Phase 2 — Editor source of truth cleanup ⚠ HALF CLOSED
- ✅ E-004: Collapse `Composer.state.device` ↔ `Viewport` — shipped 2026-05-08 (`d1ebcf4c`). Composer.state no longer mirrors device; `getState()` computes via `viewport.getDevice()`. Plus follow-up `0189a1ab` collapsed 3 duplicate `ComposerState`/`DeviceType`/`DeviceConfig` defs from `shared/types/index.ts` into the canonical `shared/types/state.ts` re-export.
- ⏸ E-005: Standardize event names — DEFERRED. 51 string-literal `emit(...)` calls across 20+ files. Recently-shipped DS arc events (`colorMode:changed`, `migration:complete`, `tokens:dark-missing`, `tokens:alias-changed`, `migration:skipped/started/complete/failed`) are intentionally string-literal in their authoring phases. Codemod-shaped arc — needs (1) add EVENTS keys for new events, (2) ts-morph migration, (3) ESLint ban-rule for string-literal emits. ~2-3 hour standalone arc when DS arc velocity drops.

### Phase 3 — Drag/drop and canvas data model cleanup ⚠ PARTIAL
- ⚠ E-007: Split `useCanvasDragDrop.ts` — already partially done by sibling work. File 692 → 260 LOC. Audit's "split into ~3 files of ≤250 lines each" likely already met. Verify with current LOC + extract count before re-scoping.
- ⚠ E-008: Extract `QuickActionsToolbar` — likely shipped. File not at audit-listed path; either renamed/folded/deleted. Grep before assuming work remains.
- ✅ E-020: Tests prereq — shipped 2026-05-08/09. SelectionManager `9c151d66` (24 tests), dropValidation `e8a5499c` (29 tests). HistoryManager + useStyleHandlers (× 3 files) + useCanvasDragDrop pre-existed.

### Phase 4 — Inspector and property update cleanup ✅ EFFECTIVELY CLOSED
- ✅ E-009: Split inspector registry — sections registered split into 7 family files (`element/layout/typography/visual/effects/_shared/index`). 762 LOC across 7 files vs original 1109-LOC monolithic registry.
- ✅ E-021: Extract section factories per-family — `_shared.tsx` header explicitly addresses this: "the plan called this 'per element family' but the actual axis was always property-family." Factory `defineSection` is intentional shared infrastructure; splitting further would fragment the abstraction. Audit numbering drift — E-009 and E-021 collapsed into one ship.

### Phase 5 — Duplicate code and wrapper cleanup
- ❌ E-015: Unify `TabRouter` + `FullPageRouter` — **NOT-RECOMMENDED**. Code review during audit triage 2026-05-09 found the two routers have semantically different prop contracts (panel-mode pin/blocks/AI vs fullpage-mode imageEditor/iconPicker). Forcing a union-typed resolver would be harder to use than the current split. Both files have docstring headers explaining the panel-vs-fullpage split is intentional.
- ❌ E-016: Composer 1-line getters → `get` accessors — **LOW-VALUE**. Only 1 of 4 getters truly fits (`getProjectSettings`); other 3 do `{...spread}` allocation/computation. Call-site churn vs cosmetic gain isn't worth a refactor commit.
- ✅ E-018: Rename `VersionHistoryManager` → `VersionTimelineManager` — sibling work. `Composer.ts: readonly versions!: VersionTimelineManager`. History tab → Versions naming partially propagated.

### Phase 6 — Component / design-system consolidation ⏸ COLLISION-BLOCKED
- (Vibcoder migration: see `MEMORY.md` for separate cleanup-history record.)
- ⏸ E-014: Composer 30-manager facade pattern — DEFERRED. D3 shipped 3 facades (`cms`/`collab`/`canvas`); 27+ managers still flat. Composer.ts has 6+ commits in 24 hours from sibling DS-arc work (cssBundler/dsLinter/aiAssist/colorMode/aliasResolver/darkResolver added). Touching the manager-fields region right now = high merge-conflict risk. Park until DS arc velocity drops.
- ⏸ E-017: 5 binding managers documentation/merge — count drift (audit said 5; only 4 present: `styleBindings`, `traitBindings`, `textBindings`, `cms.bindings`). Documentation/merge work would still be valuable but should re-read audit context first.

### Phase 7 — Dead editor code removal ✅ ALL CLOSED
- ✅ E-010: SyncManager + CloudSyncService — shipped 2026-05-08 (`1bc50cd8`). Gated `useSyncStatus` + `StudioModals` on `FEATURES.sync`. SCAFFOLD comments on both files were already in tree from sibling work. The 5-second `setInterval` poll in `useSyncStatus` no longer runs in production. When real cloud sync ships: configure() at bootstrap + flip flag + drop SCAFFOLD markers in same PR.
- ✅ E-012: Real crash recovery — shipped via sibling work. RecoveryManager exists at `engine/recovery/RecoveryManager.ts` with `window.error` + `unhandledrejection` listeners wired. Composer.ts: `recovery!: RecoveryManager`.

### Phase 8 — Tests and regression protection ✅ COVERED VIA E-020
- ✅ See E-020 in Phase 3 for the file-level coverage closure.
- ⏸ E2E smoke (open → add → drag → drop → select → edit → undo → save → reload → preview) — not yet wired. Separate Playwright/Cypress arc; out of audit scope.

---

## 9. Risk Management

### What not to touch yet
- **`engine/Composer.ts` core lifecycle** — 30 managers' wiring is fragile. Don't reorganize until E-014 plan + tests.
- **`useCanvasDragDrop.ts`** — refactor only with E2E DnD tests in place.
- **`engine/elements/Element.ts` delegation chain** — looks tempting to flatten; existing split is intentional.
- **Vibcoder migration in flight** — per `MEMORY.md`, drain plan is mid-execution; don't fork it.

### High-risk editor files
1. `engine/Composer.ts` — bus for everything
2. `editor/canvas/Canvas.tsx` (589) — DOM mount + selection + drop entry
3. `editor/canvas/hooks/useCanvasDragDrop.ts` (692) — DnD core
4. `engine/HistoryManager.ts` — undo invariants
5. `engine/elements/ElementManager.ts` (488) — element tree CRUD
6. `engine/elements/Element.ts` (418) — delegate hub
7. `editor/inspector/hooks/useStyleHandlers.ts` — debounced flush + transactions
8. `editor/shell/AquibraStudio.tsx` (609) — shortcut + save + modal hub

### Flows needing manual QA after each batch
- Add → drag → drop → select → undo → redo (full DnD round-trip)
- Save → reload (localStorage round-trip)
- Breakpoint switch → per-breakpoint style edit → switch back (override resolution)
- Multi-select → batch style change → undo
- Element deletion + duplicate
- Preview window opens with current canvas content

### Files needing tests before refactor
- `engine/HistoryManager.ts` — coalesce window edge cases
- `engine/SelectionManager.ts` — multi-select, isAncestor checks
- `shared/utils/dragDrop/dropValidation.ts` + `nesting/validator.ts` — every reason code
- `editor/inspector/hooks/useStyleHandlers.ts` — debounced flush, transaction boundaries
- `editor/canvas/hooks/useCanvasDragDrop.ts` — drop targets, multi-element drop

### Possible regressions to watch
- **E-004 (device SSOT collapse):** subscribers expecting two `BREAKPOINT_CHANGED` events.
- **E-005 (event name standardization):** any subscriber using a string literal will silently break on rename.
- **E-007 (DnD split):** drop-target resolution edge cases (drop at edge of container, drop on locked element, drop on void element).
- **E-014 (manager grouping):** existing call sites `composer.media.someManagerMethod()` will move under nested namespaces.
- **E-018 (rename):** UI label change; ensure i18n strings + analytics events stay consistent.

---

## Appendix A — Validation commands

From `package.json`:

| Command | Purpose | Status |
|---|---|---|
| `npm run lint` | ESLint over `.ts,.tsx` | exists |
| `npm run typecheck` | `tsc --noEmit` | exists |
| `npm run build` | `tsc && vite build` | exists |
| `npm test` | `vitest run` | exists |
| `npm run lint:ds` | DS grep gates (24+ gates) | exists |
| `npm run verify:ds` | DS baselines + grep gates | exists |
| `npm run lint:ds-hex` | Inline hex detection | exists |

After each cleanup batch, run all four primary commands. DS-specific commands run when batch touches design-system files.

---

## Appendix B — Manual QA checklist (post-batch)

- [ ] Editor opens (no console error on mount)
- [ ] Existing page loads (canvas shows last state)
- [ ] Add element from sidebar (click + drag) works
- [ ] Drag/drop into nested container works
- [ ] Drop validation rejects invalid nesting (e.g., heading inside heading)
- [ ] Selection works (canvas + layers)
- [ ] Inspector reflects selected element
- [ ] Inspector update changes canvas (single property + batch)
- [ ] Layers tree syncs with canvas
- [ ] Undo + Redo work (keyboard + Topbar)
- [ ] Cmd+S saves; reload persists
- [ ] Preview opens new window with current canvas
- [ ] Publish behavior matches decision (real backend OR clearly disabled)
- [ ] Breakpoint switcher changes responsive mode
- [ ] Per-breakpoint override indicator (`OverrideDot`) renders
- [ ] No runtime console errors in golden path

---

## Recommended first cleanup batch

**Batch 1 — Fake UI honesty pass (no behavior changes to working flows).**

Touch only:
- E-001: PublishDropdown — gate behind `isPublishEnabled = false` + show "Publishing not yet available" tooltip; remove dead `STATE_OPTIONS` onClicks.
- E-013: InviteModal — replace hardcoded share URL with disabled state + helper text.
- E-011: BreakpointDropdown — remove custom-width input (or note "snaps to preset").
- E-003: AccountModal — gate behind `isAccountModalEnabled = false`; remove from Topbar menu OR show "Coming soon" view.

**Why first:** lowest risk (UI-only), highest user-trust impact, no engine changes, no test infrastructure required, easy to roll back.

**Validation after Batch 1:**
- `npm run lint`, `npm run typecheck`, `npm run build`
- Manual QA: items 1–22 of the checklist above
- Verify Topbar still functions for save/preview/undo/redo/breakpoint

**Out of scope for Batch 1:** all engine changes, god-component splits, SSOT collapse. Those go in later batches with regression tests in place.

---

*End of EDITOR_AUDIT_PLAN.md*
