# C2 — Canvas, selection, manipulation, Navigator (vs Webflow)

Audit date 2026-10-20. Branch `main`, read-only. All paths are relative to `packages/editor/src/`
unless noted. The older audits were used only as leads. Every claim below was re-read in current
source. "Webflow:" lines are recalled product knowledge, not tested in this audit. Ones marked
**(uncertain)** need a live check in Webflow before anyone acts on them.

Two probes were run with vitest from a scratch config outside the repo. No repo file was written.
- `useSelectionBehavior`, first ⌘-click: **0 select calls, stack `[]`, index `NaN`.** This proves bug B1.
- `useCanvasInlineCommands("removeFormat")` on `Hello <strong>bold</strong> world`: **markup is unchanged.** This proves bug B2.

## Architecture in one paragraph (it drives every verdict)

The canvas is **not an iframe**. It is a `<div class="buildrick-canvas">` in the editor's own
document, and engine HTML is injected through `dangerouslySetInnerHTML` (`editor/canvas/Canvas.tsx:786-803`).
Zoom is a CSS `transform: scale()` on the frame (`editor/canvas/canvasStyles.ts:~80`, `Canvas.tsx:109,773`),
with margin compensation (`Canvas.tsx:371-381`). Breakpoints are **not** real viewport media queries
on the canvas. The frame is resized to the device width (`Canvas.types.ts` DEVICE_SIZES ← `shared/constants/breakpoints.ts:103-108`),
and StyleEngine writes a "device-preview block" for the active device (`engine/styles/StyleEngine.ts:40-41`).
Overlays are absolutely-positioned React layers above the div (`editor/canvas/overlays/CanvasOverlayGroup.tsx`).
Drag and drop is native HTML5 DnD with `dataTransfer` MIME keys (`block`, `element`, `layer-id`,
`application/x-aquibra-*`). Webflow, for contrast, renders the site in an iframe, so site CSS and
`@media` evaluate against the frame.

---

## C01 — Canvas viewport / zoom / pan — **PARTIAL**

What exists:
- Zoom presets 10/25/50/75/100/150/200/400 (`shared/constants/canvas.ts:360-368`), clamped to 10–400 (`shared/constants/config.ts:87-88`).
- ⌘= / ⌘- step through the presets. ⌘0 = 100%, ⌘1 = fit, ⌘2 = zoom to selection (`editor/canvas/CanvasFooterToolbar.tsx:194-247`).
- Fit-to-screen (`Canvas.tsx:318-336`) and zoom-to-selection (`Canvas.tsx:342-361`).
- On load, a desktop frame wider than the viewport is auto-fit (`Canvas.tsx:583-594`). A device switch re-fits, capped at 100% (`Canvas.tsx:599-610`).
- A footer View ▸ Zoom flyout with custom entry (`CanvasFooterToolbar.tsx:~420-520`).
- Panning is plain scrollbar or trackpad scrolling of `.bd-canvas-scroll`.

Gaps vs Webflow:
- **No ⌘/Ctrl+wheel or pinch zoom, and no space-drag pan.** No `wheel` handler exists anywhere in `editor/canvas` or `editor/shell`. The only `wheel` listener in the editor is `inspector/ProInspector.tsx:289`.
- Webflow's canvas is not a zoom canvas either. It renders at 100% per breakpoint and has a separate zoom setting **(uncertain)**. For a Webflow switcher, Buildrik's zoom is a superset and mostly a non-issue. The missing wheel-zoom matters more to Framer and Figma users.
- The non-iframe model is the structural difference. Customer `@media` rules (Settings → Advanced custom CSS, injected at `Canvas.tsx:780-781`, and embeds) evaluate against the **editor window** (≥1024 px). They do not evaluate against the 375 px frame, so a mobile media query in custom code never fires on the canvas mobile view. This is suspected from the architecture and was not live-tested.

Severity: P2 (zoom). The custom-CSS/media-query WYSIWYG mismatch is P1 for code-heavy Webflow users (suspected).

## C02 — Breakpoint switching, canvas width, custom widths — **PARTIAL**

What exists:
- Three style breakpoints: desktop base (≥1024), tablet 768–1023, mobile 0–767. The model is desktop-first, cascading down (`shared/constants/breakpoints.ts:16-60`).
- `DeviceType` adds `"wide"` (1920 px preview width) with **no style tier of its own** (`shared/types/state.ts:34`, `breakpoints.ts:104`). It is reachable only from ⌘K "Wide view" (`engine/commands/defaultCommands.ts:636-644`).
- The switch lives in the footer: View ▸ Breakpoint ▸ Desktop / Tablet / Mobile (`CanvasFooterToolbar.tsx:146-150, 390-436`), plus ⌘K `device-*` rows (`defaultCommands.ts:619-644`).
- "Custom width…" opens a modal, range 240–2560 px (`editor/canvas/controls/CustomWidthModal.tsx:13`). It snaps the device to whichever breakpoint that width falls in (`Canvas.tsx:945-953`, `getBreakpointForWidth` `breakpoints.ts:86-90`). This is preview-only state and is lost when the device changes (`Canvas.tsx:717-722`).
- Each device keeps its declared width. The desktop frame is floored at 1024 (`canvasStyles.ts` `minWidth`/`flexShrink:0`).

Gaps vs Webflow:
- Webflow ships 7 breakpoints: 1920/1440/1280 cascade up, desktop base, tablet ≤991, mobile landscape ≤767, mobile portrait ≤478. Its thresholds also differ (tablet 991 vs 1023 here) **(uncertain on exact numbers)**. Buildrik has no large-screen tiers and no landscape/portrait split.
- Webflow keeps the breakpoint icons **permanently visible in the top bar**, with a draggable canvas-width handle. In Buildrik it takes three clicks into a footer menu, and the canvas edge cannot be dragged to resize.
- No keyboard chords for breakpoints. Webflow has some **(uncertain)**.

Severity: **P1.** Responsive editing is a core Webflow loop. A buried switcher plus 3 tiers is major friction. Migrated sites that use 1280+/478 rules have nowhere to land. That data side is the import agent's call.

## C03 — Hover, select, multi-select, selection ring, parent select — **PARTIAL (with a proven bug)**

What exists:
- Hover shows a thin outline plus an info badge and drag handle (`overlays/ElementHoverOverlay.tsx:380-400`). Holding ⌥ shows an ancestor chain. ⌥⇧ shows the box model with margin/padding labels (`ElementHoverOverlay.tsx:74-81`, `overlays/SpacingLabels.tsx`).
- Click selects. ⇧-click adds (`hooks/useSelectionBehavior.ts:143`). It cannot remove: it calls `addToSelection`, never `toggle`, which exists at `engine/SelectionManager.ts:~108-114`.
- Double-click selects the child under the cursor. Triple-click deep-selects the innermost element (`useSelectionBehavior.ts:157-188`).
- Marquee select starts on an empty, non-element target (`hooks/useCanvasMarquee.ts:54-81`). Whether any such target exists inside the page frame, given the root element, was **not verified**.
- Selection box with resize and rotation handles, plus a combined box for multi-select (`overlays/SelectionBoxOverlay.tsx:121-122`). An accent "Type · name" tag (`overlays/SelectionLabel.tsx`). A 3-button toolbar: Duplicate / Delete / More (`controls/UnifiedSelectionToolbar.tsx`).
- Parent select: ← key (`hooks/useCanvasKeyboard.ts:200-210`) and a clickable inspector breadcrumb "Home › Hero › Heading" (`inspector/components/InspectorHeader.tsx:37-50`), plus Layers.
- Locked elements refuse selection with a toast (`useSelectionBehavior.ts:84-96, 132-139`).

**Bug B1 (PROVEN by probe): ⌘/Ctrl+click "cycle through overlapping" never selects anything.**
- `calculateClickCount` writes `lastClickPosition = {x,y}` (`useSelectionBehavior.ts:212`). This happens *before* `handleClickThrough` runs (`:243`).
- So `isSamePosition(x,y)` at `:79` is always true, the stack-building branch is unreachable, and the "cycle" branch computes `(0+1) % 0 = NaN` on an empty stack (`:100`).
- Probe output: `select calls after first cmd+click: 0 stack: [] index: NaN`.
- The keyboard sheet still advertises the chord (`controls/keyboardSheetRows.ts:114`). The engine shortcut `ctrl+click` is not registry-owned, so nothing else catches it.

Doc drift:
- `overlays/SelectionLabel.tsx:10-11` says Select parent lives in "the inspector ⋯ (Select parent)". `INSPECTOR_MENU` (`shared/elementActions.ts:243-255`) has no such row.
- `overlays/CanvasOverlayGroup.tsx:213-216` cites "Alt+↑" for the parent. Alt+↑ *reorders* the element (`useCanvasKeyboard.ts:184-186`).

Gaps vs Webflow:
- Webflow's persistent bottom breadcrumb bar is replaced by the inspector-header breadcrumb. That is roughly equivalent.
- Webflow's multi-select support is limited, so Buildrik's is arguably ahead **(uncertain)**.

Severity: P1 for B1, a printed chord that is dead. P2 for the ⇧-click no-toggle.

## C04 — Drag-drop add from the Add panel — **MATCHES WEBFLOW (mostly)**

What exists:
- Add-panel rows `setData("block", …)` (`sidebar/tabs/build/hooks/useBuildTab.ts:77-78`). Components and media have their own MIME types (`sidebar/tabs/build/components/GroupSection.tsx:478`, `sidebar/tabs/media/data/dragPayload.ts:42-48`).
- Click-to-insert goes through the same path (`sidebar/tabs/build/BuildTab.tsx:290,344`).
- During drag over the canvas:
  - target resolution with a root fallback (`hooks/drag/useDropTargetResolver.ts:90-100`)
  - before/after/inside from the cursor, with a 25% edge band and horizontal-parent awareness (`hooks/drag/dragCalculations.ts:33-50`)
  - an animated slot line (`calculateDropSlotRect` `:66+`)
  - an ancestor-path breadcrumb (`:173+`)
  - an invalid-target state with a reason (`overlays/DropFeedbackOverlay.tsx`)
  - auto-scroll (`hooks/useDragAutoScroll.ts`)
  - a "Drop into Home › Hero after Subtitle" announcement (`canvas/insertDrag.ts`)
- Nesting rules come from one table (`shared/utils/nesting/rules.ts`, `forbiddenChildren`/`allowedChildren`). They are enforced at drop time (`hooks/drag/dropOperations.tsx:497-535`).

Gap / suspected inconsistency:
- During dragover the block's type cannot be read, because `dataTransfer` is opaque until drop. Hover validation for blocks therefore only asks whether the target can hold a container (`dragCalculations.ts:144-160`).
- So the indicator can show "valid" and the drop is then refused with a toast (`dropOperations.tsx:529-535`). This is suspected, not live-tested. Webflow shows a red "can't drop here" state live **(uncertain)**.

Severity: P2.

## C05 — Move / reorder on canvas and in the tree — **PARTIAL**

What exists:
- Canvas drag of any element uses delegated HTML5 drag (`hooks/useCanvasElementDrag.ts:140-160`). It supports multi-element drag (`:241-264`) and smart snap guides (`hooks/useCanvasSnapping.ts`, `overlays/SmartGuidesOverlay.tsx`).
- ⌘-drag clones (`:212-235`).
- Top-level section reorder handles (`hooks/useSectionReorder.ts`, `overlays/SectionReorderHandles.tsx`).
- Keyboard: ⌥↑/⌥↓ reorder, ⌥Home/⌥End go to first/last (`useCanvasKeyboard.ts:184-260`). ⌘/⇧+arrows nudge **positioned** elements only, with a toast for in-flow ones (`:160-175`).
- Arrange ▸ Bring forward / Send backward / to front / to back. These actually move **DOM order**, not z-index (`engine/commands/commandOperations.ts:123-160`, `defaultCommands.ts:455-487`).
- Layers drag is covered under C10.

**Suspected bug B3: a cancelled ⌘-drag leaves a stray duplicate.** The clone is created and committed in its own transaction at `dragstart` (`useCanvasElementDrag.ts:219-231`). `dragend` resets refs but never removes the clone when no drop happened (`:367-392`). A successful clone-move also costs two undo steps (clone + move). Suspected; not live-tested.

Doc drift:
- The `useCanvasElementDrag.ts:18` header advertises "Arrow keys: Up/Down = reorder, Left/Right = nesting". That file binds no arrows.
- `UnifiedSelectionToolbar.tsx:13` claims "Move up/down → the element menu". No such rows exist (`menus/contextMenuRegistry.ts:43-67`).

Severity: P2. The Webflow drag-move model matches. B3 is P2.

## C06 — Inline text editing and rich text — **PARTIAL (two proven/suspected bugs)**

What exists:
- Double-click enters `contentEditable`, and so does the inspector's "Edit text on canvas" (`hooks/useCanvasInlineEdit.ts:107-128`).
- Editable tags are limited to an allow-list of 21 text tags (`:33-55`). Any element containing nested elements is refused (`:77-82`). Locked elements are refused (`:86`).
- The session selects all text on entry (`:142-151`). Enter commits, Escape reverts, click-outside commits (`:203-227`). Commit is sanitized and recorded as one undo transaction (`:164-176`).
- An 18-control floating toolbar (`panels/RichTextEditor.tsx`, mounted at `overlays/CanvasOverlayGroup.tsx:301-321`): block format, size, B/I/U/S, lists, 4 alignments, indent/outdent, text and highlight colour, link/unlink, clear formatting.

Bugs:
- **B2 (PROVEN by probe): "Clear formatting" does nothing.** The toolbar emits `removeFormat` (`panels/RichTextEditor.tsx:309`). `useCanvasInlineCommands` has no case for it, so it falls to `default: devLog(...)` (`hooks/useCanvasInlineCommands.ts:163-164`). Probe output: markup unchanged.
- **B4 (suspected): Enter always commits** (`useCanvasInlineEdit.ts:208`), including ⇧Enter. You cannot add a line break or a second list item, so the toolbar's list buttons produce at most a one-item list.
- **B5 (suspected): formatBlock nests blocks inside text tags.** It wraps the selection in a new block element *inside* the edited element (`useCanvasInlineCommands.ts:117-124`), for example `<p><h2>…</h2></p>`, which is invalid nesting. Whether the sanitizer repairs it is unverified.
- Links: URL only, always `target="_blank" rel="noopener"` (`useCanvasInlineCommands.ts:88-103`). No link-to-page/section/email/phone picker inside text. Webflow's text-link settings offer page, section, email, phone and new-tab toggles.

Gap vs Webflow:
- No **Rich Text element**: no block-level element type for long-form content with headings, lists, quotes, images and embeds. A `richtext` type exists only as a CMS field type (`engine/cms/CMSBindingManager.ts:98`). Webflow's Rich Text element plus its "+" inline insert menu is a core content tool.

Severity: **P1** (no Rich Text element, Enter-commits), P2 (B2, B5, link targets).

## C07 — Copy / paste / duplicate at the UI level — **PARTIAL**

What exists:
- ⌘C/⌘X/⌘V/⌘D from the registry (`defaultCommands.ts:157,270,287,310`). They act on the whole multi-selection, top-most pruned. Cut is one transaction. Paste resolves a legal parent per item through the nesting rules (`:310-340+`).
- ⌥⌘C/⌥⌘V copy/paste style (`:191,208`). ⌘⇧V Paste HTML (`:569-575`, `sidebar/tabs/build/PasteHtmlModal.tsx:45` reads the system clipboard).
- Context menu and Layers menu rows run the same commands.

Gap vs Webflow:
- The element clipboard is **in-memory only**: `composer.clipboard` (`engine/Composer.ts:121`).
- It survives page switches within a session, so cross-page paste works.
- It does **not** survive a reload, and it does not reach another tab, another site, or the OS clipboard. Element copy never calls `navigator.clipboard`.
- Webflow copies to the system clipboard, so paste works across projects and tabs **(high confidence, unverified here)**.

Severity: P1 for agencies and multi-site users. P2 otherwise.

## C08 — Right-click context menu — **MATCHES WEBFLOW (different grouping)**

What exists (`menus/contextMenuRegistry.ts:43-67`, row definitions in `shared/elementActions.ts` and `menus/actions/*`):
- Improve with AI, only if `openAI` is present (`shared/elementActions.ts:194-198`). Note the "no AI this version" owner decision.
- Duplicate, Delete.
- **Arrange ›** Bring to front / forward / Send backward / to back (all DOM order).
- **Style ›** Copy style / Paste style. Presets were removed (`menus/actions/styleActions.ts`).
- **Structure ›** Wrap in container, Unwrap, Copy, Cut, Paste, Replace with block… (sections only), Save as component….
- Lock / Unlock, Group (≥2 selected) / Ungroup (a container with children).
- Bind to CMS field… (bindable types), Add interaction.
- Right-clicking inside a multi-selection keeps the selection (`Canvas.tsx:704-709`). ⇧F10 opens the menu from the keyboard (`useCanvasKeyboard.ts:117-129`). The toolbar's ⋯ opens the same menu.

Gaps:
- Copy/Paste are buried two levels deep under Structure, where Webflow keeps them top-level **(uncertain on Webflow's exact list)**.
- No "Select parent" row.
- No "Copy/Paste" of the element *to other sites* (see C07).

Severity: P2.

## C09 — Keyboard shortcuts (full list from code) — **DIFFERENT MODEL**

Shortcuts are bound in **five separate places**, plus 37 files with their own `keydown` listeners (grep of `addEventListener("keydown"` in `editor/` + `engine/`). The sheet at `controls/keyboardSheetRows.ts` merges the registry with a hand-kept `CHROME_CHORDS` list.

**Registry, capture-phase, window** (`engine/commands/KeybindingManager.ts:43-61`). ⌘ and Ctrl are normalised to `ctrl` (`:117`):

| Chord | Command | Source |
|---|---|---|
| ⌘S | save | `defaultCommands.ts:84` |
| Delete / Backspace | delete (confirm if >1) | `:96-97` |
| ⌘G / ⌘⇧G | group / ungroup | `:129,143` |
| ⌘D | duplicate | `:157` |
| ⌥⌘C / ⌥⌘V | copy / paste style | `:191,208` |
| ⌘C / ⌘X / ⌘V | copy / cut / paste | `:270,287,310` |
| ⌘] / ⌘[ / ⌘⇧] / ⌘⇧[ | forward / backward / front / back (DOM order) | `:459-483` |
| ⌘A | select all | `:495` |
| Esc | deselect | `:515` |
| ⌘⇧E | exporter | `:556` |
| ⌘\ | toggle inspector | `:565` |
| ⌘⇧V | paste HTML | `:573` |
| ⌘⇧A | open AI | `:580` |

**Shell** (`editor/shell/hooks/useEditorShortcuts.ts`):

| Chord | Action | Line |
|---|---|---|
| ⌘Z | undo | :169 |
| ⌘⇧Z / ⌘Y | redo | :170-174 |
| ⌘P | preview | :160-163 |
| ⌘⇧P | command palette, alias of ⌘K | :128-132 |
| ? and ⌘/ | shortcuts sheet | :137,178 |
| ⌘J | AI tab | :182 |
| ⌘, | site settings | :141 |
| ⌘H | version history | :146 |
| C | comment mode | :112-120 |
| F6 / ⇧F6 | region cycle | :98-102 |

⌘K lives in `shell/StudioHeader.tsx:331`.

**Canvas footer** (`CanvasFooterToolbar.tsx:194-247`):
- ⌘0 / ⌘1 / ⌘2 / ⌘= / ⌘-: zoom
- ⌘; guides, ⌘⇧; spacing, ⌘' grid, ⌘B badges, **⌘R rulers** (takes over browser reload, which is deliberate), ⌘⇧X X-ray

**Canvas focus only** (`hooks/useCanvasKeyboard.ts`; the wrapper must have focus):

| Chord | Action |
|---|---|
| Tab / ⇧Tab | cycle elements |
| ↑ / ↓ | prev / next sibling |
| ← | parent |
| → | first child |
| Home / End | first / last sibling |
| ⌥↑ / ⌥↓ / ⌥Home / ⌥End | reorder |
| ⌘+arrows | nudge 1 px (positioned elements only) |
| ⇧+arrows | nudge 10 px (positioned elements only) |
| ⇧F10 | context menu |
| Delete | focus hand-off after delete |

**Panel letters** (`editor/sidebar/useSidebarKeyboard.ts`, from `rail/tabsConfig.ts`):
- A Add, T Templates, M Assets, L Layers, P Pages, ⇧A Components, B Brand, S Settings, U Publish, H History, R Review, D CMS, I Assistant (`useSidebarKeyboard.ts:53`)

**Layers row focus** (`panels/layers/LayerTreeItem.tsx:158-200`):
- Del, Enter/Space, F2 rename, ←/→ collapse/expand, ↑/↓

**Inline edit:** Enter commits, Esc reverts.

Mismatches for a Webflow switcher (Webflow chords are believed, **(uncertain)** where noted):
- Webflow ⌘⇧P = Preview. Here ⌘⇧P opens the **command palette** and ⌘P = Preview.
- Webflow ⌘E = Quick Find. Here ⌘E is unbound, and the palette is ⌘K.
- Webflow panel letters A/Z/P/C/J/S/D/I etc. **(uncertain)**. Here they differ: L = Layers, D = CMS, S = Settings, C = comments.
- No "select parent" chord beyond ←, which needs canvas focus.

Bug B1 (⌘-click) is a printed-but-dead chord. Registry shortcuts are well guarded against double firing (`useCanvasKeyboard.ts:79-86`).

Severity: P1 (muscle-memory collisions on preview and quick-find). P2 for the fragmentation, which is a maintainability risk.

## C10 — Layers / Navigator tree — **MATCHES WEBFLOW (mostly)**

What exists (`editor/panels/layers/`):
- Tree with expand/collapse and expand/collapse-all events (`index.tsx:49-61`). Expanded state is stored per page in localStorage (`hooks/layersPersistence.ts:8-10`).
- Search by name, type, tag or id, with matched ancestors auto-expanded (`hooks/useLayerSearch.ts:14-22`, `index.tsx:66-75`).
- Rename by double-click or F2 (`LayerTreeItem.tsx:172-176,241,300-312`).
- Click, ⌘-click toggle, ⇧-click range select (`hooks/useLayerSelection.ts:78-105`).
- Drag reorder or nest with a 30/40/30 hit zone. Nesting rules and lock rules are checked, and invalid drops get explanatory toasts (`index.tsx:113-181, 238-267`).
- Eye control: **editor-only dim, does not hide on the published site** (`LayerTreeItem.tsx:345-370`). Its state lives in **per-browser localStorage** (`layersPersistence.ts:9`).
- Lock toggle runs the engine lock command. Per-breakpoint "hidden on M/T" badges (`LayerTreeItem.tsx:337-342`).
- Context menu (`components/LayerContextMenu.tsx:80-141`): Cut, Copy, Paste, Duplicate, Delete, Rename, Group, Move to page…, Copy link.
- Selecting on the canvas auto-expands and scrolls the tree to the row (`index.tsx:190-200`). Roving tabindex is implemented.

Gaps / suspected:
- **Layers drag is single-element only.** The drag sets only `layer-id` (`index.tsx:222`) even when several rows are selected.
- You cannot drag from the Add panel *into* the tree. Webflow allows dropping into the Navigator **(uncertain)**.
- **No canvas scroll to the selection.** Selecting an off-screen element from Layers or a ⌘K "Layers" row does not scroll the canvas to it. The only `scrollIntoView` in `editor/canvas` is zoom-to-selection (`Canvas.tsx:360`). Suspected P1 on long pages.
- Eye state is per browser, so collaborators and other devices do not see it. "Hidden" therefore means something different from Webflow's display:none-per-breakpoint, which lives in the inspector Visibility section here.

Severity: P1 for the missing scroll-to-selection. P2 for the rest.

## C12 — Preview mode — **PARTIAL**

What exists:
- `shell/PreviewOverlay.tsx`: an in-shell iframe preview with `srcDoc`. The HTML is sanitized (`:4-8,206-212`).
- A device switcher with bezels (`:180,206`), a page menu, and internal link routing (`:126-160`).
- A share-preview button. Esc or "Back to canvas" exits. ⌘P toggles it.

Gaps vs Webflow:
- **`sandbox="allow-same-origin"` with no `allow-scripts`** (`PreviewOverlay.tsx:211`). No JavaScript runs in preview: interactions/animations that need JS, navbar toggles, sliders, tabs, form behaviour.
- Webflow's preview runs IX2 interactions live. A Webflow user cannot verify interactions without publishing.
- **Suspected bug B6:** a second, legacy preview command survives in the registry. `defaultCommands.ts:523-533` `window.open` + `document.write(exportHTML)` is **unsanitized**, uses a popup, and can be blocked.
  - The ⌘K palette's curated row is labelled "Preview {page} page" (`shell/modals/CommandPalette.tsx:224-231`). The label dedupe therefore does not drop the registry "Preview" row, which appears under MORE when you search "preview" (`:372-392`).
  - This contradicts PreviewOverlay's own rationale.

Severity: **P1** (no interactions in preview). P2 for B6.

## C13 — Spacing overlays, guides, X-ray, measurement — **DIFFERENT MODEL (superset in places)**

What exists:
- Spacing overlay toggle (⌘⇧;) with **click-to-edit spacing values on canvas** (`spots/CanvasSpotSpacing.tsx`, mounted at `overlays/CanvasOverlayGroup.tsx:243-251`). ⌥⇧-hover shows the box-model labels.
- Rulers (⌘R) and draggable guides from the rulers (`overlays/RulersOverlay.tsx`, `overlays/GuidesOverlay.tsx`).
- Grid overlay (⌘'), size 4/8/16 or custom 1–100 px, which also drives snap (`Canvas.tsx:425-429`).
- Smart snap lines during drag (`SmartGuidesOverlay.tsx`). Badges (⌘B).
- X-ray (⌘⇧X) draws wireframe outlines and turns backgrounds off (`editor/canvas/Canvas.css:656-675`).

Gaps:
- No ⌥-hover distance measurement between elements, in the Figma style. Webflow doesn't have it either **(uncertain)**.
- Webflow's canvas spacing editing happens in the Style panel's box widget rather than on the canvas **(uncertain)**. Buildrik's on-canvas editing is a plus.
- **Suspected bug B7: X-ray changes layout.** The X-ray rule sets `position: relative` on every `[data-buildrick-id]` at specificity (0,3,0) (`Canvas.css:656-667`). That can override customer `position: absolute`/`sticky` set by lower-specificity class rules, and it moves the containing block for absolutely-positioned descendants. Whether StyleEngine output outranks it was not checked.

Severity: P2.

## C14 — Command palette / quick find — **MATCHES WEBFLOW (different chord)**

What exists:
- `shell/modals/CommandPalette.tsx` opens on ⌘K, with ⌘⇧P as an alias.
- The empty-query view shows curated bands Recent / Pages / Navigate / Edit / View / Add / Tools (`:68-70, 506-530`).
- Searching covers every registry command, all pages (always registered from the shell: `sidebar/tabs/pages/usePageCommands.ts`, `shell/StudioPanels.tsx:281`), layers on the current page (`:333-356`), assets (`:357-367`), CMS records (`:~478`), templates, and inspector "jump to property" rows.
- Disabled rows show a reason. A no-match result falls back to AI or stock photos (`:536-544`). It is unavailable in read-only view (`StudioHeader.tsx:336`).

Gaps:
- Matching is a **plain substring** match on label + group + keywords (`:529-533`), not fuzzy. "hro sec" does not match "Hero section".
- Layer search covers the **current page only**.
- The chord differs from Webflow's ⌘E (see C09).

Severity: P2.

---

## Bug ledger

| ID | Status | File:line | Summary |
|---|---|---|---|
| B1 | **Proven (probe)** | `editor/canvas/hooks/useSelectionBehavior.ts:79,100,212,243` | ⌘/Ctrl-click cycling never selects. Position is recorded before the same-position check, so the stack stays empty and the index is NaN. |
| B2 | **Proven (probe)** | `editor/canvas/hooks/useCanvasInlineCommands.ts:163`; `editor/panels/RichTextEditor.tsx:309` | "Clear formatting" emits `removeFormat` and nothing handles it. |
| B3 | Suspected | `editor/canvas/hooks/useCanvasElementDrag.ts:219-231, 367-392` | A cancelled ⌘-drag leaves the committed clone behind. A successful clone-move is two undo steps. |
| B4 | Suspected | `editor/canvas/hooks/useCanvasInlineEdit.ts:208` | Enter (and ⇧Enter) always commits, so there are no line breaks and lists cannot grow past one item. |
| B5 | Suspected | `editor/canvas/hooks/useCanvasInlineCommands.ts:117-124` | formatBlock inserts a block inside the edited text element (invalid nesting). |
| B6 | Suspected | `engine/commands/defaultCommands.ts:523-533`; `editor/shell/modals/CommandPalette.tsx:224-231,372-392` | The legacy unsanitized `window.open` preview is still reachable from ⌘K search. |
| B7 | Suspected | `editor/canvas/Canvas.css:656-667` | X-ray forces `position: relative` and can shift layout. |
| D1 | Doc drift | `overlays/SelectionLabel.tsx:10-11`, `overlays/CanvasOverlayGroup.tsx:213-216`, `controls/UnifiedSelectionToolbar.tsx:13`, `hooks/useCanvasElementDrag.ts:18` | These cite a "Select parent" menu row, Alt+↑ for the parent, Move up/down rows, and arrow handling in the drag hook. None of these exist. |

## Not verified

- Nothing was live-walked in the running app. Every verdict comes from source plus the two probes.
- Webflow behaviour is recalled, not tested. Every Webflow chord and panel letter needs a live check.
- Marquee reachability inside the page frame (root element coverage) is unverified.
- Whether StyleEngine's device-preview output beats the X-ray specificity is unverified.
- The custom-CSS `@media` mismatch on the canvas is inferred from the architecture, not reproduced.
