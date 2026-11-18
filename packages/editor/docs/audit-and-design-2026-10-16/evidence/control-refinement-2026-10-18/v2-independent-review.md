# Independent v2 control review — 2026-10-18

Bounded read-only review responding to the user's rejection of the prior visual treatment and request for controls closer to Figma. No application/Figma mutations by reviewer; no general re-audit. Newer user direction permits the changed presentation, while existing approved ownership, values, saving and history contracts remain in force.

Evidence: live screenshots of main `7:20634`, component board `45:1083`, Tablet override `8:1705`; saved `/tmp/v2-shell.png`, `/tmp/v2-controls.png`, `/tmp/v2-tablet.png`. Live API readback: TextAlignment set`43:1271`, CompactProperty`45:1073`, NumericUnit set`4:413`. Read current README/component-specifications and source FontControls alignment options. Companion/recovery propagation was still underway and not reviewed in this checkpoint.

## Visual and preservation assessment

The v2 direction is coherent in the sampled shell. Neutral filled32px inputs,6px radius, smaller persistent labels and paired values reduce the amount of border detail and vertical scrolling. The compact layout makes Spacing/Background/Border summaries visible at1440×900 while retaining target identity, four tabs and authored-state control. No clipping/overlap found in inspected default or Tablet panels.

Paired columns fit:134+8+134=276 within300−24 panel content. Font size/Weight, Line height/Letter spacing and Width/Height each retain their own persistent label. Units and select arrows remain visible; compound grouping does not imply a shared value or transaction. CompactProperty master is134×52, with134×16 label and134×32 control and a Label/Control-swap contract. This is real reusable master structure, not merely drawn anonymous rectangles.

Tablet override is preserved correctly in the sample: active toolbar Tablet/768, header Tablet·1override, Typography count1override, dot before Font size, value20px, Remove Tablet override action, and explicit `Font size · Falls back to Desktop:24px`. Weight remains its own neighbor. This avoids attributing the override to both paired fields. Default scene independently shows24px and `Font size · Local value · Desktop`. Source/reset remains directly adjacent before the next pair.

TextAlignment has Left/Center/Right variants with Default/Focus/Disabled, reflecting the three actual current source options in `FontControls.tsx:25–29`. Icons are recognizable; selected chip visibly differs. Variant description names accessible radio labels/tooltips and arrow keys, retaining the same text-align operation. Existing shared contract further requires one tab stop and Home/End; keep these requirements when code is eventually changed.

## Corrections before this batch is handed off

| ID | Priority | Evidence / issue | Required correction |
|---|---|---|---|
| V2-01 | Blocking copy/behavior mismatch | Board45:1083 says `Last saved value is kept.` Numeric editing may already have a newer valid unsaved value; existing contract retains last valid value on invalid entry. | Use `Last valid value is kept.` Never imply persistence succeeded merely because input remained valid. |
| V2-02 | Blocking source association | Under Color and source, `#4B5563` is immediately followed by `Tablet override · Desktop:24px`. The dimension source appears to describe color. | Attach to a Font size row or explicitly name `Font size · Tablet override · Desktop:24px` and separate it from the color example. Prefer keeping source adjacent to its actual property. |
| V2-03 | State/token defect | NumericUnit Error4:405 live stroke is unbound pure black; screenshot invalid helper is black. The neutral refresh has removed the prior semantic error binding, even though validation text still identifies an error. | Restore existing semantic error token for border/helper with text and aria-invalid contract. This is not a request for a new palette or color-only error cue. |
| V2-04 | Handoff contradiction | README and component-specifications still specify13px labels/radius8/group gap8 and12 inset, while live v2 uses12px/radius6/vertical8/gap4 and paired134px fields. | Add explicit superseding v2 record and token/variant mapping; retain horizontal12px section inset and32px hit targets. Do not leave competing current specifications. |

## Maintenance and accessibility notes

- TextAlignment child slots still carry Desktop/Tablet/Mobile names from the reused segment anatomy despite displaying alignment glyphs. Rename to Align left/center/right. Inherited Option1/2/3 text properties need removal or accurate wiring if their former text nodes are no longer present. This is a maintainability correction, not a user-visible IA issue.
- TextAlignment currently lacks a Mixed/no-option-selected variant. At minimum explicitly preserve no selected option for mixed selection in the handoff; do not choose Left merely as a default. Full matrix remains incomplete, and that limitation must stay visible.
- Icon discoverability: each option must expose an accessible name and tooltip on keyboard focus as well as hover. Radiogroup label should be Text alignment; names Align left/center/right; selection announced; focus separate from selection. The Figma description is design intent, not runtime accessibility.
- Paired error/source text must name its property and either stay within its owning134px column or use a clearly associated full-width helper row. Error/override on one half must not move the other label into the wrong association. Both invalid simultaneous fields and mixed units require later examples/checks.
- For long labels, grow vertically as master description states; for long custom values or tokens, provide expandable/stacked editing instead of clipping or coercion.134px is a presentation size, not a restriction on supported CSS values.
- Keyboard order should remain first label-associated input/unit, then second input/unit; DOM order matches visual order. Grouping must preserve captured element/scope, reset layer, discrete actions and existing Undo semantics.
- Default, Hover, Focus, Disabled, Error and Mixed NumericUnit variants remain registered. Hover has stronger boundary; focus has accent border/effect; mixed is literal text; disabled is muted. Semantic invalid styling needs V2-03 correction. No formal contrast or screen-reader test run.

## Bounded result

Visual fit and selected-property/source preservation pass in the inspected main and Tablet samples. The new grouping is a presentation refinement; no feature ownership or model change was found. V2-01–04 prevent declaring the v2 component handoff finished at this checkpoint. Companion/recovery consistency, exhaustive variant matrices, long/custom values, keyboard/prototype playback, real unit conversion, persistence/history/output and full122-row/69-block acceptance remain NOT RUN.

Readiness: **PARTIALLY VERIFIED — v2 static visual samples; listed corrections pending.** No production-readiness or user visual-approval claim.


## Bounded correction closure — 2026-10-18

Independent live Figma API readback and current document reads close V2-01–04. This section supersedes the earlier pending status; it does not replace the initial evidence or expand the review scope.

- **V2-01 closed:** Text45:1177 now reads `Enter a valid number. Last valid value is kept.` and its fill binds `color/error-text` (VariableID:3:59). Its historical layer name still contains “saved”; displayed text is correct.
- **V2-02 closed:** Source instance45:1365 now explicitly reads `Font size · Tablet override · Desktop: 24 px`; board heading45:1357 reads `Color and property source`. The explicit property name resolves the misleading color/dimension association in this component specimen. Real controls must continue to place source beside its owning property.
- **V2-03 closed:** Error variants Input4:319, Search4:347, Select4:380 and NumericUnit4:405 all bind their stroke to `color/error` (VariableID:3:55); helper uses `color/error-text`. These are semantic bindings, no longer the unbound black stroke observed earlier. This is not a formal contrast test.
- **V2-04 closed:** README lines9–17, component-specifications line3 and PRODUCT-DESIGN-BRIEF line9 explicitly establish the superseding v2 contract:12px labels, radius6, section vertical inset8/gap4, horizontal12,134+8+134 paired fields and retained32px controls. Older measurements are expressly historical where conflicting; existing behavior contracts remain in force.
- **Alignment maintenance closed:** TextAlignment43:1271 exposes only Selected/State variant properties; stale Option TEXT properties are absent. All10 variants use Align Left/Align Center/Align Right slot names. Mixed46:8901 has three unfilled slots (no selected choice); board46:9560 includes literal Mixed and its alignment instance. Mixed Focus/Disabled combinations and runtime keyboard behavior are still not covered by this default Mixed specimen.
- **Tablet label adjustment verified structurally:**20:2859 is134×16, with4px override indicator and16px-high Font size label, matching the paired-label anatomy. Existing value/fallback/reset preservation assessment remains unchanged.

**Current bounded result: sampled v2 review corrections CLOSED by independent readback.** No remaining blocker in this bounded correction set. Earlier main/Tablet visual fit evidence remains applicable, with this follow-up limited to targeted text, token, variant, geometry and document verification. Companion/recovery propagation, complete state matrices, long/custom values, keyboard/assistive technology, runtime persistence/Undo and full122-row/69-block acceptance remain NOT RUN by this reviewer. User visual acceptance and production readiness are not inferred.
