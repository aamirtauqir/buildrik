# C3 — Inspector (Style panel + Element settings) vs Webflow

Audit date 2026-10-20 · repo HEAD `19f964d5e` (branch main) · read-only source audit.
Scope: `packages/editor/src/editor/inspector/**` plus the capability table it reads (`src/shared/constants/elementCapabilities.ts`).
Method: read every registered section and its controls, then traced each control to its write path. Paths are relative to `packages/editor/src/`.
Older audits were used as leads only. Every claim below was checked again against source.

**Not verified.** Nothing was walked in the running app. Webflow behaviour comes from product knowledge. Where I'm not certain of a Webflow detail, it's marked *(Webflow: believed)*.
**Tests run.** These existing suites were run: `npx vitest run` on `sections/__tests__/BackgroundSection.controls.test.tsx`, `sections/__tests__/BorderSection.radius.test.tsx`, `shared/controls/__tests__/InputWithUnit.test.tsx` and `sections/__tests__/CSSClassesSection.write.test.tsx`. All 70 tests pass. None of them covers the suspected bugs below, so every bug here is **suspected**: proven by reading the code, not by a test.

---

## 0. The inspector's actual shape (what renders)

`editor/inspector/ProInspector.tsx:329-416` renders the inspector top to bottom:

1. Header: breadcrumb, editable name, AI, ⋯ menu, close (`components/InspectorHeader.tsx`, `components/ElementNameField.tsx`).
2. Status marks and status line (locked, save conflict).
3. A multi-select bar when 2 or more elements are selected (`components/MultiSelectBar.tsx`).
4. **Three tabs: Style · Behaviour · Effects** (`sections/registry/_shared.tsx` `INSPECTOR_TABS`; `ProInspector.tsx:359-368`).
5. A context row with `State: Base ▾` and the breakpoint chip, shown on the Style and Effects tabs only (`ProInspector.tsx:327,369-380`).
6. The sections, in one fixed order per tab (`config/sectionOrder.ts:15-48`):
   - **Style:** component · type block · layout · typography · size · spacing · fill · border · text-inside
   - **Behaviour:** form-fields · form-settings · slides · slider-settings · collection · link · cms-binding · visibility · interactions · css-classes · attributes
   - **Effects:** opacity · shadow · filters · transform-motion · effects-advanced

Two filters decide whether a section renders. One is the element type's capabilities (`shared/constants/elementCapabilities.ts:68-185`). The other is each registry entry's `capability` / `shouldRender` (`tabs/InspectorTabContent.tsx:75-84`). Sections display in three modes: open, closed with a summary, or a "+" row until the element has a value (`sections/registry/index.tsx:87-99`).

### The model difference that dominates everything: no class-first styling

- **Every style write targets the element itself, not a class.**
  - With no state set, a write goes to `setStyleAt(composer, el, bp, …)`, which stores the element's own styles at the base or breakpoint layer (`hooks/useStyleHandlers.ts:299-303`).
  - With a state set, it goes to a rule on the selector `[data-buildrik-id="<id>"]:<pseudo>` (`useStyleHandlers.ts:268-298`).
  - The batch path does the same (`useStyleHandlers.ts:368-401`).
- **Classes are bare names you can type on.** Behaviour › CSS classes only adds and removes names (`sections/CSSClassesSection.tsx:116-130`). A class has no style body you can edit anywhere. Brand › Classes says so: "there is no class detail to open" (`editor/design-system/ui/sections/ClassesSection.tsx:9`).
- **There is no selector field.** The inspector never asks "edit this class / combo class / this element only". The only scope choices are the State and the breakpoint (`components/ContextRow.tsx:57-138`).
- **Reuse is by copying, not by sharing.** The substitutes are:
  - ⋯ "Copy style", "Paste style" and "Apply style to all {peers} on this page" (`editor/shared/elementActions.ts:116-137`, `components/ApplyStyleDialog.tsx:1-9`). These copy values; they create no shared rule.
  - Brand tokens: colours everywhere, spacing on width/height only, "Text style" on headings and text.
  - Components (master/instance overrides).
- **Verdict: DIFFERENT MODEL — P0 for a Webflow switcher.** Webflow's core loop is "select → choose or create a class → style it once → reuse it everywhere, with combo classes for variants". None of that exists here.

---

## S02 — Style panel sections

### Layout: display, flex, grid, child items — PARTIAL (P0 because of the container-only gate)

- **Where it lives.** `sections/layout/index.tsx:50-66`, registered in `sections/registry/box.tsx:45-62`.
- **Display.** A segmented control, Block · Flex · Grid · None (`layout/DisplayControls.tsx:22-27,40`). Inline-block, inline, inline-flex and inline-grid sit behind "More settings" as one select (`DisplayControls.tsx:29-34,41-50`).
- **Flex** (`layout/FlexControls.tsx:146-223`):
  - Direction Row / Column, and a Reverse checkbox (`:160-166,182-193`).
  - A 3×3 align grid that writes justify-content and align-items together as one batch (`:93-144`).
  - Wrap, plus wrap-reverse (`:168-178,196-209`).
  - Gap; row gap and column gap under More (`layout/GapRow.tsx:22-46`).
  - Justify select with the space-* values, align-items with stretch / baseline, and align-content (`:194-218`).
- **Grid** (`layout/GridControls.tsx:72-114`):
  - Columns as a count from 1 to 24, written as `repeat(N, 1fr)` (`:55-70`).
  - Raw text fields for column tracks and rows (`:82-95`).
  - auto-flow, the justify-items / align-items 2D grid, justify-content and align-content (`:96-108`).
- **Child / item controls** (`layout/ItemControls.tsx:58-107`) render inside Size, and only while the parent is flex or grid (`sections/registry/box.tsx:77`, `SizeSection.tsx:368`):
  - Flex item: Grow and Align self on the face; Shrink, Basis and Order under More.
  - Grid item: column span and row span as presets (1–4, or "Full row"), plus align-self and justify-self.
- **Gap 1 (P0): Layout renders only for containers.** The gate is `capability: (caps) => caps.layout` (`registry/box.tsx:49`), and `layout` is `true` only in `container()` (`elementCapabilities.ts:68-77`).
  - `false` for text, button, link, label (`:79-88`), media and image (`:90-98`), and form fields (`:102-110`).
  - `false` for the Flex and Grid types themselves (`:157-161`). Their type block carries `FlexControls` / `GridControls` only (`sections/typeBlock/bodies/layoutBodies.tsx:42-51`).
  - **Consequence: a heading, image, button or Flex/Grid element cannot set display, position, z-index, offsets, overflow or float from the inspector.** Webflow exposes Layout and Position on every element. "Absolute badge on an image" and "display:none on a button at mobile" are everyday Webflow moves. (Per-breakpoint hiding does exist through Visibility; see E02.)
- **Gap 2 (P1).** There is no `grid-template-areas`, no named areas, no visual grid editor (see S09), and no manual child placement by line numbers. Span presets max out at 4, plus "Full row".
- **Gap 3 (P2).** There are no icon-based direction or align controls with a "space-between" glyph like Webflow's; distribute modes sit in a select behind More.
- **Suspected bug (P2), `FlexControls.tsx:50-55,96-100`.** `stopIndex()` maps `stretch` and `normal` to index 0. The default `align-items: stretch` therefore lights the Top-Left cell, while the caption reads "Stretch / Left". Clicking that same cell writes `flex-start`, which silently drops the stretch.
- **Suspected bug (P2), `config/cssContext.ts:115-131`.** `isFlexItem` / `isGridItem` read the parent's **authored** display (`computeEffectiveStyles`). A parent that is flex only through an unauthored type default — for example legacy elements inserted before `blockRegistry.ts:343 applyTypeDefaults` — would hide its children's Grow / Align-self controls. I haven't confirmed this on real data.

### Spacing: box-model widget — PARTIAL (P1)

- **What exists.**
  - A nested margin/padding ring widget with all 4 sides of each (`shared/controls/SpacingControls.tsx:201-251`), plus a "Link sides" toggle (`sections/SpacingSection.tsx:60-94`).
  - Sides accept `auto`, `inherit` and negative numbers (`SpacingControls.tsx:32-45,86-90,148`).
  - ↑/↓ steps by 1, or by 10 with Shift. Escape reverts (`:150-168`).
  - Token-bound sides show a diamond marker that jumps to Brand (`:105-126`).
- **Gap (P1): no drag-to-scrub.** A grep for `scrub`, `pointermove`, `onPointerDown` and `requestPointerLock` across `editor/inspector` finds nothing except a comment (`hooks/useStyleHandlers.ts:116`). Webflow scrubs by dragging on the value or label.
- **Gap (P1): you cannot change a side's unit.**
  - The side input commits only bare numbers or `auto` / `inherit` (`SpacingControls.tsx:86-90,148`).
  - Typing `2rem`, `10%` or `5vw` matches neither, so nothing is written, and blur restores the old value (`:172-175`).
  - A number keeps the side's existing unit (`:89`). There is no unit picker in the box.
  - **Suspected bug:** typed units are silently discarded. Webflow accepts units typed in place *(Webflow: believed — typing "2rem" in a spacing field works)*.
- **Gap (P2).** No Alt- or Shift-drag to set opposite or all sides at once. "Link sides" is a sticky toggle, not a modifier.
- **Gap (P2).** You can't bind spacing tokens from the box; it only displays an existing binding.
- **Minor (P2), `config/cssContext.ts:147-160`.** Vertical padding is disabled with "Inline elements ignore vertical spacing" on `display:inline` elements. That's wrong for padding: it paints, it just doesn't affect layout.

### Size: width/height, min/max, overflow, object-fit, aspect ratio — PARTIAL (P1)

- **What exists** (`sections/SizeSection.tsx:182-385`):
  - Width and Height, each with a Fixed / Fill / Hug mode menu (`:36-50,165-298`).
  - Fill shows the measured px from the canvas (`:126-159`).
  - Units are px, %, rem, vw and vh (`:275`).
  - Width/height can be bound to a spacing token (`:62-119`).
  - Min/max width and height sit behind More (`:322-327,369-381`).
- **Overflow** is in Layout › More, so containers only (`layout/index.tsx:57-64`, `layout/OverflowVisibilityControls.tsx:30-33,116-128`).
- **object-fit** moved to the Image type block: Fit Cover / Contain / Fill (`sections/typeBlock/bodies/mediaBodies.tsx:73`).
- **Missing:** `aspect-ratio` and `object-position`. A grep for `aspect-ratio`, `object-position` and `backdrop` in `editor/inspector` returns no control. Webflow has both on the Size panel *(aspect-ratio added 2023 — believed)*.
- **Gap (P2).** No `em`, `ch`, `svh`/`dvh` or `auto` in the units list, and no min-/max-content keywords beyond Hug's `fit-content`.

### Position: static/relative/absolute/fixed/sticky, offsets, z-index, float/clear — PARTIAL (P0 because of the container-only gate)

- **What exists.**
  - A Position select with Static, Relative, Absolute, Fixed and Sticky (`layout/PositionControls.tsx:30-36,64-71`).
  - A 4-side offset cross and z-index, shown only when the position isn't static (`:57,74-82,104-181`).
  - Float and clear under Layout › More (`layout/OverflowVisibilityControls.tsx:160-194`).
- **Gap (P0).** Containers only — see Layout gap 1.
- **Gap (P1).** No position presets (Webflow's "top-left / full / …" offset presets). No unit picker on offsets: they're raw text `TextInput`s (`PositionControls.tsx:121-163`).
- **Suspected bug (P2), `PositionControls.tsx:121-163`.** The offset inputs are raw `TextInput`s that call `onChange` on every keystroke, with no parsing. Typing "10px" writes "1", "10", "10p" and "10px" in turn. Unitless "10" is invalid CSS for `top`, so the element jumps while you type. These inputs also skip the field context: no read-only styling and no "Mixed" placeholder per side. Writes on a locked element are still refused upstream (`useStyleHandlers.ts:240`).

### Typography — PARTIAL (P1)

Shown open on text types and as closed "Text inside" on containers, buttons, fields and widgets (`sections/registry/text.tsx:104-131`).

- **On the face** (`sections/typography/FontControls.tsx:58-104`): Font size, Line height, Weight 100–900, Colour, and Align Left / Center / Right.
- **Under More** (`TypographyControls.tsx:22-142`): Transform, Decoration, Letter, Word, Style (italic), White space, Word break, Text indent and Vertical align.
- **Font family** (`sections/typography/FontPicker.tsx:34-41,63-133`): three groups — uploaded site fonts, six system stacks, and the **whole Google Fonts catalogue** (`FontPickerDropdown.tsx`), plus a "Manage site fonts" link.
- **Text shadow** lives in Effects › Advanced as a raw text field (`sections/effects/EffectsAdvancedSection.tsx:55`).
- **Gaps:**
  - Align has no Justify (`FontControls.tsx:25-29`) — **P2**.
  - No text columns (`column-count`, `column-gap`) — grep finds nothing — **P2**.
  - No `text-decoration` colour or style, no `text-overflow` / line clamp, no `font-variant` / OpenType features — **P2**.
  - The weight list doesn't filter to the weights the chosen font actually has; Webflow lists only available weights *(believed)* — **P2**.
  - The picker offers all of Google Fonts, not "site fonts only" the way Webflow does (Webflow requires adding fonts in Site settings first) — **DIFFERENT MODEL, P2**.
- **Suspected bug (P1), `shared/controls/InputControls.tsx:180-195,325-336`, `FontControls.tsx:70-80`.**
  - When Line height's current value is the keyword `normal`, `splitValue` returns `unit: "normal"`.
  - Typing a bare multiplier such as `1.5` then takes the live-write branch with `unitNow = units.find(u => !KEYWORDS.has(u))`. That's `"px"`, the first entry of `["px", "", "em", "%", "normal"]`.
  - **Result: `line-height: 1.5px`** instead of `1.5`.
  - `normal` is what `readRenderedValues` reports for an unset line-height whenever the type's defaults name that key (`hooks/useStyleHandlers.ts:67-83,207-211`).

### Backgrounds (Fill) — PARTIAL (P1)

`sections/BackgroundSection.tsx`, registry `box.tsx:98-115`.

- **What exists:**
  - Colour, Gradient or Image (`:90-131`).
  - Gradient: linear or radial, 2 colours, and an angle (`:161-262`; `shared/utils/parsers/gradientHelpers.ts:70-80`).
  - Image: URL or media library, plus Size, Position (9 presets), Repeat, Attachment (incl. "Fixed (Parallax)") and Blend mode (`BackgroundSection.tsx:264-375`).
- **Missing:**
  - **Multiple background layers** — one type at a time; switching type clears the others (`:87-100`). Webflow stacks image + gradient + colour layers — **P1**.
  - More than 2 gradient stops, stop positions, conic gradients — **P1**.
  - `background-clip` (incl. clip-to-text) — grep finds nothing — **P2**.
- **Suspected data-loss bug (P1).**
  - `extractGradientUI` flags gradients with more than 2 stops as `isOpaque: true` and returns no colours and no angle (`gradientHelpers.ts:46-49`).
  - `BackgroundSection` never reads `isOpaque` (no reference to it outside `gradientHelpers.ts`). It shows `DEFAULT_GRADIENT_STOPS` and angle 90 (`BackgroundSection.tsx:66-68`).
  - Any edit then writes a fresh 2-stop gradient (`:208-236`), destroying the imported or template gradient.

### Borders — PARTIAL (P1)

`sections/BorderSection.tsx`.

- **What exists:**
  - Radius as one field, or 4 corners with a link toggle (`:49-66,86-109,154-161`).
  - Width, Style (9 values) and Color for all sides (`:111-150`).
  - Per side as **raw shorthand text** only ("1px solid #ccc") (`:166-188`).
  - Outline width, style, colour and offset (`:190-247`).
- **Gap (P1).** No per-side width / style / colour controls with a side selector, which is how Webflow does it *(believed)*.
- **Gap (P2).** No radius token binding.
- **Suspected bug (P1), radius readout, `BorderSection.tsx:49-55`.**
  - Each corner reads the **shorthand first**: `tl: tl || styles["border-top-left-radius"]`.
  - Once a `border-radius` shorthand exists, unlinking and typing one corner writes the longhand (`:63-64`), but the field keeps showing the shorthand's value. The edit appears not to take.
  - The cascade between the two depends on declaration order.
  - The existing test `BorderSection.radius.test.tsx:30` only covers "longhand when shorthand is absent".
- **Suspected bug (P2), `shared/controls/SpacingControls.tsx:321-339`.** `CornerCell` always writes `px` (`onChange(\`${v}px\`)`) even when it displays another unit. A `50%` corner becomes `40px` when typed over.

### Effects — PARTIAL (P1)

Opacity, Shadow, Filters, Transform & motion and Advanced (`sections/registry/effects.tsx:19-70`).

- **Opacity:** a 0–100 slider (`sections/effects/OpacitySection.tsx:12-30`). **Matches.**
- **Box shadow** (`ShadowSection.tsx:15-69`): outer and inner preset selects, plus raw CSS for each under More. No per-layer X/Y/blur/spread/colour editor and no layer list (Webflow has both) — **P1**.
- **Transforms** (`TransformMotionSection.tsx:36-48`): Scale (one axis, 0–200 %), Rotate (±180°), Move X/Y (raw text) and Skew (±45°).
  - **No 3D** (rotateX/Y, perspective), **no transform-origin**, no per-axis scale or skew, no backface (grep finds nothing) — **P1**.
- **Transitions** (`:49-53`): **one** transition-property from a 7-value select, plus duration and delay as raw text, plus easing (6 values). Webflow allows a list of several transitions, each with its own timing — **P1**.
- **Filters** (`FiltersSection.tsx:8-13`): blur, brightness, contrast and grayscale only. No saturate, hue-rotate, invert, sepia or drop-shadow, and **no `backdrop-filter`** at all — **P1** (backdrop blur is a common Webflow "glass" pattern).
- **Cursor, blend and will-change** (`EffectsAdvancedSection.tsx:14-57`): Cursor has 13 values; Blend has 10 (no hue/saturation/color/luminosity). **Mostly matches.**
- **Suspected data-loss bugs (P1), `sections/effects/effectValues.ts`.**
  - `composeFunctional` rebuilds the value **only from its whitelist order**: `TRANSFORM_ORDER = [translateX, translateY, scale, rotate, skew]`, and `FILTER_ORDER = [blur, brightness, contrast, grayscale]`.
  - Any other function in the current value is dropped on the first slider move: `translate(-50%,-50%)`, `rotateY()`, `scaleX()`, `translate3d()`, `matrix()`, `saturate()`, `drop-shadow()`.
  - `translate(-50%,-50%)` is the standard centring for absolute elements, so this hits real templates.
  - A guard already exists in the codebase and isn't used here: `isOpaqueTransform` in `shared/utils/parsers/transformParser.ts:78`.

### Custom properties / raw CSS — MISSING (P1)

- There's no per-element raw CSS field and no custom-property (`--x`) editor in the inspector.
- The only `--*` writes are the internal `--hide-<bp>` flags (`sections/registry/behaviour.tsx:182`).
- Webflow offers "Custom properties" on the Style panel *(believed: added 2024)*.

---

## S05 — Where a value comes from — PARTIAL (P1)

- **What exists.**
  - `hooks/useFieldOverrides.ts:1-60` and `shared/controls/OverrideDot.tsx:1-50` draw an accent dot for three kinds of override: breakpoint, `:state` and component master.
  - The dot is a real menu with "Reset to Desktop", "Reset to Base" or "Reset to master" (`OverrideDot.tsx:29-39`).
  - The context row shows "Tablet · N overrides · Revert" and "N :hover overrides · Reset" (`components/ContextRow.tsx:110-135`).
- **Missing: no inherited-vs-set distinction.**
  - Unset rows show the canvas's **computed** value, read with `getComputedStyle` (`hooks/useStyleHandlers.ts:67-83,207-211`).
  - That value is drawn exactly like an authored one. There's no "inherited from parent / from class" marker like Webflow's orange label, and no way to see *which* ancestor supplies a value.
  - At Base on Desktop, an authored value and an inherited one look the same.
- **Gap (P2), wording.** `OverrideDot.tsx:35` always says "Reset to Desktop". On Mobile, removing the override actually falls back to the Tablet value: the cascade is max-width only (`shared/constants/breakpoints.ts:53-58`).
- **Context.** There are 3 breakpoints, desktop-first (`breakpoints.ts:18-37`), versus Webflow's 6 *(believed: 1920, 1440, 1280 above base; 991, 767, 478 below)*.

---

## S08 — Units, keywords, calc()/var(), token binding from inputs — PARTIAL (P1)

- **Units.**
  - `InputWithUnit` has a unit dropdown that varies per field (`shared/controls/InputControls.tsx:216-422`).
  - It accepts typed `24`, `24px`, `2rem` and `50%`, plus `auto`, `none`, `inherit`, `normal` and `initial` — but only when that keyword is in the field's units list (`:156,203-214`).
  - An unreadable entry gets a red error: "Enter a valid number…" (`:154,256-266`).
- **calc(), clamp(), min()/max() and arbitrary var() are rejected.**
  - `parseEntry` accepts only number+unit, keywords, or `isTokenVar` (`:203-214`).
  - `isTokenVar` only matches `var(--buildrick-design-*)` (`shared/tokenBindingDetection.ts:19-25`).
  - Webflow accepts `calc()` and similar expressions typed in place *(believed)* — **P1**.
- **Keywords.** `fit-content`, `min-content` and `max-content` aren't accepted outside Size's Hug mode.
- **Token / variable binding from inputs:**
  - Colour: everywhere via `ColorInput` → `ColorFillPopover` (Brand colours, "Update everywhere", "Only this element") (`shared/ColorFillPopover.tsx:1-19`).
  - Size: width/height to spacing tokens (`SizeSection.tsx:62-119`).
  - Font size: the type block's "Text style" (`sections/typeBlock/bodies/textBodies.tsx:5-7`).
  - Not bindable from the inspector: padding, margin, gap, radius, shadow, font family. They display a binding but have no picker (`SpacingControls.tsx:105-126`).
  - Webflow binds variables on most numeric fields and on font family *(believed)* — **P1**.
- **Colour format gap (P1).**
  - The typed colour accepts only 3- or 6-digit hex and a few keywords (`shared/controls/ColorInput.tsx:14-15,181-188`). The custom picker is hex-only (`ColorFillPopover.tsx:39,208-216`).
  - There's **no alpha or opacity on colour**, and no `rgba`/`hsla`/8-digit hex input.
  - An existing `rgba(...)` value paints a transparent swatch (`ColorInput.tsx:133-142`).
- **No drag-to-scrub on any numeric field** (see Spacing) — **P1**.

---

## S09 — Grid editor — MISSING as a visual editor (P1)

- There's a count-based Columns field and raw track text (`layout/GridControls.tsx:55-95`), and span presets per child (`layout/ItemControls.tsx:48-91`).
- There is **no on-canvas or in-panel grid editor**: no visual row/column tracks, no drag-to-place cells, no areas, no per-track fr/px editing.
- Webflow has an "Edit grid" mode with track editing and manual cell placement *(believed)*.
- The `columns` element type uses a separate attribute-driven model with 2–6 columns and gap presets (`sections/typeBlock/bodies/layoutBodies.tsx:21-51`).

---

## S10 — Custom code / embed element and custom attributes

### Custom code / embed element — MISSING (P1)

- The type-block catalogue has no HTML or code embed (`shared/constants/elementCapabilities.ts:22-42,112-185`).
- Embeds are URL-driven only:
  - Video embed: YouTube / Vimeo, ratio, autoplay, muted, controls.
  - Map embed and Lottie (`sections/typeBlock/bodies/embedBodies.tsx:66-104`).
- Site-level custom code exists under Settings (outside this domain), not as a placeable element.
- Webflow's "Code Embed" element is a staple — **P1**.

### Custom attributes — PARTIAL, with a suspected bug (P1)

- `sections/attributes/AttributesSection.tsx:38-48` covers ID, Title and Tab index, plus per-type rows (`config/attributeFields.ts:17-107`) and `DataAttributeEditor`.
- **Suspected bug (P1): existing custom attributes are invisible and can't be edited or removed.**
  - `DataAttributeEditor.tsx:57-103` renders only the key + value + "Add" row. It never lists the element's current `data-*` / `aria-*` attributes.
  - The section summary counts them (`AttributesSection.tsx:32-34`), but the user can't see or delete them.
- **Gap (P2).** Attribute names are forced to `data-*` or `aria-*` (`DataAttributeEditor.tsx:67-68`). Webflow allows arbitrary names apart from a reserved list *(believed)*.

---

## E02 — Element settings

| Item | Verdict | Evidence | Gap / severity |
|---|---|---|---|
| ID | PARTIAL | Attributes › ID (`config/attributeFields.ts:18`) | **Suspected bug (P1):** no uniqueness or format check, and in multi-select the ID is written to **every** selected element (`typeBlock/PropertyField.tsx:187-190` → `attributeWriter.ts:52-66`), producing duplicate ids |
| Tag selection | PARTIAL | Heading H1–H6 only (`typeBlock/bodies/textBodies.tsx:31,57`) | Containers can't switch the semantic tag (div/section/header/nav/article/aside/main/footer); the tag is fixed by element type. Webflow's Div Block has a Tag select *(believed)* — **P1** |
| Link: URL / page / section / email / phone / new tab | PARTIAL | Link to Page / URL / Email / Phone / Anchor, Open in new tab, Rel (`sections/LinkSection.tsx:49-55,280-327`) | Anchor is a free-text ID, not a picker of the page's sections. No "page + section" combination; no email subject; no `download`. Webflow: Page → Section dropdown *(believed)* — **P1** |
| Visibility | DIFFERENT MODEL | Per-breakpoint "show on" checkboxes writing `--hide-<bp>` on the base styles (`sections/VisibilitySection.tsx:31-77`, `useStyleHandlers.ts:270-277`) | Webflow uses display:none per breakpoint/class plus conditional visibility for CMS. The checkbox approach is arguably clearer; there's no CMS-conditional visibility here (CMS is out of this domain) — **P2** |
| Custom attributes | PARTIAL | See S10 | **P1** (bug above) |
| Image alt / srcset / loading | PARTIAL | Alt text + empty-alt hint, Fit, Loading lazy/eager (`typeBlock/bodies/mediaBodies.tsx:67-74`); Decoding under Attributes (`attributeFields.ts:24-35`) | No "decorative" toggle (`alt=""`), no responsive `srcset`/`sizes` control, no object-position — **P2** (srcset depends on whether the export generates it; not verified here) |

---

## Selector / class picker in the inspector — MISSING (P0)

- The user can choose the **State** (Base, :hover, :focus, :active, :disabled) and sees the **breakpoint** chip (`components/ContextRow.tsx:18-24,64-118`). The breakpoint itself is changed elsewhere (the device switcher).
- The user can't choose a **class vs element** target. There's no selector field and no combo-class concept. Writes always go to the element (§0).
- **Missing states (P1):** visited, focus-visible, focus-within, ::placeholder, and first/last/nth-child (which Webflow offers for collection items) *(believed)*.
- **Suspected bug (P1): class suggestions are always empty.**
  - `CSSClassesSection.tsx:111-114` calls `composer.styles.getGlobalClasses()`, which no engine module implements. A grep finds no definition, and `editor/design-system/ui/sections/ClassesSection.tsx:17-20` says "is not implemented on the engine at all, so that list has always come back empty".
  - So "Suggestions are the project's global classes" (`CSSClassesSection.tsx:5-6`) never happens.

---

## Multi-select editing — PARTIAL (P1)

- **What exists.**
  - The primary element plus the others go into one transaction for style writes (`hooks/useStyleHandlers.ts:306-324,340-419`).
  - Shown sections are the intersection of the selected types' capabilities (`tabs/InspectorTabContent.tsx:75-84`). Differing values read "Mixed" (`ProInspector.tsx:224-228`).
  - The multi-select bar offers Align, Distribute and Group, and says "Edits apply to all {n}. One Undo restores all {n}." (`components/MultiSelectBar.tsx:1-14,114`).
  - Webflow's multi-select only works when the elements share a class *(believed)*, so here it's broader in principle.
- **Suspected bug (P1): the banner over-promises.** These Behaviour writes target **only the primary** element, even though the sections render for the whole selection:
  - Link (`LinkSection.tsx:178,199,263` → `getElement(selectedElement.id)`)
  - CSS classes (`CSSClassesSection.tsx:121,129`)
  - Interactions and animation (`registry/behaviour.tsx:34,47,72`)
  - Add data attribute (`DataAttributeEditor.tsx:72`)

  The ID row in Attributes is the opposite case: it writes to all of them (E02).
- **Gap (P2).** The position offset cross doesn't show per-side "Mixed" placeholders (it uses raw `TextInput`; `PositionControls.tsx:121-163`). Only a caption-level indicator exists (`:114`).

---

## Severity roll-up for a Webflow switcher

- **P0**
  1. No class-first styling or selector picker: element-scoped only (§0, Selector).
  2. Layout and Position (display, position, z-index, overflow) only on container types (`registry/box.tsx:49`, `elementCapabilities.ts:68-110,157-161`).
- **P1**
  - Missing controls: drag-to-scrub; calc()/var() input; colour alpha; multiple background layers; >2-stop gradients; 3D transforms / transform-origin; multi-transition lists; backdrop-filter and other filters; shadow layer editor; per-side border controls; aspect-ratio; visual grid editor; Code Embed element; container tag select; section-anchor link picker; inherited-value indicator; extra pseudo-states; custom properties / raw CSS; token binding for spacing, radius and font.
  - Suspected data-loss bugs: transform/filter whitelists, gradient >2 stops, line-height `normal` → px.
  - Suspected bugs: hidden custom attributes, duplicate IDs in multi-select, primary-only Behaviour writes in multi-select, empty class suggestions, typed units dropped in the spacing box, radius readout preferring the shorthand.
- **P2**
  - Missing controls: justify align; text columns; font-weight availability; background-clip; object-position; decorative alt / srcset; attribute-name restriction.
  - Suspected bugs and wording: CornerCell forces px; offset keystroke writes; align-grid stretch display; inline vertical-padding note; "Reset to Desktop" wording on Mobile.
