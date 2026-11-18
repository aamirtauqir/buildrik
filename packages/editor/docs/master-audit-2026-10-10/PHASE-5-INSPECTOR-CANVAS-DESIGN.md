# Phase 5 · Inspector and canvas proposal evidence

10 October 2026. **Completed native design slice: 13 editor states, four reusable property masters, and one compact typography/alignment specimen sheet.** These are TO-BE designs on page `8312:2`; the application and AS-IS pages were not modified. Root owns the overall Phase 5 acceptance and Phase 6 wiring.

## Native inventory

| ID | State | Active inspector tab | Frame |
|---|---|---|---|
| IN-01 | Image content | Content | [8317:242981](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-242981) |
| IN-02 | Container · Flex | Style | [8317:243209](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-243209) |
| IN-03 | Container · Grid | Style | [8317:243462](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-243462) |
| IN-04 | Form content and submission | Content | [8317:246429](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-246429) |
| IN-05 | CMS-bound heading | Content | [8317:246658](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-246658) |
| IN-06 | Component instance | Style | [8317:246897](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-246897) |
| IN-07 | Locked heading | Style | [8317:247144](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-247144) |
| IN-08 | Mixed selection | Style | [8317:247370](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-247370) |
| IN-09 | Context menu · viewport edge | Style | [8317:247616](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-247616) |
| IN-10 | Canvas · valid drop target | Style | [8317:247870](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-247870) |
| IN-11 | Canvas · resize state | Style | [8317:248085](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-248085) |
| IN-12 | Effects and interactions | Effects | [8318:1573](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8318-1573) |
| IN-13 | Content · accessibility and advanced | Content | [8318:1807](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8318-1807) |

The [control specimen sheet](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8318-244005) (`IN-C02`) adds collapsed/expanded advanced typography and three alignment states. Inherited Center is visibly selected with its parent origin; explicit Left is selected with local origin; Mixed selects no alignment option. The typography expansion retains all nine current advanced controls. This gives native proposal evidence for UX-05 and UX-25, without changing their current-app findings.

Property masters sit on board `8316:9`: default `8316:11`, inherited `8316:16`, mixed `8316:21`, disabled `8316:26`. They use horizontal Auto Layout and nested input frames; property groups use vertical Auto Layout. Shared buttons reuse the five root-owned masters. Native readback of the 13 full states found **200 instances and 337 Auto Layout containers**. These counts exclude the separate specimen sheet and master board.

The [current frame/anchor ledger](evidence/figma-tobe-inspector.json) is authoritative for Phase 6. [Creation history](evidence/figma-tobe-inspector-creation-history.json) retains earlier IDs for traceability but includes descendants superseded by QA repairs. [Specimen IDs](evidence/figma-tobe-inspector-specimens.json), [property master ledger](evidence/figma-tobe-inspector-controls.json), and [14 PNGs with hashes](evidence/figma-tobe-inspector-screenshots.json) are saved.

## Design and capability contract

The shared shell uses 60px rail, 280px left drawer, 300px inspector, 56px header, 40px page/breakpoint row, and 36px footer at 1440×900. The website canvas represents a 1200px authored viewport fitted into 752px, with a rounded 63% zoom readout. Custom website nodes use authored coordinates multiplied by the same scale; editor selection badges and handles remain readable screen-size controls. IN-11 shows authored 560×280px dimensions consistently in the selection and Inspector.

Tabs follow the agreed **Style / Content / Effects** contract. Existing Behaviour controls are relocated rather than expanded into fictional capabilities. Every full-state inspector has a named **Open selected-element AI** entry, breadcrumb, Desktop/Base scope and a local/inherited/mixed context where relevant.

- IN-01 retains source, alt text, fit, loading and eligible CMS binding. The example source and description match the actual blue-to-purple content image.
- IN-02/03 retain existing Flex/Grid options. IN-06 shows an instance banner and one local padding override; inherited values remain distinct. The canvas padding matches the shown 32px override.
- IN-04 retains fields, After submit, recipient and spam protection. Immediate site-setting saves outside document Undo and the Admin restriction remain explicit.
- IN-05 shows an eligible heading bound to Projects.Title; the canvas and record preview both read Quiet spaces. CMS record/schema work remains outside the Inspector.
- IN-07 keeps locked values inspectable and disabled. Unlock is explicit. IN-08 uses capability intersection for heading + image + container and highlights the same three selections in Layers and canvas.
- IN-09 shows a lower-right context menu with a left-opening submenu. Arrange means sibling order; unavailable Paste style gives a readable reason.
- IN-10/11 show destination/insertion and resize feedback, with Escape cancellation guidance. They are proposed interactions, not claims that native drag or transactional cancellation has passed runtime QA.
- IN-12 retains opacity, shadow/filter/transform summaries and an Interactions group with animation timing, easing, Preview, Disable, Add and Remove. Reverse playback is explicitly unavailable.
- IN-13 uses existing alt text, tab index, ID/title/decoding, CSS classes and custom data attributes. It does not invent an ARIA role/name editor.

Eligibility for all 55 registry types remains governed by the [variant plan](PHASE-5-INSPECTOR-VARIANT-PLAN.md), [panel/context specification](PANEL-AND-CONTEXT-RULES.md) and [source state reference](AS-IS-INSPECTOR-STATE-SPEC.md). Reserved commerce types do not gain price, stock, checkout or payment controls. Component instances keep underlying-type and override restrictions; multi-selection uses intersection, not union.

## Source and finding traceability

| Area | Source / audit contract |
|---|---|
| Types, instance and mixed gates | `src/shared/constants/elementCapabilities.ts`; `src/editor/inspector/sections/registry/_shared.tsx`; `tabs/InspectorTabContent.tsx`; CI-01 |
| Image, heading, CMS | `sections/typeBlock/bodies/mediaBodies.tsx`; `textBodies.tsx`; `CmsBindingSection.tsx`; RT-01 |
| Form and component | `FormFieldsSection.tsx`; `FormAfterSubmitSection.tsx`; `ComponentRow.tsx` |
| Effects and interactions | `sections/effects/*`; `sections/interactions/InteractionEditor.tsx`; `ElementAnimationRow.tsx`; CI-02 |
| Accessibility and advanced content | `config/attributeFields.ts`; `sections/attributes/AttributesSection.tsx`; `DataAttributeEditor.tsx`; `CSSClassesSection.tsx` |
| Typography and value origin | `sections/typography/TypographyControls.tsx`; `FontControls.tsx`; `hooks/useAdvancedSettings.ts`; UX-05, UX-10, UX-25, R-09 |
| Canvas/menu eligibility and transaction handling | [Canvas/Inspector coverage](CANVAS-INSPECTOR-COVERAGE.md); CAN-01–03, CI-01, MENU-01, R-01–03, R-07 |

Paths in the table after the first segment are relative to `src/editor/inspector/`. Source is evidence of available controls, not proof that a redesigned interaction already exists in the application.

## Validation and corrections

All 13 full states were screenshot-inspected at 1440×900; IN-C02 was inspected at 1440×690. Final screenshots are durable PNGs, not embedded UI raster layers. The website's gradient image is a discrete content fill; chrome, text, fields, controls, menu and canvas outlines are native editable Figma nodes.

QA repaired Auto Layout groups that initially collapsed, matched physical canvas scaling to authored values, restored readable selection labels, matched image alt/source to the image, matched component padding, corrected mixed tree selection, replaced the lock emoji with a native icon, raised the unavailable-menu explanation contrast, added the shared selected-AI entry and corrected the saved-state icon on the two new states. The resulting changed screens were inspected again. Unchanged frames were not repeatedly re-audited.

The shared accent is #1A56DB. Active input strokes use #8591A3; pale #E4E8EF is reserved for dividers/disabled boundaries. Inter fonts are native. Exact matching existing white/blue variables were reused on the initial shared/proposal construction; complete semantic token and text-style reconciliation belongs to root's Phase 6 consolidation. These four property masters are a scoped proposal family, not a claim of a complete production design system.

## Bounded remaining coverage and handoff

This slice completes the requested representative inspector/canvas states. It does not draw every control permutation for all 55 types, all error branches or every breakpoint.

Phase 6 must wire the saved anchors and verify actual click targets, return destinations, selection retention, focus, Escape and scroll restoration. In particular: Replace image returns to IN-01; Open record returns to the CMS-bound selection; instance Reset/Detach require confirmation; Unlock returns to an editable heading; context menus freeze their target while open. Expanded shadow/filter/transform controls and trigger-picking/animation editing can reuse existing controls but are not individually expanded in IN-12. Invalid-drop feedback is specified in the external IN-10 note but has no separate full-state screenshot here.

The prototype must not claim reverse animation, editor-sandbox script execution, cloud-media persistence, universal lock enforcement, scope-correct alignment, or single-Undo cancellation are implemented merely because their design is visible. Those remain the audit's engineering/runtime dependencies. No application changes, browser actions, runtime tests or Phase 6 connections were performed in this design slice.

