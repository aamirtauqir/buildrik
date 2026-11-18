# Buildrick Inspector control audit — 2026-10-18

Independent read-only source review. Application/Figma changes: NONE. Runtime and automated tests by this reviewer: NOT RUN. Source references are relative to `/Users/shahg/Desktop/pencil/buildrik/packages/editor`. Parent agent collects separate standalone-demo runtime evidence. Historical comments mentioning measured behavior are not fresh observation.

## Authority and scope

Read package AGENTS.md, CLAUDE.md, src/editor/AGENTS.md, root CLAUDE.md product-design-guard, the guard skill and its preservation, gates, ownership, geometry, navigation and editor-behavior references. Active brief decisions BD-08/18/20/22/23 preserve four-tab ownership, persistent target/scope and contextual property binding. No production-code, data or deployment work authorized in this review.

Current source has three tabs, Style / Behaviour / Effects (`src/editor/inspector/sections/registry/_shared.tsx:42`, `config/sectionOrder.ts:15`); the approved four-tab design adds Content and redistributes according to the existing contract. This is an implementation/design discrepancy, not permission to invent a new IA. Preserve Page, Theme toggle, multi-selection, role-denial, lock and conflict contexts.

The canonical 122-row preservation register remains `docs/audit-and-design-2026-10-16/evidence/inspector-2026-10-16/inspector-preservation-map.md` and its JSON. The accompanying `/tmp/buildrick-control-inventory.md` is a current-source section/control index, not another count of product features or replacement register. The earlier 69-block/120-native-route documentation remains authoritative within its recorded scope.

## Findings grounded in source

| ID | Finding and evidence | Proposed response | Risk / verification boundary |
|---|---|---|---|
| CUI-01 | Inspector CSS uses 108px label, 8px gap, 24px control and 12px label type (`src/editor/inspector/styles/inspector.css:248–278`). `ControlRow.tsx:43–60` advertises 44/64/90px; default sm actually delegates to CSS 108px. | One tokenized row contract and explicit density variants; preserve props while correcting misleading specification. | Rendered fit NOT RUN; active CSS/API discrepancy confirmed. |
| CUI-02 | `chrome-ui/FieldRow.tsx:25–31` defines 96px-label/32px rows; no live JSX consumers found by rg, only export. | Reuse the active row system; do not introduce another component. | Latent duplicate, not confirmed rendered inconsistency. |
| CUI-03 | SelectRow truncates label with title (`InputControls.tsx:461–467`); InputRow does not (`:77`), while CSS forces nowrap (`inspector.css:278`). | Consistent long-label wrapping or stacked treatment; source/reset affordances retain room; keyboard-accessible full label. | Long/narrow runtime NOT RUN. |
| CUI-04 | Field mixed/override state requires property key (`InspectorFieldContext.tsx:76–90`). PropertyField passes none (`sections/typeBlock/PropertyField.tsx:75–115`), reads only primary (`:177–189`) and writes targetIds (`:191–203`). | Explicit attribute-state representation and supported multi-selection behavior; do not imply primary value represents all selections. | Source wiring gap confirmed; reproduction NOT RUN. |
| CUI-05 | Unit selection substitutes suffix on same number (`InputControls.tsx:301–305`). | Specify intended conversion/retention behavior according to approved IC contract; any behavioral correction is separate implementation work. | Never imply current control preserves physical dimensions on unit change. |
| CUI-06 | Opacity provides numeric companion; RangeSlider prints value only (`SliderControls.tsx:130–175`). Filters and transforms use RangeSlider. | Ranged controls with precision field where needed; retain current ranges and stored expressions. | Precision proposal, not shipped capability. |
| CUI-07 | NUMBER_ERROR says choose unit separately (`InputControls.tsx:154`); parser accepts unit-bearing entries (`:203–213`). | Error copy must match supported syntax. | Code-confirmed mismatch. |
| CUI-08 | ContextRow suppressed on Behaviour (`ProInspector.tsx:327`); Desktop chip suppressed (`ContextRow.tsx:110`). | Follow approved persistent scope/identity. Differentiate global attributes from responsive styles. | Existing implementation differs from approved design; runtime NOT RUN. |
| CUI-09 | Spacing inputs 16px high, minimum 28px wide (`SpacingControls.tsx:49–58`); historical exception comment exists. | Show usable target zones or accessible expanded side controls; maintain compact summary and keyboard paths. | Comment does not establish WCAG conformance. |
| CUI-10 | Numeric attributes tabindex/maxlength/cols/rows are text configs (`config/attributeFields.ts:17`, `:63`; formBodies.tsx:54). | Rule-based integer control/validation where semantically appropriate, retain accepted existing values and defaults. | Runtime invalid-value acceptance NOT RUN. |

## Functional contracts that visual refinement must retain

- `shared/controls/InspectorFieldContext.tsx:21–31`: locked/conflict read-only reason; mixed keys; breakpoint/pseudo/master overrides; reset callback and discrete undo. Do not rebuild per control.
- `shared/controls/InputControls.tsx:228–298`: live numeric input, retained invalid draft, Enter/blur commit, Escape restores focus-time authored value, arrows ±1 and Shift ±10, token-bound blur protection. The stale 300ms comment in FieldContext is not the current writer timing contract.
- `shared/controls/ButtonControls.tsx:36–58`: radio-group semantics, roving tab stop, arrows/Home/End, no selected radio for mixed, discrete writes.
- `shared/controls/CheckRow.tsx:29–47`: indeterminate mixed state; accessible label; read-only refusal.
- `sections/behaviourRows.tsx:38–83`: CommitRow local draft, Enter/blur commit, Escape restore, optional datalist. Do not replace with per-keystroke mutation merely for consistent styling.
- `hooks/useStyleHandlers.tsx:233–336`: context-aware live/rate-limited writes, pending flush, command lock gate, multi-target transaction; device hide keys explicitly write base scope at :270. Retargeting while pending must preserve original target.
- `tabs/InspectorTabContent.tsx:95`: capability intersection across selection; type block hidden when types have incompatible bodies.
- `shared/controls/Section.tsx:163–238`: open/summary/empty-add, keyboard disclosure, Alt-toggle-all, summary and override markers. A closed section must retain active-setting visibility and saved data.
- `ProInspector.tsx:252–279`: scroll memory; :316 Page branch; :324 Theme toggle branch; :348 multi-select bar.
- `components/PagePanel.tsx:101–150`: active page-root target, active breakpoint, conflict/lock gate and exact page SEO destination.
- `shared/controls/ColorInput.tsx:115–169`: token unlink/relink state, named token and exact Brand destination. Color is website data; chrome accent tokens are not written into site styles.

## Regression map and consumers

| Risk ID | Affected files/consumers | Failure to prevent | Acceptance requirement (NOT RUN here) |
|---|---|---|---|
| RR-01 | InputControls, InspectorFieldContext, useStyleHandlers; all numeric/style consumers | Typed draft/queued write lands on newly selected element, breakpoint or pseudo state. | Edit → change target/scope immediately; original edit remains original, new target unchanged; undo coherent. |
| RR-02 | ColorInput, SpacingControls, SizeSection, Typography, TokenPickerPopover | Displayed resolved value replaces token on blur; reset erases base or shared token. | Bound value focus/blur/Escape, unlink/relink, reset at Tablet/:hover/master; save/reopen with binding intact. |
| RR-03 | MultiSelectBar, PropertyField, type bodies, capability registry | Primary value falsely shown as common; locked members mutated; unsupported attributes broadcast. | Same/mixed type selections, mixed attributes/styles, one locked member, correct scope and one undo step. |
| RR-04 | SpacingControls, BorderSection, SizeSection, layout/GapRow | Units lost, auto/normal/calc/custom values coerced, linked edits partial. | Different side units, unitless line height, CSS expressions, linked/unlinked values; undo/reopen. |
| RR-05 | effects/effectValues, FiltersSection, TransformMotionSection, ShadowSection | Editing one component discards another filter/transform/shadow or custom CSS. | Existing composite expression → edit one control; other functions and ordering preserved where meaningful; output parity. |
| RR-06 | PropertyField/attributeWriter, formBodies, FormFieldsSection, layoutBodies, widgetBodies | Structure loss: columns shrink, options rewrite, form name/default changes, progress max inconsistent. | Old populated structures, confirmed destructive changes, preserved labels/values/IDs, one meaningful undo. |
| RR-07 | SourceRow, ColorInput, CmsBindingSection, CollectionListSection, ComponentRow | Picker/library navigation loses draft or assigns to wrong field; shared resource scope unclear. | Exact target return/cancel, deleted target/permission change, selection persistence, no accidental assignment. |
| RR-08 | ContextRow, PagePanel, ProInspector, sectionOrder | Global attributes falsely appear responsive; Page/Theme context replaced by generic element controls. | Empty/Page/Theme/single/multi/locked/conflict views plus Desktop/Tablet/state scopes. |
| RR-09 | inspector.css, ControlRow, ButtonControls, SliderControls; all Inspector sections | Narrow panels clip labels/unit/reset controls; shared chrome mutation affects unrelated panels. | 300px default and approved min/max, short viewport, long names, error + source badges, keyboard-only full access. |
| RR-10 | chrome-ui Button/TextInput/Select/Checkbox/IconButton, generated tokens | Global styling breaks shell/Assets/CMS/Brand consumers. | Prefer Inspector-scoped compatible variant; inventory global consumers before global token mutation. |

## Incoming parent observations — not independently verified by this source audit

Parent reports swapped Figma Icon instances are width16 with width24 SVG children, overflowing glyph bounds; this is plausible visual root cause and requires independent screenshot/node review before PASS. Parent reports approved row arithmetic typo: 300−24−88−8 = 180px, not 192px. Arithmetic independently checked; correction preserves panel width/IA. Parent reports Hero container selected while Content says Text content; source `ELEMENT_CAPABILITIES` gives hero a container profile (`src/shared/constants/elementCapabilities.ts:162`), with no text type block. Proposed Hero Content must reflect selected container and navigate to a child for actual text editing. No new container text value should be invented.

## Limits and readiness

Static registry coverage is broader than deep write-path verification. Dynamic rows, collection schemas, per-instance variants, author custom CSS/attributes and block/native routes are not exhaustively enumerated by a regex/source index. Their canonical coverage remains existing preservation/BIC records. This review does not revalidate all 122 rows or 69 blocks at runtime.

G1 source evidence sufficient for bounded shared-control refinement; G2/G3 approved ownership constraints identified; G4 geometry NOT RUN here; G5/G6 source contracts inspected, actual flow/accessibility NOT RUN; G7 static preservation index supplied but full runtime equivalence NOT RUN; G8 implementation NOT RUN; G9 source audit/inventory delivered, Figma handoff review pending. Readiness: bounded audit complete; design review pending; no implementation completion claim.
