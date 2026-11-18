# R36 change log and scoped QA
13 October 2026. Same improved Figma page 8463:2. No application source or original design baseline edits.

## Actual design changes
- Bound selected element/breakpoint captions across 55 type-specific inspector screens; Mobile uses a 375 px sample. Desktop/Mobile button appearance now follows its state using existing editor tokens.
- Moved Image object fit to shared Style, with a Settings link to its canonical editor. Added independent base/Mobile sample values, visible origin and Mobile reset.
- Connected the existing Image Source picker and nested Media selection to the initiating Image. Apply, cancellation, unavailable-source recovery and replacement Undo retain context and authored placement alt.
- Fixed Undo capture timing: a cancelled picker visit or same-source Apply must not replace the prior committed source snapshot. Consumed/unavailable replacement Undo is hidden.
- Added explicit Escape-to-caller reactions for picker, Media and Brand overlays; fixed misleading shared return/usage labels.
- Added current Image to Layers and a real existing image fill to the canvas specimen. The source filename is synchronized with the Inspector; the three existing library thumbnails share one image hash, so this does not prove distinct asset-byte rendering.
- Replaced incompatible Image CMS Title/Summary samples with the existing authored Cover/Image fixture. It is a read-only compatible sample; a complete dynamic field selector remains open.
- Corrected two legacy picker text overflows. The unavailable-source choice was initially outside the picker body; it was moved into the existing asset-choice group before playback.
- Renamed the existing review entry R36 / Product design review.

[Image task](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8843-20467) · [Product review](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8690-13237).

## Evidence and limits
Native audit: 61 affected roots, 2,474 shared instances, 11 masters, 6,388 auto-layout child checks, 86 unique destinations; zero missing inspected master/destination and zero measured overflow. Intentional scrolling axes are excluded. After the later CMS/Undo changes, targeted checking of four affected roots found zero overflow in 234 checks. These counts describe structural scope, not completed workflows.

Visually reviewed playback:
- Mobile selection indication and consistent Image context.
- Authored alt → picker replacement → same Mobile Image/Settings; source display changes.
- Nested Media → picker → Apply; Brand → return; same target, breakpoint and authored alt.
- Unavailable source → Escape; original source/context retained.
- Retry unavailable source → Apply remains blocked.
- Apply → reopen picker → Cancel → Undo restores the previous source and retains alt.
- Mobile Contain override → Reset shows inherited Cover; Desktop remains Cover.
- CMS Articles reveals compatible Cover · Image and fallback controls.
- Picker Escape returns to the same Mobile Image/Settings context; verified in r36-escape-walk.json.receipt.json and r36-picker-escape-return.png. Media/Brand Escape reactions are structurally connected; their keyboard paths are not separately played.

Evidence: evidence/r36-image-walk.json.receipt.json, r36-cross-module-walk.json.receipt.json, r36-fit-walk.json.receipt.json and r36-final-recovery-walk.json.receipt.json, with corresponding PNGs. Receipts are raw automation output; visual disposition is recorded here. A stable URL during an overlay transition is not failure or success proof.

Creation/mutation and native QA receipts are in evidence/r36-mutations-and-qa.json; later Undo/Escape and targeted QA evidence is in evidence/r36-final-evidence.json. Real application execution, focus restoration, persistence, permission enforcement and provider calls were not verified in this pass.

## Expanded acceptance and handoff
[R36-END-TO-END-HANDOFF.md](R36-END-TO-END-HANDOFF.md) records users/roles, object relationships, canonical ownership, return-context payload, storage/Undo boundaries, flow requirements, accessibility and proposed performance acceptance.

[R36-MODULE-ACCEPTANCE.csv](R36-MODULE-ACCEPTANCE.csv) covers all 14 requested module groups with tasks, inventory references, evidence and remaining work. Every module gate remains OPEN.

[R36-INSPECTOR-CONTROL-REGISTER.csv](R36-INSPECTOR-CONTROL-REGISTER.csv) tracks 529 authored control entries. Sample enum choices are not represented as complete production range/default/unit specifications. Unknown control contracts remain OPEN_LEAF_CONTRACT.

## Precise remaining design work
1. Reconcile every actual dropdown/context action and property leaf against source; remove remaining duplicate ownership, including appearance shortcuts in Settings unless explicitly linked to Style.
2. Extend exact caller/breakpoint/tab/draft/scroll/focus handling through all legacy and secondary routes; the Image path is a verified slice.
3. Complete Image CMS field selection, all relevant typed control/invalid/empty/mixed/linked/locked states, and actual fit-mode visual variants.
4. Review master/instance reset/detach/incompatible update, CMS conflict/schema dependencies, Media version/partial replacement, page/template dependencies and all publishing gates.
5. Complete intermediate-width, keyboard/focus, large-content and missing/deleted/access-revoked target designs. Native focus trapping and performance measurement remain runtime work.

Precise runtime facts are listed in the handoff. Two fresh source concerns are recorded: SourceRow and direct Media replacement have different alt policies; selected-breakpoint style reads and overlapping CSS breakpoint rules need cascade/output reconciliation. Actual Editor/Designer permissions and conditional publish approval must not be replaced with invented role restrictions.

Phase 6 and complete frontend readiness are not certified. Existing capabilities remain the baseline; this pass improves and verifies the named slices.

