# Phase 6 continuation — type-specific inspector integration

12 October 2026. **Phase 6 remains open. This is an implemented and tested increment, not complete product acceptance.**

## Updated improved Figma

[Design: integrated inspector](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8507-2799) · [Interactive prototype](https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8507-2799&starting-point-node-id=8507%3A2799&hide-ui=1)

Eleven native states were added to the existing reopened product page `8463:2`, with an entry from existing Heading Settings `8465:10`. Original/AS-IS pages and application source were not edited.

| Scenario | Figma nodes | Implemented behavior |
|---|---|---|
| Image settings | T01 `8507:2799`, T02 `8507:3011` | Source/alt/loading, fit/size and binding representation; authored alt edit and Undo. Alt changes do not change visible page copy. |
| Email field | T03 `8507:246872`, T04 `8507:247087` | Input type, name, placeholder/default, required/disabled, label/autocomplete; required toggle and Undo. Selection outline targets the input rather than the entire form. |
| Form submission | T05 `8507:247302`, T06 `8507:247507` | Message/redirect, destination validation, delivery and spam guard. Incomplete redirect is not saved; cancellation restores message configuration. Admin-only delivery is distinguished from editor-writable settings. |
| Collection list | T07 `8507:247712`, T08 `8507:247900` | Collection, limit, read-only record count and template field/fallback mapping; 3→2 item limit and Undo, with canvas item count matching. |
| Component instance | T09 `8507:248087`, T10 `8507:248294`, T11 `8507:248469` | Master/variant/instance ownership, text/radius overrides and link; scoped reset review, cancel, reset result and Undo. |

Figma values are authored examples, not arbitrary text input or service operations. Direct field reactions additionally exist for alt text, Required, Then and Show items; these were natively read back but are not counted as browser-tested direct-field interactions.

## Unified design system and consistency

Existing Button master variants (`8314:3/5/7`) and Inspector / Property origin (`8464:27`) remain linked. The increment contains **404 component instances** across 1,507 descendant nodes; these are adoption counts, not feature-completion counts. Error, Locked, Override and Inherited variants now distinguish invalid redirects, admin/read-only values, instance overrides and master-derived values.

All inspected text families are Inter. No full-UI raster/image layers were added. Inspector width remains 352 px within the existing 1440×1000 workspace. Native checks found no overflowing direct inspector children. Reviewed renders covered image, required field, form/invalid redirect, collection and instance result; the browser final image was also inspected.

The earlier [shared library index](PHASE6-FINAL-LIBRARY-INDEX.md) still describes the 18 original TO-BE families. The expansion's property-origin and workflow-card families are additional existing foundations; this increment creates no competing component family. Shell composition remains frame-based, so shared-shell consolidation is still open.

## Information architecture and source evidence

- Settings owns content, type-specific configuration, semantics and CMS binding. Style owns authored appearance/layout; Interactions owns event/action configuration. This retains the reopened expansion's tab direction.
- Field settings target the selected input; submission settings target its parent form.
- `FormAfterSubmitSection.tsx` establishes server-backed submission settings outside canvas Undo, admin-only notification-email changes, linked redirect/action validation and rollback on failure. The Figma states preserve those distinctions; no server write was exercised.
- `formBodies.tsx` establishes field type/name/default/required/disabled and choice-field ownership.
- `mediaBodies.tsx` establishes image source/alt/loading, responsive object-fit and the additional media capabilities still requiring integration.
- `CollectionListSection.tsx` establishes collection selection, bounded item limit, new/open collection doors and transaction ownership. This increment only demonstrates the item-limit subset.
- `ComponentRow.tsx` establishes variant/master navigation, guarded reset/detach and override ownership. This increment demonstrates reset; detach/master workflows remain in older designs pending normalization.

## Feature parity and element coverage

[81-row product parity matrix](PHASE6-PRODUCT-PARITY-MATRIX.csv) · [55-type capability matrix](PHASE6-ELEMENT-TYPE-MATRIX.csv)

Every original feature/service row now has an explicit current mapping disposition. Sixty-four rows have identified partial design destinations; **17 have no verified destination**. A destination is not proof of full leaf coverage. The original inventory is retained as historical discovery rather than overwritten with false completion.

The element matrix is generated from the actual `ELEMENT_CAPABILITIES` registry, including structural-child and deferred commerce entries. Seven types have identified representative current native destinations; the remaining types are explicitly open for adaptation. This does not mean the other original capabilities do not exist.

## Prototype and QA evidence

- [Final browser receipt](evidence/phase6-type-playback.json): **18/18 checks passed** across all eleven new states, covering transaction actions and selected-element navigation.
- [Native validation](evidence/phase6-type-native-validation.json): fonts, instance counts, geometry, destination existence and raster-layer census.
- [Final refinement receipt](evidence/phase6-type-final-receipt.json): direct field routes, final error/locked/override variants and scope annotations. Final native count: 134 connected sources inside the eleven states, plus the original Heading Settings entry. Counts are not independent workflows.
- [Scenario manifest](evidence/phase6-type-integration.json) and [playback runner](evidence/phase6-type-playback.cjs).
- The first playback clicked while Figma was still loading and failed. Its receipt is preserved as `phase6-type-playback-loading-attempt.json`. A later long in-page wait timed out. The successful isolated GPU-enabled browser run is the only passing run counted here.

## Remaining issues — not closed by this increment

| Severity | Location | Outstanding work |
|---|---|---|
| High | New T01–T11 shell | Style/Interactions tab transitions, responsive/context controls and several global/sidebar destinations remain unwired. These are ordinary prototype integration gaps, not backend limitations. Implement selection-preserving routes and return behavior rather than resetting to Heading. Visible design-review footers identify this limitation. |
| High | 55-type registry | Integrate all eligible controls for remaining text/link/choice/upload/audio/video/embed/widget/structural types; test locked/mixed/fallback states. Preserve original access while normalizing the new shell. |
| High | 81-feature register | Resolve rows F-047/048/049/052/053/054/056/059/060/062/063/064/065/066/068/069/081 with verified owner surfaces or explicit justified service-to-surface mappings. Do not invent one screen per backend service. |
| High | Media/CMS/components | Source chooser/loading/binding/unbinding, collection creation/open, component variant/master/detach and failures still need caller-preserving integration into the new shell. Existing older scenes are retained. |
| High | Existing AI/Agents/Team expansion | Remaining invitation expiry/revoke, permission changes, removed comment targets, loading/empty/error and notification delivery states remain as described in PHASE6-PRODUCT-EXPANSION.md. |
| Medium | Shared shell | Consolidate equivalent navigation/context patterns while preserving legitimate workspace differences and current tested geometry. |
| Medium | Prototype QA | Direct field routes, all new secondary controls and complete cross-module journeys need additional browser traversal. General input, service persistence, permissions and runtime behavior need later implementation QA. |

Phase 7/8 implementation approval was not requested or inferred. This report supersedes neither the original functional findings nor their unresolved runtime defects.
