# Independent CSS unit board review — 2026-10-18

Scope: Figma-only board51:1405 and UnitSelector49:1305/NumericUnit4:413 in file2L9OTGzBrL6kYmU18yA1c7. Current-source mapping is in /tmp/buildrick-unit-source-review.md. No Figma or app edits by reviewer; runtime NOT RUN.

Evidence: live board/API readback and screenshot /tmp/buildrick-unit-board.png (1040×1133). Board may subsequently grow as author adds property-specific menu specimens.

## Confirmed

- Clear visible variety: font1.5rem; line height1.5×; letter spacing0.02em; width50%; padding2rem; marginAuto; radius50%; border1px; opacity75%; rotation15°; duration200ms.
- Width Fixed and Height Hug·Auto remain separate modes. Auto and Normal are shown as full keywords, not numeric suffixes. Font-specific em parent basis is differentiated from line-height em element-font basis.
- Open font, line-height and width/height unit lists correspond to source mappings. Font rem and size % chosen consistently with adjacent examples. Unitless line-height × is explicitly named Unitless multiplier.
- Opacity and angle suffix specimens have no chevron. Readback confirms their nested suffix components expose only Unit text, unlike editable UnitSelector Unit/State. Current source serializes opacity decimal and angle deg; visual suffix does not change serialization.
- UnitSelector49:1305 retains original Default32:636 and adds Hover/Focus/Open/Disabled. It exposes Unit text and State variants. NumericUnit default nested32:641 has isExposedInstance=true; actual font instance51:1447 exposes nested selector with rem. This is reusable editable Figma anatomy, not implementation evidence.
- Mixed font shows literal Mixed with — unit, preventing a fabricated default px. Explanatory text requires explicit supported replacement.
- Board explicitly states values are illustrative and spacing/timing menus are proposed corrections. Conversion note correctly limits24px→1.5rem to root16px and retains original when basis is unknown. This is a design contract; current InputWithUnit still replaces suffix without equivalent-value conversion.

## Bounded corrections at initial capture

1. Line-height menu's Normal is currently a select showing an active value while × option is selected. Author already plans an unselected Normal menu option separated as value mode; review that final state.
2. Integer3 input lacks visible property association. Author already plans Columns label.
3. Custom calc(100% - 2rem) input51:1627 lacks a visible owning property. Label Width (custom) or actual intended length property; do not let it appear to belong to preceding Margin or Line height example.
4. Additional border/radius/spacing/time option specimens pending. Ensure border width excludes%; radius includes%; time supports ms/s; spacing keywords remain property-specific (Auto not a padding mode). Current-source differences stay explicit.

No clipping/overlap found in initial board. Keyboard menus, roving focus, Escape return, unit conversion, percentages with indefinite basis, full variant matrices, runtime persistence and responsive writes are NOT RUN. A screenshot of an open list does not prove interactive prototype behavior or application support.


## Final bounded closure

Final API readback and screenshot `/tmp/buildrick-unit-board-final.png` (1040×1407) independently reviewed. Initial corrections1–4 are closed:

- Normal52:1483 is an unselected Default MenuItem under Value mode; × remains the sole selected line-height choice in that specimen.
- Columns52:1490 labels the integer3 field. Width · Custom expression52:1492 labels the calc input.
- Spacing menu52:1494 lists px/%/em/rem/vw/vh and labels percentage Containing block; no invalid Auto padding unit is introduced.
- Border width52:1558 lists px/em/rem and excludes%. Radius52:1592 lists px/%/em/rem. Duration/delay52:1636 lists ms/s; ms selection agrees with200ms example.
- Final board has readable menus, no observed clipping/overlap and clear separation of keyword modes, editable units and fixed suffixes. It is an expanded design board, not a claim of viewport-clamped running popovers.
- `css-unit-contract.md` independently read: it correctly distinguishes Page max width from element fixed size, existing spacing/per-corner radius limitations, new spacing/time menus, no negative padding versus signed margin/delay, property-specific conversion and unresolved-basis recovery. Current source vs proposed behavior remains explicit. Unit conversion/persistence/history are still not runtime verified.

**Result: bounded CSS-unit design review PASS; no remaining blocker in reviewed board and contract.** This validates representative content, anatomy and visual fit, not exhaustive CSS grammar, every property/state combination, interactive menu keyboard execution, assistive technology, computed-size conversion or production readiness. Authored journey values were not changed by this reviewer; no comprehensive cross-file authored-value diff was performed.
