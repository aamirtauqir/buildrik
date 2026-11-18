# Recovery continuation — 21 October 2026

**Later continuation:** [Approval and keyboard closure pass](APPROVAL-KEYBOARD-CLOSURE.md) supersedes the second-comment approval endpoint restriction below. Both two-comment origins now have their own approval paths. The earlier counts remain historical.

**Three bounded Figma recovery defects repaired; PARTIALLY VERIFIED overall.**

The owner explicitly confirmed: “Existing Figma design/prototype continue karo; is task ke liye no-Figma rule override hai.” This authorizes the existing design/prototype continuation only. No application code, production data, publishing, emails or deployment changed.

[Open all journeys](https://www.figma.com/proto/2L9OTGzBrL6kYmU18yA1c7/Buildrick?node-id=302-3370&starting-point-node-id=302%3A3370&scaling=scale-down). Canonical file `2L9OTGzBrL6kYmU18yA1c7`, page `3:10` (**09 · Play journeys**).

## Task and decision

Professional site designers must be able to leave an interrupted replacement without changing a lock, submit a confirmed publish into the correct job state, and add another review comment without losing the existing thread. These are observed prototype inconsistencies, not reproduced application defects or interview findings.

Class C1: repair existing recovery contracts with origin-specific specimens and corrected reactions. Keeping generic reset destinations loses context; rebuilding the suite as an arbitrary stateful application would exceed this design-only continuation. The selected approach reuses existing native frames, components, fonts and tokens, preserving the established shell and original paths.

Applicable domains: selection, replacement target, lock/history, publish status, review thread/draft continuity and modal ownership. Application persistence, real permissions and service outcomes remain unknown. Schema migration, new navigation workspaces, billing and new onboarding scope are not applicable.

## Delivered changes

| Finding | Before | Current behavior and ownership |
|---|---|---|
| RCV-01 — locked-image Cancel | Cancel from locked picker or new-target chooser returned to unlocked F3.01 with active Replace. | Both return to **F3.13 `376:25146`** with the original image, page and lock preserved. Layers owns the explicit unlock action; Inspector shows read-only scope and disabled Replace/Alt. Unlock → **F3.14 `376:25424`**, Undo → locked. Scenario Reset remains in the separate prototype controller. |
| RCV-02 — actual Publish submission | Heading text acted as Publish; modal submit jumped to the resumed-job fixture, bypassing the initial queued branch. | Heading `303:36339` is inert. Actual modal Publish `303:36421` → initial job `303:36642`. The existing queued/cancel, failure, unknown and retained-job routes remain. Unknown-job topbar now says **Publish · checking**, consistent with the panel. Cancellation preserves **Lena approved Round 2 · edited since**, rather than implying renewed approval. |
| RCV-03 — second comment | Add comment from open or resolved thread entered a zero-comment draft; Cancel visually removed the existing thread. | Separate OPEN and RESOLVED draft/pending/failure/acknowledged branches preserve the original note, status, resolved reply and sent snapshot. Cancel returns to the exact origin; Keep editing/Retry keep the second draft; acknowledgment shows two distinct notes. Twelve Add-comment reactions behind approval modal/status surfaces are removed. Original approval entries remain intact. |

F3 status feedback was shortened to **Replacement cancelled** and **Image deleted · not replaced** to fit beside Details; explicit lock/deletion scope remains in Layers/Inspector. Cancelled-publish feedback now reads **Publish cancelled · v12 kept**, clearing Details. A final [native render](recovery-publish-cancelled-final-native.png) verifies the shortened footer and retained stale-approval label. These two copy-only changes followed independent review; reactions and transition counts are unchanged. Second-note guidance says **Commenting on Logo · Round 3**. Prototype instructions remain in the controller.

### New native specimens

| Family | Draft/entry | Pending/unlock | Failure | Acknowledgment |
|---|---|---|---|---|
| F3 lock return | `376:25146` | `376:25424` | — | — |
| F5 second note, prior thread Open | `377:25498` | `377:25549` | `377:25609` | `377:25669` |
| F5 second note, prior thread Resolved | `377:25747` | `377:25798` | `377:25858` | `377:25918` |

Ten new editable 1440×996 specimens, including the existing 96px prototype controller. F3 retains 284px Layers and 300px Inspector. F5 retains its 360px comments column and anchored composer. No panel-width or authored-page-breakpoint changes.

The second-note acknowledgment specimens explicitly end this focused example. Their further comment, role-switch and approval controls are not simulated. Original approval journeys still exist from the original open/resolved origins. This is not arbitrary repeat-comment or approval-after-second-note coverage.

## Actual verification

[Playback log](recovery-playback-current-log.json): **91 attempts, 89 successful destination transitions, two initial clicks that stayed at their origin; 60 distinct successful edges**. The two misses occurred on initial F3 and resolved-review entry attempts. The same paths subsequently passed after the player settled. Root cause is not established; the unsuccessful attempts remain in the log. Direct page loads are excluded. Several initial page loads also timed out while eventually displaying the requested frame; no successful navigation is inferred from those timeouts.

The 89 transitions comprise 40 baseline/recovery observations and **49 successful post-repair acceptance transitions**. The baseline log includes two clicks on the formerly actionable Publish heading; those are evidence of the defect, not valid current product actions. The final Publish acceptance specifically uses `303:36421`.

| Completed sample | Evidence |
|---|---|
| Locked target → alternate Gallery picker → Cancel → Replace → Undo | [Baseline Assets plan](recovery-plan-assets.json), [Gallery picker](recovery-current-gallery-picker.png), [applied](recovery-current-gallery-applied.png) |
| Both locked Cancel paths → lock preserved; Unlock/Undo; both deleted-target Cancel paths without resurrection | [Assets acceptance](recovery-accept-assets.json), [locked return](recovery-fixed-locked-return.png), [unlocked](recovery-fixed-unlocked.png), [final deletion status](recovery-deleted-final-native.png) |
| Publish failure/retry, unknown/retained job through Issues, resumed job, queue cancellation and already-deploying race fixture | [Baseline Publish plan](recovery-plan-publish.json), [final unknown status](recovery-publish-unknown-final-native.png) |
| Correct actual Publish → initial job → queued → cancel → cancellation acknowledged | [Publish acceptance](recovery-accept-publish.json), [actual entry](recovery-fixed-publish-entry.png) |
| Open-thread second note: exact Cancel, failed send, Keep editing, Retry, two-note acknowledgment and hub return | [Open acceptance](recovery-accept-open.json), [acknowledgment](recovery-second-open-ack.png) |
| Resolved-thread second note: same recovery, with resolution and reply retained | [Resolved acceptance](recovery-accept-resolved.json), [draft](recovery-second-resolved-draft.png), [failure](recovery-second-resolved-failed.png), [acknowledgment](recovery-second-resolved-ack.png) |

Method: current native control reads, Chromium at 1600×1100, pointer/mouse events at rendered control centers. Actual native destinations were read from the player URL after each click. No URL changes or forced state edits were used to manufacture a transition. Outcomes use the controller's explicitly simulated fixtures, not real service calls.

[Graph audit](recovery-repair-graph.json): **195 native roots, 616 connections, all 195 reachable from the hub, zero invalid destinations, every non-hub root has a direct hub return**. This is structural coverage, not 616 browser-played edges.

[Structure audit](recovery-repair-structure.json): all ten new specimens contain editable text/components/vectors rather than full-UI image layers; Inter/Geist Mono match the existing system; sampled descendants stay inside the root. Bounds do not establish typography or accessibility acceptance.

## Separate design-quality assessment

| Dimension | Assessment and limits |
|---|---|
| Geometry | Native and browser samples fit at authored/default desktop dimensions. Status/Details overlap and misplaced standalone comment-pin text were corrected. Narrow/short viewports, text enlargement and responsive reflow are NOT RUN. |
| Grouping and hierarchy | Lock is attached to the selected Layers row; disabled property controls and explanation stay with the image. Existing thread/status/reply remain grouped; second note has its own number and Open status. Publish heading is separated from the command. |
| Labels and status clarity | Locked/deleted feedback names the consequence; unknown publish no longer advertises a fresh Publish changes action. Comments remain at one through draft/failure and become two only after simulated acknowledgment. Some Chromium captures still show intermittent text crowding absent from inspected native renders; rendering stability is unresolved. Existing truncated Alt input display is not a newly validated property editor. |
| Interaction/accessibility | Repaired pointer routes pass the listed acceptance sequences. A player accessibility snapshot at `303:39317` exposed Previous frame, Next frame and Restart, not the product controls. No product keyboard/focus or screen-reader acceptance follows. |

[Independent read-only review](recovery-independent-review.md) checked actual routes, semantics and two native renders and found no unresolved blocker in the repaired scope. It did not run a second browser execution. G1/G2/G3/G5/G7 pass within this bounded scope; G4 is sampled, G6 passes pointer/structural checks only, G8 application implementation remains NOT RUN. This handoff and linked evidence cover G9 for the declared output.

## Authoring and remaining boundary

- [F3/F4 authoring ledger](recovery-repair-f3-f4-ledger.json)
- [F5 authoring ledger](recovery-repair-f5-ledger.json)
- [Visual/copy refinements ledger](recovery-repair-refinements-ledger.json)
- [Post-repair controls](recovery-controls-current.json)
- [Playback helper](recovery-playback.py): recorded desktop fit only; inspect player bounds before reuse. Baseline Publish plan predates the heading repair and must not be rerun as a current acceptance plan.

Remaining: other unplayed approval/code-error branches, desktop playback, keyboard/focus/assistive technology, narrow/short viewport behavior, rendering stability, service persistence/permissions and real-participant acceptance. R1/B9 remains pending because participants are unavailable. No waiver, product-wide completion or implementation readiness is claimed.

