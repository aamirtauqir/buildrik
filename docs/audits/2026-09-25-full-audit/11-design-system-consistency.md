# Audit 11: Design System and Component Consistency

**Scope:** Prompt 11 only. It covers buttons, inputs, search, panel headers, drawers, modal shells, popovers and menus, tabs, chips and badges, rows, empty and error states, toolbars, rail items, inspector sections, presence avatars, comment components and collab indicators, across `packages/editor/src` (with emphasis on the `chrome-ui/` library), `packages/dashboard` (`app/`, `components/`, `components/dashboard/primitives/`), and the collab engine where it paints UI (`engine/collaboration/CollaborationManager.ts`).

**Agent:** C, Interaction & UX. The run was read-only. The only file written is this report.

---

## Method and runtime status

**What I ran**

| Command | Result |
|---|---|
| `pnpm run gate:chrome-ui-surface` (editor) | PASS: 0 direct flowbite imports outside `chrome-ui/`. The manifest lists 7 wrapper names (`Button`, `Select`, `TextInput` and their types). |
| `pnpm run gate:styling-ratchet` (editor) | PASS: inline_literal 607, inline_hoisted 254, css_lines 6786. |
| `pnpm run gate:design-debt-ratchet` (editor) | PASS: all six populations are at 0. |
| `jsx-inline-element-scanner.ts` over `src/editor/**` (the Gate 24 scope) | 0 hits across 372 files. |
| The same scanner over `src/**` outside `src/editor/` (outside Gate 24's scope) | **14 hits**: `shared/forms/*` (10) and `templates/*` (4). |
| `pnpm run gate:ds` (dashboard) | PASS on 7 gates, but D7's pattern is stale (see A11-12). |
| `pnpm run gate:figma` (dashboard) | PASS. |
| `pnpm run gate:button-variants` (dashboard) | **Could not run.** The Playwright browsers are not installed. |
| `vitest run src/editor/chrome-ui/__tests__` | 38 files, **243/243 passed**. |
| Consumer counts | grep / ripgrep for `<Component` usage outside `chrome-ui/` and outside `__tests__`. The counts below come from that. |

**NOT RUNTIME VERIFIED**
- **Visual output:** nothing was rendered, measured or screenshotted.
- **Keyboard and focus behaviour:** claims about focus traps, Escape and arrow keys come from reading the code, not from pressing keys.
- **Collab colours:** the claim that every collaborator's cursor is the same red (A11-15) comes from reading the code. There was no live multi-user session.
- **Dashboard raw-control counts:** these are grep counts. I sampled and read about 10 files, not all 99.
- **Dashboard button variants:** the Playwright gate `gate:button-variants` could not execute here.

---

## Output table: pattern consolidation map

| Pattern | Existing components | Duplicate implementations | Files (representative) | Recommended shared component | Required variants | Priority |
|---|---|---|---|---|---|---|
| **Editor shell and rail** | chrome-ui `EditorShell`, `Rail`/`RailItem`, `RightPanel`, `Drawer`, `Footer`: **0 production consumers** | `LeftSidebar` with 3 rail renderers (`RailZone`, `FigmaRail`, `FourToolRail`) on `.ls-btn` CSS; `LayoutShell` with its own `Drawer` slot; `StudioFooter` | `sidebar/LeftSidebar.tsx:113-360`, `rail/LayoutShell.tsx:75`, `shell/StudioFooter.tsx` | Adopt the chrome-ui `EditorShell`/`Rail`/`Footer` in the live shell, or delete them | rail: icon-only / labelled, active bar, dirty dot | **P1** |
| **Modal / dialog shell** | `ModalRoot`/`ModalContent` (58 files), `Modal` (3), `OverlayMount`, `ConfirmDialog` (12) | 12 hand-built `role="dialog"` shells, **none** using `useFocusTrap` | `shell/modals/ConflictModal.tsx:41`, `onboarding/AchievementPrompt.tsx:146`, `media/*Overlay.tsx` ×3, `ReplaceAcrossDialog.tsx:179`, `TemplatePreviewModal.tsx:154`, `PageSettingsDrawer.tsx:106`, `TimeTravelScrubber.tsx:335`, 3 palettes | `ModalRoot`/`ModalContent`, plus a `Drawer` for the side sheet | size (8 today), full-screen overlay, side-sheet | **P1** |
| **Command palette** | chrome-ui `CommandPalette` (0 consumers), `Kbd` | ⌘K 674 lines, ⌘⇧P 501, Pages palette 161, dashboard `search/command-palette.tsx` | `shell/modals/CommandPalette.tsx`, `canvas/controls/CommandPalette.tsx`, `sidebar/tabs/pages/components/PageCommandPalette.tsx` | chrome-ui `CommandPalette` with command providers | scoped (page) / global | P2 |
| **Button roles** | `Button` `variant` (primary/secondary/ghost/link/danger) | 85 lines in 48 files hand-roll the ghost look on `color="light"`, plus 12 local `const GHOST` strings; `color="light"` appears 332 times against about 20 uses of `variant=` | `design-system/ui/sections/TokenDetailView.tsx:79`, `ImportCard.tsx:89`, `CommentLayer.tsx:496`, `ConflictModal.tsx:88` | `variant="ghost"` / `"secondary"` | the existing five | P2 |
| **Button vocabulary across packages** | editor `Button` and dashboard `primitives/button.tsx` | The word `ghost` means **opposite** things: transparent in the editor, bordered white in the dashboard | `chrome-ui/buttonTheme.ts:37-40`, `dashboard/components/dashboard/primitives/button.tsx:13-21` | One role vocabulary in DESIGN.md | primary / secondary / ghost / link / danger | P2 |
| **Tabs and segmented controls** | chrome-ui `Tabs` (4 consumers; roving tabindex plus arrow keys) | 12 bespoke `role="tablist"`, 8 of them with no arrow-key handling | `HistoryTab.tsx:240`, `CompareView.tsx:104`, `TemplatesTab.tsx:479,495`, `FormsScreen.tsx:275`, `PageSettingsDrawer.tsx:116`, `PresetDetailPane.tsx:143`, `ColorModeToggle.tsx:41`, `TemplateUsageDrawer.tsx:93` | `Tabs`, plus a new `SegmentedControl` (same keyboard contract) | pill / underline, helper text, disabled tab | P2 |
| **Menus and context menus** | chrome-ui `Popover` + `Menu`/`MenuItem` (roving focus) | 5 of 6 menus hand-roll `role="menu"` with `useClickOutside` | `canvas/menus/ElementContextMenu.tsx`, `panels/layers/components/LayerContextMenu.tsx`, `MediaContextMenu.tsx`, `InspectorElementMenu.tsx`, `ExportDropdown.tsx` | `Menu` (plus an at-point placement) | at-cursor, anchored, destructive item | P2 |
| **Colour control** | inspector `ColorInput` (292 lines) | DS `ColorPicker` (332), `shared/forms/ColorField` (184, raw `<button>`/`<input>`), and native `TextInput type="color"` in `controlRegistry.tsx:145` and `IconPickerModal.tsx:333` | the files listed | A single `ColorInput` primitive | swatch+hex, presets, token-bind | P2 |
| **Form fields** | `TextInput`, `TextField`, `FormField`, `FieldRow`, `Select`, `Slider` | `shared/forms/*` (9 files, 1159 lines); inspector `InputWithUnit`, `SliderInput`, a custom `RangeSlider` (whose name collides with the flowbite `RangeSlider` re-export); `GapSlider`; `SliderRow` | `shared/forms/index.ts`, `inspector/shared/controls/SliderControls.tsx:94`, `InputControls.tsx:134` | chrome-ui `FormField` plus `TextInput` / `Slider` / `NumberInput` | unit, scrub, compact | P2 |
| **Search field** | `sidebar/shared/SearchBar` (3 consumers: debounce, kbd hint, telemetry) | 14 hand-rolled `TextInput`/`TextField` with `placeholder="Search…"` | `LayersTab.tsx`, `PageList.tsx`, `TemplatesTab.tsx`, `ColorTokenList.tsx`, `FontPickerDropdown.tsx:57` (`FontSearchInput`) | Promote `SearchBar` into chrome-ui as `SearchField` | debounced / instant, kbd hint, clear | P2 |
| **Empty state** | chrome-ui `EmptyState` (12 consumers) | `VersionList.tsx:83` defines its own `EmptyState` (same name, CSS classes); `LayersEmptyState`, `InspectorEmptyState`, `EmptyThread`, `CanvasEmptyCTA` | the files listed | `EmptyState` with a `size` / `align` / `action` | inline, panel, canvas | P2 |
| **Rows** | `Row` → `ListRow`/`RecordRow`/`VersionRow`/`CommentRow`/`IntegrationRow` | `VersionList.tsx:117` defines a local `VersionRow` that shadows chrome-ui's; `TreeRow` (documented for "Layers and the Pages tree") has 0 consumers; `PageRow` and `FolderTree` are hand-built | `panels/version-history/VersionList.tsx`, `sidebar/tabs/pages/components/PageRow.tsx` | `TreeRow`, `VersionRow` | tree depth, selectable, drag handle | P2 |
| **Destructive confirm** | `ConfirmDialog` (12) | 5 inline `role="alertdialog"` blocks and 2 two-step inline confirms | `VersionHistoryPanel.tsx:364`, `ReviewTab.tsx:760,990`, `AgentPlan.tsx:210`, `ReplaceAcrossDialog.tsx:179`, `ConflictModal.tsx:85-89`, `VersionList.tsx` (`isDeleteConfirm`) | `ConfirmDialog`, plus an `InlineConfirm` primitive if inline is intended | modal / inline, danger | P2 |
| **Presence and collab indicators** | chrome-ui `Presence` (+`avatarTone`), adapter `collaboration/PresenceIndicators` | The topbar bypasses the adapter and re-derives connection state (drops `offline`); cursor colours come from a second palette | `shell/StudioHeader.tsx:771-785`, `collaboration/PresenceIndicators.tsx:40-45`, `canvas/overlays/RemoteCursorsOverlay.tsx:93,100`, `engine/collaboration/CollaborationManager.ts:37-46,796` | `Presence` + `toneFor(id)` as the single identity colour source | live / reconnecting / offline | P2 / P3 |
| **Comment components** | `CommentRow` (1 consumer: ReviewTab) | Canvas comment composer is an inline-styled `role="dialog"` popover; the external `/review/[token]` renders a raw `<li>` with hex; the dashboard queue has its own `initials()` | `canvas/comments/CommentLayer.tsx:462-505`, `dashboard/app/review/[token]/review-client.tsx:356-360`, `dashboard/components/comments/comment-queue.tsx:18` | `Popover` for the composer; a dashboard `CommentItem` | open / resolved, client / internal | P3 |
| **Status badge / pill** | flowbite `Badge` re-export, `StatusDot` (0 external consumers) | 3 status→tone tables, plus `StatusPill`, `connectionPill`, `SectionStatusBadge`, `ScopeChip`, `DraftChip` | `chrome-ui/IntegrationRow.tsx:18`, `chrome-ui/MediaCard.tsx:15`, `settings/screens/DomainsScreen.tsx:88,107` | A `StatusBadge` with a `tone` prop | neutral / success / warning / danger / pro | P3 |
| **Keyboard hint** | chrome-ui `Kbd` | `ShortcutBadge` ×2 and `KeyBadge` (KeyboardShortcutsPanel) | `shell/modals/CommandPalette.tsx:238`, `canvas/controls/CommandPalette.tsx:471`, `panels/KeyboardShortcutsPanel.tsx:111` | `Kbd` | — | P3 |
| **Dashboard controls** | `primitives/` (Button, Modal, InputField, SelectField, FilterChip, FilterTabs …) | 222 raw `<button>` in 99 files; hand-rolled dropdown menus; 5 `fixed inset-0` overlays not via `Modal`; 86 raw hex literals in 16 files | `components/sites/site-filters.tsx:102-144`, `media/media-library.tsx`, `app/review/[token]/review-client.tsx` (49 hex), `search/command-palette.tsx`, `legal/legal-modal.tsx`, `site-detail/submission-drawer.tsx` | the `primitives/` layer, plus a `Dropdown` primitive | — | P2 |

---

## Findings

### P0

None. No finding in this concern is a security, data-loss, permission or unauthorized-action defect. The ConflictModal scrim-dismiss behaviour (noted in A11-2) is a data-safety **UX** concern, handed to A12. It does not lose data by itself: dismissing leaves the local copy intact.

### P1

#### A11-1: The chrome-ui shell primitives are tested but never rendered; the live shell is a second, hand-built implementation
- **Severity:** P1
- **File:line:**
  - Library: `packages/editor/src/editor/chrome-ui/EditorShell.tsx:1-15`, `chrome-ui/Rail.tsx:1-40`, `chrome-ui/index.ts` (exports).
  - Live shell: `sidebar/LeftSidebar.tsx:113-360,633-681`, `rail/LayoutShell.tsx:75-99,333`, `shell/StudioFooter.tsx:114`.
- **Symbol:** `EditorShell`, `Rail`/`RailItem`, `RightPanel`, `Drawer`, `Footer`/`FooterSpacer`, `NavItem`, `TreeRow`, `FormatRow`, `MediaCard`, `SiteCard`, `StatusDot`, `CommandPalette` (all chrome-ui).
- **Evidence:**
  - I grepped every `<Name` / import outside `chrome-ui/` and `__tests__`. Production consumers:
    - `EditorShell` 0, `RightPanel` 0, `Rail` 0, `Footer` 0.
    - chrome-ui `Drawer` 0. `LayoutShell` defines its own `const Drawer` at `LayoutShell.tsx:75`.
    - `NavItem` 0, `TreeRow` 0, `FormatRow` 0, `MediaCard` 0, `SiteCard` 0, `CommandPalette` 0, `StatusDot` 0.
    - These are only used by one another (`Row` imports `NavItem`, `ListRow` imports `TreeRow`, `UpgradeModal` imports `MediaCard`) and by the 38 test files, which all pass (243/243).
  - `EditorShell.tsx:4-9` states: "Every editor surface renders THIS … The moment a screen hand-builds its own topbar, the two versions start disagreeing." No surface renders it.
  - The live rail is `LeftSidebar`. It has **three** renderers (`RailZone` :113, `FigmaRail` :203, `FourToolRail` :251) built from `Button color="light" className="ls-btn …"` plus `LeftSidebar.css` (418 lines).
  - The live rail uses `role="tab"`/`aria-selected`. The library's `RailItem` uses `aria-current` (`Rail.tsx:3-6`). That is two different accessibility contracts for the same control.
- **Expected:** One shell and rail implementation, whose tests describe what ships.
- **Root cause:** The library was built to the Figma molecules in isolation. The live shell was never migrated onto it. The chrome-ui-surface gate checks import *provenance*, not *adoption*, so an unused primitive is invisible to it.
- **Affected modules:** the editor shell, the rail (all six items), drawers, the footer, the Layers and Pages trees, Command palettes.
- **Recommendation:** Pick one per primitive: either migrate `LeftSidebar`/`LayoutShell`/`StudioFooter` onto `EditorShell`/`Rail`/`Footer`, or delete the unused primitives and their tests. Add an adoption check to `gate:chrome-ui-surface` that fails when an exported component has 0 non-test consumers.
- **Status:** VERIFIED (static; consumer counts by grep). Visual equivalence is NOT RUNTIME VERIFIED.

#### A11-2: Twelve hand-built dialog shells bypass `ModalRoot`/`OverlayMount`, and none uses the focus-trap primitive
- **Severity:** P1
- **File:line:**
  - `shell/modals/ConflictModal.tsx:35-92`
  - `onboarding/AchievementPrompt.tsx:146`
  - `sidebar/tabs/media/components/IconBrowserOverlay.tsx:157`, `StockBrowserOverlay.tsx:194`, `AssetDetailOverlay.tsx:324`, `ReplaceAcrossDialog.tsx:179`
  - `sidebar/tabs/templates/TemplatePreviewModal.tsx:154`
  - `sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx:106`
  - `sidebar/tabs/history/components/TimeTravelScrubber.tsx:335`
  - `shell/modals/CommandPalette.tsx:443`, `canvas/controls/CommandPalette.tsx:282`, `sidebar/tabs/pages/components/PageCommandPalette.tsx:96`
- **Symbol:** as listed. Library side: `ModalRoot`/`ModalContent`/`OverlayMount`/`useFocusTrap`/`Drawer`.
- **Evidence:**
  - Per-file counts, focus trap / Escape handler / portal:
    - ConflictModal: 0/0/0
    - AchievementPrompt: 0/0/0
    - ReplaceAcrossDialog: 0/0/0
    - The other nine: 0 focus traps, and each has its own Escape handler.
  - The compound `ModalRoot`/`ModalContent` is already adopted by 58 files, so the primitive is proven.
  - ConflictModal justifies its bespoke overlay by "Radix-backed vibcoder Modal … mis-fires" (`ConflictModal.tsx:11-17`). vibcoder and Radix were deleted (root `CLAUDE.md`, 2026-07-28), so the rationale is stale.
  - ConflictModal paints raw hex under `@lint-hex-policy` exceptions, uses `zIndex: 2147483646` (:33) outside the overlay stack, and **closes on a scrim click** (`onClick={onClose}` :46). That dismisses a save-conflict choice without an answer.
  - `PageSettingsDrawer` is a side sheet (`bd-pg-drawer`) while chrome-ui `Drawer` has 0 consumers.
- **Expected:** Every modal surface goes through `OverlayMount`, which gives one focus trap, Escape, scrim policy, z-stack and portal root.
- **Root cause:** These dialogs predate the flowbite migration, or were written to escape the since-deleted Radix modal, and were never re-pointed.
- **Affected modules:** Save conflict, Media (3 overlays), Templates preview, Pages settings, History scrubber, Onboarding, the three palettes.
- **Recommendation:**
  - Migrate to `ModalRoot`/`ModalContent`, adding a `fullscreen` size for the media browsers.
  - Migrate `PageSettingsDrawer` to `Drawer`.
  - Give ConflictModal `dismissOnScrimClick={false}`.
- **Status:** VERIFIED (static). Focus behaviour is NOT RUNTIME VERIFIED.

### P2

#### A11-3: Button role vocabulary is half-adopted; the ghost look is still hand-rolled in 48 files
- **Severity:** P2
- **File:line:** `chrome-ui/Button.tsx:24-50`, `chrome-ui/buttonTheme.ts:37-40`. Hand-rolled sites include `design-system/ui/sections/TokenDetailView.tsx:79`, `ImportCard.tsx:89`, `StyleCategoryRow.tsx:76`, `canvas/comments/CommentLayer.tsx:496`, `shell/modals/ConflictModal.tsx:88`.
- **Symbol:** `Button` `variant`, `BK_BUTTON_THEME.color.ghost`.
- **Evidence:**
  - The exact 4-class ghost recipe `tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]` appears on **85 lines in 48 files**, plus 12 files declaring a local `const GHOST`.
  - `variant="ghost"` is used 17 times.
  - `color="light"` is used 332 times, against about 20 `<Button … variant=` sites.
  - The design-debt ratchet drained the *link* recipe to 0 (`check-design-debt-ratchet.mjs:29-37`) but has no population for the ghost recipe.
- **Expected:** One spelling per role: `variant="ghost"`.
- **Root cause:** The `variant` API landed on 2026-08-28 as opt-in sugar (`Button.tsx:14-15`) with no drain for the pre-existing overrides.
- **Recommendation:** Add a `ghost-incantation` population to the design-debt ratchet and codemod it to `variant="ghost"`. Then codemod `color="light"` to `variant="secondary"`.
- **Status:** VERIFIED.

#### A11-4: "ghost" means opposite things in the editor and the dashboard
- **Severity:** P2
- **File:line:** `packages/editor/src/editor/chrome-ui/buttonTheme.ts:37-40` (transparent, borderless); `packages/dashboard/components/dashboard/primitives/button.tsx:8-21` (`ghost: "light"`, "a BORDERED WHITE button").
- **Evidence:**
  - The editor's `secondary` maps to `light`, which is the dashboard's `ghost`.
  - The dashboard has no `secondary` or `link` variant.
  - The editor is bundled into the same Next app (`EditorClient.tsx:9`), so a user moves between both vocabularies in one session.
- **Expected:** One role table in DESIGN.md that both packages implement.
- **Recommendation:** Rename the dashboard `ghost` to `secondary` (78 call sites per its own comment) and add a true `ghost`. This is a **product/design decision** for the naming.
- **Status:** VERIFIED; PRODUCT DECISION REQUIRED on naming.

#### A11-5: Twelve bespoke tablists; eight lack the arrow-key contract that `Tabs` provides
- **Severity:** P2
- **File:line:** `sidebar/tabs/history/HistoryTab.tsx:240`, `panels/version-history/CompareView.tsx:104`, `sidebar/tabs/templates/TemplatesTab.tsx:479,495`, `settings/screens/FormsScreen.tsx:275`, `pages/page-settings/PageSettingsDrawer.tsx:116`, `design-system/ui/sections/PresetDetailPane.tsx:143`, `design-system/ui/ColorModeToggle.tsx:41`, `templates/components/TemplateUsageDrawer.tsx:93`. `PageTabBar.tsx:221` and `LeftSidebar.tsx:321,642` do handle arrows.
- **Evidence:**
  - chrome-ui `Tabs` implements roving tabindex, arrows and Home/End (`Tabs.tsx:70-72`), with 4 consumers.
  - The listed files each build `role="tablist"` from `Button role="tab"`, with 0 `ArrowLeft`/`ArrowRight` handlers.
  - There is no segmented-control primitive, so `ButtonGroup`/`CompactButtonGroup` (inspector), `ColorModeToggle` `Pill`, `TypePills` and `ImageEditorTabs` `Chip` each re-implement one.
- **Recommendation:** Migrate to `Tabs` (its `tabClassName` already exists for restyling). Add `SegmentedControl` with the same keyboard contract.
- **Status:** VERIFIED (static). Keyboard behaviour is NOT RUNTIME VERIFIED; A13 owns the accessibility impact.

#### A11-6: Three live command palettes plus an unused library palette
- **Severity:** P2
- **File:line:** `shell/modals/CommandPalette.tsx` (674 lines, ⌘K), `canvas/controls/CommandPalette.tsx` (501, ⌘⇧P), `sidebar/tabs/pages/components/PageCommandPalette.tsx` (161), `chrome-ui/CommandPalette.tsx` (138, 0 consumers), `dashboard/components/search/command-palette.tsx`.
- **Evidence:**
  - Each palette builds its own dialog, input, list and keyboard handling.
  - Two define an identical local `ShortcutBadge` (`:238`, `:471`) instead of `Kbd`.
  - None imports chrome-ui `CommandPalette`.
- **Recommendation:** One palette component with scoped providers. The IA question of *how many* palettes belongs to A03/A05; this finding is about the component duplication.
- **Status:** VERIFIED.

#### A11-7: Five colour-control implementations
- **Severity:** P2
- **File:line:** `inspector/shared/controls/ColorInput.tsx` (292), `design-system/ui/colors/ColorPicker.tsx` (332), `shared/forms/ColorField.tsx` (184; raw `<input type="color">` :72 and a raw `<button>` :105), `inspector/renderer/controlRegistry.tsx:143-148`, `media/IconPickerModal.tsx:332-336` (native `TextInput type="color"`).
- **Evidence:**
  - `ColorField` is live: it is imported by `panels/RichTextEditor.tsx:8,230,249` (via `CanvasOverlayGroup`) and by `controlRegistry`.
  - Swatch size, preset behaviour and token-binding differ between the five.
- **Recommendation:** A single `ColorInput` primitive in chrome-ui, with swatch, hex, presets and token-bind variants.
- **Status:** VERIFIED.

#### A11-8: A parallel form-field library (`shared/forms`) outside chrome-ui and outside Gate 24; slider variant explosion
- **Severity:** P2
- **File:line:** `packages/editor/src/shared/forms/index.ts:8-16` (9 components, 1159 lines); `inspector/shared/controls/SliderControls.tsx:33,94`, `InputControls.tsx:134`; `inspector/sections/flexbox/controls.tsx:121`; `media/image-editor/ImageEditorTabs.tsx:76`; Gate 24 scope at `packages/editor/scripts/ds-grep-gates.sh:614-638`.
- **Evidence:**
  - The scanner over `src/**` outside `src/editor` finds 14 raw native elements, 10 of them in `shared/forms` (`FormSettingsSection.tsx:104-163`, `FileField.tsx:106,153`, `ColorField.tsx:72,105`). Gate 24 only scans `packages/editor/src/editor`.
  - `FileField` and `FormSettingsSection` have no importer besides the barrel (dead).
  - `shared/forms` is imported with banned `../../../../` paths (`inspector/sections/interactions/InteractionEditor.tsx:8`).
  - There are 7 slider implementations:
    - chrome-ui `Slider`
    - the flowbite `RangeSlider` re-export
    - inspector `SliderInput`
    - inspector custom `RangeSlider`, which has the **same exported name** as the chrome-ui barrel's flowbite `RangeSlider`
    - `SliderField`
    - `GapSlider`
    - `SliderRow`
  - `TextInput` (65 files) and `TextField` (20 files) are two input primitives whose `className` lands on different elements (documented in `packages/editor/CLAUDE.md`, "className and style reach DIFFERENT elements").
- **Recommendation:** Fold `shared/forms` into chrome-ui `FormField` compositions, delete the dead fields, and widen Gate 24 to `packages/editor/src/**` minus `blocks/`. Rename the inspector `RangeSlider`.
- **Status:** VERIFIED.

#### A11-9: The search field is re-implemented 14 times; the only shared one lives in `sidebar/shared`
- **Severity:** P2
- **File:line:** `sidebar/shared/SearchBar.tsx:28` (debounce, kbd hint, telemetry; used by `BuildTab`, `MediaTab`, `StockSourceModal`). Hand-rolled in `LayersTab`, `PageList`, `TemplatesTab`, `DrawerGallery`, `ColorTokenList`, `FontPickerDropdown.tsx:57` (`FontSearchInput`), `TokenPickerPopover`, `IconPickerModal`, `SiteFontsModal`, `KeyboardShortcutsPanel`, `KeyboardCheatSheet`, `BlockPickerModal`, `IconBrowserOverlay`, `StockBrowserOverlay`, `SlimLauncher`.
- **Evidence:**
  - 11 of the hand-rolled fields use `TextInput` and 4 use `TextField`.
  - Clear buttons, icons and debounce differ between them.
  - Search telemetry (`trackSidebar("search")`) fires only for the 3 `SearchBar` users.
- **Recommendation:** Promote `SearchBar` into chrome-ui as `SearchField`, with `debounceMs`, `kbdHint` and `onClear`.
- **Status:** VERIFIED.

#### A11-10: The History panel shadows chrome-ui's `VersionRow` and `EmptyState` with same-named local components
- **Severity:** P2
- **File:line:** `panels/version-history/VersionList.tsx:83` (`export function EmptyState`, CSS `.empty-state`), `:117` (`export function VersionRow`). chrome-ui `VersionRow` is used by `shell/PublishHistory.tsx:340` and `media/components/AssetDetailsPanel.tsx:384`.
- **Evidence:**
  - Two components exported as `VersionRow` and two as `EmptyState` exist in one package, with different props and styling.
  - The main History surface uses the local pair, while Publish History uses the library pair.
  - There are also bespoke empties: `LayersEmptyState`, `InspectorEmptyState`, `EmptyThread`, `CanvasEmptyCTA`.
- **Recommendation:** Rebase the local `VersionRow` on chrome-ui `VersionRow` (adding compare and delete-confirm actions) and delete the local `EmptyState`.
- **Status:** VERIFIED.

#### A11-11: Five of six menus bypass the `Menu` primitive's roving-focus contract
- **Severity:** P2
- **File:line:** `canvas/menus/ElementContextMenu.tsx`, `panels/layers/components/LayerContextMenu.tsx`, `sidebar/tabs/media/components/MediaContextMenu.tsx`, `inspector/components/InspectorElementMenu.tsx`, `design-system/ui/ExportDropdown.tsx`. Only `PageContextMenu.tsx` uses `<Menu>`/`<MenuItem>`.
- **Evidence:**
  - Each hand-rolls `role="menu"` plus `useClickOutside`. 14 files use `useClickOutside` for popovers.
  - Four of the five have 0 `ArrowDown` handlers.
  - `sidebar/tabs/layers/components/LayerContextMenu.tsx` is a second LayerContextMenu with **no importer** (dead duplicate).
  - `POPOVER_BASE_CLASS` is borrowed as a bare class string in 3 files (`StudioFooter`, `AddPageButton`, `PageContextMenu`), which reproduces the look without the behaviour.
- **Recommendation:** Add an at-point placement to `Popover`/`Menu` and migrate. Delete the dead duplicate.
- **Status:** VERIFIED.

#### A11-12: The dashboard's "Flowbite-first / primitives-first" rule is unenforced; the hex gate D7 is stale
- **Severity:** P2
- **File:line:** `packages/dashboard/AGENTS.md` ("Never a fourth option. A raw `<button>` … in a screen means one of the three above was skipped"); `packages/dashboard/scripts/ds-grep-gates.sh:158` (D7 pattern); `components/sites/site-filters.tsx:102-144`; `app/review/[token]/review-client.tsx:236,300,332,349,448`.
- **Evidence:**
  - Outside `primitives/` there are **222 raw `<button>` in 99 files**, 33 raw `<input>`, 14 `<textarea>` and 11 `<table>`.
  - flowbite is imported directly only for `Spinner`/`ToggleSwitch`. No flowbite Dropdown, Tabs or Tooltip is used anywhere, so dropdowns are hand-rolled (e.g. `site-filters.tsx` sort, advanced and "Created by" menus).
  - 5 `fixed inset-0` overlays bypass `primitives/modal.tsx`: `legal-modal`, `search/command-palette`, `clients-view`, `submission-drawer`, `review-client`.
  - D7 greps only the **pre-2026-05 palette** (`#E42313|#7A7A7A|…`), so it passes while **86 raw hex literals in 16 files** exist. 49 of them are in the client-facing `/review/[token]` page, which hand-rolls its CTAs as `bg-[#1A56DB] … disabled:opacity-40`, the disabled treatment the editor's `buttonTheme.ts:18-29` explicitly rejects.
- **Recommendation:**
  - Add a dashboard raw-control ratchet (the editor's AST scanner is reusable).
  - Update the D7 pattern to the current token hex set.
  - Move `/review/[token]` onto `primitives/Button`.
- **Status:** VERIFIED (counts by grep; about 10 files read).

#### A11-13: The topbar bypasses the presence adapter and re-derives connection state; `offline` never renders
- **Severity:** P2 (collab is behind the flag and off in production; this becomes load-bearing the day the flag flips)
- **File:line:** `shell/StudioHeader.tsx:30,771-785`; `collaboration/PresenceIndicators.tsx:40-45,59-72`; `chrome-ui/Presence.tsx:42-46,106-117`.
- **Symbol:** `toPresenceUsers`, `PresenceIndicators`, `Presence`.
- **Evidence:**
  - StudioHeader imports only the helper `toPresenceUsers`. It passes `presence = null` whenever `collaborationState === "disconnected"`, and otherwise maps to `"live" | "reconnecting"`.
  - The adapter's own `CONNECTION` table (`disconnected → "offline"`) and the `PresenceIndicators` component have **no consumer**; the only reference is the barrel.
  - As a result `Presence`'s `offline` pill (`aria-live="assertive"`, copy "Offline", described as "the only place a user learns that their edits are not landing", `Presence.tsx:4-6`) is unreachable.
  - `max` also differs: the adapter defaults to 3, the topbar passes 2.
- **Recommendation:** Render `PresenceIndicators` from the topbar (or delete it) so that a single mapping owns connection state, including `offline`. A12/A16 own the disconnect-feedback semantics.
- **Status:** VERIFIED (static). NOT RUNTIME VERIFIED.

#### A11-14: The destructive-confirm pattern is split between `ConfirmDialog` and inline alertdialogs
- **Severity:** P2
- **File:line:** `ConfirmDialog` is used in 12 files. Inline versions: `panels/VersionHistoryPanel.tsx:364` (restore), `sidebar/tabs/review/ReviewTab.tsx:760,990`, `sidebar/tabs/ai/AgentPlan.tsx:210`, `media/components/ReplaceAcrossDialog.tsx:179`, and two-step inline in `ConflictModal.tsx:85-89` and `VersionList.tsx` (`isDeleteConfirm`).
- **Evidence:** The same decision (destroy or overwrite) is presented as a modal in some modules and as an inline block with a different button order and colours in others.
- **Recommendation:** Decide modal versus inline per risk class, then add `InlineConfirm` to chrome-ui if inline is kept. A08-5 (destructive in accent blue) overlaps.
- **Status:** VERIFIED; PRODUCT DECISION REQUIRED on modal versus inline.

### P3

#### A11-15: Collab identity colour has two sources; every collaborator's cursor is the same red
- **File:line:**
  - `engine/collaboration/CollaborationManager.ts:37-46` (`USER_COLORS`, 8 raw hex including indigo `#818cf8` and fuchsia `#e879f9`), `:61` (`colorIndex = 0`), `:121-125,148-152` (`createRoom`/`joinRoom` call `assignUserColor()` once for `currentUser`), `:796-799`.
  - `canvas/overlays/RemoteCursorsOverlay.tsx:93,100`.
  - `chrome-ui/Presence.tsx:34-39` (`toneFor(id)`, 5 flowbite tones).
- **Evidence:**
  - Each client assigns *itself* `USER_COLORS[0]` (`#f87171`) and broadcasts it as `userColor`, so every remote cursor is red.
  - The avatar for the same person uses a hashed tone, so cursor and avatar never match.
  - The cursor label is white (`--bk-accent-on`) on the palette colour. Yellow `#facc15` would fail contrast if reached.
  - `CollaborationManager.ts` is allowlisted in Gate 18 (`ds-grep-gates.sh:531`).
- **Recommendation:** Drive the cursor from `toneFor(user.id)` and delete `USER_COLORS`.
- **Status:** PARTIAL: the code path is verified, but there was no multi-user runtime. Collab is flag-off in production.

#### A11-16: Status-badge tone tables are duplicated; there is no `StatusBadge` primitive
- **File:line:** `chrome-ui/IntegrationRow.tsx:18`, `chrome-ui/MediaCard.tsx:15`, `settings/screens/DomainsScreen.tsx:88,107`, `settings/screens/AnalyticsScreen.tsx:76`, `design-system/ui/SectionStatusBadge.tsx:134`, `sidebar/tabs/ai/ScopeChip.tsx:18`.
- **Evidence:** Each file maps a status to a flowbite `color` plus `className` overrides on its own. `StatusDot` has 0 external consumers.
- **Recommendation:** A chrome-ui `StatusBadge` with a `tone` prop.
- **Status:** VERIFIED.

#### A11-17: `Kbd` is bypassed by 3 local key badges
- **File:line:** `shell/modals/CommandPalette.tsx:238`, `canvas/controls/CommandPalette.tsx:471`, `panels/KeyboardShortcutsPanel.tsx:111`. `KeyboardCheatSheet.tsx:111` correctly wraps `Kbd`.
- **Status:** VERIFIED.

#### A11-18: The canvas comment composer is an inline-styled bespoke popover; comment rendering exists 4 ways
- **File:line:** `canvas/comments/CommentLayer.tsx:462-505` (a `role="dialog"` div with inline style, and a ghost Cancel via class overrides); `chrome-ui/CommentRow.tsx` (1 consumer); `dashboard/app/review/[token]/review-client.tsx:358-360` (raw `<li>`, `text-[#374151]`); `dashboard/components/comments/comment-queue.tsx:18` (its own `initials()`, duplicating `avatarTone.avatarInitials`).
- **Recommendation:** Move the composer onto `Popover`, and add a dashboard `CommentItem` primitive.
- **Status:** VERIFIED.

#### A11-19: Two modal APIs with two width vocabularies
- **File:line:** `chrome-ui/Modal.tsx:13,47-51` (`kind`: question 440 / form 560 / flow 720); `chrome-ui/ModalParts.tsx:26-38` (`size`: 8 steps, where `lg` 720 equals `flow`).
- **Evidence:**
  - `ModalParts.tsx:3-7` calls the prop-based `<Modal>` "the recommended form", but it has 3 consumers against 58 for the compound form.
  - Size usage in the compound form: `table` 25, `lg` 14, `form` 13, `question` 5, `md` 4, `fields` 1, `xl` 1.
- **Recommendation:** Declare the compound form canonical and fold `kind` into `size`.
- **Status:** VERIFIED.

#### A11-20: Documentation drift on the closed wrapper set
- **File:line:** `packages/editor/CLAUDE.md` ("closed 2-wrapper set … `TextInput`, `Select`"); `chrome-ui/Button.tsx:2` ("third member"); `chrome-ui/Tooltip.tsx:4` (also "THIRD entry"); the gate output lists `Button`/`Select`/`TextInput` as wrappers and counts `Tooltip` as local.
- **Evidence:** Two files each claim to be the "third" wrapper. The documentation says there are two. The gate says three.
- **Recommendation:** Reconcile `CLAUDE.md`, the manifest and the headers.
- **Status:** VERIFIED.

#### A11-21: Dead UI duplicates that inflate the variant surface
- **File:line:**
  - `templates/MyTemplates.tsx` and `templates/TemplatePreview.tsx`: raw `<button>`, exported only from `templates/index.ts`, which nothing imports.
  - `sidebar/shared/FilterChips.tsx` and `sidebar/shared/ViewSwitcher.tsx`: no importer.
  - `sidebar/tabs/layers/components/LayerContextMenu.tsx`: no importer.
  - `shared/forms/FileField.tsx` and `FormSettingsSection.tsx`: barrel-only.
- **Recommendation:** Delete. A14/A17 own dead code; they are listed here because each one is a competing variant of a live pattern.
- **Status:** VERIFIED (by importer grep).

---

## Good as-is

- **The single import surface holds.** 0 direct `flowbite-react` imports outside `chrome-ui/`, barrel purity passes, and `gate:vibcoder-ratchet` / `gate:editor-ui-gone` are locked at 0.
- **Gate 24 is real within its scope.** The AST scanner finds 0 raw `<button>/<input>/<select>/<textarea>` across 372 files under `src/editor`.
- **Modal adoption.** `ModalRoot`/`ModalContent` has 58 consumers. `ConfirmDialog` has 12, and `OverlayMount` centralises scrim, Escape and dirty-pulse.
- **The Row family is properly layered.** `ListRow`/`RecordRow`/`VersionRow`/`CommentRow`/`IntegrationRow` compose `Row`, rather than copying it.
- **Panel headers are layered.** `PanelFrame` delegates to `PanelHeader` (`PanelFrame.tsx:11,96`), so the two entry points cannot drift visually.
- **Presence is a single primitive** with id-derived tone and a text connection pill that does not rely on colour alone. The defects are in its adapters (A11-13, A11-15), not in the primitive.
- **Primitives in active use.** `EmptyState` (12), `TextInput` (65), `Popover` (11), `Tooltip` (10) and `SkeletonBlock` (11) are all used.
- **Primitive design quality.** `Tabs` and `Menu` encode the WAI-ARIA keyboard contracts correctly. The problem is adoption (A11-5, A11-11).
- **Dashboard primitive layer.** It exists, and 85 files use it. `button.tsx`, `modal.tsx`, `input-field.tsx` and `select-field.tsx` are principled.
- **Tests.** All 38 chrome-ui test files pass (243 tests).

## Product decisions required

1. **Shell primitives (A11-1):** migrate the live shell onto `EditorShell`/`Rail`/`Footer`, or delete them? The test suite currently certifies components users never see.
2. **Button role naming across packages (A11-4):** does `ghost` mean transparent (editor) or bordered white (dashboard)?
3. **Destructive confirmation (A11-14):** modal or inline, per risk class?
4. **Palette consolidation (A11-6):** one palette with scopes, or intentionally separate palettes? This decision is shared with A03/A05.
5. **Editor and dashboard design systems:** should they stay two separate component libraries (separate Tailwind prefixes and token names, `--bk-*` versus `--color-*`), or converge on one role and token table in DESIGN.md?

## Overlaps with other audits

- **A12 (states):**
  - ConflictModal is dismissable by a scrim click (A11-2).
  - The `offline` presence state is unreachable (A11-13).
- **A13 (accessibility):**
  - 8 tablists without arrow keys (A11-5) and 4 menus without them (A11-11).
  - 12 dialogs without a focus trap (A11-2).
  - The rail uses `role="tab"` while `RailItem` uses `aria-current` (A11-1).
  - Cursor-label contrast (A11-15).
- **A14 / A17 (dead code, architecture):**
  - The dead duplicates in A11-21, and chrome-ui primitives with 0 consumers (A11-1).
  - The `../../../../` imports into `shared/forms` (A11-8).
- **A16 (collab runtime):** the self-assigned colour index (A11-15) is a symptom of per-client identity. There is no server-assigned user colour.
- **A08 (signifiers):** destructive actions in accent blue (A08-5) intersect with A11-14.
- **A10 (typography):** the `css_lines` 6786 in the styling ratchet and the `.ls-*` / `.bd-pg-*` / `.tpl-*` CSS class systems are layout and type debt beyond this audit's component focus.

---

## AUDIT HANDOFF

- **Agent / Prompt:** C, Interaction & UX / Prompt 11: Design System and Component Consistency
- **Report:** `docs/audits/2026-09-25-full-audit/11-design-system-consistency.md`
- **Counts:** P0 = 0 · P1 = 2 · P2 = 12 · P3 = 7
- **P0:** none.
- **P1:**
  - **A11-1:** The chrome-ui shell primitives (`EditorShell`, `Rail`, `RightPanel`, `Drawer`, `Footer`, plus `NavItem`, `TreeRow`, `FormatRow`, `MediaCard`, `SiteCard`, `StatusDot`, `CommandPalette`) have 0 production consumers. The live shell (`LeftSidebar` with 3 rail renderers, `LayoutShell`, `StudioFooter`) is a second implementation.
  - **A11-2:** 12 hand-built dialog shells bypass `ModalRoot`/`OverlayMount`, with 0 focus traps, including the save-conflict modal.
- **P2:**
  - A11-3: ghost-button recipe in 48 files
  - A11-4: `ghost` means opposite things in the editor and the dashboard
  - A11-5: 12 bespoke tablists
  - A11-6: 3 live command palettes plus 1 unused
  - A11-7: 5 colour controls
  - A11-8: `shared/forms` parallel library outside Gate 24; 7 sliders
  - A11-9: search field re-implemented 14 times
  - A11-10: local `VersionRow` and `EmptyState` shadow chrome-ui
  - A11-11: 5 of 6 menus bypass `Menu`
  - A11-12: dashboard raw controls (222 buttons) and stale D7 hex gate
  - A11-13: presence adapter bypassed, `offline` unreachable
  - A11-14: confirm pattern split
- **P3:**
  - A11-15: collab colours
  - A11-16: status-badge tables
  - A11-17: `Kbd` bypassed
  - A11-18: comment composer and comment rendering
  - A11-19: two modal APIs
  - A11-20: wrapper-set documentation drift
  - A11-21: dead variant duplicates
- **Runtime verified:**
  - The chrome-ui unit suite passed 243/243.
  - The editor gates `chrome-ui-surface`, `styling-ratchet` and `design-debt-ratchet` passed.
  - The dashboard gates `ds` and `figma` passed.
  - The Gate 24 scanner was run both inside and outside its scope.
  - No UI was rendered.
- **NOT RUNTIME VERIFIED:**
  - all visual and measurement claims;
  - focus and keyboard behaviour;
  - multi-user cursor colour;
  - dashboard `gate:button-variants` (the Playwright browsers are missing).
- **Dependencies:**
  - A11-1 should be decided before A11-6 (the palette) and A11-10/A11-21 (rows and dead code), because the answer decides which primitive survives.
  - A11-3 and A11-4 share one role table and should land together.
  - A11-5 and A11-11 are mechanical migrations onto existing primitives and can be batched.
  - A11-8 needs Gate 24 widened in the same change.
  - A11-12 needs the D7 pattern fixed first, or the drain has no guard.
  - A11-13 and A11-15 belong in the collab batch with A16.
- **Inventory corrections:**
  - The rail's "three renderers" are functions inside `LeftSidebar.tsx`, not chrome-ui `Rail`, which is unused.
  - "Command palettes: two in the editor" is actually three: `PageCommandPalette` exists in Pages, plus an unused chrome-ui `CommandPalette` component.
  - The `collaboration/PresenceIndicators` component is not rendered anywhere. Only its helper `toPresenceUsers` is used.
