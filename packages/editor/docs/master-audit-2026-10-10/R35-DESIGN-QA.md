# R35 design implementation and QA
Date: 13 October 2026. Design/prototype only; no application source edits.

## Design location
Existing file **Buildrick — Product**, improved page **8463:2**.
- [Product review](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8690-13237)
- [Rendered font impact](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8855-16760)
- [Responsive review](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8861-17320)
- [Element library](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8844-16149)

## Implemented scope
- Authored Settings destinations for all 55 registered element types, with source-based field ownership. Shared Style and Interactions overlays preserve sample context. Conditional controls and per-type saved values include fixed width/height. Commerce types retain their source container behavior.
- Added 1280/1024 Editor, Build, CMS, Brand and Media workspaces. Editor 1024 uses a Navigator drawer; Media 1024 uses a details drawer and two-column grid. Media List and long-filename specimens are included.
- Added rendered comparisons for font roles and 18 Brand presets. Explicit font alternatives correct prototype rendering limitations. Apply/Discard/Undo synchronize authored state.
- Connected CMS missing-reference recovery, expired invitations, upload rejection, history restore scope and missing comment anchors to relevant existing surfaces.
- Added concrete layer reorder/nesting states, invalid target feedback, previous-step Undo, mixed-selection opacity application excluding the locked image, and a representative CMS keyboard focus sequence.
- Fixed measured overflow in affected inspector groups, responsive cards and legacy Input/Form/Flex inspector surfaces.

## Architecture and component consistency
Global header owns Editor/Build/Review/History and project actions. Navigator owns pages, elements and resource access. Inspector tabs divide appearance/layout (Style), content/semantics (Settings), and event behavior (Interactions). Contextual overlays preserve the underlying canvas. Width-specific layouts inherit these ownership rules; reduced space changes panel presentation, not feature ownership.

Existing shared button, field, property and navigation masters and centralized tokens were reused. Sample-state variables are hidden from publishing. Font/preset specimens are intentional rendered alternatives, not a replacement design-token library. Shared Style and Interactions avoid creating independent inspector definitions per type. Finite layer states and prototype specimens are justified simulation exceptions.

## Verified evidence
The scoped native audit covers **196 affected roots**, **4,356 instances**, **26 existing masters**, **6,783 auto-layout child checks**, and **371 unique destinations**. It found zero missing inspected masters/destinations and zero measured overflow. Intentional scrolling axes are excluded from overflow failure. This is structural/default-state evidence, not exhaustive runtime validation.

Final evidence: [native QA](evidence/r35-native-qa.json), [closure scripts and receipts](evidence/r35-closure-evidence.json), [initial manifest](evidence/r35-manifest.json), [follow-up evidence](evidence/r35-followup-evidence.json).

Visually reviewed representative journeys:
- Input type picker → Email → Style → Close retains Email.
- Font role comparison visibly renders DM Sans; Apply returns to Styles.
- Primary button preset visibly compares 14/16 px; Apply and Undo restore the intended specimen.
- Media 1024 opens/closes its details drawer.
- Layers reorder → nest → Undo restores the preceding reordered state and disables consumed Undo.
- CMS Tab advances Name → Key focus; missing reference → replacement restores the Reference field.
- Mixed selection Apply shows 80 in the inspector and changes eligible canvas text; repeated Apply followed by Undo restores 100. The locked image is excluded. Latest binding-only correction changes no geometry; its structural receipt and browser playback supplement the native audit.

Screenshots and walk receipts are under evidence/r35-*. The browser receipts record VISUAL_REVIEW_REQUIRED automatically; the journeys above were subsequently inspected visually. Figma player URLs can remain unchanged during SWAP, so URL matching alone is not used as proof.

## Remaining issues and next gate
| ID | Severity | Location | Status | Required correction/verification |
|---|---|---|---|---|
| R35-Q01 | High | 55-type inspector and original capability ledger | OPEN_LEAF_QA | Exercise every eligible property, conditional state and return path; current authored destinations do not prove every leaf. |
| R35-Q02 | Medium | Secondary/legacy dialogs and caller routes | OPEN_RESPONSIVE_QA | Extend core 1280/1024 rules through remaining callers and verify original context on return. |
| R35-Q03 | Medium | Brand presets, starters and propagation | OPEN_COMBINATION_QA | Verify remaining preset/font combinations and relevant instance propagation; primary samples are not exhaustive. |
| R35-Q04 | Medium | Keyboard and content states | PARTIAL_SIMULATION | Extend focus/escape/validation and long-content checks across remaining surfaces. Native accessibility and focus trapping require implementation testing. |
| R35-Q05 | Medium | Access-change and conversion-impact recovery | SCENARIO_ENTRY_ONLY | Connect remaining conditional states to concrete triggering contexts; review entries alone are insufficient. |
| R35-Q06 | High | Product-wide parity certification | OPEN | Reconcile every original capability with inspected design and journey evidence before declaring completion. |

Implementation dependencies: arbitrary input/CSS, pointer drag/reparenting, full document history, service calls and live CMS/AI/MCP operations are not executed by these finite Figma scenarios. These dependencies do not excuse the design QA items above.

Phase 6 remains open for those checks. In the user's master prompt, Pass 7 means prototype connections and Pass 8 means design QA. Historical project phase labels in older STATUS sections use a different plan and do not authorize production code work.

