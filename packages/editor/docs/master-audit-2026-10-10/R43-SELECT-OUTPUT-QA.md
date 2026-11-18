# R43 — Select/options output and recovery QA

14 October 2026. **Bounded Select edits and recovery have authored-action and reviewed browser evidence. The navigation correction and Form → Fields → Service entry are verified; the conversion guard, return through Service/Fields, Mobile output and Service Layer reopening are browser-reviewed. All 14 module gates remain OPEN.** This report does not close Form or Inspector.

The design replaces the historical Options label toggle with a shared Service Select task. Canonical Select root `8843:19020`, Options entry `8843:19246`, Form root `8843:30589` and Admin Form root `9026:17615` use the same option state. New anchors are options manager `9035:17710`, Service detail `9035:17756`, review `9035:17806`, refusal `9035:17777`, unsupported conversion explanation `9035:17791`, Form Fields Service entry `9035:17842`, and canonical Select Undo `9035:17839`. The [authoring manifest](evidence/r43-select-mutation.json) records these IDs and variables; it is not behavior acceptance by itself.

## Evidence status

| Layer | Result and boundary |
|---|---|
| Source contract | [R43-SELECT-CONTRACT.md](R43-SELECT-CONTRACT.md) records current metadata-loss, content/child representation and unsafe conversion risks. The proposed source corrections have not been implemented. |
| Live reaction interpretation | [Interpreter](evidence/r43-select-state-qa.js), [result](evidence/r43-select-state-qa.json): **9,186 passing assertions, zero failures**, 44 inspected nodes, no native node or variable mutations. These are repeated state checks, not 9,186 accepted tasks. |
| Final native structure | [Native audit](evidence/r43-select-native-qa.json): nine scopes, 579 nodes (462 visible), 184 instances resolving to five component definitions, 36 resolved destinations and 453 geometry checks; no missing references, errors, clipping candidates or unclipped overflow in the inspected state. This is the audit after navigation correction. |
| Reviewed browser output | Root reviewed Engineering label/value/default preservation, visible renamed Mobile output, confirmed removal with explicit first-option fallback, Undo restoring Strategy/order/default, and corrected Form → Fields → Service entry. Strategy-first/default, deletion Cancel and restored-Mobile captures are now also visually reviewed, along with safe Form Select conversion refusal. |
| Navigation / Form conversion guard | [Correction receipt](evidence/r43-select-navigation-correction.json) records corrected Select Layers and added Service entries in both Form roots. Form → Fields → Service detail, conversion explanation, return/reopen and the Form Service Layer entry are browser-reviewed. Admin Layer playback remains unverified. No option-state logic changed. |
| Runtime | **OPEN.** No engine subtree/history proof, actual native HTML control behavior, submission, durable read-back or publishing is established. |

## Bounded authored behavior

Three logical option identities have immutable submitted-value literals: Design → `design`, Development → `development`, and Strategy → `strategy`. The starting fixture contains Design and Development, with Development explicitly selected by default. Finite label edits produce Brand design, Engineering and Consulting respectively; they do not change submitted-value literals. Three is prototype capacity, not a production option maximum. These are logical identities/generations, not verified engine IDs.

Options can be added, moved earlier/later, selected as defaults and removed through a named preview. Single mode has at most one explicit default. Multiple mode can toggle each default; reducing multiple explicit defaults to single mode asks for confirmation and keeps the first selected option in current order. No explicit default is distinct from an empty option list: single mode explains its first-option fallback; multiple mode says there are no initial selections. Removing the last option produces an empty state with Add recovery.

The implemented deletion contract deliberately clears the removed option's explicit default and discloses the remaining first-option fallback. This is an authored resolution of the earlier contract's default-loss concern; it does not implement the earlier suggested replacement-choice editor. Likewise, labels are immediate finite actions rather than an arbitrary text draft/Apply editor. Value editing is not represented.

Name, Required, Disabled and Multiple participate in the modeled Select recovery snapshot. Options and semantic flags apply across devices. The selected specimen is a Figma representation of the choice/default, not an interactive native HTML Select or a submitted form. A changed flag label alone is not proof of native Required/Disabled behavior.

## What the reaction assertions establish

The interpreter reads current native node reactions and local variable defaults, then executes them against an in-memory map. Its matrix exercises six option orderings, three selected identities, single/multiple modes and several default sets. Repeated setup/output checks account for much of the total; the count is not a completion metric.

| Check group | Passing assertions | Bounded evidence |
|---|---:|---|
| Order, label, default and deletion matrix | 8,424 | Rows/details keep identity-associated value literals; label edits retain defaults; movement follows identity; preview, Cancel/Escape, confirmed removal and Undo preserve or restore the represented tuple. |
| Membership, empty state and generation | 124 | Add appends a free identity; empty recovery works; full-sample refusal retains useful history; Undo restores removed options; re-add allocates a fresh monotonic generation. |
| Single/multiple reduction | 489 | Explicit defaults and first-option/no-selection captions agree; reduction confirmation/Cancel/Undo behaves as modeled. |
| No-ops, flags and protection | 103 | Repeated finite label, same single default and boundary moves preserve useful Undo; flags restore through Undo; protected/stale changes refuse; parent-revision changes and lock/unlock cannot revive old recovery. |
| Caller return and unsupported conversion | 36 | Originally authored Form versus standalone Done/Escape routes and conversion explanation preserve represented data/history. The later correction changes Layers/entries without option-state logic changes; conversion refusal and the Form return sequence are browser-reviewed. Admin caller playback remains unverified. |
| Remote domain isolation | 10 | Select actions do not write R42 Form/remote variables; a simulated remote acknowledgement retains the Select snapshot; Select Undo leaves remote settings unchanged. |

Deletion confirmation checks selected logical identity/generation, Select revision and captured parent revision. Multiple-to-single reduction is a Select-wide operation; its stale guard uses Select/parent revision rather than the currently selected option row. Protection and no-op evidence is interpreter evidence unless separately identified as browser playback below. Constant value text is not proof of an actual submitted value.

## Reviewed browser outcomes

The root author visually reviewed the captures for the outcomes below during prototype playback. The valid rename sequence is [edit replay](evidence/r43-select-edit-replay.json); earlier exploratory edit walks are not substituted for it.

| Outcome | Evidence and review status |
|---|---|
| Rename preserves value/default | [Engineering details](evidence/r43-select-renamed-keeps-value.png) retains submitted value `development` and the explicit default. [Canvas output](evidence/r43-select-renamed-canvas.png) shows the changed label. |
| Mobile output | [Renamed Mobile](evidence/r43-select-renamed-mobile.png) visibly retains the changed choice label. This is a global semantic edit viewed on another device, not a Mobile override. |
| Add and order | [Added Strategy](evidence/r43-select-added-strategy.png) is recorded. Root reviewed [Strategy first](evidence/r43-select-strategy-first.png) and [Strategy default](evidence/r43-select-strategy-default.png), confirming the new order and explicit default. |
| Preview and cancel | [Deletion review](evidence/r43-select-delete-review.png) is recorded. Root reviewed [Cancel retains default](evidence/r43-select-delete-cancel-keeps-default.png), confirming Strategy and its default remain. |
| Confirm and Undo | [Default removed](evidence/r43-select-default-removed.png) discloses first-option fallback after removal. [Undo restores order/default](evidence/r43-select-undo-restores-default-order.png) restores Strategy, its position and explicit default. Root also reviewed [restored Mobile output](evidence/r43-select-restored-mobile-output.png), confirming the recovered choice is visible. |
| Corrected Form entry | Root reviewed [Form Service detail](evidence/r43-form-service-detail.png): Form → Fields → Service reaches the Select detail, with the corrected Service Layers context. Root reviewed [conversion guard](evidence/r43-form-select-conversion-guard.png): safe explanatory refusal leaves Form and Development intact. [Back to Select](evidence/r43-form-select-conversion-return.png) returns without changing Development; [reopened options](evidence/r43-form-select-options-reopened.png) retains its submitted value/default. |

Related playback records: [recovery walk](evidence/r43-select-recovery-walk.json) and [delete/Undo walk](evidence/r43-select-delete-undo-walk.json). A screenshot filename alone is not acceptance evidence; the reviewed claims above rely on the root's visual review, the [Form conversion walk](evidence/r43-form-select-conversion-walk.json) and [Form return walk](evidence/r43-form-select-return-walk.json) establish the reviewed sequence below. Earlier blank exploratory walks are diagnostic failures; they do not count as acceptance.

The Form sequence additionally verifies [Engineering with value development/default retained](evidence/r43-form-select-renamed-shared.png), [Done returning to Service detail](evidence/r43-form-select-done-returns-detail.png), [Back to Form Fields](evidence/r43-form-select-back-fields.png), [Escape to the Form canvas](evidence/r43-form-select-back-canvas.png), [Mobile output retaining Engineering](evidence/r43-form-select-mobile-output.png) and [Service Layer reopening the detail](evidence/r43-form-select-layer-reopens-detail.png). Message remains Long text with its green appearance and original default. This is the Form caller path; it is not exhaustive Admin or Escape-from-every-dialog coverage.

## Final native structure and remaining work

The nine-root audit includes the canonical Select, both Form roots, five Select dialogs and the existing Form Fields manager with four selectors. Its zero-issue geometry result covers the current authored state, not every multiple-default caption or device combination. Native width bindings and wrapping metadata are recorded, but the audit did not execute Mobile states. The inspected instance/destination counts are structural inventories, not accepted flows. The [navigation correction](evidence/r43-select-navigation-correction.json) corrects canonical Select Layers to Contact form / Service Select / 1 selected and adds Service layer entries `9045:17500` (Form) and `9045:17518` (Admin). These entries copy the existing Service canvas actions; they do not change the option-state logic. The final native audit reflects this correction. Browser evidence verifies the Form Fields and Service Layer entries and the Form return sequence. Admin Service Layer playback remains unverified.

Remaining design gaps include:

- Submitted-value editing and its blank/duplicate validation policy; arbitrary label entry and draft cancellation.
- Optgroups, disabled options, group metadata and other imported attributes; preservation or explicit no-write handling must be designed.
- Conflicting content-backed and child-backed options. The current application Options writer can lose metadata or leave stale/duplicate child options; this prototype does not repair that representation conflict.
- Visual coverage for all multiple/default/empty combinations, protected/stale refusal and Admin caller return after the navigation correction.
- Native control affordances, keyboard/focus behavior, accessible labels, visitor selection versus authored defaults, and Required/Disabled/Multiple effects.

Runtime gates remain actual field/option identity and serialized subtree recovery, transaction/no-op/history behavior, concurrent edits and effective permissions, export/read-back, native HTML default/selection semantics and real submitted values. No real submission or publishing was performed. The bounded Select work extends R42; it does not close the full Form contract, Inspector or any of the 14 module gates.

Production preservation: the existing five-file source diff remains 139 insertions / 90 deletions. Whole `src` diff SHA256 remains `fcce0a4e7dd29361ad875a7cb89383b211d95c84816b4ecba2c2fb6e712db2bd`; ElementContextMenu-only SHA256 remains `98a827cf4fedb2f6cbffa9191f169e7c3c5b3e58bb433272e99056885ec53c5f`. No production source edits were made for R43.
