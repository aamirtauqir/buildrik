# Independent compact control review — 2026-10-18

Targeted design-only review of smaller controls, separated numeric value/unit surfaces and cleaner icons. User's latest explicit preference supersedes earlier32px/radius6 visual decisions; existing ownership/data/keyboard contracts remain. No app or Figma mutations by reviewer.

Evidence: main7:20634 screenshot `/tmp/buildrick-compact-shell.png` (1440×900); board45:1083 `/tmp/buildrick-compact-board.png` (1040×763); unit board51:1405 `/tmp/buildrick-compact-units.png` (1040×1407); live API anatomy/state/token readback. Companion/recovery pages were not independently inspected in this bounded pass.

## Confirmed design checks

- Shell fits and remains readable:12px text preserved,28px value fields and4px corners visibly lighter. Paired labels remain individually associated. Main Typography/Size source, units and four-tab ownership persist in sampled scene.
- NumericUnit preserves master IDs4:393/397/401/405/409 and32:698, Value#4:48 property and exposed nested UnitSelector instances. At160px master width:116px value+4gap+40unit. At134px paired width:90+4+40. Both parts are28px high.
- CompactProperty45:1073 is134×48:16px label+4gap+28px control. No clipping/overlap in sampled short values.
- UnitSelector49:1305 retains Unit text/State properties and Default/Hover/Focus/Open/Disabled variants.40×28 separate surface clearly advertises independent unit selection; px/rem/em/%/×/ms examples stay visible.
- Value Focus55:1566 retains accent stroke and2px spread effect; Error55:1572 retains color/error binding. Default/Hover/Focus/Error/Mixed distinctions remain visible in component board.
- Caret master55:1556 is12×12; stroke1.2 and semantic ink token verified. Alignment glyph vectors use1.25 stroke; three-bar icons still distinguish left/center/right. Selected and unselected slots remain visible and Mixed has no selected option. Accessible names/tooltips remain required; glyph clarity is not a keyboard test.
- Existing property-specific menus and Normal/Auto/custom/mixed-unit handling remain in unit board. No option-set change was observed in this visual pass.

## Corrections captured

| ID | Finding | Required closure |
|---|---|---|
| C-01 | NumericUnit Disabled4:401 exposes nested Unit32:651 with State=Default, opacity1 while its value is muted. | Set disabled nested selector when value is non-editable; locked/read-only property must not offer a writable unit. Runtime guard remains required later. |
| C-02 | Fixed opacity% and angle° suffix consumers now float outside shortened value surface. | Keep fixed suffix inside one quiet field, no dropdown affordance; separate surfaces only for editable units. Author already addressing. |
| C-03 | Current README/spec still claim32px target/radius6, and older text explicitly rejects28px Inspector inputs. | Record latest user-authorized28px/radius4 override,40px unit/4gap and48px paired anatomy; preserve targets for unaffected controls. Update CSS-unit keyboard target description as needed. |

## Handoff limits

The paired value input is90px wide. Existing long/exact/custom values must remain accessible through expansion/stacking; do not round, truncate permanently or coerce units to fit. Preserve actual full value and property-specific units, independent focus names and focus return. Read-only and disabled are distinct runtime semantics even where both prevent unit mutation; do not prevent copying a read-only value merely to match styling.

All runtime keyboard/assistive technology, zoom/text enlargement, formal contrast/target conformance, conversion, responsive writes, persistence/history and complete state/consumer matrices remain NOT RUN. Static28px design dimensions alone do not establish accessibility conformance. No authored-value cross-file diff performed.

Initial outcome: sampled visual fit PASS; C-01–03 pending targeted closure. User visual acceptance is not inferred.


## Final bounded closure

C-01–03 are CLOSED after independent targeted readback, final fixed-suffix screenshot and current document inspection.

- **C-01:** Nested Unit32:651 now has State=Disabled. The parent retains value/Unit exposure contracts. This verifies Figma state propagation; future runtime read-only/disabled guards remain untested.
- **C-02:** Fixed opacity51:1519, rotation51:1530 and secondary opacity51:1645 now have one180×28 enclosing filled/bordered surface, inner value/suffix with no fill/stroke and gap0. Fixed suffixes remain without caret; editable units stay separate. Final screenshot `/tmp/buildrick-compact-units-final.png` (1040×1407) inspected; no clipping or floating suffix defect remains in sampled board.
- **C-03:** README latest compact section, component-specifications opening/table/anatomy, CSS-unit keyboard paragraph and brief opening checkpoint explicitly supersede32px/radius6 with28px/radius4 for named affected families. They preserve unrelated button/toggle/header dimensions and long/custom expanded forms.134×48 paired anatomy and90px value-region limit are explicit.
- **Token verification:** Live Figma readback confirms `size/property-control-height` VariableID:57:1576=28, bound to NumericUnit/value surface/UnitSelector heights; `size/unit-control` VariableID:38:1089=40 binds selector width. Value/selector radius and gap use existing variable aliases. These are design-only bindings, not exported app CSS.

**Final result: PASS within this targeted compact-control design review.** No remaining blocker in the sampled shell/component/unit geometry, reviewed state corrections or superseding handoff. Earlier evidence remains historical; this closure overrides its pending status. The runtime, broader consumer/variant coverage, authored-value preservation diff and accessibility limits listed above remain unverified. User visual approval is not inferred.
