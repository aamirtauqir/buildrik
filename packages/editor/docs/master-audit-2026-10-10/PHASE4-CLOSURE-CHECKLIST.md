# Phase 4 closure checklist and reconciliation

10 October 2026, follow-up to [independent Gate 4 review](FIGMA-PHASE4-GATE-REVIEW.md). **Gate 4 remains open.** This document updates evidence accounting while native reconstruction/comparison work continues; it does not begin TO-BE design or change product-finding status.

The current central ledger contains **99 unique native screen entries**, with frames 66–85 covering the previously mapped 20 captures, 86–91 the component workflow, 92–97 Inspector/chooser contexts, and 98–99 two different template outcomes. The ledger is now a top-level JSON array; readers must not assume the former `{frames: [...]}` wrapper. Component frames 86–91 now have persisted native IDs and runtime capture pairs; their fidelity comparisons remain in progress. No browser or Figma call was performed for this document.

## Evidence changes since the 65-screen review

| Item | Current evidence | Closure disposition |
|---|---|---|
| Brand 58–65 | Eight native entries now persisted; [Brand fidelity report](FIGMA-BRAND-58-65-FIDELITY-REPORT.md) compares all eight and documents corrections | Satisfied for these eight captured states; other Brand variants remain bounded |
| Wide Inspector/page 36–43 | [Fidelity report](FIGMA-FRAMES-36-43-FIDELITY-REPORT.md) now explicitly compares all eight | Satisfied for these eight states, with recorded micro-fidelity limits |
| CMS/media/history/selection 66–85 | All twenty now have native IDs in [central ledger](evidence/figma-as-is-frames.json); errors arrays empty | [Completed 20-state comparison report](FIGMA-WORKSPACE-CANVAS-66-85-FIDELITY-REPORT.md); all 20 paired, with disclosed fidelity/transient limits |
| Component creation/library/instance/menu/detail/master | Six `/tmp/buildrick-component-*-v2-layout.json` and matching PNG pairs exist | Native 86–91 IDs persisted; await final readback/comparison and retained evidence |
| Form Behaviour | Capture includes Fields, Name/Email, After submit/Then/Message/Send to/Spam protection and immediate-save explanation | Material capture gap closed; native 94 present; comparison pending; no delivery certification |
| CMS binding | Capture includes From CMS, actual collection, Choose a field and Choose a record | Material chooser gap closed; native 92 present, comparison pending; no field/record binding applied or implied |
| Interaction add | Capture includes Choose Trigger and four trigger groups | Add-panel gap closed; native 93 present, comparison pending; full configured action/editor and live playback remain unexercised |
| Property image chooser | Capture includes Choose image, asset choices, Cancel and Use selected image | Caller-owned picker gap closed; native 95 present; comparison pending; no source change implied |
| Property token picker | Capture includes Tokens/Custom, Search tokens and Space 1–8 values | Picker gap closed; native 96 present, comparison pending; binding mutation not implied |
| Selected Mobile heading | Capture includes Mobile chip, heading Style and 375px canvas at 61% zoom | Selected-context gap closed; native 97 present, comparison pending; **no override/revert marker visible**, so I-HM override substate remains older/source evidence |
| Template replacement guard | Native 99 `8309:247369`, `template-replace-guard-v2`: nonempty Home, 4 elements, backup checkbox checked; coordinator clicked Cancel | Representative replacement/cancel guard established; compare native 99. No new confirmation variants are required for closure |
| Empty-page replacement | Native 98 `8309:246610`, legacy key `template-confirm-v2`: actual replacement applied immediately on an empty page; coordinator attempted Undo; restoration was not verified and later Layers still showed Navigation plus two Sections | This is an applied-state capture, **not confirmation**. Preserve exact provenance; no guard or successful backup inferred |

The six new Inspector/chooser captures are `form-behaviour`, `cms-binding`, `interaction-add`, `property-image`, `token-picker`, `heading-mobile`, each under `/tmp/buildrick-KEY-v2-layout.json` plus `-v2.png`. The [merge-ready mapping CSV](evidence/phase4-coverage-reconciliation.csv) records AS/W/I/F/finding references, actual native IDs where present, state limits and pending evidence. The mapping now contains 34 actual capture/native pairs and no provisional rows. The misleading `template-confirm` key is explicitly mapped to applied-state frame 98, while `template-replace-guard` maps to the actual confirmation 99.

## Final checks for the coordinator

- [x] Persisted 99-screen ledger reconciles all 34 later capture keys to actual IDs 66–99.
- [x] Brand 58–65 and wide 36–43 direct-comparison reports replace their earlier pending status.
- [x] All six material Inspector/chooser runtime captures exist and their actual visible contents have been read.
- [x] Receive [66–85 final fidelity report](FIGMA-WORKSPACE-CANVAS-66-85-FIDELITY-REPORT.md); all 20 states directly compared. Component 86–91 remains within pending 86–99 report.
- [x] Add native representatives for six Inspector/chooser states 92–97 and actual template outcomes 98–99.
- [ ] Receive final comparisons for 86–99; retain the applied-state versus guard distinction.
- [ ] Link every final node to retained PNG/layout/fixture/viewport and comparison disposition. Copy relevant `/tmp` evidence before closure; do not count creation responses or standalone screenshots as equivalent to matching comparison.
- [ ] Preserve native controls and source imagery. Specifically check media preview/editor image content, iframe gradients/backgrounds, source ellipsis, disabled states and overlay order after helper/correction changes.
- [ ] Reconcile 40 families using the latest IDs and bounded limitations. Update stale 35/43/57/65 counts as dated historical snapshots rather than deleting their provenance.
- [ ] Record reusable/editable structure and appropriate Auto Layout scope. The 29-master AS-IS sample library is not already the Phase 6 TO-BE system.
- [ ] Publish the explicit Gate 4 conclusion only after agent comparisons finish. No further minor-state permutation capture is required by this checklist. State representative comparison breadth and surviving fidelity limits; no pixel-perfect or runtime-correctness claim.

## Limits that do not require more unsafe capture

Native Layers/quick-Media right-click is tool-blocked: CDP `Input.dispatchMouseEvent` was denied and Shift+F10 did not expose a menu. Keep source/action matrix and existing visual references, without circumventing the denial. Full CompareHost has no established UI entry in the current no-round/no-approval/no-published-version fixture; inline Saves comparison remains a different supported capture. Share preview may create a token on open. Provider output, review sends/sign-off, deployment, role/conflict/session-expiry fixtures, destructive schema/media changes and native drag transients retain the specific limits in the [gate review](FIGMA-PHASE4-GATE-REVIEW.md).

These are named coverage limits, not requests for further approval. A genuine current empty/disabled/error state can satisfy the major surface. Do not hold Gate 4 for hypothetical success screens or relabel real product defects as fixed because their native reconstruction is faithful.

## Tracking rule

The mapping CSV is additive AS-IS evidence, ready to merge into Figma-reference/evidence fields. Preserve central finding status and priority. For example, `HIST-01 → AS-34 → 8308:1048` means the inline comparison is reconstructed; it does **not** mean page-metadata comparison is repaired. `CI-01 → AS-06 → 8308:1927/8308:2246` documents multiselect/locked controls; their write gates remain unresolved. TO-BE node references remain absent until Phase 5 actually creates them.

## Bounded closure decision at 99 frames

All material currently obtainable screen families identified for this pass now have runtime/native representatives. Outstanding work is agent comparison/correction, retained evidence, and final reconciliation. Separate Settings dirty-exit, template-create confirmation, configured interaction execution, bound/deleted CMS sources, populated published/review data and other minor variants remain accurately named limits; do not reopen an endless capture list. Template 99 supplies a genuine cancelable destructive-change guard, not a claim that Settings unsaved handling was observed. Component 91 is the actual detail view with Back to instance, not an invented isolated master-edit canvas.

### Corrected replacement timeline

After frame 98, the coordinator pressed Meta+Z, but later Layers on Audit persisted page still showed Navigation plus two Sections. Undo was **attempted**, restoration was **not verified**, and that disposable draft page still retained the template at the latest observation. Home was a separate nonempty-page fixture: frame 99 showed its guard, Cancel was confirmed, and Home remained unmodified. This corrects the earlier shorthand claim of a completed Undo; no product fix or additional restoration is asserted.

### Latest comparison and annotation accounting

The [66–85 report](FIGMA-WORKSPACE-CANVAS-66-85-FIDELITY-REPORT.md) now completes 20 direct pairs. Frames 79/84 were regenerated in place from fresh v2 pairs: Mobile is 375px at 61% with Layers active; empty page has wide Add. The transient Tip 4/4 exists only in the empty-page PNG and remains explicitly absent from native 84. This is a disclosed evidence-timing difference.

[First-ten supplementary review](FIGMA-FIRST10-FINAL-RENDER-REVIEW.md) credits native-render inspection plus measured metadata for 03–07; their exact original matching PNGs were not found. It does not credit them as direct pairs. Assets 08/09 have an assigned imagery/filename correction addendum pending. The native 99-link index is coordinator-reported at `8309:247874`, screenshot-verified by the coordinator; it is navigation, not another application screen. **Do not say 99 screens were all directly paired.**

[All 60 issue annotations](evidence/AS-IS-ISSUE-ANNOTATIONS.json) and TRACKING-MATRIX Figma references now link exact findings to related native screens. Ten labels identify captured issue characteristics; 50 identify contextual representatives. Every record states its reproduction limit. Only the central Figma-reference column changed; priorities, evidence, verification and statuses remain unchanged, and every row says TO-BE pending.
