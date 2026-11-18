# Shell and Inspector control refinement

2026-10-18 · DESIGN ONLY · audit and specification precede Figma edits.

**Editor-wide action rollout, BD-28 /2026-10-19:** existing scenes now share4px action/search geometry, light command styling and reusable navigation Link states. This supersedes earlier unchanged-button-radius wording while retaining32px targets and28px property fields. See [rollout scope and evidence](../figma-design-execution/editor-style-rollout.md); no application implementation or missing-module completion is implied.

**Unit omission corrected, subsequent user follow-up:** property-specific unit menus, visible %/em/rem/viewport/time/unitless examples, keyword modes, Custom and mixed-unit states are now represented in [CSS values and units](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=51-1405). [Unit contract and source mapping](css-unit-contract.md) governs the new selectors and distinguishes existing implementation gaps. Existing authored journey values and application code were not changed.

## Current visual revision — compact value and unit controls, latest follow-up 2026-10-18

User explicitly requested smaller controls, numeric values in inputs, separate px/% dropdowns, and cleaner icons. This supersedes the earlier 32px field / 6px radius treatment **for Input, Select, NumericUnit, ColorControl, UnitSuffix, TextAlignment and their property-row consumers**. Buttons, rail actions, section headers, checkbox/toggle targets and broader shell geometry keep their existing contracts.

- Field height28, radius4, readable12px type and8px value inset. Numeric input and40×28 unit trigger are separate surfaces with4px gap. A180px row allocates136px to the value; a134px paired field allocates90px. CompactProperty is134×48 (label16 + gap4 + input28), with8px between columns.
- Unit changes use the property-specific menus and INS-D11 conversion rules. Fixed opacity% / rotation° suffixes stay inside one quiet field, without a caret; integer counts have no suffix. Disabling the numeric control also disables the unit selector.
- Unit/select caret12px with1.2px round stroke; text alignment glyph14px with1.25px stroke and three aligned bars. Left/Center/Right/Mixed states remain distinct.
- Figma geometry tokens: size/property-control-height=28; size/unit-control=40; existing radius/sm=4 and spacing/4 reused. These are design tokens only, not exported application CSS.
- Long labels grow the label area. Long numbers and custom expressions use the existing expanded full-width/stacked form instead of squeezing into a90px value region. More than two related fields stack; narrow panels do not shrink text or truncate editable values.
- Preserved master IDs, exposed Value/Unit properties, authored values, selection scope and inherited/override indicators. Shared consumers updated on Components, Editor, Inspector, Recovery and Journey pages.

Visual checks: final [editor](compact-editor.png), [controls](compact-controls.png) and [unit matrix](compact-units.png) retain readable labels, visible focus/errors and distinct editable/fixed units. [Independent compact review](compact-independent-review.md) checks this bounded scope. Keyboard operation, actual conversion, persistence, Undo and full responsive/runtime coverage remain NOT RUN in this static Figma pass. User acceptance is not inferred.

## Previous visual revision — Figma-like controls, earlier follow-up 2026-10-18

User rejected the first control styling and explicitly asked for components closer to Figma controls. This authorizes a visual refinement of existing components, not application implementation. Scope is C3 shared presentation: existing Input/Search/Select/NumericUnit/ColorControl/Textarea, segmented controls, secondary buttons, property labels and associated Inspector grouping. Ownership, values, write scope, navigation and32px targets remain intact.

**This revision supersedes the earlier visual dimensions below where they conflict:** regular fields now use existing radius/md=6, bg-subtle fill and border token; hover uses border-input, focus uses white surface/accent focus, error retains semantic error border and error-text. Labels/value text use12px Meta/Value styles. Regular row88/8/180 remains available. Related pairs use134px columns +8px gap, persistent16px label +4px gap +32px field (52px total). Section vertical inset8 and gap4; horizontal inset12. This is a deliberate paired-layout refinement, not narrower interaction targets or a new density setting.

Same-section pairs: Font size/Weight, Line height/Letter spacing, Width/Height. Font-size override/reset/source remains explicitly named and outside the pair. Reused existing field/control nodes so journey targets remain stable. Compound inputs retain units, source and error semantics. New CompactProperty45:1073 exposes Label and Control; TextAlignment43:1271 has Left/Center/Right × Default/Focus/Disabled plus Mixed/default. Mixed shows no selected icon and a visible Mixed label. Slots are correctly named; stale text properties removed. Accessible names, radio keyboard navigation and hover/focus tooltips are specified, not executed by this static design.

Compared retained outlined form controls with a neutral filled treatment. Chose filled controls plus paired rows because they reduce repeated border weight and use the existing300px Inspector more effectively. Did not remove labels, reduce targets or relocate product features. The official [Figma UI3 discussion](https://www.figma.com/blog/our-approach-to-designing-ui3/) and its control illustration were inspected as a visual benchmark, not copied as Buildrick functionality or treated as proof of its implementation.

[Updated editor](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=7-20634) · [Focused component sheet](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=45-1083). Applied45 paired groups across editor/recovery/journey samples and shared primitive changes to dependent contexts. Source audit/runtime baseline from earlier in this task remains unchanged; no new app behavior is claimed. Final visual review is recorded in v2-independent-review.md. Full runtime/accessibility/122-row verification remains outside this design-only visual revision.

Handoff: preserve exact props/handlers and captured-selection semantics when implemented later. Keep12px labels readable; long paired labels wrap and grow the pair; at insufficient width stack rather than truncate. Color and mixed values are not zero. Filled fields remain keyboard focusable with an explicit focus outline. Final review does not establish WCAG conformance.

V2 final review: [independent report](v2-independent-review.md) closed V2-01–04 and verified alignment API cleanup, Mixed specimen and Tablet label geometry. Final screenshots: [editor](v2-editor-after.png), [controls](v2-controls-after.png), [Tablet override](v2-tablet-after.png). Additional final readback repaired missing Value bindings in all three Hover masters (32:692/32:695/32:699); the displayed24 now follows the instance property. No application source/package changes. Full keyboard/runtime/variant verification and user acceptance remain unverified.

This execution annex belongs to PRODUCT-DESIGN-BRIEF.md. User rejected the first shell/editor visual pass and requested control-level refinement in the existing Figma file `2L9OTGzBrL6kYmU18yA1c7`. Preserve approved IA, four tabs, feature ownership, workflows and saved values. Application implementation, generated-token export and deployment are not authorized. Existing uncommitted work is preserved.

## Scope and evidence

Shared control changes are C3. Deliver source audit, control taxonomy/specification, editable Figma refinements, before/after inspection and independent review. Readiness is bounded to represented controls/states, never all 122 Inspector acceptance rows or all 69 block workflows by inference.

Primary evidence: current Inspector registry, type-field configuration, shared controls, chrome-ui; FD-INS-02/03 and SC-27. Runtime: fresh standalone demo `http://127.0.0.1:5050/` at 1440×900; Page appearance and inserted Text Style controls inspected through accessibility snapshots. This is not a real persisted site. Browser recovered after a transient daemon failure; the Text screenshot was captured. Sampled current inputs are 24px high with 12px type; these are baseline measurements, not the proposed32px production UI.

Figma baseline: J-F1.01 screenshot and component/node readback. Existing Figma output is being refined, not used as proof of implemented product behavior.

| ID | Observed issue | Refinement |
|---|---|---|
| CR-01 | Figma 16px icon instances contain 24px SVG children after swaps; oversized glyphs visible in shell | Fix icon constraints/scaling across existing consumers; retain 32px action targets and 20px rail glyphs |
| CR-02 | `inspector.css:248–278` uses 108px labels/24px controls; ControlRow nominal presets disagree; unused chrome-ui FieldRow has another system | Adopt approved 88px label, 8px gap, 32px control; future code must consolidate the existing primitive |
| CR-03 | J-F1.01 selects Hero but offers editable Text content | Container gets appropriate Content; text controls only on a text target |
| CR-04 | Current app still has three tabs; approved design has four | Preserve approved Content/Style/Behavior/Effects and scoped group ownership; report implementation lag |
| CR-05 | Select labels truncate, InputRow labels inherit nowrap | Wrap/stack long labels without smaller type or tooltip-only meaning |
| CR-06 | RangeSlider has printed value; opacity alone has editable number | Specify precise numeric companion for continuous visual properties |
| CR-07 | PropertyField reads primary attributes and writes selection; does not supply property key for mixed state machinery | Mixed attribute example is intended design; implementation wiring needs correction and runtime test |
| CR-08 | Current unit handler appends suffix; INS-D11 requires contextual conversion | Explicit conversion/disabled reason contract; Figma cannot certify engine conversion |
| CR-09 | Brief's available control width says 192 | Arithmetic correction: 300−24−88−8 = **180px**, preserving approved geometry |

Source reviewer report and current section inventory accompany this record. Frequency and usability improvements are design hypotheses, not research findings.

## Decision and ownership

Refine existing local masters in place and add missing control families to the current library. Local components already match Buildrick variables/fonts and take priority over the available community Input/Select kits. Rejected alternatives: Inspector-only styling leaves shell defects; replacing shell/navigation creates unnecessary migration and violates scope. No new workspace, density setting or feature.

Keep Site settings in topbar; Assets/CMS/Brand in rail; Pages/status in bottom; canvas view controls local. Content/attributes generally affect all breakpoints. Style/Effects identify active breakpoint and authored state. Device visibility differs from breakpoint selection. Brand owns shared tokens; instance and main-component writes stay distinct. Deferred class authoring, AI and commerce remain deferred under current owner decisions.

## Taxonomy

| Value/task | Control and rationale | Interaction/validation |
|---|---|---|
| Free-form string | Text input; ID, alt, name, URL | Property-specific validation; retain draft; no focus-only write |
| Multiline/structured content | Textarea or structured list | Preserve identity/order and custom values; parser errors do not overwrite valid content |
| Precise number/unit | NumericUnit; size, spacing, typography, offsets | Legal units/keywords; finite/range checks; ↑↓ ±1, Shift ±10; Escape restores; invalid draft retained |
| Small mutually-exclusive set | Segments if labels fit | Radio semantics, one tab stop, arrows/Home/End; visible selection |
| Longer enum | Select; weight, tag, fit, border style | Keyboard selection/search; current value readable; unsupported legacy value retained |
| Continuous visual range | Slider + exact input | Drag preview, one commit/Undo; typed values preserve valid values beyond convenience slider range |
| Immediate binary setting | Toggle | Accessible label, state and disabled reason |
| Independent flags/inclusion | Checkbox; visibility, required, playback flags | Checked means true; indeterminate for Mixed; never mutually-exclusive segments |
| Color | Swatch + value/token + picker | Local/token scope explicit; Brand source link; no silent shared-token edit |
| Compact action | IconButton | Named target/action; hover and focus tooltip; 32 target, or 24 in-row with 8 separation |
| Composite property | Stacked editor; spacing, border, shadow, transforms | Individual labels/units, linking explicit, preserve Custom expressions and other functions |
| Context-dependent property | Conditional row | Show applicable fields and explain retained inactive values; never clear on context switch |

## Row and component specifications

- Panel 300; section inset 12 → 276 content. Row 88 label + 8 gap + 180 control. Use existing tokens; new dimensions become documented Figma-only aliases until a later implementation task.
- Property fields now28 high with12px labels/value type; row gap8. Wrapped two-line labels grow the row. Helpers/source/error stay below, never overlapping the next row. Current compact revision above governs affected field geometry.
- Compact means two134px property columns with28px fields; expanded means stacked label and full-width composite. More than two inputs stack. Long/custom values use the expanded form.
- Affected input radius4; button geometry remains unchanged. General glyph16, rail/toolbar glyph20; specific control carets12 and alignment glyphs14. Unit selector40×28; fixed units have no dropdown affordance. Focus: accent border + existing2px focus effect.
- Section header 32; disclosure left; count/actions right. Collapsed configured sections show `N set`/override count. Identity/scope/tabs fixed; body owns scrolling; no nested permanent scroll regions.
- States where applicable: default, hover, pressed, focus, disabled-with-reason, error, inherited, overridden, mixed, expanded. Mixed is literal text, indeterminate check or split swatch; not empty/zero. Disabled explanation stays readable.
- Three override signals: scope line, section count, field dot/source line. Reset names removed layer and resolved fallback. Never substitute arbitrary zero. Source does not replace property label.
- Color picker retains token/local choice, exact value and opacity where supported. Close/cancel returns focus to captured field. Slider offers exact numeric editing and custom-expression preservation. Checkbox/toggle row is 32 even when glyph is 16.
- Accordion Enter/Space; select arrows/typeahead; segments roving tab; tooltip hover/focus. Nonmodal Inspector does not trap focus. Popovers clamp/flip and Escape returns to trigger. Modal patterns only for actual modal tasks.
- Selection change flushes valid pending writes to captured IDs; invalid draft follows shared guards/INS-D11. Preserve one Undo per gesture, token reference identity, mixed selection atomicity and exact resource return.

## Geometry and future implementation risk

1440×900 budget: 56 rail + 284 drawer + 800 canvas column + 300 Inspector. Topbar 56, bottom 32, canvas toolbar 44 → canvas column height 768. Authored Desktop remains 1440. ≤1366 uses the approved 300 overlay plus 12 inset; ≤1280 retains approved peek/task behavior. No panel widening or breakpoint changes.

Future affected files: Inspector ControlRow/InputControls/SliderControls/ColorInput/Section/InspectorFieldContext/PropertyField/ProInspector/ContextRow/registry/inspector.css; shared chrome-ui only after consumer checks. No such files changed here. Reuse actual props/handlers rather than duplicate state logic.

Required future regressions: focus/blur without mutation; unit conversion independent of zoom; token preservation; delayed writes cannot land on next selection/breakpoint; multi-select mixed/locked atomicity; per-side units; effect composition; Page/Theme contexts; invalid draft Preview/Publish guards; save/reopen; one Undo per gesture. Full per-property map remains the existing preservation register, not a newly invented feature list.

## Validation status

**Sampled design refinement reviewed; full editor completion is not claimed.** Current-source audit covers25 section registrations and19 type-body registrations, with21 control families mapped. Current app was inspected; application source was not modified. Existing uncommitted engineering/design-instruction changes were preserved.

Refined existing editor frames in place and propagated shared geometry to companion/recovery/journey specimens. Root journey frame IDs remain stable. Corrected oversized glyphs, leaf disclosures, row alignment, unit affordances, context-specific content, precise range companions and color/source controls. Added eight contextual Inspector specimens, native reusable controls and the approved II-06 Brand/local color flow. Recent/eyedropper were not introduced.

Independent reviewer closed R-CR-01–05: Hover variants, local-picker completeness, row alignment, unsupported Recent removal, and shared/local color-path preservation. Default1440×900 and sampled1024×768/1440×600 shells were inspected. This is visual/readback review, not prototype playback or a runtime test of proposed changes. [Review](independent-review.md) records exact bounds.

The expanded shared-color specimen is280×782. Handoff: width280, max-height viewport−24 with12px edge inset; sticky identity and commit actions, one scrolling body, focus scrolled into view, draft retained, Escape returns to the captured trigger. This clamp/scroll behavior is specified, not runtime verified.

**Remaining:** complete visual variant matrices for Slider/ColorControl/Segments/UnitSelector and expanded border/custom conversion states; full122-row/69-block checks; production keyboard/screen-reader behavior,200% reflow, persistence, undo/redo, unit conversion, failure/race tests and output regressions. These are NOT RUN, not waived. No accessibility-conformance or production-readiness claim. User visual acceptance is pending; no code-implementation authorization is inferred.

## Reviewable deliverables

- [Refined editor](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=7-20634)
- [Reusable control architecture](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=32-1754)
- [Eight Inspector contexts](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=36-2)
- [Color ownership and commit flows](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=39-9114)
- [Source audit](source-audit.md), [section/control inventory](control-inventory.md), [component contracts and token handoff](component-specifications.md)
- [Figma before](figma-style-before.png) / [Figma after](figma-style-after.png), [actual app baseline](runtime-text-before.png)
- [Controls](figma-controls-after.png), [contexts](figma-contexts-after.png), [color flows](figma-color-flow-after.png)

Scripts and JSON ledgers retain created/mutated node provenance. The main brief remains canonical; this annex does not reopen approved IA or publish the component library.
