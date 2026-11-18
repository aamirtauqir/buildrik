# R42 — Form fields and submission-settings output QA

14 October 2026. **Bounded Form evidence: 1,831 field and 217 remote authored-action checks passed; selected conversion, remote recovery and cross-domain Undo browser outcomes reviewed. All 14 module gates remain OPEN.** This does not declare the full Form task or Inspector complete. Admin recipient save/validation and representative field cancellation/protection refusal were also visually reviewed.

The bounded Form design separates document field conversion from remote submission settings. It reuses the existing [Form Settings entry](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8843-30589), root `8843:30589`; Fields is `8843:30809`, and After submit is `8843:30815`. Field structure applies at every breakpoint. The Form parent remains the remote-settings identity when a child field is replaced.

## Current evidence status

| Evidence layer | Current bounded result |
|---|---|
| Field conversion source review | Complete as a contract review; [R42 conversion review](R42-FORM-CONVERSION-REVIEW.md) distinguishes existing source from proposed corrections. |
| Field authoring receipt | [Mutation manifest](evidence/r42-form-fields-mutation.json) records authored nodes, variables and snapshot fields. It is not behavior acceptance by itself. |
| Live field reaction interpretation | **1,831 checks passed; zero failures.** [Executable interpreter](evidence/r42-form-fields-state-qa.js), [result](evidence/r42-form-fields-state-qa.json). |
| Field browser playback / visual output | Root reviewed Message→Text on Mobile and Desktop, retained green appearance/default, and Undo to Long text. Conversion Cancel keeps Long text/default/Rows4; a locked field refuses conversion with an explanation. |
| Remote saved/draft/pending state verification | **217 checks passed; zero failures.** [Live-reaction interpreter](evidence/r42-form-remote-state-qa.js), [result](evidence/r42-form-remote-state-qa.json). Root reviewed bounded Editor refusal and Admin recipient save/invalid-value outcomes below. |
| Combined field Undo / remote state isolation | Both reaction-domain boundaries passed. Root reviewed field Undo restoring Long text while acknowledged Redirect `/thanks` and Spam On remained visible in [combined recovery](evidence/r42-form-undo-retains-remote-save.png). |
| Native structure and geometry | [Read-only native receipt](evidence/r42-form-native-qa.json): 15 audited roots, 149 instances resolving to five components, 35 reaction destinations, 381 geometry checks; zero missing references, errors, clipping candidates or unclipped overflow in the inspected state. |
| Application/runtime verification | **OPEN.** No application source change, engine restoration proof, durable server write, submission, notification delivery or publishing is established by this pass. |

## Authored field contract and important source differences

The finite fixture has three fields—Name, Email and Message—and six offered destinations: Text, Email, Phone, Number, Date and Long text. Message starts with a one-line prose default, maxlength 120, Rows 4 and green field styling. The model supports empty default and one prose sample; it is not a general-purpose input validator.

| Concern | Current source | Corrected finite design / evidence boundary |
|---|---|---|
| Replacement preservation | `FormFieldsSection.tsx:66` copies name, placeholder, aria-label, required and HTML ID but omits default content, maxlength, classes and styles. | Proposed correction preserves compatible authored default, maxlength and represented appearance. The interpreter proves variable-backed default/maxlength transitions. Browser captures support retention of the represented green appearance and default. Constant labels, HTML attributes, classes and actual style/subtree preservation still require runtime evidence. |
| Default representation | `attributeWriter.ts:112` writes textarea default to content and value; `PropertyField.tsx:147` reads value first. | Intended mapping is textarea content → input default, with the reverse mapping on conversion to textarea. Conflicting imported representations remain OPEN. |
| Identity | `FormFieldsSection.tsx:107` edits input subtypes in place; crossing textarea/input creates a replacement at the same position. | The model preserves generation for input subtype changes and allocates a fresh logical generation across the textarea boundary. Undo restores the previous generation; later conversion gets a new generation. These are logical prototype values, not engine IDs. |
| Rows / constraints | Current replacement discards attributes outside its whitelist. | Input destinations remove Rows; fresh textarea gets Rows 2; Number/Date remove maxlength. Undo restores the represented original values. Native HTML constraint behavior is not tested. |
| Compatible defaults | Current source does not provide the proposed compatibility preview. | Empty defaults permit all six offered destinations. The prose sample is retained for Text/Phone/Long text and refused for Email/Number/Date. Arbitrary valid emails, numeric/date strings and multiline text remain outside this fixture. |
| Protection / stale target | `FormFieldsSection.tsx:110` gates the Form parent, not all field/subtree eligibility; its editor follows replacement by index. | Corrected actions check parent/field protection, captured field, generation and revision. Protection toggles explicitly clear previous one-step field recovery. Full component, descendant, permission and concurrent document behavior remains OPEN. |
| Selection / labels | The source's “Label” at `FormFieldsSection.tsx:116` changes placeholder only. | The design distinguishes placeholder from visible label and retains the targeted field detail. Accessibility relationships and focus restoration require separate verification. |

Source paths above are under `src/editor/inspector/sections/`; `attributeWriter.ts` and `PropertyField.tsx` are under `typeBlock/`. Full anchors and compatibility decisions are in [R42-FORM-CONVERSION-REVIEW.md](R42-FORM-CONVERSION-REVIEW.md).

**Select remains an explicit gap.** Source enumeration includes Select, but `FormFieldsSection.tsx:50` misidentifies it as Text; changing its type can either leave its tag unchanged or replace it and remove options. The finite field script does not author a Select/options fixture or unsupported-conversion explanation. Select must not be counted as accepted or advertised as a working conversion.

## What the 1,831 checks establish

The interpreter read current Figma node reactions and local variable defaults, then executed the reactions against an in-memory map. Synthetic setups exercised **3 field slots × 6 source types × 6 destination types**, plus compatible-prose and guard/recovery scenarios. It did not set native variable values or mutate nodes. The result records 29 inspected node IDs and empty mutation lists.

- Conversion review keeps the document and generation unchanged; confirmation updates only the selected field's represented type, generation, default, Rows and maxlength.
- Empty-default conversion covers every source/destination pair. The prose sample retains compatible content and refuses Email/Number/Date without changing data, generation or history.
- Replacement generation changes only across textarea/input; Undo restores the represented document and selected field without recycling the monotonic allocation counter.
- Current-type choices, default no-ops, rejected choices, chooser Cancel, confirmation Cancel and Escape preserve the preceding useful Undo snapshot.
- Stale revision, changed field, changed generation and late parent/field protection refuse confirmation without consuming history or allocating a generation.
- Protection toggles invalidate old one-step Undo. Both manager and inspector Undo refuse a forced late parent lock; recovery succeeds after unlocking in that synthetic scenario.
- All interpreted field writes stayed within the `r42/form/` field-document variable domain. The separate remote interpreter below verifies the reverse boundary.

Key authored anchors: manager `9024:17458`; type chooser `9024:17514`; default chooser `9024:17539`; conversion review `9024:17557`; Confirm `9024:17572`; refusal `9024:17500`; manager Undo `9024:17487`; inspector Undo `9024:17623`; canvas specimen `8843:30918`.

## What the 217 remote checks establish

The [remote interpreter](evidence/r42-form-remote-state-qa.js) read live Figma reactions and variable defaults, then evaluated them against an in-memory map. [Its result](evidence/r42-form-remote-state-qa.json) records 217 passing assertions, 33 inspected nodes and empty mutation lists. These assertions include repeated fixture setup checks; they are not 217 separate accepted tasks. The [corrected authoring receipt](evidence/r42-form-remote-correction.json) identifies the variables and nodes under test.

- Saved, draft and pending values remain separate. Incomplete/invalid Redirect and invalid notification email produce specific validation statuses without requests; either invalid draft leaves unrelated valid setting groups saveable.
- No-op settings do not increment the request count or discard other drafts. Acknowledgement copies only the pending action/URL, message, recipient or spam group, preserving subsequent and unrelated drafts.
- The second simulated request fails deterministically without changing saved values. Retry sends the retained draft to its original Contact form target. An unrelated successful save cannot hide an older unsaved draft's Retry control.
- Retry chooses one dirty group in action, message, recipient, spam priority. It does not implicitly save all drafts together.
- Send and acknowledgement recheck target identity and edit permission. Notification acknowledgement additionally requires effective Admin permission. Editor refusal and a separate Admin root are exercised; this is not an in-product role switch.
- Dirty Done/Escape reaches the keep/discard decision. Child-dialog Escape returns to settings without discarding drafts. Discard restores saved values to drafts without changing acknowledged values.
- Loading and Saving have no Escape reaction; all eight remote overlays have native background interaction `NONE`. Remote reactions write only `r42/remote/`; canvas Undo has no remote-variable writes and leaves the full remote state unchanged in the interpreted sequence.

This is finite authored simulation, not an HTTP request, durable server read-back or effective backend authorization test. The URL/email choices are fixture values, not a general validator. Key anchors: settings `9026:17446`, Loading `9026:17476`, Saving `9026:17487`, Retry `9026:17471`, dirty exit `9026:17570`, separate Admin root `9026:17615`.

## Reviewed browser evidence and limits

The following outcomes were visually reviewed by the root author during prototype playback. The native audit and interpreters are separate evidence layers, not substitutes for these observed outputs.

| Bounded outcome | Evidence and observation |
|---|---|
| Field conversion across devices | [Mobile Text](evidence/r42-form-converted-mobile.png) and [Desktop Text](evidence/r42-form-converted-desktop.png) retain the represented green appearance and prose default after Message→Text conversion. [Undo](evidence/r42-form-undo-desktop.png) restores Long text. |
| Specific Redirect validation | [Incomplete URL](evidence/r42-form-redirect-incomplete.png) asks for a redirect URL; [invalid URL](evidence/r42-form-url-invalid.png) asks for a site path or HTTP(S) URL. |
| Independent save with another invalid draft | [Spam acknowledged Off](evidence/r42-form-spam-saved-with-url-draft.png) retains the invalid URL draft while displaying the saved spam change. |
| Failed request and recovery | [Redirect save failure](evidence/r42-form-redirect-save-failed.png) retains the `/thanks` draft; [Retry acknowledgement](evidence/r42-form-retry-saved.png) shows saved Redirect and `/thanks`. |
| Effective Editor notification refusal | [Recipient denied](evidence/r42-form-editor-recipient-denied.png); [Escape return](evidence/r42-form-permission-escape.png) returns to settings. |
| Dirty exit and discard | [Escape guard](evidence/r42-form-dirty-exit-guard.png); [discard](evidence/r42-form-discard-retains-saved.png) retains the acknowledged settings. |
| Canvas Undo / remote save isolation | [Final combined recovery](evidence/r42-form-undo-retains-remote-save.png) restores Long text while saved Redirect `/thanks` and Spam On remain. This supports the bounded field-Undo-after-remote-save sequence. |

**Saving dismissal limit:** [saving-outside-click](evidence/r42-form-saving-outside-click.png) was captured after acknowledgement. It does not prove that an outside click during Saving was blocked. The available non-dismissal evidence is the native `NONE` overlay setting and absence of Loading/Saving Escape reactions; timing-sensitive browser dismissal remains unverified.

**Admin browser playback reviewed:** the [Admin settings fixture](evidence/r42-form-admin-settings.png) exposes recipient editing; [acknowledged team@example.com](evidence/r42-form-admin-recipient-saved.png) appears separately from the draft. An [invalid recipient](evidence/r42-form-admin-invalid-recipient.png) retains the saved email and displays its own validation message. Dirty Escape reaches the decision; Discard returns to the Form root. This is simulated permission behavior, not an actual role grant or email delivery.

**Field cancellation/protection reviewed:** [Cancel](evidence/r42-form-cancel-unchanged.png) retains Long text, the sample default and Rows4; [locked conversion refusal](evidence/r42-form-locked-conversion-refusal.png) explains that the protected field is unchanged. The broader matrix remains interpreter evidence. Input subtypes share a specimen; Rows 2 versus Rows 4 is represented in details without distinct textarea height. Do not generalize the captures to native date/email/number controls or complete Rows rendering.

## Native audit and remaining acceptance

The [native audit](evidence/r42-form-native-qa.json) covered two Form roots, five field-dialog frames actually present in the manifest, and eight remote dialogs: 15 roots total. All 149 instances resolved to five component definitions and all 35 unique reaction destinations resolved. It found no issues in 381 geometry checks for the authored state. This inventory is reference/geometry evidence, not 15 accepted flows or coverage of every variable state. Canvas and Inspector scroll containers were identified separately; the manifest contains five field dialogs, not an inferred sixth.

Remaining design evidence includes Select/options behavior or an explicit unsupported-conversion explanation. Arbitrary/default compatibility states and native control appearances remain outside the finite fixture. Further design acceptance must preserve the entry → meaningful output → recovery → return sequence rather than count authored screens.

Outstanding runtime gates include actual engine identity/subtree recovery; labels, bindings, interactions and imported metadata; arbitrary defaults and constraints; breakpoint/pseudo styles; keyboard/focus behavior; protected/mixed selections; history coalescing/rollback/autosave; remote races, effective grants and durable read-back; published output and real submission delivery. All 14 module gates remain OPEN.

Production-source preservation: the pre-existing five-file diff remains 139 insertions /90 deletions. ElementContextMenu diff SHA-256 remains `98a827cf4fedb2f6cbffa9191f169e7c3c5b3e58bb433272e99056885ec53c5f`. No production source edits were made.

Playback diagnostic: `r42-form-final-return-walk.json.receipt.json` reports a restarted browser at `about:blank`. Its unlocked-return and Admin-reopen filenames are not valid outcome evidence and are excluded. Earlier reviewed captures and completed walks remain the evidence cited above; do not infer a final reopened recipient or unlock result from this diagnostic walk.
