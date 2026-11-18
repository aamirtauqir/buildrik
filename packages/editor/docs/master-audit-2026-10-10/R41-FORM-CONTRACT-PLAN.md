# R41 — Form field conversion and submission-settings contract

13 October 2026. Independent read-only source/documentation audit. Only this report was written; no Figma/browser activity, application/test edits, register changes, server calls or tests. Source findings below are not reproduced runtime failures. All R36 module gates remain open.

## Task and canonical ownership

Design two connected but separately persisted tasks under Form Settings: **change a field's type without unexplained loss**, then **configure what happens after submission with truthful server-save feedback**. Field structure/content belongs to the document; After submit belongs to the site's FormBlock record. Neither is breakpoint-local merely because the editor is on Mobile.

Historical improved-page entry: Form `8843:30589`; Fields `8843:30809`; After submit `8843:30815`; Message `8843:30821`; Redirect URL `8843:30827`; Notification delivery `8843:30833`; Spam protection `8843:30838`. These IDs come from the control register and were **not inspected in Figma**. Existing direct-field roots include Input `8843:18380`, Textarea `8843:18697`, Select `8843:19020`. Root should inspect/reuse their current routes before authoring.

Current source registers Fields and After submit in its `behaviour` tab (`src/editor/inspector/sections/registry/behaviour.tsx:101`, `:111`). Settings is the improved architecture's content/semantic owner; that tab migration is an intended design contract, not a claim about existing source labels.

## Field conversion: source facts and loss inventory

`src/editor/inspector/sections/FormFieldsSection.tsx` is the primary source:

- `:42` enumerates all descendant textarea/select controls plus inputs except submit/button/reset/hidden/image. It is not restricted to direct children.
- `:30` offers Text, Email, Phone, Number, Date and Long text. `:107` makes selecting the current type a no-op. Input subtype changes set `type` on the same engine element; any transition to/from textarea calls `replaceField`.
- `:65` creates a replacement at the same parent/index, removes the old element and inserts the new one. `src/engine/elements/manager/ElementCRUD.ts:32` assigns a new internal engine ID. The old HTML `id` attribute is preserved if present; these are different identities.
- `:177` follows the resulting field by its list index. This is not proof of captured-ID/revision protection or correct focus after asynchronous/concurrent change.

| Data on the original field | Text input ↔ textarea replacement at `FormFieldsSection.tsx:65` |
|---|---|
| `name`, `placeholder`, `aria-label`, `required`, HTML `id` | Explicitly copied. Input destination also receives its chosen `type`. |
| Parent position | Same parent and child index requested. Other fields are not intentionally reordered. |
| Internal engine ID | Replaced with a newly generated ID. Do not claim references keyed to the old engine ID survive. |
| Default value / authored textarea content | Neither `value` nor content is copied. There is no default-value mapping between input attributes and textarea content. |
| Classes, base styles, breakpoint/pseudo styles | No old classes/styles are supplied to the new element. Source creation starts with empty classes/styles unless options provide them. |
| Constraints and field attributes | `min`, `max`, `step`, `pattern`, `minlength`, `maxlength`, `rows`, `cols`, `autocomplete`, `disabled`, `readonly`, `checked`, `multiple`, title, tabindex, and arbitrary attributes are not copied. Their applicability must be assessed by target type, not universally retained. |
| Options / descendants | Replacement supplies no children; old descendants are recursively removed by `ElementCRUD.ts:154`. A select→textarea conversion can therefore discard its option tree. |
| Bindings, custom data, element-owned interactions or instance metadata | Not copied by this replacement call if stored on the old element. Exact downstream reference repair is unverified; inventory it before promising preservation. |

There is no loss confirmation in this source path. These are source-observed omissions; browser rendering, persistence and the exact effects on every stored metadata family remain unverified.

**Select is an additional eligibility defect:** `fieldType` at `:50` recognizes textarea specially but otherwise reads the `type` attribute/default Text. A normal select therefore appears as Text; choosing Email sets a `type` attribute on the select without changing its tag, while choosing Long text replaces it and removes options. Do not prototype this as a working select-to-input conversion. Label/select-specific editing and supported conversion need their own explicit contract; a bounded disabled conversion with a reason is safer than a false success, while full capability remains open.

**“Label” is actually placeholder:** `:116` writes `placeholder`, not a `<label>` element, `name`, or `aria-label`. Use “Placeholder” for this action. A true visible/accessibility label must remain separately represented; preserving HTML `id` alone does not prove the complete label relationship after conversion.

**Lock and history limits:** `:110` gates the form parent through `writeElement`, not the target field/subtree. `src/engine/commands/commandOperations.ts:219` wraps a transaction and checks only the supplied element's lock; it has no automatic rollback on exception. The stronger delete guard at `:40` checks locked descendants and instances, but replacement directly calls low-level removal. Proposed conversion protection must recheck target/descendant/component eligibility, not claim the current parent-only gate already does so. One document Undo is intended; exact pre-conversion ID, attributes, content, styles, descendants and selection restoration need fresh evidence.

## After submit: separate persistence and permission contract

Paths beginning `server/`, `packages/shared/`, `lib/` below are repository-relative; `src/` is editor-relative.

| Concern | Source contract and design consequence |
|---|---|
| Read identity and defaults | `src/editor/inspector/sections/FormAfterSubmitSection.tsx:93` loads by `(siteId, blockId = form engine ID)` and ignores late **read** results after changing target. `server/services/form-submission.service.ts:279` returns defaults when no row exists: MESSAGE, null message/redirect/recipient, spam protection true. Defaults are not a successful new save. |
| Commit timing | Shared `behaviourRows.tsx:37` commits text on changed Enter/blur; Escape resets the local text draft. `FormAfterSubmitSection.tsx:111` immediately sends valid changed settings; no-op values normalize null/empty and send nothing. Dropdown/toggle changes likewise enter this save path. There is no separate Save-all transaction. |
| Incomplete redirect | `:130` bundles action and URL; `:138` leaves REDIRECT with no URL in local state and deliberately sends no request. The static “Saved to your site straight away” note remains visible (`:217`). The improved design must say this state is incomplete/unsaved rather than imply persistence. Leaving it needs a defined draft/discard policy. |
| Validation | `packages/shared/schemas/forms.ts:50`: message max 500; notification email valid or empty, max 320; action REDIRECT requires a URL in that payload. `packages/shared/schemas/element-markup.ts:307` permits an empty value, site path or accepted absolute HTTP(S) URL. Do not falsely restrict configured redirects to the same site: service `form-submission.service.ts:193` accepts stored absolute HTTP(S); visitor-supplied return/referer URLs have separate origin checks. |
| Failed write | `FormAfterSubmitSection.tsx:149` restores its previous settings object, remounts text rows and shows a field error. It does not retain the attempted value as an editable retry draft or expose a dedicated retry button. The improved design should clearly distinguish last saved value and failed attempt; preserving a separately marked retry draft is an intentional improvement, not existing source parity. |
| Permissions | `server/trpc/routers/forms.ts:60` permits getBlock with site access. `:67` requires effective site EDITOR for updateBlock; `server/trpc/guards.ts:31` shares that tier with Designer. An actual changed recipient adds effective site ADMIN at `forms.ts:81`; unchanged recipient values do not trigger the extra gate. Use effective site permission and recheck on execution. The existing source error “Only workspace Admins” is less precise than the actual site-role gate. |
| Existing fixture mismatch | Register `form:5` is “Notification delivery: Owner managed.” Source permits effective Admin-tier recipient changes; it is not owner-only. Replace ambiguous fixture copy with explicit eligible/denied states while retaining actual grants/overrides. Do not introduce new Viewer editor access merely because the read API permits site members. |
| Save boundary | `server/services/form-submission.service.ts:300` upserts a dedicated FormBlock record and normalizes empty strings to null. It does not write the document or enqueue canvas history. Recovery from an accepted remote change requires another authorized settings write; Ctrl/Cmd+Z must not be presented as remote Undo. |
| Publish boundary | First settings save creates `isActive:false` (`:330`). `recordPublishedForms` at `:360` later records field shape and activates wired forms; missing forms are deactivated without deleting historical submissions. Saving a setting does not publish the document or activate a new form. Actual live effects can depend on server-read settings versus embedded published markup and require separate output verification. |
| Concurrent saves / target return | `save` captures previous local settings and sends no expected revision. Its failure/finally callbacks have no target-generation check or request serialization. A late failure may revert newer local state; a response after switching forms may affect the currently displayed section. These are source-derived risks, not replayed failures. Include a captured-form/pending-write contract and verify races later. |

The FormBlock key is the **form parent's** engine ID; replacing a field child does not itself change that key. It can change published field shape only when the document is subsequently published. Do not present a child conversion as deleting existing submissions.

## Prioritized finite task to author

Use one Contact form on Mobile, with named Name/Email/Message controls and a Submit button. Keep an explicit field manifest: logical ID, engine-ID expectation, HTML id/name, default content, constraints, styling and order. Keep a separate FormBlock saved-settings fixture.

1. **P0 — Inspect field and scoped outcome.** Open Form → Fields → Message; show actual type, placeholder, required state and local styling. Demonstrate a harmless input Text→Phone change as same-element attribute editing. Same-value selection changes nothing and retains prior useful Undo. All-breakpoint scope is visible; form/page/device/tab survive Back/reopen.
2. **P0 — Destructive conversion review.** Use a long-text Message with authored default content, maxlength/rows and custom style. Choosing Text opens a named consequence preview before any write. Show what is retained and what the current conversion would remove. Cancel/Escape leaves all data intact. A source-faithful finite conversion may demonstrate explicit losses with Undo; preserving compatible styling/default content instead is a proposed implementation correction that must be labelled. Do not silently choose between these contracts.
3. **P0 — Exact one-step document recovery.** Confirm conversion visibly changes the control/tag and field detail while preserving parent/order and allowed attributes. Undo restores the same original logical field, original content/attributes/styles and original engine identity as the intended runtime contract. A Figma specimen reveal proves finite design recovery only. Re-converting creates another new element; it is not equivalent to Undo. Block locked form, locked field and protected subtree separately; stale/deleted target refreshes review or cancels with no write.
4. **P0 — Truthful submission-settings draft.** Enter After submit from the same form; show loading/default/loaded states. MESSAGE→REDIRECT with empty URL says “Add a redirect URL to save this change.” No success acknowledgement. Invalid URL remains an editable error; valid `/thanks` commits action+URL together, shows Saving, then a finite acknowledged saved outcome. An unsaved exit offers Keep editing/Discard without implying server cancellation after a request has already been sent.
5. **P0 — Failed remote save and retry.** Show the server's last saved MESSAGE while clearly retaining a failed REDIRECT attempt separately if choosing that improved contract. Retry targets the original form and revalidates permissions; success changes only server-settings fixture. Canvas Undo of the earlier field conversion must leave these settings unchanged. No generic Reset sample may claim to undo both domains.
6. **P0 — Permission and no-op.** Editor/Designer can change message/redirect/spam protection under effective grants; recipient change is unavailable with a clear Admin permission reason. An allowed Admin fixture validates email and saves it. Mid-flight refusal shows unchanged saved recipient and recoverable allowed context. Untouched recipient blur sends no write and raises no false denial. Keep role fixtures explicitly simulated.
7. **P1 — Missing coverage retained.** Select/options and other non-offered input types; nested wrappers and field reorder/add; actual accessible labels; duplicate field names; conversion of bound/component fields; same-form concurrent saves; switch-to-another-form pending failure; load retry; unpublished/active distinction; custom Action URL/Method/Encoding versus Buildrick-native submissions. The existing Form register already contains those HTML controls; do not remove them while improving After submit.

Suggested first bounded package is tasks 1–6 with one successful conversion, one cancelled conversion, one protected conversion, one remote validation/retry path, and two permission fixtures. Do not claim the wider form contract complete from this finite set.

## Evidence and runtime handoff

Record the source/desired behavior distinction, current node IDs, before/after control and canvas output, loss preview, no-write cancellation, explicit transaction domain and caller return. A shared “Saved” toast or a changed Type label is not acceptance. Visually play conversion/recovery and remote-state outcomes separately; inspect authored reactions for no-op history and correct target identity. No actual form submission, notification email, webhook, recipient change or publishing is part of this design task.

Existing `FormFieldsAndSlides.test.tsx:49` uses a real Composer for type/tag/placeholder and following the swapped field; `:65` checks Required Undo while retaining placeholder. These inspected tests do not establish loss-free replacement, exact conversion Undo, nested locks, select conversion or metadata preservation. `FormAfterSubmitSection.test.tsx:68`, `:80`, `:158` covers incomplete redirect, paired payload and mocked recipient refusal; none was rerun here. Runtime verification must additionally cover durable remote read-back, role/site grants, failure races, real history coalescing and published submission/output behavior.

Related handoff: [R36 acceptance rules](R36-END-TO-END-HANDOFF.md), [control register](R36-INSPECTOR-CONTROL-REGISTER.csv), [workspace/form service coverage](WORKSPACES-SERVICES-COVERAGE.md). This plan adds a concrete Inspector Settings/Forms task; it does not replace the remaining 14-module goal or close any gate.
