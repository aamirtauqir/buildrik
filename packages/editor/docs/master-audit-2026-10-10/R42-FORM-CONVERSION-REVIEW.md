# R42 — Form conversion compatibility review

14 October 2026. Source and contract review only; no Figma/browser, application/test, register or remote-service changes. This document recommends acceptance for the corrected design; it does not certify current implementation or authored prototype behavior.

Entry anchors from the register: Form root `8843:30589`, Fields `8843:30809` (`form:1`); separate remote settings start at After submit `8843:30815` (`form:2`). Direct field roots: Input `8843:18380`, Textarea `8843:18697`, Select `8843:19020`. No fresh native inventory was performed here.

## Source facts that constrain the correction

- `src/editor/inspector/sections/FormFieldsSection.tsx:30` offers six types: Text, Email, Phone, Number, Date, Long text. At `:107`, unchanged type is a no-op; input subtype changes write the existing element's `type`. Only transitions crossing textarea/input replace the element.
- Replacement at `:66` copies only `name`, `placeholder`, `aria-label`, `required`, HTML `id`, plus target input type, at the old parent/index. It does not copy default text, maxlength, rows, classes or styles. `src/engine/elements/manager/ElementCRUD.ts:32` generates a fresh internal ID with empty classes/styles/children unless supplied.
- `FormFieldsSection.tsx:42` includes descendant Select controls and other input types beyond the six choices. At `:50`, Select is wrongly inferred as Text unless it has a `type` attribute. A subsequent input-subtype choice only writes an attribute on the Select; Long text replaces it and loses options. This is an eligibility defect, not a supported conversion contract.
- The field editor's “Label” writes only placeholder (`FormFieldsSection.tsx:116`). Retaining an HTML ID does not establish an actual visible/accessibility label relationship.
- `src/editor/inspector/sections/typeBlock/bodies/formBodies.tsx:49` models Default as `value`; `:54` gives textarea Rows; `:55` gives Select options; `:59` exposes Disabled independently of Required. `src/editor/inspector/config/attributeFields.ts:63` places textarea maxlength in Attributes.
- `src/editor/inspector/sections/typeBlock/attributeWriter.ts:112` writes textarea default to both content and a `value` attribute. `PropertyField.tsx:147` reads the attribute first, falling back to content. Imported disagreement between these two is therefore an unresolved normalization case. The requested content→input-value mapping should use a fixture whose two representations agree or explicitly report the conflict.
- Every field conversion is gated on the Form parent at `FormFieldsSection.tsx:110`; this is not a field/subtree/component lock check. The handler follows the resulting field by list index at `:177`, not captured identity/revision. These are implementation gaps for the stronger corrected design.

## Decisions for the bounded design

**Accept the proposed preservation correction**, with compatibility checked before mutation. Preserve name, applicable placeholder, required, HTML ID, aria-label, classes and represented base styles; map textarea authored default content to input `value`, and input default to textarea content. Keep the same parent/order. Preserve compatible maxlength. Do not call these source-parity behaviors.

Keep three identities distinct: logical field slot, replacement generation, HTML `id`. Text↔Phone/Email/Number/Date changes remain the same generation. Crossing textarea/input allocates a fresh generation only on a successful confirmation. Undo restores the original generation and complete represented pre-conversion state. A later conversion is a new generation, never resurrection through recycling a counter. Cancellation, rejection and repeated current-type choice must allocate nothing.

HTML compatibility matters: Text and Phone strip newlines; Email also trims surrounding whitespace and validates address syntax. Invalid Number/Date strings sanitize to empty. `maxlength` does not apply to Number/Date; placeholder does not apply to Date. These are standard semantics, not browser results from this audit. [HTML input standard](https://html.spec.whatwg.org/multipage/input.html).

| Offered destination | Recommended finite decision |
|---|---|
| Text | Allow the single-line Message fixture with exact default and maxlength preservation. For multiline content, refuse with a clear reason until an explicit transformation preview exists. |
| Phone | Preserve compatible single-line default/maxlength; do not advertise phone-number verification. |
| Email | Allow an empty or valid email fixture. Refuse incompatible prose in this bounded flow rather than showing false success or silently clearing it. |
| Number | Allow an empty or compatible numeric fixture only. Review removal of unsupported constraints; never claim maxlength still limits input. |
| Date | Allow an empty or compatible date fixture only. Review inapplicable attributes and do not render the original placeholder as a working date hint. |
| Long text | Map compatible input default to content; provide an explicit Rows default for a newly created textarea. Re-conversion does not recover previously removed Rows. Only Undo does. |
| Select (outside offered six) | Display the actual Select type and options count; block this conversion route with a reason. Preserve all options/default selection and useful Undo. Do not alias it to Text. |

An alternative to the recommended incompatible-value refusal is a named confirmation that explicitly clears/transforms the default and lists removed constraints. That is additional authored scope. Never silently substitute a sample email/date/number and call it preservation. A six-option chooser may legitimately include explained blocked paths; only demonstrated successful paths count as conversion acceptance.

`rows` is textarea-specific; drop it on conversion to input, retaining it in the Undo snapshot. Treat other imported constraints by applicability rather than copying every attribute. Disabled/readonly, min/max/step, pattern, autocomplete, cols/wrap, bindings, interactions and arbitrary metadata must either be preserved under a verified rule or remain explicitly outside this finite fixture. Do not claim loss-free conversion for arbitrary fields from a narrow whitelist.

Preserving style data does not guarantee identical computed appearance after changing tag. Fixed heights, tag selectors, responsive/pseudo rules, resize behavior and control-native rendering require separate checks. The bounded claim is retained classes/base style plus the visibly verified specimen. Conversion is global document structure; changing the active device must not create an independent field type.

## Eligibility and acceptance recommendations

1. **Concrete preserved fixture:** Message is Long text with single-line default, maxlength, explicit Rows, non-default class/base appearance, HTML ID, name, placeholder and Required. Preview names the field and says Rows will be removed while compatible content/style will be kept. Cancel/Escape retains every represented value and the previous useful Undo. Confirm changes the actual control specimen and corresponding type/detail readout; merely changing a type label is insufficient.
2. **Identity/recovery:** confirm textarea→Text allocates one generation; Undo restores original generation, content, Rows, maxlength, class/style, field order and targeted field detail. Repeat the conversion after Undo and prove a fresh generation. Select Text again with no change and verify the last useful snapshot survives.
3. **Compatibility:** demonstrate at least one incompatible destination refusal with unchanged default, type, generation, constraints and Undo. Include a same-element Text→Phone path separately. Additional Email/Number/Date successes require appropriate independent fixtures; they are not proved by the Message→Text path.
4. **Protection and stale target:** recheck parent, field/subtree/component eligibility, field identity, generation, parent membership and captured document revision on Confirm. A moved/deleted/replaced target must not mutate the next field at the same index. Mixed selection is unsupported unless an explicit bulk contract exists. No-write explanations must return to the correct Form/field/device context.
5. **Undo boundaries:** snapshot only an actual document edit. Protection changes after capture must not be silently overwritten by Undo; use the already disclosed finite policy of invalidating previous one-step recovery, or author a stronger history policy. Block structural recovery on a locked parent if that is the prototype's editing policy. Full protection/history integration remains open.
6. **Persistence separation:** a field conversion and its Undo must leave remote saved settings, failed drafts, pending request identity and notification permissions untouched. After-submit saving must not consume the field's one-step snapshot. Remote revert is another authorized settings write, not document Undo. Reuse the existing After submit entry and keep the Form parent identity stable.

Fresh runtime gates remain: real engine IDs and exact serialized restoration; label/reference/CMS/interaction repair; imported conflicting defaults; unrepresented attributes and responsive styles; actual browser sanitization/constraint behavior; keyboard/focus return; rapid-edit history, failures/rollback, autosave/reload; concurrent remote saves and live submission behavior. Existing `FormFieldsAndSlides.test.tsx:49` proves basic tag/placeholder replacement and following the field, not the proposed preservation contract. No tests were rerun for this report.

Related plan: [R41 Form source and remote-settings contract](R41-FORM-CONTRACT-PLAN.md). This review establishes decisions and recommended evidence, not module closure.
