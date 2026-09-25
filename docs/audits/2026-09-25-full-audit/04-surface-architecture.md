# Audit 04: Surface Architecture and Panel Orchestration

**Scope:** Playbook Prompt 4 only. The audit classifies every product surface (panel, drawer, full page, modal, popover, dropdown, inline, toast/banner) and traces each one: trigger → state → rendered surface → what it replaces → what stays mounted → whether the canvas is visible and interactive → close → restore. It covers the editor shell (`packages/editor/src/editor/**`), the engine keyboard layer (`packages/editor/src/engine/commands/**`) and the dashboard hand-off surfaces (`packages/dashboard/components/**`). Agent B (Product Architecture) wrote it on 2026-09-25. The run was read-only.

---

## Method and runtime status

**What I did**

- **Traced the surface host chain in code**, from the root down: `AquibraStudio.tsx` → `StudioPanels.tsx` → `LayoutShell` → `LeftSidebar`/`TabRouter` (drawer), `FullPageView`/`FullPageRouter` (full page), `ProInspector`/`AITab` (inspector column) → `StudioModals.tsx` plus the modals mounted in the shell and in each panel.
- **Traced every keyboard path** that can switch or open a surface:
  - `useEditorShortcuts.ts`
  - `useSidebarKeyboard.ts`
  - the StudioHeader ⌘K handler
  - `useCanvasCommandPalette.ts`
  - the PagesTab ⌘K handler
  - the LibraryManager keys
  - the engine `KeybindingManager` / `CommandCenter.shouldHandleShortcut`
- **Read the z-index sources:** the `--bk-z-*` tokens (`themes/tokens.generated.css:137-146`), `Z_LAYERS` (`shared/constants/canvas.ts:260-290`) and the literal values.

**What I ran**

- **Existing unit tests** (editor vitest): `src/editor/sidebar/__tests__` (FullPageRouter, LeftSidebarRailClick, LeftSidebarCreateComponent, TabRouter.ai, TabRouter.mapping), plus `StudioPanels.openRequests`, `PreviewOverlay`, `IssuesPanel`, `useEditorShortcuts` and `AquibraStudio.wiring`. All **10 files and 75 tests passed.** None of them covers the cross-surface collisions reported below. That is why they pass.
- **A throwaway probe outside the repo** (scratchpad config and test, no repo file touched): `fullpage-delete.a04.test.ts` against the real headless `Composer` (`engine/__tests__/test-utils/realComposer`).
  - It rebuilds the DOM shape `FullPageRouter` produces: a role-less host div portaled to `body`, with a focused button inside.
  - **3 of 3 passed.** A bare Delete or Backspace, pressed while focus is on a button inside `data-testid="mgr-host"` or `"set-host"`, removed the selected canvas element.
  - The control case, the same key inside `role="dialog"`, was correctly refused.
  - This proves what the engine does. It does not prove anything about the whole app rendered end to end.

**NOT RUNTIME VERIFIED:** no browser and no database, so nothing here has been observed in the running app. In particular:

- A04-1 with the real LibraryManager and Settings mounted
- the stacked palettes (A04-3)
- the collisions between preview z-order and modals (A04-6)
- the Issues panel geometry (A04-5)
- the time-travel overlay (A04-7)
- the dashboard surfaces, which I read but did not execute

---

## Output table: surface map

The **Can coexist?** column means "can coexist with the other surfaces that are open at the same time". Unless noted, **Canvas visible** and **Canvas interactive** refer to the canvas behind or beside the surface.

| Feature | Trigger | State / store | Surface | Replaces | Can coexist? | Canvas visible? | Canvas interactive? | Close | Restore | Issue | Proof | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Add (insert) | Rail "Add", `A`, ⌘K | `useStudioState.leftPanelTab` (persisted in localStorage) | Left drawer (280, can expand to 700) | Previous drawer tab (TabRouter unmounts it) | Inspector: yes | Yes | Yes | Click the active rail icon again (drawer stays mounted, `inert`) | Drawer tab restored on reload | — | `TabRouter.tsx:147`, `LeftSidebar.tsx:471-484,693-698` | — |
| Second insert surface (⊕ picker) | Canvas toolbar ⊕ | Canvas-local | Modal (`BlockPickerModal`) | Nothing | Stacks over the drawer | Yes (scrim) | No | Esc / ✕ | Selection kept | Two insert pipelines (see A02-7) | `canvas/controls/BlockPickerModal.tsx` | P3 (overlap) |
| Layers | Rail, `L`, "Show in layers" | leftPanelTab | Left drawer | Previous tab | Yes | Yes | Yes | Rail re-click | — | StructurePopover is dev-only (`?rail=e3`) | `StudioFooter.tsx:215`, `editorViewMode.ts:71` | — |
| Pages | Rail, `P` | leftPanelTab | Left drawer. Page settings are a 580 slide-over (`PageSettingsDrawer`) | Previous tab | Yes | Yes | Yes | ✕ / Esc / scrim, all guarded | Autosave | ⌘K inside Pages opens two palettes | `PagesTab.tsx:167-179` | P2 (A04-3) |
| Media Quick | Rail "Assets", `M` | leftPanelTab | Left drawer (320, can go to 560 via `ui:media-panel-width`) | Previous tab | Yes | Yes | Yes | Rail re-click | — | — | `LeftSidebar.tsx:571-593` | — |
| Full Media (Asset library) | Drawer "Manage in full library"; inspector "Manage video/source" | `StudioPanels.mediaFullPage` | Full screen: a fixed, portaled host (`.mgr-host`, z 50). It is **not** a dialog. | Everything (rail, topbar, canvas are covered but stay mounted) | No | No | **Keyboard: yes** (engine Delete still runs) | ✕ / Esc | Returns to the drawer (`mediaFullPage=false`) | Delete removes the hidden canvas selection; Esc closes even from the search field | `FullPageRouter.tsx:85-98`, `StudioPanels.tsx:411-415`, `LibraryManager.tsx:135-144` | **P0 (A04-1)**, P3 (A04-15) |
| Media picker | Inspector image/video source (`onOpenMediaLibrary`) | `useStudioModals.mediaLibraryContext` | Modal (`MediaLibraryPanel`: pick, upload, URL; no delete) | Nothing | Stacks | Behind the scrim | No | Esc / select | Selection kept | — (a picker, correctly kept small) | `StudioModals.tsx` (MediaLibraryPanel), `MediaLibraryPanel.tsx:1-30` | — |
| Dashboard media | `/dashboard/media` | Server | Dedicated page | — | — | — | — | Navigation | — | A second library with different scope (A01-3, A02-3) | `app/dashboard/media/page.tsx` | overlap |
| CMS | Rail "CMS", `D` | leftPanelTab plus `useContentPanel` drill state | Left drawer with drill-in (collections → records → record form with save bar) | Previous tab | Yes | Yes | Yes | Rail re-click; the in-panel back is guarded | Drill state is lost when the tab switches | Unsaved record lost on tab switch (A04-10). Records also have a modal (A04-11) | `ContentViews.tsx:381-391,497-499` | P2 |
| CMS records modal | Only ⌘⇧P "Manage CMS records" | `useDomainModals.showCMSRecords` | Modal (503 LOC, full CRUD) | Nothing | Stacks | Scrim | No | ✕ | — | A competing records surface | `useCanvasCommandPalette.ts:166-172`, `useEditorEventListeners.ts:90-98` | P2 (A04-11) |
| CMS collection setup | Content "+", inspector | `useDomainModals` | Modal | — | Stacks | Scrim | No | ✕ | — | — | `StudioModals.tsx` | — |
| Components | `⇧A`, ⌘K, site menu | leftPanelTab | Left drawer with detail drill-in; the create dialog is a shell modal | Previous tab | Yes | Yes | Yes | Rail re-click | — | Off the rail (see A01/A02) | `TabRouter.tsx:188-199`, `StudioModals.tsx` (CreateComponentModal) | — |
| Brand | Rail "Brand", `B`, Issues → "Open Brand" | leftPanelTab | Left drawer (tokens, presets, starters, import, lint, AI modal) | Previous tab | Yes | Yes | Yes | Rail re-click | — | Complex management in a 280 drawer (product decision) | `design-system/ui/DesignSystemTab.tsx:943-973` | PD |
| Brand import / export | Brand ImportCard / ExportDropdown | Panel-local | Inline card / dropdown | — | Yes | Yes | Yes | — | — | — | `design-system/ui/sections/ImportCard.tsx`, `ExportDropdown.tsx` | — |
| Selected-element AI | Selection toolbar ✨ | Canvas-local | Popover (`AiPromptPopover`) | — | Yes | Yes | Yes | Esc / outside click | — | A third AI surface | `canvas/controls/AiPromptPopover.tsx` | overlap |
| AI chat (inspector) | ⌘J, header ✨, inspector chip, empty inspector, ⌘K "Ask AI" fallback | `StudioPanels.aiInInspector` | Inspector-column drill-in | Inspector body | Yes, **also with the drawer AI** | Yes | Yes | ‹ Inspector | Back to the inspector | Two independent AI threads; opens into a zero-width column when the inspector is collapsed | `StudioPanels.tsx:239,332-343,543-550` | P2 (A04-4) |
| AI chat (drawer) | `I`, ⌘K "Open AI panel", persisted tab | leftPanelTab = "ai" | Left drawer | Previous tab | Yes, also with the inspector AI | Yes | Yes | Rail re-click (AI is not on the rail) | Restored on reload | Same | `TabRouter.tsx:162-163`, `useEditorEventListeners.ts:150-158` | P2 (A04-4) |
| Review | Topbar review pill/CTA, ReviewBar, `R` | leftPanelTab | Left drawer. Compare: list mode in the drawer, split/overlay in an OverlayMount at 1080 | Previous tab | Yes | Yes | Yes | Rail re-click / close | — | SendForReview's outcome modal is owned by the drawer tab (A04-8) | `ReviewTab.tsx:164-169,527`, `SendForReview.tsx:80-147` | P2 (A04-8) |
| Review bar | An open round | Server status | Inline row under the topbar | — | Yes | Yes | Yes | Disappears when the round closes | — | Its right-end actions are covered by the Issues panel | `ReviewBar.tsx:122`, `AquibraStudio.tsx:534-538` | P2 (A04-5) |
| Comments | `C`, topbar Comments | `ui:comment-mode` | Canvas overlay layer plus composer modal | Canvas pointer mode | Yes | Yes | Comment mode only | `C` / Esc | — | `C` also toggles behind full-page Settings (A04-2) | `useEditorShortcuts.ts:106-110`, `canvas/comments/CommentLayer.tsx:246` | P1 (A04-2) |
| Issues | Topbar issue chip; "+N more" in publish-anyway | `AquibraStudio.issuesOpen` | Ad-hoc absolute panel (`top:56`, `right:0`, `w:360`, `z:45`) | Covers the inspector and the right 80px of canvas | Yes, overlapping | Partly | Yes | ✕ only (no Esc) | — | Hard-coded geometry; covers the inspector AI, the ReviewBar actions, and the header when a banner shows | `AquibraStudio.tsx:604-643` | P2 (A04-5) |
| History | `⌃H`, site menu, topbar | leftPanelTab (+ sub-tab "published") | Left drawer; time-travel draws a canvas overlay and a bottom scrubber | Previous tab | Yes | **A past frame is painted over it** | **Yes, the live canvas under the picture** | Scrubber exit | — | Edits land on a canvas the user cannot see (A04-7) | `TimeTravelScrubber.tsx:156-200` | P2 (A04-7) |
| Activity (undo timeline) | History › Activity | HistoryManager | Inline in the History drawer, with a ConfirmDialog | — | Yes | Yes | Yes | — | — | — | `history/components/ActivityView.tsx:442` | — |
| Publish (topbar) | Topbar Publish CTA | `AquibraStudio.publishConfirmOpen`, `StudioHeader.pubConfirm` | Modal (PublishConfirmModal). With errors: the publish-anyway modal first | Nothing | Stacks | Scrim | No | Cancel / Esc | — | Two confirm modals in a row on the error path (A04-9) | `StudioHeader.tsx:681-695,950-957`, `AquibraStudio.tsx:424-430,774-785` | P2 (A04-9) |
| Publish (panel) | Site menu, `U`, ⌘K | leftPanelTab; `PublishTab.wizardOpen` | Drawer plus wizard modal (owned by the drawer tab) | Previous tab | Yes | Scrim | No | Cancel | — | The wizard dies if the drawer tab switches underneath it (A04-8) | `PublishTab.tsx:850-906`, `TabRouter.tsx:212-225` | P2 |
| Publish gates | Server block reasons | `publishJob.blockedReason` | Modal (PublishGateModal / StaleApprovalModal) | — | Stacks | Scrim | No | ✕ | Door to Review | — (single source: publishJob) | `StudioPanels.tsx:600-604`, `AquibraStudio.tsx:756-761` | — |
| Dashboard publish | `sites/[id]/publish` | Server | Dedicated page | — | — | — | — | — | — | Orphaned (A01-12) | — | overlap |
| Settings (editor) | Site menu, `⌃,`, `S`, Pages "Add redirect", ⌘⇧P "Open analytics/export settings" | leftPanelTab = "settings" (mode fullpage) plus `settingsOpen` | Full screen: a fixed, portaled host (`set-host`, z 50). It is **not** a dialog. | Everything | No | No | **Keyboard: yes** | Back to canvas / Esc (guarded) | **Always to Add** | Guard bypassed by global shortcuts; Delete reaches the canvas; close does not restore context | `FullPageRouter.tsx:105-122`, `StudioPanels.tsx:411-419` | P0 (A04-1), P1 (A04-2), P3 (A04-12) |
| Settings (dashboard) | `sites/[id]/*` tabs | Server | Dedicated pages | — | — | — | — | — | — | Two settings workspaces (A01-4) | — | overlap |
| Templates | ⌘K, `T`, Pages "From template", `ui:browse-templates` | leftPanelTab | Left drawer (320 → 700 for detail); replace confirm and progress overlay | Previous tab | Yes | Yes | Yes | Rail re-click | — | The `FullPageRouter` "templates" branch is dead code | `FullPageRouter.tsx:67-76`, `tabsConfig.ts` (templates `mode:"panel"`) | P3 (A04-16) |
| Preview | Topbar eye, `⌘P`, ⌘K, onboarding | `AquibraStudio.previewHtml` | Fixed region below the topbar, **z 3000** | Canvas and panels (visually) | Topbar stays live | No | **Keyboard: yes** | Done / Esc (capture) | — | Sits above every modal, palette and toast (z 50–80) | `PreviewOverlay.tsx:39,93-97`, `canvas.ts:281` | P2 (A04-6) |
| Command palette ⌘K | ⌘K | `StudioHeader.cmdOpen` | Modal-like dialog (z 60) | — | **Stacks with the Pages palette** | Scrim | No | Esc | — | Two palettes open on one keypress | `StudioHeader.tsx:256-273` | P2 (A04-3) |
| Canvas palette ⌘⇧P | ⌘⇧P | `useCanvasCommandPalette.isPaletteOpen` | Dialog (Z_LAYERS modal) | — | Opens over full-page Settings/Library (no `isModalOpen` check) | — | — | Esc | — | Nav commands bypass the Settings guard | `useCanvasCommandPalette.ts:43-62` | P1 (A04-2) |
| Notifications | Topbar bell | `StudioHeader.notifOpen` | Dropdown (polls) | — | Yes | Yes | Yes | Outside click | — | — | `StudioHeader.tsx:245-254` | — |
| Site menu / Share / Invite | Topbar ⋯ | Local | Dropdown; Share preview and Invite open the dashboard in a **new tab** | — | Yes | Yes | Yes | Outside click / Esc | Editor untouched | — (the dashboard reads `?share=1`) | `SiteMenu.tsx:118,275,288`, `dashboard/components/site-detail/site-header.tsx:41` | — |
| Collaboration / Presence | Topbar Collaborate (flag) | `CollaborationManager` | Topbar avatars only | — | Yes | Yes | Yes | — | — | Hidden entirely unless `FEATURE_COLLAB` is on. No remote cursors/selection UI. Conflicts reach the user as the save-conflict modal (Agent D) | `StudioHeader.tsx:225,771-776,848`, `useCanvasCommandPalette.ts:326` | overlap |
| Conflict / session expired | Autosave 409/401 | `AquibraStudio.conflict/authExpired` | Blocking modals | — | Stacks | Scrim | No | Explicit actions | — | Render under preview (A04-6) | `AquibraStudio.tsx:685-709,763-769` | P2 |
| Load error / recovery | Load failure / local recovery | Local | Banners above the header | — | Yes | Yes | Yes | Dismiss | — | Push the header down; Issues `top:56` does not follow them | `AquibraStudio.tsx:479-489` | P2 (A04-5) |
| Destructive confirms | Page / component / unpublish / asset / multi-layer delete, template replace | Per-panel | `ConfirmDialog` / modals; a single element delete uses an Undo toast | — | — | Scrim | No | Cancel | — | No native `confirm()` anywhere. Delete-key element delete has no confirm by design (Undo toast) | grep: 0 `window.confirm`; `useHistoryFeedback.ts:241-262` | — (see A04-1) |

---

## Findings

### P0 — IMMEDIATE FIX REQUIRED

#### A04-1 · Full-screen surfaces are invisible to the engine keyboard, so Delete/Backspace deletes the hidden canvas element (the wrong object)

**P0 — IMMEDIATE FIX REQUIRED (not fixed in this run)**

- **Severity:** P0, because this is a destructive action on the wrong object. It is mitigated only by a 5-second Undo toast; see below.
- **Files and lines:**
  - `packages/editor/src/editor/sidebar/FullPageRouter.tsx:85-98` (Asset library host) and `:105-122` (Settings host)
  - `packages/editor/src/engine/commands/CommandCenter.ts:23-35,193-229`
  - `packages/editor/src/engine/commands/defaultCommands.ts:76-98`
  - `packages/editor/src/editor/inspector/sections/MediaSourceRow.tsx:79-80`
  - `packages/editor/src/editor/shell/PreviewOverlay.tsx:73-97`
- **Symbols:** `FullPageRouter` `case "assets"` / `case "settings"`, `CommandCenter.shouldHandleShortcut`, the `delete` command, `KeybindingManager.setup` (a capture-phase listener on `window`).
- **Evidence:**
  - Both full-screen surfaces are a `<Portal>` around a plain `div` host with `position: fixed; inset: 0; z-index: var(--bk-z-overlay)`. The Library host is `<div className="mgr-host">` and the Settings host is `<div ... data-testid="set-host">`. **Neither has `role="dialog"`/`aria-modal`**, and the comment says this is deliberate ("not an OverlayMount … the tab owns its Escape").
  - The canvas, and with it the engine keyboard, **stays mounted** under them (`StudioPanels.tsx:503-537`).
  - `shouldHandleShortcut` lets a bare key through unless the target is a text entry or sits inside one of the `WIDGET_ROLES` (menu, listbox, grid, dialog, …).
  - An asset card or a Settings button therefore passes, and `delete` (`shortcuts: ["delete","backspace"]`) runs `c.elements.removeElement` on `c.selection.getAllSelected()`.
  - The Library has no Delete-key handling of its own (grep: none in `LibraryManager.tsx` or `media/components/*`). Because the engine listener is capture-phase on `window`, it would win anyway.
  - **The worst door:** the inspector's "Manage video/source" (`MediaSourceRow.tsx:79-80`) selects the asset and opens the full-screen library **with the page element still selected**. A user who then presses Delete to remove the file deletes the video element from the page. The toast that confirms it reads "`Video deleted` · Undo" (`useHistoryFeedback.ts:241-262`), which inside a media library reads as the file being deleted. Autosave persists the removal about 1 s later (debounce in `useComposerInit`).
  - The same class applies to Settings (Backspace on a focused Settings button) and to Preview (`role="region"` at z 3000, not modal).
  - **Probe:** 3 of 3 scratch tests passed. A keydown Delete/Backspace from a focused button inside a role-less `mgr-host`/`set-host` host removed the selected element (1 → 0). The same key inside `role="dialog"` was refused (control).
- **Expected:** while a full-screen surface covers the canvas, canvas commands must not run. Either the host is a keyboard-owning surface, or the engine gate knows the canvas is hidden (for example `composer.readOnly`-style suspension, or a surface-ownership flag).
- **Root cause:** there is no shell-level "which surface owns the keyboard" state. Modality is inferred from `[role=dialog][aria-modal=true]` in the DOM (`isModalOpen()` and the engine carve-out), and the full-screen surfaces opted out of that marker.
- **Affected modules:** Full Media, Settings, Preview, and every engine bare-key command (Delete, arrow-nudge and the rest registered in `defaultCommands.ts`).
- **Recommendation:**
  - Give full-screen surfaces a keyboard-owning marker the engine honours: `aria-modal` on the host, or a dedicated `data-surface="fullpage"` checked in `shouldHandleShortcut`.
  - Or clear/suspend canvas selection when a full-page surface opens.
  - Add a regression test that mounts `FullPageRouter` over a real composer.
- **Status:** VERIFIED at the engine level (code plus the jsdom probe). NOT RUNTIME VERIFIED in the running app with the real LibraryManager/SettingsTab mounted.

### P1

#### A04-2 · The Settings unsaved-edit guard is bypassed by global shortcuts and bus-driven tab switches; buffered Settings edits are silently dropped

- **Severity:** P1
- **Files and lines:**
  - `packages/editor/src/editor/shell/hooks/useEditorShortcuts.ts:85,106-124,165-172`
  - `packages/editor/src/editor/shell/hooks/useStudioState.ts:317-327`
  - `packages/editor/src/editor/shell/StudioPanels.tsx:332-350`
  - `packages/editor/src/editor/shell/hooks/useEditorEventListeners.ts:150-158`
  - `packages/editor/src/editor/sidebar/LeftSidebar.tsx:443-466,522,749-757`
  - `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx:196-238,260-300,348-362`
  - `packages/editor/src/editor/sidebar/tabs/settings/screens/SeoScreen.tsx:171-189`
- **Symbols:** `useEditorShortcuts`, `openLeftPanelToTab`, the `ui:switch-tab` handler, the `UI_PANEL_OPEN` handler, `safeTabChange`, `SettingsTab.requestLeave`.
- **Evidence:**
  - Settings screens **buffer** edits and flush them into the composer only on Save (`registerFlushHandler`, `SeoScreen.tsx:171-189`). `SettingsTab` guards its own doors: Back, Esc, and the nav rows go through `requestLeave`/`requestNav`.
  - The shell guard exists only in `LeftSidebar.safeTabChange`, which catches rail clicks and bare-letter shortcuts.
  - **Every other tab switch bypasses both guards:**
    - `⌃/⌘H` → `openLeftPanelToTab("history")` and `⇧A` → `openLeftPanelToTab("components")` (`useEditorShortcuts.ts:115-124`). These fire because the Settings host is not `aria-modal`, so `isModalOpen()` is false (`:85`).
    - The ⌘⇧P canvas palette's "Open page settings", which emits `UI_PANEL_OPEN` → `openLeftPanelToTab`.
    - Any `ui:switch-tab` emit, which calls `onLeftPanelTabChange` directly (`StudioPanels.tsx:344`).
  - Each of these changes `leftPanelTab`, which unmounts `FullPageView`/`SettingsTab` with no Discard and no prompt. The buffered edits vanish.
  - While Settings covers the screen, the same non-modal status lets `C` (comment mode), `⌘Z` (undo on the hidden canvas) and `⌘P` (preview drawn above Settings at z 3000) act on things the user cannot see.
  - The letter-key path does reach a guard, but it is a **second, different** dialog. It is titled "Unsaved Changes" and its confirm is labelled "Discard & Switch" (`LeftSidebar.tsx:749-757`). Its confirm clears the flag without running Settings' own rollback (`SettingsTab.handleDiscard`, which restores `screenSnapshotRef`).
- **Expected:** one guard owns leaving a dirty full-page surface, and every tab-change path goes through it. While the full page is up, global shortcuts that target other surfaces stand down.
- **Root cause:**
  - Tab changes have four entry points: `setLeftPanelTab`, `openLeftPanelToTab`, the `ui:switch-tab` handler, and `safeTabChange`. Only one of them checks dirty state.
  - The full-page surface is not modal, so `isModalOpen()`-based suppression never applies.
- **Affected modules:** Settings (editor), History, Components, Comments, Preview, and both command palettes.
- **Recommendation:**
  - Route every left-tab change through one guarded setter in `useStudioState` that consults a shell-owned dirty registry.
  - Treat the full-page surfaces as keyboard owners (this shares a fix with A04-1).
  - Delete the duplicate LeftSidebar dialog in favour of the Settings guard.
- **Status:** VERIFIED in code (call chains read end to end). NOT RUNTIME VERIFIED.

### P2

#### A04-3 · ⌘K with the Pages panel open opens two stacked command palettes

- **Severity:** P2
- **Files and lines:** `packages/editor/src/editor/shell/StudioHeader.tsx:256-273` and `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.tsx:167-179,404-410`
- **Symbols:** the StudioHeader ⌘K effect; the PagesTab ⌘K effect / `PageCommandPalette`.
- **Evidence:**
  - StudioHeader listens on `document` and opens the shell palette when `!isModalOpen()`. PagesTab listens on `window` and toggles `PageCommandPalette`.
  - Neither calls `stopPropagation`, and PagesTab never checks `isModalOpen()`. Document-bubble runs before window-bubble.
  - So one keypress opens both `aria-modal` dialogs (shell palette `z 60`, page palette `.bd-pg-palette-overlay`).
  - A second ⌘K is refused by StudioHeader (a modal is now open) but toggles the page palette closed, leaving the shell palette up.
  - LibraryManager also binds ⌘K on `window` to focus its search (`LibraryManager.tsx:135-144`) while the shell palette opens over the library.
- **Expected:** a single owner for ⌘K. A panel-scoped search takes a different chord, or registers as a palette scope inside the shell palette.
- **Root cause:** keyboard shortcuts are registered ad hoc per component, with no shortcut registry and no scoping.
- **Affected modules:** Commands, Pages, Full Media.
- **Recommendation:** remove the panel-level ⌘K bindings, or make them `isModalOpen()`-aware and have the shell handler stand down when a panel claims the chord.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

#### A04-4 · Two independent AI chat surfaces, and AI can open into a collapsed (zero-width) inspector

- **Severity:** P2
- **Files and lines:**
  - `packages/editor/src/editor/shell/StudioPanels.tsx:239,332-343,471,543-550`
  - `packages/editor/src/editor/sidebar/TabRouter.tsx:162-163`
  - `packages/editor/src/editor/shell/hooks/useEditorEventListeners.ts:141-158`
  - `packages/editor/src/editor/shell/modals/CommandPalette.tsx:50-62,337-344`
  - `packages/editor/src/editor/sidebar/useSidebarKeyboard.ts:33-47`
  - `packages/editor/src/editor/sidebar/tabs/ai/AITab.tsx:49-50`
- **Evidence:**
  - `ui:switch-tab {tab:"ai"}` sets `aiInInspector` and renders `AITab` in the inspector column. The emitters are ⌘J, header ✨, the inspector chip, the empty-inspector CTA and the palette's "Ask AI".
  - The ⌘K row "Open AI panel" emits `UI_PANEL_OPEN {panel:"ai"}`. "ai" is on the allowlist derived from `GROUPED_TABS_CONFIG`, so it opens the **left-drawer** `AITab`. The bare `I` shortcut does the same.
  - Each `AITab` owns `messages` in local `useState` (`AITab.tsx:49-50`). The two surfaces can be open at once, with two separate threads.
  - The `ai` handler never sets `inspectorShown`. When the user has collapsed the inspector, the column gets no width, because `inspectorOpen={... && inspectorShown}` (`StudioPanels.tsx:471`). ⌘J and ✨ then mount AI into an invisible column.
- **Expected:** one AI chat surface with one thread. Opening AI reveals its column.
- **Root cause:** the AI surface moved to the inspector (boards 170:*), but the left-tab registration, shortcut `I` and the palette nav row were kept. The visibility state (`inspectorShown`) is separate from the AI routing state.
- **Affected modules:** AI, Inspector, Commands.
- **Recommendation:**
  - Pick one home (product decision).
  - Route `I` and "Open AI panel" to the same `ui:switch-tab` path.
  - Force the inspector visible on AI open.
- **Status:** VERIFIED in code. The existing `TabRouter.ai.test.tsx` asserts the drawer path on purpose. NOT RUNTIME VERIFIED.

#### A04-5 · The Issues panel is an ad-hoc absolute overlay with hard-coded geometry that collides with the inspector, ReviewBar and banners

- **Severity:** P2
- **File:** `packages/editor/src/editor/shell/AquibraStudio.tsx:604-643` (see also `:479-489,534-538`)
- **Evidence:**
  - The inline style is `position:absolute; top:56; right:0; width:360; zIndex:45` inside the `bd-studio` root.
  - `top:56` assumes the header starts at y=0. `RecoveryBanner` and `LoadErrorBanner` render **above** the header in normal flow, so with a banner the panel overlaps the topbar's right cluster (Publish, avatars).
  - With a review round open, `ReviewBar` (a row under the topbar, with its Re-send action right-aligned after a flex spacer) sits under the panel's top edge.
  - The 360px width covers the whole inspector column and 80px of canvas, including the inspector AI drill-in.
  - There is no Escape close and no restore of focus. It uses a raw z of 45, not a token, while the full-page overlays sit at 50 and hide it without closing it.
- **Expected:** Issues uses a real surface slot: the inspector-column drill-in, like AI, or a tokenised right drawer that yields to banners and has Esc/restore.
- **Root cause:** the panel was bolted onto the shell outside `LayoutShell`, which owns every other column.
- **Recommendation:** mount Issues in `LayoutShell.Inspector` as an alternative body, as `aiInInspector` does, or as a `Drawer` primitive.
- **Status:** VERIFIED in code. The geometry is NOT RUNTIME VERIFIED.

#### A04-6 · Two z-index scales: Preview (z 3000) sits above every modal, palette and toast (z 50–80)

- **Severity:** P2
- **Files and lines:**
  - `packages/editor/src/editor/shell/PreviewOverlay.tsx:39,93-97`
  - `packages/editor/src/shared/constants/canvas.ts:260-290` (`Z_LAYERS`)
  - `packages/editor/src/themes/tokens.generated.css:137-146` (`--bk-z-*`)
  - `packages/editor/src/editor/chrome-ui/OverlayMount.tsx:57`
  - `packages/editor/src/editor/shell/modals/CommandPalette.tsx:428-446`
- **Evidence:**
  - The preview region is `position:fixed; top:var(--bk-size-topbar)` with `zIndex: Z_LAYERS.floatingPanel` (3000).
  - Modal scrims are `tw:z-50`, the palette is `--bk-z-modal` (60), and toasts are `--bk-z-toast` (80).
  - The topbar stays clickable during preview. So Publish (→ PublishConfirmModal), ⌘K (the palette; `isModalOpen()` is false during preview), and any autosave-driven ConflictModal or SessionExpiredModal all mount **below** the preview.
  - A focus-trapped dialog ends up invisible, and toasts ("Published", the Undo toast) are hidden.
  - Esc closes the preview first (capture listener, `:73-83`), which is the only way out.
- **Expected:** one z scale. The preview sits under modals and toasts, or is itself modal and blocks the topbar actions.
- **Root cause:** the canvas-internal `Z_LAYERS` scale (100–5500) leaked into shell chrome, which otherwise uses the `--bk-z-*` tokens (0–90).
- **Recommendation:** put the preview on `--bk-z-overlay`, and lint shell and chrome files against `Z_LAYERS` imports.
- **Status:** VERIFIED in code (numeric values). NOT RUNTIME VERIFIED.

#### A04-7 · Time-travel preview paints a past frame over the canvas while the live canvas underneath stays interactive

- **Severity:** P2
- **File:** `packages/editor/src/editor/sidebar/tabs/history/components/TimeTravelScrubber.tsx:156-200,217-240`
- **Evidence:**
  - The preview layer is an absolute div inserted beside `#editor-canvas`. Its opacity is set to 1 whenever a snapshot exists, and it uses `pointer-events: none`, commented "keeps the live canvas interactive below".
  - Clicks, drags and the Delete key therefore act on elements the user cannot see, because the picture on screen is a past state.
  - The layer's rectangle is measured once at mount (`getBoundingClientRect`), so zoom, a drawer resize or an inspector toggle leaves it misaligned.
- **Expected:** while a past state is shown, the canvas is read-only (for example `composer.readOnly = true` for the duration), or the preview replaces the canvas slot.
- **Root cause:** time-travel is layered over the canvas visually but was never given the canvas's input.
- **Recommendation:** set `composer.readOnly` while scrubbing, and re-measure on resize/zoom.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

#### A04-8 · Bare-letter tab shortcuts ignore open modals and unmount the drawer tab that owns the modal

- **Severity:** P2
- **Files and lines:**
  - `packages/editor/src/editor/sidebar/useSidebarKeyboard.ts:17-47`
  - `packages/editor/src/editor/sidebar/TabRouter.tsx` (one tab mounted at a time)
  - `packages/editor/src/editor/sidebar/tabs/publish/PublishTab.tsx:850-906`
  - `packages/editor/src/editor/shell/SendForReview.tsx:80-147` (mounted in `ReviewTab.tsx:527`)
- **Evidence:**
  - `useSidebarKeyboard` skips only inputs, textareas, contenteditable elements and modifier chords. It has **no `isModalOpen()` check**, unlike `useEditorShortcuts`, the StudioHeader ⌘K handler, `CanvasFooterToolbar` and `CommentLayer`, which all have one.
  - With focus on a button inside a drawer-owned modal, one letter (`L`, `P`, `M`, …) switches `leftPanelTab`. The drawer-owned modals include the PublishWizard, the unpublish ConfirmDialog, SendForReview's `ReviewSentModal` (which exists to show the freshly minted review link) and the Content leave-confirm.
  - `TabRouter` then unmounts the owning tab and the dialog disappears mid-flow. For `ReviewSentModal`, that recreates the "link was created and the user never saw it" failure the modal was built to fix (`ReviewSentModal.tsx:5`).
- **Expected:** an open modal owns the keyboard (the "F9 rule" the rest of the shell follows).
- **Root cause:** one keyboard hook was missed when the F9 rule was applied, and modals are owned by transient drawer tabs.
- **Recommendation:** add `if (isModalOpen()) return;` to `useSidebarKeyboard`. Consider lifting flow-critical modals (publish wizard, review-sent) to the shell.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

#### A04-9 · Topbar publish on the error path shows two confirmation modals in a row; there are three different publish confirm surfaces in total

- **Severity:** P2
- **Files and lines:** `packages/editor/src/editor/shell/StudioHeader.tsx:674-695,876-960`, `packages/editor/src/editor/shell/AquibraStudio.tsx:424-430,771-785`, `packages/editor/src/editor/sidebar/tabs/publish/PublishTab.tsx:850`
- **Evidence:**
  - With `errorCount > 0`, the topbar CTA opens the header's own "publish anyway" modal (`pubConfirm`).
  - Its "Publish anyway" calls `publishNow` = `onVercelPublish` = `requestPublish`, which opens `PublishConfirmModal`. That is two modals back to back for one decision.
  - The panel path uses `PublishWizard` instead. `AquibraStudio.tsx:589-600` already names and fixes the "two gates, one board" problem, but only for the panel path.
- **Expected:** one confirmation surface per publish attempt, carrying both the issues summary and the deploy facts.
- **Root cause:** the issue gate and the deploy gate were built in different components.
- **Recommendation:** fold the issue rows into `PublishConfirmModal`/`PublishConfirmFacts`, and make the header CTA open that modal once.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

#### A04-10 · The shell-level unsaved guard is Settings-only; unsaved CMS record drafts are dropped on any drawer switch

- **Severity:** P2
- **Files and lines:** `packages/editor/src/editor/sidebar/tabs/content/ContentViews.tsx:381-391,493-499,716-722`, `packages/editor/src/editor/sidebar/LeftSidebar.tsx:443-452`, `packages/editor/src/editor/sidebar/TabRouter.tsx:1-20`
- **Evidence:**
  - The Content record form keeps a local draft with a savebar that reads "Unsaved changes". Its in-panel back crumb is guarded (`leave = () => dirty ? setConfirmLeave(true) : onBack()`).
  - `safeTabChange` only checks `activeTab === "settings" && settingsDirty`, and `TabRouter` unmounts the previous tab on every switch.
  - A rail click, a letter shortcut or any `ui:switch-tab` therefore discards the draft without a prompt. The dynamic-pages slug editor (`:716-722`) has the same gap.
  - `PageSettingsDrawer` is not affected, because it autosaves.
- **Expected:** any drawer surface with an explicit Save registers its dirty state with the shell guard.
- **Root cause:** the dirty state is a one-off prop plumbed for Settings (`settingsDirty`), not a registry.
- **Recommendation:** use a shared `useDirtyGuard(tabId)` registry consulted by the single guarded tab setter proposed in A04-2.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

#### A04-11 · CMS records have two competing management surfaces: the drawer drill-in and a hidden modal

- **Severity:** P2
- **Files and lines:** `packages/editor/src/editor/shell/modals/CMSRecordsModal.tsx:1-10` (503 LOC), `packages/editor/src/editor/canvas/hooks/useCanvasCommandPalette.ts:166-172`, `packages/editor/src/editor/shell/hooks/useEditorEventListeners.ts:90-98`, `packages/editor/src/editor/sidebar/tabs/content/ContentTab.tsx:1-20`
- **Evidence:**
  - `CMS_MANAGE_RECORDS` has exactly one emitter, the ⌘⇧P canvas palette's "Manage CMS records". Grep across `packages/` finds no other emitter.
  - That opens a full-CRUD records modal whose header says "no UI ever called it", while the Content drawer has its own records list and record form with a savebar.
  - The two surfaces implement the same job with different validation and save semantics. The modal saves per row; the drawer uses a savebar.
- **Expected:** one records surface.
- **Root cause:** the modal predates the Content drawer build-out and was never retired.
- **Recommendation:** make a product decision (see below). Then delete the losing surface, or make the palette row open the Content drawer.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

### P3

#### A04-12 · Closing any full page always lands on Add, not on where the user came from

- **File:** `packages/editor/src/editor/shell/StudioPanels.tsx:411-419`
- **Evidence:** `handleFullPageClose` calls `onLeftPanelTabChange("add")` for every non-media full page. The comment says "Return to last panel tab (default: Add)", but no previous tab is stored.
- **Impact:** Settings reached from Pages ("Add redirect"), Brand, History or Publish returns the user to Add, and they lose their place.
- **Recommendation:** store the pre-full-page tab and restore it.
- **Status:** VERIFIED in code.

#### A04-13 · A persisted `leftPanelTab` reopens full-screen Settings (or the drawer AI) on the next load

- **File:** `packages/editor/src/editor/shell/hooks/useStudioState.ts:224-236,268-292`
- **Evidence:** `leftPanelTab` is saved to `localStorage` on every change and restored on mount, with `isLeftPanelOpen = true`. A session that ended on Settings reopens the editor behind a full-screen overlay, with no canvas visible.
- **Recommendation:** do not persist full-page tabs; fall back to the last drawer tab.
- **Status:** VERIFIED in code.

#### A04-14 · The canvas-palette row "Open export settings" opens full-screen Settings instead of the Export modal

- **Files and lines:** `packages/editor/src/editor/canvas/hooks/useCanvasCommandPalette.ts:258-265`, `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx:78-81,272-280,318-324`
- **Evidence:**
  - `export` is a *door*, not a screen. `SETTINGS_SCREENS` excludes doors, so `initialScreen: "export"` is ignored.
  - The user lands on the Settings overview (full screen) and must click Export, which closes Settings and opens the modal.
- **Why it matters:** a simple action gets an unnecessary full-screen hop.
- **Status:** VERIFIED in code.

#### A04-15 · Asset library Escape closes the whole library even while typing in its search field

- **File:** `packages/editor/src/editor/media/LibraryManager.tsx:135-144`
- **Evidence:** the window keydown handler calls `onClose()` on any Escape with no input check, unlike SettingsTab (`:348-362`), which skips inputs. Nested library modals are safe because the focus trap stops propagation (`chrome-ui/focus.ts:58-74`).
- **Status:** VERIFIED in code.

#### A04-16 · Dead full-page branch for Templates

- **Files and lines:** `packages/editor/src/editor/sidebar/FullPageRouter.tsx:67-76`, `packages/editor/src/editor/rail/tabsConfig.ts` (templates `mode: "panel"`)
- **Evidence:** Templates is a panel tab, and nothing passes `isFullPageMode`, so the `case "templates"` branch in `FullPageRouter` is never rendered.
- **Status:** VERIFIED in code.

---

## Good as-is (verified in code)

- **The full-page slot mounts only while active.** The Media drawer no longer keeps a hidden second `LibraryManager` (`StudioPanels.tsx:566-592`).
- **Media Quick → Full library → close returns to the drawer**, not to Add (`StudioPanels.tsx:411-415`).
- **The closed drawer is `inert` as well as `aria-hidden`**, so there are no invisible tab stops (`LeftSidebar.tsx:693-698`).
- **Only the topmost modal answers Escape** (`chrome-ui/focus.ts:58-74`). Nested library dialogs close one at a time.
- **Review Compare picks its surface by mode:** the list view stays in the drawer, and the split/overlay views go into an `OverlayMount` at 1080 (`ReviewTab.tsx:164-169,599-608`). This is the right surface for each job.
- **Publish-block gates come from one state** (`publishJob.blockedReason`): `PublishGateModal` handles three reasons and `StaleApprovalModal` handles the fourth (`StudioPanels.tsx:600-604`, `AquibraStudio.tsx:756-761`). The panel path deliberately skips the topbar confirm (`AquibraStudio.tsx:589-601`).
- **Cross-tab intents are latched by the always-mounted sidebar**, not by events that miss unmounted listeners. This covers Unpublish and Templates "new page" (`LeftSidebar.tsx:407-441`), and the Settings/Pages open requests (`StudioPanels.tsx:294-329`).
- **The page settings slide-over guards every exit** (✕, Esc, scrim, tab switch) behind one modal and autosaves (`PageSettingsDrawer.tsx:1-15,176-199`).
- **View mode removes the rail, drawer and inspector entirely** and gates the engine (`StudioPanels.tsx:215-237,465-475`).
- **Collaboration UI has both doors flag-gated:** the topbar (`StudioHeader.tsx:225,848`) and the canvas palette (`useCanvasCommandPalette.ts:326`).
- **Share preview and Invite hand off to the dashboard in a new tab** without disturbing the editor (`SiteMenu.tsx:118,275,288`), and the dashboard honours `?share=1` (`site-header.tsx:41`).
- **No native `window.confirm`** in the editor or dashboard source. Destructive actions use `ConfirmDialog`, or an Undo toast for element delete.

---

## Product decisions required

1. **The home for AI chat:** the inspector column (boards 170:*), the left drawer, or both with one shared thread (A04-4).
2. **What a full-screen surface owns:** do Settings and the Asset library block the canvas keyboard (i.e. behave as modals), and should canvas selection clear when they open (A04-1, A04-2)?
3. **The CMS records surface:** the drawer drill-in or the modal. Keep one (A04-11).
4. **Publish confirmation:** one combined confirm (issues plus deploy facts) for the topbar path (A04-9).
5. **The Settings exit target:** return to the previous surface, or always to Add (A04-12).
6. **Brand panel density:** tokens, presets, starters, import, lint and AI all live in a 280px drawer, with an optional 700px expand. Should Brand graduate to a full page like Settings did?

---

## Overlaps with other audits (observed, not audited here)

- **A01-4 / A02-5 (Agent B):** the two Settings workspaces, editor full page vs dashboard tabs. A01-12 covers the orphaned dashboard publish page.
- **A02-7:** two insert pipelines (the Add drawer vs the ⊕ `BlockPickerModal`).
- **A02-12:** two editor palettes. A04-3 adds the third, panel-level ⌘K, binding.
- **A01-3 / A02-3:** the dashboard media page vs the editor library, on media scope.
- **Agent C (keyboard / a11y):**
  - there is no shortcut registry;
  - shortcut hooks disagree on `isModalOpen()` (A04-8);
  - the Issues panel has no Esc/focus restore (A04-5).
- **Agent D (collaboration):**
  - collab conflicts surface to the user only as the autosave `ConflictModal`;
  - there are no remote cursor or selection surfaces;
  - that modal also renders under Preview (A04-6).
- **Agent E (architecture):** the `Z_LAYERS` vs `--bk-z-*` dual scale (A04-6). Four un-unified tab-change entry points (A04-2).
- **Agent G (tests):** no test mounts `FullPageRouter` over a real composer (A04-1), and no test covers cross-component ⌘K (A04-3).

---

## AUDIT HANDOFF

- **Agent / Prompt:** B (Product Architecture), Prompt 4: Surface Architecture and Panel Orchestration.
- **Report:** `docs/audits/2026-09-25-full-audit/04-surface-architecture.md`
- **Counts:** P0 = 1 · P1 = 1 · P2 = 9 · P3 = 5
- **P0 (IMMEDIATE FIX REQUIRED; not fixed):** A04-1. The full-screen Asset library, Settings and Preview are not keyboard-owning surfaces, so the engine Delete/Backspace command deletes the hidden canvas selection. The inspector's "Manage video/source" door opens the library with that element still selected. Evidence: `FullPageRouter.tsx:85-122`, `CommandCenter.ts:193-229`, `defaultCommands.ts:76-98`, `MediaSourceRow.tsx:79-80`.
- **P1:** A04-2. The Settings unsaved guard is bypassed by `⌃H`, `⇧A`, `UI_PANEL_OPEN` and `ui:switch-tab`, so buffered Settings edits are silently dropped.
- **Runtime verified:**
  - the engine-level jsdom probe for A04-1 (3/3, in the scratchpad; no repo change);
  - the existing surface tests, 10 files and 75 tests passing (they do not cover these collisions).
- **NOT RUNTIME VERIFIED:**
  - A04-1 with the real LibraryManager/SettingsTab mounted;
  - A04-3 stacked palettes;
  - A04-5 geometry;
  - A04-6 preview/modal z-order;
  - A04-7 time-travel interaction;
  - A04-8 modal unmount;
  - all dashboard surfaces.
- **Dependencies:**
  - A04-1 and A04-2 share one fix: make full-page surfaces keyboard owners and add a single guarded tab setter. Do them together. A04-8 and A04-10 fold into the same guarded setter and dirty registry.
  - A04-4 waits on the AI-home product decision.
  - A04-11 waits on the CMS-records decision.
  - A04-6 is independent.
- **Inventory corrections:**
  - Full Media has three editor surfaces with distinct jobs: a drawer, a full-screen manager, and a picker modal. Only the manager duplicates the dashboard page.
  - `CMSRecordsModal` is reachable only from ⌘⇧P.
  - `StructurePopover` is dev-only (`?rail=e3` is ignored in production builds, `editorViewMode.ts:71`).
  - AI chat has two live surfaces, not one.
- **Suggested next owners:**
  - **G:** a browser walk of A04-1 (Manage video → Delete), A04-3 and A04-6.
  - **C:** a shortcut registry and consistent use of `isModalOpen()`.
  - **E:** unify the z scale and the tab-change entry points.
  - **D:** ConflictModal behaviour during a live collaboration session.
