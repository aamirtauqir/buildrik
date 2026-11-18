# Phase 6 control contracts and limitations

12 October 2026. This is a finite Figma design prototype, not an executing editor. The [final per-node ledger](evidence/phase6-final-control-ledger.json) distinguishes working native links, browser-traversed links, disabled states, read-only fixtures, covered controls, hidden panel reactions and structural labels. **A classified limitation is not a working feature or a passed interaction test.**

## Visible scope and caller preservation

All 116 application/scenario frames have a shared `Prototype scope` button. Ten domain-specific notes explain which actions are demonstrated and which are unavailable. The note returns through Figma BACK/Escape to its exact caller. Editor, both-panels-collapsed and applied-Brand callers were browser-tested. Other cross-workspace controls without a matching caller fixture are deliberately muted: they do not silently replace About us, an applied colour, a selected element or a collapsed-panel state with the Home baseline. Use the named start for a different representative journey.

This is an explicit restriction of the prototype, not a proposed product permission rule. It does not certify arbitrary cross-product combinations of selection, draft, breakpoint, panel visibility and workspace. The product's intended context/dirty-exit rules remain in PHASE5-INTERACTION-AND-PANEL-SPEC.md. The specific primary paths below are connected; other ordinary controls are visibly delimited rather than described as backend failures.

| Control group | Defined behavior / limit |
|---|---|
| Native links | Follow the exact trigger and destination in the final ledger. Receipt-only links remain native evidence, not playback passes. |
| Fields and search | Values are fixed specimens. No arbitrary typing, filtering, validation or model writes. The About us 36/48 px buttons and Brand colour sample are separately linked finite choices. |
| Covered background | Modal/context-menu foreground owns interaction. Background reactions were cleared where covered; no invisible background action is credited. |
| Hidden panel children | Six inherited reactions remain inside invisible collapsed panels. They are explicitly excluded from visible coverage. |
| Site content | Native website fixture content, not an editor action. Visual preview does not execute visitor scripts, forms or external navigation. |
| Resize handles | Static geometry/state specimens. No continuous drag/resize, snapping, pointer capture or engine transaction claim. |
| Disabled commands | 21 shared-disabled state records, with state labels and scope explanations. Invalid CMS Create says “Fix duplicate fields first”; SEO Save and continue explicitly refuses a real save. |
| Save/publish/export/provider actions | No storage, upload, download, deployment, email, comment, approval, token issuance or provider effect. Simulated results say so. No generic “Document saved” header remains on the TO-BE page. |

## Context menu: eligibility, outcome and refusal

The exact Grid menu and submenu control IDs are in the ledger, including `8317:247864`, `8317:247865`, `8317:247866` and their closed-menu equivalents. Main-menu opening, left-opening Arrange submenu, outside cancellation and Escape have prior presentation evidence. Command execution is deliberately muted; it is not simulated by navigating to a false success state.

| Command | Intended runtime contract | Figma disposition |
|---|---|---|
| Copy | Serialize the selected document elements through the engine copy command; OS clipboard failure gets warning feedback. | No clipboard access. Selection and document remain unchanged. |
| Duplicate | Execute the shared duplicate command on the eligible selection, selecting the resulting clones in one transaction. | No duplicate node/model mutation. |
| Paste style | Requires a nonempty style clipboard; otherwise “Copy a style first.” Apply only through the shared style command. | No style clipboard; unavailable. |
| Save as component | Non-root selection opens the save request with selected IDs and resolved token bindings. | No catalog write or propagation. Saved catalog selection instead opens the existing Project grid example. |
| Lock / Delete | Lock is for a non-root unlocked element. Delete is non-root and goes through the shared engine command and its selection/transaction guards; destructive multi-selection confirmation remains a product contract. | No destructive mutation. Separate named locked/unlocked and component reset/detach examples demonstrate bounded recovery. |
| Arrange | Parent/sibling eligibility and before/after order belong to the engine; a boundary or prohibited target must refuse instead of reporting success. | Only submenu direction, foreground ownership and cancellation are demonstrated. No reorder, parent selection or keyboard menu traversal claim. |

Source grounding: `src/editor/canvas/menus/actions/editActions.ts`, `styleActions.ts`, `layoutActions.ts` and `src/editor/shared/elementActions.ts`. These files were read, not changed. Design intent is not proof that all runtime guards currently work; earlier canvas findings remain open.

## Important finite branches

- **About us:** Browse templates → About us preview → replacement unavailable because no History backup can run → Back to preview / Keep current page. No replacement bypass. The separate Studio creation example remains available.
- **Saved components:** Add → Saved → select the existing Project grid instance. It is explicitly selection of the existing instance, not a new insertion or remote-library sync.
- **Media:** Home management has its own return to Home/Heading. Image selection retains Project image; Use and cancel were replayed after caller repair. Metadata retry preserves the entered draft and explicitly reports unavailable service, then Keep editing or review discard. Metadata is a library asset; it does not imply a new selected-element binding.
- **Mobile preview:** Menu → Close and expanded-menu Back to editor retain Mobile editing. Site links remain visual specimens.
- **CMS:** Duplicate field validation disables Create; removing the duplicate opens the valid fixed draft. Only the named simulated collection result is supported.
- **Scope notes:** Exact caller return is a tested navigation path, including a collapsed-panel and applied-token caller. It is not a claim that unrelated workspace combinations were implemented.

## Evidence interpretation

43 new successful browser checks are retained in the three closure playback JSON files. Earlier 38 continuation checks and prior component, Review/History, Brand, AI/Issues, panel and menu receipts remain credited only for their named paths. Do not add native edge counts, fixture counts or classified limitations to a “tests passed” total. The six hidden reactions and structural/text labels are not active controls.
