# CSS units — user-reported omission, 2026-10-18

User reports missing CSS units/options in refined controls. Existing design showed mostly px and did not expose property-specific menus, value modes or mixed-unit examples. This follow-up changes Figma components/specimens only. It does not change existing authored values to demonstrate units.

## Design correction

- NumericUnit keeps a visible, independently focusable UnitSelector. Unit property is exposed from each numeric variant in Figma. Default, hover, focus, open and disabled unit triggers share the same original master identity.
- Added native reusable menus and examples for font size, line height, fixed sizing, spacing, border width, radius and duration/delay. Existing MenuItem instances are reused.
- Value and unit are separate. Keywords Auto/Normal are value modes, never 0 with a suffix. Fill/Hug/Fixed remain sizing modes, not CSS units. Unitless line-height displays × but serializes a bare number.
- Custom width calc(100% - 2rem) stays exact. Mixed units display — alongside Mixed and a text explanation; no implicit px default.
- Fixed units (opacity %, angle °) do not offer a misleading unit dropdown. Counts/z-index have no unit. Time offers ms/s as a specified correction to the existing raw text control.
- Choice labels and examples are design fixtures. Existing main journey values remain unchanged.

## Property mapping and source limits

Paths relative to src/editor/inspector.

| Property | Unit/value contract | Inspected source / status |
|---|---|---|
| Font size | px, em, rem, %, vw | sections/typography/FontControls.tsx:65; current option list |
| Line height | px, unitless ×, em, %; separate Normal keyword | FontControls.tsx:76; × serializes bare number |
| Letter/word spacing | px, em; Normal keyword | TypographyControls.tsx:60,70 |
| Element fixed width/height | px, %, rem, vw, vh; preserve Fixed/Fill/Hug mode | SizeSection.tsx:275; Fill readout is not authored fixed size |
| Page max width | px, %, rem, vw | SizeSection.tsx:352; do not blindly copy vh from element sizing |
| Element min/max | Current generic InputWithUnit options; filter legal keywords by specific property during implementation | SizeSection.tsx:371; existing permissive defaults are not proof every keyword is legal everywhere |
| Padding/margin | Design length choices px, %, em, rem, vw, vh; Auto only for margin; no negative padding; negative margin allowed | SpacingControls displays existing suffixes and retains them on numeric edits. It does NOT commit arbitrary typed 2rem today. New selector is design-only correction |
| Gap / row gap / column gap | px, rem, em, % | sections/layout/GapRow.tsx:13; keep layout owner |
| Uniform radius | px, %, em, rem | BorderSection.tsx:105; per-corner editing currently appends px in SpacingControls:333—explicit implementation gap |
| Border width | px, em, rem; no % option | BorderSection.tsx:119 |
| Outline width/offset | px, em in current explicit controls; offset may be signed | BorderSection.tsx:222,251; do not silently expand current menu based on generic CSS |
| Opacity | Fixed % display; 0–100, serialized fraction | effects/OpacitySection.tsx:23; no length-unit menu |
| Brightness/contrast/grayscale/scale | Fixed % display; retain documented convenience ranges and valid outside-range values | existing Effects mappings; exact input remains |
| Rotate/skew | Fixed ° display, serialized deg | TransformMotionSection.tsx:44,47 |
| Duration/delay | ms/s; duration nonnegative, delay may be signed where supported | TransformMotionSection.tsx:51–52 currently raw TextInputRow, menu is proposed; preserve existing s values |
| Counts, z-index | Integer without unit | Do not reuse a default px control |
| Grid tracks | Preserve existing fr/custom syntax in its existing grid editor | Do not add fr to width, spacing or typography menus |

The visible specimen is a representative unit/keyword matrix, not every CSS property or complete current app behavior. [Independent source check](unit-source-review.md) records distinctions.

CSS validity reference: [W3C Values and Units](https://www.w3.org/TR/css-values-3/) defines property-dependent types; percentage is not interchangeable with every length. Product option sets above come from current source and approved II/INS contracts, not the entire CSS vocabulary.

## Conversion, draft and keyboard contract

INS-D11 remains canonical: choosing another unit preserves computed size only where an unambiguous property-specific reference exists. Example24px→1.5rem assumes actual root font16px, never a hardcoded universal16. Use authored CSS geometry, not canvas zoom. Compute each captured target independently; an unconvertible batch must not partially mutate.

Missing percentage basis, unavailable fonts/geometry, keyword or unresolved calc/var: conversion disabled with explanation; retain original and offer explicit supported value+unit replacement. Typed complete supported values are explicit replacements, not conversion. No value changes on opening/closing the menu.

Unit trigger accessible name includes property/current unit; latest user-requested geometry is40×28, text +12px chevron, separated from the numeric input by4px. Both controls disable together. Fixed %/° suffixes share the numeric field surface without a caret; no-unit counts omit the suffix. Enter/Space opens the unit menu; arrows/typeahead navigate; Enter selects; Escape closes and returns to trigger. Last valid value stays applied while invalid draft remains visible. One committed change is one Undo, preserving selection/breakpoint/state and token identity rules.

## Figma artifacts and validation

- UnitSelector set49:1305 preserves original default32:636 and adds four interaction variants.
- NumericUnit set4:413 exposes its nested Unit instance for every existing value state.
- [CSS unit board51:1405](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=51-1405)
- Menu masters: Font size51:1293; Line height51:1330; Width/height51:1368; Spacing52:1494; Border52:1558; Radius52:1592; Time52:1636.
- Screenshot/readback checks verify visible suffixes, menu content, fit, keyword separation and mixed/custom presentation. Static design only; menu keyboard execution, conversion, serialization and save/undo runtime remain NOT RUN.
- [Final unit screenshot](css-unit-controls.png) includes all seven menu families. Columns and custom Width have explicit labels; Normal is an unselected keyword action below the selected unitless option, avoiding two apparent active choices. Default NumericUnit master IDs and existing authored journey values are preserved.
- [Independent review](unit-board-review.md) closed all four captured design corrections after final API and1040×1407 screenshot inspection. No blocker remains within these represented unit/menu designs. Full property coverage and runtime checks remain unverified.

