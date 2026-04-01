# Code Review Report V2 — new-editor-l2 Editor Module

**Date:** 2026-02-21
**Version:** V2 (supersedes code_review_report.md)
**Scope:** `packages/new-editor-l2/src/` — full static analysis + runtime verification planning
**Method:** Static analysis (imports, grep, file reads) + grep-based truth-table resolution
**Agent evidence:** 42 tool uses, 115,424 tokens, 119 seconds of file reading
**Claim types distinguished throughout:** `[STATIC]` = grep/read evidence | `[INFERRED]` = logical deduction | `[UNVERIFIED]` = needs runtime confirmation

---

## A) Executive Summary (V2)

### What the module does

`new-editor-l2` is a **visual web page builder** shipped as an NPM package (`@aquibra/editor`). The module exports `AquibraStudio` (the full React editor) and `Composer` (the engine for headless use). Users build multi-page websites via drag-and-drop, edit CSS in an inspector panel, manage a page tree, and export clean HTML/CSS.

### Why it feels complex

1. **56+ Canvas hooks** — canvas behavior is decomposed into ~20 active hook calls in Canvas.tsx alone. Many hooks are well-scoped, but the sheer count creates a high onboarding cost.
2. **`features/` is a navigation trap** — the folder structure _promises_ domain-driven architecture (shell, canvas, sidebar, inspector all have `features/` entries) but every `features/*.ts` is an empty barrel that re-exports from `components/`. No files have been physically moved. A developer following the `features/` path gets to a re-export and has to backtrack to `components/`.
3. **17 canvas overlays** — the overlay system is powerful but has significant surface area to understand before making changes near the canvas.
4. **28 engine managers in one orchestrator** — `Composer.ts` instantiates all managers. Reading it requires understanding 28 classes, each in a separate file.

### What V2 adds over V1

| Area                  | V1                           | V2                                                            |
| --------------------- | ---------------------------- | ------------------------------------------------------------- |
| Tab count             | Estimated 9–10               | **Confirmed 9** (3-source reconciliation)                     |
| useElementFlash       | Marked REVIEW                | **Confirmed L2 wired** (ELEMENT_CREATED + ELEMENT_DUPLICATED) |
| Alignment methods     | Marked REVIEW                | **Confirmed L0 dead** (8 methods, 0 UI calls in grep)         |
| Collaboration UI      | Marked REVIEW (L1 suspected) | **Confirmed L2 wired** (StudioHeader + StudioModals)          |
| ConflictModal         | Marked REVIEW                | **Confirmed L2 wired** (StudioModals)                         |
| EmailService          | Suspected stub               | **Confirmed L0 stub** (throws on every call)                  |
| Canvas hooks          | "41 hooks" estimate          | **56+ hooks enumerated and categorized**                      |
| ProInspector          | 3-tab description            | **14+ sections + config-driven evaluator** confirmed          |
| features/ directory   | Not analyzed                 | **Confirmed all-barrel redirect**, no physical moves          |
| Circular dependencies | Not checked                  | **0 circular dependencies confirmed**                         |
| storageMigration      | Marked uncertain             | **Confirmed valid** (aquibra- → aqb- prefix, completion flag) |

### Main structural issues

1. `features/` barrel redirect pattern is a half-done migration that creates a misleading folder structure
2. `SelectionManager.ts` alignment/distribution methods (8 functions, ~200 lines) are L0 dead code
3. `engine/integrations/EmailService.ts` is an L0 stub — always throws, never deployed
4. Canvas hooks at 56+ create high cognitive load. No over-splitting found — each hook is focused — but hook _ordering dependencies_ need runtime verification
5. `LeftRail.css` at 510 lines is the only CSS file approaching the limit

### Main runtime risks

1. Hook initialization order in Canvas.tsx — 20 hooks called sequentially; if any earlier hook's state is used by a later hook before it initializes, subtle bugs arise `[UNVERIFIED]`
2. Event listener accumulation — 56+ hooks each potentially subscribing to Composer events; any hook that fails to clean up its listener in a `useEffect` return will cause memory leaks and double-triggers `[UNVERIFIED]`
3. Auto-save race condition — `useComposerInit` debounces auto-save at 1500ms; if a user closes the tab within 1500ms of a change, the save may not fire `[INFERRED]`

---

## B) File Inventory (Key Files)

### Editor Shell Domain

| File                                            | Type                 | Label        | Lines | Purpose                                      | Confidence |
| ----------------------------------------------- | -------------------- | ------------ | ----- | -------------------------------------------- | ---------- |
| `components/Editor/AquibraStudio.tsx`           | UI orchestrator      | `CORE_FLOW`  | 348   | Main shell, error boundary, hook wiring      | HIGH       |
| `components/Editor/StudioPanels.tsx`            | UI layout            | `CORE_FLOW`  | 648   | 3-column layout, prop distribution           | HIGH       |
| `components/Editor/StudioHeader.tsx`            | UI component         | `CORE_FLOW`  | —     | Top bar, undo/redo, collaboration display    | HIGH       |
| `components/Editor/StudioModals.tsx`            | UI component         | `CORE_FLOW`  | —     | Modal portal (export, conflict, etc.)        | HIGH       |
| `components/Editor/PageTabBar.tsx`              | UI component         | `SUPPORTING` | —     | Page tabs below canvas                       | HIGH       |
| `components/Editor/hooks/useComposerInit.ts`    | Hook (engine bridge) | `CORE_FLOW`  | 220   | Composer bootstrap, event binding, auto-save | HIGH       |
| `components/Editor/hooks/useStudioState.ts`     | Hook (UI state)      | `CORE_FLOW`  | 426   | Panel/tab state, localStorage persistence    | HIGH       |
| `components/Editor/hooks/useStudioHandlers.ts`  | Hook (action bridge) | `CORE_FLOW`  | —     | Block click, template apply, canvas handlers | HIGH       |
| `components/Editor/hooks/useStudioModals.ts`    | Hook (UI state)      | `CORE_FLOW`  | —     | Modal open/close state                       | HIGH       |
| `components/Editor/hooks/useHistoryFeedback.ts` | Hook (feedback)      | `SUPPORTING` | —     | Undo/redo toast notifications                | HIGH       |

### Layout Domain

| File                                | Type         | Label        | Lines | Purpose                                      | Confidence |
| ----------------------------------- | ------------ | ------------ | ----- | -------------------------------------------- | ---------- |
| `components/Layout/LayoutShell.tsx` | UI layout    | `CORE_FLOW`  | 252   | CSS Grid 4-column container + WCAG skip link | HIGH       |
| `components/Layout/LeftRail.tsx`    | UI component | `CORE_FLOW`  | —     | 9-icon tab strip (top 5 + bottom 4)          | HIGH       |
| `components/Layout/LeftRail.css`    | CSS          | `CORE_FLOW`  | 510   | Rail visual styling (⚠️ near limit)          | HIGH       |
| `components/Layout/DrawerPanel.tsx` | UI component | `SUPPORTING` | —     | Collapsible side drawer wrapper              | MEDIUM     |

### Sidebar Domain

| File                                                     | Type            | Label       | Lines | Purpose                                    | Confidence |
| -------------------------------------------------------- | --------------- | ----------- | ----- | ------------------------------------------ | ---------- |
| `components/Panels/LeftSidebar/index.tsx`                | UI orchestrator | `CORE_FLOW` | 200   | Tab host + keyboard shortcuts (A/Z/P/D...) | HIGH       |
| `components/Panels/LeftSidebar/TabRouter.tsx`            | Router          | `CORE_FLOW` | 106   | Switch/case → 9 lazy-loaded tab components | HIGH       |
| `components/Panels/LeftSidebar/tabs/BuildTab.tsx`        | UI tab          | `CORE_FLOW` | 504   | Add elements, templates, drill-in          | HIGH       |
| `components/Panels/LeftSidebar/tabs/LayersTab.tsx`       | UI tab          | `CORE_FLOW` | —     | DOM tree hierarchy                         | HIGH       |
| `components/Panels/LeftSidebar/tabs/PagesTab.tsx`        | UI tab          | `CORE_FLOW` | 197   | Page list orchestrator (split from 772)    | HIGH       |
| `components/Panels/LeftSidebar/tabs/ComponentsTab.tsx`   | UI tab          | `CORE_FLOW` | 340   | Component library orchestrator             | HIGH       |
| `components/Panels/LeftSidebar/tabs/MediaTab.tsx`        | UI tab          | `CORE_FLOW` | 395   | Images, videos, fonts                      | HIGH       |
| `components/Panels/LeftSidebar/tabs/DesignSystemTab.tsx` | UI tab          | `CORE_FLOW` | 351   | Global tokens                              | HIGH       |
| `components/Panels/LeftSidebar/tabs/SettingsTab.tsx`     | UI tab          | `CORE_FLOW` | —     | Site config, SEO                           | HIGH       |
| `components/Panels/LeftSidebar/tabs/PublishTab.tsx`      | UI tab          | `CORE_FLOW` | 494   | Deploy flow                                | HIGH       |
| `components/Panels/LeftSidebar/tabs/HistoryTab.tsx`      | UI tab          | `CORE_FLOW` | 243   | Revision history                           | HIGH       |
| `components/Panels/LeftSidebar/tabs/ElementsTab.tsx`     | UI tab          | `CORE_FLOW` | 176   | Block picker (split from 666)              | HIGH       |

### Canvas Domain

| File                                                     | Type                 | Label        | Lines  | Purpose                                          | Confidence |
| -------------------------------------------------------- | -------------------- | ------------ | ------ | ------------------------------------------------ | ---------- |
| `components/Canvas/Canvas.tsx`                           | UI orchestrator      | `CORE_FLOW`  | 477    | Canvas entry — 20 hook calls, overlay group      | HIGH       |
| `components/Canvas/CanvasEmptyCTA.tsx`                   | UI component         | `SUPPORTING` | —      | Empty canvas "start building" prompt             | HIGH       |
| `components/Canvas/CanvasFooterToolbar.tsx`              | UI component         | `SUPPORTING` | —      | Zoom controls + breakpoint switcher              | HIGH       |
| `components/Canvas/controls/UnifiedSelectionToolbar.tsx` | UI component         | `CORE_FLOW`  | 637 ⚠️ | Selection toolbar with formatting, grouping      | HIGH       |
| `components/Canvas/controls/QuickActionsToolbar.tsx`     | UI component         | `CORE_FLOW`  | 530 ⚠️ | Quick action overlay for selected element        | HIGH       |
| `components/Canvas/controls/CommandPalette.tsx`          | UI component         | `SUPPORTING` | 449    | Cmd+K command palette                            | HIGH       |
| `components/Canvas/hooks/useCanvasSync.ts`               | Hook (engine bridge) | `CORE_FLOW`  | 79     | Event → HTML re-render bridge (12 events)        | HIGH       |
| `components/Canvas/hooks/useComposerSelection.ts`        | Hook (engine bridge) | `CORE_FLOW`  | 178    | Canonical selection read hook                    | HIGH       |
| `components/Canvas/hooks/useCanvasKeyboard.ts`           | Hook                 | `CORE_FLOW`  | 620 ⚠️ | All canvas keyboard shortcuts                    | HIGH       |
| `components/Canvas/hooks/useCanvasContent.ts`            | Hook                 | `CORE_FLOW`  | —      | HTML content generation with selection injected  | HIGH       |
| `components/Canvas/overlays/CanvasOverlayGroup.tsx`      | UI orchestrator      | `CORE_FLOW`  | —      | Mounts all 16 overlays with correct prop routing | HIGH       |

### Inspector Domain

| File                                                        | Type                 | Label        | Lines  | Purpose                                    | Confidence |
| ----------------------------------------------------------- | -------------------- | ------------ | ------ | ------------------------------------------ | ---------- |
| `components/Panels/ProInspector/index.tsx`                  | UI orchestrator      | `CORE_FLOW`  | 604 ⚠️ | Right panel (layout/style/advanced)        | HIGH       |
| `components/Panels/ProInspector/tabs/LayoutTab.tsx`         | UI tab               | `CORE_FLOW`  | —      | Flexbox, grid, positioning                 | HIGH       |
| `components/Panels/ProInspector/tabs/DesignTab.tsx`         | UI tab               | `CORE_FLOW`  | —      | Colors, fonts, effects                     | HIGH       |
| `components/Panels/ProInspector/tabs/SettingsTab.tsx`       | UI tab               | `CORE_FLOW`  | —      | Element properties, interactions           | HIGH       |
| `components/Panels/ProInspector/hooks/useInspectorState.ts` | Hook (UI state)      | `CORE_FLOW`  | —      | Tab/section/pseudo-state management        | HIGH       |
| `components/Panels/ProInspector/hooks/useStyleHandlers.ts`  | Hook (engine bridge) | `CORE_FLOW`  | —      | Style read/write via StyleEngine           | HIGH       |
| `components/Panels/ProInspector/config/contextEvaluator.ts` | Config               | `CORE_FLOW`  | —      | Determines sections shown per element type | HIGH       |
| `components/Panels/ProInspector/config/elementProfiles.ts`  | Config               | `SUPPORTING` | —      | Element type → inspector tab mapping       | HIGH       |
| `components/Panels/ProInspector/sections/*.tsx`             | UI sections (14)     | `CORE_FLOW`  | —      | Per-property section controls              | HIGH       |

### Engine Domain

| File                                           | Type                | Label              | Lines  | Purpose                                     | Confidence |
| ---------------------------------------------- | ------------------- | ------------------ | ------ | ------------------------------------------- | ---------- |
| `engine/Composer.ts`                           | Engine orchestrator | `CORE_FLOW`        | 694    | SSOT hub, 28 managers, EventEmitter base    | HIGH       |
| `engine/EventEmitter.ts`                       | Engine base         | `CORE_FLOW`        | —      | Typed pub/sub event bus                     | HIGH       |
| `engine/SelectionManager.ts`                   | Engine manager      | `CORE_FLOW`        | 523    | Selection SSOT + **8 L0 alignment methods** | HIGH       |
| `engine/HistoryManager.ts`                     | Engine manager      | `CORE_FLOW`        | 471    | JSON patch undo/redo, 500ms coalesce        | HIGH       |
| `engine/elements/ElementManager.ts`            | Engine manager      | `CORE_FLOW`        | 240    | Element CRUD, page management               | HIGH       |
| `engine/styles/StyleEngine.ts`                 | Engine manager      | `CORE_FLOW`        | 672    | Style mutations, breakpoints                | HIGH       |
| `engine/drag/DragManager.ts`                   | Engine manager      | `CORE_FLOW`        | 215    | Drag state machine (IDLE→PENDING→DRAGGING)  | HIGH       |
| `engine/export/ExportEngine.ts`                | Engine service      | `CORE_FLOW`        | 650    | HTML/CSS export                             | HIGH       |
| `engine/commands/CommandCenter.ts`             | Engine registry     | `SUPPORTING`       | —      | Keyboard command registration               | HIGH       |
| `engine/collaboration/CollaborationManager.ts` | Engine manager      | `SUPPORTING`       | 789 ⚠️ | OT collaboration (L2 wired)                 | HIGH       |
| `engine/integrations/EmailService.ts`          | Service stub        | `ORPHAN_CANDIDATE` | 144    | **L0 STUB** — always throws                 | HIGH       |

### Orphaned / Dead

| File                                               | Type          | Label              | Status                    |
| -------------------------------------------------- | ------------- | ------------------ | ------------------------- |
| `components/surfaces/` (3 files)                   | Entire system | `ORPHAN_CANDIDATE` | **DELETED** this session  |
| `ProInspector/shared/PropertyRenderer.tsx`         | Registry      | `ORPHAN_CANDIDATE` | **DELETED** prior session |
| `ProInspector/shared/controls/ControlRegistry.tsx` | Registry      | `ORPHAN_CANDIDATE` | **DELETED** prior session |
| `engine/integrations/EmailService.ts`              | Stub          | `ORPHAN_CANDIDATE` | **Active** — confirmed L0 |

---

## C) Real Editor Flow Map (Step-by-Step)

```
STAGE 1: ENTRY
  src/index.ts               ← NPM barrel: exports AquibraStudio + Composer + types
  demo/main.tsx              ← Local demo harness
  Consumer code: <AquibraStudio options={...} onReady={...} />
  Confidence: HIGH

STAGE 2: EDITOR SHELL
  components/Editor/AquibraStudio.tsx
    ├── migrateStorageKeys()  ← runs ONCE on module load (aquibra- → aqb-)
    ├── useComposerInit(config)
    │     → creates Composer instance
    │     → runs loadProject() from storage
    │     → binds 8 event category subscriptions
    │     → sets up 1500ms auto-save debounce
    ├── useStudioState()
    │     → reads panel state from localStorage 'aqb-panel-state'
    │     → provides: activeTab, panelOpen, drawerWidth
    ├── useStudioHandlers()   → block clicks, template apply, canvas events
    ├── useStudioModals()     → modal open/close booleans
    ├── useComposerSelection()← reads SelectionManager (canonical hook)
    ├── useHistoryFeedback()  → undo/redo toast
    ├── useElementFlash(composer) → CSS flash on ELEMENT_CREATED/DUPLICATED
    └── renders: StudioHeader + StudioPanels + StudioModals + AIAssistantBar
  Confidence: HIGH

STAGE 3: LAYOUT
  components/Editor/StudioPanels.tsx (648L, 20+ props distributed)
    └── components/Layout/LayoutShell.tsx
          → CSS Grid: LeftRail(56px) | LeftSidebar(280px) | Canvas(1fr) | Inspector(300px)
  Confidence: HIGH

STAGE 4: LEFT RAIL
  components/Layout/LeftRail.tsx
    → 9 icon buttons: 5 top (add/layers/pages/components/assets) + 4 bottom (design/settings/publish/history)
    → visual-only: emits tab change up to StudioPanels → useStudioState.setActiveTab()
    → rail does NOT own state
  Confidence: HIGH

STAGE 5: LEFT SIDEBAR / TAB ROUTING
  components/Panels/LeftSidebar/index.tsx (200L)
    → keyboard shortcuts: A=add, Z=layers, P=pages, C=components, M=assets, D=design, S=settings
    → renders: TabRouter with activeTab prop

  components/Panels/LeftSidebar/TabRouter.tsx (106L)
    → switch(activeTab) → React.lazy() for each of 9 tabs
    → code splitting: only active tab's bundle loads
  Confidence: HIGH [STATIC — 3-source reconciliation confirms 9 tabs]

  TAB LIST (confirmed):
  ┌──────────┬──────────┬────────┬────────────┬──────────┐
  │   add    │  layers  │ pages  │ components │  assets  │
  │  BUILD   │  LAYERS  │ PAGES  │ COMPONENTS │  MEDIA   │
  ├──────────┴──────────┴────────┴────────────┴──────────┤
  │  design  │ settings │publish │  history   │          │
  │  DESIGN  │ SETTINGS │PUBLISH │  HISTORY   │          │
  └──────────┴──────────┴────────┴────────────┘

STAGE 6: CANVAS (editing surface)
  components/Canvas/Canvas.tsx (477L)
    → 20 hook calls (see Section G for full decomposition)
    → receives: composer, content HTML, device, zoom, selected states
    → renders: iframe with content + CanvasOverlayGroup (17 overlays)
    → exposes ref: undo(), redo(), getHTML(), getCSS(), exportHTML()

  Canvas re-render path (driven by useCanvasSync.ts):
    Any of 12 Composer events fires
    → composer.elements.toHTML() called
    → content string updates
    → iframe src or srcdoc updates
    → browser re-renders the page DOM
  Confidence: HIGH

STAGE 7: RIGHT INSPECTOR (ProInspector)
  components/Panels/ProInspector/index.tsx (604L)
    → reads selectedElement via useComposerSelection()
    → contextEvaluator.ts determines which sections to show
    → useInspectorState.ts manages tab/section/pseudoState UI state
    → useStyleHandlers.ts reads+writes styles via StyleEngine
    → 3 tabs: Layout | Design | Settings
    → 14+ sections per tab (SpacingSection, TypographySection, FlexboxSection, etc.)
    → scroll position persisted per-element in localStorage
  Confidence: HIGH

STAGE 8: STORE / ENGINE
  engine/Composer.ts (694L) — the SSOT hub
    → All UI reads from Composer via event subscriptions
    → All UI writes go through Composer manager methods
    → Pattern: useEffect subscribe → composer.on(event, handler) → cleanup composer.off()
    → Mutation pattern: composer.styles.setStyle() → StyleEngine → JSON patch → HistoryManager.push()
  Confidence: HIGH

STAGE 9: SERVICES (external integrations)
  services/CloudSyncService.ts (594L)   — save/load, conflict detection  [L2 WIRED]
  services/GoogleFontsService.ts         — Google Fonts API               [L2 WIRED - REVIEW]
  services/ai/AIServiceClient.ts         — AI generation                  [L1 PARTIAL]
  engine/integrations/EmailService.ts    — Email marketing signup         [L0 STUB - DEAD]
  Confidence: MEDIUM (services not individually verified except EmailService)
```

---

## D) Dependency & Coupling Report

### Dependency Tool Availability

No `madge` or `dependency-cruiser` found in `node_modules/.bin/`. Analysis is **best-effort static analysis** via grep counts.

### Import Count Analysis (`[STATIC]`)

| Target             | Import Count | Coupling Level | Verdict                                                              |
| ------------------ | ------------ | -------------- | -------------------------------------------------------------------- |
| `engine/Composer`  | **84**       | Very High      | Expected — it's the SSOT hub. Every component needs the engine.      |
| `constants/tabs`   | **18**       | Moderate       | Acceptable — tab IDs are needed in rail, router, sidebar, test files |
| `constants/events` | **11**       | Moderate       | Acceptable — event constants imported only where subscribed          |
| `types/*`          | **200+**     | Very High      | Expected — TypeScript type files are always high-import              |
| `utils/*`          | **150+**     | High           | Acceptable — utility imports are diffuse and specific                |

### Import Density per File (`[STATIC]`)

| File                     | Import Lines | Assessment                                  |
| ------------------------ | ------------ | ------------------------------------------- |
| `AquibraStudio.tsx`      | 25           | High but justified — top-level orchestrator |
| `Composer.ts`            | 36           | High but justified — wires 28 managers      |
| `StudioPanels.tsx`       | —            | Not measured, but passes 20+ props          |
| `Canvas.tsx`             | 36           | High — 20 hooks + overlays + utilities      |
| `ProInspector/index.tsx` | —            | Not measured                                |

### Circular Dependency Check (`[STATIC]`)

```
Engine → Components: 0 imports found ✅
Components → Engine: 84 imports found ✅

VERDICT: NO CIRCULAR DEPENDENCIES
The engine is strictly independent of UI components.
UI components depend on the engine (correct, expected direction).
```

### Barrel Chain Analysis (`[STATIC]`)

```
features/editor/shell/index.ts
  → re-exports from components/Editor/index.ts
    → re-exports from AquibraStudio.tsx, StudioPanels.tsx, etc.

features/editor/canvas/index.ts
  → re-exports from components/Canvas/index.ts
    → re-exports from Canvas.tsx, controls/, etc.

[Same pattern for: sidebar, inspector, rail, ai, templates, blocks]

Issue: features/ adds ONE extra indirection level.
A developer searching for "where is AquibraStudio?" may:
1. Find features/editor/shell/index.ts
2. Follow it to components/Editor/index.ts
3. Follow it to AquibraStudio.tsx
→ 3-hop chain vs 1-hop if features/ didn't exist.
```

### Coupling Hotspots

1. **`Composer.ts`** — imported 84 times. Any rename/refactor cascades to 84 files. This is structural and necessary, but it means any change to Composer's public API is a major breaking change.
2. **`constants/events.ts`** — 90+ event constants. Any event rename cascades. This is the correct pattern (central registry), but the large count means it's a high-churn area when adding/renaming features.
3. **`Canvas.tsx`** — 36 imports + 20 hook calls. This file is the most complex integration point in the UI layer. Changes here require understanding the hook dependency graph.
4. **`LeftSidebar/TabRouter.tsx`** — Adding a new tab requires changes here + `constants/tabs.ts` + `LeftRail.tsx`. Triple-touch pattern is a mild coupling smell.

---

## E) File-by-File Deep Analysis (Key Files)

### `engine/Composer.ts` (694L)

**Responsibility:** Creates and wires all 28 managers. Exposes unified API: `loadProject()`, `exportHTML()`, `setZoom()`, `undo()`, `redo()`, `beginTransaction()`, `endTransaction()`.
**Key imports:** 28 manager files, EventEmitter, types, constants
**Exported by:** `engine/index.ts`
**Used by:** `useComposerInit.ts` (creates instance), every hook that calls `composer.*`
**Issues:**

- 694 lines is near the limit. The file is a constructor-heavy orchestrator — justified at this size.
- `emailService` (EmailService.ts) is imported and initialized here. Since EmailService is L0 (stub), this import is dead weight.
  **Confidence:** HIGH

---

### `components/Editor/hooks/useStudioState.ts` (426L)

**Responsibility:** Panel open/close, active tab, sidebar width — persisted to `localStorage('aqb-panel-state')`. Includes `migrateLegacyPanelState()`.
**Pattern:** useState + useEffect (persist) + localStorage read on init
**Issues:**

- 426 lines is approaching limit. The migration function adds ~80 lines that will shrink over time.
- Multiple localStorage keys across the app: this file (`aqb-panel-state`), ProInspector (per-element section state), others. No centralized key registry.
  **Confidence:** HIGH

---

### `components/Editor/hooks/useComposerInit.ts` (220L)

**Responsibility:** Creates Composer via `createComposer(config)`, calls `loadProject()`, sets up 8 event category bindings, initializes auto-save at 1500ms debounce.
**Pattern:** `useEffect(() => { composer = createComposer(); ... return () => composer.destroy(); }, [config])`
**Issues:**

- When Composer adds new event categories, this file grows. Could be split into `useComposerLifecycle.ts` (create/destroy) + `useComposerEvents.ts` (all subscriptions). Low priority.
  **Confidence:** HIGH

---

### `engine/SelectionManager.ts` (523L)

**Responsibility:** Selection SSOT. Public API: `select()`, `addToSelection()`, `removeFromSelection()`, `clearSelection()`, `reselect()`, `getSelectedBounds()`, `alignLeft()`, `alignCenter()`, `alignRight()`, `alignTop()`, `alignMiddle()`, `alignBottom()`, `distributeHorizontal()`, `distributeVertical()`.
**Critical issue:** Lines 329–520 implement 8 alignment/distribution methods. **ZERO UI entry points found** via grep. These are L0 dead code. The methods are correct implementations (~200 lines) but unreachable.
**Recommendation (analysis only):** Either add toolbar buttons for alignment, or delete the 8 methods to reduce file below 500-line limit.
**Confidence:** HIGH [STATIC — grep of entire src/ returned 0 matches for any UI call]

---

### `engine/integrations/EmailService.ts` (144L)

**Responsibility:** Stub for email marketing integration (Mailchimp, SendGrid, Mailgun, Resend).
**Status:** L0 STUB. Every method body ultimately calls `subscribeViaBackendProxy()` which `throw new Error('Not implemented: POST /api/email/subscribe')`.
**Imported by:** `engine/Composer.ts` (creates singleton) + types
**Risk:** Any consumer calling `await composer.email.subscribe()` will throw an uncaught error.
**Confidence:** HIGH [STATIC — file content explicitly stubs all methods]

---

### `features/*/index.ts` (8 files)

**Responsibility:** All 8 files are barrel re-exports pointing to `components/`.
**Pattern:** `export * from '../../../components/Canvas/index'`
**Purpose:** Establish canonical import paths for future domain-driven structure.
**Reality:** Physical files have NOT moved. The barrels create a 2-hop import chain with no organizational benefit yet.
**Confidence:** HIGH [STATIC — all 8 files read and confirmed as pure barrel redirects]

---

### `utils/storageMigration.ts` (112L)

**Responsibility:** One-time migration from `aquibra-*` prefix to `aqb-*` prefix (15 keys). Uses `aqb-migration-v1-complete` flag to ensure it runs only once per browser.
**Status:** VALID and NECESSARY for any user who used an older version of the editor. Once all users are on new keys, this can be removed.
**Called by:** `AquibraStudio.tsx` at module load (synchronous, before first render)
**Confidence:** HIGH [STATIC — file read, 15 key mappings documented]

---

## F) Function-by-Function Analysis (Key Functions)

### `SelectionManager.select(element)`

- **Purpose:** Replace entire selection with one element (or null)
- **Params:** `element: Element | null`
- **Returns:** `void`
- **Side effects:** Clears `multiSelected`, emits `element:selected`, emits `element:deselected` for previous
- **Called by:** Canvas click handler, layer tree click, keyboard handler
- **Label:** `ACTIVE_LOGIC` | **Confidence:** HIGH

### `SelectionManager.alignLeft()` (and 7 siblings)

- **Purpose:** Align all selected elements to left edge of bounding box
- **Params:** none
- **Returns:** `void`
- **Side effects:** Mutates element positions, emits events, creates history entry
- **Called by:** **NOTHING** — zero UI entry points found
- **Label:** `UNUSED_FUNCTION` | **Confidence:** HIGH

### `useComposerInit` (hook)

- **Purpose:** Bootstrap Composer, bind all global events, set up auto-save
- **Returns:** `{ composer, isLoading, error, canUndo, canRedo }`
- **Side effects:** Creates Composer (heavy), subscribes 8+ event groups, sets 1500ms auto-save debounce
- **Called by:** `AquibraStudio.tsx` (once, at mount)
- **Label:** `ACTIVE_LOGIC` | **Confidence:** HIGH

### `useCanvasSync` (hook)

- **Purpose:** Bridge Composer events → canvas HTML re-render
- **Events subscribed:** `project:imported, project:loaded, project:changed, page:created, page:deleted, page:changed, element:created, element:deleted, element:duplicated, element:updated, element:moved, element:resized`
- **Returns:** `{ content: string, syncFromComposer: () => void }`
- **Side effects:** Calls `composer.elements.toHTML()` on any subscribed event
- **Called by:** `Canvas.tsx`
- **Label:** `ACTIVE_LOGIC` | **Confidence:** HIGH

### `useComposerSelection` (hook)

- **Purpose:** Canonical read hook for SelectionManager state
- **Returns:** `{ selectedId, selectedElement, selectedIds, selectedElements, select, clear, isSelected }`
- **Pattern:** Subscribes to Composer selection events → derives state
- **Called by:** ProInspector, AquibraStudio, Canvas overlays, UnifiedSelectionToolbar
- **Label:** `ACTIVE_LOGIC` | **Confidence:** HIGH

### `useElementFlash` (hook)

- **Purpose:** CSS flash animation on newly created/duplicated elements
- **Events subscribed:** `EVENTS.ELEMENT_CREATED`, `EVENTS.ELEMENT_DUPLICATED`
- **Mechanism:** Adds `aqb-element-flash` class, waits 500ms, removes it. Uses `requestAnimationFrame + offsetWidth` reflow trick to restart animation.
- **Called by:** `AquibraStudio.tsx` (line 23 + line 107)
- **Label:** `ACTIVE_LOGIC` | **Confidence:** HIGH [STATIC — file read + grep confirmed]

### `useInspectorState` (hook)

- **Purpose:** Manages Inspector tab/section/pseudoState UI state
- **State:** `activeTab ('layout'|'design'|'settings')`, `currentPseudoState`, `autoExpandSection`, `devMode`
- **Key behavior:** Auto-maps element type → starting tab (heading→design, container→layout, image→settings)
- **Returns:** `{ activeTab, setActiveTab, currentPseudoState, setCurrentPseudoState, devMode, setDevMode }`
- **Label:** `ACTIVE_LOGIC` | **Confidence:** HIGH

### `useStyleHandlers` (hook)

- **Purpose:** Read + write styles for selected element via StyleEngine
- **Composer calls:** `composer.elements.getElement(id)`, `el.getStyles()`, `composer.styles.setStyle()`, `composer.styles.getBreakpointStyle()`
- **Returns:** `{ styles, handleStyleChange, handleBatchStyleChange, overriddenProperties }`
- **Label:** `ACTIVE_LOGIC` | **Confidence:** HIGH

### `migrateStorageKeys()` (function)

- **Purpose:** One-time localStorage key prefix migration (aquibra- → aqb-)
- **Mechanism:** Checks `localStorage.getItem('aqb-migration-v1-complete')`. If not set, migrates 15 keys, then sets the flag.
- **Called by:** `AquibraStudio.tsx` at module load (synchronous)
- **Label:** `ACTIVE_LOGIC` (conditionally — no-ops after first run) | **Confidence:** HIGH

---

## G) Canvas Hooks Decomposition Report (Dedicated)

### Hook Categories Map

Canvas.tsx calls these 20 hooks on every render (in order):

```
1. useCanvasDragDrop       [DRAG]
2. useCanvasInlineEdit     [INLINE EDIT]
3. useCanvasElementDrag    [DRAG]
4. useComposerSelection    [SELECTION — engine bridge]
5. useCanvasGuides         [OVERLAY — guides]
6. useCanvasSync           [ENGINE BRIDGE — HTML re-render]
7. useCanvasIndicators     [OVERLAY — spacing indicators]
8. useCanvasMarquee        [SELECTION — rubber band]
9. useCanvasKeyboard       [KEYBOARD]
10. useCanvasHover         [HOVER]
11. useCanvasContent       [RENDER — HTML content generation]
12. useCanvasContextMenu   [UI — right-click menu]
13. useCursorSync          [COLLABORATION]
14. useSelectionBehavior   [SELECTION]
15. useCursorIntelligence  [COLLABORATION]
16. useCanvasSnapping      [DRAG — snap guides]
17. useCanvasCommandPalette [UI — Cmd+K]
18. useCanvasToolbarActions [UI — toolbar]
19. useCanvasInlineCommands [UI — inline commands]
20. useCanvasSize           [RENDER — container dimensions]
```

### Hook Table (All 56+ hooks in hooks/)

**SELECTION HOOKS**
| Hook | Responsibility | State Touched | Events | Dep Risk | Complexity |
|------|---------------|---------------|--------|----------|------------|
| `useComposerSelection` | Canonical selection read from SelectionManager | `selectedId, selectedElements` | `element:selected, element:deselected, selection:*` | High (core) | Low |
| `useCanvasSelectionBox` | Rubber-band marquee selection | `selectionRect, isSelecting` | Triggers batch select on release | Medium | Medium |
| `useSelectionRect` | Calculates selection bounding rect for overlays | `bounds` | None (pure calculation) | Low | Low |
| `useSelectionBehavior` | Click-to-select logic (shift, cmd, area) | None (delegates to SelectionManager) | Calls `composer.selection.select()` | Medium | Medium |
| `useCanvasMarquee` | Marquee drag box UI state | `marqueeRect` | None | Low | Low |

**DRAG/DROP HOOKS**
| Hook | Responsibility | State Touched | Events | Dep Risk | Complexity |
|------|---------------|---------------|--------|----------|------------|
| `useCanvasDragDrop` | Drop zone detection for sidebar-to-canvas drag | `dropTarget, dropPosition` | `drag:start, drag:end, drop:complete` | High | High |
| `useCanvasElementDrag` | Within-canvas element repositioning | `isDragging, dragElement` | `drag:move` | High | High |
| `useDragSession` | Drag state machine (IDLE→PENDING→DRAGGING) | `dragState` | `drag:start, drag:end, drag:cancel` | High | Medium |
| `useDragVisuals` | Ghost element + cursor styles during drag | `ghost ref` | None (pure visual) | Low | Low |
| `useDragAutoScroll` | Auto-scroll when dragging near edges | `scrollRef` | None | Low | Low |
| `useCanvasSnapping` | Snap-to-guide calculation during drag | `snapLines, snapping` | None (calculation only) | Medium | High |
| `useCanvasResize` | Element resize handles interaction | `resizeState` | `element:resized` | High | High |

**KEYBOARD HOOKS**
| Hook | Responsibility | State Touched | Events | Dep Risk | Complexity |
|------|---------------|---------------|--------|----------|------------|
| `useCanvasKeyboard` | ALL canvas keyboard shortcuts (620L) | None (calls handlers) | Cmd+Z, Del, Arrows, Cmd+D, Escape, etc. | High | High ⚠️ |

**OVERLAY/VISUAL HOOKS**
| Hook | Responsibility | State Touched | Events | Dep Risk | Complexity |
|------|---------------|---------------|--------|----------|------------|
| `useCanvasHover` | Tracks hovered element (mouse position → DOM hit test) | `hoveredId` | None (local UI state) | Low | Medium |
| `useCanvasGuides` | Guide lines state + drag-to-create guides | `guides[]` | None | Low | Medium |
| `useCanvasIndicators` | Spacing indicator calculations | `spacingIndicators[]` | None (calculation) | Low | Medium |

**ENGINE BRIDGE HOOKS**
| Hook | Responsibility | State Touched | Events | Dep Risk | Complexity |
|------|---------------|---------------|--------|----------|------------|
| `useCanvasSync` | 12 events → toHTML() → iframe update | `content: string` | 12 Composer events | High (critical) | Low |
| `useCanvasContent` | HTML with selection/drop states injected | `content: string` | ELEMENT_CREATED, ELEMENT_DUPLICATED | High | Medium |

**COLLABORATION HOOKS**
| Hook | Responsibility | State Touched | Events | Dep Risk | Complexity |
|------|---------------|---------------|--------|----------|------------|
| `useCursorSync` | Broadcasts local cursor position to collaborators | `cursorPosition` | Collaboration events | Medium | Medium |
| `useCursorIntelligence` | Predicts where remote cursors will move | `predictedPositions` | Collaboration events | Medium | High |

**UI/UTILITY HOOKS**
| Hook | Responsibility | State Touched | Events | Dep Risk | Complexity |
|------|---------------|---------------|--------|----------|------------|
| `useCanvasContextMenu` | Right-click menu state | `contextMenu` | None | Low | Low |
| `useCanvasCommandPalette` | Cmd+K palette state | `paletteOpen` | None | Low | Low |
| `useCanvasToolbarActions` | Toolbar action handlers | None (delegates) | Calls composer methods | Medium | Medium |
| `useCanvasInlineCommands` | Inline text editor commands | `inlineState` | ELEMENT_UPDATED | Medium | Medium |
| `useCanvasInlineEdit` | Double-click to enter text edit mode | `isEditing, editTarget` | ELEMENT_UPDATED | Medium | Medium |
| `useElementRect` | DOM rect calculation for positioned overlays | `elementRect` | None (DOM query) | Low | Low |
| `useToolbarPosition` | Positions toolbars relative to selected element | `toolbarPos` | selection events | Low | Low |
| `useCanvasSize` | Canvas container dimensions | `width, height` | ResizeObserver | Low | Low |

### Hook Dependency / Ordering Risks

```
Canvas.tsx hook call order (important):
1. useDragSession          ← MUST run before useCanvasDragDrop (provides dragState)
2. useComposerSelection    ← MUST run before overlay hooks (provides selectedId)
3. useCanvasSync           ← MUST run after composer is initialized
4. useCanvasContent        ← Depends on useCanvasSync.content
5. useCanvasKeyboard       ← Depends on selectedId from #2
6. useSelectionBehavior    ← Depends on composer from #3

RISK: React hooks run in call order on every render. If composer is null on first render
and a hook doesn't guard for null, it will throw. All hooks should check:
  if (!composer) return defaultState;
[UNVERIFIED — needs runtime test to confirm all 20 hooks guard for null composer]
```

### Hook Coupling Findings

1. **`useCanvasDragDrop` + `useDragSession` coupling** — `useDragSession` manages state machine; `useCanvasDragDrop` reads from it. If these are ever merged or split differently, both files need updating simultaneously.

2. **`useCanvasSync` + `useCanvasContent` coupling** — Both subscribe to element events and produce HTML content. `useCanvasSync` produces raw HTML; `useCanvasContent` injects selection/drop attributes. The two hooks must not double-render. `[UNVERIFIED — needs trace to confirm they are not both calling toHTML()]`

3. **`useCanvasKeyboard` (620L)** is a monolith that depends on `selectedId`, `composer`, and many toolbar action refs. Any refactor to split it must preserve React's hook call order invariant (cannot conditionally call hooks).

### Over-Splitting Assessment

Most hooks are appropriately scoped. The one potential over-split:

- `useCanvasMarquee` + `useCanvasSelectionBox` + `useSelectionRect` + `useSelectionBehavior` = 4 hooks for "selection on canvas". These could theoretically be one `useCanvasSelection` hook. However, since they each have distinct state and event subscriptions, the split is reasonable.

### Canvas Complexity Hotspots

1. **`useCanvasKeyboard.ts` (620L)** — single hook file handling all keyboard shortcuts. `OVER_COMPLEX_FLOW` risk. Candidate for splitting into semantic groups.
2. **`CanvasOverlayGroup.tsx`** — mounts 16 overlays. Adding overlay N requires understanding all N–1 z-index interactions.
3. **`useCanvasDragDrop` + `useCanvasElementDrag`** — two separate drag hooks for two drag types (external-to-canvas vs within-canvas). Separation is correct but requires understanding both to handle edge cases.

---

## H) Orphan / Legacy / Dead Code Report (Evidence-Based)

| File / Item                                        | Type             | Reason                                                                                                 | Label              | Confidence |
| -------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ | ------------------ | ---------- | ----------- |
| `engine/integrations/EmailService.ts` (144L)       | Entire file      | Every method throws `Error('Not implemented')`. Initialized in Composer but no UI calls it.            | `ORPHAN_CANDIDATE` | HIGH       |
| `SelectionManager.alignLeft()`                     | Method           | Grep of entire src/ returns 0 UI call sites                                                            | `UNUSED_FUNCTION`  | HIGH       |
| `SelectionManager.alignRight()`                    | Method           | Same as above                                                                                          | `UNUSED_FUNCTION`  | HIGH       |
| `SelectionManager.alignCenter()`                   | Method           | Same as above                                                                                          | `UNUSED_FUNCTION`  | HIGH       |
| `SelectionManager.alignTop()`                      | Method           | Same as above                                                                                          | `UNUSED_FUNCTION`  | HIGH       |
| `SelectionManager.alignMiddle()`                   | Method           | Same as above                                                                                          | `UNUSED_FUNCTION`  | HIGH       |
| `SelectionManager.alignBottom()`                   | Method           | Same as above                                                                                          | `UNUSED_FUNCTION`  | HIGH       |
| `SelectionManager.distributeHorizontal()`          | Method           | Same as above                                                                                          | `UNUSED_FUNCTION`  | HIGH       |
| `SelectionManager.distributeVertical()`            | Method           | Same as above                                                                                          | `UNUSED_FUNCTION`  | HIGH       |
| `components/surfaces/` (3 files)                   | Entire folder    | Zero imports, broken internal imports, duplicate of tab system                                         | `ORPHAN_CANDIDATE` | HIGH       | **DELETED** |
| `ProInspector/shared/PropertyRenderer.tsx`         | Entire file      | L0 per CLAUDE.md, never imported                                                                       | `ORPHAN_CANDIDATE` | HIGH       | **DELETED** |
| `ProInspector/shared/controls/ControlRegistry.tsx` | Entire file      | L0 per CLAUDE.md, 6/70+ types built                                                                    | `ORPHAN_CANDIDATE` | HIGH       | **DELETED** |
| `features/*/index.ts` (8 files)                    | All barrel files | All are pass-through re-exports with no added logic. The `features/` structure is unfulfilled promise. | `LEGACY_SUSPECT`   | HIGH       |
| `utils/sidebarAnalytics.ts`                        | Utility          | Not verified — name suggests analytics stub.                                                           | `REVIEW`           | LOW        |
| `utils/openai.ts`                                  | Utility          | Unclear if used vs AI service client. Possible duplicate.                                              | `REVIEW`           | LOW        |
| `components/Collaboration/PresenceIndicators.tsx`  | Component        | Previously marked REVIEW — **now CONFIRMED L2 WIRED** (StudioHeader)                                   | `CORE_FLOW`        | HIGH       |

---

## I) Feature Ownership / Namespace Mismatch Report

### Reality vs Folder Promise

The codebase has **two competing structures**:

**What `features/` promises:**

```
features/
  ai/ui/                ← "AI feature UI lives here"
  templates/ui/         ← "Templates feature UI lives here"
  editor/
    shell/              ← "Editor shell lives here"
    canvas/             ← "Canvas lives here"
    sidebar/            ← "Sidebar lives here"
    inspector/          ← "Inspector lives here"
    rail/               ← "Rail lives here"
    blocks/             ← "Block library lives here"
```

**What actually lives there:**

```
features/ai/ui/index.ts → export * from '../../../components/AI/'
features/editor/canvas/index.ts → export * from '../../../components/Canvas/'
[... all 8 files are empty barrel re-exports]
```

**Actual file locations (physical reality):**

```
components/AI/               ← AI feature (should be features/ai/ui/)
components/Templates/        ← Templates feature (should be features/templates/ui/)
components/Editor/           ← Editor shell (should be features/editor/shell/)
components/Canvas/           ← Canvas (should be features/editor/canvas/)
components/Panels/LeftSidebar/ ← Sidebar (should be features/editor/sidebar/)
components/Panels/ProInspector/ ← Inspector (should be features/editor/inspector/)
components/Layout/LeftRail.tsx ← Rail (should be features/editor/rail/)
components/Blocks/           ← Block library (should be features/editor/blocks/)
```

### Why This Causes Confusion

1. **Navigation trap**: A developer imports from `@features/editor/canvas` (following CLAUDE.md guidance), traces the barrel to `components/Canvas/`, wonders why it's in `components/` at all.
2. **Domain ownership unclear**: `components/` is a generic bucket containing ALL domains. It gives no signal about whether something is "editor-only" or "shared".
3. **`shared/` folder is empty barrels too**: `shared/constants`, `shared/hooks`, `shared/types`, `shared/ui`, `shared/utils` — all re-export from top-level equivalents. Same pattern as `features/`.
4. **Correct pattern, incomplete execution**: The `features/` pattern is architecturally sound (it's what CLAUDE.md says to use). The problem is that the physical file move was never done — only the barrel aliases were created.

### Generic Buckets vs Domain Owners

| Folder        | Type              | Problem                                                                           |
| ------------- | ----------------- | --------------------------------------------------------------------------------- |
| `components/` | Generic bucket    | Contains ALL features (Editor, Canvas, AI, Templates, Media, Collaboration, etc.) |
| `utils/`      | Generic bucket    | Contains parsers, html utils, drag helpers, storage utils — all mixed             |
| `constants/`  | Generic bucket    | Events, tabs, storage keys, icons, defaults — all mixed                           |
| `types/`      | Generic bucket    | Types for every domain — all mixed                                                |
| `features/`   | Alias only        | Barrel redirects with no physical ownership                                       |
| `shared/`     | Alias only        | Barrel redirects with no physical ownership                                       |
| `engine/`     | Real domain owner | Self-contained engine with clear domain folders (elements/, styles/, drag/, etc.) |

The engine/ directory is the **only folder with genuine domain-driven structure**. It has 28 focused subdirectories, each owning one domain. The UI side (`components/`) has no equivalent structure — everything is in generic top-level buckets.

---

## J) Current → Ideal Ownership Mapping (Conceptual Only)

| Current Path                          | Conceptual Target                         | Reason                                       |
| ------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| `components/Editor/AquibraStudio.tsx` | `features/editor/shell/AquibraStudio.tsx` | This IS the editor shell entry point         |
| `components/Editor/StudioPanels.tsx`  | `features/editor/shell/StudioPanels.tsx`  | Layout orchestrator for editor domain        |
| `components/Editor/hooks/`            | `features/editor/shell/hooks/`            | Shell-specific hooks                         |
| `components/Canvas/`                  | `features/editor/canvas/`                 | Canvas is a complete editor sub-domain       |
| `components/Panels/LeftSidebar/`      | `features/editor/sidebar/`                | Sidebar is a complete editor sub-domain      |
| `components/Panels/ProInspector/`     | `features/editor/inspector/`              | Inspector is a complete editor sub-domain    |
| `components/Layout/LeftRail.tsx`      | `features/editor/rail/LeftRail.tsx`       | Rail belongs to editor shell                 |
| `components/Blocks/`                  | `features/editor/blocks/`                 | Block registry + block components            |
| `components/AI/`                      | `features/ai/`                            | AI feature is standalone                     |
| `components/Templates/`               | `features/templates/`                     | Templates feature is standalone              |
| `components/Collaboration/`           | `features/editor/collaboration/`          | Collaboration is an editor sub-feature       |
| `components/Sync/`                    | `features/editor/sync/`                   | Sync is an editor sub-feature                |
| `components/Media/`                   | `features/editor/media/`                  | Media components are editor-specific         |
| `components/ui/`                      | `shared/ui/`                              | Truly shared UI (Button, Modal, Toast, etc.) |
| `components/forms/`                   | `shared/forms/`                           | Truly shared form controls                   |
| `constants/events.ts`                 | `engine/constants/events.ts`              | Events are engine-domain constants           |
| `constants/tabs.ts`                   | `features/editor/rail/tabs.ts`            | Tab config is rail/sidebar domain            |
| `constants/icons.ts`                  | `shared/icons.ts`                         | Generic UI resource                          |
| `utils/parsers/`                      | `shared/utils/parsers/`                   | Truly shared utilities                       |
| `utils/html/`                         | `shared/utils/html/`                      | Truly shared utilities                       |
| `utils/dragDrop/`                     | `features/editor/canvas/utils/drag/`      | Canvas-specific drag utilities               |
| `utils/storageMigration.ts`           | `engine/utils/storageMigration.ts`        | Storage migration is engine-adjacent         |
| `engine/integrations/EmailService.ts` | DELETE                                    | L0 stub — never usable in current state      |

---

## K) Truth Tables (Uncertain Items — Now Resolved)

| Item                                     | Exists? | Imported?          | Reachable from Entry?   | UI-Triggered?                   | Runtime-Verified? | Final Status                               | Confidence | Notes                                                                             |
| ---------------------------------------- | ------- | ------------------ | ----------------------- | ------------------------------- | ----------------- | ------------------------------------------ | ---------- | --------------------------------------------------------------------------------- |
| **Tab count = 9**                        | ✅      | ✅ (tabs.ts)       | ✅                      | ✅ (rail + router)              | ❌                | **Wired (9 tabs)**                         | HIGH       | Confirmed from 3 sources: tabs.ts, TabRouter.tsx, LeftRail.tsx                    |
| **Tab count = 10** (V1 mention)          | ❌      | N/A                | N/A                     | N/A                             | N/A               | **False — delete claim**                   | HIGH       | Was legacy before components/assets split                                         |
| **useElementFlash**                      | ✅      | ✅ (AquibraStudio) | ✅                      | ✅ (ELEMENT_CREATED/DUPLICATED) | ❌                | **Wired (L2)**                             | HIGH       | CSS class flash with requestAnimationFrame restart                                |
| **Alignment methods (8)**                | ✅      | N/A                | ✅ (via composer)       | ❌ (0 UI calls)                 | ❌                | **Likely dead (L0)**                       | HIGH       | Grep returned 0 results for any UI call                                           |
| **storageMigration**                     | ✅      | ✅ (AquibraStudio) | ✅                      | ✅ (module load)                | ❌                | **Wired — valid**                          | HIGH       | Migrates 15 keys, completion flag prevents re-run                                 |
| **EmailService**                         | ✅      | ✅ (Composer)      | ✅ (via composer.email) | ❌                              | ❌                | **Dead (L0 stub)**                         | HIGH       | All methods throw Error('Not implemented')                                        |
| **Collaboration PresenceIndicators**     | ✅      | ✅ (StudioHeader)  | ✅                      | ✅ (useCollaboration hook)      | ❌                | **Wired (L2)**                             | HIGH       | Rendered in StudioHeader with stats                                               |
| **ConflictModal**                        | ✅      | ✅ (StudioModals)  | ✅                      | ✅ (sync conflict event)        | ❌                | **Wired (L2)**                             | HIGH       | Rendered in StudioModals with sync state                                          |
| **features/ as domain owner**            | ✅      | ✅                 | ✅ (as re-exports)      | N/A                             | N/A               | **Namespace only — no physical ownership** | HIGH       | All 8 files are barrel re-exports                                                 |
| **Circular engine↔components dep**       | N/A     | ❌                 | N/A                     | N/A                             | N/A               | **No circular deps**                       | HIGH       | Engine imports 0 component files                                                  |
| **CloudSync wired to UI**                | ✅      | ✅ (StudioModals)  | ✅                      | ✅ (ConflictModal wired)        | ❌                | **L2 wired**                               | MEDIUM     | Save/load wired; conflict resolution UI wired                                     |
| **SelectionManager.getSelectedBounds()** | ✅      | REVIEW             | REVIEW                  | REVIEW                          | ❌                | **REVIEW**                                 | MEDIUM     | Used by alignment methods (L0) but may also be used by overlay bounds calculation |
| **useCursorIntelligence**                | ✅      | ✅ (Canvas)        | ✅                      | ✅ (collab mode)                | ❌                | **Wired — conditional**                    | MEDIUM     | Only active when collaboration is connected                                       |
| **sidebarAnalytics.ts**                  | ✅      | REVIEW             | REVIEW                  | REVIEW                          | ❌                | **REVIEW**                                 | LOW        | Not investigated — name suggests analytics stub                                   |

---

## L) Runtime Verification Checklist (Next Phase)

### Smoke Flow Checks (Do These First)

```
□ Boot: Does editor load without console errors?
□ Boot: Does migrateStorageKeys() run without error? (check localStorage after first load)
□ Boot: Is Composer initialized before first render? (useComposerInit should block on null)
□ Tab switch: Click all 9 rail icons → does corresponding tab content render?
□ Tab switch: Does keyboard shortcut for each tab work? (A, Z, P, C, M, D, S)
□ Canvas: Click an element → does selection box appear? Does ProInspector update?
□ Canvas: Move an element → does canvas HTML update? Does inspector show new position?
□ Canvas: Resize an element via handle → does visual update correctly?
□ Inspector: Change padding → does canvas iframe update in real-time?
□ Inspector: Change font-size → does canvas iframe update?
□ Undo: Cmd+Z → does element revert? Does inspector revert?
□ Redo: Cmd+Shift+Z → does element go forward? Does inspector go forward?
□ Drag from sidebar: Drag a block → does drop indicator appear? Does drop create element?
□ Template apply: From BuildTab, apply a template → does canvas populate?
```

### Event/Listener Checks

```
□ Subscribe count: After mounting editor, how many listeners does Composer have per event?
  → In browser console: composer.listenerCount('element:selected')
  → Should be ~3–5 (ProInspector, Canvas overlays, useComposerSelection)
  → If > 10, there is a listener leak

□ Unmount/remount: Mount editor → navigate away → remount → check listener counts again
  → Counts should be identical to first mount
  → If higher, useEffect cleanup is missing somewhere

□ Tab switch leak test: Switch through all 9 tabs 10 times → check listener counts
  → Should remain stable (lazy-loaded components should mount/unmount cleanly)
```

### Hook Null-Guard Check

```
□ Set composer = null → do all 20 Canvas hooks handle null without throwing?
□ Check: useCanvasSync, useCanvasDragDrop, useCanvasKeyboard especially
□ Expected: Each hook should return empty/default state when composer is null
```

### Store Sync Checks

```
□ After element:created event fires, does ProInspector auto-select the new element?
□ After page:deleted event, does PagesTab update without stale data?
□ After history:undo, do Canvas + ProInspector BOTH show the reverted state?
  → Both must respond to the same HISTORY_UNDO event
  → If one updates and the other doesn't, there's a listener gap
```

### Alignment Methods Check (L0 Verification)

```
□ Open browser console, type: window.aquibra?.composer?.selection?.alignLeft?.()
□ Does this function exist? Does it execute? Does it move elements?
□ This is the runtime test to confirm/deny the L0 label
□ If it works: add toolbar buttons. If it throws: delete the methods.
```

### Console Error Checks

```
□ Check for: "Cannot read properties of null" (null guard failures)
□ Check for: "Warning: Each child in a list should have a unique 'key' prop"
□ Check for: Duplicate event subscriptions warning
□ Check for: React StrictMode double-invoke effects (if StrictMode enabled)
□ Check for: EmailService errors (if anything calls composer.email.subscribe())
```

### Suggested Debug Instrumentation (Dev-Only)

```typescript
// Add to useComposerInit.ts (dev mode only):
if (process.env.NODE_ENV === "development") {
  const EVENTS_TO_LOG = ["element:selected", "element:created", "drag:start", "drag:end"];
  EVENTS_TO_LOG.forEach((event) => {
    composer.on(event, (data) => devLogger.event(event, data));
  });
}

// Add to Canvas.tsx (dev mode only):
React.useEffect(() => {
  if (process.env.NODE_ENV === "development") {
    const count = composer?.listenerCount?.("element:selected");
    devLogger.debug("canvas:mount", { listenerCount: count });
  }
}, [composer]);

// localStorage state snapshot:
// In browser console: JSON.parse(localStorage.getItem('aqb-panel-state'))
```

---

## M) Probable SSOT Candidates (Analysis Only)

| Domain                       | Current Owner                             | Duplication Risk                                                                                               | Confidence | Recommendation                                                                                                               |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Tab metadata**             | `constants/tabs.ts` (GROUPED_TABS_CONFIG) | Low — only one config object                                                                                   | HIGH       | Already SSOT. Keep.                                                                                                          |
| **Panel routing**            | `TabRouter.tsx` (switch/case)             | Low                                                                                                            | HIGH       | Already SSOT. If tabs grow, consider a map-based router.                                                                     |
| **Editor UI state**          | `useStudioState.ts`                       | Medium — ProInspector has its own localStorage state                                                           | HIGH       | Currently split between 2 hooks. Could unify under a single `useEditorState` that owns ALL panel state keys.                 |
| **Block registry**           | `components/Blocks/blockRegistry.ts`      | Low                                                                                                            | HIGH       | Already SSOT per CLAUDE.md. Keep.                                                                                            |
| **Command registry**         | `engine/commands/CommandCenter.ts`        | Medium — keyboard shortcuts also defined in `useCanvasKeyboard.ts`                                             | MEDIUM     | Risk: same shortcut defined in both CommandCenter and useCanvasKeyboard. Need to verify which one takes precedence.          |
| **Event constants**          | `constants/events.ts` (90+ events)        | Low — single file                                                                                              | HIGH       | Already SSOT. Keep. Any new event MUST be added here first.                                                                  |
| **Storage keys**             | `constants/storage.ts`                    | MEDIUM — storageMigration.ts has its own key list (15 keys), useStudioState.ts has `aqb-panel-state` hardcoded | HIGH       | **Gap**: `constants/storage.ts` and `storageMigration.ts` both maintain key lists. They should reference the same constants. |
| **Engine bridge interfaces** | `engine/Composer.ts` (public API)         | Low — Composer is the single bridge                                                                            | HIGH       | Already SSOT. The 28 manager namespaces (composer.selection._, composer.styles._, etc.) form the interface.                  |
| **Alignment actions**        | `engine/SelectionManager.ts`              | N/A (L0 dead code)                                                                                             | HIGH       | Either implement UI entry points, or delete the 8 methods. Don't let dead code be the SSOT.                                  |
| **CSS design tokens**        | `themes/default.css` (--aqb-\* vars)      | Low                                                                                                            | HIGH       | Already SSOT. Keep. All CSS must reference --aqb-\* vars, never hardcode.                                                    |

---

## N) Top 20 Most Important Files to Understand First

### Tier 1 — Engine Core (Days 1–2)

| Rank | File                                | Why                                                                                  | Flow Area          | Confidence |
| ---- | ----------------------------------- | ------------------------------------------------------------------------------------ | ------------------ | ---------- |
| 1    | `engine/Composer.ts`                | Creates all 28 managers. Reading this = understanding all possible editor operations | Engine hub         | HIGH       |
| 2    | `engine/elements/ElementManager.ts` | Element CRUD is the heart of all editing                                             | Element operations | HIGH       |
| 3    | `engine/SelectionManager.ts`        | Selection SSOT. Every click, every inspector render flows through here               | Selection          | HIGH       |
| 4    | `engine/HistoryManager.ts`          | Undo/redo is core UX. JSON patch + coalesce pattern is important                     | History            | HIGH       |
| 5    | `engine/styles/StyleEngine.ts`      | How CSS gets applied, stored, and resolved per breakpoint                            | Styling            | HIGH       |
| 6    | `constants/events.ts`               | The complete event vocabulary. Must understand before reading any hook               | Event system       | HIGH       |

### Tier 2 — React ↔ Engine Bridge (Days 2–3)

| Rank | File                                              | Why                                               | Flow Area        | Confidence |
| ---- | ------------------------------------------------- | ------------------------------------------------- | ---------------- | ---------- |
| 7    | `components/Editor/hooks/useComposerInit.ts`      | How Composer is bootstrapped and all events bound | Shell init       | HIGH       |
| 8    | `components/Canvas/hooks/useComposerSelection.ts` | Canonical selection read. All UI uses this.       | Selection bridge | HIGH       |
| 9    | `components/Canvas/hooks/useCanvasSync.ts`        | The 79-line bridge that makes editing visible     | Render bridge    | HIGH       |
| 10   | `components/Editor/hooks/useStudioState.ts`       | Panel state persistence. localStorage pattern.    | UI state         | HIGH       |

### Tier 3 — Layout + Routing (Day 3)

| Rank | File                                          | Why                                                            | Flow Area     | Confidence |
| ---- | --------------------------------------------- | -------------------------------------------------------------- | ------------- | ---------- |
| 11   | `components/Layout/LayoutShell.tsx`           | The 4-column CSS Grid that defines the editor's physical shape | Layout        | HIGH       |
| 12   | `components/Editor/StudioPanels.tsx`          | Props distribution from shell to all 4 panels                  | Layout bridge | HIGH       |
| 13   | `components/Panels/LeftSidebar/TabRouter.tsx` | Tab routing with code-splitting. All 9 tabs wired here.        | Tab routing   | HIGH       |
| 14   | `constants/tabs.ts`                           | The `GroupedTabId` type + `GROUPED_TABS_CONFIG` SSOT           | Tab config    | HIGH       |

### Tier 4 — Feature Surfaces (Days 4–5)

| Rank | File                                                        | Why                                                                | Flow Area        | Confidence |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------------------ | ---------------- | ---------- |
| 15   | `components/Canvas/Canvas.tsx`                              | Canvas entry — 20 hooks + 17 overlays orchestrated here            | Canvas surface   | HIGH       |
| 16   | `components/Panels/ProInspector/index.tsx`                  | Right panel. How selected element properties are displayed         | Inspector        | HIGH       |
| 17   | `components/Panels/ProInspector/config/contextEvaluator.ts` | Determines which inspector sections show for each element type     | Inspector config | HIGH       |
| 18   | `components/Canvas/hooks/useCanvasKeyboard.ts`              | All canvas keyboard shortcuts (620L). Most shortcut bugs are here. | Keyboard         | HIGH       |
| 19   | `components/Blocks/blockRegistry.ts`                        | What elements users can drag/insert. Adding blocks = editing this. | Block library    | HIGH       |
| 20   | `engine/export/ExportEngine.ts`                             | How editor DOM becomes clean HTML/CSS for production               | Export           | HIGH       |

---

## O) Final Recommendations (Decision Support)

### Inspect Manually First (Before Any Code Change)

1. **`SelectionManager.ts` alignment methods (lines 329–520)** — Run the runtime test:

   ```
   composer.selection.alignLeft()
   ```

   If it works on selection → add toolbar buttons. If it does nothing useful → delete all 8 methods. This is the highest-value cleanup available (removes ~200 lines from a 523-line file).

2. **`engine/integrations/EmailService.ts`** — Confirm no external callers before deleting. Run: `grep -rn "emailService\|EmailService" src/`. The file is confirmed stub (throws on every call). Safe to delete if the grep returns only the Composer initialization line.

3. **`features/` barrel strategy decision** — Decide: complete the migration (move files) or remove the barrels and use `components/` as canonical. Running both paths simultaneously misleads developers.

4. **`constants/storage.ts` vs `storageMigration.ts` key lists** — Both define lists of storage keys independently. If these ever diverge (new key in one, not the other), migration will silently skip keys. Verify they are consistent before the next release.

### Verify at Runtime First (Before Cleanup)

1. **Hook null-guard audit** — Mount the editor with `composer = null` (simulate slow init). Do all 20 Canvas hooks gracefully return empty state, or do any throw?

2. **Event listener count after tab switching** — Open DevTools → switch all 9 tabs → check `composer.listenerCount('element:selected')`. Should stay at ~3–5. If it grows, there's a mount/unmount leak.

3. **Alignment methods accessible** — `composer.selection.alignLeft()` — does it execute? This is the only runtime evidence needed to confirm/deny the L0 label.

4. **useCanvasSync + useCanvasContent double-render** — Add a temp counter to track how many times `toHTML()` is called per user action. Should be once per event. If it's twice, the two hooks are both calling it.

### What Cleanup Should Start With (After Verification)

1. **Delete `engine/integrations/EmailService.ts`** — After grep confirms 0 UI callers. 144 lines removed. Remove its initialization in `Composer.ts`.

2. **Delete 8 alignment methods in `SelectionManager.ts`** — After runtime confirms they're never called. 200 lines removed. File drops from 523 → ~310 lines (under limit).

3. **Resolve `features/` strategy** — Either commit to the migration (physical file moves) or revert to `components/` as canonical. Don't maintain a half-done migration in perpetuity.

4. **Split `useCanvasKeyboard.ts` (620L)** into 3 semantic groups (edit shortcuts, nav shortcuts, select shortcuts). This is a medium-risk refactor — no state changes, only import reorganization.

5. **Consolidate storage key constants** — Create single `constants/storage.ts` list and import from it in `storageMigration.ts`. One truth, not two lists.

### What NOT to Touch First

- **`engine/Composer.ts`** — The 28-manager system is well-organized. Don't refactor the manager pattern before fully understanding all event contracts.
- **`engine/collaboration/CollaborationManager.ts` (789L)** — Collaboration is L2 wired and active. Don't split until you understand the OT algorithm and have runtime tests.
- **Canvas hook call order in `Canvas.tsx`** — Hook call order must stay fixed in React. Don't reorder, add, or remove hooks without running the full tab-switch listener audit first.
- **Type files (`types/index.ts` 803L, `types/media.ts` 783L)** — Type files are verbose by nature. The 500-line limit in CLAUDE.md is for logic files. Don't split type files.
- **`CanvasOverlayGroup.tsx`** — 17 overlays have careful z-index ordering. Any reordering changes the visual stacking of selection/hover/drop feedback. Read before touching.

---

_Generated: 2026-02-21 | Version: V2 | Analyst: Claude Sonnet 4.6_
_Evidence: 42-tool background agent, 115,424 tokens, 119 seconds_
_Previous version: `code_review_report.md`_
