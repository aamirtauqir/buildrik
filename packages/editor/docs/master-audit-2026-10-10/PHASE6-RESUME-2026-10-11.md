# Phase 6 continuation, 11 October 2026

Gate 6 remains open. This continuation fixes save-state semantics, supplies a finite insertion/style/Undo journey, and verifies existing CMS, component, template, preview and publish paths. Application source and tests were not modified. No save, publish, collection creation, comment submission or other backend effect was executed.

## Changes and evidence

| Area | Result | Evidence |
|---|---|---|
| Publish return | E01 status `8317:307` now says “Prototype · not saved”; success check `8317:305` is hidden. Confirmation cancel, simulation result, return to checks, return to editor and Desktop preview/return passed 10 recorded transitions. | `evidence/phase6-save-status-correction.json`, `phase6-resume-journey-playback.json`, `phase6-validation/resume-publish-return.png` |
| SEO leave guards | Four existing Save and continue instances use the existing Secondary/Disabled master `8314:11`, have no reactions, and visibly explain that saving is unavailable in the prototype. Selected-image Analytics guard click stays in place; Keep editing, reopening and Discard each reach the expected state. | Four exact action/label/body IDs in `phase6-save-status-correction.json`; 4 checks in `phase6-resume-journey-playback.json`; `phase6-validation/resume-seo-disabled.png` |
| CMS first collection | Duplicate-field removal → valid draft → Cancel → zero collections → reopen → simulated Articles collection → editor return passed 5 transitions. The result explicitly says no collection was created. | `phase6-resume-journey-playback.json`, `phase6-validation/resume-cms-result.png` |
| Component master | Project grid instance → Edit master → Back to instance passed 2 transitions. Master context and selected grid are visible; no propagation or persistence is implied. | `phase6-resume-journey-playback.json`, `phase6-validation/resume-component-master.png` |
| Template creation | Studio confirmation Cancel → preview → Create confirmation → simulated Studio page → Back to template passed 4 transitions. The Studio page name, selected Heading and no-backend-result notice are visible. | `phase6-resume-journey-playback.json`, `phase6-validation/resume-template-result.png` |
| Add/style/Undo | Blank About us page → Add → inserted Heading (36 px) → 48 px sample → Undo size → Undo insertion. Includes close/cancel, alternate guidance entry and direct Undo insertion from styled state. 13 transitions passed in the final continuous run. | `phase6-insertion-demo-build.json`, `phase6-insertion-demo-correction.json`, `phase6-insertion-demo-playback.json`, `phase6-validation/resume-heading-48.png`, `resume-heading-undo-size.png`, `resume-heading-undo-blank.png` |
| Start labels | Replaced ambiguous duplicate labels on the existing 34 starts with specific frame/scenario names; insertion adds one explicit About us start. | `phase6-start-label-correction.json`; final start list in `phase6-resume-final-graph.json` |
| Native graph | Final readback: 431 reaction-bearing sources, 428 NODE destination edges, 35 start points; zero missing NODE destinations. Sources and edges differ because some reactions use other action types. | `phase6-resume-final-graph.json` |

There are **38 recorded successful checks** in this continuation: 25 existing-route/guard checks and 13 insertion-demo checks. Repeated openings are included in that count; it is not 38 unique capabilities. The earlier Review/History receipt already establishes its 21 actions and 13 new controls; those are credited separately, not rerun or added to 38.

## Insertion fixture contract

Start: [About us blank page](https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8329-1288&starting-point-node-id=8329%3A1288&hide-ui=1).

Native states: Add `8415:1581`, inserted `8415:1691`, styled `8415:1801`. The frame remains 1440 × 900, with Desktop/1200 CSS px site width and 63% zoom. The rendered 752 px site uses 22.56 px and 30.08 px Heading text to represent 36/48 CSS px. The outline, selected Layers row, Inspector and About us page remain consistent. Undo insertion restores the original blank page with no selected element.

These are native editable layers, not a screenshot overlay. Native verification found 139/176/176 descendants respectively, no image-filled nodes, and Inter throughout. Existing button masters, canvas, selection graphics, Inspector and navigation were reused. Initial copied Pages-active navigation was corrected to Add/Layers before successful playback.

The size buttons explicitly say “Try 48 px sample” and “Undo size change”. This is a finite design demonstration, not arbitrary typing or a real Undo transaction. Other catalog items are dimmed with a visible demo limitation. Inspector fields have a visible read-only note. Escape from Add is wired but has not been traversed in this continuation. Toolbar Undo/Redo, shortcuts, other shell destinations, freeform input, arbitrary insertion, drag/resize, autosave and persistence are not certified by this journey. New fixture control accounting remains part of P6-08.

## Remaining work

1. Finish ordinary-control and caller accounting: blank-page Browse templates, context-action eligibility/outcomes, Media metadata recovery, mobile preview return, and navigation from edited/collapsed fixtures. Do not report these as passed merely because their destinations exist.
2. Reconcile the full visible-control inventory with the fresh graph and newer receipts, including exact disabled/read-only/covered IDs and their visible explanations. The older 1,263-record ledger is not a current coverage denominator.
3. Finish library family/state index and adoption exceptions, then issue the final requirement-by-requirement Gate 6 report. No Gate 7/8 or implementation completion is claimed.

## Playback environment

The first browser failed WebGL initialization. Later short-lived browser sessions restarted between commands, yielding `about:blank` or missing click targets; those are failed harness attempts, not successful prototype checks. The first continuous insertion attempt also clicked before the first canvas render settled. The final continuous run waits for canvas/render readiness and records all 13 expected destinations. The final screenshot files supersede temporary blank captures. Figma's own hardware-acceleration notice appears in the insertion screenshots and is not a product notification.

The reusable runner is saved as `evidence/phase6-insertion-playback.cjs`. It uses the existing browse binary, `GSTACK_DISABLE_GPU=off`, `BROWSE_PARENT_PID=0`, a 1440 × 900 viewport and explicit expected destinations, stopping on mismatches. It operates only the Figma prototype.
