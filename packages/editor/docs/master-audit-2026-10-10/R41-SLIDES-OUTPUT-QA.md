# R41 — Slider content management and recovery

13–14 October 2026. Design-only work in improved page `8463:2`, preserving the baseline and application source. [Slider entry](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8843-30923). All 14 module gates remain OPEN.

## Behavior and ownership

The existing Settings Slides field opens a manager with named content, selected slide preview, Duplicate, adjacent Move earlier/later, Add, Delete, Cancel and one-step Undo. Canvas and Layers reflect content and order. Courtyard, Dining room and Contact have distinct heading/body specimens. Structural changes apply across Desktop and Mobile; the Slider parent remains the selected element while the active slide preview is tracked separately.

Duplicate inserts a copy after its source. Add copies the last slide; after deleting all slides it creates New slide. A deletion names the selected slide and its content consequence before confirmation. Cancel/Escape do not delete it. Confirm removes its logical slot; Undo restores the prior content, order and active position. Reordering follows the selected logical slide rather than keeping only a numeric preview index. These recovery and preview guarantees are proposed corrected design contracts; source differences are in the [independent source audit](R41-SLIDES-SOURCE-CONTRACT.md).

The model holds zero to six slides with monotonic logical identities and four content aliases. Six is a prototype capacity, not a production limit. It has one before-state, not full History or Redo. Logical IDs and content codes do not prove engine subtree duplication, serialization, actual ID restoration, CMS binding recovery or persistence. Adjacent move buttons provide an alternative to drag; arbitrary drag/drop is not tested.

Parent lock, slide lock and slide protection refuse destructive edits. Confirmation rechecks captured revision and logical target. Protection changes explicitly clear prior one-step recovery, with a visible explanation; full history interleaving with protection changes remains OPEN. This prevents the earlier snapshot from silently restoring obsolete protection. Undo also checks parent lock. The protected-slide flag is a finite eligibility fixture, not proof of actual component permissions or descendant scanning.

## Native map

| Entry/action | ID |
|---|---|
| Root / existing Slides field | `8843:30923` / `8843:31143` |
| Slides manager | `9010:17477` |
| Duplicate / Add | `9010:17509` / `9010:17518` |
| Move earlier / later | `9010:17514` / `9010:17516` |
| Delete request / confirmation | `9010:17511` / `9010:17548` |
| Confirm / Cancel | `9010:17560` / `9010:17562` |
| Manager Undo / Inspector Undo | `9010:17522` / `9010:17608` |
| Blocked explanation / return | `9010:17534` / `9010:17545` |
| Slide lock / protection / parent lock | `9010:17528` / `9010:17530` / `9010:17532` |

State uses `r41/slides/` variables. The [initial mutation manifest](evidence/r41-slides-mutation.json) records slots, content specimens and action IDs; [correction receipt](evidence/r41-slides-correction.json) supersedes its count-binding and protection/Undo behavior. The author script is historical and must not be rerun against the current file. The state QA script substitutes `NODE_MANIFEST` from the saved manifest before execution.

## Evidence

[Final authored-action interpreter](evidence/r41-slides-state-qa-final.json): **335 checks, zero failures**. Cases cover every position in counts 1–6 for deletion, adjacent moves and their Undo; duplication below capacity; Add including empty; Cancel; protected/locked refusal; injected stale revision/identity; capacity and boundary no-ops; protection changes invalidating stale recovery; and a direct late parent lock refusing an existing Undo. The initial suite had one incorrect expectation about the last effective move's Undo position; correcting that expectation and adding protection tests produced the final suite. These are model checks, not application runtime tests.

[Native inspection](evidence/r41-slides-native-qa.json): four roots, 69 instances, 25 destinations, no missing inspected master/destination; the Settings count field is bound to its changing value. Default manager bounds are 560×690. No claim of full dialog accessibility or all viewport sizes follows from this check.

Browser evidence includes content-bearing Mobile output, duplicate content/order, meaningful Contact reorder, named deletion preview, Cancel, removal and restored Contact. Final evidence is recorded in [corrected recovery walk](evidence/r41-slides-final-recovery-walk.json.receipt.json); screenshots are reviewed as visible outcomes, not inferred from URLs. Earlier `*-probe` and `r41-slides-content-recovery-walk` captures retain the frozen Settings-count defect and are diagnostic evidence only for that field. The first `manager-initial` filename captured the main Settings screen because its click missed the field; it does not prove an open manager.

One correction request timed out. A fresh native read proved its changes were absent; the subsequent smaller mutation applied successfully. The final count binding and protection policy are supported by that receipt, native readback and final model checks, not by the timed-out request.

The [empty/capacity walk](evidence/r41-slides-empty-capacity-walk.json.receipt.json) additionally showed zero slides, New slide creation from empty, six visible rows within the manager, and parent-lock refusal with prior Undo removed. Final polish hides Previous/Next when empty and uses singular `1 slide`; [six targeted action checks](evidence/r41-slides-polish-qa.json) passed after the [polish mutation](evidence/r41-slides-polish.json). The first polish walk missed controls and its screenshots still showed two slides; those captures are diagnostic, not acceptance. The [observed-dialog recovery playback](evidence/r41-slides-polish-recovery.json.receipt.json) records the subsequent settled replay for those two visual details. Earlier broad 335 checks still establish the unchanged structural algorithm; the six targeted checks cover the later change.

Final viewed outcomes: [empty canvas without preview navigation](evidence/r41-polish-empty-confirmed.png) and [New slide with singular count and restored navigation](evidence/r41-polish-new-confirmed.png). Production-source diff remains the pre-existing five files, 139 insertions / 90 deletions; the ElementContextMenu diff SHA-256 remains `98a827cf4fedb2f6cbffa9191f169e7c3c5b3e58bb433272e99056885ec53c5f`.

## Open contracts and next task

Full engine subtree/ID/binding preservation; arbitrary content and slide counts; actual drag insertion; nested/component eligibility; real transaction boundaries and rollback; complete History/Redo; target deletion and asynchronous races; keyboard focus/trapping/announcements; and save/reload remain open. Injected revision tests do not establish real concurrent-browser behavior. Changing protection clears the bounded recovery point; it is not a complete production history policy.

Autoplay/interval/navigation and loop/pause settings remain separately unverified. The source has carousel runtime despite an outdated section comment; this task does not certify playback, exports or configurable loop/pause support. Scope corrections must follow the source audit rather than treating every existing sample toggle as implemented capability.

Next: [Form fields and remote submission plan](R41-FORM-CONTRACT-PLAN.md). It separates potentially lossy field-type replacement from remote form settings, effective site Admin notification permission, incomplete Redirect drafts and failed-save recovery. That packet is a source-backed plan, not authored or accepted form behavior. Continue the remaining Inspector families and R36 module acceptance order afterward.
