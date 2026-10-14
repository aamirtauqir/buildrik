# 02 — Inspector, responsive and styling model (audit areas C, D)

Repo: `main @ df60cf9ec`. Paths are relative to `packages/editor/src/` unless they start with `packages/` or `server/`. This is a read-only code audit. DESIGN is not assessed (owner instruction). LIVE results are not claimed. Every runtime question is in §10.

Evidence levels: **CODE**, **REACH**, **LIVE** (not done, see §10), **DESIGN** (not assessed), **PLANNED**.

---

## 0. Headline findings (read first)

1. **The inspector has no resolved-value or origin model.** A displayed value is assembled in `editor/inspector/hooks/useStyleHandlers.ts:168-191` from three layers:
   - the type default table (`shared/constants/defaultStyles.ts`);
   - a computed sample taken from the canvas node, only on **desktop + Base**, only for keys the default table names, and never for colours (`useStyleHandlers.ts:64-80, 187-190`);
   - the element's own `base + current-breakpoint` styles (`engine/commands/commandOperations.ts:251-259`).

   Class rules, global custom CSS, inherited values, and the **tablet layer when on mobile** are never shown as values or as sources. This is the root cause of UX-10, UX-25, and part of IA-10 (CODE).
2. **Preview renders a different cascade from the canvas and from publish.** `Composer.exportHTML` (`engine/Composer.ts:930-1003`) writes base styles **inline** (`shared/utils/html/generation.ts:111-118`) and breakpoint rules as ordinary `@media` rules without `!important` (`engine/styles/StyleEngine.ts:471-516, 540-553`). Inline styles beat those rules, so any breakpoint override of a property set at base is invisible in Preview. Publish emits base styles as class rules (`engine/export/ExportEngine.ts:556-597`) and is not affected. This is the root cause of UX-09 (CODE). The same mechanism also hides `:hover`/`:focus` styles in Preview. In addition, Preview lacks per-device hide rules and global custom CSS (§9 D-3, D-4).
3. **Duplicate, paste, component-instance insertion and page duplicate all drop responsive and `:state` styles.** These live only as StyleEngine rules keyed by element id. `cloneElementData` (`engine/elements/ElementManager.ts:365-372`) mints new ids and never copies the rules (§9 D-1, CODE; live check §10 #9).
4. **Classes are labels only.** Nothing in the editor can author a class rule. `getGlobalClasses()` does not exist, so the class suggestion list is always empty (`editor/inspector/sections/CSSClassesSection.tsx:111-114`; the engine's own comment admits this at `editor/design-system/ui/sections/ClassesSection.tsx:18-20`). `GlobalStyleManager`, `StyleEngine.getClassStyles`, `computeStyles` and `getEffectiveStyles` have **zero production callers**. Compared with Webflow this is the largest structural gap.
5. **The suspected typo is real.** `engine/commands/stylePeers.ts:79` builds the selector as `[data-buildrik-id="…"]` (missing **c**). Confirmed with `od -c`. "Apply style to all … on this page" therefore silently does nothing while State ≠ Base (§9 D-2).
6. **CI-01 is still true** in code @df60cf9ec. `inspector/components/MultiSelectBar.tsx:39-58` calls `engine/canvas/AlignmentHandler.ts`, which reads base `getStyles()`, defaults missing width/height to 100 (`:52-56`), and writes `el.setStyle` directly (`:216-226`). There is no lock gate, no breakpoint awareness, and no save-conflict gate.

---

## 1. Module map

| Module | Purpose | Entry points | Actions | Dependencies | Evidence |
|---|---|---|---|---|---|
| **ProInspector** (`editor/inspector/ProInspector.tsx`) | The right-column inspector. It contains: header, status marks, status line, multi-select bar, 3 tabs, context row, and the tab body | Mounted in `editor/shell/StudioPanels.tsx:990`. VIEWER role gets `ViewerRoleNotice` instead (`StudioPanels.tsx:951`). When nothing (or the page root) is selected it shows `PagePanel` (`ProInspector.tsx:107-108, 316`). While the project loads it shows `InspectorLoading` (`:315`). A theme-toggle element gets `ThemeToggleInspector` (`:319-325`). An AI agent run replaces the controls (`:349-356`) | Tab switch (resets to Style when the type changes, `:174-179`); pseudo state; breakpoint (prop `device` → `BreakpointId`, `:102-104`; `wide` → desktop) | `useStyleHandlers`, `useFieldOverrides`, `useElementLocked`, `useSaveConflict`, `SECTION_REGISTRY`, `cssContext` | CODE + REACH |
| **Tab content / section registry** (`tabs/InspectorTabContent.tsx`, `sections/registry/*`, `config/sectionOrder.ts`) | Decides which sections render (capability ∩ `shouldRender`) and in what order | One fixed order per tab (`sectionOrder.ts:15-48`). Style: component, type, layout, typography, size, spacing, fill, border, text-inside. Behaviour: form-fields, form-settings, slides, slider-settings, collection, link, cms-binding, visibility, interactions, css-classes, attributes. Effects: opacity, shadow, filters, transform-motion, effects-advanced | Display mode per section: open / summary / "+" row (`InspectorTabContent.tsx:137-140`). ⌥-click toggles all sections (`:142`) | `shared/constants/elementCapabilities.ts` | CODE + REACH |
| **Element capabilities** (`shared/constants/elementCapabilities.ts`) | One row per `ElementType` (TS-exhaustive). Fields: typeBlock, layout, typography (open/inside/none), link, cmsBindable, behaviourSections, isStructuralChild | Read by `visibleSectionIds` (`InspectorTabContent.tsx:75-84`); a multi-selection uses the intersection | — | — | CODE |
| **Style write path** (`hooks/useStyleHandlers.ts`) | Every style write made from the inspector | `handleStyleChange` (300 ms debounce, `:215-310`), `handleBatchStyleChange` (`:313-394`), `runDiscrete` (`:117-126`) | Base on desktop, breakpoint rule otherwise (`setStyleAt`). `:state` rule via `styles.setRule`. `--hide-*` always written to base (`:256`) | `commandOperations.ts` lock gate, `StyleEngine` | CODE |
| **Override model** (`hooks/useFieldOverrides.ts`, `shared/controls/OverrideDot.tsx`, `components/ContextRow.tsx`) | Per-property dots for breakpoint, `:state` and master overrides; section header dot and note; context-row chips "Mobile · N overrides", "Mobile · Revert" and ":hover · Reset" | Context row on Style/Effects only (`ProInspector.tsx:327, 369-380`) | Reset one override (`useFieldOverrides.ts:179-186`); Revert breakpoint (`:188-191`); reset state (`:192`) | `StyleEngine.getBreakpointStyle/getRule`, `ComponentManager.resetInstanceOverride` | CODE + REACH |
| **StyleEngine** (`engine/styles/StyleEngine.ts`) | The rule store (selector + optional media query, keyed `selector\|mq`). Writes the live `<style id="aquibra-styles">`. Generates CSS for export | Used by Composer (`engine/Composer.ts:296`) | `setRule` (merge or replace, `:76-111`); `setBreakpointStyle` (also mirrors into `element.breakpointStyles`, `:195-219, 330-349`); `removeBreakpointStyleProperty` (`:266-302`); `toCSS`/`generateCSS` (`:471-516`); `generateResponsiveCSS` (`:354-418`); editor-only `editorStatePreviewCSS` (`:669-676`) and `editorDevicePreviewCSS` (`:689-711`) | `shared/constants/breakpoints.ts` | CODE |
| **Breakpoints** (`shared/constants/breakpoints.ts`) | Desktop-first. Desktop is the base. Tablet = `(max-width: 1023px)`, Mobile = `(max-width: 767px)` (`:52-59`). Preview sizes: wide 1920, desktop 100%, tablet 768, mobile 375 (`:103-108`) | Device switcher; command palette `device-desktop/tablet/mobile/wide` (`engine/commands/defaultCommands.ts:619-643`); shell sync on `BREAKPOINT_CHANGED` (`editor/shell/hooks/useComposerInit.ts:584`) | — | — | CODE |
| **Classes** (`sections/CSSClassesSection.tsx`; Brand › Classes `editor/design-system/ui/sections/ClassesSection.tsx`) | Add and remove class names on an element. Brand lists a usage tally | Behaviour › CSS classes | Add (multi-paste) and remove, lock-gated (`CSSClassesSection.tsx:117-130`) | **No class-rule authoring anywhere.** `GlobalStyleManager` is dead | CODE |
| **Apply style to peers** (`engine/commands/stylePeers.ts`, `components/ApplyStyleDialog.tsx`) | ⋯ "Apply style to all {kind} on this page". Copies typography, fill, border and effects at one breakpoint and state | `shared/elementActions.ts` `apply-style-to-page` → `UI_APPLY_STYLE_REQUESTED` → dialog (`ProInspector.tsx:128-137, 332-338`) | One transaction plus an Undo toast | `writableElements` | CODE (typo defect D-2) |
| **Element actions** (`editor/shared/elementActions.ts`, `engine/commands/defaultCommands.ts:188-226`) | Copy style ⌘⌥C, Paste style ⌘⌥V, Reset style, Lock/Unlock | Inspector ⋯, canvas context menu, keyboard | Copy reads **base only** (`defaultCommands.ts:196`). Paste writes **base only** (`commandOperations.ts` `pasteStyles`). Reset clears **base only** (`defaultCommands.ts:225`) | — | CODE |
| **Multi-select bar** (`components/MultiSelectBar.tsx`) | Align, Distribute and Group for 2+ selected elements | Rendered when `targetIds.length > 1` (`ProInspector.tsx:348`) | Align/distribute go through `AlignmentHandler` (bypasses gates, CI-01) | `engine/canvas/AlignmentHandler.ts` | CODE |
| **Preview** (`editor/shell/PreviewOverlay.tsx`, `editor/shell/exportPublishPages.ts:161-165`) | Sandboxed srcdoc frame with a device row | `AquibraStudio.tsx:293, 874` → `renderPreviewHtml` → `sanitizeHTMLForPreview` | Device starts at "desktop" (`PreviewOverlay.tsx:119`). `sandbox="allow-same-origin"` (`:211`) | `Composer.exportHTML` | CODE |
| **Export / publish CSS** (`engine/export/ExportEngine.ts`) | Class-based base CSS, then `generateResponsiveCSS`, then hide rules, then global CSS | Publish (`exportPublishPages`), single-file export | Base CSS `.prefix<id>` (`:556-597`); responsive appended (`:399, 835`); hide media queries (`:153-155`); custom CSS (`:673-678, 1016-1020`) | — | CODE |
| **Global custom CSS** (Settings › Advanced) | Site-wide stylesheet | `editor/sidebar/tabs/settings/screens/AdvancedScreen.tsx:345`; canvas `<style>` (`editor/canvas/Canvas.tsx:781-782`, `hooks/useGlobalCustomCss.ts`) | — | `projectSettings.customCode.globalCss` | CODE |
| **Token binding in inspector** | Colour fields (`shared/controls/ColorInput.tsx`, `shared/ColorFillPopover.tsx`), spacing (`SpacingControls.tsx`), width/height token chain (`sections/SizeSection.tsx`), Text style → `font-size: var(--…)` (`typeBlock/bodies/textBodies.tsx:64-83`) | Field chips (`sections/DSBindingChip.tsx`) jump to Brand | Unbind by typing a value, or Text style → "Custom" | `editor/design-system/state/TokenRegistryContext` | CODE |
| **Lock gate** (`engine/commands/commandOperations.ts:192-236`) | `writableElements` / `canWrite` / `writeElement` refuse locked elements and emit `LOCKED_ELEMENTS_SKIPPED` (toast) | Every inspector write path except those listed in §9 | — | — | CODE |

Shortcuts and ids: `copy-style` ctrl+alt+c, `paste-style` ctrl+alt+v (`defaultCommands.ts:188-217`); `reset-style`, `lock-element`, `unlock-element` (no shortcut); `device-*` palette ids (`:619-643`); ⌘K "Jump to property" (`hooks/usePropertyJump.ts`, via `ProInspector.tsx:304-311`); ⌥-click on a section header toggles all (`InspectorTabContent.tsx:142`); in number fields ↑/↓ steps by 1 and ⇧ by 10, Enter commits, Escape reverts (`shared/controls/InputControls.tsx:276-300`).

---

## 2. Screen / flow inventory

| Surface | File(s) | Notes |
|---|---|---|
| Inspector header (breadcrumb, icon + name, ✦ AI, ⋯, ✕) | `components/InspectorHeader.tsx`, `ElementNameField.tsx`, `InspectorElementMenu.tsx` | The ⋯ menu comes from the `INSPECTOR_MENU` registry |
| Status marks (Component, CMS binding, Locked) | `components/StatusMarks.tsx` | Hidden on multi-select |
| Status line (locked → Unlock; save conflict → Resolve) | `components/StatusLine.tsx` | Read-only reason |
| Multi-select bar | `components/MultiSelectBar.tsx` | Align ×6, Distribute ×2 (needs 3+), Group (same parent) |
| Tabs (Style / Behaviour / Effects) | `ProInspector.tsx:359-368`, `sections/registry/_shared.tsx:46-50` | |
| Context row (State menu: Base, :hover, :focus, :active, :disabled; breakpoint chip; Reset; Revert) | `components/ContextRow.tsx:18-24, 57-138` | Hidden on Behaviour |
| Component row | `sections/ComponentRow.tsx` | Instances only |
| Type block (per typeBlock id) | `sections/typeBlock/*`, `config/typeBlocks.ts` | Heading: Level H1–H6, Text style, Edit text. Text/Link/Label: Text style, Edit text. Button: Edit text, Type, Disabled. Flex/Grid bodies reuse the Layout controls. Media, embed, form and widget bodies |
| Layout (containers only) | `sections/layout/index.tsx`, `DisplayControls`, `FlexControls`, `GridControls`, `GapRow`, `PositionControls`, `OverflowVisibilityControls` | Position, offsets and z-index exist **only here** (`index.tsx:56`) |
| Typography / Text inside | `sections/typography/*`, `registry/text.tsx` | Face: Font, Font size, Line height, Weight, Colour, Align. More settings (9): Transform, Decoration, Letter, Word, Style, White Space, Word Break, Text Indent, Vertical Align |
| Size | `sections/SizeSection.tsx`, `layout/ItemControls.tsx` | Fixed/Fill/Hug, spacing-token chain, min/max in More settings, flex/grid item controls when the parent is flex/grid |
| Spacing | `sections/SpacingSection.tsx`, `shared/controls/SpacingControls.tsx` | Box model plus "Link sides" |
| Fill | `sections/BackgroundSection.tsx`, `shared/ColorFillPopover.tsx` | Colour, gradient (Color 1/2), image URL; More settings: position, size, repeat, attachment, blend |
| Border | `sections/BorderSection.tsx` | Width, style, colour, radius (+ per-corner), outline in More settings |
| Behaviour sections | `FormFieldsSection`, `FormAfterSubmitSection`, `SlidesSection`, `SliderPlaybackSection`, `CollectionListSection`, `LinkSection`, `CmsBindingSection`, `VisibilitySection`, `interactions/*`, `CSSClassesSection`, `attributes/*` | |
| Effects | `effects/OpacitySection`, `ShadowSection` (presets + raw outer/inner), `FiltersSection` (blur, brightness, contrast, grayscale), `TransformMotionSection` (move X/Y, scale, rotate, skew, transition), `EffectsAdvancedSection` (cursor, blend, text-shadow, will-change) | |
| Override dot menu | `shared/controls/OverrideDot.tsx` | "Reset to Desktop", "Reset to Base", "Reset to master" |
| Apply style dialog | `components/ApplyStyleDialog.tsx` | |
| Delete confirm | `components/DeleteConfirmModal.tsx` | |
| Page panel | `components/PagePanel.tsx` | Fill, Size (max width), Typography (font + text colour), Spacing on the page root |
| Loading / error | `components/InspectorLoading.tsx`, `components/InspectorErrorBoundary.tsx` | |
| Preview overlay | `editor/shell/PreviewOverlay.tsx` | Device row, Share preview |
| Reusable controls | `shared/controls/InputControls.tsx` (`InputWithUnit`), `ButtonControls.tsx` (`ButtonGroup`), `ColorInput.tsx`, `SliderControls.tsx`, `Section.tsx`, `MoreSettingsToggle.tsx`, `InspectorFieldContext.tsx`, `FieldDot.tsx`, `MixedValueIndicator.tsx`, `TokenPickerPopover.tsx` | |

---

## 3. Control traces

### 3.1 Generic style field (e.g. Font size, `InputWithUnit property="font-size"`)

1. **UI.** `InputWithUnit` commit on Enter or blur. `parseEntry` accepts a number + unit from the field's list, keywords, or `var(…)` (`InputControls.tsx:203-214`). An unreadable entry turns the field red with an error line and nothing is written (`:261-266`).
2. **State change.** `onChange` → `handleStyleChange` (`useStyleHandlers.ts:215`):
   - blocked on save conflict; `canWrite` lock check (`:217-220`);
   - optimistic local `setStyles` (`:223-230`);
   - 300 ms debounce, then `flush` re-checks the lock on the whole selection with `writableElements` (`:292-295`);
   - one transaction (`:299-304`).
3. **Engine write.** On desktop: `el.setStyle` (base, `ElementData.styles`). On tablet/mobile: `StyleEngine.setBreakpointStyle` → rule `[data-buildrick-id] @media (max-width…)` + mirror into `element.breakpointStyles` (`StyleEngine.ts:195-219`). For a `:state`: `setRule(sel, {..}, {pseudo, mediaQuery})` (`useStyleHandlers.ts:259-279`).
4. **Persistence.** `markDirty` / `PROJECT_CHANGED` → StorageAdapter autosave, 5 s default, storage type "local" (`engine/Composer.ts:688-690`, `engine/storage/StorageAdapter.ts:45-56`). Cloud save goes through `services/BuildrikSyncProvider.ts` → tRPC `sites.saveProject`; the exact triggering is owned by the persistence lane (Not verified here). Undo uses full `exportProject` snapshots, so rules are included (`engine/HistoryManager.ts:386`).
5. **Rendered result.** See the table in 3.4. The canvas updates after the stylesheet RAF flush.

**Breaks:**
- After the write, the displayed value is recomputed from defaults + desktop-only computed + `base ⊕ current bp` (§3.3), so it may not equal the canvas.
- Preview may not show the result (UX-09).

### 3.2 Reset / revert actions

| Action | Code | What it removes | What it leaves |
|---|---|---|---|
| OverrideDot → "Reset to Desktop" (breakpoint kind) | `useFieldOverrides.ts:155-163, 181` → `removeBreakpointStyleProperty` | The property from the **current** breakpoint rule and from `element.breakpointStyles` | On Mobile, a **tablet** value for that property still applies (canvas cascade tablet→mobile, `StyleEngine.ts:695`; published CSS). The label "Reset to Desktop" is wrong in that case |
| Context row "Mobile · Revert" | `useFieldOverrides.ts:188-191` | Every property of the current breakpoint rule | Tablet layer, `:state` rules, base |
| OverrideDot → "Reset to Base" / context row ":hover · Reset" | `useFieldOverrides.ts:166-177, 192` (`replace: true`) | Property or all properties of the `:state` rule **at the current breakpoint only** | Desktop `:hover` rule when on Mobile |
| OverrideDot → "Reset to master" | `ComponentManager.resetInstanceOverride` (`useFieldOverrides.ts:183`) | The instance's style override for that property | — |
| ⋯ / context menu "Reset style" | `defaultCommands.ts:220-225` → `el.setStyles({})` | **Base styles only**, primary selected element only | All breakpoint rules, all `:state` rules, classes, attributes. On Mobile the visible result may not change |
| Empty a field | `parseEntry("") → ""` → `setStyleAt(… "")` → `removeStyle` / `removeBreakpointStyleProperty` | That property at that layer | — |
| Text style → "Custom" | `textBodies.tsx:76-81` | Unbinds `font-size` var → literal resolved size | — |
| Escape in a field | `InputControls.tsx:285-294` | Restores the value captured at focus (written as a new edit) | — |

### 3.3 How the inspector computes the displayed value (effective vs authored)

```
styles_state = { ...getDefaultStyles(type, tagName),                         // shared/constants/defaultStyles.ts:513-522
                 ...(desktop && Base ? readRenderedValues(keys of defaults, skip colours, skip authored) : {}),  // useStyleHandlers.ts:64-80,187-190
                 ...computeEffectiveStyles(el, bp, pseudo) }                  // cssContext.ts:53-70
computeEffectiveStyles = stylesAt(el,bp)  [= base ⊕ getBreakpointStyle(bp) — ONLY that bp]   // commandOperations.ts:251-259
                         ⊕ getRule(`[id]:${pseudo}`, mq(bp))  [ONLY that bp's :state rule]
```

- **authoredStyles** (`ProInspector.tsx:212-216`) is the same `computeEffectiveStyles` without the defaults. It is used only to decide whether a section shows "+" or opens (`registry/index.tsx:87-99`).
- **Mixed detection** uses `defaults ⊕ computeEffectiveStyles` (`shared/detectMixedValues.ts:41-49`).
- **Never included:**
  - class rules (`.cls{}` from imported styles or global CSS);
  - inherited values (`line-height`, `text-align`, `color` from the parent or `.buildrick-canvas`);
  - **the tablet layer when on Mobile**;
  - the desktop `:state` rule when on a smaller breakpoint;
  - computed values off desktop.
- **Text inside summary vs Typography.** The closed "Text inside" summary *does* read computed family, size and colour (`registry/text.tsx:77-91, 124`), while the open Typography section does not read computed colour. Two rules in one panel.

### 3.4 Three CSS paths (canvas vs Preview vs export/publish)

| Layer | Canvas (`StyleEngine.flush` `:652-656` + Canvas.css) | Preview (`renderPreviewHtml` → `Composer.exportHTML`) | Publish / single-file export (`ExportEngine`) |
|---|---|---|---|
| Base element styles | **Inline `style=""`** | **Inline `style=""`** (`generation.ts:111-118`) | **Class rule** `.prefix<id>{}` (`ExportEngine.ts:556-597`; single-file `extractStyles` ~`:520-550`). Inline only when `cssStyle:"inline"` (`:487, 527`) |
| Breakpoint rules | `toCSS()` real `@media` (matches only if the *browser window* is narrow) **plus** `editorDevicePreviewCSS`: the active device's rules re-emitted with **`!important`**, without the media query, cascading tablet→mobile (`:689-711`) | `toCSS()` real `@media`, **no `!important`** (`:540-553`). They lose to inline base. **Media block order = Map insertion order** (`:478-505`), so a mobile block can precede the tablet block | `generateResponsiveCSS`: base, then tablet, then mobile, after the class base (`:354-418`, `ExportEngine.ts:399, 835`). Override wins by source order |
| `:state` rules | `editorStatePreviewCSS` with `!important` (`:669-676`) | Plain rule. **Loses to inline base** for the same property | Plain rule. Out-specifies the class base |
| Per-device hide (`--hide-<bp>`) | `Canvas.css:784-791` keyed on `data-device` (non-cascading) | **None.** The `--hide-*` inline custom property is inert. RESET_CSS has no hide rules (`ExportHelpers.ts:299-307`) | `hideRulesFor` media queries (`ExportEngine.ts:153-155`). Non-cascading tablet range `768–1023` |
| Global custom CSS | `<style>` in canvas (`Canvas.tsx:781-782`). Loses to inline base | **Missing.** `exportHTML` emits faces + RESET + css + tokens only (`Composer.ts:998`) | Emitted last (`ExportEngine.ts:673-678, 1016-1020`) |
| Base typography | `.buildrick-canvas{line-height:1.5}` (`themes/design-system/site-content.css:39`); `:where(.buildrick-canvas h1){font-size:2em}` (`:92-97`) | RESET_CSS `body{line-height:1.5}` | RESET_CSS |

---

## 4. State coverage

| Screen family | empty | loading | hover | focus | selected | disabled | read-only | validation-error | saving / saved / unsaved | failure | conflict | recovery |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Inspector body | Page panel when nothing is selected (`ProInspector.tsx:316`) | `InspectorLoading` (`:315`) | chrome-ui | Focus ring via `--bk-shadow-focus`; Escape surface | Tab selected; ButtonGroup `aria-checked` (`ButtonControls.tsx:84`); **no "inherited" state** | `propertyStates` disabled + reason (`cssContext.ts:143-191`: inline width/height, gaps, flex-item props, offsets) | `readOnly` = locked or conflict (`ProInspector.tsx:238-243`); `data-readonly` | `InputWithUnit` red border + `ErrorLine` (`InputControls.tsx:239-240, 419`); LinkSection validation | **None in inspector** (topbar owns save status) | `InspectorErrorBoundary` | `StatusLine` conflict → Resolve | None in inspector |
| Mixed (multi-select) | — | — | — | Typing clears "Mixed" (`InspectorFieldContext.tsx:76-91`) | — | Multi-bar Distribute disabled < 3, Group disabled across parents | Lock skips members + toast | — | — | — | — | — |
| Context row / State menu | No chip on desktop | — | — | — | Radio selected; dot on states with overrides (`ContextRow.tsx:88-106`) | — | **Reset / Revert not disabled when read-only** (they go through the lock gate, so refused with a toast) | — | — | — | — | — |
| Override dot | — | — | — | 24 px target | — | — | Not gated visually | — | — | — | — | — |
| CSS classes | No chips | — | — | — | — | — | Refused by lock gate (no visual read-only on the field) | **No validation of class names** (`parseClassList` only splits) | — | — | — | — |
| Apply style dialog | Enabled only if peers > 0 (`elementActions.ts:139-141`) | — | — | Dialog focus | — | Count | — | — | Toast + Undo | Silent no-op when 0 written (D-2) | — | Undo |
| Preview overlay | "No content" fallback (`exportPublishPages.ts:162`) | Building is async (`AquibraStudio.tsx:284-294`) | — | — | Device chip | — | — | — | — | CMS resolve failure falls back to raw (`:164`) | — | — |

---

## 5. Ownership rows

The "Who may change" column is the same everywhere unless stated:
- VIEWER cannot open the inspector (`StudioPanels.tsx:951`).
- Every other role can, subject to the element lock (`commandOperations.ts:192-236`) and save conflict (`useStyleHandlers.ts:217`).
- No per-property role differences exist in code.
- Server-side role enforcement on `sites.saveProject` is **Not verified** in this lane.

The "Applied vs saved vs published" column is also the same unless stated:
- **Applied** = in-memory Composer, visible after the RAF flush / 300 ms debounce.
- **Saved** = autosave + `sites.saveProject`.
- **Published** = only on Publish.
- Preview reads the in-memory state, including unsaved edits.

| Property / action | Current editing location(s) | Value owner | Scope | Local / inherited / shared / bound / overridden | Side effects | How source is shown | Reset / unlink / revert semantics | Flags |
|---|---|---|---|---|---|---|---|---|
| font-size | Typography › Font size; Type block › Text style (binds var); AI set-style; Apply-to-all; Paste style | `ElementData.styles` (desktop) / StyleEngine rule (bp, `:state`) | Element | Local; **bound** to a Brand font-size token when `var()`; overridden per bp/state | Token edit in Brand re-renders every bound element (silent global) | Text style select shows the token name. **Both rows declare `property="font-size"`, so the override dot is drawn twice** (`textBodies.tsx:82`, `FontControls.tsx:66`) | Field empty → remove at layer. Text style "Custom" → literal. Dot → current bp only | Two editing surfaces for one property. Fallback literal `"16px"` shown when unset (`FontControls.tsx:63`) is not the rendered value |
| line-height | Typography › Line height | Same as above | Element | Local or **inherited** (canvas root 1.5) | — | No inherited indication. Unset shows the type default (h1 = `1.1`) off desktop, and computed `px` on desktop | Same as above | **UX-10 root cause** (§6) |
| text-align | Typography › Align (L/C/R) | Same | Element | Usually **inherited from the parent** in templates | — | ButtonGroup has no option selected (`ButtonControls.tsx:40`); no inherited marker. `start`/`justify`/`end` are not representable | No "unset" toggle | **UX-25 root cause** |
| color | Typography › Colour; ColorFillPopover; Apply-to-all | Same | Element | Local / bound to a colour token / inherited | Token edit = global | Token chip name (`DSBindingChip`). Computed colour never read (`useStyleHandlers.ts:75`). Unset shows the **type default** (`THEME.textPrimary`) not the rendered colour | — | Text inside summary *does* show the rendered colour (`registry/text.tsx:86-88`); two rules |
| font-family | FontPicker | Same; site font slots via Brand tokens | Element / site | Local or inherited from Brand slot | Brand slot change = global | FontPicker `inheritedValue` only on the Page panel | — | — |
| width / height / min / max | Size; canvas resize handles (`writeCanvasStyles`); icon picker writes width/height to **base** (`attributeWriter.ts:186-188`) | Same | Element | Local; spacing-token chain binding | — | Mode label Fixed/Fill/Hug; token name | — | Icon picker is breakpoint-unaware (base write on Mobile) |
| padding / margin | Spacing box; canvas spacing spots (`writeCanvasStyles`) | Same | Element | Local; spacing tokens | — | Per-side dot | Longhand-first display over shorthand (`SpacingSection.tsx` `sidesOf`). Inline order decides when both exist | Shorthand/longhand precedence ambiguous |
| display / flex / grid / gap | Layout (containers), Type block (Flex/Grid types); Columns gap via type block writes **base** (`attributeWriter.ts:104-106`) | Same | Element | Local | Children's flex-item controls depend on the parent's *authored* display (`cssContext.ts:112-131`), so a class or computed flex parent hides the item controls | — | — | Not editable on text/media types |
| position / top..left / z-index | Layout › Position (**containers only**) | Same | Element | Local | Offsets are raw text inputs, no unit parsing, no field context (`PositionControls.tsx:120-140`) | Mixed indicator only; **no override dot on offsets** | — | **Missing for heading/text/image/button/flex/grid types** (`elementCapabilities.ts`, `box.tsx:49`) |
| overflow / box-sizing / float / clear / visibility | Layout › More settings (containers only) | Same | Element | Local | — | — | — | Missing for non-containers |
| background (colour / gradient / image) | Fill | Same | Element | Local; colour token | `background` shorthand suppresses the default `background-color` (`useStyleHandlers.ts:173`) | Token chip | — | — |
| border / radius / outline | Border | Same | Element | Local | — | — | — | No token binding for radius |
| box-shadow | Effects › Shadow (presets + raw CSS) | Same | Element | Local | — | — | — | One outer + one inner only |
| filter | Effects › Filters | Same | Element | Local | **Editing any slider drops unknown functions** (D-5) | — | — | No backdrop-filter |
| transform / transition | Effects › Transform & motion | Same | Element | Local | **Re-orders and drops unknown transform functions** (D-5) | — | — | No 3D, no origin |
| opacity, cursor, mix-blend, text-shadow, will-change | Effects › Opacity, Advanced | Same | Element | Local | — | Advanced summary uses the authored value or "auto"/"normal" | — | — |
| Per-device visibility (`--hide-<bp>`) | Behaviour › Visibility | Base inline style (always, `useStyleHandlers.ts:256`) | Element | Local | Canvas hides via Canvas.css; publish via media query; **Preview ignores it** (D-4) | "hidden on N" preview text | Tick to clear | Tablet hide does **not** cascade to Mobile, unlike every style override (inconsistent model) |
| :state styles | Context row State menu + any field | StyleEngine rule `[id]:state` (+ mq) | Element × bp × state | Overridden | **No canvas forced-state preview.** A state rule shows only on real hover. Rules are **lost on duplicate** (D-1). Preview loses to inline (D-3) | Dot on state menu; field dot "Overridden on :hover" | Reset to Base removes only this bp's state rule | — |
| Breakpoint override | Device switch + any field | StyleEngine rule (mq) **and** `element.breakpointStyles` mirror | Element × bp | Overridden | Mirror is the ReactExporter's source; rules are the canvas/preview/publish source. Two stores, synced only through `setBreakpointStyle` / `removeBreakpointStyleProperty` | Chip "Mobile · N overrides", section dot + note, field dot, "Mobile · Revert" (**four representations**, UX-14) | Dot/Revert = current bp only; tablet value persists on Mobile | **Inherited tablet values are invisible on Mobile** (stylesAt) |
| Classes | Behaviour › CSS classes | `ElementData.classes` | Element (names); rules = only from imported styles or global CSS | Shared (by name) | None in the editor (no rule authoring) | Chips; Brand › Classes tally | Remove class | Suggestion list is always empty (D-6) |
| Attributes (id, title, tabindex, per-type, data-*) | Behaviour › Attributes | `ElementData.attributes` | Element | Local | — | Closed summary "id: … · N attributes" | Clear field | — |
| Global custom CSS | Settings › Advanced | `projectSettings.customCode.globalCss` | Site | Shared | Silent global effect; loses to inline on canvas but wins over class base in publish | **Not shown in the inspector at all** | — | Canvas ≠ publish ≠ preview (missing) |
| Type defaults | Applied once at block insert (`blocks/blockRegistry.ts:343-347, 389`) | Element styles (copied) | Element | Becomes local | Template/parsed elements never get them, yet the inspector *displays* them | Not distinguishable from authored | — | Misleading display |
| Instance (master) override | Any field on an instance child | ComponentManager override map | Instance | Overridden | — | Dot "Overrides master" + section note | Reset to master per property | Breakpoint/state overrides on instance children: Not verified |
| Copy / Paste style | ⋯, canvas menu, ⌘⌥C/⌘⌥V | `composer.styleClipboard` | Element | — | Copy = **base only**; Paste = **base only** even on Mobile (`commandOperations.ts` `pasteStyles`) | Toast with count | Undo | Breakpoint-blind |
| Apply style to all {kind} | ⋯ → dialog | Peers' styles at bp/state | Page | Copies | One transaction | Dialog lists Copies / Keeps / Skipped | Undo toast | Broken under `:state` (D-2) |
| Lock | ⋯, Layers, StatusLine Unlock | `ElementData.locked` | Element (not descendants) | — | Inspector read-only + toast on attempt | Status mark 🔒 + StatusLine | Unlock | MultiSelectBar bypass (CI-01). AI `applySetStyle` writes `el.setStyle` with no gate in that function (`editor/sidebar/tabs/ai/applySetStyle.ts:132-138`; caller gate Not verified) |

---

## 6. Root-cause candidates for the prior findings (re-checked @df60cf9ec)

| ID | Prior claim | Status | Root cause (CODE) |
|---|---|---|---|
| **UX-09** Mobile font override missing in Preview | Canvas 32 px, preview iframe 52 px | **Confirmed in code** | Preview = `Composer.exportHTML` (`Composer.ts:930-1003`). Base `font-size: 52px` is inline (`generation.ts:111-118`). Mobile override is `@media (max-width:767px){[data-buildrick-id="x"]{font-size:32px}}` without `!important` (`StyleEngine.ts:540-553`), so inline wins. Canvas works only because of the editor-only `!important` re-emit (`StyleEngine.ts:689-711`). Publish uses class base CSS (`ExportEngine.ts:556-597`) and is **not** affected by this mechanism. The secondary preview line-height of 78 px = 52 × 1.5 (inherited RESET `body{line-height:1.5}`). |
| **UX-10** Line height shown 1.1, rendered 1.5 | — | **Confirmed in code** | The heading carries no own `line-height` (templates are not given type defaults, `blockRegistry.ts:389` is block insert only). On Mobile, `readRenderedValues` is skipped (`useStyleHandlers.ts:187-190`), so the field shows `DEFAULT_ELEMENT_STYLES.h1["line-height"] = "1.1"` (`defaultStyles.ts:45`). The canvas inherits `line-height: 1.5` from `.buildrick-canvas` (`site-content.css:39`): 32 × 1.5 = 48 px, matching the measurement. On desktop the same field would instead show computed `"78px"` (a px string in a × field). Contributing: Text style binds only `font-size` (`textBodies.tsx:64-83`; `typeStyleRows` filters `type === "font-size"`, `editor/design-system/ui/sections/TypographySection.tsx:95`), so a type style never sets line-height. |
| **UX-25** Align radio unselected while rendered center | — | **Confirmed in code** | `text-align` is not in `DEFAULT_ELEMENT_STYLES.h1`, so `readRenderedValues` never samples it (it only reads keys the defaults name, `useStyleHandlers.ts:189`). It is usually inherited from the section, and inheritance is never read. `ButtonGroup` picks `findIndex(value)` → −1, so no radio is checked (`ButtonControls.tsx:40, 84`). Computed values `start`/`justify`/`end` have no option either. |
| **UX-14** Override info repeated / mislocated | — | **Confirmed in code** | One mobile font-size override renders five indicators:<br>• context chip "Mobile · 1 override" (`ContextRow.tsx:110-118`)<br>• "Mobile · Revert" line (`:128-135`)<br>• section header dot + section note (`OverrideDot.tsx:113-152` via `InspectorTabContent.tsx:160`)<br>• the field dot<br>• a second field dot on **Text style**, because `TextStyleRow` declares `property="font-size"` (`textBodies.tsx:82`)<br>The dot's "Reset to Desktop" label is also wrong when a tablet value exists. |
| **UX-05** Advanced typography expanded on first select | — | **Partially explained (CODE); trigger needs LIVE** | `useAdvancedSettings.ts:118-162` opens a section's whole "More settings" when **any one** advanced prop has a value other than `""`, `"0"` or `"none"`. For Typography that is 9 props (`registry/text.tsx:26`). A template H1 with any authored `letter-spacing`, `text-transform` or `font-style` would open all 9 rows. Note `"normal"` is *not* excluded, so an authored `font-style: normal` or `white-space: normal` also triggers it. Live check #6. |
| **IA-10** Effective state not reliably communicated | — | **Confirmed in code** | §3.3. No origin model: the class, inherited, token-resolved and tablet-on-mobile layers are absent. Override indicators cover only breakpoint, state and master. |
| **CI-01** Multi-select alignment bypasses lock + breakpoint | — | **Still true** | `MultiSelectBar.tsx:39-58` → `AlignmentHandler.ts:52-56` (base `getStyles`, 100 px fallback) and `:216-226` (`el.setStyle`). No `writableElements`, no `setStyleAt`, no conflict check. Buttons are disabled only for `!handler \|\| n < 2`. It is also not wrapped in `runDiscrete`, so it is not flushed against a pending debounce. |

---

## 7. Gap candidates vs Webflow

Webflow capability column is from memory unless noted; the doc agent should confirm it.

| Area | Buildrik evidence | Webflow capability (memory) | Classification | User impact | Suggested change | Priority |
|---|---|---|---|---|---|---|
| Class-based styling | Classes are names only. No rule authoring. `GlobalStyleManager` dead. Suggestions empty (§0.4) | Selector field: style a class, combo classes, "affects N elements", global class reuse | Missing capability | No reusable styling. Every element is styled one by one, or via raw global CSS | Decide product direction: class rules in StyleEngine (`.cls` + mq + state) edited through the same fields, with a selector chip in the context row | P1 (strategic) |
| Value origin / inheritance display | §3.3; UX-10, UX-25 | Property labels colour-coded for "set here" vs "inherited from parent / breakpoint / class", with a source popover | Missing capability / Missing state | Inspector lies about the output. Users override things already set | Resolve every displayed value from a layered model (default → class → base → tablet → mobile → state → inherited/computed). Render "inherited from X" placeholders. Never print a type default as a value | P0 |
| Breakpoint cascade in inspector | `stylesAt` = base + current bp only (`commandOperations.ts:251-259`) | Smaller breakpoints show inherited values from larger ones | Partial implementation | Tablet override invisible on Mobile; "Reset to Desktop" lands on Tablet | Make `stylesAt` cascade in `BREAKPOINT_ORDER`; label the inherited layer | P1 |
| Breakpoint set | 3 (desktop/tablet/mobile) + `wide` preview without its own layer (`breakpoints.ts:16-41`) | Base + tablet + mobile landscape + mobile portrait + 1280/1440/1920 | Missing capability | No landscape phone; no large-screen tuning | Add layers when the model supports them; the engine already tolerates other mqs (`StyleEngine.ts:380-386`) | P2 |
| Preview fidelity | §3.4; UX-09 | Preview = published CSS | Inconsistent interaction | Users validate in Preview and see wrong output | Build Preview from the publish CSS path (class base + responsive + hide + global CSS) | P0 |
| State editing | 4 states (`ContextRow.tsx:18-24`). No forced-state preview on canvas. `STATE_PSEUDO` also knows focus-visible/focus-within (`StyleEngine.ts:24`) | Hover, pressed, focused, focus-visible, focus-within, visited, placeholder, nth-child, etc.; the canvas shows the state while it is being edited | Partial implementation | Hover design is blind | Force the state on the selected canvas node while State ≠ Base; add focus-visible / placeholder | P2 |
| Position / display on any element | Layout only for containers (`elementCapabilities.ts`, `box.tsx:49`) | Every element has Layout + Position | Missing capability | Can't absolutely position an image or badge, set display:none, inline-block or z-index on a heading | Show Position (+ display basics) for all types | P1 |
| Numeric input expressiveness | `parseEntry` rejects `calc()`, `clamp()`, `min()`, `max()` (`InputControls.tsx:203-214`); font-size units px/em/rem/%/vw | Supports calc and many units | Partial implementation | Fluid type impossible from the inspector | Accept CSS math functions as raw values | P2 |
| Filters / transforms / shadows | 4 filters; 2D move/scale/rotate/skew; 1 outer + 1 inner shadow; no backdrop-filter, 3D or origin | Multiple stacked filters, backdrop filters, 3D transforms, origin, multiple shadows | Partial implementation + data-loss defect D-5 | Authored/imported effects destroyed on edit | Preserve unknown functions; add backdrop + origin | P1 (defect) / P3 (feature) |
| Reset semantics | Reset style = base only; dots = current layer only (§3.2) | Alt-click a property to clear on this selector/breakpoint; clear-all per selector | Ownership ambiguity | "Reset" leaves mobile/hover styling; users think it failed | Name the scope ("Reset Desktop styles"); offer "Reset all breakpoints & states" | P1 |
| Copy / paste style | Base only (`defaultCommands.ts:196`, `pasteStyles`) | Copies/pastes the full style incl. breakpoint context | Partial implementation | Paste on Mobile changes Desktop | Make it breakpoint/state-aware like `applyStyleToPeers` | P2 |
| Typography styles | Text style = font-size token only | Classes / typography variables cover full type styles | Partial implementation | Type styles don't carry line-height/weight | Bind a full text style (size, line height, weight, letter spacing) | P2 |
| Visibility cascade | `--hide-tablet` hides only 768–1023 (`ExportEngine.ts:153-155`) | display:none on Tablet cascades to phones unless reset | Intentional difference (unconfirmed) / Inconsistent model | Users must hide twice; differs from style overrides | Document or align with the style cascade | P3 |
| Override indicators | Five indicators for one override (UX-14) | One coloured label per property + section dot | Inconsistent interaction | Noise; pushes controls down | Keep the field dot + one context line; drop the section note duplication; one property per row | P2 |
| Progressive disclosure | All-or-nothing More settings (UX-05) | Collapsible sections, rarely-used groups closed | Inconsistent interaction | Common controls below the fold | Auto-open only the specific rows that have values | P3 |
| Global CSS visibility | Settings › Advanced only; not in inspector or preview | Custom code is clearly separate; styles panel shows the real cascade | Implemented but undiscoverable | Users can't tell why an element looks different | Surface "Affected by site CSS" when computed ≠ resolved | P3 |

---

## 8. Exists in code but hidden or poorly exposed

- ⌥-click a section header toggles every section open or closed (`InspectorTabContent.tsx:142`). No affordance.
- ⌘K "Jump to property" (`hooks/usePropertyJump.ts`).
- ⌘⌥C / ⌘⌥V copy/paste style; "Apply style to all … on this page" lives only in the ⋯ menu (`elementActions.ts:116-143`).
- Escape in a numeric field reverts the value captured at focus; ↑/↓ and ⇧↑/⇧↓ stepping (`InputControls.tsx:276-300`).
- StyleEngine supports arbitrary media queries (`otherMediaRules`, `StyleEngine.ts:380-386, 404-406`) and extra pseudo states (`:24`). There is no UI for either.
- `GlobalStyleManager` (define / apply / applyAsClass, `engine/styles/GlobalStyleManager.ts`) is constructed in `Composer.ts:305` and fed to token usage (`:348`) but has no UI or callers. Treat as PLANNED/dead.
- `StyleEngine.getClassStyles` / `computeStyles` / `getEffectiveStyles` (`:745-797`) are unused. `getClassStyles` would also merge pseudo and media variants of `.cls`, because `getRulesForSelector` matches on prefix boundaries and ignores the media query (`:166-177`). Do not wire it as-is.
- `StyleEngine.clearBreakpointStyles` (`:308-326`) has no callers.
- The "Wide" device previews at 1920 but edits Desktop (`ProInspector.tsx:102-104`; `commandOperations.ts:242-246`). The UI doesn't say so.
- Global custom CSS (Settings › Advanced) is the only way to give a class real styles. It sits far from the CSS classes section.
- Brand › Classes lists class usage counts (read-only), but the inspector doesn't link there.

## 9. Defects found in code

| # | Defect | file:line | Concrete failure scenario |
|---|---|---|---|
| **D-1** | Duplicate, paste, component insert and page duplicate drop StyleEngine rules (breakpoint + `:state`) | `engine/elements/ElementManager.ts:365-372` (new ids), `engine/elements/manager/ElementCRUD.ts:227-254, 274-290`, `PageManager` duplicatePage (`styles: [...source.styles]` keeps old-id selectors) | Set H1 font-size 32px on Mobile and a hover colour; ⌘D. The clone renders 52px on Mobile and has no hover on canvas, Preview and publish. Only the stale `element.breakpointStyles` copy survives, which feeds the React export alone. Reload does not repair it (`importStyles` reads `data.styles` only, `Composer.ts:821-823`) |
| **D-2** | Selector typo `data-buildrik-id` | `engine/commands/stylePeers.ts:79` (used at `:85` and `:107`) | State = :hover, set a hover colour, ⋯ › Apply style to all H2 headings → Apply. `styleAt` reads a rule that cannot exist → returns 0 → the dialog closes, no toast, nothing applied. If it ever wrote, the rule would not match the DOM |
| **D-3** | Preview loses every breakpoint/state override of an inline base property | `engine/Composer.ts:930-1003`; `StyleEngine.ts:471-516, 540-553`; `generation.ts:111-118` | UX-09. Also: a button with a base background and a :hover background shows no hover in Preview |
| **D-4** | Preview ignores per-device visibility and global custom CSS | `ExportHelpers.ts:299-307` (no hide rules), `Composer.ts:998` (no `customCode.globalCss`) | Hide an element on Mobile → Preview › Mobile still shows it. Add `.x{color:red}` in Settings › Advanced → Preview ignores it |
| **D-5** | Filter/transform composer drops unknown functions and re-orders transforms | `inspector/sections/effects/effectValues.ts:44-68, 70-89` | An element with `filter: saturate(1.4) blur(2px)` → move the Blur slider → `filter: blur(3px)` (saturate lost). `transform: rotate(45deg) translateX(10px)` → touch Scale → re-ordered `translateX rotate scale` (different geometry); `translate3d`/`rotateX`/`matrix` are dropped |
| **D-6** | Class suggestions always empty | `inspector/sections/CSSClassesSection.tsx:111-114` (`getGlobalClasses` not on StyleEngine) | Tests mock the method (`__tests__/harness.tsx:125`), so the suite passes while production never suggests |
| **D-7** | Mobile edit view hides the inherited tablet layer | `engine/commands/commandOperations.ts:251-259`; `cssContext.ts:60-67` (state rule at the current mq only) | Tablet font-size 40; switch to Mobile → field shows the desktop 52 while the canvas draws 40. "Reset to Desktop" on a Mobile override reveals 40, not 52 (`OverrideDot.tsx:38`) |
| **D-8** | Unset values show type defaults off desktop; colours always show defaults | `useStyleHandlers.ts:75, 168-191` | UX-10 (line-height 1.1 vs 1.5). A template paragraph with an inherited colour shows `THEME.textPrimary` |
| **D-9** | Reset style / Copy style / Paste style are base-only and primary-only | `defaultCommands.ts:193-200, 225`; `commandOperations.ts` `pasteStyles` | On Mobile, Paste style rewrites Desktop base styles. Reset style leaves every mobile and hover override |
| **D-10** | Multi-select align/distribute bypasses lock, breakpoint and conflict gates (CI-01) | `MultiSelectBar.tsx:39-58`; `AlignmentHandler.ts:52-56, 216-226` | Select 3 elements including a locked one, on Mobile → Align left → the locked element moves and the Desktop `left/top` change |
| **D-11** | Breakpoint-unaware base writes inside type blocks | `typeBlock/attributeWriter.ts:104-106` (columns gap), `:186-188` (icon width/height/colour) | On Mobile, change a Columns gap or an icon size → the Desktop value changes |
| **D-12** | `toCSS` media-block order follows rule insertion order | `StyleEngine.ts:478-505` | Create a mobile override before any tablet override on the page, then a tablet override on another property of the same element. In Preview (and `getCSS`, `Canvas.tsx:624`) the tablet `@media` block comes after the mobile one, so at ≤767 px the tablet value wins. Publish uses `generateResponsiveCSS` and is unaffected |
| **D-13** | Position offsets bypass unit parsing and the field context | `layout/PositionControls.tsx:120-140` | Type `10` in Top → `top: 10` (invalid CSS, silently ignored). No override dot or read-only styling on offsets; writes on every keystroke |
| **D-14** | Section auto-expand treats `normal` as a value | `useAdvancedSettings.ts:150` | An authored `white-space: normal` opens all 9 Typography advanced rows (UX-05 contributor) |
| **D-15** | `FontControls` prints `16px` for an unset size | `FontControls.tsx:63` | Off desktop, an element with no own font-size shows 16 regardless of what renders (h1 default is 48px only if `tagName` matches) |

## 10. Live checks needed

Setup for every check:
- Open `http://localhost:3300/edit/<siteId>` at a 1440×900 browser window.
- Apply the SaaS Landing template unless stated.
- "Canvas node" = `document.querySelector('[data-buildrick-id="<id>"]')`. Read its id from the selected node's `data-buildrick-id`.
- "Preview frame" = `document.querySelector('[data-testid="preview-overlay"] iframe').contentDocument`.
- Stylesheet = `document.getElementById('aquibra-styles').textContent`.

1. **UX-09 mechanism.**
   - Steps: select the H1 → View › Breakpoint › Mobile → set Font size 32 (`[data-testid="inspector-field-font-size"] input`) → Enter → wait 500 ms. Read `getComputedStyle(canvasNode).fontSize` (expect `32px`). Open Preview → choose Mobile in the device row. In the preview frame, read the H1 `style` attribute and `getComputedStyle(h1).fontSize`.
   - Expected per code: the attribute contains `font-size: 52px`, computed 52px, and a `<style>` text containing `@media (max-width: 767px)` with `font-size: 32px`.
   - Then Publish/Export (or use the single-file export) and confirm the published CSS has `.buildrick-<id>{…52px}` followed by the `@media` 32px.
2. **UX-10 source.**
   - Steps: same H1 on Mobile. Read `[data-testid="inspector-field-line-height"] input` value (expect `1.1`) and canvas `getComputedStyle(node).lineHeight` (expect 1.5× font size). Check `node.getAttribute('style')` has no `line-height`. Read `getComputedStyle(document.querySelector('.buildrick-canvas')).lineHeight`.
   - Switch to Desktop and read the field again (expect a px value such as `78px`).
3. **UX-25.**
   - Steps: Desktop, select the H1. Read `getComputedStyle(node).textAlign` and the parent's `textAlign`. Check each `[data-testid^="inspector-seg-align-"]` for `aria-checked`.
   - Expected: computed `center` (inherited); all three `aria-checked="false"`; the node's style attribute has no `text-align`.
4. **D-7 tablet inheritance.**
   - Steps: Tablet → set H1 font size 40. Mobile → read the field value and canvas computed font-size.
   - Expected per code: field shows 52 (desktop), canvas 40px.
   - Then set Mobile 32 → open the font-size override dot → "Reset to Desktop" → canvas computed should be 40px (not 52). Note the label text.
5. **UX-14 count.**
   - Steps: Mobile, one font-size override on the H1. Count `[data-testid="inspector-bp-chip"]`, `[data-testid="inspector-bp-line"]`, `[data-testid="inspector-section-dot"]`, `[data-testid="inspector-section-note"]` and `[data-testid="inspector-override-dot-breakpoint"]`.
   - Expected: two field dots, one beside Font size and one beside Text style.
6. **UX-05 trigger.**
   - Steps: select the template H1 on Desktop. Read the authored styles: in the console, the node's `style` attribute. Note which of `font-style`, `text-transform`, `text-decoration`, `letter-spacing`, `word-spacing`, `white-space`, `word-break`, `text-indent`, `vertical-align` are present. Confirm whether the More settings rows are expanded (look for `[data-testid="inspector-field-white-space"]`).
   - Then select a freshly inserted Heading from Add and repeat (expect collapsed).
7. **D-2 typo.**
   - Steps: two H2 headings on a page. Select one → State: `:hover` (`[data-testid="inspector-state-chip"]` → `[data-testid="inspector-state-opt-hover"]`) → set Colour red → ⋯ → "Apply style to all H2 headings" → Apply.
   - Expected per code: no "Applied to" toast. The stylesheet contains no new `:hover` rule for the second H2's id.
   - Repeat on Base (control): the toast appears.
8. **D-3 hover in Preview.**
   - Steps: select a Button → State `:hover` → Fill colour #ff0000 → Preview. Hover the button inside the preview frame and read computed `backgroundColor`.
   - Expected per code: unchanged base colour, because inline beats the rule. Canvas: hover the node and read computed (expect red).
9. **D-1 duplicate.**
   - Steps: H1 on Mobile font size 32 → Desktop → select the H1 → ⌘D → switch to Mobile. Read computed font-size of the original and the clone. Search the stylesheet for the clone's id.
   - Expected per code: original 32px, clone 52px, no rule with the clone's id.
   - Reload the page and repeat the reads.
10. **D-4 visibility + global CSS in Preview.**
    - Steps: select a section → Behaviour › Visibility → untick Mobile (`[data-testid="visibility-check-mobile"]`). Canvas on Mobile: computed `display` = `none`. Preview › Mobile: the same element's computed `display` (expect not `none`).
    - Settings › Advanced: add `h1{outline:3px solid red}`. Canvas shows the outline. Preview: H1 computed `outlineStyle` (expect `none`).
11. **D-5 filter loss.**
    - Steps: select an image. In the console (or via AI set-style) give it `filter: saturate(1.4) blur(2px)`; if no console access, skip. Effects › Filters › move Blur to 3. Read the node style `filter`.
    - Expected: `blur(3px)` only.
12. **D-9 paste on Mobile.**
    - Steps: Desktop, select A, ⌘⌥C. Switch to Mobile, select B, ⌘⌥V. Switch to Desktop and read B's style attribute.
    - Expected: changed on Desktop.
    - Then on Mobile give B a font-size override, ⋯ › Reset style, stay on Mobile: B's computed font-size keeps the override.
13. **D-10 / CI-01.**
    - Steps: select three absolutely positioned elements, lock one (Layers lock). Switch to Mobile. Align left in `[data-testid="inspector-multi-bar"]`. Read the locked element's style attribute `left` before and after. Back on Desktop, read the unlocked elements' `left`.
    - Expected per code: locked moved; Desktop values changed.
14. **D-6 suggestions.**
    - Steps: add class `card` to element A. Select B → Behaviour › CSS classes → focus `[data-testid="class-add"]` and type `c`.
    - Expected: no suggestion list. Brand › Classes shows `.card used 1×`.
15. **D-12 media order.**
    - Steps: on a fresh page, element X: Mobile font-size 20, then Tablet color blue and Tablet font-size 30. Open Preview at Mobile and read the computed font-size of an element whose base font-size is NOT inline (use a fresh Text element and clear its base font-size first).
    - Expected per code: 30px (tablet wins, wrong). Publish: 20px.
16. **Position availability.**
    - Steps: select a Heading, an Image, and a Flex-type element in turn. Confirm the Style tab has no Layout section and no Position field (`[data-testid="inspector-field-position"]` absent).
    - Then a Container: present.
17. **Offset input.**
    - Steps: Container → Position Absolute → type `10` in the Top offset. Read the node's style attribute `top`.
    - Expected per code: `10` (unitless); computed `top` `auto`.
18. **State preview.**
    - Steps: State `:hover` on a button, set background red, keep the pointer in the inspector. Read the canvas node computed `backgroundColor`.
    - Expected: base colour, because there is no forced state.

### Not verified in this lane
- Server-side role enforcement on `sites.saveProject`.
- The AI accept handler's lock gate around `applySetStyle`.
- Instance-child breakpoint/state overrides vs master sync.
- `ReactExporter` pseudo handling.
- Exact save triggering (persistence lane).
- DESIGN: not assessed.
