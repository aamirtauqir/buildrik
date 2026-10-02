# Inspector v4 — build plan (Phase 4 eng review → Phase 5 execution)

Status: **PLAN — for owner review.** Branch `feat/inspector-v4` (worktree `~/Desktop/buildrik-worktrees/inspector-v4`),
based on PR #30 `fix/inspector-prereqs` (P-1…P-13 + Q2 fixed; HEAD `433aaf0eb`).
Contract: `2026-09-27-inspector-figma-board-spec.md` (36 boards, MUST / MUST-NOT) + owner decisions after it
(Button board has **no Typography**; Layers row highlight + minor board fixes applied 2026-09-27). Board node ids are
the `family: "Inspector v4"` rows of `packages/editor/scripts/conformance/boards.json` (`7993:198599` … `7995:210717`).
Precedence (packages/editor/CLAUDE.md): behaviour → code contract; everything visual → the board.

Path shorthand: `src/` = `packages/editor/src/`, `insp/` = `src/editor/inspector/`, `conf/` = `packages/editor/scripts/conformance/`.

---

## 0. What the eng review found in the code (facts the plan is built on)

| # | Fact (current code) | Consequence for the build |
|---|---|---|
| F-1 | Tabs are `TabId = "style" \| "element" \| "effects"`, labelled Style · **Settings** · Effects (`insp/sections/registry/_shared.tsx:48-55`); `interactions` has `tab: "effects"`, `visibility` has `tab: "element"` (`registry/effects.tsx`). | Tab model is one field per registry entry → the reshape is local to the registry, not a rewrite of every section. |
| F-2 | Section order is **per profile** (`insp/config/elementProfiles.ts`, 8 profiles, board orders from the retired v1 boards) and filtered per tab by `InspectorTabContent`. Beginner/Pro hides `tier: "advanced"` entries + `profile.advanced`. | DD-15 needs ONE order per tab; relevance comes from capabilities, not from per-profile lists. `elementProfiles.ts` is replaced, not patched. |
| F-3 | The ElementType union already has every Q2 type (`src/shared/types/element.ts:81-136`: checkbox, radio, switch, label, stack, tabs, list-item, cta, video-embed, map-embed, lottie, …) and `migration/refineElementTypes.ts` upgrades stored `container`s. | Type blocks can key on `selectedElement.type` directly. A `Record<ElementType, …>` table gets compile-time coverage the way `ELEMENT_RULES` does. |
| F-4 | Defining props live in `insp/sections/elementProperties/config.ts` (`ELEMENT_PROPERTIES`, rendered generically in the closed "Advanced" section) — incl. the textareas R-DD-9 removes, Link/Button "Open In", link Rel. | Split: defining props → type block; the rest → Attributes; textareas/Open In/Rel rows deleted. |
| F-5 | ⋯ menu is hand-built (`InspectorElementMenu.tsx`: inline style objects, own `role=menu`, 6 nav rows incl. AI/Pick/Select parent/Hide/Expand/Collapse). Canvas menu is `canvas/menus/contextMenuRegistry.ts` + `actions/*`. Copy-style is implemented **three times** (`InspectorElementMenu.tsx:178`, `canvas/hooks/useCanvasKeyboard.ts:266`, `canvas/menus/actions/styleActions.ts:19`); Lock is written in three places (`panels/layers/hooks/useLayerActions.ts`, `LockedBanner.tsx`, `standaloneActions.ts`). `toggle-inspector` command has **no shortcut** (`engine/commands/defaultCommands.ts:477`). | R-DD-8 registry is new code; engine commands gain copy-style / paste-style / reset-style / lock / unlock + `mod+\`. |
| F-6 | chrome-ui has `Tabs` (tablist + ←/→), `Chip`, `Popover` (incl. `beside`, P-4), `Menu`/`MenuItem` (`kbd`, ↑/↓/Home/End), `ConfirmDialog`, `Toast`, `IconButton`, `Tooltip`. **No Breadcrumb** (grep: only `sidebar/shared/DrillInHeader.tsx` renders a non-clickable string path). Inspector already has `SpacingBox` (with link toggle), `ButtonGroup`, `AlignmentGrid`, `MixedValueIndicator`, `ColorInput`, `Section` in `insp/shared/controls/`. | Only ONE new chrome-ui component: `Breadcrumb`. Everything else reuses existing controls (§1.9). |
| F-7 | Multi-select short-circuits to `MultiSelectToolbar` (+ `BatchStylePanel` / `useBatchStyleHandler`), but `useStyleHandlers` already writes one edit to several ids in one transaction through `writableElements` (`reachPeerIds`, `hooks/useStyleHandlers.ts:271-280`), and `shared/detectMixedValues.ts` already computes `mixedKeys`. | DD-12 reuses the reach path as the multi-target path; the batch panel and its hook are deleted. |
| F-8 | P-5 (held selection across full pages, `shell/StudioPanels.tsx:519-540`), P-7 (AI covers, does not unmount, `StudioPanels.tsx:917-927`), P-4 (`Popover beside`) are fixed on this base. | Escalation lane (I-14) is return-path polish + two new doors, not a rewrite. |
| F-9 | Save conflict state lives in `shell/AquibraStudio.tsx:408-416` (listens to `SAVE_CONFLICT_EVENT`) + `services/BuildrikSyncProvider.ts` (`_conflictToken`, `isSaveConflictPending()`); no "cleared" signal. AquibraStudio is on the **never-stage-from-an-agent** list (packages/editor/CLAUDE.md). | Conflict read-only must be built WITHOUT editing AquibraStudio: Inspector reads the provider; "Resolve" re-dispatches `SAVE_CONFLICT_EVENT` with the held token (AquibraStudio's existing listener reopens the dialog). |
| F-10 | Countdown / progress / video-embed / map-embed markup is **static** (`blocks/Components/CountdownTimer.tsx`, `ProgressBar.tsx`, `blocks/Media/VideoEmbed.tsx`, `MapEmbed.tsx`); the only publish runtimes are `engine/export/sliderRuntime.ts` + `interactionRuntime.ts`. Accordion stores `data-allow-multiple` with no runtime. | Q5 settings need engine serialization + runtimes or they write attributes nobody reads (OQ-2). |
| F-11 | "Text style" has no Brand primitive: Brand's type styles are the **font-size tokens** (`editor/design-system/ui/sections/TypographySection.tsx:56-106`, `typeStyleRows`). | Text style select = bind `font-size` to a font-size token (OQ-4). |
| F-12 | `verify:ds` (pre-push, BLOCKING) runs `check-anchors` (every recipe testId must exist), `check-boards` (recipe count may not fall below `coveredFloor`; a recipe measuring a non-`active` board fails) and `check-copy` (`conf/copy.json` pins "Select something on the canvas to edit it."). 14 old recipes `conf/surfaces/inspector-*.json` pin testids W1 deletes (`inspector-scope-pill`, `inspector-state-pill`, `inspector-context-row`, `inspector-tier-toggle`, …). | Retiring old recipes and adding v4 recipes must happen **in the same commit** as the testid deletions (W1), or the push is refused. |

---

## 1. Architecture decisions

### 1.1 Tab model — Style · Behaviour · Effects (DD-1, DD-4, Q1)

- `TabId` becomes `"style" | "behaviour" | "effects"` (rename `element` → `behaviour`; every test that spells `element` is rewritten anyway). `INSPECTOR_TABS` labels: Style, Behaviour, Effects.
- **The registry drives the tabs**: each `defineSection` entry keeps its `tab` field (one source); `InspectorTabContent` renders the entries of the active tab in the tab's fixed order. ⌘K "Jump to property" (`config/propertyIndex.ts`, `hooks/usePropertyJump.ts`) keeps reading `entry.tab`/`entry.title`, so it follows automatically.
- **One order per tab** (DD-15 define → shape → paint), in new `insp/config/sectionOrder.ts`:
  - `STYLE_ORDER = ["component", "type", "layout", "typography", "text-inside", "size", "spacing", "fill", "border"]`
  - `BEHAVIOUR_ORDER = ["form-fields", "form-settings", "slides", "slider-settings", "collection", "link", "cms-binding", "visibility", "interactions", "css-classes", "attributes"]`
  - `EFFECTS_ORDER = ["opacity", "shadow", "filters", "transform-motion", "effects-advanced"]`
  - Fill before Border on every type (boards 1, 8, 17 all draw `Fill + · Border +`; the board wins over DD-15's media order).
- **Presence = capabilities, not profiles.** New `src/shared/constants/elementCapabilities.ts`: `ELEMENT_CAPABILITIES: Record<ElementType, ElementCapabilities>` (TypeScript forces every type) with `typeBlock: TypeBlockId | null`, `layout: boolean`, `typography: "open" | "inside" | "none"`, `link`, `cmsBindable`, `behaviourSections: SectionId[]` (form-fields/…/collection), `isStructuralChild` (R-4 minimal panel). Registry `shouldRender` reads it. `BINDABLE_TYPES` (`canvas/menus/actions/standaloneActions.ts:18`) and `LINKABLE_TYPES` (`insp/sections/LinkSection.tsx:68`) are **derived from this table and deleted at their old homes** (R-2 "one list").
  - Section (board 18): `link: true, cmsBindable: false`. Form (19) / Collection list (20): no link, no CMS. Button, input, checkbox (boards 5, 14, 15): `typography: "none"` pending OQ-1. Container (17): `layout: true, typography: "inside"`. Page root / nothing selected → Page panel, never the element panel (R-3).
- Tab strip hidden on the Page panel (board 21). Context row on Style and Effects only (board 2 has none).
- **DD-20**: `ProInspector` keeps `prevTypeRef`; when `selectedElement.type` changes, `setActiveTab("style")`; same type keeps the tab.

### 1.2 Section registry reshape (`insp/sections/registry/*`)

`SectionEntry` changes (`_shared.tsx`):
- remove `tier?: "advanced"` and the positional `SectionTier` weights (Beginner/Pro goes);
- add `open: "always" | "open" | "valued" | "closed"` (DD-11), `hasValue?(ctx): boolean` (default: `sectionApplies` over `styleKeys`), `summary?(ctx): string | null` (one-line closed summary), `onAdd?(ctx): void` (the "+" row's add), `capability?: (caps) => boolean` (default `shouldRender`);
- `SectionContext` gains `variant: "element" | "page"`, `selectedIds: readonly string[]`, `displayMode: "open" | "summary" | "empty"`; keeps `isOpen/onToggle/advancedExpanded/onAdvancedToggle/styleKeys` slicing unchanged (the `registry.styleKeys.test.ts` invariant stays).

Section ids — new / renamed / removed:

| Id | Tab | Source component | Change |
|---|---|---|---|
| `component` | style | `ComponentRow` (from `VariantSection.tsx`) | new position: above type block (DD-16) |
| `type` | style | `TypeBlockSection` | new (§1.3) |
| `layout` | style | `sections/layout/*` | loses Width/Height selects (DD-9), gains Display **None**, grid Columns/Gap, inline flex controls when display:flex |
| `typography` | style | `sections/typography/*` | Size/Line pair, colour token chip, align segmented |
| `text-inside` | style | same `TypographySection`, `open: "closed"`, summary "Inter · 16px · Text / primary" | new (board 17) |
| `size`, `spacing`, `border` | style | existing | Spacing = `SpacingBox` only (DD-9b); Size loses `object-fit` (→ image block) |
| `fill` | style | `BackgroundSection.tsx` | renamed from `background`, title "Fill" |
| `flex`, `grid` | — | **removed as sections**; controls extracted to `FlexControls` / `GridControls`, reused by the Flex type block and Layout (D-11 gap merge) |
| `cms-binding` | behaviour | `ContentSection.tsx` → `CmsBindingSection.tsx` | renamed from `content`; bindable types only |
| `interactions` | behaviour | `sections/interactions/*` | moved from effects (Q1) |
| `attributes` | behaviour | new `AttributesSection` (ID, title, tab index, data-*, §17.H advanced attrs) | replaces `element-properties`; `open: "closed"`, summary "id: hero-title · 1 attribute" |
| `element-properties` | — | **removed** (split into `type` + `attributes`) |
| `opacity` | effects | `EffectsBasicSections.tsx` | "+" row |
| `shadow` | effects | presets + custom + inner merged (D-12) | from `EffectsBasicSections` + `EffectsSection` |
| `filters` | effects | blur + brightness/contrast/grayscale | renamed from `blur`, absorbs filter rows of "More effects" |
| `transform-motion` | effects | transform + transition rows of `EffectsSection.tsx` | new |
| `effects-advanced` | effects | cursor, blend, will-change, text-shadow | new, `open: "closed"`, summary "Cursor: auto · Blend: normal" |
| `effects` ("More effects") | — | **removed** (split into the four above) |

Registry files re-split **by owning lane** (so Wave 2 lanes never edit the same registry file): `registry/_shared.tsx` + `registry/index.tsx` (W1), `registry/type.tsx` (W1), `registry/component.tsx` (W1 creates → L2-D2 owns), `registry/text.tsx` (typography, text-inside → L2-A), `registry/box.tsx` (layout, size, spacing, fill, border → L2-C), `registry/effects.tsx` (→ L2-C), `registry/behaviour.tsx` (all Behaviour entries → L2-D1). `layout.tsx`, `typography.tsx`, `visual.tsx`, `element.tsx` are deleted/renamed in W1.

### 1.3 Type block driven by the true type (DD-3, Q2, Q5)

- `insp/sections/typeBlock/TypeBlockSection.tsx` — the frame: title = `ELEMENT_TYPE_LABELS[type]` (`src/shared/constants/elementTypeLabels.ts`), `open: "always"`, body looked up in `insp/config/typeBlocks.ts`.
- `insp/config/typeBlocks.ts` — `TYPE_BLOCKS: Record<TypeBlockId, { Body: React.ComponentType<TypeBlockBodyProps> }>`; `ELEMENT_CAPABILITIES[type].typeBlock` picks the id (paragraph → `text`, columns → `grid`, textarea/select → `input` family, radio/switch → `choice`). SSOT for "what defines each type"; replaces `ELEMENT_PROPERTIES`.
- Bodies live in **one file per family** (one lane each in Wave 2):

| File (`insp/sections/typeBlock/bodies/`) | Type blocks | Board | Lane |
|---|---|---|---|
| `textBodies.tsx` | heading (Level H1–H6 `ButtonGroup`, Text style, Edit text on canvas), text/paragraph, link, label, button (Edit text, Type Button/Submit/Reset, Disabled) | 1, 4, 5 | L2-A |
| `formBodies.tsx` | input/textarea/select (Input type, Name, Placeholder, Default, Required, Disabled), choice = checkbox/radio/switch (Edit text, Name, Checked by default, Required — writes the inner `<input>`) | 14, 15 | L2-A |
| `mediaBodies.tsx` | image (source row, Alt + missing-alt hint, Fit Cover/Contain/Fill, Loading), video (source, poster, autoplay+muted warning, loop, controls, inline), audio (source row + Choose audio, Show controls, Loop, Autoplay), svg/icon (glyph/source, size, stroke) | 8, 10 | L2-B |
| `embedBodies.tsx` | video-embed (Video URL, "Detected: YouTube", Ratio 16:9/4:3/1:1, Autoplay/Muted/Show controls, autoplay-without-muted warning), map-embed + lottie (URL + preview) | 9 | L2-B |
| `widgetBodies.tsx` | countdown (Ends at, visitor-time-zone hint, When done, Message), progress (Value / Max pair, Show label), accordion (items with Open/Closed, "Allow several open at once") | 11, 12, 13 | L2-B |
| `layoutBodies.tsx` | flex (Direction, 3×3 `AlignmentGrid` + "Align Center / Center", Wrap, Gap), grid/columns (Columns / Gap) | 16 | L2-C |

- Shared pieces W1 creates in `typeBlock/`: `attributeWriter.ts` (moved from `elementProperties/handlers.ts`; signature `writeAttribute(composer, ids: readonly string[], name, value)` through `writableElements` + one transaction, so multi-select works from day 1), `PropertyField.tsx` (moved), `EditTextRow.tsx` (moved from `sections/TextContentRow.tsx`, generalised to button/checkbox/label). W1 ships every body as a **generic body** that renders the old `ELEMENT_PROPERTIES` rows for that type through `PropertyField`, so no capability is missing between W1 and W2; the W2 lane replaces its file with the board layout.
- Multi-select: type block renders only when every selected element shares `typeBlock` (DD-12).
- Q7 ecommerce: `TypeBlockId` reserves `"product"`, no body (spec: deferred).

### 1.4 ONE element-action registry (R-DD-8)

- New `src/editor/shared/elementActions.ts` (editor-level: consumed by `canvas/menus/` and `inspector/`, both under `editor/`):
  ```ts
  interface ElementAction { id; label: string | ((ctx) => string); icon; shortcut?: string /* display, from the command */;
    commandId?: string; run(ctx: ElementActionContext): void; isVisible?(ctx); isEnabled?(ctx): true | string /* reason */;
    danger?: boolean; opensInspector?: boolean }
  export const ELEMENT_ACTIONS: Record<ElementActionId, ElementAction>;
  export const INSPECTOR_MENU: (ElementActionId | "---")[] = ["duplicate","copy-style","paste-style","apply-style-to-page","reset-style","---","save-as-component","lock","---","delete"]; // board 30, nothing else
  ```
  `ElementActionContext` = today's `ActionContext` (`canvas/menus/contextMenuRegistry.ts:26`), moved here; the canvas file imports the type.
- Handlers run **engine commands** (new in `engine/commands/defaultCommands.ts`): `copy-style` (`mod+alt+c`), `paste-style` (`mod+alt+v`, calls existing `pasteStyles`), `reset-style` (via `writeElement`), `lock-element`, `unlock-element`, and `toggle-inspector` gains `mod+\` (board 36). Existing `duplicate`, `delete`, `group`, `ungroup` stay. `apply-style-to-page` opens `ApplyStyleDialog` (event `UI_APPLY_STYLE_REQUESTED`), label from `findStylePeers` count: "Apply style to all {H3 headings} on this page (N)", disabled with reason "No other H3 headings on this page" when N = 0 (DD-6b).
- Consumers converge: `InspectorElementMenu.tsx` renders `INSPECTOR_MENU` with chrome-ui `Popover` + `Menu` + `MenuItem kbd` (fixes P-6 Esc/keyboard, §16, drops ~30 inline style objects); `contextMenuRegistry.ts` + `actions/standaloneActions.ts`/`editActions.ts`/`styleActions.ts` take their duplicate/delete/copy/paste-style/save-as-component/lock/unlock rows from `ELEMENT_ACTIONS` (canvas grouping of board 4428:43928 unchanged; canvas-only rows `improve-with-ai`, `bind-to-cms`, `add-interaction`, `replace-with-block` are registry entries with `opensInspector`/canvas-only flags, excluded from `INSPECTOR_MENU`); `useCanvasKeyboard.ts:260-295` ⌥⌘C/⌥⌘V branches are deleted in favour of the KeybindingManager bindings; `panels/layers/hooks/useLayerActions.ts` lock toggle and the locked status line's Unlock call `lock-element`/`unlock-element`.
- `bind-to-cms` now focuses section id `cms-binding` (was `content`).
- Engine op for DD-6b: new `src/engine/commands/stylePeers.ts` — `findStylePeers(composer, source): { peers: Element[]; skippedLocked: number; skippedInInstance: number }` (current page, same type, headings same level, not self) and `applyStyleToPeers(composer, source, peers, { breakpoint, pseudo })` (copies the style map at the current breakpoint + state only — never text/level/link/CMS/attributes/classes/interactions — one transaction, returns count). Uses `writableElements` on the already-filtered list (engine/AGENTS.md lock gate).
- Invariant added to `src/editor/AGENTS.md` (one line): element actions live in `editor/shared/elementActions.ts`; a menu row or shortcut that re-implements one is a defect.

### 1.5 Section open / closed / summary / "+" rule (DD-11)

- `insp/hooks/useInspectorSections.ts` rewritten: user choice per `${elementType}:${sectionId}` → `"open" | "closed"`, stored under new key `buildrick-inspector-sections-v3`; `-v2`, legacy flat key and `buildrick-inspector-tier` are deleted on first load (one `removeItem` each, no migration: the section ids changed).
- Display mode per section: `always` → open; `closed` → summary (open only by user); `open` (Behaviour primaries: link, cms-binding, visibility, interactions, css-classes, collection, form-*) → open; `valued` → open when `hasValue`, else **empty** ("Fill  +" header row); a user close on a valued section → summary.
- `insp/shared/controls/Section.tsx` gains `displayMode` + `onAdd` + `headerDot` (override dot, §1.6) + `note` (bottom line "● Overridden on Tablet"); ⌥-click / ⌥+Enter on a header toggles every section on the tab (DD-22; replaces ⋯ Expand/Collapse all). `Section.tsx` stays the single frame; `MoreSettingsToggle` stays for §17.H in-section advanced rows.

### 1.6 Context row, override dots, field context (R-DD-14)

- `insp/components/ContextRow.tsx` (new; replaces the "Applies to" row, `ScopeDropdown`, `StateDropdown`, the pseudo banner and `BreakpointOverrides`): 
  - State chip "State: Base ▾" (chrome-ui `Chip`, accent when not Base) opening `Popover` + `Menu` with `MenuLabel` "Edit styles for" and radio items Base, :hover, :focus, :active, :disabled (board 32; dot on states with overrides via `config/pseudoOverrides.ts`);
  - when not Base: "N :hover override(s) · Reset" (Reset = the P-9-fixed StyleEngine rule clear);
  - breakpoint chip "Tablet · N override(s)" + "Revert" only when not Desktop (board 28; revert logic moved out of `BreakpointOverrides.tsx`).
- `insp/shared/controls/InspectorFieldContext.tsx` (new): provider in `ProInspector` with `{ readOnly, readOnlyReason: "locked" | "conflict" | null, mixedKeys, overrides: ReadonlyMap<cssProp, OverrideKind[]>, resetOverride(prop, kind) }`; `useInspectorField(property?)`. `ControlRow`, `InputWithUnit`, `SelectRow`, `ColorInput`, `ButtonGroup`, `SpacingBox` accept an optional `property` and read it — read-only, "Mixed", dots and (W3) errors are drawn by the shared controls, **not re-implemented per section**. Sections only add `property="padding-top"` etc. in their own lane.
- `insp/shared/controls/OverrideDot.tsx` (new, inspector-local — single consumer): chrome-ui `IconButton` (24px target, 6px accent dot) with `aria-label` "Overridden on Tablet" / "Overridden on :hover" / "Overrides master" (announced — not `aria-hidden`, §16) and a `Menu` with "Reset to Desktop / Base / master". Section header shows the dot when any of its `styleKeys` is overridden; section `note` line names the kind (boards 26–28).
- `insp/hooks/useFieldOverrides.ts` (new): merges breakpoint (`useStyleHandlers().overriddenProperties`), pseudo (StyleEngine rule at current bp) and master (`composer.components.getOverridesForElement`, `engine/components/ComponentManager.ts:630`) into the context map.

### 1.7 Read-only mode, locked, save conflict (DD-18, Q3, Q4)

- One mode, two reasons. `readOnly = locked || conflictPending`. Controls render values legibly with `readOnly`/`aria-readonly` (not `disabled`, not dimmed); writes are already refused by the P-1 lock gate; `useStyleHandlers` additionally returns early while a conflict is pending.
- `insp/components/StatusLine.tsx` (new; replaces `LockedBanner.tsx`): locked → "Locked — unlock to edit · Unlock" (runs `unlock-element`); conflict → "This site changed elsewhere — resolve to keep editing · Resolve".
- `src/editor/shell/hooks/useSaveConflict.ts` (new; the shell layer already imports `@/services`): `{ pending }` from `isSaveConflictPending()` + `SAVE_CONFLICT_EVENT` + new `SAVE_CONFLICT_CLEARED_EVENT`; `resolve()` re-dispatches `SAVE_CONFLICT_EVENT` with `getPendingConflictToken()` so `AquibraStudio`'s existing listener reopens `ConflictModal`. `services/BuildrikSyncProvider.ts` gains `getPendingConflictToken()` and dispatches the cleared event where `_conflictToken = null` (`setBaselineLastEditedAt`, reload paths). **`AquibraStudio.tsx` is not edited.**
- Viewer: unchanged — Inspector stays hidden (Q3).

### 1.8 Header, multi-select, page panel, escalations

- `insp/components/InspectorHeader.tsx` (new): row 1 chrome-ui `Breadcrumb` ("Home › Hero › Heading"; crumbs = page title + ancestors via `getParent()`; ancestor crumb selects it, page crumb clears selection → Page panel; middle collapses to "…"; current never truncated). Row 2 type icon + `ElementNameField` + ✦ AI (`ui:switch-tab {tab:"ai"}`, only AI door) + ⋯ `InspectorElementMenu` + ✕ `IconButton` "Hide inspector (⌘\)" emitting `UI_TOGGLE_INSPECTOR`. Row 3 `StatusMarks.tsx`: ◆ Component: {name} · ⌁ {Collection.field} (button → Behaviour + `UI_INSPECTOR_FOCUS_SECTION {section:"cms-binding"}`; red "· missing" variant) · 🔒 Locked — only when true. Variants: `page` ("Home · Page"), `multi` ("3 selected · Headings", crumb = common parent).
- `useElementBinding` moves from `BindingBanner.tsx` to `insp/hooks/useElementBinding.ts` returning `{ label, missing }`; the `inspector:pick-start` event stays (DD-8b; CMS panel uses it) but the header pick button and `usePickModeReset` go.
- **Multi-select (DD-12)**: `ProInspector` no longer short-circuits. Same header/tabs/sections; `InspectorTabContent` renders the **intersection** of sections that apply to every selected type; `useStyleHandlers`' `reachPeerIds` is renamed `extraTargetIds` and fed `selectedIds` minus primary (one transaction, one Undo, lock-filtered); `mixedKeys` from `detectMixedValues` feeds the field context ("Mixed", muted, never value-shaped). `insp/components/MultiSelectBar.tsx`: Align ×6, Distribute ×2 (disabled under 3), Group, note "Edits apply to all N. One Undo restores all N." (alignment handler code lifted from `MultiSelectToolbar.tsx`).
- **Page panel (DD-13)**: `insp/components/PagePanel.tsx` targets the active page's `page.root` through `useStyleHandlers`, renders registry entries `fill`, `size`, `typography`, `spacing` with `ctx.variant = "page"` (sections show the page subset: Background; Max width; Font + Text colour; spacing box), footer "SEO & social…" (opens page settings full page — P-5 keeps context) + "Your place here is kept"; the one-time "Template applied" banner (from `InspectorEmptyState`) stays on top. Shown when nothing is selected **or** the page root is selected.
- **Escalations (§13)**: token chip → Brand, "Add colours in Brand ›", SEO & social, Edit master (+ "‹ Back to instance"), Open record ›, Open collection › (`UI_CMS_OPEN` with `recordId`, `shared/constants/events.ts:417`), Manage SVG → drawer pick mode (like images). All rely on P-5's held selection; the Inspector stays mounted so tab + scroll survive (P-7).

### 1.9 chrome-ui and control inventory

| Need | Exists? | Decision |
|---|---|---|
| Breadcrumb (nav landmark "Element path", crumbs as buttons, "…" collapse) | **No** (only `DrillInHeader`'s static string path) | **NEW** `src/editor/chrome-ui/Breadcrumb.tsx` + export in `chrome-ui/index.ts` + `chrome-ui/__tests__/Breadcrumb.test.tsx`. Built from chrome-ui `Button` (Gate 24), `tw:` utilities, `--bk-*`. |
| SpacingBox (margin/padding box, 🔗 link) | Yes — `insp/shared/controls/SpacingControls.tsx:132` (inside Spacing's "More settings") | Reuse; promote to Spacing's only control (DD-9b); pairs deleted. |
| OverrideDot | No | Inspector-local `insp/shared/controls/OverrideDot.tsx` composing chrome-ui `IconButton` + `Menu` (one consumer → not chrome-ui). |
| Segmented control | Yes — `insp/shared/controls/ButtonControls.tsx` (`ButtonGroup`) | Reuse (DD-21); W3 adds radiogroup + ←/→ (§16). |
| Chip, Popover/Menu, ConfirmDialog, Toast, Tabs, Tooltip, IconButton, TextInput, Select, Checkbox | Yes (`chrome-ui/index.ts`) | Reuse. `Tabs` gets an optional `panelId` for `aria-controls` (W3, additive). |
| "Mixed" | Yes — `MixedValueIndicator` + `MixedValueBadge` | Keep `MixedValueIndicator` (DD-21), delete `shared/MixedValueBadge.tsx` once no section uses it (L3-A). |

No new flowbite-react import is planned → no `pnpm flowbite:classlist` run needed; if a lane adds one, it runs it in the same commit.

### 1.10 Validation + accessibility (DD-19, DD-22, §16)

- `InputWithUnit` (`insp/shared/controls/InputControls.tsx`): parse on Enter/blur (24, 24px, 2rem, auto, 50%, token); bare number → field default unit; invalid → red border + `HelperText` "Use a number or a unit like 24px, 2rem, auto." with `aria-describedby` + `aria-invalid`, old value kept, Esc restores; ↑/↓ ±1, Shift ±10. `ColorInput`: "Use a hex like #1A56DB or pick a token." Errors announced via one polite live region in `ProInspector`.
- `role="tabpanel"` + `aria-labelledby` on the tab body; tablist already arrow-key capable. `ButtonGroup` → `role="radiogroup"` with ←/→. Visible label + `aria-label` with unit ("Font size, pixels") on every field; checkbox label beside the box, never the value (X-8). Targets ≥ 24px (unit select, Remove class, section header, swatch). One focus style (`--bk-shadow-focus`). Breadcrumb landmark. Apply-to-all toast + field errors `aria-live="polite"`. Long names ellipsise with tooltip (300px fixed).

### 1.11 What gets DELETED

| File | When / lane | Replaced by |
|---|---|---|
| `insp/hooks/useInspectorTier.ts` (+ footer tier `Tabs`, `InspectorTabContent` Show all/less) | W1 | nothing (DD-5) |
| `insp/components/ScopeDropdown.tsx` (+ `reachAll`, `wholeSite` state and banners in `ProInspector.tsx`) | W1 | ⋯ Apply style to all (DD-6a/6b) |
| `insp/components/StateDropdown.tsx` | W1 | `ContextRow` state chip + chrome-ui Menu |
| `insp/components/BreakpointOverrides.tsx` | W1 | `ContextRow` breakpoint chip + per-field `OverrideDot` reset (L2-D2) |
| `insp/components/LockedBanner.tsx` | W1 | `StatusLine` |
| `insp/hooks/usePickModeReset.ts` | W1 | nothing (pick button gone; event kept) |
| `insp/sections/TextContentRow.tsx` | W1 (`git mv` → `typeBlock/EditTextRow.tsx`) | type blocks |
| `insp/sections/elementProperties/index.tsx`, `config.ts` | W1 (`handlers.ts`, `PropertyField.tsx` → `typeBlock/`; `DataAttributeEditor.tsx` → `sections/attributes/`) | `typeBlock/*`, `AttributesSection` |
| `insp/config/elementProfiles.ts` | W1 | `config/sectionOrder.ts` + `src/shared/constants/elementCapabilities.ts` |
| `insp/sections/registry/layout.tsx`, `typography.tsx`, `visual.tsx`, `element.tsx` | W1 | `box.tsx`, `text.tsx`, `behaviour.tsx` |
| ⋯ rows Improve with AI, Pick on canvas, Select parent, Hide inspector, Expand/Collapse all | W1 | ✦ chip, canvas click, breadcrumb, header ✕ + ⌘\, ⌥-click |
| `insp/components/BindingBanner.tsx` | L2-D1 | header chip + CMS binding section |
| `insp/sections/MediaSourceRow.tsx` | L2-B (`git mv` → `typeBlock/SourceRow.tsx`) | image/video/audio/svg bodies |
| `insp/sections/EffectsSection.tsx`, `EffectsBasicSections.tsx` | L2-C | `sections/effects/{Opacity,Shadow,Filters,TransformMotion,EffectsAdvanced}Section.tsx` |
| `insp/sections/flexbox/index.tsx` (section wrapper), `GridSection.tsx` section wrapper | L2-C | `FlexControls`/`GridControls` in Flex type block + Layout |
| Layout Width/Height selects, Spacing Gap/Row gap/Column gap + padding/margin pairs | L2-C | Size section; Flex/Grid gap; SpacingBox |
| Link/Button "Open In", link "Rel"/"Title" attribute rows, all content textareas | W1 (attribute config) + L2-D1 (Rel in Link) | Link section (with Rel) / canvas inline edit |
| ID&class classes string | L2-D1 | CSS classes chips (multi-class paste) |
| `insp/sections/VariantSection.tsx` | L2-D2 (→ `ComponentRow.tsx`) | component row |
| `insp/components/MultiSelectToolbar.tsx`, `BatchStylePanel.tsx`, `insp/hooks/useBatchStyleHandler.ts`, `insp/shared/MixedValueBadge.tsx` | L3-A | same panel + `MultiSelectBar` |
| `insp/components/InspectorEmptyState.tsx` | L3-A | `PagePanel` (template-applied banner moved in) |

Stays (verified used): `hooks/useAdvancedSettings.ts` (§17.H in-section advanced rows), `hooks/usePropertyJump.ts`, `config/cssContext.ts`, `config/pseudoOverrides.ts`, `shared/detectMixedValues.ts`, `components/ElementNameField.tsx`, `DeleteConfirmModal.tsx`, `InspectorErrorBoundary.tsx` (reset on selection change, §14), `InspectorLoading.tsx`.

---

## 2. Board → code map (36 boards)

| # | Board (node) | Renders it | Change | Lane |
|---|---|---|---|---|
| 1 | Heading · S `7993:198599` | `InspectorHeader`, `ContextRow`, `TypeBlockSection`→`textBodies` Heading, `registry/text.tsx` Typography, `registry/box.tsx` Size/Spacing/Fill/Border | Level H1–H6 segmented, Text style select (font-size token), Edit text on canvas; Size/Line pair; Width "Fill · 640 px", Height "Hug · Auto"; SpacingBox only; Fill/Border "+" rows | W1 · L2-A · L2-C |
| 2 | Heading · B `7993:198958` | `registry/behaviour.tsx`: CmsBinding, Visibility, Interactions, CssClasses, Attributes | tab renamed; Interactions moved here; Attributes closed with summary; no context row | W1 · L2-D1 |
| 3 | Heading · E `7993:199242` | `registry/effects.tsx` | Opacity/Shadow/Filters/Transform & motion "+" rows; Advanced closed "Cursor: auto · Blend: normal"; no Interactions | L2-C |
| 4 | Text · S `7995:199188` | `textBodies` Text | Text style + Edit text on canvas; then as #1 | L2-A |
| 5 | Button · S `7995:199522` | `textBodies` Button | Edit text on canvas, Type Button/Submit/Reset, Disabled (label beside box); **no Typography** (OQ-1) | L2-A · W1 caps |
| 6 | Button · B `7995:199820` | `LinkSection` + behaviour set | Link to None/Page/URL/Email/Phone/Anchor, Page select, Open in new tab, **Rel** field, hint "Changing Link to clears the old destination" | L2-D1 |
| 7 | Link · B `7995:200137` | `LinkSection` URL variant | URL field, new tab, rel | L2-D1 |
| 8 | Image · S `7995:200452` | `mediaBodies` Image + `typeBlock/SourceRow` | thumb, file name, "2400 × 1600 · 428 KB", Replace; Alt + "Add alt text…" hint; Fit Cover/Contain/Fill (moved from Size); Loading | L2-B (+ L2-C removes object-fit from Size) |
| 9 | Video embed · S `7995:200767` | `embedBodies` VideoEmbed + engine serializer | Video URL, "Detected: YouTube", Ratio, Autoplay/Muted/Show controls, warning when autoplay && !muted | L2-B |
| 10 | Audio · S `7995:201080` | `mediaBodies` Audio | source row "3:42 · 4.8 MB" + Choose audio (picker `allowedTypes: ["audio"]`), controls/loop/autoplay on `<audio>` | L2-B |
| 11 | Countdown · S `7995:201380` | `widgetBodies` Countdown + `countdownRuntime` | Ends at (date-time), "Uses the visitor's time zone.", When done Show message/Hide, Message | L2-B |
| 12 | Progress · S `7995:201678` | `widgetBodies` Progress | Value / Max pair, Show label | L2-B |
| 13 | Accordion · S `7995:201971` | `widgetBodies` Accordion + `accordionRuntime` | item list (N · title · Open/Closed), "Allow several open at once" | L2-B |
| 14 | Input · S `7995:202274` | `formBodies` Input | Input type, Name, Placeholder, Default, Required, Disabled; no Typography (OQ-1) | L2-A |
| 15 | Checkbox · S `7995:202583` | `formBodies` Choice | header reads "Checkbox" (Q2 types, W1 labels); Edit text, Name, Checked by default, Required | L2-A |
| 16 | Flex · S `7995:202877` | `layoutBodies` Flex (`FlexControls`) | Direction Row/Column, 3×3 align + "Align Center / Center", Wrap, Gap — always visible (no tier) | L2-C |
| 17 | Container (grid) · S `7995:203208` | `LayoutSection` + `text-inside` | Display Block/Flex/Grid/**None**; Columns / Gap when grid; Position; Text inside closed "Inter · 16px · Text / primary" | L2-C · L2-A |
| 18 | Section · B `7995:203523` | behaviour set via capabilities | Link present, **no** CMS binding | W1 caps · L2-D1 |
| 19 | Form · B `7995:203829` | `FormFieldsSection`, `FormAfterSubmitSection` | ⠿ rows "Name · Text · Required", + Add field; Then / Message / Send to; note "Saved to your site straight away — not part of Undo. Changing Send to needs an admin." | L2-D1 |
| 20 | Collection list · B `7995:204147` | `CollectionListSection` | Collection select with "+ New collection…" always, Show items, **Open collection ›** (`UI_CMS_OPEN`) | L2-D1 |
| 21 | Page panel `7995:204447` | `PagePanel` + header `page` variant + section `variant: "page"` | "Home · Page", Fill/Size/Typography/Spacing, "SEO & social…", "Your place here is kept", no tabs | L3-A · L2-A · L2-C · W1 |
| 22 | Multi-select `7995:204715` | header `multi`, `MultiSelectBar`, intersection renderer, field context Mixed | "3 selected · Headings"; Align ×6, Distribute ×2, Group; note; "Mixed" in Size/Line + Width | W1 · L3-A |
| 23 | Locked `7995:205108` | `StatusMarks` 🔒, `StatusLine`, read-only field context | "Locked — unlock to edit · Unlock"; values legible, not dimmed | W1 (+ L3-C control rendering) |
| 24 | CMS-bound · B `7995:205467` | `StatusMarks` chip, `CmsBindingSection` | clickable "⌁ Menu.name"; Collection (+ New collection…), Field "name · Text" (filtered by type), preview "Cacio e pepe (record 1 of 3)", Open record ›, Unbind, "Unbind keeps the text you see now" | W1 · L2-D1 |
| 25 | CMS source missing · B `7995:205787` | chip missing variant, `CmsBindingSection` error | red "⌁ Specials.title · missing"; "Source missing — Collection “Specials” was deleted…" + Reconnect… / Unbind | W1 · L2-D1 |
| 26 | Component instance · S `7995:206087` | `StatusMarks` ◆, `ComponentRow`, `OverrideDot` master | Variant select, Edit master ›, ⋯ Reset to master · Detach instance…; dot on Padding + "● Padding overrides master" | W1 · L2-D2 · L2-C (`property` on SpacingBox) |
| 27 | Button :hover · S `7995:206390` | `ContextRow`, `useFieldOverrides` pseudo, Fill section | chip "State: :hover" accent, "1 :hover override · Reset"; Fill open with Colour ● "Brand / primary" + "● Overridden on :hover" | W1 · L2-D2 · L2-C |
| 28 | Heading on Tablet · S `7995:207832` | `ContextRow` bp chip, Section header dot | "Tablet · 1 override", Revert; "Size ●" + "● Overridden on Tablet" | W1 · L2-D2 |
| 29 | Save conflict `7995:208198` | `StatusLine` conflict, `useSaveConflict` | line + Resolve (reopens ConflictModal); read-only | W1 · L2-D2 |
| 30 | ⋯ menu `7995:208555` | `InspectorElementMenu` ← `INSPECTOR_MENU` | exact 9 rows + 2 rules, shortcuts ⌘D ⌥⌘C ⌥⌘V ⌫, Delete danger | W1 |
| 31 | Apply-to-all dialog `7995:209026` | `ApplyStyleDialog` + `stylePeers.ts` + toast | "Apply this style to N H3 headings on Home?"; Copies/Keeps/Skipped; Brand hint; Cancel / Apply to N; toast "Applied to N H3 headings · Undo" | W1 engine · L3-B |
| 32 | State menu `7995:209399` | `ContextRow` state Menu | "Edit styles for": Base, :hover, :focus, :active, :disabled | W1 |
| 33 | Colour / token popover `7995:209771` | `ColorInput` → `ColorFillPopover`/`TokenPickerPopover` (`Popover beside`) | beside the panel over canvas; brand list with token names + hex; "Add colours in Brand ›" real link | L3-B |
| 34 | Field error `7995:210146` | `InputWithUnit` validation | red border + "Use a number or a unit like 24px, 2rem, auto." | L3-C |
| 35 | AI column `7995:210503` | `sidebar/tabs/ai/AITab.tsx`, `ScopeChip.tsx` | ‹ Inspector, "Scope: Heading", prompt, 3 suggestions, note "Returning keeps your Inspector tab, scroll and state." | L3-D |
| 36 | Inspector hidden `7995:210717` | `shell/StudioPanels.tsx` | canvas full width, "Show inspector ⌘\" button; `mod+\` binding | W1 (binding) · L3-D |

Types with **no board** (link·S, native video, svg/icon, map-embed, lottie, textarea, select, radio, switch, label, grid/columns, stack, tabs, list-item, slider, table, card, navbar, cta, spacer, divider, gallery): built by analogy with the nearest board and reported **NOT board-verified** in Phase 6 (OQ-3).

---

## 3. Work breakdown — waves and file ownership

Rules for every agent:
- Own worktree + branch off `feat/inspector-v4` (`git worktree add ~/Desktop/buildrik-worktrees/insp-<lane> -b feat/insp-<lane> feat/inspector-v4`); the lead merges lanes into `feat/inspector-v4` at the end of each wave. Never edit a file outside your ownership list; need a change elsewhere → note it in your report for the next wave.
- Read `packages/editor/CLAUDE.md`, `src/editor/AGENTS.md`, `src/engine/AGENTS.md`, `DESIGN.md` first. `tw:` + `--bk-*` only, weight ≤ 600, radius ≤ 4 on the panel, Inter / Geist Mono tabular values, no raw `<button>/<input>/<select>` (Gate 24), portals only via chrome-ui (Gate 22), no hex.
- Tests that protect the old layout are rewritten **in the same commit** as the change. Each commit: `npx tsc --noEmit`, `npx vitest run <touched dirs>`, `pnpm run verify:ds` green (the pre-push hook blocks otherwise).
- Acceptance per board = cached board PNG vs live screenshot at 1440×900, side by side, by eye (§4.3). Report states which boards were NOT walked.
- Do not stage `src/editor/shell/AquibraStudio.tsx` from any lane.

### Wave 0 — board cache + fixture (lead, 0.5 day, 2 agents in parallel)

**W0-F · Figma cache (1 agent, the only Figma caller of the whole build).** Load `figma:figma-design-to-code`; for each of the 36 v4 node ids: `get_design_context` (+ `get_screenshot` only if the context carries no image) via `node scripts/baseline/figma-mcp.mjs` (import `{ connect, rpc }` for big payloads). Save to `conf/raw-figma/inspector-v4-NN.json` and `conf/raw-figma/inspector-v4/NN.png`. ≤ 72 calls, ≤ 15/min, one day. Owns only those files.

**W0-X · State fixture (1 agent).** Owns new `e2e/fixtures/inspector-v4-site.json` (one page "Home" › "Hero" holding every type on boards 1–20 + a flex, a grid container, a form with 3 fields, a collection list on collection "Menu" with 3 records, a heading bound to `Menu.name`, a heading bound to deleted collection "Specials", a component instance "Reservation banner" with a padding override, a button with a `:hover` fill, a heading with a Tablet width override, 3 H3 headings) and new `conf/inspector-v4-state.mjs` (exports one `--eval` snippet per board that selects the element / tab / state / breakpoint, locks, multi-selects, or raises a save conflict via `raiseSaveConflict`). Every later lane uses it for live checks.

### Wave 1 — shared chassis (ONE agent, ~2.5 days, sequential commits)

**W1 · Chassis (I-1, I-2, I-6, I-7, I-8 frame, I-11 frame; boards 30, 32 fully; frames for all).**

Files owned (create / modify / delete):
- **Create:** `src/editor/chrome-ui/Breadcrumb.tsx` (+ export in `chrome-ui/index.ts`, `chrome-ui/__tests__/Breadcrumb.test.tsx`); `src/shared/constants/elementCapabilities.ts`; `src/editor/shared/elementActions.ts`; `src/engine/commands/stylePeers.ts`; `insp/config/sectionOrder.ts`, `insp/config/typeBlocks.ts`; `insp/components/{InspectorHeader,StatusMarks,StatusLine,ContextRow}.tsx`; `insp/components/{PagePanel,MultiSelectBar,ApplyStyleDialog}.tsx` (**stubs with final props**: PagePanel renders `InspectorEmptyState`, MultiSelectBar renders the align row lifted from `MultiSelectToolbar`, ApplyStyleDialog = `ConfirmDialog` with counts + apply); `insp/shared/controls/{InspectorFieldContext,OverrideDot}.tsx` (OverrideDot breakpoint kind only); `insp/hooks/{useElementBinding,useFieldOverrides}.ts` (breakpoint only); `src/editor/shell/hooks/useSaveConflict.ts` (stub `{ pending: false }`); `insp/sections/typeBlock/{TypeBlockSection.tsx,EditTextRow.tsx,PropertyField.tsx,attributeWriter.ts}` + `typeBlock/bodies/{textBodies,formBodies,mediaBodies,embedBodies,widgetBodies,layoutBodies}.tsx` (generic bodies from old `ELEMENT_PROPERTIES`); `insp/sections/attributes/{AttributesSection.tsx,DataAttributeEditor.tsx}` + `insp/config/attributeFields.ts` (final §17.H set; no Open In/Rel/Title-on-link/textarea rows); `insp/sections/registry/{type,component,text,box,effects,behaviour}.tsx` (entries point at today's components; effects entries point at today's Opacity/Shadow/Blur/"More effects" until L2-C); `insp/__tests__/mustNot.test.tsx`; `conf/surfaces/inspector-v4-NN.json` ×36 skeleton recipes (steps from W0-X + `inspector-panel` target, no spec join yet).
- **Modify:** `insp/ProInspector.tsx` (rewrite as composition: header → StatusLine → Tabs → ContextRow → tabpanel body; DD-20; field context provider; multi path; page path; stubs), `insp/tabs/InspectorTabContent.tsx` (fixed orders, capabilities, display modes, intersection for multi, no tier), `insp/sections/registry/{_shared,index}.tsx`, `insp/hooks/useInspectorSections.ts`, `insp/hooks/useStyleHandlers.ts` (`reachPeerIds` → `extraTargetIds`; conflict early-return), `insp/hooks/usePropertyJump.ts`, `insp/config/propertyIndex.ts`, `insp/components/InspectorElementMenu.tsx` (registry + chrome-ui Menu), `insp/shared/controls/{Section,ControlRow,InputControls,ColorInput,ButtonControls,SpacingControls}.tsx` (only: `displayMode`/`onAdd`/`headerDot`/`note` on Section; optional `property` + field-context read-only/Mixed/dot on controls), `insp/sections/LinkSection.tsx` (import `LINKABLE` from capabilities — one line), `insp/styles/inspector.css`, `insp/index.ts`, `insp/components/index.ts`, `insp/hooks/index.ts`, `src/engine/commands/defaultCommands.ts`, `src/editor/canvas/menus/{contextMenuRegistry.ts,actions/standaloneActions.ts,actions/editActions.ts,actions/styleActions.ts}`, `src/editor/canvas/hooks/useCanvasKeyboard.ts`, `src/editor/panels/layers/hooks/useLayerActions.ts` (lock → command), `src/shared/constants/events.ts` (`UI_APPLY_STYLE_REQUESTED`), `src/editor/AGENTS.md` (one invariant line), `conf/boards.json` (21 active old Inspector rows → `retired` with note "superseded by Inspector v4, 2026-09-28"; 36 v4 rows → `active`, `recipe` set), `conf/.conformance-baseline.json` (old keys out, v4 keys in).
- **Delete:** `insp/hooks/{useInspectorTier,usePickModeReset}.ts`, `insp/components/{ScopeDropdown,StateDropdown,BreakpointOverrides,LockedBanner}.tsx`, `insp/config/elementProfiles.ts`, `insp/sections/registry/{layout,typography,visual,element}.tsx`, `insp/sections/elementProperties/{index.tsx,config.ts}` (others moved), `insp/sections/TextContentRow.tsx` (moved), 14 × `conf/surfaces/inspector-*.json` (old) + their `conf/specs/inspector-*.json`.

Tests to rewrite/delete in W1 (by path, all under `src/`):
- delete: `editor/inspector/__tests__/SectionTier.persist.test.tsx`, `editor/inspector/tabs/__tests__/InspectorTabContent.tier.test.tsx`, `editor/inspector/components/__tests__/ProInspector.reachAndPseudoBanners.test.tsx`, `editor/inspector/components/__tests__/StateDropdown.trigger.test.tsx`, `editor/inspector/components/__tests__/BreakpointOverrides.test.tsx`, `editor/inspector/components/__tests__/LockedBanner.test.tsx` (→ `StatusLine.test.tsx`), `editor/inspector/components/__tests__/InspectorElementMenu.expand.test.tsx`, `editor/inspector/hooks/__tests__/usePickModeReset.test.ts`, `editor/inspector/config/__tests__/elementProfiles.fallback.test.ts`.
- rewrite: `editor/inspector/__tests__/ProInspector.branches.test.tsx`, `editor/inspector/__tests__/elementProfiles.test.ts` (→ `elementCapabilities.test.ts` + `sectionOrder.test.ts`), `editor/inspector/tabs/__tests__/InspectorTabContent.test.tsx`, `editor/inspector/hooks/__tests__/useInspectorSections.test.ts`, `editor/inspector/sections/registry/__tests__/{defineSection,shouldRender,composerThread}.test.*`, `editor/inspector/sections/__tests__/{registry.slice,registry.styleKeys}.test.ts`, `editor/inspector/__tests__/Section.test.tsx`, `editor/inspector/shared/controls/__tests__/Section.header.test.tsx`, `editor/inspector/components/__tests__/InspectorElementMenu.{clipboard,reset}.test.tsx`, `editor/inspector/components/__tests__/elementActions.converge.test.tsx`, `editor/inspector/components/__tests__/ProInspector.{p4States,scrollMemory,createCollectionThreading}.test.tsx`, `editor/inspector/__tests__/{DeleteButton,DeleteInstant}.test.tsx`, `editor/inspector/hooks/__tests__/usePropertyJump.test.tsx`, `editor/inspector/config/__tests__/propertyIndex.test.ts`, `editor/inspector/hooks/__tests__/useStyleHandlers.reach.test.ts` (→ extraTargetIds), `editor/inspector/sections/__tests__/TextContentRow.test.tsx` (→ `EditTextRow.test.tsx`), `editor/inspector/sections/elementProperties/__tests__/*` (move with files; drop textarea/Open In cases), `editor/canvas/menus/__tests__/contextMenuRegistry.test.ts`, `editor/shell/__tests__/StudioPanels.{inspectorColumn,inspectorDelete}.test.tsx`, `editor/shell/hooks/__tests__/escapeInnermost.test.tsx`.
- new: `engine/commands/__tests__/stylePeers.test.ts`, `engine/commands/__tests__/styleCommands.test.ts` (copy/paste/reset/lock/unlock/toggle shortcut), `editor/shared/__tests__/elementActions.test.ts` (⋯ = exactly board 30; canvas menu rows run the same handler), `insp/components/__tests__/{InspectorHeader,ContextRow,StatusLine}.test.tsx`, `insp/__tests__/mustNot.test.tsx` (renders every selection type × tab and asserts none of: "Beginner", "Pro" tier, "Applies to", "Whole site", "All like this", "Improve with AI", "Pick on canvas", "Select parent", "Hide inspector" in ⋯, "Expand all", "Open In", "000000", "Container" as the title of checkbox/embeds, CMS on non-bindables, Link/CMS/Visibility/Interactions on the Page panel, context row on Behaviour).

Acceptance (MUST items): every board's header row (breadcrumb, icon + name, ✦ AI, ⋯, ✕), tab strip Style · Behaviour · Effects, "State: Base" on Style/Effects only, sections in define → shape → paint order with "+" rows / summaries; board 30 exact; board 32 exact; board 23 locked line + read-only; board 36 `mod+\` toggles; `mustNot.test.tsx` green; `verify:ds` green (anchors, boards floor, copy).

### Wave 2 — sections and type blocks (5 agents in parallel, ~2 days)

| Lane | I-items | Boards | Files owned (create / modify / delete) | Tests to rewrite | Acceptance |
|---|---|---|---|---|---|
| **L2-A Text & form** | I-3, I-4 | 1, 4, 5, 14, 15, 17 (Text inside), 21 (typography page subset) | modify `typeBlock/bodies/textBodies.tsx`, `typeBlock/bodies/formBodies.tsx`, `typeBlock/EditTextRow.tsx`, `sections/typography/*` (FontControls, TypographyControls, FontPicker*, index), `registry/text.tsx`; `property=` on typography rows | `sections/typography/__tests__/*`, `sections/elementProperties/__tests__/{config.types,PropertyField.checkbox,nameClobbering}` (moved copies under `typeBlock/__tests__/`), new `typeBlock/__tests__/{textBodies,formBodies}.test.tsx` | Heading Level writes the tag (one Undo); Text style binds `font-size` to a Brand font-size token (`typeStyleRows`); Size/Line pair; Colour token chip; align segmented; Button Type + Disabled with label beside; Input 6 rows; Checkbox reads "Checkbox", writes inner `<input>`; Text inside summary; page variant shows Font + Text colour only |
| **L2-B Media, embeds, widgets + runtimes** | I-3 (Q5) | 8, 9, 10, 11, 12, 13 | modify `typeBlock/bodies/{mediaBodies,embedBodies,widgetBodies}.tsx`; `git mv sections/MediaSourceRow.tsx typeBlock/SourceRow.tsx` (+ SVG → drawer pick mode via `onOpenMediaLibrary`, no full page); create `src/shared/utils/embed/parseEmbedUrl.ts` (YouTube/Vimeo/Maps/Lottie → provider + embed src), `src/engine/export/{countdownRuntime,accordionRuntime}.ts`, `src/editor/canvas/hooks/{useCountdownRuntime,useAccordionRuntime}.ts` (mirror `useSliderRuntime.ts`); modify the export path that injects `sliderRuntime` to inject the two new runtimes; modify `blocks/Media/{VideoEmbed,MapEmbed,Lottie}.tsx`, `blocks/Components/{CountdownTimer,ProgressBar,Accordion}.tsx` only to add the data attributes the bodies write (no markup redesign); embed `toHTML`/render of `<iframe>` in the element serializer for `video-embed`/`map-embed` | `sections/__tests__/MediaSourceRow.test.tsx` (→ `typeBlock/__tests__/SourceRow.test.tsx`), new `typeBlock/__tests__/{mediaBodies,embedBodies,widgetBodies}.test.tsx`, `shared/utils/embed/__tests__/parseEmbedUrl.test.ts`, `engine/export/__tests__/{countdownRuntime,accordionRuntime}.test.ts`, export snapshot for iframe | Image block rows exactly board 8, Fit writes `object-fit`; embed URL → iframe on canvas and in export; "Detected: YouTube"; muted warning shows only for autoplay && !muted; audio source via picker; countdown ticks on canvas + export and does When done; progress value/max drives the bar; accordion Open per item + allow-multiple honoured at runtime (subject to OQ-2) |
| **L2-C Layout, shape, paint, effects** | I-4, I-7 (D-10/11/12) | 1, 3, 16, 17, 21 (fill/size/spacing page subset), 26–27 (field `property`) | modify `sections/layout/*`, `sections/SizeSection.tsx` (drop `object-fit`, Fill·N / Hug·Auto readouts), `sections/SpacingSection.tsx` (SpacingBox only, gap rows gone), `sections/BackgroundSection.tsx` (title Fill, `onAdd`), `sections/BorderSection.tsx`, `sections/flexbox/*` (→ `FlexControls`), `sections/GridSection.tsx` (→ `GridControls`), `typeBlock/bodies/layoutBodies.tsx`, `registry/box.tsx`, `registry/effects.tsx`; create `sections/effects/{OpacitySection,ShadowSection,FiltersSection,TransformMotionSection,EffectsAdvancedSection}.tsx`; delete `sections/EffectsSection.tsx`, `sections/EffectsBasicSections.tsx` | `sections/__tests__/{SizeSection,SpacingSection,BackgroundSection.controls,BorderSection.controls,BorderSection.radius,GridSection.controls,EffectsSection.compose,EffectsSection.controls,noChromeTokenWrites}.test.*`, `insp/__tests__/{BackgroundSection,BorderSection,EffectsSection,GridSection}.test.tsx`, `sections/layout/__tests__/*`, `sections/flexbox/__tests__/FlexboxSection.test.tsx` | One writer per CSS property (grep-verified in the report); Display includes None; grid Columns/Gap in Layout; Flex block always visible; Effects = 4 "+" rows + Advanced summary; Shadow presets+custom+inner in one section; Filters = blur + others; SpacingBox fields carry `property` (dots light for 26) |
| **L2-D1 Behaviour & CMS** | I-4 (Rel), I-10 | 2, 6, 7, 18, 19, 20, 24, 25 | modify `sections/LinkSection.tsx` (Rel field, type-change hint; Rel is the only rel writer), `sections/ContentSection.tsx` → `sections/CmsBindingSection.tsx`, `sections/CollectionListSection.tsx`, `sections/FormFieldsSection.tsx`, `sections/FormAfterSubmitSection.tsx`, `sections/VisibilitySection.tsx`, `sections/CSSClassesSection.tsx` (multi-class paste), `sections/interactions/*`, `sections/attributes/*`, `insp/config/attributeFields.ts`, `insp/hooks/useElementBinding.ts` (`missing`), `registry/behaviour.tsx`; delete `components/BindingBanner.tsx` | `sections/__tests__/{ContentSection,CollectionListSection,FormAfterSubmitSection,FormFieldsAndSlides,SliderPlaybackSection,CSSClassesSection.refresh,CSSClassesSection.write,LinkSection.validation,LinkSection.write,VisibilitySection}.test.tsx`, `insp/__tests__/CSSClassesSection.test.tsx`, `sections/interactions/__tests__/*`, `components/__tests__/BindingBanner.test.tsx` (delete), `sections/elementProperties/__tests__/DataAttributeEditor*.test.tsx` (moved to `attributes/__tests__/`) | Link rows board 6/7 incl. Rel + hint; CMS section Static/From CMS, Field filtered by type, preview "(record 1 of N)", Open record › (`UI_CMS_OPEN` + recordId), Unbind keeps text (P-2), hint; missing error box + Reconnect…/Unbind; Collection "+ New collection…" always + Open collection ›; Form rows + note; Attributes summary |
| **L2-D2 Component, overrides, conflict** | I-9, I-8 (dots), I-11 (conflict) | 26, 27, 28, 29 | `git mv sections/VariantSection.tsx sections/ComponentRow.tsx` (compact row: Variant select, Edit master ›, ⋯ Reset to master / Detach instance… with existing confirms), `registry/component.tsx`, `insp/hooks/useFieldOverrides.ts` (pseudo + master kinds), `insp/shared/controls/OverrideDot.tsx` (all kinds, reset menu), `src/editor/shell/hooks/useSaveConflict.ts`, `src/services/BuildrikSyncProvider.ts` (`getPendingConflictToken`, `SAVE_CONFLICT_CLEARED_EVENT`) | `sections/__tests__/VariantSection.test.tsx` (→ `ComponentRow.test.tsx`), `config/__tests__/pseudoOverrides.test.ts`, `hooks/__tests__/{useStyleHandlers.stateReset,useStyleHandlers.responsive}.test.ts` (dot data only), new `hooks/__tests__/{useFieldOverrides,useSaveConflict}.test.ts`, `shared/controls/__tests__/OverrideDot.test.tsx`, `services/__tests__/` conflict-cleared case | Dots for all three kinds with announced labels and per-field reset; notes "● Padding overrides master" / "● Overridden on :hover" / "● Overridden on Tablet"; conflict line appears on `SAVE_CONFLICT_EVENT`, controls read-only, Resolve reopens ConflictModal, line clears after Reload/Overwrite; AquibraStudio untouched |

### Wave 3 — states, overlays, a11y, escalations (4 agents in parallel, ~1.5 days)

| Lane | I-items | Boards | Files owned | Tests to rewrite | Acceptance |
|---|---|---|---|---|---|
| **L3-A Multi-select + Page panel** | I-12, I-13 | 21, 22 | `insp/components/{MultiSelectBar,PagePanel}.tsx`; `insp/shared/detectMixedValues.ts`; delete `components/{MultiSelectToolbar,BatchStylePanel,InspectorEmptyState}.tsx`, `hooks/useBatchStyleHandler.ts`, `shared/MixedValueBadge.tsx`; `conf/copy.json` ("Inspector · no selection" → `missing`, note "superseded by Page panel, board 7995:204447") | delete `components/__tests__/MultiSelectToolbar.test.tsx`, `hooks/__tests__/useBatchStyleHandler.{read,responsive}.test.ts`, `shared/__tests__/MixedValueBadge.test.tsx`; move `components/__tests__/InspectorEmptyState.{noselection,templateApplied}.test.tsx` → `PagePanel.test.tsx`; update `shared/__tests__/detectMixedValues.test.ts`; `editor/sidebar/tabs/media/components/__tests__/Section21_per_page.test.tsx` if it pins the empty state | Board 22: bar, Distribute disabled < 3, Group, note, "Mixed" muted with `aria-label` "Mixed values", one Undo restores all N; board 21: Page panel on empty click **and** on page-root select, no tabs, SEO & social… returns to the same place |
| **L3-B Overlays** | I-5 dialog, P-4 polish | 31, 33 (30/32 re-verified) | `insp/components/ApplyStyleDialog.tsx`, `insp/shared/{ColorFillPopover,TokenPickerPopover}.tsx` | `shared/__tests__/{ColorFillPopover,TokenPickerPopover.custom-tab}.test.tsx`, `insp/__tests__/TokenPickerPopover.test.tsx`, new `components/__tests__/ApplyStyleDialog.test.tsx` | Dialog copy/rows board 31, skipped = locked + in-instance counts, one transaction, toast with Undo (live: 3 H3s change, other pages untouched, one Undo reverts); popover opens beside the column over canvas, never clipped, token names + hex, "Add colours in Brand ›" opens Brand with selection held |
| **L3-C Validation + a11y** | I-15 | 34 (+ §16 on all) | `insp/shared/controls/*` (except OverrideDot), `insp/styles/inspector.css`, `insp/sections/DSBindingChip.tsx` (one binding indicator, real focus style), `src/editor/chrome-ui/Tabs.tsx` (optional `panelId`, additive) | `shared/controls/__tests__/{InputWithUnit,InputWithUnit.a11y,ColorInput,ColorInput.bindingChip,SelectRow,rowLabels,SpacingControls.bindingChip,TokenValueDisplay}.test.tsx`, `sections/__tests__/DSBindingChip.test.tsx`, `chrome-ui/__tests__/Tabs*` | Board 34 exact; Esc restores; ↑/↓/Shift; hex message; `aria-invalid` + `aria-describedby` + polite live region; tabpanel; radiogroup arrows; every field named with unit; targets ≥ 24px (e2e `target-size.spec.ts` green); one focus ring |
| **L3-D Escalations + shell** | I-14 | 35, 36 (+ §13 returns) | `src/editor/shell/StudioPanels.tsx` (Show inspector button + ⌘\ hint when hidden), `src/editor/sidebar/tabs/ai/{AITab,ScopeChip}.tsx` (scope "Heading", suggestions, return note), `src/editor/sidebar/tabs/component-library/{openMasterRequest.ts,useComponentsState.ts}` + the master detail view ("‹ Back to instance" re-selects the instance), `src/editor/cms/CmsWorkspace.tsx` (Back to canvas → bound element) | `shell/__tests__/StudioPanels.inspectorColumn.test.tsx` (show button), AI tab tests that pin copy, component-library + CMS return tests | Board 35/36 exact; every §13 door returns to the same element, tab and scroll (live, one walk per door) |

### Wave 4 — conformance + Phase 6 validation (1 agent, ~1.5 days)

Owns `conf/boards.json` (`verified`, `verifiedNote`), `conf/surfaces/inspector-v4-*.json` (targets + spec joins), `conf/specs/inspector-v4-*.json` (from W0 raw-figma via `extract.mjs`), `conf/.conformance-baseline.json` (`--update-floor`), the Phase 6 result table (appended to this doc). Walks every selection type × tab, every state board, every escalation; measures control counts (Heading ≤ 25, Input ≤ 30 — DD budget); records IMPLEMENTED / FUNCTIONALLY VERIFIED / RUNTIME VERIFIED / NOT VERIFIED per item, and lists the no-board types (§2 tail) as NOT board-verified.

---

## 4. Test strategy

### 4.1 Unit / RTL
- Per section and per type-block body: RTL on `insp/__tests__/harness.tsx` (real Composer). Assert the board's MUST strings in order (source: board texts), the write (attribute or style) and **one Undo** (`history.flushPending()` before asserting — engine/AGENTS.md), and the lock refusal (P-1 path stays covered by `insp/__tests__/lockGuard.writePaths.test.tsx`, kept green in every wave).
- Registry integrity: every `SectionId` in the three orders exists, every entry's `styleKeys` exhaustive (`registry.styleKeys.test.ts`), every `ElementType` has a capability row (compile time) and a type-block id or `null`.
- `mustNot.test.tsx` (W1 creates, every lane keeps green): the spec's MUST-NOT list, per type × tab.
- Engine: `stylePeers`, new commands, runtimes, embed serializer, conflict-cleared event.
- Old-layout tests are listed per lane in §3; a lane's PR description lists each rewritten/deleted test and why.

### 4.2 Gates per commit
`npx tsc --noEmit` · `npx vitest run src/editor/inspector src/editor/canvas/menus src/engine/commands <lane dirs>` · `pnpm run verify:ds` (anchors, boards floor, copy, chrome-ui surface, Gate 22/24, hex, styling ratchet).

### 4.3 Live verification loop (per board, per lane)
1. Board image: `conf/raw-figma/inspector-v4/NN.png` (cached in W0 — **lanes make zero Figma calls**).
2. Live: dev server, then `node scripts/conformance/live-shot.mjs --out /tmp/insp-NN.png --eval "$(node scripts/conformance/inspector-v4-state.mjs NN)"` at 1440×900 on the W0 fixture, element selected as the board shows.
3. Side by side, by eye; measure disputed spacing with `getComputedStyle` (not eyeballing at 2×). Not matching → fix → repeat.
4. Record in the lane report: board NN matched / differences left (with reason) / NOT walked.

Figma quota (200/day, 15/min, shared): W0 ≤ 72 calls on day 1 (36 design-context + ≤ 36 screenshots), reserve 20 for re-fetching boards the owner edits during the build. No lane has Figma access; W4 needs none (specs come from the cache).

---

## 5. Risks and rollout

| Risk | Surface it could break | Mitigation |
|---|---|---|
| Element-action registry refactor changes canvas right-click rows | Canvas menu (board 4428:43928), `contextMenuRegistry.test.ts` | Canvas grouping kept verbatim; test asserts canvas row ids/order unchanged and that each row runs the registry handler |
| ⌥⌘C/⌥⌘V move from `useCanvasKeyboard` to KeybindingManager | Style clipboard while typing in inputs / inline edit | Keep the existing input-focus guard semantics (commands guard); test ⌥⌘V inside a text field does nothing |
| `mod+\` collides with an OS/browser binding | Shortcut | grep shows no current binding; test in Chrome + Safari in W1 |
| Lock converges on commands | Layers eye/lock toggles (`useLayerActions.ts`) | Layers tests + live toggle in W1; same transaction name `lock-element` |
| Breadcrumb selects ancestors | Layers highlight/scroll-into-view, canvas selection overlay | Uses `composer.selection.select`, the same path as a Layers click; live check with Layers open |
| Section id renames (`content` → `cms-binding`, `background` → `fill`, `blur` → `filters`) | ⌘K Jump to property, canvas "Bind to CMS field…", "Add interaction", stored section prefs | Ids renamed in one W1 commit incl. `standaloneActions.ts`; prefs key bumped to v3 |
| AI column / full pages | AI covers Inspector (P-7), held selection (P-5) | `ProInspector` stays mounted in `inspector-body-host`; L3-D re-walks both |
| Q5 runtimes change published output | Export of countdown/accordion/embeds | Export snapshot tests; runtime only runs on elements carrying the new data attributes (old sites unchanged) |
| Conformance gates red mid-branch | pre-push blocked | W1 retires old recipes and adds 36 skeletons in the same commit; floor never drops |
| Transient capability gaps between waves (e.g. Rel between W1 and L2-D1) | Only the integration branch | Nothing lands on `main` before W4 passes; W1 generic type-block bodies keep every defining prop reachable |
| `useStyleHandlers` multi-target | Undo granularity | One transaction per edit, `flushPending()` in tests, live Undo in L3-A |

**Rollout — recommend no runtime feature flag.** The old and new Inspector share the registry, section ids, tab ids and the element-action registry; a flag would mean running two registries and two ⋯ menus side by side, and editor flags have the `VITE_`/`NEXT_PUBLIC_` pair trap (root CLAUDE.md). Instead: waves merge into `feat/inspector-v4`; `main` receives **one** merge after W4's validation table is complete; rollback = revert that merge commit. Stale localStorage keys (`buildrick-inspector-tier`, `buildrick-inspector-sections-v2`) are removed on first load.

**Conformance:** in W1, the 21 `active` rows of family `Inspector` flip to `retired` ("superseded by Inspector v4, 2026-09-28"; the two `out-of-scope` rows stay), their 14 recipes and specs are deleted, and the 36 `Inspector v4` rows flip from `design-ahead` to `active` with skeleton recipes (`check-boards` refuses a recipe on a non-active board). W4 adds spec joins and sets `verified`. `conf/copy.json`'s "Inspector · no selection" row is re-stated by L3-A.

---

## 6. Open questions for the owner (answers change the build)

1. **Typography on Button / Input / Checkbox.** Boards 5, 14, 15 draw no Typography (Button confirmed by you). Where do their font, size and colour get edited? (a) a closed "Text inside" section with a one-line summary, like containers (board 17) — recommended, nothing is lost; (b) only through the type block's Text style; (c) removed. Decides `ELEMENT_CAPABILITIES[*].typography` and the Button/Input/Checkbox boards.
2. **Runtimes for Q5 settings.** Countdown, progress, accordion and video/map embeds are static markup today (F-10): nothing on the published site reads an end date, a value, an open item or an embed URL. Build the two runtimes + embed `<iframe>` serialization in lane L2-B (recommended, about +2 agent-days), or ship settings that only store attributes?
3. **Types with no board** (link·S, native video, svg/icon, map-embed, lottie, textarea, select, radio, switch, label, grid/columns, stack, tabs, list-item, slider, table, card, navbar, cta, spacer, divider, gallery). Build by analogy with the nearest board and report them NOT board-verified (recommended), or add boards first (~20–30 Figma calls, one more day)?
4. **"Text style" = Brand font-size token.** Brand has no composite text style today (F-11). OK to bind only `font-size` to the chosen type-style token (recommended), or hide the row until Brand text styles exist (BRD-05)?
5. **Single landing, no feature flag** (§5). OK to switch every user to v4 in one merge, rollback by revert?

---

## Summary

1. W0 (2 agents, 0.5d): W0-F caches all 36 boards from Figma (≤ 72 calls, the only Figma use); W0-X builds the state fixture + per-board state scripts.
2. W1 (1 agent, ~2.5d): chassis — tabs Style·Behaviour·Effects, capability table, fixed section orders, open/summary/"+" rule, header + new chrome-ui `Breadcrumb`, context row + state menu, field context (read-only/Mixed/dots), element-action registry + engine commands (⋯ board 30, ⌘\), `stylePeers`, generic type blocks, all stubs, deletions (tier, scope, reach, whole site), conformance swap.
3. W2 (5 agents, ~2d, disjoint files): L2-A text & form blocks + typography; L2-B media/embed/widget blocks + runtimes; L2-C layout/size/spacing/fill/border/effects; L2-D1 Behaviour sections + CMS; L2-D2 component row, override dots, save conflict.
4. W3 (4 agents, ~1.5d): L3-A multi-select + Page panel; L3-B apply-to-all dialog + colour popover; L3-C validation + a11y in shared controls; L3-D escalations, AI column, Show inspector.
5. W4 (1 agent, ~1.5d): conformance recipes/specs, verified flags, control budgets, Phase 6 result table.
6. Total: 13 agent runs, at most 5 in parallel, about 8 working days.
7. Only 1 new chrome-ui component (Breadcrumb); SpacingBox, ButtonGroup, Mixed, Menu, ConfirmDialog, Toast are reused.
8. No runtime flag: one merge to `main` after W4, rollback = revert.
9. AquibraStudio is never edited; the save conflict is read from the sync provider.
10. 5 owner questions block parts of W1 (OQ-1, OQ-5), L2-A (OQ-4) and L2-B (OQ-2, OQ-3).

### Owner answers (2026-09-28)

1. **Typography on Button / Input / Checkbox → (a)** a closed "Text inside" section with a one-line summary, like containers (board 17).
2. **Q5 runtimes → build them** in L2-B: countdown + accordion runtimes, embed `<iframe>` serialization (+~2 agent-days).
3. **Types with no board → by analogy** with the nearest board; reported as NOT board-verified in the Phase 6 table.
4. **Text style → bind `font-size`** to the Brand type-style token (recommended default; owner did not object).
5. **Single landing, no feature flag** — all waves merge into `feat/inspector-v4`, one merge to `main`, rollback by revert.

### W1 progress (2026-09-28, branch `feat/insp-w1`)

**Done** — commits `d1d626121` (tabs, capabilities, sectionOrder, registry re-split, DD-11 frame, type block + Attributes, tier gone, conformance swap), `c7c2c6d41` (element-action registry, engine commands copy/paste/reset style + lock/unlock + ⌘\, stylePeers, ⋯ menu board 30, canvas rows, ApplyStyleDialog stub), `29fb725b9` (Breadcrumb, header, StatusMarks, StatusLine, ContextRow, field context + OverrideDot breakpoint kind, multi = same panel + MultiSelectBar stub, PagePanel stub, useSaveConflict stub; Scope/State/BreakpointOverrides/LockedBanner deleted), `e8c9e786f` (mustNot.test, state menu beside the column). tsc 0, verify:ds green at every commit.

**Decisions the plan did not cover**
- `flex` / `grid` stay as INTERIM sections (box.tsx) for a CONTAINER set to flex/grid, right after Layout; the Flex/Grid TYPES carry the controls in their type block. Flex-ITEM controls (grow/shrink/align-self) are not shown in W1 — L2-C decides their v4 home.
- Widgets (countdown, progress) and accordion get `typography: "inside"` (closed Text inside) so text styling stays reachable; boards 11–13 do not draw it.
- Embed / widget / audio / choice-less type blocks: W1 ships NO body where the old Advanced section had no rows (writing attributes nothing reads = OQ-2); the type block does not render for those types until L2-B.
- Lock / unlock commands take `{ elementId }` so Layers rows and the canvas row act on their own element.
- The state chip is a chrome-ui `Button` (Chip is a pill filter chip, label-only; the board draws radius 4 + chevron).
- Disabled ⋯ rows show their reason as a second line (e.g. Paste style "Copy a style first").
- `s3-1-pick-mode` recipe retired (its door, ⋯ Pick on canvas, is gone); board 301:2186 marked unreachable with the reason. `shell-state-6-comment-mode` lost its scope-pill / state-pill targets.
- Old Inspector active rows were 20, not 21.

**For the lanes (live walk, boards 1, 2, 3, 23, 30, 32)** — chassis matches (header 68 tall, panel 300, tabs 32/100, context row, section headers 32, ⋯ = board 30 rows, state menu = board 32 beside the column, locked line + read-only). Remaining differences: Heading block Level is a select, Text style row missing (L2-A); Typography body, Size Fixed/Fill/Hug rows, Spacing pairs + Gap (L2-C / L2-A); Text inside summary prints a raw `var(--…)` (L2-A); CSS classes / Interactions / CMS bodies (L2-D1); Attributes summary needs an `id` on the fixture heading; read-only selects are dimmed via `disabled` (L3-C).

**Remaining W1 items not done**: `Tabs` panelId (W3 per plan); `insp/index.ts` / barrels untouched (nothing needed).

### L2-A progress (2026-09-28, branch `feat/insp-l2a`)

**Done** — `d02841e2d` (type blocks: Heading Level segmented → tag, one Undo, lock-refused; Text style binds `font-size` to a Brand font-size token via `typeStyleRows`, "Custom" unbinds to the resolved size; Button Edit text / Type segmented / Disabled; Input 6 rows; Checkbox/Radio/Switch write the inner `<input>` through the label's lock gate, Edit text on canvas edits the text child; `typeBlock/blockRows.tsx` = `CheckRow` box-then-label + `useElementRead`), `e42f2e27c` (Typography face Font · Font size · Line height · Weight · Colour · Align with `property=` on every row, rest behind More settings (9); page variant = Font + Text colour; Text inside summary with token names, never `var(--…)`, falling back to what the text renders as). Live (port 3121, site "Inspector v4 fixture · L2-A"): H1→H3 writes the canvas tag and one `history.undo()` restores it; Text style "Heading 3" writes `var(--buildrick-design-font-size-2xl)` and the canvas renders 24px; Checked by default lands on `i4-checkbox-1` (not the label), Undo clears it; Edit text on canvas opens inline edit on button, text and the checkbox's span.

**Decisions the plan did not cover**
- Board 1 draws Font size and Line height as two rows (not a pair) — built as the board.
- Align = Left · Center · Right only (board); Justify is no longer on the face.
- The font-size type-token chain button is removed; the type block's Text style is the one door for that binding (buttons / containers keep a plain Font size in Text inside).
- Weight options read as their number ("600"), as the board.
- A rendered colour in the Text inside summary is printed as hex; mapping it back to a token name by value is not done (two tokens can share a value).
- Link and Label bodies = Text style + Edit text on canvas (no board; by analogy with Text).

**Needs from the lead / other lanes**
- `registry/type.tsx` (W1): add `"font-size"` to the type entry's `styleKeys`. Until then `TextStyleRow` reads the element's own font-size as a fallback (`textBodies.tsx`); drop the fallback with the change.
- `config/sectionOrder.ts` (W1): board 17 draws Text inside LAST (after Border); `STYLE_ORDER` puts it after Typography.
- `typeBlock/PropertyField.tsx` (unowned): its checkbox draws label-then-box; boards 5/9/10/14/15 draw box-then-label. Switch it to `blockRows.CheckRow` so L2-B's media/embed bodies and Attributes match.
- L3-C (shared controls / `inspector.css`): row labels are right-aligned (board: left at x16); typography rows are 32 tall (board 28); segmented "on" state and number steppers differ from the board; ColorInput names a bound token "Text Primary" (board "Text / primary" — `colourTokenLabel` in `registry/text.tsx` has the board's format).
- Canvas selection label reads "Label" for a checkbox (Q2 label on the canvas side).
- Board 21 not walkable until L3-A's PagePanel renders the registry with `variant: "page"`.

### L2-B progress (2026-09-28, branch `feat/insp-l2b`)

**Done** — `854f64a9e` (parseEmbedUrl allowlist + embedFrameHTML in all three HTML writers; countdown / accordion runtimes on canvas + `lib/publish-widgets.ts` beside `wireSliders`; Accordion items carry `data-accordion-state`, Progress block gains a native `<progress>`), `671890d40` (SourceRow, media / embed / widget bodies, tests). tsc 0, related vitest green, verify:ds green.

**Attribute contract** — video-embed: `data-embed-url`, `data-embed-ratio`, `data-embed-autoplay`, `data-embed-muted`, `data-embed-controls="false"`; map-embed: `data-embed-url`; lottie: `data-lottie-src`; countdown: `data-countdown-end` (`YYYY-MM-DDTHH:MM`, visitor-local), `data-countdown-done` (`hide` | absent), `data-countdown-message`; accordion: `data-allow-multiple`, item `data-accordion-state` (`open` | `closed`); progress: `value` / `max` on the descendant `<progress>`, `hidden` on the `.pb-circle` / `.pb-label` label.

**For the lead** — (1) `packages/dashboard/next.config.mjs` frame-src allows only youtube-nocookie + player.vimeo: add `https://www.google.com https://lottie.host` or Map / Lottie frames are blocked on the canvas. (2) ExportEngine's publish writer drops an element's `class` ATTRIBUTE (Accordion, Modal, Stack, Switch, Table, Tabs, ProductGrid store classes there) — pre-existing, not fixed here; the accordion runtime finds its parts structurally. (3) Board 13 draws no Layout section; `accordion` is `container({typeBlock})` in capabilities (W1). (4) Row labels are right-aligned in a 95px column (shared `.bdi-row-ctrl`), boards draw 108px left-aligned; long accordion item labels wrap. (5) Fixture carries no L2-B attributes; the live walk set them through the Inspector.

### L3-C progress (2026-09-28, branch `feat/insp-l3c`)

**Done** — `73edf650f` (shared row look, InputWithUnit validation + stepper + unit dropdown, radiogroup, names with units, Tabs `panelId`, read-only not disabled, Mixed, "+" rows without chevron, SpacingBox fit + dot, bound colour = one control, "None" placeholder), `94b25d678` (24px targets, one focus ring, locked 45% / conflict full, stray row inputs framed, CheckRow inset). Live (port 3143, site "Inspector v4 fixture · L3-C"): every `.bdi-row-ctrl` on boards 1/16/26/27 measures row x12 h28 (segmented h32), label x12 w108 left ink-muted 12px, control x128 w160 h24 gray-50 on --bk-border r4; board 34 flow (Heading Width "24.." + Enter) → red edge, aria-invalid, describedby → band "Enter a valid number. Choose the unit separately." (error-tint, 11px error-text, full width, polite); board 23 frames 0.45 / labels 1; board 29 all 1. tsc 0, inspector vitest 121 files / 1040 tests green, verify:ds green, e2e target-size 10/10.

**Decisions the plan did not cover**
- Board 34's line is "Enter a valid number. Choose the unit separately." (the spec/plan quote "Use a number or a unit like 24px, 2rem, auto." is the node NAME, not its text). Built as the board. Typed units (2rem, 50%, auto) are still read (DD-19).
- The error line sits in the SECTION's band under its last row (board 34 draws it after Height, not under Width). Each open Section hosts that band as its polite live region — one per section, not one in ProInspector (ProInspector is not L3-C's).
- Board 23 dims every locked control to 45% (`opacity-45` on each control in the board's code); board 29 dims nothing. Built per board — the plan's "not dimmed" holds for the conflict only. Drawn by ONE rule keyed on `Section[data-readonly=locked]`, so other lanes' controls follow.
- Plain numbers still write as typed (live on canvas); anything else is read on Enter / blur.
- The stepper halves are an aria-hidden pointer shortcut for ↑/↓ (the field is the control). The hover "Reset" × in number fields is gone (the board has none; emptying the field clears — P-11d).
- Accessible names: "Font size in pixels" via aria-labelledby (visible label + hidden unit words), so `getByLabelText("Font size")` still finds the field.
- `colourTokenLabel` now also lives in `ColorInput.tsx` (exported); `registry/text.tsx`'s copy should import it.

**For the lead / other lanes**
- ProInspector: `<Tabs panelId="inspector-tabpanel">` + tabpanel `id="inspector-tabpanel"` `aria-labelledby={\`inspector-tabpanel-tab-${activeTab}\`}` (replacing its aria-label).
- `load-inspector-v4-state.mjs` board 34 selects the IMAGE and looks for `inspector-field-width`; board 34 is the Heading, and Size's number sits in `[data-testid="inspector-size-width"] .bdi-fld`.
- L2-C `FlexControls.tsx`: align cells 32 × 28 gap 4 (board 16) — today 24 × 24 gap 3; drop the rows' own `tw:px-3` (the section body gives 12; the align row wants 16 = `tw:px-1`). `SizeSection.tsx`: the bound-token chain chip (`tw:right-11`) now covers the unit dropdown — move it left of the stepper (`right: 76px`) or into the label. `GridControls.tsx`: Columns is a bare TextInput (radius 6, no stepper) — use InputWithUnit / a number field.
- L2-A `EditTextRow.tsx` / `FontPicker.tsx`: refuse in the handler instead of `disabled` (CSS keeps them legible meanwhile); `registry/text.tsx`: import `colourTokenLabel` from `shared/controls/ColorInput`.
- L2-D2 `ComponentRow.tsx`: now fits the column (the body inset was the overflow); it can use `SelectRow placeholder={null}` for Variant. L2-B `bodyRows.tsx` `ChoiceRow` can likewise become `SelectRow placeholder={null}`.
- W1 `Breadcrumb` crumbs (16 tall) and ContextRow "Reset" (16 tall) are under 24.
- L3-B edited `ColorInput.tsx` / `DSBindingChip.tsx` on their branch: both files are substantially rewritten here — expect a conflict; keep this lane's structure (swatch button · name · chevron, unlink on hover) and re-apply their popover props.

### L3-B progress (2026-09-28, branch `feat/insp-l3b`)

**Done** — `291434fa7` (ApplyStyleDialog board 31: Copies / Keeps / Skipped = locked + in-instance, Brand hint on text types, singular for one, 480 width, one transaction, "Applied to N H3 headings · Undo"), `d286dffbb` (ColorFillPopover board 33: "Brand colours" rows swatch · name · hex · Use, "Add colours in Brand" → Brand on Colours, selection given back on Back to canvas; ✎ edit-token + Pro search kept; RECENT / CUSTOM picker / Detach dropped; swatch checkerboard root cause = flowbite `px-5` on the 18px swatch → 0px fill, fixed with `tw:p-0` in ColorInput; DSBindingChip shrinks to ≤ 50% and ellipsises), `c90c94be3` (Text inside maps a rendered colour to its Brand token name). Live on port 3142, site "Inspector v4 fixture · L3-B" (`cmul1a8280002odrx0g2mfsj2`): boards 31, 33 walked; 30, 32 re-verified unchanged; 4, 17, 27 re-checked for the swatch / summary / chip.

**For the lead**
- `engine/commands/stylePeers.ts` (W1): board 31 says Keeps "layout", but `applyStyleToPeers` copies the WHOLE style map (width, margin, padding, position included). Filter the copied keys to typography / fill / border / effects so the dialog's copy is true (or change the copy).
- Cross-lane edits made (minimal): `shared/controls/ColorInput.tsx` (L3-C: `tw:p-0` on the swatch; popover props), `sections/DSBindingChip.tsx` (L3-C: shrink + ellipsis), `sections/registry/text.tsx` (L2-A: token name in the summary).
- L3-C: board 27 draws ONE control "■ Brand / primary ▾" — today the field (name squeezed to ~0) AND the green chip both carry the binding. Also the empty ColorInput placeholder "000000" is on the MUST-NOT list (Border › Color, board 32 walk).
- L2-C: the Size token popover (`SizeSection.tsx`, TokenPickerPopover) opens `bottom-end` inside the column, not `beside` — can clip in the column's scroll box (P-4).
- Dialog frame is chrome-ui Modal (24 padding, 32 buttons, dark toast); the board draws 16 / 28 / light toast — chrome-ui, not changed.

### L3-A progress (2026-09-28, branch `feat/insp-l3a`)

**Done** — `1cda1f78f` + `66ef25809` (a paragraph reads "Text": shared label map and the canvas selection tag's own map), `d975b7b37` (handleBatchStyleChange writes the whole multi-selection, one transaction — it wrote the primary only), `e178e479b` (Mixed compares what each element SHOWS: type defaults + breakpoint / :state layers, `shownStylesAt`), `f6cd801d9` (MultiSelectBar board 22, PagePanel board 21; MultiSelectToolbar, BatchStylePanel, useBatchStyleHandler, InspectorEmptyState deleted; copy.json line → missing, drift floor 4), `0295e23a9` (reverts `09b153382`, see below). Live (port 3141, site "Inspector v4 fixture · L3-A" `cmul3b27s0008gn3bgoqzng4g`): 3 H3s, padding-top 31 via SpacingBox lands on all 3, one `history.undo()` clears all 3; Page panel on empty click and on page-root select, no tabs; SEO & social opens Page settings on SEO, Esc → the Page panel is still there.

**Not done / needs another owner**
- "Mixed" is NOT drawn by InputWithUnit / SelectRow / ColorInput (L3-C, `shared/controls`): they show the primary's value (live: Font size "24" with the heading sizes differing). Wanted: when `field.mixed`, value "" + placeholder "Mixed" in the muted ink, `aria-label` "<label>, Mixed values" (SpacingBox already does this). `mixedKeys` is correct now.
- `shared/MixedValueBadge.tsx` not deleted: `MixedValueIndicator` (L3-C) and `layout/PositionControls` / `OverflowVisibilityControls` still render it. Delete with the control change above.
- Page panel section bodies (their lanes): Text colour shows the value-shaped "000000" and Font "Select font…" on a page with none set (board: "Inter", "Text / primary" — the rendered value); Fill shows "transparent" + More settings (2) on the page (board: Background only); Max width placeholder "0".
- Header (W1 `InspectorHeader`): multi breadcrumb repeats "3 selected · Headings" as its last crumb and draws a type icon (board 22: path "Home › Hero", no icon). PagePanel carries its own small header (page name, ✦ AI, ⋯ Page settings…, ✕) — fold into an InspectorHeader `page` variant if wanted.
- CMS "record N of M": the Wave 2 "2 of 3" was the store's order, which is also the CMS Records table's row order (useContentPanel, unsorted). A creation-order fix read "3 of 3" live here (the loader made the records newest-first; ids and createdAt disagree), so it was reverted: on this site the preview reads "record 1 of 3". A stable record order is a CMS decision.
- Fixture: the Menu collection loaded with `fields: []` again on this site, so CMS binding's Field reads "No fields fit here" (loader).

### L3-D progress (2026-09-28, branch `feat/insp-l3d`)

**Done** — `3fdc10457` (board 36 "Show inspector ⌘\" on the canvas, replaces the hide toast; CMS workspace "‹ Back to canvas" restores drawer tab + open state + selection; P-5 and CMS share `restoreSelection`), `2475ef882` (Edit master › carries its instance; master back row + Esc = "Back to instance", re-selects it), `2fb98a4be` (AI column = board 35 for one element, nothing asked; other AI states keep the 4418:* layout, prompt field never remounted). tsc 0, related vitest green (shell, ai, component-library, cms, inspector), verify:ds green.

**Live (port 3144, site "Inspector v4 fixture · L3-D")** — board 36: button 1232,112 188×28, 13/500 gray-700, 1px border, r6, 20 from the canvas's right; board's top is 108 because its page-tab bar is 4px shorter (shell, not L3-D). ⌘\ toggles, the button shows the Inspector. Board 35: every part on the board's 12 grid (back 72, scope 112, box 140×144, suggestions 296/336/376, note 416). Doors walked (element · tab · scroll before → after): AI (heading · Style · 70 → same), Brand token chip (heading · Style · 80 → same, via Brand's own Back to canvas), Assets pick mode (image · Style · 60 → same, via Cancel), Edit master (banner · Style · 80 → same after selecting another element meanwhile), Open record (CMS heading · Behaviour → same), Open collection (collection list · Behaviour → same).

**Not done / for the lead**
- Scope reads "Heading text" (useAIScope's `scopeLabel` noun, pinned by the 4418:* AI boards); board 35 draws "Heading". Owner call; not changed.
- Board 35 supersedes `170:17 AI · scoped` for the element-idle state (no AI title row, no ✕): the `ai-scoped` recipe's `ai-header` target will not render there — W4 should retire/re-point it.
- Open record lands on the record sheet, which covers the workspace header: the way back is ✕ then "‹ Back to canvas" (two steps). One-step needs RecordSheet (not L3-D) to carry the back action.
- Escape in the Assets pick mode deselects the canvas element instead of cancelling the pick (Cancel works).
- Settings/SEO door not walkable here: its button is L3-A's PagePanel; the mechanism is P-5's (walked through Brand).
- Out-of-list edits: `ComponentRow.tsx` (+test) passes the instance id (1 line); `ComponentsTab.tsx` passes `onBackToInstance`; `ai/Composer.tsx` gains `variant` + `placeholder`. `events.ts` doc for `UI_COMPONENTS_OPEN_MASTER` should now read `{ componentId, instanceId? }`.

### W3 integration (2026-09-28, lead, `feat/inspector-v4`)

**Merged** L3-C `7f483ac27`, L3-B `7a2b1d618` (ColorInput / DSBindingChip: L3-C's structure kept, L3-B's popover props + swatch `tw:p-0` re-applied), L3-A `cbc42dad2`, L3-D `4a4edb46b`. tsc 0 and inspector/canvas/engine/sidebar vitest green after each.

**Lead items** — Custom colour back in ColorFillPopover (closed section under board 33's content, one write = one Undo) `7a9031636`; applyStyleToPeers copies typography/fill/border/effects only `72642c6e2`; Mixed drawn by the shared controls, MixedValueBadge deleted `b189488d1`; multi header "Home › Hero", no icon `e72292bcb`; tabpanel `aria-labelledby` `e05688238`; Page panel rendered font/colour, one Background row, empty Max width `eb5e3383f`; L2-C leftovers (align cells 32×28 gap 4, Size chip at right 76 + popover beside, Columns number field) `40faba5b4`; L2-A leftovers (read-only refused in handlers, one colourTokenLabel) `16dbe0ca3`; SelectRow placeholder={null} for Variant + widget choices, ChoiceRow deleted `ef9188cf7`; "Scope: Heading" + ai-scoped recipe retired (floor 205→204) `1fbeeb546`; Esc in pick mode cancels the pick `24845b4b8`; Open record one-step back `4803a3fec`; one element-type label map, events doc, board 34 state `cf0e5cdae`; 24px crumbs + Reset/Revert (SpacingBox numbers exempt, reason at AXIS_INPUT) `6a33b56d5`; CMS sync race (root cause of the fields-less Menu) `7b094e052`. Walk fixes: selection tag reads "Heading" once `402466211`; one override dot on Size rows `441eb6a00`.

**Fixture loader** — Menu loaded with `fields: []` because SyncRetryQueue ran the collection's create and its field update concurrently: the second create died on the (siteId, slug) unique key and sat in a queue that replays only on `online`. Fixed in the queue (one write per row in flight, in order; records wait for their collection). Fresh site "Inspector v4 fixture · W3 integration" `cmulbo956000gwxzyb8vpxs11` (port 3150): board 24's Field lists `name · Text`.

**Left for the owner** — "More settings" rows under Typography / Size / Fill / Border (boards draw none); Page panel Fill shows the root's own `transparent` (board "Page / background" is a token the seed does not have); a rendered #334155 reads "Text" (the site CSS uses `color-text`; the board's "Text / primary" is a second token with the same value); Brand-token names in fixture data ("Text / primary", "Brand / primary") vs the seed ("Text", "Primary").

### W4 — conformance + Phase 6 validation (2026-10-02, branch `feat/insp-w4` off main `b21bdabfe`)

**Done** — `8c1419931` (Progress Value/Maximum + Collection Show items = number fields, boards 12/20), `335a3867f` ("Mixed" upright, board 22), `12e956265` (spacing box keeps a side's unit — a video embed's `padding-bottom: 56.25%` stepped up had become `57.25px`), `f6ad65d7f` (✦ AI chip 40 wide on every board, picked-state chip `--bk-accent-subtle` board 27, status line 16px inset boards 23/29), `f35dee226` (`measure.mjs --storage-state / --eval`: dashboard recipes are measurable; `<site>` refused), `098ad42dc` (36 specs extracted from the W0 cache, spec joins on all 36 recipes, baseline). `ai-scoped` retirement verified, not redone (recipe gone, floor 204 = 204 recipes; no `--update-floor`).

**How it was checked** — dev server port 3160 from this worktree, fixture site "Inspector v4 fixture · W4" `cmuqofnnk0002x4w7mz2jgcwp` (load read-back complete). Local DB lacks the staged `20261004100000_cms_tombstones_cms_edited_at` migration (not deployed, per rule), so the worktree's Prisma client was generated from the pre-stage schema (`57bd8a743^`) — no DB change. Every board: state snippet → 1440×900 screenshot → side by side with `raw-figma/inspector-v4/NN.png` by eye; then `measure.mjs` + `diff.mjs`: **36/36 PASS, 1,659 properties compared, 0 fail**; box-model-only refusals carry a written reason in each recipe. Behaviour re-run live by W4: Heading H3→H2 writes the tag, one Undo restores; ⌘\ hides and shows; a locked heading refuses a Level write (`data-readonly=locked`); Apply to all → "Apply to 3" → toast "Applied to 3 H3 headings · Undo"; multi-select padding-top 31 lands on all 3 H3s, one Undo clears all 3; spacing % ↑ → 57.25%, Undo → 56.25%.

**Control counts (DD budget)** — counted in the live Style tab body, one per editable property (a segmented group = 1, each SpacingBox side = 1, "+" rows = 1; unit dropdowns, section toggles and More settings excluded): **Heading 25 / ≤ 25** (raw interactive elements in the tab body: 43); **Input 29 / ≤ 30** with the fixture's input carrying a fill and border (Fill and Border open — on the board they are "+" rows, which would make it ~24; raw: 42).

#### Board table (W4 walk)

| # | Board | Verdict | Differences left |
|---|---|---|---|
| 1 | Heading · S | match | — |
| 2 | Heading · B | match | — |
| 3 | Heading · E | match | — |
| 4 | Text · S | match (shape) | Align shows no active option when unset (sample has Center); text icon is the list glyph |
| 5 | Button · S | match | closed Text inside per OQ-1(a) |
| 6 | Button · B | match | — |
| 7 | Link · B | match | — |
| 8 | Image · S | match (shape) | file size/dimensions not reachable (remote URL); Fit unset shows no active option |
| 9 | Video embed · S | match | — (spacing % fix) |
| 10 | Audio · S | match | duration/size not reachable |
| 11 | Countdown · S | match | — |
| 12 | Progress · S | drift-fixed | — |
| 13 | Accordion · S | match | long item labels clip without ellipsis |
| 14 | Input · S | match | — |
| 15 | Checkbox · S | match | — |
| 16 | Flex · S | match | — |
| 17 | Container (grid) · S | match | Position row has an info icon |
| 18 | Section · B | match | — |
| 19 | Form · B | match | extra "Spam protection" row (code contract) |
| 20 | Collection list · B | drift-fixed | — |
| 21 | Page panel | match | Background "transparent" (owner question) |
| 22 | Multi-select | drift-fixed | — |
| 23 | Locked | drift-fixed | status mark row ~18px higher (inside the header padding) |
| 24 | CMS-bound · B | **drift-open** | header status chip 16px higher than the board's separate row |
| 25 | CMS missing · B | **drift-open** | same as 24 |
| 26 | Component instance · S | **drift-open** | status row ~20px higher; Layout + Text inside rendered for the container (board draws neither) |
| 27 | Button :hover · S | drift-fixed | token name "Primary" (owner question) |
| 28 | Heading on Tablet · S | match | dot also on the Width row (boards disagree: 26/27 per field, 28 per header); bp chip has no chevron |
| 29 | Save conflict | drift-fixed | ConflictModal opens first; board state after Escape |
| 30 | ⋯ menu | **drift-open** | menu 240 wide inside the column; board 320 over the canvas — widening clips at the column edge (popover not portaled) |
| 31 | Apply-to-all dialog | match | Skipped row absent (no locked peer in fixture); Modal frame 24 padding |
| 32 | State menu | match | — |
| 33 | Colour / token popover | match | — |
| 34 | Field error | match | — |
| 35 | AI column | match | — |
| 36 | Inspector hidden | match | button 4px lower (shell) |

Shared, every element board: header 68 vs 72 and context row 32 vs 28 (24px targets) — sections start at the same y; "More settings" rows (owner). Walked: 36 of 36.

#### Phase 6 result table

IMPLEMENTED = code on main; FUNCTIONALLY VERIFIED = unit/RTL tests green (§4.1); RUNTIME VERIFIED = seen working in the running app (W4 unless a lane is named); NOT VERIFIED = not observed.

| Item | Status | Evidence |
|---|---|---|
| Tabs Style · Behaviour · Effects, one order per tab, capabilities (DD-1/4/15) | RUNTIME VERIFIED | W4 walk boards 1–20; `sectionOrder`/`elementCapabilities` tests |
| Open / summary / "+" rule (DD-11) | RUNTIME VERIFIED | boards 1, 3, 17 (summaries, "+" rows) |
| DD-20 tab reset on type change | FUNCTIONALLY VERIFIED | ProInspector tests; not re-walked by W4 |
| Header: breadcrumb, icon + name, ✦ AI, ⋯, ✕ | RUNTIME VERIFIED | all boards; ancestor-crumb select not re-run by W4 (W1 test) |
| Status marks (component / CMS / locked) | RUNTIME VERIFIED (position drift-open) | boards 23–26 |
| Context row: state chip + menu, breakpoint chip, Reset / Revert | RUNTIME VERIFIED | boards 27, 28, 32; Reset/Revert click W1/L2-D2 tests, not re-clicked by W4 |
| Override dots (breakpoint / :hover / master) + notes | RUNTIME VERIFIED | boards 26, 27, 28; per-field reset menu FUNCTIONALLY VERIFIED only |
| Read-only: locked | RUNTIME VERIFIED | board 23 + refused Level write |
| Read-only: save conflict, Resolve | RUNTIME VERIFIED | board 29 via the real save path; Resolve → ConflictModal by L2-D2 live; Reload/Overwrite clearing the line NOT VERIFIED by W4 |
| Element-action registry + ⋯ (board 30), ⌥⌘C/⌥⌘V, ⌘D, ⌫ | RUNTIME VERIFIED (menu rows) | board 30; shortcuts FUNCTIONALLY VERIFIED (`styleCommands`, `elementActions` tests), not pressed live by W4 |
| ⌘\ toggle + Show inspector (board 36) | RUNTIME VERIFIED | W4 live toggle |
| Apply style to all (DD-6b, board 31) | RUNTIME VERIFIED | W4: Apply to 3 + toast; one-Undo revert L3-B live |
| Type blocks: heading, text, button, input, checkbox, image, video-embed, audio, countdown, progress, accordion, flex, grid container | RUNTIME VERIFIED | boards 1, 4, 5, 8–17; Heading Level write + Undo by W4 |
| Q5 runtimes (countdown, accordion, embed iframe) on canvas + publish | FUNCTIONALLY VERIFIED | L2-B tests + canvas walk; published output NOT VERIFIED (never publish on the QA workspace) |
| Behaviour: Link (Rel, hint), CMS binding, missing source, Collection list, Form, Visibility, Interactions, CSS classes, Attributes | RUNTIME VERIFIED (render) | boards 2, 6, 7, 18–20, 24, 25; writes FUNCTIONALLY VERIFIED |
| Effects sections | RUNTIME VERIFIED (empty state) | board 3; an opened, valued Effects section NOT walked |
| Multi-select (DD-12): same panel, bar, Mixed, one Undo | RUNTIME VERIFIED | board 22 + W4 padding-top ×3 / one Undo |
| Page panel (DD-13) | RUNTIME VERIFIED | board 21; SEO & social return by L3-A live |
| Validation (board 34), a11y names/radiogroup/tabpanel | RUNTIME VERIFIED (board 34) | a11y FUNCTIONALLY VERIFIED (L3-C tests, e2e target-size by L3-C); no screen-reader pass |
| Colour / token popover (board 33) | RUNTIME VERIFIED | board 33 |
| AI column (board 35) + §13 escalation doors | RUNTIME VERIFIED (board 35) | doors walked by L3-D; NOT re-walked by W4 |
| Control budgets | RUNTIME VERIFIED | Heading 25 ≤ 25, Input 29 ≤ 30 |

**Types with no board — NOT board-verified** (built by analogy, OQ-3): link · Style, native video, svg/icon, map-embed, lottie, textarea, select, radio, switch, label, grid/columns type, stack, tabs, list-item, slider, table, card, navbar, cta, spacer, divider, gallery.

**NOT verified by W4** — published output of any kind (no Publish on the QA workspace); undo of Apply-to-all and Resolve/Reload/Overwrite paths (lane evidence only); keyboard shortcuts ⌥⌘C/⌥⌘V/⌘D/⌫ pressed live; Map / Lottie frames on the canvas (CSP); mobile breakpoint states; Effects sections with values; the 22 no-board types above; screen-reader output.

**Open — owner** (not decided here): "More settings" rows under Typography / Size / Flex / Fill / Border; Page panel Fill `transparent` vs "Page / background"; token names "Text / primary" / "Brand / primary" vs the seed's "Text" / "Primary"; CSP `frame-src` for Maps / Lottie (`packages/dashboard/next.config.mjs`); ExportEngine dropping the `class` attribute.

**Recorded, not fixed** — header status-mark row placement (boards 23–26; boards disagree on its padding); ⋯ menu width 320 needs the popover out of the column's clip (portal); Layout / Text inside on a component-instance container (board 26); per-field vs per-header override dots (boards 26/27 vs 28); unset Align / Fit show no active segment; accordion item labels clip without ellipsis; text type icon. Harness note: the agentation dev toolbar (bottom-right) overlaps the column in dev screenshots — removed in the walk script, it is not product.
