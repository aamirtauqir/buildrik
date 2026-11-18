# R39 — Inspector appearance source-contract audit

13 October 2026. Read-only source/control-register audit for the next design pass. Existing improved Figma page `8463:2`, file `g4GzQFqzNYz5sosz1QtZXC`. Only this report was authored by the source auditor. No application/test changes, Figma writes, browser manipulation or register/status edits.

`R38-TYPOGRAPHY-OUTPUT-QA.md` and the latest `STATUS.md` report bounded Text/Heading/Paragraph/Label name → size → specimen work and 112 authored-action checks. This auditor read those reports but did not independently verify the actions. R37 typography limitations are historical inputs; R38 supersedes them only for its documented finite scope.

## Decision for the next pass

Route Icon size to the existing Style / Size controls. Give SVG glyph Stroke width its own conditional control within the existing canonical Style surface, using the existing shared control component. **Do not route glyph Stroke width to Border / Width.** The source has separate properties and no existing SVG-stroke control in the inspected shared registry. Settings may retain links to these owners, plus the glyph-selection action.

The current source's icon metadata is not a reliable rendered-value contract. A label/persistence-only correction would repeat the R37 text-style gap. The finite Figma specimen must visibly resize the glyph and change its stroke, and its assertions must check those outcomes separately from variable writes.

## Priority findings and exact destinations

| Priority / finding | Register row and existing node | Required next action |
|---|---|---|
| P1 — Size metadata and rendered size can diverge | `icon:2`, Settings field `8843:21895`, root `8843:21669` | Change Settings value to `Edit in Style →`; route to canonical Style `8841:14864`, Size section, existing Width `8841:14994` and Height `8841:14999`. Display actual finite pixel values as well as Fixed mode; connect them to the visible icon specimen. |
| P1 — Glyph stroke is a missing canonical property, not box border | `icon:3`, field `8843:21901`, root `8843:21669` | Settings link opens a conditional `Icon appearance` group in the same Style surface, focused on `Stroke width`. Reuse a shared field instance/master; preserve existing Border Width `8841:15139` as `border-width`. Record the new glyph-control ID after authoring; none is present in the R36 register. |
| P1 — Change icon can overwrite appearance from stale metadata | `icon:1`, field `8843:21889`, root `8843:21669` | Keep Settings `Change icon` for glyph identity. In the improved replacement flow retain current appearance; size/stroke/color controls must route to their canonical Style owners or explicitly share the same state, rather than introducing another independent store. This is a proposed corrected contract, not existing implementation behavior. |
| P1 — Columns structural count has no inventoried Settings control | Columns Settings root `8843:25014`; CSS grid count `style/layout:Columns` / `8841:14909` | Preserve the source capability to add/remove column child elements with a separately named Settings control `Column elements`. Do not substitute CSS grid track count, which has different effects. No row/control ID exists for the structural count in the supplied register. |
| P2 — Columns gap reads a legacy attribute but writes base CSS | Columns root `8843:25014`; canonical `style/layout:Gap` / `8841:14919` | Canonical Style / Layout Gap reads/writes CSS gap. Add a Settings navigation link only if needed for discovery; do not create another `data-gap` value. |
| P2 — Source and improved-design tab organization differ | Flex `8843:24210`, Stack `8843:24478`, Grid `8843:24746`, Columns `8843:25014` | Verify Style routes expose the appropriate layout controls for each type; do not blindly port the source `layout:false` gate and hide the only owner. |

Node IDs above are verified against `R36-INSPECTOR-CONTROL-REGISTER.csv`, not against a fresh native Figma read. Source facts below have file/line evidence. No live runtime behavior is certified by this report.

## Icon size: verified source facts

- Eligibility: Icon and SVG share the `svg` type block, but the body renders these two rows only for `element.type === "icon"`; generic SVG gets Source. Evidence: `src/shared/constants/elementCapabilities.ts:136`, `src/editor/inspector/sections/typeBlock/bodies/mediaBodies.tsx:118`, `:134`.
- The row writes `data-icon-size`, with string choices `16`, `20`, `24`, `32`, `48`, `64`, displayed in px. These are the Settings/type-body choices, not the complete supported CSS size range. Evidence: `mediaBodies.tsx:120`.
- `PropertyRows` reads the primary element's attribute, returns empty when absent, and writes through `writeAttribute` for the icon keys; they are not in its specially routed set. Evidence: `src/editor/inspector/sections/typeBlock/PropertyField.tsx:141`, `:154`, `:191`.
- The write filters locked/missing targets, then uses one transaction for all writable target IDs. Generic attribute handling only sets/removes the named attribute. `ElementStyles.setAttribute` stores the attribute, records an instance attribute override, emits ELEMENT_UPDATED and marks dirty; it does not transform icon metadata into SVG attributes. Evidence: `src/editor/inspector/sections/typeBlock/attributeWriter.ts:52`, `:161`; `src/engine/elements/ElementStyles.ts:38`; lock behavior `src/engine/commands/commandOperations.ts:192`.
- New Icon block defaults are literal wrapper `width:32px`, `height:32px` and `data-icon-size="32"`. Its embedded SVG separately has `width="32"`, `height="32"`, `viewBox="0 0 24 24"`. Evidence: `src/blocks/Media/Icon.tsx:20`, `:52`, `:63`.
- The icon picker replacement handler also writes wrapper base width/height from its numeric size; it does not use `setStyleAt`, and it does not change the embedded SVG content in this function. Evidence: `attributeWriter.ts:173`.
- Search of production `.ts/.tsx/.css` sources found `data-icon-size`/`data-icon-stroke` only in the block and the Inspector body/writer. This supports an unresolved render-synchronization defect; it is not browser evidence that all icon entry paths fail.

### Size control contract to author

Use canonical Width and Height. A square-size preset may change both in one transaction, but do not claim the current source has a lock-aspect-ratio control. Explicitly state whether the finite prototype edits both dimensions; keep any future independent dimensions legible. Suitable bounded fixture: base 32 × 32 px, Mobile override 48 × 48 px, visibly different glyph sizes, and return to Icon / Mobile / Settings.

The general source Size control permits `px`, `%`, `rem`, `vw`, `vh`; Fixed/Fill/Hug are separate semantics. Fill writes `100%`, Hug writes `fit-content`, Fixed retains an existing fixed value or uses `200px` when no measured/current fixed value is available. Unset width is displayed as Fill and unset height as Hug; that is a general row heuristic, not proof of a correct intrinsic icon size. Evidence: `src/editor/inspector/sections/SizeSection.tsx:39`, `:46`, `:182`, `:270`.

Copy: `Icon size` → `Edit in Style →`. Style helper: `Width and height of this icon.` Do not imply the source preset's six choices are global CSS validation limits. Empty removes the current declaration; zero is a literal length, not reset. Default 32 px is the new-block fixture default, not a universal inherited value. The picker permits size 12–96 through a clamped numeric field (`src/editor/media/IconPickerModal.tsx:295`), so reducing all icon editing to 16–64 would lose an existing capability.

Reset and Undo must restore values and override presence. For a bounded Mobile fixture without Tablet override, reset removes only Mobile width/height and reveals the base values; it does not write 32 into Mobile. General deletion behavior is verified at `commandOperations.ts:267`. Full Tablet cascade, pseudo-state routing, token sizes, custom aspect ratios, real preview/export and all arbitrary CSS units remain open.

## SVG glyph Stroke width: verified source facts

- The type-body row writes string attribute `data-icon-stroke` with choices `1`, `1.5`, `2`, `2.5`, `3`; labels have no px suffix. It follows the same attribute-only path and lock/transaction behavior as Icon size. Evidence: `mediaBodies.tsx:126`, `PropertyField.tsx:191`, `attributeWriter.ts:52`.
- The new Icon block separately embeds SVG `stroke-width="2"`, `stroke="currentColor"`, and `fill="none"`; wrapper metadata also starts at 2. Evidence: `src/blocks/Media/Icon.tsx:20`, `:68`.
- Source icon picker uses numeric Stroke 0.5–4 in 0.5 steps, displayed to one decimal; its Lucide preview receives `strokeWidth` directly. Evidence: `src/editor/media/IconPickerModal.tsx:162`, `:305`.
- Existing shared Border Width writes CSS `border-width`; its registry also covers borders, radius and outlines, with no SVG `stroke-width`. Evidence: `src/editor/inspector/sections/BorderSection.tsx:115`, `src/editor/inspector/sections/registry/box.tsx:117`.
- Brand has a separate token `icon-stroke`, value 1.5 and type number; Icon block/picker defaults are 2, with no binding in these inspected paths. Brand also defines Icon SM/MD/LG at 16/20/24px. Do not label block defaults `Inherited from Brand`. Evidence: `src/engine/designSystem/defaultTokens.ts:661`, `:670`.

### Stroke control contract to author

Use the existing shared numeric/choice field design in a conditional Style `Icon appearance` group. Label `Stroke width`; helper `Thickness of the icon's outline.` Keep the displayed value unitless, matching the SVG/picker source contract; do not append px or reuse the box-border variable. Preserve access to 0.5–4 in 0.5 steps if authoring full source parity. A 2 ↔ 3 finite fixture is acceptable only when explicitly documented as a bounded demonstration.

For the immediate faithful fixture, label scope `This icon · all breakpoints`: the inspected metadata path is document-global and has no breakpoint/pseudo argument. Changing to responsive SVG styling would be a separate improved-design contract requiring renderer/serializer reconciliation; do not silently present source metadata as a Mobile override. Choosing Desktop/Mobile may preserve authoring context while the global stroke remains the same.

`Reset stroke` to the source fixture default 2 must be distinguished from removing a breakpoint override. If the prototype instead models a future responsive stroke property, explicitly identify that intended behavior and keep runtime parity open. Either reset captures previous value for one-step Undo. The current select's blank `Default` removes the metadata attribute (`InputControls.tsx:450`, `:492`; `attributeWriter.ts:161`); this alone does not establish glyph reset. `getCurrentIconConfig` then falls back to 2 (`attributeWriter.ts:216`), while the embedded SVG still holds its own value. Do not use this mismatch as a successful reset model.

The native Figma specimen must have a stroke that actually changes thickness while its dimensions and wrapper border remain unchanged. Missing/non-outline glyphs need an explicit eligibility or disabled reason; generic SVG applicability and filled/duotone support are not established by the current Icon-only source row.

## Picker / color overlap and state hazards

`getCurrentIconConfig` reads metadata, defaults missing size to 32, color to white and stroke to 2, and returns library `lucide` (`attributeWriter.ts:204`). The picker initializes a no-current-icon size of 24 and returns name, library, size, color and stroke on Select; Cancel closes without that callback (`IconPickerModal.tsx:72`, `:145`, `:343`). Replacement commits all metadata plus wrapper base width/height/color (`attributeWriter.ts:173`). Thus simply replacing a glyph can reapply stale appearance and base styles after canonical Style edits. This is a verified write-path risk, not a replayed runtime failure.

The default SVG additionally contains an inline white `color`, while the wrapper has its own color (`Icon.tsx:32`, `:60`). The canonical Style Typography Color row `8841:14984` cannot simply be assumed reachable for icons: source capability sets Icon typography to `none` (`elementCapabilities.ts:91`, `:137`). If adding Icon Color to Style, reuse the existing color-field component but give it a truthful glyph target and applicability; do not describe it as a completed existing canonical route.

Recommended replacement copy: `Change icon` and `Use icon`; show current appearance as a retained summary. This keeps identity editing discoverable without another appearance store. Author and verify Select/Cancel, appearance preservation, captured target, return context and Undo before counting this route accepted.

`PropertyRows` reads on composer/element/type/row changes and then keeps local values; it does not subscribe to element update events, and it updates local values even after a generic write returns no writable targets (`PropertyField.tsx:177`). Mixed-value aggregation is not passed into these rows. Treat locked, mixed, external update and Undo refresh behavior as open, not a reason to show fake successful edits in the prototype.

## Other Settings appearance candidates: preserve semantic distinctions

1. **Flex / Stack / Grid:** source already reuses `FlexControls` and `GridControls`; its type block belongs to the Style tab (`layoutBodies.tsx:42`, `src/editor/inspector/sections/registry/type.tsx:15`). Their general Layout section is gated off because the type block owns those controls (`elementCapabilities.ts:151`, `registry/box.tsx:45`). The improved Figma tab architecture must keep one reachable canonical Layout owner. Direction `8841:14894`, Align `8841:14899`, Wrap `8841:14904`, grid Columns `8841:14909`, Rows `8841:14914`, Gap `8841:14919` are existing destinations. No additional duplicate Settings layout row was found in the supplied register.
2. **Columns gap:** choices None/8/16/24/32px are configured as `data-gap` (`layoutBodies.tsx:28`). Reader gets that attribute, but routed writer calls `el.setStyle("gap", value)` directly (`PropertyField.tsx:148`, `:160`; `attributeWriter.ts:104`). That reads/writes different stores and bypasses breakpoint style routing, although the outer write is lock-gated/transactional. Canonical Gap supports px/rem/em/% plus advanced row/column gaps (`src/editor/inspector/sections/layout/GapRow.tsx:13`, `:25`). None is zero spacing, not reset; empty removes the selected CSS override. No source-supported universal gap default should be inferred from the register's 24/32 samples.
3. **Columns element count:** choices 2–6, handler permits integer-parsed 1–6, adds container children or removes trailing children (`layoutBodies.tsx:21`; `attributeWriter.ts:73`). It is structural and potentially removes content. Keep it separately discoverable as `Column elements` in Settings with a consequence preview and Undo. Source CSS Grid Columns permits integer 1–24 and writes `repeat(N, 1fr)` without changing child count (`src/editor/inspector/sections/layout/GridControls.tsx:53`). The existing shared Columns field must not replace this structural operation.
4. **Textarea Rows / Columns:** register `textarea:4` / `8843:18935` and `textarea:14` / `8843:19000` describe HTML control attributes, not CSS grid tracks or pixel dimensions. Source body exposes `rows` with placeholder 4 (`src/editor/inspector/sections/typeBlock/bodies/formBodies.tsx:54`). Keep semantic labels such as `Visible text rows` / `Text columns` if clarification is needed; do not route them to Style Height/Width and discard attribute behavior. The extra cols path needs its own source review before declaring complete parity.
5. **Progress Show label, slider Navigation, media controls, heading Level:** these change rendered content/behavior or semantics, but are not duplicates of box/text appearance properties merely because they affect what is visible. Their Settings ownership is not reopened by this audit. Image object-fit is already covered by R36's explicit Style route; no regression was checked here.

## Reviewable next actions and acceptance evidence

1. Remove the two independent Icon Settings appearance writes; wire links to the existing Style Size destination and a correctly scoped SVG Stroke field using shared components.
2. Capture Icon identity/context when entering Style. Verify base size → Mobile size → return/reopen → scoped Reset → Undo, checking numeric values, override presence and the actual glyph geometry. Keep the bounded no-Tablet assumption visible in audit evidence.
3. Verify glyph stroke 2 → 3 visibly, with no box-border change; Desktop/Mobile both show the same value under the immediate global contract. Reset to fixture default and Undo must restore the rendered stroke, not only metadata labels.
4. Audit the existing glyph picker before calling Icon ownership complete: replacement must preserve current Style appearance in the improved design; Cancel leaves identity and appearance unchanged. Size/stroke/color capability cannot disappear silently.
5. Add missing Columns structural-count coverage, route Gap through the existing Layout owner, and check Flex/Stack/Grid eligibility after the architecture split. Separate structural deletion recovery from responsive CSS track count.
6. After authoring, update the control register with new conditional-field IDs, correct scopes/default origins, finite-fixture limits and outcome evidence. This auditor deliberately has not edited that register.

No tests were run: inspected tests cover Image/Audio/Video, and the Icon test checks picker invocation, a metadata-name write and wrapper width of 48px (`src/editor/inspector/sections/typeBlock/__tests__/typeBlockBodies.test.tsx:66`). They do not resolve SVG output, responsive rendering, reset, picker/style synchronization or native browser behavior. Those remain runtime gates even after finite Figma behavior is implemented.
