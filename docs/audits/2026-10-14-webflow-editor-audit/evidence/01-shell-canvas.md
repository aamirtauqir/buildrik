# 01 — Shell & IA (A), Canvas & Selection (B), Workflow plumbing (G)

Baseline: `main @ df60cf9ec` (2026-10-09). All paths are relative to `packages/editor/src/` unless they start with `packages/`, `server/` or `prisma/`. This was a read-only audit.

**Working-tree caveat.** The checkout has **uncommitted** changes in `editor/canvas/menus/{ElementContextMenu,MenuItem,SubmenuItem,SubmenuPanel}.tsx` and in one test. Every finding below describes **HEAD**. The uncommitted diff is summarised separately in §9 because it partly fixes IA-01.

Evidence levels used: CODE / REACH / LIVE (not run here; see §10) / DESIGN (not assessed) / PLANNED.

---

## 0. Re-check of 10 Oct items (all against code at df60cf9ec)

| ID | 10 Oct claim | Status @df60cf9ec | Evidence |
|---|---|---|---|
| UX-01 | Empty-page intro clips at 1280×720 | **Partly addressed in code; still a risk.** The CTA is now sized to the visible frame span and counter-scaled (`canvas/CanvasEmptyCTA.tsx:39-62`). Its container is still `inset:0; justify-content:center` with no overflow (`canvas/Canvas.css:375-387`), so content taller than the visible frame clips at both top and bottom. | CODE; LIVE check #1 |
| UX-02 | Several onboarding surfaces compete | **Confirmed in code.** There are three independent first-run surfaces, each with its own storage key: RailCoach (`onboarding/RailCoach.tsx`, `ONBOARDING_COACH_DISMISSED`), FirstUseTip in the Add panel (`sidebar/tabs/build/components/FirstUseTip.tsx:13-40`, `BUILD_TIPS_SEEN`), and the Checklist pill (`onboarding/OnboardingChecklist.tsx`). Only checklist, achievement and coach share an orchestrator (`onboarding/OnboardingMount.tsx:268-291`). CanvasEmptyCTA and FirstUseTip are outside it. | CODE |
| UX-04 | Page creation stacks blocking surfaces | **Partly confirmed.** A second page fires `add-page` completion (`OnboardingMount.tsx:96-103`), which opens the AchievementPrompt (`role=dialog aria-modal`, scrim, focus trap, 4 s auto-dismiss; `AchievementPrompt.tsx:132-160`, `useOnboardingOrchestrator.ts:28`). That is not coordinated with the page-created feedback. The page-created dialog itself was not traced. | CODE; LIVE #2 |
| UX-06 | Breakpoint hidden in View submenu; footer reads "View · 1" | **Confirmed in code.** "View · N" counts overlays (`canvas/CanvasFooterToolbar.tsx:370`), and snap guides default on (`shell/hooks/useStudioState.ts:264`), which gives "· 1". The breakpoint appears only as View ▸ Breakpoint (`CanvasFooterToolbar.tsx:403-452`). On Desktop the width label (`Canvas.tsx:722`) and the inspector breakpoint chip (`inspector/ProInspector.tsx:236`) are both hidden. The device commands have no chord (`engine/commands/defaultCommands.ts:609-645`). | CODE/REACH |
| UX-07 | Selection toolbar and hint overlap content | **Partly addressed.** The pill now moves outside for elements under 80×176 (`canvas/controls/UnifiedSelectionToolbar.tsx:43-50,97-106`). Larger elements still get the pill inside them, and the caption line is drawn over the element (`:58-60,206-210`). The caption uses hard-coded Mac glyphs. The SelectionLabel at `top-24` never flips, so it probably collides with an outside-above pill (`overlays/SelectionLabel.tsx:77`). | CODE; LIVE #3 |
| UX-08 | Layer names generic or truncated | **Not re-verified in code** (naming is template data plus panel width). Rename exists (`panels/layers/components/LayerTreeItem.tsx:172-176`). | LIVE |
| UX-13 | Onboarding blocks the first Preview | **Confirmed in code.** `UI_TOGGLE_PREVIEW` completes the `preview` step (`OnboardingMount.tsx:61-66`), which opens the modal AchievementPrompt. | CODE; LIVE #4 |
| UX-22 / IA-07 | Covered chrome stays reachable behind full-page tools | **Confirmed.** No `inert`, `aria-hidden` or `aria-modal` is set on covered chrome. `inert` is used only on the closed drawer (`sidebar/LeftSidebar.tsx:483`). The full-page hosts are bare portals (`sidebar/FullPageRouter.tsx:116-199`). **The Brand host still lacks `data-bk-surface="fullpage"`** (`FullPageRouter.tsx:188-191`; Templates, Assets and Settings have it at :120,144,166). See defect D-07. | CODE |
| UX-23 | Palette is an oversized catalogue | **Confirmed.** `fixed top-12 max-h-[800px]` (`shell/modals/CommandPalette.tsx:589`). With an empty query it shows Recent plus six bands (`:70,508`). Matching is substring only, with no scoring (`:506-512`). The footer still reads "Click a command" (`:715-729`). There is no focus trap and no focus return (`:502`). | CODE |
| UX-24 | Back-to-canvas varies between tools | **Confirmed.** Templates: top-left, `color=light` button (`sidebar/tabs/templates/TemplatesTab.tsx:454-462`). Settings: top-left, link with ChevronLeft (`sidebar/tabs/settings/SettingsTab.tsx:976-992`). Brand: centred link in the nav (`design-system/ui/BrandWorkspace.tsx:937-949`). Assets: **top-right**, after Upload (`media/LibraryManager.tsx:846-849`). CMS: shown only when opened from an element (`shell/StudioPanels.tsx:637-646`; `cms/CmsWorkspace.tsx:168-186`). | CODE |
| IA-01 | Submenus can't be operated by keyboard | **Still true at HEAD.** ArrowDown/Up clear the submenu. Submenu position is computed only on mouseenter, so a keyboard-opened submenu renders at (0,0). Clicking a submenu parent is `onClick={() => {}}`. `useClickOutside(…closeOnEscape)` closes the whole menu on Escape (`git show HEAD:…/ElementContextMenu.tsx:55,96-152`, `SubmenuItem.tsx:38-66,102`). The fix described in product-audit/FINDINGS.md exists **only as uncommitted working-tree changes** (§9). | CODE |
| IA-02 | Action grouping mixes intents | **Not re-evaluated as design.** The registry order is unchanged (`canvas/menus/contextMenuRegistry.ts:44-68`). | CODE |
| IA-03 | Disabled reasons lost at the menu adapter | **Confirmed.** `isEnabled: … action.isEnabled!(ctx) === true` (`canvas/menus/actions/standaloneActions.ts:27`), and `ContextAction.isEnabled` is typed boolean (`contextMenuRegistry.ts:30`). The Inspector ⋯ keeps reasons (`inspector/components/InspectorElementMenu.tsx:62-85`), so the same action explains itself in one surface and not the other. | CODE |
| IA-04 | Group eligibility ≠ engine eligibility | **Confirmed.** Menu visibility checks only `length >= 2` (`standaloneActions.ts:47`). The engine returns null when parents differ (`engine/elements/ElementManager.ts:219-222`), and nothing tells the user. The Inspector MultiSelectBar does check for a shared parent (`inspector/components/MultiSelectBar.tsx:43-44,108-109`). Layers Group uses a third rule: it reparents across branches (`panels/layers/hooks/useLayerActions.ts:315-345`). | CODE |
| IA-05 | Arrange labels imply z-index but reorder siblings | **Confirmed.** `reorderElement` moves the DOM sibling (`engine/commands/commandOperations.ts:123-170`). It has no lock check, only moves the primary element, and opens an empty transaction when already at the boundary. | CODE |
| IA-06 | Surface routing has several sources of truth | **Confirmed.** Mode is in `rail/tabsConfig.ts` (13 entries; only `RAIL_FIGMA`'s 6 are rendered, `:294-296`). Right-column tabs are a separate set (`:341-346`). Assets uses a fullpage override. CMS is an in-canvas layer (`StudioPanels.tsx:927-938`). Full-page mode is computed separately (`StudioPanels.tsx:449-450`). | CODE |
| IA-12 | Overlay layout below 1366px | **Confirmed, and worse than reported.** The media query's single-class column rule (`rail/LayoutShell.css:333-339`) is out-specified by `.layout-shell--has-sidebar.layout-shell--inspector-open` (`:187-193`). The shipping shell always renders a Sidebar, so the 300px track stays reserved **and** the inspector also becomes `position:absolute; top:56px` (`:349-358`), although there is no topbar slot. | CODE; LIVE #5 |
| IA-15 | Main context menu not clamped to the viewport | **Confirmed** at HEAD and in the working tree: `position:fixed; top:y; left:x` (`ElementContextMenu.tsx:163-165`). The Layers menu has the same problem (`panels/layers/components/LayerContextMenu.tsx:83`). | CODE |
| CAN-01 | Resize ignores zoom | **Confirmed.** Bounds come from `getBoundingClientRect` (`engine/canvas/canvasGeometry.ts:53-66`). Deltas are screen pixels (`engine/canvas/resize/ResizeOrchestrator.ts:44-45`). The result is written as CSS px (`resize/DOMUpdater.ts:117-118`), and nothing divides by scale. `applyBoundsToModel` always writes **both** width and height, which is why the untouched axis changes too. New: a click-and-release with no movement at 50% stores half the size (D-01). | CODE |
| CAN-02 | Keyboard resize stores NaNpx | **Confirmed.** The handles cast KeyboardEvent to MouseEvent (`canvas/overlays/SelectionHandles.tsx:107,135,157,184,206`), so `clientX` is undefined and becomes NaN. There is no `isFinite` guard anywhere in the resize code. `ResizeInputManager` gives keyboard users no way to finish (`resize/ResizeInputManager.ts:51-106`). | CODE |
| CAN-03 | Cancelling a resize undoes the previous edit | **Confirmed.** `cancelResize` calls `endTransaction(); history.undo()` (`engine/canvas/ResizeHandler.ts:264-268`), but moves only touch the DOM (`:320-350`) and the model is written only in `finishResize` (`:352-377`). The same happens on `destroy()` mid-gesture (`:444`). | CODE |
| MENU-01 | Layers menu has no arrow keys | **Confirmed.** It only focuses the first item and closes on Escape (`LayerContextMenu.tsx:57-62`). It has no roving focus, no clamping, no focus return, and no lock awareness (Cut and Delete are offered on locked rows). | CODE |
| PAGE-01 | ⌘D on a focused page row doesn't duplicate the page | **Confirmed, with a worse consequence than reported.** PageRow handles only Enter, F2 and Space (`sidebar/tabs/pages/components/PageRow.tsx:247-258`). PageContextMenu prints ⌘D and its comment claims the row handles ⌘D and ⌫ (`PageContextMenu.tsx:105-114`). ⌘D falls through to the engine's capture-phase `duplicate` (`defaultCommands.ts:154-180`). For modifier chords `shouldHandleShortcut` skips the widget-role check (`CommandCenter.ts:260-279`), so **the selected canvas element is duplicated off-screen.** | CODE; LIVE #10 |

---

## 1. Module map

### A1 Shell host and mount
- **Purpose:** authenticated editor route → shell.
- **Entry:** route `packages/dashboard/app/edit/[siteId]/page.tsx`.
  - Auth redirect keeps the query (`:18-34`).
  - `getEditorAccess` → DeniedState (`:36-51`).
  - VIEWER is forced to `?view=readonly` (`:58-68`).
  - `EditorClient.tsx` mounts `AquibraStudio key={siteId}` (ssr:false, error boundary, chunk-reload).
- **Regions** (`shell/AquibraStudio.tsx:666-964`), in order:
  - RecoveryBanner, LoadErrorBanner
  - `<header role=banner>` with StudioHeader
  - StudioPanels: LayoutShell with Sidebar (rail+drawer) / Canvas (`main#layout-canvas`, PageTabBar, Canvas, CMS layer) / Inspector / FullPage
  - StudioModals, ConflictModal, PreviewOverlay, CompareHost, OnboardingMount
  - publish and session modals
- **Evidence:** CODE/REACH.

### A2 Topbar (`shell/StudioHeader.tsx` → `chrome-ui/Topbar.tsx`)
- **Controls:**
  - Exit (guarded navigation)
  - Site crumb → Pages; page crumb → close drawer
  - SaveStatus pill (`StudioHeader.tsx:631-659`)
  - Review chip / Comments (server `reviewsEnabled`)
  - Presence avatars (flag `collab`, PLANNED)
  - Notifications, Preview, Publish/next-move CTA (`lifecycle.ts`), ⋯ Site menu
- **Not in the topbar:** undo/redo, zoom and breakpoint (they are in the canvas footer), search, Share.
- **Evidence:** CODE/REACH.

### A3 Left rail and sidebar routing
- `rail/tabsConfig.ts` has 13 tab entries; the rail renders only `RAIL_FIGMA`: add, layers, pages, assets, content(CMS), design(Brand), then a Help button (`sidebar/LeftSidebar.tsx:209-249,451-462`).
- Templates, Settings, Components, Publish, History, Activity and Review are reached through letters (`sidebar/useSidebarKeyboard.ts`), the site menu, the palette or deep links.
- State lives in `useStudioState` and is persisted to localStorage `buildrick-panel-state` (`useStudioState.ts:21,190-216`).
- Every switch goes through `useTabSwitchGuard`.
- Routers: `sidebar/TabRouter.tsx:143-258` for panels and `sidebar/FullPageRouter.tsx` for full pages.
- **Evidence:** CODE/REACH.

### A4 Full-page tools
Templates, Assets library, Settings and Brand are portals at `fixed inset-0 z-overlay`. Each owns its Escape and unsaved guard. Close returns to `prevDrawerTabRef` (`StudioPanels.tsx:759-767`), and the canvas selection is restored on return (`:575-588`). CODE/REACH.

### A5 Site menu (`shell/SiteMenu.tsx:149-262`)
- Site settings ⌃,
- Export, Duplicate site, Issues, Activity log, Command palette, Enter view mode (EDITOR+), Keyboard shortcuts ⌘/, Share preview link, Copy live URL, Getting started
- Start collaboration (flag; otherwise disabled "Planned")
- Unpublish (ADMIN+)
- Four external links: live site, site health, invite (ADMIN+), account

CODE/REACH.

### A6 Command palette (`shell/modals/CommandPalette.tsx`)
- **Opens with:** ⌘K (`StudioHeader.tsx:329-347`), ⌘⇧P, or the site menu. Blocked in view mode and while a modal is open.
- **Commands:** hard-coded `nav-*`, edit, view and tool rows; every engine registry command (`composer.commands.getAll()`); dynamic template, layer, asset and record rows; page rows (`usePageCommands`).
- **Recents:** localStorage `buildrick:command-recents` (max 5).
- CODE/REACH.

### A7 Keyboard
- **Engine:** `engine/commands/KeybindingManager.ts`, one capture-phase listener on window, with ⌘ and Ctrl normalised to `ctrl`. The gate is `CommandCenter.shouldHandleShortcut` (`:210-291`).
- **Shell:** `shell/hooks/useEditorShortcuts.ts` (F6, C, ⌘⇧P, ?, ⌘,, ⌘H, ⌘S, ⌘P, ⌘Z/⌘⇧Z/⌘Y, ⌘/, ⌘J).
- **Canvas:** `canvas/hooks/useCanvasKeyboard.ts` (arrows = selection navigation, Alt+arrows = reorder, ⌘/⇧+arrows = nudge, Shift+F10 = menu) and `CanvasFooterToolbar.tsx:207-263` (⌘1/2/0/=/-, ⌘; ⌘' ⌘B ⌘R ⌘⇧X).
- **Rail letters:** `useSidebarKeyboard.ts`.
- **Help:** `canvas/controls/KeyboardCheatSheet.tsx` (modal) and `KeyboardLegend.tsx` (opened from rail Help).
- CODE.

### A8 Onboarding
- `onboarding/useOnboardingOrchestrator.ts` drives the 7 steps (schema v5); `OnboardingMount.tsx` handles signals and the server sync.
- **Surfaces:** checklist pill/panel, AchievementPrompt (modal), RailCoach, CanvasEmptyCTA, FirstUseTip. All are hidden in read-only view (`OnboardingMount.tsx:268`).
- CODE/REACH.

### A9 Toasts (`chrome-ui/Toast.tsx`)
- Module-level store holding one transient toast plus pinned persistent ones.
- Errors stay until dismissed; toasts with Undo last at least 8 s; hover or focus pauses the timer.
- Bottom-right of the canvas column; z drops below modal scrims.
- `role=status` live region, polite or assertive (`:145-204,250-330`).
- CODE.

### B1 Canvas render
- Inline DOM (**not an iframe**) in a transform-scaled frame (`canvas/Canvas.tsx:741-803`).
- `useCanvasSync` → `elements.toHTML()`, one write per animation frame (`hooks/useCanvasSync.ts:28-66`).
- Editor flags `data-locked` and `data-hidden` are re-applied after each render (`hooks/useCanvasEditorFlags.ts`).
- `engine/Viewport.ts:55-183` builds an iframe that nothing calls (dead code).

### B2 Selection
- **Engine:** `engine/SelectionManager.ts` (select, add, remove, toggle, clear, selectMultiple, selectAll). `selectParent` and its siblings at `:168-219` are dead code.
- **Canvas click:** `canvas/hooks/useSelectionBehavior.ts`. Selects the deepest element; ⌘-click cycles the stack; Shift-click adds only; locked → toast.
- **Keyboard:** arrows (`useCanvasKeyboard.ts:185-255`).
- **Breadcrumbs:** only in the Inspector header (`inspector/components/InspectorHeader.tsx:89`).
- **Hover:** `useCanvasHover`, broadcast to Layers via `CANVAS_HOVER`.

### B3 Layers (`panels/layers/**`)
- Tree that follows the selection: ancestors expand and the row scrolls into view (`index.tsx:199-225`).
- Search; rename with F2 or double-click.
- HTML5 drag to reorder or reparent, with nesting and lock checks (`index.tsx:131-181,247-279`).
- Eye = editor-only hide (localStorage). Lock runs commands.
- Context menu: LayerContextMenu.

### B4 Drag-to-add and canvas drag
- **Add panel → canvas:** `canvas/hooks/useCanvasDragDrop.ts`, `hooks/drag/{useDropTargetResolver,dragCalculations,dropOperations,dropValidation}.ts`. Feedback comes from `overlays/DropFeedbackOverlay.tsx` (including DropBreadcrumb).
- **Element drag:** `useCanvasElementDrag.ts`.
- **Section reorder:** `useSectionReorder.ts` + `SectionReorderHandles.tsx`.

### B5 Resize
`overlays/SelectionHandles.tsx` → `SelectionBoxOverlay.tsx:307-312` → `hooks/useCanvasResize.ts` → `engine/canvas/ResizeHandler.ts` → `resize/*` (ResizeOrchestrator, DOMUpdater, ResizeInputManager).

### B6 Zoom, pan and fit
- `Composer.setZoom` clamps to 10–400 (`engine/Composer.ts:1365-1373`). Presets via `stepZoom`.
- Footer zoom menu and chords. Fit to screen and to selection (`Canvas.tsx:318-361`).
- **No wheel or pinch zoom, and no space-drag pan.** Panning is native scrolling.

### B7 Lock and hide
- **Lock:** the `lock-element` / `unlock-element` commands. Gate functions are in `engine/commands/commandOperations.ts:40-53,192-234`.
- **Hide:** an editor-only `data-hidden` attribute (opacity .25, `canvas/Canvas.css:280-283`). Visibility on the published site is the Inspector's Visibility section.

### B8 Multi-select and marquee
- Shift-click on the canvas; ⌘ and Shift ranges in Layers.
- Marquee: `hooks/useCanvasMarquee.ts`.
- Inspector `MultiSelectBar` (align, distribute, group).

### B9 Selection toolbar
`canvas/controls/UnifiedSelectionToolbar.tsx` (Duplicate, Delete, More), with the caption line.

### B10 Context menus and element actions
- **Canvas:** `canvas/menus/ElementContextMenu.tsx` + `contextMenuRegistry.ts` + `actions/{standalone,edit,insert,layout}Actions.ts`.
- **Registry SSOT:** `editor/shared/elementActions.ts`.
- **Other menus:** Layers `LayerContextMenu.tsx`, Pages `PageContextMenu.tsx` (shared Menu primitive), Inspector ⋯ `InspectorElementMenu.tsx`.
- **Openers:** right-click, Shift+F10, toolbar More (`hooks/useCanvasContextMenu.ts:63-114`).

### B11 Group, wrap, clipboard, arrange
- **Engine commands** (`engine/commands/defaultCommands.ts`): group, ungroup, duplicate, copy, cut, paste, copy-style, paste-style, bring-*/send-*.
- Wrap and unwrap: `canvas/menus/actions/insertActions.ts`, `canvas/utils/wrapInContainer.ts`.
- Clipboard: in-memory `composer.clipboard` (`Composer.ts:127`).

### G1 History
- `engine/HistoryManager.ts`: JSON patches, a checkpoint every 10, maximum 100, 500 ms coalescing, **one global stack across pages**.
- Transactions: `Composer.beginTransaction`, `endTransaction`, `rollbackTransaction` (full-project snapshot, `Composer.ts:1263-1328`).

### G2 Save
- **Autosave:** `shell/hooks/useComposerInit.ts:610-922` (1 s debounce, `changeSeq`, retry backoff 5 s→60 s, `online` retry).
- **Server:** `services/BuildrikSyncProvider.ts:781-878` → `sites.saveProject` (`server/trpc/routers/sites.ts:364-440`, EDITOR+) → `saveProjectData` compare-and-swap on `Site.lastEditedAt` (`server/services/sites.service.ts:~1059-1092`).
- **Manual save:** `shell/hooks/useSaveCallback.ts`.
- **Kept unsaved work:** `services/unsavedRecovery.ts`.

### G3 Conflict and recovery
- **Conflict:** `buildrik:save-conflict` event → `ConflictModal` (Reload / Save backup / Overwrite) (`AquibraStudio.tsx:408-418,830-860`). `useSaveConflict` makes the Inspector and PagePanel read-only.
- **Recovery:** RecoveryBanner reads a crash marker (`shell/RecoveryBanner.tsx`, `engine/recovery/RecoveryManager.ts:93-108`).
- **Startup:** the "Some work never reached the server" toast with Restore (`useComposerInit.ts:323-372`).
- **Other banners:** LoadErrorBanner, SaveFailedBanner.

### G4 Escape and focus
- Roughly 57 independent Escape listeners, coordinated through DOM checks: `hasOpenEscapeSurface()` (`shared/utils/openEscapeSurface.ts`), `isModalOpen()` (`chrome-ui/focus.ts:120-125`), `data-bk-escape-owner` (`shell/hooks/useColumnPanelEscape.ts`), `data-bk-pick`.
- Modal focus trap and focus return: `OverlayMount` / `useFocusTrap` (`chrome-ui/focus.ts:83-103`).
- F6 cycles regions (`shell/regionCycle.ts`).

---

## 2. Screen and flow inventory (my scope)

| Family | Surface | File |
|---|---|---|
| Shell | Topbar / StudioHeader, Save pill, Notifications panel, Site menu, exit dialog | `shell/StudioHeader.tsx`, `chrome-ui/Topbar.tsx`, `chrome-ui/SaveStatus.tsx`, `shell/NotificationPanel.tsx`, `shell/SiteMenu.tsx` |
| Shell | PageTabBar (switch only; "+" opens Pages) | `shell/PageTabBar.tsx` |
| Shell | Recovery banner, Load-error banner, Save-failed banner, ConflictModal, SessionExpiredModal, UnsavedTabSwitchDialog | `shell/RecoveryBanner.tsx`, `shell/LoadErrorBanner.tsx`, `shell/SaveFailedBanner.tsx`, `shell/AquibraStudio.tsx:830-963` |
| Shell | ViewerRoleNotice, TimeTravelHost band, PermissionsHost | `shell/ViewerRoleNotice.tsx`, `shell/TimeTravelHost.tsx`, `shell/PermissionsHost.tsx` |
| Rail | Rail (6 + Help), drawer, KeyboardLegend quick card | `sidebar/LeftSidebar.tsx`, `canvas/controls/KeyboardLegend.tsx` |
| Full page | Templates, Asset library, Settings, Brand; CMS workspace (in-canvas layer) | `sidebar/FullPageRouter.tsx`, `cms/CmsWorkspace.tsx` |
| Overlays | Command palette, Keyboard cheat sheet, Preview overlay | `shell/modals/CommandPalette.tsx`, `canvas/controls/KeyboardCheatSheet.tsx`, `shell/PreviewOverlay.tsx` |
| Onboarding | Checklist pill/panel, AchievementPrompt, RailCoach, CanvasEmptyCTA, FirstUseTip | `onboarding/*`, `canvas/CanvasEmptyCTA.tsx`, `sidebar/tabs/build/components/FirstUseTip.tsx` |
| Canvas | Frame, hover outline, selection box and handles, SelectionLabel, UnifiedSelectionToolbar, marquee, drop feedback and DropBreadcrumb, section reorder handles, lock badge | `canvas/Canvas.tsx`, `canvas/overlays/*`, `canvas/controls/UnifiedSelectionToolbar.tsx` |
| Canvas | Footer toolbar: undo/redo, View menu (overlays, Breakpoint ▸, Grid ▸, Zoom ▸), zoom %, selection readout | `canvas/CanvasFooterToolbar.tsx` |
| Menus | Canvas element menu (+ submenus), Layers menu, Pages menu, Inspector ⋯ | `canvas/menus/*`, `panels/layers/components/LayerContextMenu.tsx`, `sidebar/tabs/pages/components/PageContextMenu.tsx`, `inspector/components/InspectorElementMenu.tsx` |
| Panels | Layers tree + search, History tab | `panels/layers/**`, History tab (`HistoryTab.tsx`) |
| Controls | Toast, Menu/MenuItem, Popover, Breadcrumb, BreakpointSwitcher (Preview only) | `chrome-ui/*` |

---

## 3. Control traces

1. **Click on canvas element.**
   - Path: `useSelectionBehavior` → `findElementWithHitExpansion` (closest `[data-buildrick-id]`) → `SelectionManager.select` → ELEMENT_SELECTED → overlays, inspector and Layers (expand + scroll).
   - No persistence. Selection is not in history (`HistoryManager.ts:601-637` re-points it after restore).
   - **Break:** a locked element can't be clicked, but arrow keys, Layers and right-click all select it (`Canvas.tsx:709` has no lock check).

2. **Drag Add-panel block onto canvas.**
   - Path: `dataTransfer "block"` (`useBuildTab.ts:77`) → `useDropTargetResolver.resolve` (before / after / inside + `validateDropOperation`) → drop → `handleBlockDrop` → `canNestElement` → `insertBlock` inside the `insert-block-drop` transaction → select + Undo toast → PROJECT_CHANGED → autosave → `sites.saveProject`.
   - **Break 1:** hover validation for blocks only checks `canNestElement("container", target)` (`dragCalculations.ts:145-161`). A drop shown as valid can be refused on release.
   - **Break 2:** no lock check, so blocks can be dropped into a locked container.

3. **Resize via handle.**
   - Path: handle mousedown → `ResizeHandler.startResize` (beginTransaction, bounds in **screen px**) → DOM-only moves → mouseup `finishResize` → `applyBoundsToModel` (lock gate, active breakpoint, writes width **and** height in px) → `endTransaction` → autosave.
   - **Breaks:** CAN-01 (zoom), CAN-02 (keyboard NaN), CAN-03 (cancel undoes the previous entry); an absolute element's `left/top` is measured from the canvas rather than its offset parent; multi-resize changes only the primary element (`additionalElementIds` is always `[]`, `ResizeHandler.ts:142`).

4. **Right-click → menu action.**
   - Path: `Canvas.handleContextMenu` (selects the target unless it is part of the current multi-selection) → `useCanvasContextMenu` freezes the registry rows → row handler → `composer.commands.run(id)` → engine command (lock-gated where `commandOperations` is used).
   - **Breaks:** disabled reasons are dropped (IA-03); Group can silently do nothing (IA-04); Ungroup and Arrange ignore locks; the menu isn't clamped (IA-15).

5. **⌘Z.**
   - Path: `useEditorShortcuts.ts:183-194` → `composer.history.undo()` directly (**bypasses the `CommandCenter.run` read-only gate**) → `importScoped` keeps the active page → `history:undo` → autosave.
   - **Breaks:**
     - undo can change a page that isn't on screen (single global stack);
     - it isn't gated by full-page surfaces, so ⌘Z in Settings/Brand/Templates (focus not in a field) undoes canvas work out of sight;
     - it isn't blocked in TimeTravel (D-05).

6. **⌘S (dashboard-bound site).**
   - Two listeners fire. Engine `save` (capture) → `composer.saveProject()` → storage `none` → `markSaved()` → `PROJECT_SAVED` (dirty page dots cleared). Shell `useEditorShortcuts` (bubble) → `useSaveCallback` → `saveProject(siteId, …)` → tRPC.
   - **Break:** with focus in an input, only the engine path runs (D-02).

7. **Autosave.**
   - `project:changed` / `history:*` / `version:restored` → 1 s debounce → `BuildrikSyncProvider.saveProjectNow` (refuses an unloaded project or a pending conflict) → `sites.saveProject` (EDITOR+) → compare-and-swap on `lastEditedAt`.
   - On CONFLICT: `buildrik:save-conflict` → ConflictModal.
   - On failure: `bk-unsaved-v1-<siteId>` in localStorage, then retry.
   - Applied (DOM) → saved (server draft) → published (separate publish job). The topbar pill shows the saved state.

8. **Escape.**
   - Order: the engine `deselect` (window capture, registered first) stands down for popups, pick mode and escape owners → column panels (`useColumnPanelEscape`) → full-page tools' own handlers → modal focus traps (document capture, `stopPropagation`).
   - **Unclear (unverified):** in Layers, the engine deselect probably runs before `LayersTab.tsx:181-196`, which then closes the drawer in the same press.

9. **⌘D on a focused page row.** See PAGE-01. The chain reaches the wrong owner.

10. **Rail letter "B" while a page row or a button is focused.** `useSidebarKeyboard` → `UI_SWITCH_TAB` → full-page Brand. It is not blocked inside full-page surfaces or `<select>`. Not verified whether typing letters in Brand (outside inputs) switches tabs — LIVE #9.

---

## 4. State coverage

| Family | empty | loading | hover | focus | selected | disabled | read-only | validation-error | saving | saved | unsaved | failure | conflict | recovery |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Topbar / save | – | StudioSkeleton (`AquibraStudio.tsx:592`) | yes | yes | – | Publish blocked = aria-disabled + tooltip (`Topbar.tsx:340-367`) | view mode strips the pill (`StudioHeader.tsx:795`) | – | `saving` | `saved` | `unsaved` | `error` → retry | `conflict` → modal | `offline`. Recovery banner and toast (`useComposerInit.ts:323-372`) |
| Canvas | CanvasEmptyCTA | canvas waits for composer | hover overlay | handles focusable (keyboard broken) | selection box, multi box | locked: no handles, badge | `readOnly` stops mutating commands; click-select still works | invalid drop: `data-invalid-drop`, toast | – | – | dirty page dots (`useDirtyPages`) | toasts | – | – |
| Layers | search "no results" (not traced) | – | `CANVAS_HOVER` sync | rows focusable | yes | Rename disabled for multi, Paste disabled + title | VIEWER sees Layers | – | – | – | – | – | – | – |
| Context menus | hidden when no actions | – | yes | canvas: activedescendant (HEAD broken for submenus); Layers: native buttons, no roving | – | canvas: boolean only (no reason); Pages: reason text | – | – | – | – | – | Group: silent failure | – | – |
| Palette | "Search stock / Ask AI" when no match | async records | yes | combobox; no trap | active row | – | blocked in view mode | – | – | – | – | – | – | – |
| Full-page tools | per tool | lazy Suspense | – | Settings focuses its nav; others not; covered chrome not inert | – | – | – | Settings/Brand guards | – | – | Brand/Settings dirty guards | – | – | – |
| History / undo | `canUndo` false → footer disabled | – | – | – | – | `HistoryTab.tsx:217` | footer undo still enabled for VIEWER (bypass) | – | – | – | – | – | – | Restore resets the stack (no undo) |
| Onboarding | – | server sync | – | Achievement focus-trapped | active step | – | hidden | – | – | – | – | – | – | Replay from the site menu |

---

## 5. Ownership rows

| Property/action | Editing location(s) | Value owner | Scope | Local / inherited / shared | Who may change (role check) | Side effects | How source is shown | Reset / revert | Applied vs saved vs published |
|---|---|---|---|---|---|---|---|---|---|
| Element width/height via canvas resize | Canvas handles; Inspector Size | `element.styles` at the **active breakpoint** (`stylesAt(…activeBreakpoint)`, `DOMUpdater.ts:115`) | element × breakpoint | local override at the breakpoint | Server EDITOR+ (`sites.ts:368`); client lock gate | Writes **both** axes even on a one-axis drag; `expandParent` grows the parent's DOM | On Desktop the breakpoint isn't visible (UX-06), so users can't tell which scope they are writing | Undo; Inspector per-breakpoint revert; **Escape-cancel undoes a different edit** (CAN-03) | DOM immediately → autosave 1 s → server draft → publish separately |
| Lock | Layers lock icon, menu Lock/Unlock, Inspector ⋯ | `element.locked` | element (no cascade to children) | local | EDITOR+ (server); `readOnly` blocks the commands | Lock gate refuses some writes and emits a "locked" toast | Badge, dotted outline, Layers icon | Unlock; a duplicated clone is unlocked automatically (`defaultCommands.ts:174`) | Saved with the project; no effect on the published site |
| Hide (eye) | Layers eye | localStorage `hiddenIds` (`useLayerActions.ts:121-145`) | **this browser only** | device-local | anyone | Canvas opacity .25, pointer-events off | Eye tooltip says "editor only" (`LayerTreeItem.tsx:343-369`) | Toggle | Never saved to the server and never published. The eye looks like Webflow's hide/display:none, so the editability is misleading |
| Element order (Arrange "Bring to front") | Canvas menu Arrange, ⌘]/⌘[ | parent `children` order | parent | local | EDITOR+; **no lock check** | Changes the visual flow order, not z-index | Label says "front/back" | Undo | Applied → saved → published |
| Group / Ungroup | Canvas menu, ⌘G/⌘⇧G, Inspector MultiSelectBar, Layers Group | tree | parent | – | **three eligibility rules** (menu: count; engine and Inspector: shared parent; Layers: any) | Layers Group reparents across branches; Ungroup ignores locks | none | Undo | – |
| Clipboard | ⌘C/⌘X/⌘V, menu Copy/Cut/Paste, Layers | `composer.clipboard` (memory) + OS clipboard (menu only) | session tab | – | Paste/Cut are mutating commands (read-only blocks them) | Menu Cut writes only the **clicked** element to the OS clipboard while cutting the whole selection (`editActions.ts:56-67`) | – | – | Clipboard is lost on reload; no cross-tab or OS paste |
| Undo stack | ⌘Z, footer, palette, History tab, toast Undo | `HistoryManager` | **whole project, all pages** | – | **no read-only check** on ⌘Z or the footer | Can change an off-screen page; cleared by load, restore and "Restore my edits" | Footer disabled state only | – | Undo is persisted by autosave |
| Breakpoint / device | View ▸ Breakpoint, palette device-* | `composer` state (Viewport) | editor session | – | anyone | Changes which breakpoint every style write targets | Hidden on Desktop | – | Not saved |
| Panel layout (drawer tab) | Rail, letters | localStorage `buildrick-panel-state` | device | – | – | – | – | – | – |
| Onboarding progress | Checklist | localStorage + server `completeEditorTask` | user | – | – | Achievement modal | Pill N/7 | Replay | – |
| Save / overwrite on conflict | ConflictModal | `Site.lastEditedAt` compare-and-swap | site | – | EDITOR+ | Overwrite replaces the server draft; the full snapshot **deletes pages missing from the payload** (`sites.service.ts:~1137-1146`) | Modal copy | Reload / backup | Draft only |

**Flags:**
- **Silent global effects:** ⌘Z touches other pages and runs behind full-page tools. The full-snapshot save deletes missing pages.
- **Misleading editability:** the Hide eye; "Bring to front".
- **Competing surfaces:** Group in three places with three rules; disabled reasons shown in the Inspector but not the canvas menu.

---

## 6. Gap candidates vs Webflow

Webflow capabilities are stated from memory; to be confirmed by the doc agent.

| Area | Buildrik evidence | Webflow capability (memory) | Classification | User impact | Suggested change | P |
|---|---|---|---|---|---|---|
| Resize at zoom | CAN-01/D-01 | Canvas resize is consistent at any zoom | Partial implementation (defect) | Elements shrink; data corruption on a common gesture | Divide deltas and bounds by `canvasScale`; write only the active axis | P0 |
| Cancel gesture | CAN-03 | Esc cancels only the gesture | Defect | An accepted edit is lost silently and autosaved | Transaction-local rollback; never call `history.undo()` for cancel | P0 |
| Keyboard resize | CAN-02 | n/a (Webflow uses numeric fields) | Defect | `NaNpx` stored | Guard finite values; arrow-key resize on a focused handle | P0 |
| Breakpoint visibility | UX-06 | Breakpoint bar always visible at the top of the canvas; styles cascade from desktop down | Implemented but undiscoverable | Users don't know which scope they are editing | Persistent breakpoint switcher plus a scope chip on Desktop too | P1 |
| Pan / zoom | No wheel/pinch zoom, no space-pan (`Canvas.tsx`, `ProInspector.tsx:289` is the only wheel listener) | Webflow has a zoom control and native scroll (no free pan; memory) | Partial / not verified | Navigating long pages is slower | Add ⌘+wheel zoom and space-drag pan | P2 |
| Navigator hide | Editor-only eye | Webflow: hide via display:none per breakpoint, published | Ownership ambiguity | Users expect the eye to hide on the live site | Rename to "Hide on canvas" or route it to the Visibility style | P1 |
| Navigator drag | One row at a time, no keyboard reorder | Multi-select drag in the Navigator | Partial | Slower restructuring | Multi-drag; keyboard move in Layers | P2 |
| Context menu | Reasons dropped, no clamping, HEAD submenus broken by keyboard | Webflow right-click menu is consistent | Inconsistent interaction | Actions silently fail or are unreachable | Land the working-tree fix; carry reasons; clamp | P1 |
| Arrange | Sibling reorder labelled as stacking | Webflow: Move up/down in the Navigator; z-index is a style property | Inconsistent | Wrong mental model | Rename to Move earlier/later/first/last | P2 |
| Group | Three rules | Wrap in div / Div block | Inconsistent | Silent no-op | One eligibility function with a reason | P2 |
| Paste in place / OS clipboard | None; no OS paste | Webflow copy/paste works between projects via the OS clipboard (XscpData) | Missing capability | No cross-site reuse | Read/write the OS clipboard with a schema'd payload | P2 |
| Undo scope | One global stack; cleared by restore | Webflow undo is per-session and global too (memory) | Intentional difference / Not verified | Undo can change an off-screen page | Switch to the page whose edit is being undone | P2 |
| Focus isolation | No inert; Brand host is missing its surface attribute | – | Missing state (a11y) | Keyboard users wander; shortcuts mutate the hidden canvas | `inert` on covered chrome; one route policy | P1 |
| Command palette | Substring only, no ranking | Webflow Quick Find (⌘E) | Partial | Discovery | Fuzzy ranking, edit-first defaults, keyboard legend | P3 |
| Onboarding | Five uncoordinated surfaces; modal over Preview | Webflow uses sparse inline hints | Inconsistent | Interrupts first tasks | One orchestrator queue; no modal over Preview | P2 |
| Conflict handling | Compare-and-swap + modal (good); restore bypasses it (D-04) | Webflow: single-designer lock / page-branching | Partial | Silent overwrite of a teammate's work | Use the snapshot's original baseline for Restore | P1 |
| Layout < 1366 | IA-12 CSS conflict | Webflow has a fixed panel layout | Defect | Canvas squeezed and the inspector overlaps | Fix the specificity; set a minimum canvas width | P2 |
| Selection model | Click selects the deepest element; double-click drill is mostly a no-op | Webflow: click selects the deepest; breadcrumb on the canvas bottom bar | Partial | Hard to select a parent of nested content (only ← key or the Inspector crumb) | Canvas breadcrumb bar; ⌘-click cycle hint | P2 |

---

## 7. Exists in code but hidden or poorly exposed

- **Templates, Settings, Components, Publish, History, Activity and Review** have no rail button (`tabsConfig.ts:294-296`). They are reachable only by letter keys, the site menu, the palette or deep links. The letter keys aren't shown on the rail.
- **Breakpoint switching:** only View ▸ Breakpoint or palette `device-*`. The "Wide" breakpoint is palette-only (`defaultCommands.ts:636-645`).
- **Selection navigation keys** (←/→ parent/child, ↑↓ siblings, Home/End, Alt+arrows reorder, Shift+F10 menu; `useCanvasKeyboard.ts`) appear only in the cheat sheet.
- **⌘-click stack cycling** (`useSelectionBehavior.ts:75-120`) has no visible hint.
- **Zoom to selection ⌘2, X-ray ⌘⇧X, rulers ⌘R** live in the footer only.
- **F6 region cycling** (`regionCycle.ts`).
- **Palette nudge commands** behave differently from the arrow-key nudges (`commandOperations.ts:95-113` vs `keyboardHelpers.ts:103-123`).
- **Inspector disabled-action reasons** exist but aren't shown in the canvas menu.
- **`SelectionManager.selectParent` etc.** are dead code (`:168-219`). **`engine/Viewport.ts` iframe** is dead code.
- **Layers `moveToTop` / `moveToBottom`** (`useLayerActions.ts:287-312`) have no UI.
- **Collaboration presence** and "Start collaboration" are flag `collab` (PLANNED; the engine's collaboration module is demo-only per `engine/AGENTS.md`).

---

## 8. Preserve

- **One element-action registry** (`editor/shared/elementActions.ts`) and **one command registry** (`CommandCenter.register` throws on duplicate ids, `:105-117`). The read-only gate sits at the `run()` gateway (`:142-148`).
- **Shortcut carve-outs in `CommandCenter.shouldHandleShortcut`:** text fields keep ⌘A/C/V/X/Z, an open modal owns the keyboard, full-page surfaces own keys, and Escape goes to the innermost surface via `hasOpenEscapeSurface()`. This is a thoughtful single gate.
- **Lock gate** `writeElement` / `writableElements` with a "locked" toast.
- **Delete confirms for more than one element**, and focus moves to a sibling.
- **Save pipeline:**
  - server compare-and-swap on `lastEditedAt`;
  - a `changeSeq` race guard in autosave;
  - `ProjectNotLoadedError` and `EMPTY_SNAPSHOT` refusals;
  - unsaved-work recovery that is offered, not auto-applied;
  - 403 → view mode while keeping the work;
  - a ConflictModal with backup;
  - a `beforeunload` guard that also counts in-flight saves.
- **Toast policy:** one transient, persistent errors, Undo kept at least 8 s, live region.
- **Layers ↔ selection sync** (expand + scroll), lock-aware drag in Layers.
- **Viewer route** forced to read-only on the server side, and server role checks on save.
- **Pages menu** uses the shared Menu primitive with explicit reasons (homepage can't be deleted).
- **Selection toolbar** moves outside small elements and counter-scales.

---

## 9. Defects found in code

| # | Defect | Location | Failure scenario | Sev |
|---|---|---|---|---|
| D-01 | **Click-release on a resize handle at non-100% zoom rewrites the size** (CAN-01 extension) | `canvasGeometry.ts:53-66`, `ResizeOrchestrator.ts:44-45`, `DOMUpdater.ts:117-118` | At 50% zoom, mousedown + mouseup on a handle of a 400×80 element with no movement: `startBounds` is 200×40 (screen px), so the model stores `width:200px; height:40px` | P0 |
| D-02 | **⌘S fires two save paths; the engine one claims "saved" without saving** | `defaultCommands.ts:80-85` (`ctrl+s`), `Composer.saveProject` → storage `none` (`useComposerInit.ts:222`, `StorageAdapter.ts:127`) → `markSaved()` (`Composer.ts:745-783`); shell `useEditorShortcuts.ts:167-170` returns early in inputs (`:108-113`) | Focus in the page-name field, edit, press ⌘S: `PROJECT_SAVED` clears the dirty page dots (`useDirtyPages.ts:87`) and `state.dirty=false`, but no server request is sent from ⌘S. Focus elsewhere: both run; if the server save fails, the dots are already gone | P2 |
| D-03 | Manual save marks dirty=false unconditionally | `useSaveCallback.ts:214-219` | ⌘S, type during the round trip, close the tab within 1 s: `beforeunload` sees a clean state and the last edit is lost | P1 |
| D-04 | "Restore my edits" overwrites newer server work without a conflict | `useComposerInit.ts:351-366`, `useSaveCallback.ts:208-209`, compare-and-swap baseline from the fresh load | User A's save fails offline; B saves; A reloads (baseline = B's time) and clicks Restore. A's old full snapshot passes the compare-and-swap; B's edits are overwritten and pages B created are deleted | P1 |
| D-05 | Undo bypasses the read-only state (TimeTravel / view mode) | `useEditorShortcuts.ts:188-194`, `Canvas.tsx:956-958`, `HistoryManager` has no readOnly check, `TimeTravelHost.tsx:100-110` | During a time-travel preview (`composer.readOnly=true`) ⌘Z mutates the live document; autosave persists it while the band says nothing is written | P1 |
| D-06 | ⌘Z and the "C" key are not gated by full-page surfaces | `useEditorShortcuts.ts` has no `data-bk-surface` check (contrast `CommandCenter.ts:220-226`) | In Settings, Templates or Assets with focus on a button, ⌘Z undoes the last canvas edit out of sight (autosaved); "C" toggles comment mode behind the surface | P1 |
| D-07 | Brand host lacks `data-bk-surface="fullpage"` | `FullPageRouter.tsx:188-191` | Select an element, open Brand, focus any Brand button and press Backspace or Delete: the engine `delete` passes `shouldHandleShortcut` (no input, no widget role) and deletes the hidden canvas element; ⌘D duplicates it; ⌘G groups | P1 |
| D-08 | PAGE-01 consequence: ⌘D on a page row duplicates the selected element | `PageRow.tsx:247-258`, `CommandCenter.ts:260-279` | Select a heading, focus a page row, ⌘D: the heading is duplicated; the page isn't | P1 |
| D-09 | Resize cancel also fires on unmount | `ResizeHandler.ts:444` | Navigating or remounting mid-drag runs `cancelResize` → `history.undo()` | P1 |
| D-10 | Right-click selects locked elements; the menu then offers Ungroup, Group and Arrange, which skip locks | `Canvas.tsx:709`; `standaloneActions.ts:63-73`; `commandOperations.ts:123-170`; `ElementManager.ts:190-253` | Right-click a locked container → Ungroup → it is dissolved | P2 |
| D-11 | Lock isn't checked on canvas drops, section reorder, paste-into or Layers moveToTop/Bottom; it doesn't cascade | `dropOperations.tsx`, `useSectionReorder.ts:259-298`, `defaultCommands.ts:306-385` | Drop a block into a locked section: it is accepted | P2 |
| D-12 | ⌘/Ctrl-drag duplicate leaves a clone when the drag is cancelled | `useCanvasElementDrag.ts:216-235,368-395` | ⌘-drag an element, press Esc or drop outside: a stray copy remains | P2 |
| D-13 | Multi-element drop skips nesting checks and treats "inside" as "after" | `dropOperations.tsx:68-152,133` | Drag two elements "into" a container: they land as siblings, possibly where nesting is illegal | P2 |
| D-14 | Hover validation is wrong for blocks | `dragCalculations.ts:145-161` | The drop indicator shows valid, then release gives a `NESTING_FORBIDDEN` toast | P3 |
| D-15 | Marquee drawn at the wrong size when zoomed; it rarely starts (root carries `data-buildrick-id`) | `useCanvasMarquee.ts:58-64`; `canvasStyles.ts:126-142` | At 50% zoom the drawn rectangle is twice the pointer path. Starting inside the page root doesn't start a marquee at all | P2 |
| D-16 | Resize overlay jumps at drag start (screen-px `currentBounds` drawn inside the scaled frame) | `SelectionBoxOverlay.tsx:317-324` vs `:210-217` | Zoom 50%: the outline doubles while dragging | P2 |
| D-17 | Menu Cut / Copy write the wrong payload to the OS clipboard | `canvas/menus/actions/editActions.ts:25-35,56-67` | With three elements selected, menu Cut writes only the clicked one; a refused copy still writes the previous clipboard | P3 |
| D-18 | IA-01 at HEAD: canvas submenus can't be reached by keyboard and render at (0,0); click on a parent does nothing | `git show HEAD:…/ElementContextMenu.tsx:96-152`, `SubmenuItem.tsx:38-66,102` | Shift+F10 → → on Style: the panel appears at the top-left of the viewport and ↓ closes it | P1 (fix is uncommitted) |
| D-19 | IA-12 specificity conflict below 1366px | `LayoutShell.css:187-193` vs `:333-358` | At 1280 wide with the drawer and inspector open, the 300px inspector track stays and the inspector also floats absolute at top:56 | P2 |
| D-20 | `rollbackTransaction` leaves a clean project dirty and jumps to page 1 | `Composer.ts:1252-1254,1322-1323`; `importProject` resets the active page | A rejected drop on page 3 of a clean project: the view jumps to page 1 and "Leave site?" now prompts | P2 |
| D-21 | Group can silently do nothing (IA-04); Group duplicated in the command and the menu row (AGENTS.md "re-implementing is a defect") | `standaloneActions.ts:40-56` vs `defaultCommands.ts:125-137` | Cross-parent selection → Group → nothing happens and no message | P2 |
| D-22 | `MUTATING_COMMANDS` misses `nudge-*-large`, `add-*`, `paste-html`, `replace-media`, `save-template` | `CommandCenter.ts:66-72` | Latent only: the palette is blocked in view mode (`StudioHeader.tsx:336`), but a future caller of `run("add-text")` in read-only would mutate | P3 |
| D-23 | The recovery banner effectively never shows and consumes its crash marker at mount | `RecoveryBanner.tsx:55-57,83-87,117` (agent-read; verify) | Siteless: never shows. Site: needs a failed load plus a publish-state fetch | P3 |
| D-24 | Page writes via `pages.*` don't bump `Site.lastEditedAt` | `server/services/page.service.ts:55-135` (agent-read) | A direct API page edit is overwritten or deleted by the next editor full-snapshot save with no conflict (no UI caller found) | P3 |

**Uncommitted working-tree diff** (`git diff -- packages/editor/src/editor/canvas/menus`, 5 files, +139/−90). Not part of df60cf9ec:
- per-level keyboard navigation (submenu index), Home/End/Space, Tab closes;
- the menu owns Escape (`closeOnEscape` removed);
- `aria-expanded` reflects the open state;
- submenu position measured in `useLayoutEffect` with flip and clamp;
- click on a parent opens the submenu.

It still does **not** clamp the main menu, carry disabled reasons, or sync mouse hover to `submenuIndex`.

---

## 10. Live checks needed

All at `http://localhost:3300/edit/<siteId>`, viewport 1440×900 unless stated. Use a disposable site with at least two pages and a section holding a heading.

1. **UX-01 empty CTA clipping.** Resize to 1280×720. Create a new blank page. Measure `document.querySelector('.bd-canvas-empty-cta')`: compare each child's `getBoundingClientRect()` top/bottom against the parent's and against `.bd-canvas-scroll`'s rect. Expected pass: the title "This page is empty" top ≥ container top, and the "Start blank" button bottom ≤ the visible scroll viewport bottom.
2. **UX-04 stacked surfaces.** On a fresh profile (clear localStorage `buildrick-onboarding-*`), create a second page from the Pages "+". Within 1 s, count `document.querySelectorAll('[role=dialog][aria-modal=true]').length` and list their `aria-labelledby` texts. Expected per the claim: at least 2 (page-created + `achievement-card`).
3. **UX-07 toolbar / label overlap.** Select a button element narrower than 176px. Read the rects of `[data-testid*=selection-label]` (or `.bd-selection-label`) and the toolbar pill. Expected defect: the rects intersect. Repeat with the first heading of the page at the top of the frame (no room above).
4. **UX-13.** Fresh onboarding state. Click topbar Preview. Expected defect: `[data-testid=achievement-card]` is visible above the preview overlay. Compare `getComputedStyle(card).zIndex` with the preview overlay's.
5. **IA-12.** Resize to 1280×800 with the drawer and inspector open. Read `getComputedStyle(document.querySelector('.layout-shell')).gridTemplateColumns`, `getComputedStyle(document.querySelector('.layout-shell__inspector')).position`, and the inspector rect. Expected defect: the last column is 300px **and** position is absolute.
6. **CAN-01 / D-01.** Select the heading. `composer.setZoom(50)` (or footer zoom 50%). Note `composer.selection.getSelected().getStyles()` width/height (or `getComputedStyle(el).width`). Press and release the right-edge handle with no movement. Expected defect: the stored width is about half the original, and height changed too. Repeat with a +20px screen drag; expect the CSS width = original/2 + 20.
7. **CAN-02.** At 100%, Tab to the right resize handle, press Enter, move the mouse 10px, click. Read the element's style `width` from the model (Inspector or `getStyles()`). Expected defect: `NaNpx`.
8. **CAN-03 / D-09.** Change the heading colour via the Inspector and wait 600 ms. Start dragging a resize handle and press Escape before releasing. Read `getComputedStyle(heading).color`. Expected defect: the colour reverted. Then reload after 2 s and confirm the server copy lost the colour (network: a `sites.saveProject` POST after Escape).
9. **D-06/D-07 full-page key leakage.** (a) Edit the heading text, open Settings (⌃,), click the Settings nav (not an input), press ⌘Z, close Settings. Expected defect: the text edit is undone. (b) Select the heading, open Brand (rail B), click a non-input Brand button, press Backspace, close Brand. Expected defect: the heading is gone (count `[data-buildrick-id]` before and after). (c) In Brand, press "L". Does the rail switch tabs?
10. **PAGE-01 / D-08.** Select a canvas heading. Open Pages, click a page row (focus it, not its rename input), press ⌘D. Count the pages (`[data-testid^=page-row-]`) and `[data-buildrick-id]` elements before and after. Expected defect: pages unchanged, elements +1 (or more for a subtree).
11. **IA-01 at HEAD vs working tree.** On a build of df60cf9ec (without the working-tree diff), right-click the heading, ArrowDown to Style, ArrowRight. Read the submenu panel rect. Expected defect: left/top ≈ 0. Press ArrowDown: the submenu closes. Repeat with the working tree applied.
12. **IA-15.** Right-click the element closest to the bottom-right corner of the canvas at 1280×720. Expected defect: the menu rect's bottom > `innerHeight` or right > `innerWidth`. Same check for the Layers menu (right-click the last Layers row).
13. **MENU-01.** Right-click a Layers row, press ArrowDown. `document.activeElement.dataset.testid` stays `layer-menu-cut` (defect).
14. **IA-04 / D-21.** Shift-click the heading and an element from a different section. Right-click → Group. Expected defect: the element count is unchanged and no toast appears. Compare the Inspector MultiSelectBar Group, which should be disabled.
15. **D-02 double save.** Network panel. Focus outside inputs, edit, ⌘S: count `sites.saveProject` requests (expect 1) and check whether page dirty dots clear before the response. Then focus the page rename input, type, ⌘S: expect 0 save requests from ⌘S while the dirty dot disappears.
16. **D-05.** Open a version in time-travel preview (History → a version → preview). Press ⌘Z. Watch for a `sites.saveProject` request and diff `composer.exportProject()` before and after.
17. **D-10.** Lock a container with children. Right-click it → is Ungroup offered? Click it. Expected defect: the container is dissolved.
18. **D-12.** ⌘-drag the heading and press Escape mid-drag. Count headings. Expected defect: +1.
19. **D-15/D-16.** At 50% zoom, drag a marquee in the grey gutter; compare the drawn `.bd-marquee` (or the marquee element) rect with the pointer start/end. Then start a resize and compare the selection outline width at mousedown+1px with the element's rect.
20. **D-03.** Throttle the network to Slow 3G. Edit, ⌘S, type one more character during the request, and close the tab within 1 s after the response. Expected defect: no "Leave site?" prompt, and after reload the last character is missing.
21. **D-04.** Two browsers (A, B) on the same site. In A go offline, edit, and let the save fail. In B add a page and save. In A go online, reload, and click "Restore my edits". Expected defect: B's page is deleted on the server (`pages.list`) and no ConflictModal appears.
22. **Escape in Layers (unclear item).** Select an element via a Layers row, move focus to body (click the empty rail area), press Escape once. Record whether the selection clears AND the drawer closes in one press.
23. **UX-06.** On Desktop, check whether any visible chrome text contains "Desktop" or "1440" (`document.body.innerText`) outside the View menu. Expected: none.
24. **Hide eye semantics.** Hide an element via the Layers eye, then open Preview and the exported HTML: the element is still visible (confirms editor-only).

**Not assessed in this pass:** DESIGN (Figma), CMS/brand internals, inspector property sections, publish flow, preview fidelity.

**Not verified in code:** UX-08 naming; the page-created dialog in UX-04; the Layers empty-search state; D-23 and D-24 (read by the research agent, not re-read by me).
