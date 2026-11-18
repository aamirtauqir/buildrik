# R40 — Columns output and recovery

13 October 2026. Design-only continuation in existing improved Figma page `8463:2`. [Columns entry](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8843-25014). Original baseline and application source preserved. All 14 module acceptance gates remain OPEN.

## Authored behavior

The existing Column elements control now changes the finite specimen and matching Layers membership across choices 2–6. Increasing count retains existing content and adds named placeholders. Decreasing count previews trailing content removal before confirmation; Cancel and Escape leave content intact. One-step Undo restores the original Contact sample. Increasing after removal creates Col 3 instead of recovering Contact. Count is global across Desktop and Mobile; choosing the current count preserves useful Undo.

Locked parent and protected Contact removal show distinct no-write explanations. Commit rechecks the captured revision and protection flags. Descendant protection is a proposed correction to the source count path, not implemented application behavior. Stale revision refusal is authored and interpreter-checked; no concurrent browser scenario is claimed.

Settings Gap opens canonical Style/Layout. Choices 0/8/16/24/32 px change specimen spacing without changing membership or content. The bounded fixture has Desktop base 24 px and an optional Mobile override. Mobile reset removes that override; Undo restores its value and presence. The sample base is not a universal production default. Desktop rows and Mobile stacks are fixed layout specimens; arbitrary Display/Direction/Wrap changes are not output-certified.

Shared CSS track controls are labelled Grid columns / Grid rows and use existing eligibility flags, keeping them hidden for this Flex fixture. They do not create or delete child elements. Fresh inspection found the count and Gap controls already existed but were omitted from the control register; two rows were added, bringing its inventory to 531, without duplicating controls.

## Handoff map

| Control/state | Native ID |
|---|---|
| Columns root / Settings | `8843:25014` / `8843:25079` |
| Count field / chooser | `8863:17111` / `8863:17115` |
| Settings Gap link / canonical Style Gap | `8863:17136` / `8841:14919` |
| Removal preview / Confirm / Cancel | `8990:17543` / `8990:17555` / `8990:17557` |
| Protection explanation / Close | `8990:17560` / `8990:17571` |
| Count Undo / Gap reset / Gap Undo | `8990:17528` / `8990:17589` / `8990:17591` |
| Parent / Contact lock fixture | `8990:17535` / `8990:17539` |

State uses `r40/columns/` variables, with count, device, generation, content identity, protection, revision, Gap origin and a single before-state. Ten complete visible specimens cover two devices × five counts. [Final render manifest](evidence/r40-columns-render-fix.json) supersedes the initial child-node manifest. Logical identity means slot plus generation; display node IDs across specimens are aliases, not engine element IDs. This demonstrates the intended recovery contract, not actual tree deletion, serialization or engine ID restoration.

## Verification

- [Final authored-action checks](evidence/r40-columns-state-qa-final.json): 142 Columns checks passed, including all 25 count transitions, no-op history, cancellation, protection, injected stale revision, logical identity/content restoration, all five Gap values and responsive recovery. Existing Icon 153 and typography 112 regression checks passed. These execute an interpreter of authored Figma actions, not the application engine.
- [Native inspection](evidence/r40-columns-native-qa.json): six roots, 159 instances and 40 destinations; no missing inspected master or destination. Ten complete specimens have correct child counts and Gap binding. Native default Mobile geometry is not proof of browser reflow.
- [Final count walk](evidence/r40-columns-final-count-walk.json.receipt.json): visible 3→4→Undo, removal preview, 3→2 and Undo to original Contact. [Recreation/six walk](evidence/r40-columns-recreate-six-walk.json.receipt.json): new Col 3 after removal, six boxes/layers on Mobile and Desktop, global count.
- [Lock walk](evidence/r40-columns-lock-walk.json.receipt.json): protected removal blocked; Escape closes without removing Contact; parent lock blocks editing. Full keyboard focus and accessibility remain unverified.
- [Gap walk](evidence/r40-columns-gap-final-walk.json.receipt.json): Mobile 32 px local override, reset to inherited 24, Undo to 32, close/device return/reopen. Visually reviewed `r40-final-gap32.png`, `r40-final-gap-reset24.png`, `r40-final-gap-undo32.png` and `r40-final-gap-reopen32.png` show field/origin/output. Desktop and Mobile Settings captures show geometry and count; they do not display numeric Gap or origin. An independent auditor reviewed recovery/return and Mobile six screenshots. Receipts plus reviewed outcomes support the sampled journeys; filenames or URLs alone are not acceptance.

Early captures are diagnostic, superseded evidence: initial cold-load screenshots do not establish device state; `r40-added4.png` and `r40-removed2.png` exposed disappearing retained labels. Complete count specimens fixed that rendering defect; final count captures show Intro, Services and retained/restored Contact correctly. Dialog title sizing, count grouping, Gap recovery height and default Direction readout were also corrected. Final visual-only polish widens Lock/Unlock controls and matches added Layers rows to existing styling; actions and state were unchanged. The [final polish walk](evidence/r40-polish-walk.json.receipt.json) and visually reviewed [Unlock label](evidence/r40-final-unlock-label.png) / [six consistent layer rows](evidence/r40-final-six-layer-styling.png) confirm these corrections.

## Remaining acceptance

The [source contract plan](R40-COLUMNS-CONTRACT-PLAN.md) records stale metadata readers, range/parseInt differences, base-only Gap writing, missing descendant guards and transaction risks. Its proposed mixed/incompatible selection state is still not authored. Full engine identity/content restoration, arbitrary/imported children, bulk selection, component protection, missing targets, rollback and selected-descendant focus remain open. Count 1 and strict input validation need decisions; no structural reset default is invented.

Only one-step count/Gap history is covered; lock toggles are fixture controls outside that history. Full Undo/Redo, Tablet/pseudo cascades, arbitrary Gap units, empty versus zero input, per-axis gaps, read-only/permission changes and generic layout output remain open. Source/model evidence is not application runtime parity. No application tests were run or application source changed.

Next: follow the [remaining Inspector queue](R40-INSPECTOR-REMAINING-QUEUE.md), starting with Slides/Form fields structural recovery, then remote Form save boundaries and Video Ratio ownership. [Saved Components](R40-SAVED-COMPONENTS-TASK-PLAN.md) remains a source-backed plan, not an authored or accepted R40 flow.
