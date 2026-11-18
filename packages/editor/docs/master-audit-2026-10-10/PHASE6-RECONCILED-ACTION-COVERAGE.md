> **12 October final disposition:** Superseded for current status by [Phase 6 completion report](PHASE-6-COMPLETION-REPORT.md) and [final gate matrix](PHASE6-CURRENT-GATE-MATRIX.md). Older pending counts and open-gate notes below are historical. Explicit finite-scene restrictions remain limitations, not functional passes.

# Phase 6 reconciled action coverage — draft

**Current-state note:** the opening counts below describe the earlier offline ledger snapshot. The 11 October continuation added routes and exact disabled controls; see `PHASE6-RESUME-2026-10-11.md`, `evidence/phase6-resume-final-graph.json` and the new insertion/SEO receipts. Full ledger merging is still open; do not use 1,263/258/1,005 as current live totals.

11 October 2026. Offline reconciliation of the saved Inspector/workspace plans, current native graph and later breakpoint-chooser/page-dialog receipts and documented presentation observations. No Figma, browser, application or test edits. The artifact is [phase6-reconciled-action-audit.json](evidence/phase6-reconciled-action-audit.json). **It is not a final coverage certificate or Gate 6 pass.**

| Measure | Result |
|---|---:|
| Original Inspector plan rows | 632 |
| Original workspace plan rows | 415 |
| Unique control IDs across those plans | 1,038 |
| Current reconciled control records after retired-node accounting | 1,263 |
| Recorded wired sources | 258 |
| Native graph input records before later receipts | 138 |
| Later breakpoint / page-dialog wiring receipts | 15 / 9 |
| Pending current-state classification or verification | 1,005 |
| Wired sources absent from original two plans | 226 |
| Recorded wired source frames absent from original two plans, including later receipts | 63 |
| Uniquely attributed presentation-tested controls from referenced evidence | 104 |
| Wired controls still at native-readback / unverified-receipt level | 121 / 33 |
| Fresh presentation traversals executed by this worker | 0 |

The 1,263 current records are an accumulated inventory, not the denominator of all current visible controls. The draft includes explicit partial inventories from the new Inspector creation ledgers. It does not invent complete inventories for workspace clones, SEO guard/chooser clones, breakpoint menus or the original editor/root destination frames. These gaps are enumerated under `inventoryGaps`.

## Classification method

Current graph source IDs override proposed navigation classifications. Matching source-frame ownership produced no conflicts. `wired` means a recorded reaction exists; untraversed records retain verification result `limited`. A specifically observed finite transition can separately have a presentation `pass`. Native graph projections do not contain all reaction properties. Where a prior exact trigger record exists, the draft preserves its keyboard/device fields; otherwise the missing trigger detail is flagged. Later breakpoint and page-dialog routes are marked `wired` from their receipts. Only uniquely attributable transitions explicitly documented in presentation are promoted; other receipts retain `unverified` until a subsequent native readback or traversal. Re-read the full current graph before final sign-off.

All unverified proposed disabled, covered, current-state, read-only and simulation-limit entries remain **pending**. A proposed reason alone does not establish present disabled visuals, actual foreground ownership, or a limitation that users can see. Original classifications, reasons, prerequisites, acceptance notes, geometry and route suggestions remain in each row's `sourcePlanRecords`. Documented caller scenarios and workspace caller contracts are preserved, while unspecified context values remain null rather than guessed.

Twelve Help controls previously inherited the “arbitrary typed values/computed document effect” limitation. Each is explicitly corrected to pending ordinary Help navigation with a `classificationCorrection`. The evidence does not establish the proper destination yet. Ordinary close/menu/tab controls likewise receive no automatic service-limitation exemption.

At the first reconciliation, sixty-two wired source labels were unavailable in the supplied named-control evidence. Their node IDs and frame ownership are recorded; explicit traversal observations now identify some of these. 53 wired labels still remain unknown; their `metadataGaps` require actual label/handler identification. New frame keyboard handlers should be identified as such; an absent label must not be replaced with an invented CTA. BACK reactions retain a history-dependent-return warning.

The native start list still contains the duplicate `Editor · Home Desktop` label at the Studio-created frame. The later chooser receipt says `flowLabelCorrected=true`, but contains no replacement full starting-point list. The draft records this temporal distinction; it does not report the old label as an unresolved live defect.

## Closure work

1. Read all current visible controls in the 41 graph frames absent from the original plans and other redesigned frames lacking a full inventory. Include unwired foreground controls and covered background controls; identify decorative/site content explicitly.
2. Validate each pending category against native state and the visible limitation surface. Keep legitimate disabled reasons, modal ownership and complex-behavior limits; fix misleading or absent ordinary navigation.
3. Refresh the combined native reaction graph and starting points after breakpoint and subsequent edits. Resolve the 62 missing labels and any incomplete key-trigger details. The file hashes under `inputSnapshots` identify exactly which earlier inputs this draft used.
4. Traverse representative J-01–12 routes and record caller, result, return/cancel/retry, hit testing and defects. Assign missing journey ownership by actual control context. Do not equate a frame's presence with journey completion.
5. Reconcile the ledger once more after fixes. No pending important control, stale graph or unaccounted visible control should be silently counted as completed.

Validation performed: JSON parsed successfully; required top-level/action fields, permitted classification values, journey ID values, wired-action fields and unique action IDs passed structural checks. A full Draft 2020-12 schema validator is not installed, so no full JSON Schema validation is claimed and no dependency was added. Presentation observations are credited only as described below. No fresh playback by this worker, runtime behavior, backend operation or accessibility certification is asserted.


## Presentation reconciliation update

Added nine `phase6-page-dialog-wiring.json` route records. The report also records 408 created backdrop layer IDs and 396 removed IDs; these are not counts of controls. No existing audit control ID matched the removed-node list, so zero records were retired. New backdrop controls still require a native inventory, including their covered/inert status. The ledger preserves that gap.

Promoted 17 uniquely attributable controls from `PHASE6-PRESENTATION-TRAVERSAL.md`: Mobile choice, Mobile chooser Escape, Desktop choice; Pages rail, About selection, New page, Cancel and Create blank; component Reset entry, Reset Escape/confirm/Undo, Actions, Detach entry, Detach Escape/confirm/Undo. These are fixed-fixture transition passes, not complete journey or runtime-behavior passes. Click-cancel is credited only for the page dialog; component Escape does not establish click-cancel or focus containment.

Desktop/Mobile selector openers each have overlapping wired parent/text/icon candidates. The successful opening transitions are recorded as interaction groups, but no individual opener is promoted without exact target attribution. Outside-click dismissal, untested alternate menu choices and unrelated routes remain unverified.

The Create blank page transition was traversed **before** cosmetic corrections to the resulting unsaved status and Layers selection. `postTraversalChanges` explicitly preserves that ordering and the subsequently reviewed native render. The unresolved blue Layers glyph from the log is not silently counted as repaired.

The palette attempt remains unverified because the player intercepted the header click. Its existing native wiring is retained; no failed-native-reaction or successful palette-playback claim is introduced. Later successful menu or header experiments require their own observed transitions.

### CMS follow-up observation

The coordinator reported this additional presentation sequence on 11 October 2026: IN-05 `8317:246658`, Open record at (1215,529) → `8334:1152`; Discard at (1230,864) → `8334:1058`; Back at (95,28) → `8317:246658`, visually restoring Heading / Projects / Quiet spaces Content. Exact unique graph sources match: `8317:246866`, `8334:1235`, `8334:1061`. Those three controls are additionally credited as presentation traversed, with this reported-observation provenance, rather than pretending this worker replayed them. The coordinator also reported Meta+Backslash hiding presentation chrome (`hide-ui=1`); that resolves the described header interception mechanism but is not itself palette validation.

At that earlier page/CMS checkpoint the classification was **1,081 pending** and **162 wired**, including **20** presentation observations. The current totals in the opening table supersede those historical counts. Pending records were not upgraded merely because another control in the same frame worked. Gate 6 remains open.


## Media and History reconciliation — latest scoped update

At the earlier Media/History checkpoint totals were **1,230 records: 178 wired and 1,052 pending**; the opening table now includes the later panel matrix. Of the wired records, **29** have explicitly referenced presentation observations, **122** have graph-readback evidence only, and **27** retain unverified wiring-receipt evidence. A receipt is evidence of recorded Figma work, but absent a full readback it does not become native-readback or presentation verification automatically.

Processed the four receipts `phase6-media-entry-repair.json`, `phase6-media-caller-repair.json`, `phase6-media-caller-clarity.json` and `phase6-history-recovery.json`, including their nested tool-result JSON. Added/updated sixteen route records; nine uniquely attributable controls gained presentation evidence from the latest log.

- Media: Replace image, full-library entry, Use image, chooser Escape and library Escape. Use image's observed result predates the caller repair and is explicitly marked as such. Entry and nested Escape cancellation were exercised after caller/layout repair. Subsequent Cancel replacement/Replacement target wording was visually reviewed, but Cancel replacement's click remains receipt-only. Click-close and library Back were not promoted by successful Escape.
- History: Review restore, Simulate safety-save failure, Review retry scenario and confirmation Escape. This is a finite failure/review/cancel path. Failure-screen Escape, close and Keep current draft remain receipt-only. No successful safety backup, storage request, restore or Undo restore is inferred.

### Removed layers versus retired controls

The Media receipt removes **51 layer IDs**, of which **4** match old audit control identities. History removes **126 layer IDs**, of which **18** match old audit identities. Those **22** records move to `retiredActions`, retaining labels, classification and provenance. They are old canvas/Inspector/backdrop representations, not 22 removed product features or 22 resolved workflow requirements. Replacement layers contain text, shapes, containers and other non-controls; their creation count cannot serve as a new-control inventory.

History's old `8318:1285` restore entry was in the replaced modal background. Its retirement does not establish removal of restore capability: the actual comparison entry is now `8317:244714`, which is separately wired and traversed. Complete inventory of new foreground controls and inert background controls remains open. Pending-count reduction therefore combines verified wiring and retired node identity accounting, not blanket resolution of 29 defects.

This update is deliberately limited to Media/History. Newer publish, palette and SEO observations in the source traversal document have not all been propagated into the action ledger here; older palette-blocker prose is historical and superseded by that document's subsequent playback section. Heading Style/Effects and collapsed Inspector were excluded from that Media/History delta; their subsequently supplied evidence is reconciled below. Gate 6 and complete J-05/J-10 remain open.


## Heading panel matrix — accumulated playback reconciliation

Incorporated all seven supplied Inspector/Layers/combined-panel/Heading-Content receipts and playback files. The final explicit combined-state routes supersede the earlier standalone shared-collapse/BACK experiment. Twelve states now represent **Style, Effects or Content × Layers open/closed × Inspector open/closed** for the same desktop Heading fixture.

Matched the **24 Style/Effects transitions** to 29 earlier recorded presentation actions and the **18 Content-related transitions** to 21 later actions. All **42 unique controls** have an exact route and a successful source-state/destination observation. Where the rail and drawer close share a destination, the separately logged x=30 versus x=318 coordinates distinguish the controls. This is **accumulated evidence across the two runs**, not 42 freshly rerun transitions or a new browser test by this worker.

At the panel-matrix checkpoint the audit contained **1,271 active records: 220 wired, 1,051 pending**; the opening table supersedes those historical totals. Wired verification is **71 presentation-traversed, 122 native-readback-only, 27 unverified wiring receipts**. Full draft/unknown-control accounting remains open; these totals are not a completion percentage. No existing audit control ID matched the removed clone-layer IDs in the panel/Heading construction receipts, so this delta retired zero additional controls. The prior 22 retired identities remain archived.

Heading selection, named Desktop context, 1200 CSS px document width, 63% zoom and 752 px rendered site were preserved in the reported fixture. Geometry changes expand/recenter the available stage rather than resize the site. Content's H1/Static values are declared design-fixture values; no inline editing, tag update, CMS binding or save is verified. The visible prototype-specific disabled/read-only instructions still need exact control IDs in final per-control accounting; screen text alone does not classify every newly cloned property control.

### Largest remaining requirements

1. **Contextual selection/menu workflow:** complete one relevant canvas/layers context-menu action and cancellation, including target retention and an edge/nested-menu case. The now-tested tab/panel matrix does not establish element selection, clipboard or hierarchy operations.
2. **Brand token transaction:** connect the existing token/picker specimen into named edit, sample, cancel and scoped outcome/return. Opening Brand navigation alone does not demonstrate J-07.
3. **AI/Issues and Review scope:** define a meaningful contextual proposal/cancel or truthful provider-unavailable outcome, Issue → target navigation, and representative Review/pin behavior. History safety-failure recovery is credited; it does not substitute for Review or the successful-restore lifecycle.
4. **Unaccounted ordinary actions and caller boundaries:** decide the visible behavior of SEO Save and continue, collapsed-shell navigation beyond the three tabs, other selected-type/caller return paths, and exposed unsupported prototype fields. Distinguish specific simulation limits from missing ordinary links. Repeated copies of a control are inventory obligations, not separate feature demands.
5. **Final evidence/adoption review:** consolidate the current graph and start points, exact visible-control classifications and latest non-panel traversal results; resolve prototype status continuity and post-test visual exceptions; verify meaningful library adoption and finish the J-01–12/requirements matrix. Existing effect/grid foundations and tested Media, CMS, component, page and panel branches should be reused rather than rebuilt.

Gate 6 remains open. No Figma, application or test modifications were made by this reconciliation; it only credits the supplied evidence at its stated scope.


## Grid edge-menu reconciliation

Added nine caller/menu routes from the mutation receipt plus the coordinator's deterministic write-order attribution. Six unique controls have presentation evidence: caller more `8317:243585`; main Arrange `8384:1778`; edge Arrange `8317:247851`; main Escape `8384:1597`; edge Escape `8317:247616`; main outside-canvas `8384:1694`. Initial entry plus eight subsequent actions include repeated opening/toggling, not nine independently tested controls.

Main more-dismiss `8384:1730`, edge more-dismiss `8384:1529` and edge outside-canvas `8384:1492` remain receipt-only. The coordinator identified these node roles from the deterministic mutation order; the raw receipt lists IDs but does not itself contain the named route map. Playback evidence is `phase6-grid-menu-playback.json`, with URLs checked after each action and representative caller/open/submenu/restored renders reviewed in the traversal report.

The receipt removed **177 old background layer IDs**. **41** matched pending audit control identities and were archived with their original records; none was a wired record. This is replacement of the menu's mismatched background, not 41 removed features or passed workflows. The 367 new layer IDs are not 367 newly inventoried controls. Replacement foreground/background control coverage remains explicitly incomplete.

At the Grid-menu checkpoint: **1,236 active records; 229 wired; 1,007 pending**. The opening table reflects the newer Brand delta. Wired evidence: **77 presentation, 122 native-readback-only, 30 unverified receipts**. Archived identities total **63** across prior and current repairs. No removal-driven count reduction is treated as feature completion.

This closes the fixed Grid overflow-entry → submenu toggle → cancellation/dismissal path only. The visible “Action execution not simulated” notice does not imply successful clipboard, duplication, reorder, component creation, lock, delete or Undo. No OS right-click, hover/parent selection, keyboard menu traversal or dynamic edge-position algorithm was exercised. Select-parent test names alone do not establish runtime availability; no historical capability finding was changed on that basis. J-02 and Gate 6 remain open.


## Brand token transaction and applied-value reopening

The representative J-07 transaction now has evidence from active management caller `8334:243338`; the older field-caller frame `8317:242215` remains unchanged and its controls are not automatically promoted. Reconciled the build and reopen receipts into **17 final routes**. Result Change colour `8387:1789` now points to applied-value picker `8389:1500`; the first build's forced return to the original state is preserved only as superseded history.

`phase6-brand-token-playback.json` records **28 actions in two runs**, covering **16 unique final route controls**: open/sample, original unchanged Apply, original and sampled Cancel/Escape, sampled Apply, scoped result, lower return to canvas, Brand re-entry, Brand and canvas Undo, and applied-value picker reopening/Apply/Cancel/Escape. Result header Back `8387:1704` remains native wiring receipt only. Repeated open/sample actions do not create extra verified capabilities.

The finite sample is **#FFFFFF → #F4F6F9**. Before Apply, the picker alone changes; token detail/palette/site sample retain the original. Apply models the bound page background and explicitly labels the state as prototype/not saved. Local control styling remains unchanged. Cancel/unchanged Apply and current-value reopening preserve the appropriate original/applied state. The early applied screenshot predates the Change colour correction; later reopened evidence and recovery traversal establish the final route, rather than retroactively validating the old screenshot.

At the Brand checkpoint: **1,253 active records; 246 wired; 1,007 pending**; the opening table includes the subsequent AI/Issues delta. Wired evidence: **93 presentation, 122 native-readback-only, 31 unverified receipts**. No controls were retired by this delta. Exact route controls were reconciled; the five new states do not yet have a complete inventory of every visible shell/property control.

No actual token write, autosave, persistence, provider request, real Undo, freeform typing, continuous picker gesture, other token/mode or arbitrary navigation is verified. J-07's representative transaction can be credited without claiming every Brand workflow is complete. Remaining priorities are AI/Issues and Review scope, ordinary actions/caller continuity outside tested fixtures, and final native control/adoption/requirement accounting. Gate 6 remains open. No Figma, application or test changes were made by this worker.


## AI unavailable-service recovery and Issues target loop

Reconciled 12 final new route controls: four AI click controls have presentation evidence and two AI Escape handlers remain receipt-only; all six Issues routes have presentation evidence. The existing E01 selected-AI entry is additionally promoted. Eight AI checks and seven Issues checks include repeated regeneration/navigation and one **inactive disabled-Apply guard test**, not 15 newly wired controls. That guard is recorded separately pending an exact node ID, never promoted as a executing Apply route.

The initial build's accidental left-drawer close reaction `8391:1711` is explicitly superseded by actual AI-panel close `8391:1780`. The correction removes a reaction, not a node/product feature. The 135 removed IDs belong to replaced clones in new fixtures and matched zero existing audit controls. Failed initial write was reported rolled back and verified before successful retry; it is not counted as created work.

The unavailable-service frame `8391:1664` retains request/Heading context and offers review/manual-edit recovery without applying text. Issue target `8391:1815` and retained Issues `8391:2071` preserve Image context, unresolved finding and unknown server status. Final icon/source-paint correction is separately verified with no route changes. No provider, generation, successful apply, scan retry, fix, persistence or real selection-engine behavior is implied.

Current accounting: **1,263 active records, 258 wired, 1,005 pending**; wired verification is **104 presentation, 121 native-readback-only, 33 unverified receipts**. Gate 6 remains open. Review/pin flow, contextual-action scope, general state/caller continuity and final library/control accounting remain distinct requirements; completed finite Brand, AI-unavailable, Issues locator and panel loops should not be repeated as missing work.
