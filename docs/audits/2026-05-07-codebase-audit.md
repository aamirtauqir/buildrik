# Buildrik Editor — Codebase Audit (2026-05-07)

**Scope:** `packages/editor/src/` — 471 TypeScript/TSX files across `engine/`, `editor/`, `shared/`, `themes/`, `services/`, `ai/`, `blocks/`, `templates/`.
**Audit grid:** 21 anti-pattern categories (per request).
**Methodology:** 6 parallel Explore agents, each scoped to a domain, returned bucketed findings with `file:line` refs.
**Status:** Snapshot — not exhaustive. Spot-checks + grep + targeted reads.

---

## Executive Summary

| Severity | Count | Notable |
|---|---|---|
| **Critical** (boundary violations, broken flow) | 13 | `shared/ui` + `shared/forms` → vibcoder (10 imports), `engine/media` → `editor/sidebar`, `editor/canvas/toolbars` → engine internals, ProInspector responsive override inert on desktop |
| **High** (god components, modal contract drift, missing error UX) | 11 | VersionHistoryPanel 962 LOC, AquibraStudio 476 LOC, StudioModals 350 LOC, async/void onClose mismatches |
| **Medium** (duplicate code, styling drift, state mess) | 28 | Inline hex in 6+ files, 11 useState in LibraryManager, 15 useState pairs in useStudioModals |
| **Low** (hardcoded data, poor naming, dead props) | 19 | zIndex 10000 inline, dropTargetPath dead prop, magic byte conversions |
| **Test Gaps** | 5 domains near-zero | onboarding/, collaboration/, ecommerce/, export/, sync/ — UI layer fully untested |

**Top hotspots** (touch first):
1. `editor/panels/VersionHistoryPanel.tsx` — 962 LOC god component (rendering + state + API + virtualization)
2. `editor/shell/AquibraStudio.tsx` (476 LOC) + `StudioModals.tsx` (350 LOC, 15 modal useState pairs)
3. `editor/inspector/ProInspector.tsx` — 631 LOC + responsive override broken on default breakpoint
4. `editor/media/LibraryManager.tsx` — 900+ LOC + 11 useState + no virtualization
5. `engine/VersionTimelineManager.ts` (947 LOC) + `engine/collaboration/CollaborationManager.ts` (795 LOC)
6. **shared/ui + shared/forms boundary** — 10 forbidden imports into vibcoder

---

## 1. engine/ Findings

### 1.1 Architecture Boundary Issue (CRITICAL)
- `engine/media/MediaManager.ts:33` — imports from `editor/sidebar/tabs/media/api/StockService`. Forbidden: `engine/ → editor/`.

### 1.2 God Components
- `engine/VersionTimelineManager.ts` — 947 LOC. Manages versions + snapshots + branching + serialization + undo/redo.
- `engine/collaboration/CollaborationManager.ts` — 795 LOC. Connection + room + remote updates + state sync + events.
- `engine/Composer.ts` — 763 LOC. Central orchestrator, ~20 manager fields. (Borderline — gateway by design.)
- `engine/styles/StyleEngine.ts` — 698 LOC. Style + cascade + inheritance + media queries + animations.
- `engine/export/ExportEngine.ts` — 668 LOC. HTML/CSS/React export + asset embed.
- `engine/media/MediaManager.ts` — 634 LOC. Lifecycle + storage + optimization + cache + stock API.

### 1.3 Missing Error State (silent swallow)
- `engine/EventEmitter.ts:86-90` — empty catch in event dispatch loop.
- `engine/PluginManager.ts:331` — `.catch(() => {})` swallows plugin unload errors.
- `engine/collaboration/CollaborationManager.ts:789` — `.catch(() => {})` on leaveRoom.
- `engine/storage/StorageAdapter.ts:50` — `.catch(error => {})` on save errors.

### 1.4 Duplicate Code
- `engine/canvas/AlignmentHandler.ts:52-56` and `engine/ai/LayoutAnalyzer.ts:109-112` — identical `parseFloat(styles.left/top/width/height)` bounds calculation.

### 1.5 Hardcoded Data
- `engine/canvas/resize/utils.ts:144-165` — handle direction strings (`"w"`, `"nw"`, etc.) checked as literals; no enum.
- `engine/interactions/InteractionRuntime.ts:170-217` — DOM event names as literals; no event-name constant table.

### 1.6 State Mess (concurrency / unclear ownership)
- `engine/Composer.ts:66-67` — `transactionDepth` + `transactionDirty` flags manage nested transactions manually; no concurrency guard.
- `engine/media/MediaManager.ts:89-104` — `blobUrlMap`, `blobUrlRefs`, `pendingRevokes`, `inFlight` accessed without atomic guards. Concurrent revoke/add race.
- `engine/collaboration/OTEngine.ts:20, 283-289` — OT state mutated during transform; add-vs-replace precedence ambiguous.

### 1.7 Performance
- `engine/canvas/canvasGeometry.ts:225` — `Math.pow(x,2)` instead of `x*x` (minor, hot path).
- `engine/canvas/indicators/SnapCalculator.ts` — O(n²) per drag frame; no spatial index.

### 1.8 Test Gap
- `engine/__tests__/` covers 4 of ~25 root managers (Composer, HistoryManager, VersionTimelineManager, PluginManager).
- Untested: SelectionManager, Viewport, ElementManager, FontManager, StyleEngine, MediaManager, DataManager, CommandCenter, ResizeHandler, all engine/canvas/*, all engine/collaboration/*, data bindings.

---

## 2. editor/canvas + editor/inspector + editor/panels + editor/wizard

### 2.1 God Components
- `editor/panels/VersionHistoryPanel.tsx` — **962 LOC**. State (versions, compare, AI summary) + virtualized list rendering + API + transactions. Split: `VersionList` + `CompareView` + `AIPanel`.
- `editor/inspector/ProInspector.tsx` — **631 LOC**. Breakpoint switcher + pseudo-state switcher + binding popover + tabs + error boundary + renderer.
- `editor/canvas/Canvas.tsx` — **589 LOC**. Orchestrates 20+ hooks (drag, keyboard, sync, marquee, snapping). 10+ useState for local UI state.

### 2.2 Architecture Boundary Issue
- `editor/canvas/toolbars/AlignmentToolbar.tsx:10` — direct import of `AlignmentHandler` from `engine/canvas/`. Should call composer.
- `editor/inspector/components/MultiSelectToolbar.tsx` — same `AlignmentHandler` leak.
- `editor/canvas/overlays/SelectionBoxOverlay.tsx:8`, `SelectionHandles.tsx:9` — `HandlePosition` type imported from `engine/canvas/ResizeHandler` (type-only — acceptable but indicates coupling).

### 2.3 Broken Flow (CRITICAL)
- `editor/inspector/ProInspector.tsx:255` — condition `currentBreakpoint === "desktop"` blocks override detection. Responsive-override feature **inert on default breakpoint**.
- `editor/canvas/Canvas.tsx:332` — `emptyDismissed` useEffect never clears state on new content; empty-state can persist after canvas populated.

### 2.4 Styling Drift (Inline Hex)
- `editor/canvas/overlays/TemplatePreviewPanel.tsx:375` — `#1a1a2e` for template name.
- `editor/canvas/overlays/ElementHoverOverlaySubComponents.tsx:191, 227, 234, 238` — `#3b3b3b`, `#ec4899`, `#a5f3fc`, `#f9e2af` (also banned palette pink).
- `editor/canvas/DeviceFramePreview.tsx:129, 150` — `#2a2a2e`, `#2a2a2a`.
- `editor/inspector/components/InspectorErrorBoundary.tsx:62, 66, 76` — `#fca5a5`, `#f87171`.
- `editor/inspector/ProInspector.tsx:138` — `#fff` inline.
- `editor/panels/VersionHistoryPanel.tsx:457` — `#fca5a5` inline error color.

### 2.5 State Mess
- `Canvas.tsx:132-364` — 10+ useState (snapLines, isResizing, pickMode, deviceFrameActive, emptyDismissed) — consolidate.
- `editor/canvas/overlays/DropFeedbackOverlay.tsx:85-111` — `canvasRef` (ref object) in useEffect deps array; refs are stable, this thrashes.
- `ProInspector.tsx:54-60` — multiple useState + props drilled 4+ levels into BreakpointSwitcher/PseudoStateSwitcher.

### 2.6 Performance
- `DropFeedbackOverlay.tsx:555` — `React.memo` wraps component making `getBoundingClientRect` calls every render.
- `editor/inspector/shared/controls/Section.tsx` — no `React.memo`; toggle cascades nested re-renders.
- `VersionHistoryPanel.tsx` — FixedSizeList row renderer unmemoized; all visible rows re-render on parent state change.

### 2.7 Dead Code / Poor Naming
- `DropFeedbackOverlay.tsx:46, 83` — `dropTargetPath` prop kept "for compat" but breadcrumb removed; unused.
- `TemplatePreviewPanel.tsx:40` — `_composer` underscore-prefixed unused param (vestigial).
- `Canvas.tsx:154` — `pickMode` ambiguous (should be `eyedropperMode`).

### 2.8 Missing Error / Empty State
- `Canvas.tsx` — no error boundary around overlays.
- `editor/wizard/PageWizard.tsx:89-147` — async generation only logs error as `phase="error"`; no detail or recovery.

### 2.9 Test Gap
- `editor/canvas/toolbars/AlignmentToolbar.tsx` — 0 tests.
- `editor/canvas/overlays/ElementHoverOverlay.tsx` — 449 LOC, 0 tests.
- Drag hooks well-covered (no critical gaps).

---

## 3. editor/sidebar + editor/rail + editor/shell

### 3.1 God Components
- `editor/shell/AquibraStudio.tsx` — 476 LOC, orchestrates 13+ feature areas.
- `editor/shell/StudioPanels.tsx` — 448 LOC, 17 props, no memoization on intermediate selectors.
- `editor/shell/StudioModals.tsx` — 350 LOC, **30+ modal show/close/context props** (onCloseTemplates, onCloseAI, onCloseCopilot, onCloseMediaLibrary, onCloseImageEditor, onCloseIconPicker, onCloseCollectionSetup, onCloseCreateComponent, onCloseProjectSettings, onCloseCMSCollectionSetup, onCloseCommandPalette, …). Single `ModalManager` atom would cut 50+ LOC.
- `editor/sidebar/tabs/pages/PagesTab.css` — 1374 LOC. Other monoliths: `BuildTab.css` (846), `TemplatesTab.css` (717), `history/styles.css` (1245).

### 3.2 State Mess (Modal Sprawl)
- `editor/shell/hooks/useStudioModals.ts` — **15 separate `show*`/`setShow*` useState pairs**. Collapse to `{modalName, context}` reducer.
- `editor/sidebar/useSidebarState.ts:63-75` — three useState (primaryTab, expanded, pinned) + manual localStorage sync (lines 86-97).

### 3.3 API Contract Issue (Async/Void Mismatch — recurring)
- `StudioModals.tsx` — `onClose*` callbacks return `void`, but `collectionSetupContext.onConfirm` and `imageEditorContext.onSave` are `async`. Modals don't await; errors lost.
- `editor/sidebar/shared/DrillInHeader.tsx` — uses `onBack` / `onBackAttempt` while sibling components use `onClose`. Inconsistent.

### 3.4 Feature-Flag Gating Gap
- `AccountModal.tsx`, `InviteModal.tsx` — comments say "gated behind VITE_FEATURE_*" but **no env check in render path**. StudioModals.tsx renders unconditionally if `props.showAccountModal` is true. Gate must move into the modal-show wiring or be enforced in Topbar trigger.

### 3.5 Hardcoded Data (Inline Hex)
- `AccountModal.tsx:383-387` — role badge `#FEF3C7`, `#92400E`, `#475569`.
- `PublishDropdown.tsx:176-180` — status colors `#92400E` (amber), `#166534` (green).
- `AquibraStudio.tsx:82-98` — error boundary palette `#cdd6f4`, `#11111b`, `#f38ba8`, `#a6adc8`, `#89b4fa`, `#74c7ec` (Catppuccin leak — banned).
- `PageTabBar.tsx:27-32` — `#fff` fallback.
- `templatesData.ts` — inline `style="..."` 260px/280px/180px in template HTML strings.

### 3.6 Duplicate Code (event handlers)
- Escape-key listener pattern in 3+ modals: `AccountModal.tsx:391`, `InviteModal.tsx:79`, `PublishDropdown.tsx:203`. Extract to `useEscapeKey()` hook.
- ClickOutside pattern in 3+ dropdowns: `PageTabBar.tsx:115`, `BreakpointDropdown.tsx:56`, `PublishDropdown.tsx:193`. Extract to `useClickOutside()`.

### 3.7 Wrapper Over Wrapper
- `AccountModal.tsx` — `onClose` chained AccountModal → StudioModals → AquibraStudio (3 layers for one signal).

### 3.8 Performance
- `StudioPanels.tsx:154-200` — children (LeftSidebar, Canvas, ProInspector, FullPageView) all unmemoized; tab switch re-renders entire panel tree.
- `LeftSidebar.tsx:102-150` — TabRouter renders all panels; only one visible. No code-split / lazy mount.

### 3.9 Missing Error / Empty State
- `StudioModals.tsx` — modal submit paths (saveTemplate, createComponent, collectionSetup.onConfirm, CMSCollectionSetup) lack error toast.
- `MediaTab.tsx:77-80` — image editor save catches but no toast.
- `PagesTab.tsx`, `HistoryTab.tsx`, `MediaTab.tsx` — no empty-state components.

### 3.10 Test Gap
- `editor/shell/__tests__/` — no integration test for StudioPanels + StudioModals wiring.
- `editor/rail/__tests__/` — only `tabsConfig.test.ts`. `LayoutShell.tsx`, `DrawerPanel.tsx` untested.

---

## 4. editor/media + editor/animation + editor/design-system

### 4.1 God Component
- `editor/media/LibraryManager.tsx` — **900+ LOC**. 3-column layout + folder tree + grid + search + sort + bulk + drag-drop + image editor + context menu + keyboard + version history + usage counting. Split: `LibraryManagerShell`, `FolderTree`, `AssetGrid`, `AssetDetailsPanel`.

### 4.2 Performance
- `LibraryManager.tsx:584-632` — `visibleItems.map(...)` renders ALL filtered assets unconditionally. No virtualization. 500+ assets = 500 DOM nodes.

### 4.3 State Mess
- `LibraryManager.tsx:70-80` — 11 independent useState calls + external `useMediaState(composer)`. Consolidate local UI state into reducer.

### 4.4 Duplicate Code
- `editor/media/LibraryManager.tsx:45-49` `fmtBytes()` and `editor/media/AssetCard.tsx:28-32` `formatSize()` — same byte→KB/MB logic. Extract to `media/utils/formatSize.ts`.

### 4.5 No Source of Truth
- `editor/design-system/constants.ts:8-12` `TOKEN_CATEGORIES` enum and `editor/design-system/ui/DesignSystemTab.tsx:67` `SAVEABLE_CATEGORIES` array — overlapping definitions.

### 4.6 Architecture Boundary Issue
- `editor/design-system/ui/DesignSystemTab.tsx:15` — imports `PanelErrorState` from `editor/sidebar/shared/`. Design-system shouldn't pull from sidebar. Move to `editor/shared/errors/PanelError.tsx`.

### 4.7 Missing Error State
- `MediaLibraryPanel.tsx:80-100+` — `handleUpload()` calls `uploadFile()` with no `.catch()`, no error boundary, no toast.

### 4.8 Broken Flow
- `editor/animation/AnimationEditor.tsx:70-150+` — `onPreview` callback optional and never wired to canvas preview. Lines 82-86 commented dead code.

### 4.9 Hardcoded Data
- `LibraryManager.tsx:46-48`, `AssetCard.tsx:30-31` — `1024 * 1024` byte thresholds inline.

### 4.10 Test Gap
- 7 of 39 files have tests (18%) — all in `design-system/`.
- `editor/media/` — **0 tests**.
- `editor/animation/` — **0 tests**.

---

## 5. editor/onboarding + editor/collaboration + editor/ecommerce + editor/export + editor/sync

### 5.1 Test Gap (CRITICAL)
- **Zero `__tests__` directories** in any of the 5 UI domains. Engine layer (`engine/export`, `engine/collaboration`, `engine/sync`) has tests; UI layer fully untested.

### 5.2 God Components
- `editor/onboarding/OnboardingChecklist.tsx` — 493 LOC. Step list + dismissal confirmation + progress bar + minimize/restore + events.
- `editor/export/ExportModal.tsx` — 407 LOC. Tabs + preview device selection + config mutations + ZIP/React/HTML download + error states.

### 5.3 API Contract Issue
- `shared/types/collaboration.ts:25-33` — `CollaborationUser.color` optional, but `PresenceIndicators` requires it (hash-derived fallback). Type doesn't enforce contract.
- `editor/export/ExportModal.tsx:191-217` — `ExportResult.success` boolean unused; modal checks `result?.html`. Inconsistent contract.
- `editor/sync/SyncStatusIndicator.tsx:10, 18-21` — imports `SyncStatus` from `services/CloudSyncService` AND `SyncManagerState` from `engine/sync/SyncManager`. Two parallel sync types; no shared interface.

### 5.4 Fake UI
- `PresenceIndicators.tsx:40-43, 270-274` — `MOCK_USERS` shows demo "Ana" avatars when disconnected. Confusing for new users.
- `ConnectionQualityIndicator.tsx:201-213` — `DEMO_STATS` greyed "Offline" pill even when disconnected. No real "not connected" state.
- `editor/ecommerce/CollectionSetupModal.tsx:93-105` — feature promises in checklist ("8 product fields", "Validation rules", "Ready for CMS data binding") with no backend wiring verifying creation.

### 5.5 Broken Flow
- `OnboardingChecklist.tsx:39, 50-61` — `onAction(actionKey)` defined in props but no caller wires it to orchestrator. CTA buttons exist; handler missing.
- `ConflictModal.tsx:29, 64, 83` — `onResolve(resolution)` callback exists but no parent catches resolution; modal can dismiss without resolving.
- `ExportModal.tsx:77-79` — config changes pass to engine without validation. Invalid `cssPrefix` or `metaDescription` breaks downstream.

### 5.6 Hardcoded Data
- `WelcomeModal.tsx:17-21` — `FEATURED_TEMPLATES` hardcodes 3 IDs ("saas-landing", "portfolio", "blog").
- `AchievementPrompt.tsx:75, 89`, `ConflictModal.tsx:141` — inline `zIndex: 10000` / `10001`. No layering token.

### 5.7 State Mess (timer duplication)
- `useOnboardingOrchestrator.ts:166-170` — orchestrator owns 3.5s achievement auto-dismiss timer.
- `AchievementPrompt.tsx:27-39` — component owns 4s progress-bar timer for the same effect. **Two timers, one purpose, durations don't match.**

### 5.8 Architecture Boundary Issue
- `ExportModal.tsx:9-10` — UI imports `ExportEngine`, `ReactExporter` directly from engine. No abstraction layer.
- `SyncStatusIndicator.tsx:10-11` — imports from `services/` AND `engine/sync/`. Unclear ownership.

### 5.9 Performance
- `PresenceIndicators.tsx:270-274` — `useMemo` on `displayUsers` but no deps optimization. If `users` array recreated each render, memo is no-op.
- `ConflictModal.tsx:107-163` — SVG icons created inline on every render. Move outside component.
- `ExportModal.tsx:54-75` — new `ExportEngine` instance on every config change. No caching.

### 5.10 Missing Error State
- `CollectionSetupModal.tsx:40-48` — no try/catch on collection creation; errors silent.
- `SyncStatusIndicator.tsx:51-53` — error color shown but no toast/modal; user can't act.

### 5.11 Missing Empty State
- `PresenceIndicators.tsx:299-301` — returns `null` when no users. Should show "Waiting for collaborators…" placeholder.
- `OnboardingChecklist.tsx:60-80` — renders empty accordion if `DEFAULT_ONBOARDING_STEPS` not set.

### 5.12 Duplicate Component
- Tooltip reimplemented in `PresenceIndicators.tsx:84-120` and `ConnectionQualityIndicator.tsx:155-191` (different hover states, same structure). Vibcoder Tooltip not used.
- Icon SVGs (Cloud, Offline, Error) inline in `ConflictModal.tsx:107-125` and `SyncStatusIndicator.tsx:108-164`.

### 5.13 Poor Naming
- `editor/collaboration/index.ts:11-12` — alias `PresenceIndicators as PresenceAvatars` (WS-15 naming debt). Component shows presence, not just avatars.

---

## 6. shared/ + editor/shared/vibcoder + services/ + ai/ + blocks/ + templates/ + themes/

### 6.1 Architecture Boundary Issue (CRITICAL)
**10 files in `shared/ui/` and `shared/forms/` import from `editor/shared/vibcoder` — forbidden by leaf-layer rule** (only `shared/extensions/` may cross that edge).

- `shared/ui/HelpTooltip.tsx:29` — Tooltip family
- `shared/ui/ErrorState.tsx` — Button
- `shared/forms/InputField.tsx` — Input, FormField
- `shared/forms/SelectField.tsx` — Select, FormField
- `shared/forms/NumberField.tsx` — NumericStepper, FormField
- `shared/forms/ColorField.tsx` — Input
- `shared/forms/SliderField.tsx` — Slider
- `shared/forms/TextareaField.tsx` — Textarea, FormField
- `shared/forms/FormSettingsSection.tsx` — Button
- `shared/forms/FormStateOverlay.tsx` — Button

**Fix options:**
- (A) Move all `shared/forms/*` files into `shared/extensions/` (sanctioned vibcoder consumer).
- (B) Create new `shared/ui-bridge/` folder with explicit CLAUDE.md sanction.
- (C) Re-export vibcoder primitives from `shared/extensions/` and have ui/forms import the re-export.

### 6.2 Cleared / Acceptable
- **Badge variants split** (`shared/ui/Badge` legacy semantic vs `vibcoder/Badge` chrome-state) — intentional Phase 4 split, kept for `ai/` + `templates/` consumers.
- **HelpTooltip composition** — intentional vibcoder composition (Phase 5 handoff).
- **Toast 4-layer wrapper** — Radix → Radix-wrapper → vibcoder compound → globalThis store. Each layer solves a distinct problem (HMR persistence, imperative-API bridge). Justified.
- **Hash function** — single source at `shared/utils/helpers/id.ts:84`. No duplication.
- **Color hex constants** in `shared/utils/parsers/colorTypes.ts:66-79` — W3C standard names (`#000000`, `#ffffff`). Domain constants, not magic.
- **CIE ΔE\* coefficients** in `colorDelta.ts` (0.17, 0.24, 0.32) — mathematical constants.
- **`themes/legacy-components.css`** — locked at 72 LOC since Phase Final; zero new rules added. ✓
- **No services importing editor/** — boundary respected.

---

## Cross-Cutting Patterns

These appear in 3+ domains. Fix once, fix many:

### Pattern A — Async/Void onClose Mismatch
Modal `onClose` callbacks return `void` but submit handlers (onConfirm, onSave, onResolve) are `async`. Errors from async submits are unhandled.
- `editor/shell/StudioModals.tsx` (collectionSetup, imageEditor)
- `editor/sync/ConflictModal.tsx:29, 64, 83` (onResolve)
- `editor/ecommerce/CollectionSetupModal.tsx:40-48` (onConfirm)

**Fix:** Define `ModalSubmit<T>` type that requires `Promise<T>` return; modals must `await` and surface errors via toast.

### Pattern B — Inline Hex Across Editor Chrome
Inline hex colors leak into chrome JSX despite Gate 24 zero-tolerance on inline elements (only enforces inline `<button>/<input>/<select>/<textarea>`, not inline colors). Gate 24 should extend to `style={{ color: "#..." }}` or `stroke="#..."` in chrome paths.
- 6 files in canvas/inspector/panels (§2.4)
- 4 files in shell (§3.5)
- 1 file in sync (`ConflictModal.tsx:108`)

### Pattern C — Modal State Sprawl
- `useStudioModals.ts` — 15 useState pairs.
- `LibraryManager.tsx` — 11 useState calls.
- `Canvas.tsx` — 10+ useState calls.

**Fix:** `useReducer` with discriminated-union state for each component cluster.

### Pattern D — Achievement-Style Duplicate Timer
Two components racing on same effect with mismatched durations:
- Onboarding: 3.5s orchestrator timer + 4s progress-bar timer.
Same anti-pattern likely lurks in sync (status flash) and inspector (popover auto-close) — verify.

### Pattern E — Engine Internals Imported by UI
- `editor/canvas/toolbars/AlignmentToolbar.tsx` ← `engine/canvas/AlignmentHandler`
- `editor/inspector/components/MultiSelectToolbar.tsx` ← `engine/canvas/AlignmentHandler`
- `editor/export/ExportModal.tsx` ← `engine/export/ExportEngine`, `ReactExporter`
- `engine/media/MediaManager.ts` ← `editor/sidebar/tabs/media/api/StockService` (reverse direction — worse)

**Fix:** Surface alignment + export operations as `composer.alignment.*` / `composer.export.*` methods. Move StockService into shared/ or services/.

### Pattern F — UI Layer Test Coverage Cliff
| Domain | UI tests |
|---|---|
| editor/canvas | partial (drag hooks covered) |
| editor/inspector | sparse |
| editor/panels | sparse |
| editor/shell | hooks only, no integration |
| editor/sidebar | partial |
| editor/rail | tabsConfig only |
| editor/media | **0** |
| editor/animation | **0** |
| editor/onboarding | **0** |
| editor/collaboration | **0** |
| editor/ecommerce | **0** |
| editor/export | **0** |
| editor/sync | **0** |
| editor/design-system | 18% (state + migrations only) |

---

## Top 10 Priority Fixes

Ordered by reach × severity ÷ effort.

1. **Fix `shared/ui` + `shared/forms` boundary** — 10 imports forbidden. Pick option A/B/C from §6.1. Single PR, codemod-able. Resolves leaf-layer rule violation flagged in 4 prior architecture cleanups.
2. **Fix ProInspector responsive override broken on default breakpoint** — `ProInspector.tsx:255`. One-line condition fix; restores feature that's silently inert.
3. **Move `engine/media/MediaManager.ts:33` StockService import** — relocate StockService to `services/stock/` or `shared/`. Removes only `engine/ → editor/` violation.
4. **Modal contract — async-aware `onClose`** — define `ModalSubmit<T>` type, codemod 3 modal files (StudioModals, ConflictModal, CollectionSetupModal). Surfaces silent submit errors.
5. **Feature-flag gating enforced in render path** — AccountModal, InviteModal, PublishDropdown — read `VITE_FEATURE_*` at the trigger or render guard, not just in comments.
6. **Inline hex hunt** — extend Gate 24 (or new Gate 26) to ban inline `style={{ color: "#" }}` / `stroke="#"` in chrome paths. ~15 fixes in canvas/inspector/shell.
7. **Split VersionHistoryPanel (962 LOC)** — `VersionList` + `CompareView` + `AIPanel`. Largest god component in editor/.
8. **Consolidate `useStudioModals` to reducer** — 15 useState pairs → `{name, context}` union. -50 LOC, predictable state shape.
9. **Add UI test stubs for 5 untested feature domains** — onboarding, collaboration, ecommerce, export, sync. Even smoke-render tests catch regressions.
10. **`MediaLibrary` virtualization** — `react-window` for AssetGrid. 500+ asset projects render 500 nodes today.

---

## Issues NOT Found (Cleared Categories)

- **Wrapper Over Wrapper** mostly cleared — Toast 4-layer is justified; AccountModal/onClose chain is real but minor.
- **Dead Code at scale** — leaf layer (`shared/`) has no obvious unused exports; vibcoder primitives all used.
- **Hardcoded Data in shared/constants** — appropriate (constants files are the right home).
- **Poor Naming in shared/utils** — clear module boundaries (`array.ts`, `object.ts`, `string.ts`).
- **`themes/legacy-components.css` rule additions** — locked at 72 LOC, no drift since Phase Final.
- **Drag/Drop hooks** — well-covered, no critical bugs in `useDragSnapGuides`, `useDropExecution`, `useTouchDrag`.
- **Vibcoder Gate 24 inline element compliance** — only 1 stray test button found.
- **God Composer.ts** — 763 LOC but architecturally intended as gateway, not splitting target.
- **Services boundary** — services/ does not import from editor/.

---

## Methodology Notes

- 6 parallel Explore agents, each scoped to one domain. Each returned findings bucketed by 21-issue grid.
- File:line references verified by grep where possible; unverified claims marked with caveats.
- "Cleared" sections record absence-of-evidence — not absence. A category cleared in spot-check may surface in deeper audit.
- This audit is a **starting map**, not a defect database. Prioritize Top 10 first, then re-run targeted audits per domain.
- Re-run quarterly or after major architecture moves (next: post-Phase-1c publish ship).
