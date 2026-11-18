# Targeted unit source review — 2026-10-18

Read-only static source inspection. No app edits; runtime NOT RUN. New Figma unit board review pending node IDs. Unit menus in proposed Figma designs must not be presented as implemented behavior.

| Property | Current source evidence | Implemented options / semantics |
|---|---|---|
| Font size | src/editor/inspector/sections/typography/FontControls.tsx:65 | px, em, rem, %, vw |
| Line height | FontControls.tsx:76 | px, empty-string unitless, em, %, normal keyword. Unitless shown × by InputControls.tsx:380; normal replaces value rather than suffixing number. |
| Letter spacing | sections/typography/TypographyControls.tsx:60 | px, em; normal keyword |
| Word spacing | TypographyControls.tsx:70 | px, em; normal keyword |
| Width / Height fixed | sections/SizeSection.tsx:275 | px, %, rem, vw, vh; Hug/Fill/Fixed is separate sizing mode, not a unit. Fill measurement must remain readout until deliberate edit. |
| Page max width | SizeSection.tsx:352 | px, %, rem, vw; no vh option here |
| Element min/max | SizeSection.tsx:370–381 + shared/controls/InputControls.tsx:220 | Uses default px, %, em, rem, vw, vh, auto list; this is current code evidence, not blanket CSS-validity endorsement of auto for every limit property. |
| Gap / row gap / column gap | sections/layout/GapRow.tsx:13,25–38 | px, rem, em, % |
| Border width | sections/BorderSection.tsx:119 | px, em, rem; no % |
| Uniform border radius | BorderSection.tsx:105 | px, %, em, rem |
| Individual radius corners | shared/controls/SpacingControls.tsx:317–342 | Shows parsed existing suffix; numeric entry writes px (:333). No editable unit menu. This inconsistency is an existing source gap. |
| Margin / Padding sides | SpacingControls.tsx:85–90,143–173 | Numeric edits retain each side's existing unit; empty, auto, inherit accepted. No unit menu. Typed arbitrary CSS such as 2rem is not committed by this handler and blur restores parsed stored value. Can display other-unit existing values; do not equate this with raw CSS editing support. |
| Opacity | sections/effects/OpacitySection.tsx:13–26 | Fixed % UI0–100; serializes decimal v/100. No unit selector. |
| Scale | sections/effects/TransformMotionSection.tsx:42 | Fixed % UI; serializes unitless scale v/100. |
| Rotate / Skew | TransformMotionSection.tsx:44,47 | Fixed ° UI; writes deg. No selectable unit menu. |
| Move X / Y | TransformMotionSection.tsx:45–46 | Raw text input preserving transform argument string, no current unit menu. |
| Duration / Delay | TransformMotionSection.tsx:51–52 | Raw text input, no current ms menu. Proposed numeric time control must preserve seconds as well as milliseconds and existing CSS expressions. |

Shared InputWithUnit parser (InputControls.tsx:203–213) accepts numeric suffix only if included in property units; keywords only if included. Existing onUnitChange (:301–305) replaces suffix while retaining numeric magnitude, not physical/computed unit conversion. Document this mismatch against any approved conversion contract; do not claim conversion implemented. Keyword choice replaces the entire value. Exposed editable nested Unit component is Figma authoring structure, not proof of keyboard interactions in the application.

Design criteria: property-specific option sets; visible px/%/rem etc examples; full accessible names such as Font size unit; explicit Unitless choice distinct from normal keyword; no dropdown affordance for fixed opacity/angle display; maintain sizing modes and source/reset scopes; preserve existing unsupported/custom values rather than coercing them during open/close. The source list is a baseline, not the exhaustive CSS grammar.
