---
date: 2026-04-22
topic: editor-v2-inventory
focus: Pre-architecture inventory for editor chrome rebuild — unblocks paused brainstorm (2026-04-22) after Codex killed it for parity fantasy + wrong facts
status: inventory-only (NOT a plan, NOT a spec)
source-of-truth: repo HEAD @ d2c8dfb
---

# Editor-v2 Inventory (A–G)

Prior architecture drafts died because they invented parity estimates and got mode facts wrong. This doc is **inventory only**. No architecture, no migration order, no folder proposal. Every claim cites a file + line.

## A. Tab Structure Map

SSOT: `packages/editor/src/editor/rail/tabsConfig.ts`.

10 tabs. `mode` declared on config; `effectiveFullPageMode` in shell adds one runtime override (Media).

| id | label | mode (config) | panelWidth | zone | router | shortcut |
|---|---|---|---|---|---|---|
| `add` | Add | panel | 280 | creation | TabRouter | A |
| `templates` | Templates | fullpage | — | creation | FullPageRouter | T |
| `assets` | Media | fullpage | 280 | creation | **both** (dual-mode, see below) | M |
| `layers` | Layers | panel | 200 | structure | TabRouter | Z |
| `pages` | Pages | panel | 200 | structure | TabRouter | P |
| `components` | Comps | panel | 200 | structure | TabRouter | ⇧A |
| `design` | Design | fullpage | — | — (no rail btn) | FullPageRouter | D |
| `settings` | Settings | fullpage | — | config | FullPageRouter | S |
| `publish` | Publish | panel | 280 | — (no rail btn) | TabRouter | U |
| `history` | History | **panel** | **280** | config | **TabRouter** | H |

**Codex blocker 4 confirmed:** History is `mode: "panel"` (`tabsConfig.ts:166`), `panelWidth: 280`. Routed via TabRouter (`TabRouter.tsx:38, 123`), NOT FullPageRouter. Any proposal that treats History as fullpage is wrong at the config level.

### Dual-mode (Media only)
`StudioPanels.tsx:201-205`:
```
effectiveFullPageMode =
  isFullPageMode ||
  getTabMode(activeTabId) === "fullpage" ||
  (activeTabId === "assets" && mediaFullPage);
```
Media renders `<MediaTab>` (slim launcher) in panel by default; user clicks "Library" → `setMediaFullPage(true)` → FullPageRouter renders `<LibraryManager>` instead (different component, not same component reflowed). Auto-resets on tab change (`StudioPanels.tsx:208-212`).

### Router split (facts)
- `TabRouter.tsx` handles: add, layers, pages, components, assets (panel = MediaTab), publish, history. (Lines 80–128.)
- `FullPageRouter.tsx` handles: templates, design, settings, assets (fullpage = LibraryManager). (Lines 50–86.)
- Neither router handles `"publish"` as fullpage, nor `"history"` as fullpage.

---

## B. Settings Parity Inventory

File: `sidebar/tabs/settings/SettingsTab.tsx` (266 lines). Fullpage tab, drill-in pattern.

### Drill-in navigation
- `usePanelNavigation` hook, storageKey `settings-panel-${projectId}` (line 80). Nav state persists per project.
- `SETTINGS_SCREENS` has **10 screens** (`SettingsTab.tsx:51-62`): `home`, `site-settings`, `domains`, `analytics`, `export`, `integrations`, `advanced`, `seo`, `billing`, `design-system`. All drill-ins have `parentId: "home"`.
- Back chevron → `DrillInHeader` (line 226), guarded by `screenIsDirty` state. If dirty → `SettingsNavGuard` modal (line 252).

### Plan gates
- `SCREEN_PLAN_REQUIREMENTS` map in `./index.ts` (imported line 26).
- Locked screens show `<LockedScreen variant={requiredPlan} />` (line 193).
- `pro` screens locked when `userPlan === "starter"` (`SettingsTab.tsx:103`); `enterprise` when `userPlan !== "enterprise"` (line 104).
- Feature flags: `FEATURE_FLAGS` from `./index.ts` — `domains` and `export` currently gated to "Coming Soon" badges (lines 130, 166).

### Screens enumerated (from `settings/screens/`)
- `AdvancedScreen.tsx`, `AnalyticsScreen.tsx`, `BillingScreen.tsx`, `DomainsScreen.tsx`, `ExportScreen.tsx`, `IntegrationsScreen.tsx`, `LockedScreen.tsx`, `SeoScreen.tsx`, `SiteSettingsScreen.tsx` (9 files).
- Plus `DesignSystemTab` lazy-imported from sibling folder (line 19).
- 4 of 9 screens wire `onDirtyChange` up to tab-level dirty tracking: SiteSettings, Analytics, Advanced, SEO.

### Dirty-state contract (cross-boundary)
Sub-screen → Tab → Shell:
- Screen calls `onDirtyChange(true)` → `SettingsTab.screenIsDirty` state.
- `SettingsTab` bubbles via `onDirtyChange` prop (FullPageRouter passes it) → `StudioPanels.onSettingsDirtyChange` (shell-owned; consumed by rail to guard tab switches).
- Lost on reset when `currentScreen` changes (line 92).

### Grouping
Home screen has 3 `<FeatureCardGrid label>` sections: **SITE** (Site Settings, Design System, Domains, Analytics), **POWER** (SEO, Integrations, Advanced, Export, Billing), **HELP** (Get Started Tour, shown only if `onReplayTour` provided).

---

## C. Media Parity Inventory

File: `sidebar/tabs/media/MediaTab.tsx` (317 lines). **Dual-mode**: slim launcher (panel) vs full manager (fullpage via LibraryManager).

### Mode selection
- If `onOpenLibrary` prop passed (from shell via panel mode) → renders `<SlimLauncher>` (line 101-112).
- Otherwise → renders full manager inline (lines 129-315). But note: fullpage is actually handled by a **different component** — `LibraryManager` in `FullPageRouter.tsx:16-18`. MediaTab-as-fullpage inline render is only reached if the caller wires it that way; current shell uses LibraryManager for fullpage.

### State (`useMediaState` hook — composite)
Pulls from 5 sub-hooks in `hooks/`:
- `useLibraryState` — libraryItems, folders, currentFolderId, search, sort, gridN, fmtFilter, selMode, selectedKeys.
- `useDiscoveryState` — stockPhotos, stockVideos, discIcons, discFonts, discLoading, discoverySearch, orientation, color.
- `useSelectionState` — selectionContext for snap-back flow (when another tool asked media to pick an image).
- `useUploadState` — uploadQueue, storage, upload(), drag handlers.
- `useUsageMap` — which canvas elements reference which media keys (for deletion confirmation).

### Surfaces (14)
1. Selection Mode Header (snap-back bar, conditional on `selectionContext`, line 138).
2. Type pills + "Add from Stock" button + close (line 171).
3. LibraryView (grid/list of assets, folders, upload queue — line 196).
4. UploadZone footer (line 236).
5. Drag overlay (line 245).
6. MediaContextMenu (right-click on item — line 253).
7. ConfirmDeleteModal (cross-references usage map — line 268).
8. AssetDetailOverlay (rename, inspect, metadata — line 276).
9. StockSourceModal (discovery — photos/videos/icons/fonts — line 292).
10. SlimLauncher (panel mode entry point).
11. Image editor callback flow (line 72): opens shell-owned editor → receives edited data URL → creates versioned copy with `_v${timestamp}` suffix → re-uploads.
12. Icon picker callback (line 115): delegates to shell's `onOpenIconPicker`.
13. Folder CRUD (createFolder, deleteFolder, moveAsset — lines 223-225).
14. Bulk select mode + bulk delete (selMode toggle, selectAll, requestBulkDelete — lines 211-214).

### Shell-owned callbacks Media depends on
- `onOpenImageEditor(src, onSave)` — delegates editor modal to shell (line 34).
- `onOpenIconPicker(current, onSelect)` — delegates icon picker modal to shell (line 35).
- `onOpenLibrary({searchQuery, folderId})` — panel→fullpage toggle (line 40).
- `onClose` — closes fullpage / collapses panel.

---

## D. History Parity Inventory

File: `sidebar/tabs/history/HistoryTab.tsx` (205 lines). **Panel mode**, 280px wide (see A).

### Surfaces (6)
1. PanelHeader ("Version History" title, pin, help, close — line 114).
2. View switcher (2 tabs: Changes / Saves, with helper text — line 123).
3. Search bar (filters within active view — line 140).
4. List container — `<ActivityView>` for Changes (line 167) or `<VersionHistoryPanel>` for Saves (line 187).
5. MilestoneSuggestionBanner (only in Saves view, when `useAutoMilestone` returns a suggestion — line 179).
6. TimeTravelScrubber drawer (line 193). **Overlays canvas, not sidebar** (confirmed in file comment line 192). Toggled by Ctrl+Shift+T keyboard shortcut (line 89-98). Restore action: `composer.history.restoreEntry(entryId)` (line 102).

### Hooks
- `useHistoryState(composer)` — historyStack, canUndo, clear.
- `useAutoMilestone(composer)` — suggestion, isLoading, dismiss, accept, edit, isAvailable.

### Persistence
- `activeView` persisted to `localStorage` key `buildrick-history-view-${projectId}` (line 53). Writes on change (line 79-86), reads on mount (line 57-65).

### Sub-components (from `history/components/`)
- `ActivityView.tsx` — Changes list.
- `DiffRow.tsx` — one row.
- `MilestoneSuggestionBanner.tsx` — milestone banner.
- `SnapshotPreview.tsx` — snapshot preview.
- `TimeTravelScrubber.tsx` — canvas-overlay scrubber.

### Cross-cutting
- Scrubber is the only History surface that breaks out of the sidebar viewport. Any re-architecture must keep scrubber z-layer over canvas, not inside panel.

---

## E. Shell-Owned Deps Enumeration

What StudioPanels (or its parent) owns, that tabs depend on via prop/event:

### Callbacks (props on StudioPanels)
From `StudioPanels.tsx:60-84`:
- `onOpenMediaLibrary(allowedTypes, onSelect)` — modal-style media picker for other tools.
- `onOpenIconPicker(currentIcon, onSelect)` — icon picker modal.
- `onOpenImageEditor(imageSrc, onSave)` — image editor modal.
- `onExportForDeploy()` — deploy/export flow returning files.
- `onAIRequest({elementId, elementType})` — AI action routing.
- `onDeviceChange`, `onZoomChange`, `onLeftPanelToggle`, `onLeftPanelTabChange`, `onLeftPanelSubTabChange`, `onOverlayChange`, `onPanelPinnedToggle` — UI state setters.

### Composer event bridges (StudioPanels subscribes, UI reacts)
From `StudioPanels.tsx:215-273`:
- `EVENTS.UI_OPEN_BUILD_PANEL` → opens Add tab.
- `EVENTS.UI_BROWSE_TEMPLATES` → opens Add tab (note: currently maps to Add, not Templates — possibly stale).
- `EVENTS.UI_OPEN_DESIGN_PANEL` → opens Design tab.
- `"ui:switch-tab"` ad-hoc event → opens arbitrary tab by id.
- `"canvas:hover"` → tracks hovered element id for Layers tab sync.
- `EVENTS.VERSION_PREVIEW_STARTED` / `_CLEARED` → toggles dim banner overlay.

### Keyboard ownership
- `Topbar.tsx:168` → `document.addEventListener("keydown", …)` global.
- `CommandPalette.tsx:102` → global keydown.
- `HistoryTab.tsx:89` → global keydown for Ctrl+Shift+T (owned by tab itself, not shell).
- Not yet audited: full rail shortcut handler (A/T/M/Z/P/⇧A/D/S/U/H). Likely lives in `useSidebarKeyboard.ts` under `sidebar/`.

### Toasts
- `useToast()` from `shared/ui/Toast` — shell mounts provider; tabs call `addToast({message, variant, duration, action})`.
- StudioPanels itself uses toast for delete+undo (line 292).

### Modals owned by shell (not tab)
- Media library picker (delegated).
- Icon picker (delegated).
- Image editor (delegated).
- CMS collection create (TODO stub — `StudioPanels.tsx:455-457`).
- NavGuard modals owned per-tab (Settings has its own `SettingsNavGuard`).

### FullPageView error boundary
`FullPageView.tsx:46` wraps all fullpage tabs in `InspectorErrorBoundary` + `Suspense(PanelSkeleton)`. Any replacement must preserve error-recovery + lazy-load fallback.

### TokenRegistryProvider
`StudioPanels.tsx:367` — wraps entire shell. Any v2 shell rewrite must keep this ancestor for `TokenRegistryProvider({projectId})` to continue supplying DS tokens to children.

---

## F. Canvas Stack Anatomy

From `StudioPanels.tsx:396-443`:

```
LayoutShell.Canvas
 ├── <PageTabBar composer={composer} />           (line 397)
 ├── <div style={canvasPattern} />                 (bg dots, line 398)
 ├── <div ref={composerContainerRef}              (line 399; shell hands ref up)
 │       style={canvasContent}>
 │    ├── <Canvas ref={canvasRef}                 (line 400; canvas hands ref up)
 │    │      composer + device + zoom
 │    │      + showSpacing/Badges/Guides/Grid/ComponentView/XRay
 │    │      + devMode + onAIRequest + onOpenImageEditor(handleEditMedia) />
 │    └── {isVersionPreview && <div previewBanner>
 │          ├── "Preview" label
 │          ├── "— not saved" muted
 │          └── <button>Exit</button>              (line 421; calls composer.versionHistory.clearPreview)
 │        </div>}
 └── <CanvasFooterToolbar                          (line 430)
        overlays={{guides, spacing, grid, badges, xray}}
        zoom + onOverlayChange + onZoomChange + onFitToScreen />
```

### Z-layer facts
- Pattern layer: `zIndex: 0` (line 138).
- Canvas content: `zIndex: 1` (line 146).
- Preview banner: `zIndex: 50` (line 106).
- CanvasFooterToolbar: sibling of canvas content, no explicit z (relies on DOM order).
- TimeTravelScrubber (from History): overlays canvas via body-level portal (not in StudioPanels tree; History owns mount).

### Two refs bubble to parent
- `canvasRef` — for programmatic canvas access from dashboard wrapper.
- `composerContainerRef` — for layout measurement.

Both are **props into StudioPanels**, not internally owned. A rewrite cannot eliminate these unless the consumer of StudioPanels is also rewritten.

---

## G. CSS + Tokens + Feature Flags

### G.1 Global CSS selector bleed audit

Files that define global (non-component-scoped) selectors:
- `themes/default.css`
- `themes/ux-fixes.css`
- `themes/components.css`
- `themes/design-system/*.css` (a11y, design, index, radius, shadow, spacing, typography — canonical DS)
- `editor/sidebar/LeftSidebar.css`
- `editor/rail/LayoutShell.css`
- `editor/rail/DrawerPanel.css`
- `editor/canvas/Canvas.css`
- `editor/media/LibraryManager.css`
- `editor/media/ImageEditorModal.css`
- `editor/panels/layers/styles/layers.css`
- `editor/sidebar/shared/EmptyStates.css`
- `editor/sidebar/shared/SkeletonStates.css`
- `editor/sidebar/tabs/*/…` (per-tab CSS files — 10 per April 21 ideation)
- `shared/ui/SharedDialogs.css`
- Legacy `components/Layout/*.css`, `components/Canvas/*.css` (not editor/, duplicates).

### Known bleed classes (observed in evidence files + grep)
- `.buildrick-*` — canonical DS prefix (`themes/design-system/*`). Intended global.
- `.ls-*` — LeftSidebar-scoped (`.ls-fullpage-container` used in `FullPageView.tsx:45`; `.ls-panel-animate` referenced in TabRouter header comment).
- `.med-*` — MediaTab-scoped (`.med-tab`, `.med-selection-bar`, `.med-stock-btn`, `.med-content`, `.med-drag-overlay`, `.med-drag-label`, `.med-no-project`, `.med-tabs-wrap` — all in MediaTab.tsx).
- `.tb*` — mentioned in memory checklist; not yet grep-verified in current read; flagged for full audit before v2 decisions.
- `.pCard` — mentioned in memory; not yet grep-verified.
- `.view-switcher`, `.view-tab`, `.tab-helper`, `.search-bar`, `.search-icon`, `.search-input`, `.search-clear`, `.list-container`, `.tab-helper` — HistoryTab prototype markup (lines 123-190). **Ungeneric names — high bleed risk.**
- `.buildrick-history-container` — HistoryTab PanelShell className (line 113).

### G.2 Token map (canonical)

Two locked namespaces (April 20 contract):
- `--buildrick-*` — editor chrome (the editor's own UI).
- `--buildrick-design-*` — user website design tokens (for the pages being built).

Rule: never merge, never invent a third namespace (`--v2-*`, `--editor-*`, etc. are contract violations — Codex blocker 5).

Canonical CSS files (inputs to the namespace):
- `themes/design-system/color.css`, `spacing.css`, `radius.css`, `shadow.css`, `typography.css`, `a11y.css`, `design.css`, `index.css`.
- `themes/default.css`, `themes/ux-fixes.css`, `themes/components.css` — partially migrated; legacy indigo/violet tokens still present (per April 20 DS V1 remediation memory).

### Token usage evidence (MediaTab.tsx inline — not ideal)
Line 150: `background: 'var(--buildrick-accent, #1D4ED8)'` — uses token with raw hex fallback. Fallback is violation of "no raw hex outside themes/" (gate 7). Cobalt should be `#2D6DFF` per DESIGN.md; `#1D4ED8` is wrong color.

### G.3 Feature flag strategy (current state)

Not a single source. Scattered:
- `settings/index.ts` → `FEATURE_FLAGS` (domains, export). Consumed in `SettingsTab.tsx:130, 166`.
- `SCREEN_PLAN_REQUIREMENTS` (also `settings/index.ts`) — plan-gated screens.
- `feat(editor-ds): wire schema-driven Border into production via feature flag` (commit 867cbc2) — implies there's an editor-ds feature flag; location not yet audited.
- Inspector `experimentalRegisteredControls` — per April 21 ideation.

**Status: no shell-owned config.** Codex P1 risk: any v2 proposal that introduces "per-surface feature flags" without consolidating existing flags repeats the same fragmentation.

---

## Facts That Must Hold in Next Design Session

1. **History is panel mode, 280px, lives in TabRouter.** Not fullpage. Not in FullPageRouter.
2. **Media is dual-mode**: panel (SlimLauncher) + fullpage (LibraryManager) — two different components, not one.
3. **Settings has 10 nav screens + plan gates + dirty-state bubbling to shell.** A v2 parity claim must name all 10.
4. **TimeTravelScrubber overlays canvas, not sidebar.** Any v2 sidebar rewrite can't sandbox it.
5. **TokenRegistryProvider wraps the whole shell.** Any v2 shell replacement preserves this ancestor.
6. **Two refs (canvasRef, composerContainerRef) are owned by the dashboard, passed into StudioPanels.** Rewrite scope must include or explicitly skip the consumer.
7. **Tokens stay `--buildrick-*` and `--buildrick-design-*`.** No `--v2-*`. No merger.
8. **No parallel `editor-v2/` folder.** New UI goes inside `editor/` per CLAUDE.md architecture rules.
9. **Seams order, if incremental:** shell → canvas stack → router/tab-switch contracts → individual tabs. Not sidebar-first (that was Codex blocker 2).

---

## Not In This Inventory (Deferred)

- Full `.tb*` / `.pCard` grep audit across 394 .tsx files (mentioned in memory; large sweep; run before v2 draft).
- Complete sidebar keyboard shortcut map (`useSidebarKeyboard.ts` not yet opened).
- Topbar + rail surface inventory (distinct from sidebar tab inventory).
- Inspector section parity (April 21 ideation already partly covers this — 47 section files, 17 IDs, 9 adapter-fit, 8 bespoke).
- Component-library, Publish, Templates, Layers, Pages, Build, Design, Components parity (only Settings/Media/History asked for in this session per Codex blockers 3-5).

These are intentionally out of scope — inventory-only doc, not a plan.
