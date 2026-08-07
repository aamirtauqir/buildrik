# Editor code-side feature inventory — 2026-08-07

Phase 0 input for `docs/plans/2026-08-07-editor-figma-completion.md`.
Produced by a read-only very-thorough sweep of `packages/editor/src`
(83 tool calls). Code only — no Figma read. The reconciliation matrix joins
this against `scripts/conformance/boards.json` (300 active boards).

## 0. Global routing / mode SSOT

- **Tab SSOT** `src/editor/rail/tabsConfig.ts` — 13 `GroupedTabId`s:
  `add, ai, templates, layers, pages, components, assets, design, settings,
  publish, history, review, content` (header comment says "11" — STALE).
- **Three rail render sources**, one config: `RAIL_FIGMA` default (6 items:
  add, layers, pages, assets, content, design); `?rail=e3` 4-tool rail;
  `?rail=legacy` zone rail. Mode resolved once at mount
  (`LeftSidebar.tsx:440`).
- STALE comment tabsConfig.ts:265-281: says `content` is off-rail — but
  `RAIL_FIGMA` puts it ON the default rail.
- **View mode** `shared/utils/editorViewMode.ts`: `railMode`, `fourToolRail`,
  `density (full|fewer)`, `clientView (?view=client)`.
- **Feature flags** (`shared/utils/featureFlags.ts`, all default OFF):
  `publish`, `componentsV2`, `dsAi`, `collab`.
- **Roles** `services/RoleService.ts`: VIEWER|EDITOR|DESIGNER|ADMIN|OWNER;
  `roleAtLeast()` = null while loading → gates fail OPEN (server enforces).
- **Off-rail tabs** (no rail button on default rail): ai, templates,
  components, settings, publish, history, review.
- Only `settings` is `mode:"fullpage"`.

## 1. Rail + drawer tabs

### 1.1 Insert ("add", BuildTab)
`tabs/build/` — groups ELEMENTS/BLOCKS/COMPONENTS/MINE (inline accordion,
elements open by default). States: default, searching (flat cross-source),
no-results, transition callout, tips carousel + dismissed, MINE empty.
Pinned: `⌥ Paste HTML…` + TipsFooter. Toasts: clipboard-unreadable/empty,
component-added/failed. Shortcuts: `A`, `/`, `⌘F`.
**DEAD:** `InsertStateBlocks.tsx` (loading + load-error blocks, only tests
import them); `useBuildTab` favorites/category-accordion/insertionContext
subsystem (12 members, 0 consumers, still persists 3 storage keys).

### 1.2 Pages (PagesTab)
Two views: tree ⇄ listings table. Drill-in: PageSettingsDrawer (580px,
SEO/Social/Advanced + UnsavedWarningModal + SettingsErrorBoundary). Overlays:
PageContextMenu (rename/duplicate/delete/set-homepage/copy-link/settings),
delete ConfirmDialog, panel-scoped ⌘K palette. States: load-error+retry,
bulk-select + BulkToolbar, inline rename + name-conflict, folders
empty/collapsed, guarded delete (home/last page → toast).

### 1.3 Layers (LayersTab + panels/layers)
Toolbar: search, expand-all, collapse-all, display-settings popover. States:
loading skeleton, load-error boundary + retry, empty page + onAddBlockClick,
drop-error toast, selection banner, count footer (aria-live). Entry: `L`,
`EVENTS.SHOW_IN_LAYERS`, `UI_TOGGLE_LAYERS`.
**DUPLICATE:** `LayerContextMenu.tsx` exists in BOTH `tabs/layers/components/`
and `panels/layers/components/`.

### 1.4 Media ("assets", MediaTab)
Three render modes: SlimLauncher (320 panel, default), ExpandedMediaPanel
(560 via `ui:media-panel-width`), in-tab fullpage branch (**unreachable** —
only when `onOpenLibrary` absent, LeftSidebar always passes it; real fullpage
= `editor/media/LibraryManager.tsx` via FullPageRouter case `assets`).
SlimLauncher states: loading, load-error, empty (+CTA), no-results (search),
no-results (filter), selection mode + SelectionContextBar, upload ghosts +
retry. Overlays: ConfirmDeleteModal, AssetDetailOverlay (drill-ins:
hub|used|versions|optimize → OptimizationPanel), StockSourceModal; slim-only
StockBrowserOverlay + IconBrowserOverlay; fullpage-only MediaContextMenu,
ReplaceAcrossDialog, UploadZone, drag-over. Quota bar, usage pips, folder
breadcrumb/context-menu/move-popover. Half-built: drawer bulk-move routes to
fullpage (no folder picker in drawer). Shortcut `M`.

### 1.5 Content (ContentTab)
7 views: root|collection|record|fields|sources|variables|conditions. States:
hydration loading, hydration error + retry (`retryCmsHydration`), empty root,
per-view empties. Flows: create collection (shell CMSCollectionSetupModal),
JSON import, condition creation via inspector pick-mode events. Documented
divergences: "Dynamic pages ›" omitted; Sheets connector not built.
Shortcut `D`. **⌘K route dead (D4).**

### 1.7 Publish (PublishTab)
Sections: StatusBadge → published URL + copy → pre-publish checklist
(loading/error+retry/rows pass|warning|fail with FIX_TARGETS links/no-checks
message) → trust banner → actions → PublishHistory. Gate:
`canPublish = !!onVercelPublish` (only when FEATURE_PUBLISH). Settings
sub-sections not addressable (`ui:switch-tab` takes tab id only). Off-rail;
`U`; topbar is primary door.

### 1.8 Review (ReviewTab)
States: loading, error+retry, no-round empty, compare sub-view
(loading/error/ready → ApprovedCompareView), thread list, all-resolved.
Features: status badge + revoked, open-count, Compare (APPROVED only),
Re-send, revoke + ConfirmDialog, show-resolved, page-grouped rows, Detached
group (orphan pins) + reattach, reply composer (2000 char + error).
**DEAD (D3): "Re-send" is a visible no-op** — `onResendReview` never passed
by LeftSidebar. Entry: `R`, topbar review pill, CommentLayer switch-tab.

### 1.9 History (HistoryTab)
Views: changes (ActivityView) / saves (VersionHistoryPanel), persisted
per-project. MilestoneSuggestionBanner (accept/edit/dismiss/loading),
TimeTravelScrubber (`⌃⇧T`), SnapshotPreview hover, CompareView
(visual|semantic) + AI summary (loading/result/error/cooldown),
delete/restore/save-version + toasts, empty list. Entry: `H`, `⌘H`, SiteMenu.

### 1.10 Settings (SettingsTab, fullpage)
14 screens, 3 groups: SITE general/branding/seo; DISTRIBUTION
publish-history/export/domains/analytics/localization; PLUMBING
custom-code/redirects/headers/forms/integrations/webhooks. Central dirty
counter + sticky savebar + nav-guard ConfirmDialog + LockedScreen +
reduced-motion. Workspace deep-links: members, billing only.
**BROKEN (D11): plan-gate key `advanced` matches no screen — Custom-code
pro-lock never fires; only `integrations` locks.** `coming-soon` LockedScreen
variant unused (D12). `⌃,` opens ProjectSettingsModal instead (deliberate).

### 1.11 Templates (TemplatesTab)
3 header modes; width 320↔700 (`ui:templates-panel-width`). Modals:
Replace (+backup checkbox), Pro, CreatePage confirm/success/error, Preview,
UsageDrawer, ApplyProgressOverlay. States: gallery, detail drill-in, search,
no-results + clear-all, apply error + retry, apply progress. Permission:
`canApplyTemplate = roleAtLeast(ADMIN) !== false`. Entry: `T`, SiteMenu,
Pages "From template", `UI_BROWSE_TEMPLATES`, canvas empty-CTA.
**DEAD:** FullPageRouter case `templates` unreachable (D7); root
`templates/TemplatePreview.tsx` barrel-only (D17).

### 1.12 Components
Flag-switched: legacy ComponentsTab (default) vs ComponentsPanelV2
(`componentsV2`, dark in prod). Legacy states: no-composer, error+retry,
loading skeleton, empty, list, detail drill-in, rename modal, variant-picker,
CreateComponentModal, DetachConfirmModal, delete confirm, compact.
DetachInstanceButton lives in inspector pill row (self-gating), reachable
regardless of flag. Entry: `⇧A`, SiteMenu, COMPONENT_CREATE_REQUESTED.

### 1.13 AI (AITab)
Modes: Chat | Agent. Chat: ScopeChip (locked/unlocked), streaming, stopped,
error, edit proposal DiffRows Accept/Reject/Regenerate, applied|rejected,
multi-select refusal, EmptyThread. Agent: phase, steps + currentIndex, error,
autoApply, Approve/Skip/Stop. Privileged-action ConfirmDialog
(useAiActionGate). Model picker REMOVED (server owns model). Entry: `I`,
`⌘J`, inspector ✦ chip; **SiteMenu "Ask AI" dead on default rail (D9).**

### 1.14 Cross-tab dead wiring
`onHelpClick` never supplied → every panel "?" unrendered (D14).
`leftPanelSubTab` discarded by StudioPanels → sub-tab deep-links dead (D10).
`projectId` never passed → tabs compensate via `currentSiteId()`; HistoryTab
doesn't (degrades storage key). Dead shared components: FilterChips,
ViewSwitcher, StickyFooter, FeatureCard (D18).

## 2. Shell

### 2.1 Composition (AquibraStudio)
RecoveryBanner → LoadErrorBanner → StudioHeader → StudioPanels → IssuesPanel
→ StudioModals → ConflictModal → StudioFooter → StructurePopover →
PreviewOverlay → UpgradeModal → OnboardingMount → StaleApprovalModal →
PublishConfirmModal. Loading gate: StudioSkeleton until composer.

### 2.2 Topbar (StudioHeader)
Exit (guarded: dirty vs risky-offline variants + beforeunload), live site
name, SaveState `offline>saving>error>unsaved>saved` (+`conflict`
announcement that can't fire today, D23), review pill 6-state map +
amber-demotion rule, tools cluster (clientView → Comments only; else
Preview + Comments + IssueChip), Presence (collab flag), notifications bell +
NotificationPanel (loading/error/empty/list), Publish button 4-state +
blocked-reason ladder (flag/VIEWER/offline — disabled-with-reason, never
hidden), SendForReview (clientView only; idle|sending|sent|again|error),
SiteMenu (Site/Build/Share/Workspace/Help groups), publish-anyway confirm
(top-3 issues + N more), 2 aria-live regions, ⌘K handler.

### 2.3 Footer
Structure button (**e3 rail only → StructurePopover unreachable on default
rail, D8**), selection label + live dims, Device · Zoom%. Dead props:
onZoomChange, syncConnected (D25).

### 2.4 Command palettes (three)
Shell ⌘K (Recent/Navigation/Edit/View/History/Commands) — **Navigation
broken for 5 tabs (D4): ai/components/publish/review/content absent from
VALID_LEFT_TABS → silent no-ops.** Canvas ⌘⇧P palette. Pages panel-scoped ⌘K
(double-binding when Pages open, D30).

### 2.5 Shell modals
PublishConfirmModal (approval line states; omits deploy target/changelog/
scheduling — unbacked by schema), StaleApprovalModal, ConflictModal
(Reload/Save backup/Overwrite, first-conflict-wins), ProjectSettingsModal,
CMS modals ×2, CreateComponentModal + SaveAsComponentModal (two distinct
create flows), SaveTemplate/Export/KeyboardShortcuts/MediaLibrary/
ImageEditor/IconPicker/CollectionSetup (always mounted + error sinks),
UpgradeModal, IssuesPanel (filters, empty, fix/fix-failed, ignore;
jump-to-element only closes, D26), NotificationPanel, PublishHistory
(rollback ADMIN-gated), RecoveryBanner, LoadErrorBanner, PreviewOverlay,
PageTabBar (canvas foot: rename, ctx menu, delete confirm, dirty dots).

### 2.6 Save/sync/publish hooks
useComposerInit (+onLoadError), useSaveCallback (SaveOutcome
saved|queued-offline|conflict|error), useHistoryFeedback, useExportHandlers,
usePublishJob (poll 2s; blockedReason stale-approval|needs-approval —
needs-approval has NO override UI, documented), usePublishOutcomeFlash,
useCmsSync/useVersionSync/useComponentSync, useAltTextAutoTrigger,
useBlockInsertion (XSS boundary), regionCycle (F6). Possibly-orphan (D27,
verify): useDeviceZoom, useDomainModals, useContentModals, useGlobalModals,
useOverlayState, useFormHandler.

## 3. Inspector

- **7 profiles** (`config/elementProfiles.ts`): CONTAINER (fallback), TEXT,
  FLEX, GRID, MEDIA, BUTTON, INPUT — over 40 element-type keys; unknown →
  fallback + warn.
- **Tabs removed:** profiles declare style/element/effects but ProInspector
  renders flat concatenated column (D22).
- 19 section ids across 5 family files; VariantSection separate;
  schema-driven renderer half-built (border shipped, spacing schema has no
  section — D24).
- Body-level exclusive states: multi-select → MultiSelectToolbar only;
  empty → InspectorEmptyState; AI agent takeover card; whole-site banner +
  "Open Brand"; normal flat.
- Header: icon+label, pick-element crosshair, select-parent, ✦ AI chip
  (comment: "never shipped: harness had no recipe"), BindingPopover,
  element ⋯ menu + DeleteConfirmModal.
- Pill row: ScopeDropdown, BreakpointPill (+override dot), StateDropdown
  (pseudo-states), DetachInstanceButton.
- Density gate: `fewer` → 3 sections + "Simplified view" notice + Show all.
- Machinery: mixed-value detection, TokenPickerPopover, batch style panel,
  per-element scroll persistence, propertiesRegistry (1109 lines),
  `USE_DEV_MODE` flag for dev sections.

## 4. Panels / media / design-system

- KeyboardShortcutsPanel (modal) + canvas KeyboardCheatSheet — **two
  shortcut overlays, both bind `?` (D29)**.
- VersionHistoryPanel + version-history/* (see History).
- RichTextEditor — mounted during canvas inline edit.
- `editor/media/`: LibraryManager (fullpage), MediaLibraryPanel (picker
  modal), OptimizationPanel, ImageEditorModal (586 lines), IconPickerModal.
- **Brand** (`editor/design-system/`): DesignSystemTab, 4 sections
  tokens|styles|components|export with ARIA keyboard nav + section-switch
  dirty guard. **14 token registries** (color, type, spacing, radius, shadow,
  motion, border, opacity, zindex, breakpoint, grid, sizing, icon, imagery)
  + **11 style-preset registries** (button, card, form, link, badge, alert,
  tooltip, modal, nav, table, layout). Modals: AddToken, Review (staged
  diff), TabGuard, AIPrompt (dsAi flag), StarterGallery (6 starters,
  first-run), MigrationProgress (running/complete/failed/skipped).
  DSLintBanner (debounced 500ms), DraftChip, DSModeToggle, ColorModeToggle,
  ExportDropdown. Mounts at StudioPanels behind 3 providers.

## 5. Canvas

- 32 hooks on Canvas.tsx (sync, selection, context-menu, indicators, size,
  snapping, inline-edit, drag/drop ×8, guides, hover, marquee, keyboard,
  section-reorder, collaboration, resize, …).
- **CanvasFooterToolbar:** Undo/Redo (+disabled), BreakpointSwitcher
  (4-way with wide), 6 overlay toggles (Snap/Spacing/Grid/Rulers/Badges/
  X-Ray), zoom −/%/+ + presets + Fit, help `?`.
- Context menu: 36 actions in 4 groups + submenus + select-from-stack;
  auto-close rules. (6 context menus app-wide.)
- Overlays via CanvasOverlayGroup: grid, rulers (+draggable guides), smart
  guides, selection box + handles, selection label, multi-select badge,
  hover (+drag handle +spacing labels), drop feedback (valid/invalid +
  reason + slot rect), section-reorder handles, remote cursors, breadcrumb,
  spot spacing, marquee, RichTextEditor, UnifiedSelectionToolbar
  (+AiPromptPopover +BlockPickerModal), AlignmentToolbar (multi-select).
- Drag/drop: block drag, re-parent, touch, keyboard move, auto-scroll,
  nesting rules (574 lines), toasts.
- CanvasEmptyCTA: "Browse templates" / "Start blank".
- CommentLayer: click-to-pin, draft modal, orphan detect/reattach.
- **DEAD (D16):** QuickAddBar, ZoomControl, ZoomControls, UndoRedoControls,
  DeviceSelector, CanvasSpot, CanvasSpotBadge, SmartSuggestions — all
  barrel-only.

## 6. Cross-cutting

- **Preview ×3:** in-shell sanitized overlay; engine preview mode
  (UI_TOGGLE_PREVIEW); client view (?view=client → Comments-only tools,
  density fewer, SendForReview). Plus version-preview banner, template
  preview, snapshot hover, export modal preview, device frame.
- **Publish chain:** flag → VIEWER → offline → server pre-checks → issue
  confirm → PublishConfirmModal → publish → poll → stale-approval /
  needs-approval gates → outcome flash + history/rollback.
- **Review flow:** SendForReview (clientView) → pill → ReviewTab → compare →
  publish gates; CommentLayer pins ↔ Detached group. ReviewService: 10
  functions; revoke outcomes revoked|token-changed|already-revoked|failure.
- **Permission gates:** see table in §6.4 of the sweep — VIEWER (publish/
  send/issues), ADMIN (rollback, template apply), clientView, density,
  plan tier (only `integrations` locks, D11), 4 feature flags, USE_DEV_MODE.
- **Offline/conflict/recovery:** offline outranks save states; risky exit
  variant refuses fake save; ConflictModal; crash sentinel RecoveryBanner;
  LoadErrorBanner variants; SaveOutcome 4-state.
- **Onboarding:** checklist + achievement prompts + minimized pill;
  step `trigger-publish` maps to settings panel (stale); **"Replay tour"
  dead — onReplayTour={undefined} (D13).**

## 7. Dead / unreachable / half-built ledger (30 items)

| # | Item | Anchor |
|---|---|---|
| D1 | useBuildTab favorites/cats/insertionContext (12 members, 0 consumers) | tabs/build/hooks/useBuildTab.ts:102-275 |
| D2 | Insert loading/load-error blocks (tests-only) | tabs/build/components/InsertStateBlocks.tsx |
| D3 | ReviewTab "Re-send" visible no-op | TabRouter.tsx:208 vs LeftSidebar.tsx:588-609 |
| D4 | CmdK open AI/Components/Publish/Review/Content = silent no-ops | CommandPalette.tsx:46-58 + useEditorEventListeners.ts:133-139 |
| D5 | TabRouter case "settings" unreachable | TabRouter.tsx:218 |
| D6 | Settings unsaved-guard + rail dirty dot unreachable | LeftSidebar.tsx:99,352,616-624 |
| D7 | FullPageRouter case "templates" unreachable | FullPageRouter.tsx:58 |
| D8 | StructurePopover unreachable on default rail | StudioFooter.tsx:91 |
| D9 | SiteMenu "Ask AI" dead on default rail | StudioHeader.tsx:633 |
| D10 | Plugins/Publish-history sub-tab targeting dead; no `plugins` screen | AquibraStudio.tsx:410,412 + StudioPanels.tsx:173-175 |
| D11 | Settings plan-gate key `advanced` matches no screen | settings/types.ts:61-64 |
| D12 | LockedScreen coming-soon variant unused | settings/screens/LockedScreen.tsx:40-51 |
| D13 | Settings "Replay tour" never sourced | StudioPanels.tsx:466 |
| D14 | onHelpClick never supplied to any panel | LeftSidebar.tsx:512, FullPageView.tsx:52 |
| D15 | MediaTab in-tab fullpage branch unreachable | MediaTab.tsx:365-486 |
| D16 | 8 dead canvas controls (QuickAddBar, ZoomControl(s), UndoRedo, DeviceSelector, CanvasSpot ×2, SmartSuggestions) | canvas/controls/*, canvas/spots/* |
| D17 | templates/TemplatePreview.tsx barrel-only | templates/index.ts:14 |
| D18 | 4 dead sidebar/shared components | sidebar/shared/index.ts |
| D19 | 6 dead chrome-ui components (EditorShell, RightPanel, SiteCard, MediaCard, NavItem, TreeRow) | editor/chrome-ui/* |
| D20 | E3 rail metadata + FourToolRail (?rail=e3 only) | tabsConfig.ts:312-348 |
| D21 | Legacy zone rail (?rail=legacy only) | LeftSidebar.tsx:94,553 |
| D22 | Inspector 3-tab strip collapsed to flat | elementProfiles.ts:35-41 vs ProInspector.tsx:413 |
| D23 | Save `conflict` announcement unproducible | StudioHeader.tsx:140-144 |
| D24 | Schema renderer `spacing` half-built | inspector/renderer/schemas/spacing.ts |
| D25 | StudioFooter onZoomChange/syncConnected dead props | StudioFooter.tsx:45-48 |
| D26 | IssuesPanel jump-to-element only closes | AquibraStudio.tsx:501 |
| D27 | 6 possibly-orphan shell hooks (verify) | shell/hooks/* |
| D28 | Duplicate LayerContextMenu | tabs/layers + panels/layers |
| D29 | Two `?` shortcut overlays | KeyboardCheatSheet + KeyboardShortcutsPanel |
| D30 | Three command palettes; ⌘K double-binds with Pages panel | shell/canvas/pages palettes |
