# Left Sidebar — Structure & Workflow Spec

**Path root:** `packages/editor/src/editor/`
**Last mapped:** 2026-04-23
**Status:** Shipped (canonical production UI)

---

## 1. Two-layer model

Left sidebar is **two layers**, rendered side-by-side:

```
┌──────┬─────────────────┬──────────────────────────┬────────────┐
│ Rail │ Drawer (Panel)  │         Canvas           │ Inspector  │
│ 48px │ 200 or 280px    │         flex             │   320px    │
└──────┴─────────────────┴──────────────────────────┴────────────┘
```

- **Rail** (`rail/`) — thin icon strip. Always visible. Houses tab buttons grouped in 3 zones (creation / structure / config).
- **Drawer** (`sidebar/` panel-mode tabs) — slides open next to rail when a panel-mode tab is active. 200px (structure tabs) or 280px (creation tabs).
- **Full-page mode** — some tabs (templates, design, settings) don't open a drawer; they replace Canvas + Inspector entirely.

Orchestrated by `LayoutShell.tsx` (CSS Grid with named slots: TopBar, Rail, Drawer, Canvas, Inspector, FullPage).

---

## 2. Tab registry (canonical source)

File: `rail/tabsConfig.ts` — `GROUPED_TABS_CONFIG`

| Tab ID       | Icon       | Label     | Section | Mode     | Width | Zone      | Shortcut |
|--------------|------------|-----------|---------|----------|-------|-----------|----------|
| `add`        | Plus       | Add       | top     | panel    | 280   | creation  | A        |
| `templates`  | LayoutGrid | Templates | top     | fullpage | —     | creation  | T        |
| `assets`     | Image      | Media     | top     | fullpage | 280   | creation  | M        |
| `layers`     | Layers     | Layers    | top     | panel    | 200   | structure | Z        |
| `pages`      | File       | Pages     | top     | panel    | 200   | structure | P        |
| `components` | Diamond    | Comps     | top     | panel    | 200   | structure | ⇧A       |
| `design`     | Palette    | Design    | bottom  | fullpage | —     | —         | D        |
| `settings`   | Settings   | Settings  | bottom  | fullpage | —     | config    | S        |
| `publish`    | Rocket     | Publish   | bottom  | panel    | 280   | —         | U        |
| `history`    | Timer      | History   | bottom  | panel    | 280   | config    | H        |

Helpers in same file: `getTabMode()`, `getTabWidth()`, `getTabConfig()`, `getTabsByZone()`.

Rule: any new tab → add here first. Everything else (routers, keyboard handler, rail renderer) reads from this registry.

---

## 3. Rail internals (`rail/`)

| File            | Role                                                                              |
|-----------------|-----------------------------------------------------------------------------------|
| `LayoutShell.tsx` / `.css` | CSS Grid shell. Clones Drawer/Inspector children with `open` + `fullPageMode` props. Switches grid template when fullpage active. |
| `DrawerPanel.tsx` / `.css` | Sliding animated panel. Per-tab scroll restore. Pin + Escape handlers. Mounted in LayoutShell.Drawer slot. |
| `tabsConfig.ts`            | See §2.                                                                |
| `index.ts`                 | Exports: LayoutShell, GROUPED_TABS_CONFIG, types (GroupedTabId, TabZone, TabPattern, TabMode). |

---

## 4. Sidebar internals (`sidebar/`)

| File                     | Role                                                                                             |
|--------------------------|--------------------------------------------------------------------------------------------------|
| `LeftSidebar.tsx` / `.css` | Rail + panel header renderer. 3 rail zones, keyboard nav (Arrow/Home/End), Settings dirty guard, Composer event emission. |
| `TabRouter.tsx`          | Switch-based router for **panel-mode** tabs. Lazy-loads each tab via `React.lazy()`. Unmounts previous tab on switch (intentional — see §8). |
| `FullPageView.tsx` + `FullPageRouter.tsx` | Wraps FullPageRouter in error boundary. Routes fullpage-mode tabs: templates, design, settings, assets → LibraryManager. |
| `useSidebarState.ts`     | Open/pinned/activeTab state. localStorage key `buildrick-sidebar-state`. Supports controlled + uncontrolled modes. Auto-focus first button on expand. |
| `useSidebarKeyboard.ts`  | Global keydown listener. Matches `tab.shortcut`. Skips when focus is in input/textarea/contenteditable. |
| `SidebarFallbacks.tsx`   | Error + suspense fallbacks wired into router.                                                    |

### `sidebar/shared/` — reusable panel UI

| File                       | Purpose                                                         |
|----------------------------|-----------------------------------------------------------------|
| `PanelHeader.tsx`          | Title row + actions (pin, close, help).                         |
| `DrillInHeader.tsx`        | Back arrow + title for nested screens.                          |
| `SearchBar.tsx`            | Standard panel search input.                                    |
| `FilterChips.tsx`          | Multi-select pill filters.                                      |
| `ViewSwitcher.tsx`         | Inline tab switcher (e.g., Activity / Timeline).                |
| `FeatureCard.tsx`          | Card primitive for grid layouts.                                |
| `StickyFooter.tsx`         | Bottom-pinned Save/Cancel bar.                                  |
| `EmptyStates.tsx` + `.css` | No-items / no-results UI.                                       |
| `SkeletonStates.tsx` + `.css` | Loading placeholders.                                        |
| `PanelErrorState.tsx`      | Error-boundary fallback.                                        |
| `headerIcons.tsx`          | Lucide icon re-exports (Pin, Help, Close, Back, Chevron, Check). |
| `headerStyles.ts`          | Emotion styles for header layout.                               |
| `usePanelNavigation.ts`    | Drill-in stack state machine (see §6). localStorage-backed per panel. |

---

## 5. Tab implementations (`sidebar/tabs/`)

### Panel-mode (mount inside DrawerPanel)

| Tab          | Entry                                     | Drill-in                                   | Purpose                                         |
|--------------|-------------------------------------------|--------------------------------------------|-------------------------------------------------|
| `add`        | `build/BuildTab.tsx`                      | Yes — CatAccordion → card → SectionsMode   | Element catalog + sections + AI suggestions.    |
| `layers`     | `layers/LayersTab.tsx`                    | No                                         | Layer tree; select + reorder.                   |
| `pages`      | `pages/PagesTab.tsx`                      | Yes — PageList → PageFolder → PageSettings overlay | CRUD pages, bulk ops, per-page SEO.       |
| `components` | `ComponentsTab.tsx`                       | Yes — list → ComponentDetailScreen         | Saved components library.                       |
| `assets`     | `media/MediaTab.tsx`                      | Yes — LibraryView → AssetDetailOverlay     | Upload + manage media; stock search.            |
| `publish`    | `publish/PublishTab.tsx`                  | No                                         | Publish + deployment status.                    |
| `history`    | `history/HistoryTab.tsx`                  | No                                         | Version timeline + activity log.                |

### Fullpage-mode (replace Canvas + Inspector)

| Tab         | Entry                                       | Drill-in                              | Purpose                              |
|-------------|---------------------------------------------|---------------------------------------|--------------------------------------|
| `templates` | `templates/TemplatesTab.tsx`                | Yes — list → TemplateDetail → apply  | Browse + apply templates.            |
| `design`    | `DesignSystemTab.tsx` (bridges `features/design-system/`) | No                  | Global tokens (color, type, spacing). |
| `settings`  | `settings/SettingsTab.tsx`                  | Yes — home → sub-screens              | Project config, domain, integrations.|

### Loose / helper files

- `ElementsTab.tsx` — internal to Build; not routed directly.
- `componentsData.ts` — component metadata cache.
- `DesignSystemTab.tsx` — thin bridge; real code in `features/design-system/`.

---

## 6. Workflows

### A. Rail click → tab switch

```
RailZone button click
  → handleBtnClick(tabId) in LeftSidebar
  → if tabId === activeTab: toggle drawer
  → else: safeTabChange(tabId)
      → check Settings dirty state
         → dirty: show ConfirmDialog
         → clean: call onTabChange prop
  → parent (StudioPanels) updates leftPanelTab state
  → LeftSidebar activeTab prop changes
  → TabRouter or FullPageRouter re-renders
  → target tab lazy-loads and mounts
```

### B. Drill-in navigation

```
Screen click (e.g., "Sections" card in Build)
  → usePanelNavigation.navigateTo("sections")
  → stack pushed, currentScreen updated, breadcrumb recomputed
  → DrillInHeader renders with back arrow
  → localStorage write: buildrick-nav-{storageKey}

Back click
  → goBack() pops stack → parent screen renders
  → goHome() clears stack
```

Each panel that drills in owns its own `storageKey` so state survives tab switches.

### C. Fullpage activation

```
StudioPanels sees getTabMode(activeTab) === "fullpage"
  → sets effectiveFullPageMode = true
  → LayoutShell swaps grid: FullPage slot visible, Canvas/Inspector visibility:hidden
    (kept in DOM to preserve WebGL iframe state)
  → FullPageRouter mounts target tab
```

### D. Composer integration

- LeftSidebar + tabs receive `composer` prop (no context; explicit pass-through).
- Example emits:
  - `EVENTS.COMPONENT_CREATE_REQUESTED` on component creation.
- Tab-specific calls:
  - `composer.selection.getSelectedIds()` (layers)
  - `composer.pages.*` (pages)
  - `composer.media.upload()` (media)

---

## 7. State model

| Concern                | Where it lives                                              | Persistence                        |
|------------------------|-------------------------------------------------------------|-------------------------------------|
| activeTab / expanded / pinned | `useSidebarState` (React useState)                  | `localStorage: buildrick-sidebar-state` |
| Drill-in stack         | `usePanelNavigation` per panel                              | `localStorage: buildrick-nav-{storageKey}` |
| Per-tab internal state | Inside each tab component                                   | Tab-local (some also localStorage) |
| Full-page flag         | Derived from `getTabMode(activeTab)` in StudioPanels        | — (derived)                         |
| Settings dirty flag    | SettingsTab → propagates via `onSettingsDirtyChange`        | in-memory                           |

No Redux, no Zustand, no Context for sidebar state. Simple hooks + localStorage.

---

## 8. Architectural notes / gotchas

1. **Unmount-on-switch is intentional.** `TabRouter` unmounts the previous tab on every switch. Earlier attempts at keep-mounted caused layout collapse. Perf addressed at component level (SvgIcon memo, catalog pre-grouping, conditional SectionsMode mount).

2. **Settings dirty guard.** `ConfirmDialog` blocks tab switch if Settings has unsaved edits. Callback `onSettingsDirtyChange` bubbles up from SettingsTab.

3. **Media dual-mode.** `assets` tab renders slim launcher (panel) or full LibraryManager (fullpage); toggle lives at StudioPanels level.

4. **Keyboard shortcuts opt-in.** Only tabs with `shortcut` field in config trigger. `useSidebarKeyboard` blocks when focus is in editable element.

5. **Icon map hardcoded** in `LeftSidebar.tsx` (ICON_MAP). Missing icon → silent null. Keep in sync with `tabsConfig.ts` icons.

6. **Drawer overlay vs push.** When unpinned, drawer overlays canvas (class `.layout-shell--drawer-overlay`). Pinned → drawer takes grid column, canvas resizes.

7. **FullPage slot preserves canvas.** Canvas + Inspector stay mounted with `visibility: hidden` to avoid WebGL context loss on tab toggle.

8. **No engine imports in UI.** Editor UI talks to engine only via `composer.*` methods and events. Direct manager imports banned per `CLAUDE.md`.

---

## 9. Public API surface

- **Rail:** `LayoutShell`, `GROUPED_TABS_CONFIG`, types `GroupedTabId`, `TabZone`, `TabPattern`, `TabMode`.
- **Sidebar:** `LeftSidebar` + `LeftSidebarProps`.
- **Shared UI:** `PanelHeader`, `DrillInHeader`, `SearchBar`, `FilterChips`, `ViewSwitcher`, `FeatureCard`, `StickyFooter`, `EmptyStates`, `SkeletonStates`, `PanelErrorState`, `usePanelNavigation`.
- **Integration point:** `StudioPanels` wires `LeftSidebar`, `LayoutShell`, `FullPageView` together and owns `activeTab` state.

---

## 10. Adding a new tab — checklist

1. Add entry to `GROUPED_TABS_CONFIG` in `rail/tabsConfig.ts` (id, icon, label, section, mode, width if panel, zone, shortcut).
2. Add icon to `ICON_MAP` in `LeftSidebar.tsx`.
3. Create `sidebar/tabs/{name}/{Name}Tab.tsx`.
4. Register in `TabRouter.tsx` (panel-mode) **or** `FullPageRouter.tsx` (fullpage-mode).
5. If drill-in needed: use `usePanelNavigation` with unique `storageKey`.
6. Reuse `PanelHeader`, `SearchBar`, `EmptyStates`, `SkeletonStates` — no new primitives.
7. Keep all engine access via `composer.*`. No direct manager imports.
