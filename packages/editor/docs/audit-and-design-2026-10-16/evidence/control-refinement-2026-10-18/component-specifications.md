# Component contracts — control refinement 2026-10-18

**Latest compact revision supersedes conflicting measurements:** Input/Select/NumericUnit/ColorControl/UnitSuffix/TextAlignment use28px height, radius4,12px type. NumericUnit separates the value input from a40×28 unit menu by4px; value inset8. Regular88/8/180 rows retained. CompactProperty is134×48 (label16 + gap4 + control28), two columns with8 gap. TextAlignment is180×28, with14px three-line icons; caret12px. Long/custom values expand to full-width rows. Buttons, section headers and checkbox/toggle targets retain their earlier dimensions. Behavior contracts below continue to apply.

These are design specifications under the existing brief, not claims of implemented keyboard or persistence behavior. Source reuse and current props/binding risks are in source-audit.md and control-inventory.md. All dimensions use existing SC-27 tokens except the two documented Figma geometry aliases below.

## Shared anatomy and semantics

Property-field height28, label88, gap8, control180 in a300 panel with12 insets. Full-width compound276, stacked label. Compact pairs use134px columns and28px fields. Expanded text/composites grow vertically; long/custom values must not be squeezed into the paired90px numeric area. Padding8, radius4 for affected fields; general glyph16, caret12 and alignment14. Helpers/errors use a separate line with4 gap; groups use8 gap and12 inset. Section header32. Focus is the existing accent2px effect, never color alone for error/mixed/source information. Text names must label their actual input, with error/helper IDs in aria-describedby. Error is aria-invalid; disabled reasons remain available.

Nonmodal Inspector retains normal tab order. Closing a popover restores its captured trigger; Escape discards only its uncommitted draft. Unsupported/custom stored values remain readable and survive unrelated edits. Scope is captured selection IDs + breakpoint + authored state; async changes cannot land on a later target. See II-02/03/06 for guards.

| Primitive / existing reuse target | Size / anatomy | Interaction and state contract | Figma coverage |
|---|---|---|---|
| Input / InputControls, TextInput | 180×28, 8 inset | Free strings; Enter commits single-line, Escape reverts draft. Invalid draft retained; focus/blur alone do not write. | Default, hover, focus, disabled, error, mixed |
| Number / NumericUnit, InputRow | 180×28; value136 + gap4 + unit40 | Finite/domain validation; arrows ±1, Shift ±10; preserve legal keywords/custom. Unit conversion contextual and zoom-independent. | Same six states |
| Select / SelectInput, SelectRow | 180×28; chevron12 | Long enum; one named combobox, arrows/typeahead, Enter choose, Escape return. Unknown saved value stays visible. | Same six states |
| Segments / SegmentControl | 180×32; three60 slots | Small mutually exclusive choices only. Radiogroup, one tab stop, arrows/Home/End. If labels do not fit, use Select. | Selected/unselected specimen; complete focus/disabled matrix pending |
| Toggle / ToggleRow | 36×20 glyph in40×32 target, label8 gap | Space toggles binary. Mixed is visibly centered with literal Mixed; activation sets all eligible targets On in one transaction. For mixed selection use checkbox semantics with aria-checked=mixed, not unsupported switch=mixed. | Off/on/mixed/focus/disabled; hover contract specified |
| Checkbox / PropertyField | 16 glyph in24×32 target, label8 gap | Independent flags, Space toggles, native indeterminate for mixed; mixed activation checks all eligible targets. Never device-breakpoint selector. | Off/on/mixed/focus/disabled |
| Slider / RangeSlider, OpacitySlider | 180×32 including exact numeric88 | Named range input; arrows step, Home/End range endpoints. Drag previews, release one history entry. Numeric companion preserves valid values outside convenience range. | Midpoint and minimum; full focus/error/disabled variants pending |
| ColorControl / ColorInput | 180×28, 20 swatch + value + chevron12 | Named trigger; literal/token/Mixed preserved. Enter/Space opens picker, never silent shared mutation. | Default and mixed; full state matrix pending |
| ColorPicker / ColorPicker, ColorFillPopover | 280 popover,12 inset | Shade/hue/alpha, exact editable hex, palette, contrast, Cancel/Apply. Non-pointer hex and alpha path. Brand Use retains reference; shared edit and local application remain distinct under II-06. | Local plus Brand-entry/shared-edit specimens; invalid/stale/permission states specified, not all drawn |
| IconButton / chrome-ui IconButton | 32 target,16 glyph;24 in-row with8 separation | Accessible action name, tooltip hover/focus, Enter/Space. Disabled reason reachable. | Existing default/hover/selected/focus/disabled |
| FieldRow / ControlRow | label88 +8 +control180 | Label is persistent, not placeholder. Two-line label grows row40; longer/complex row stacks. Source/error below. | Reused master with Label and Control swap properties |
| PropertyGroup / Section | header276×32 within300 section | Button with aria-expanded and controlled body; Enter/Space; set count visible when collapsed. | Open headers plus collapsed section specimens |
| Accordion / Section consumer | header32 + variable body | Disclosure preserves values, current selection and focus. Collapsing containing focus returns it to header. | In context screens; exhaustive keyboard playback pending |
| Tooltip / existing Tooltip | Content hug; max width240 | Opens hover/focus, Escape dismisses; supplemental only, never sole field label or error. | Existing master reused; timing follows SC-27 |
| UnitSelector / current unit select | 40×28; glyph12 | Only legal property units. Unsupported conversion disabled with reason; no relabeling number as conversion. Disable together with numeric input. | Default/hover/focus/open/disabled; seven property-menu specimens; keyboard execution unverified |
| UnitSuffix / numeric fixed units | 28 high,32 wide within shared value surface | Read-only %, degrees, or other fixed unit; not focusable, no chevron. Unit included in accessible input name. | Nested in sliders/transform |
| Spacing composite / SpacingSection | 276 wide, label above | Four sides with individual28 inputs and explicit link action; source/reset per side; preserve independent units. Box-map16 targets retain approved keyboard-field alternative. | Four fields + map + linked specimen |
| Border composite / BorderSection | 276 wide stacked | Width/unit, style, color, per-side and linked radius controls reuse same primitives. Preserve outline and custom values; no replacement with one attractive shortcut. | Taxonomy specified; complete expanded border specimen pending |
| Shadow composite / ShadowSection | 276 wide stacked | X/Y/blur/spread/color; inner/outer preserved; unknown/multiple expressions retained or explicit scoped conversion. Each field labeled. | Native composite specimen; multilayer/custom flow not newly drawn |
| Transform composite / TransformMotionSection | 276 wide stacked | Scale/rotate/skew exact companion; X/Y numeric units. Preserve transform order and untouched functions. | Native composite specimen; full custom conversion states pending |
| Textarea / PropertyField textarea | 276×96 minimum,8 inset | Enter inserts newline; explicit completion or shared blur contract, Escape draft recovery. Structured lines validate without erasing saved value. | Content specimens; error state specified, not newly drawn |

## Source, reset and responsive inheritance

Inherited: show resolved value plus source, without pretending it is authored locally. Override: scope line, section count, field dot/source, named reset action and fallback. Mixed never appears as zero or empty. Reset removes only captured authored layer; its accessible name includes property and layer. Locked/permission context disables writes at commit even if a popover opened earlier. Keep values readable. Component instance header and main-component action remain outside property tabs; local reset does not edit the main component.

Color shared flow is approved II-06 design, not a claim the app currently has modes. Light/Dark changes draft editing mode only. No Dark override shows Follows Light and Set Dark value; primitive remains Light-only. Update [token] · mode and Use on selected element(s) have distinct histories and consequences. Local literal applies both Light/Dark at the displayed breakpoint/state. Known-reference count is not a universal element count. Recent and eyedropper were not added.

Picker geometry: anchor/flip within viewport, max-height viewport minus24; keep header and commit actions reachable while inner content scrolls. Color board shows expanded anatomy for review, not a viewport-fit assertion.

## Token handoff

Existing Figma color/text/effect/radius/spacing variables remain canonical. Added Figma-only float aliases: size/property-label=88 (CSS handoff var(--bk-size-property-label)) and size/unit-control=40 (var(--bk-size-unit-control)) and size/property-control-height=28 (var(--bk-size-property-control-height)). These aliases have NOT been exported to app CSS. Fixed geometry of native component masters must be bound/derived during implementation, not copied into unrelated hardcoded rules.

## Implementation entry gate and risk

Before a future code task, enumerate consumers with symbol search, inspect current props/callback timing/ref/focus handling, and preserve public contracts. High risk: unit conversion, color/token identity, PropertyField mixed writes, delayed selection edits, composite serialization, undo coalescing. Medium risk: shared chrome dimensions, scroll/focus and popover clamping. Low risk: icon geometry and cosmetic border/spacing after consumer checks.

No source data-model, schema, event callback, serialization or application component was changed in this design task. Figma specimens do not close the remaining variant matrix or runtime acceptance list.

