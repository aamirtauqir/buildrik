# R33 — Advanced flows implemented and checked

13 October 2026. Target: [Buildrick improved design, review entry](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8690-13237), page 8463:2. The original baseline and application source were not edited. Five pre-existing menu source modifications remain untouched.

## Actual Figma changes

- CMS: ten addable source field types, independent saved definitions, unique-key recovery, reference/options configuration and existing Title/Body/Slug editing. Fields use the existing CMS table anatomy. Binding-protected Title cannot silently change identity.
- Brand: all 18 source preset variants have independent binding drafts, review, apply, discard and Undo. Five existing typography definitions have separate values. Component-style section shortcuts now open Add / Blocks, matching the source instead of a fictional section-style editor.
- Blocks: eight source sections are represented in the current Editor shell. Features insertion and Undo have browser evidence. This is one authored insertion preview at a time; it does not simulate an unbounded document.
- Media: grid/list, selection, usage filters, unused deletion/Undo and independent asset labels. Rename now targets the selected asset. The direct-entry List view retains its return mode.
- Workspace: actual Members, Billing and Integrations screens replace generic handoffs. Invitation validation, role/site scope, pending invitation, member role/suspension/removal, plan review, reason-required cancellation and provider boundaries are connected.
- Site: archive/restore, ownership transfer, guarded delete, exact-name confirmation, and read-only draft links with expiry/password/revoke. Site sharing belongs to the site; team/provider administration belongs to the workspace.

## Architecture and layout contract

The existing Editor/Build distinction remains. Both work on the same project; contextual editing does not create a separate document.

Use a narrow drawer for fast insertion or inspection while keeping the canvas visible. Expand into a workspace when the user manages a collection, compares records or edits several shared definitions. Use two content columns for paired properties or before/after comparison. Use three regions only when navigation, entity selection and entity detail are all independently useful, as in Media. A confirmation remains a focused dialog. Width follows task complexity and available viewport, never merely the module name.

CMS owns schema and records. Brand owns shared definitions. Add owns section insertion. Media owns asset selection and processing decisions. Workspace settings owns members, billing and integrations. Site settings owns site-specific danger actions and sharing. Source transfer eligibility currently names Admin/Editor while Editor and Designer share some permissions elsewhere; this inconsistency is recorded, not silently resolved in application code.

## Shared component record

| Pattern | Existing definition | R33 use |
|---|---|---|
| Primary/secondary/ghost/destructive actions | 8314:3 / 5 / 7 / 9 | Forms, confirmations, workspace navigation |
| Text fields | 8531:318 | CMS, preset bindings, invitations, provider configuration |
| Schema table | Existing CMS table 8539:9940 anatomy | Name / Key / Type / Required rows |
| Editor shell | 8465:3 | Blocks handoff and source section previews |
| Foundation | Existing Inter styles and 8322 semantic variables | Surface, text, spacing, radius and control conventions |
| Prototype state | R33 collection 8771:13536, hidden from publishing | Independent draft/saved/visibility state; not a competing token library |

No new competing component masters were introduced. Token-bound auto-layout forms remain compositions of shared controls; not every composition is itself a component.

## Verification

The final structural audit inspected 115 R33/affected roots, 624 shared instances using 13 existing masters, valid referenced prototype destinations, Inter text segments, dialog heights and visible auto-layout bounds. It found no missing inspected master/destination, oversized dialog or visible auto-layout overflow. Evidence: `evidence/r33-final-native-qa.json`. This does not certify every absolute-positioned element, keyboard interaction, viewport or variable combination.

Playback at 1440 × 1000 was visually reviewed:

| Journey | Disposition | Evidence |
|---|---|---|
| CMS duplicate key → unique key → save → reopen | PASS, authored Number field retains minimum 2 | r33-schema-conflict.png; r33-schema-saved.png; r33-cms-number-reopened.png |
| Primary preset → review → apply → Secondary → Primary → Undo | PASS, independent saved variant and restoration | r33-brand-review.png; r33-brand-secondary.png; r33-brand-saved.png; r33-brand-undo.png |
| Media selection → delete unused → Undo | PASS after binding and direct-entry repairs; List mode retained | r33-media-selected-retry.png; r33-media-confirm-retry.png; r33-media-return-retry.png |
| Invite blank email → Viewer → specific site → pending | PASS, authored invitation | r33-invite-invalid.png; r33-invite-scoped.png; r33-invite-pending.png |
| Business plan draft → Cancel | PASS, current Pro retained | r33-billing-draft.png; r33-billing-unchanged.png |
| Mailchimp API key without Audience → error → retry | PASS, both fields required | r33-mailchimp-invalid.png; r33-mailchimp-connected.png |
| Site delete without exact confirmation | PASS, deletion prevented | r33-site-delete-invalid.png |
| Transfer to Alex → attempt delete | PASS, owner-only action denied | r33-site-transferred.png; r33-site-owner-guard.png |
| Draft link expiry and revoke | PASS for sampled states; revoke result entered directly | r33-sharing-link.png; r33-sharing-revoked.png |
| Features insertion → Undo | PASS, authored preview in current shell | r33-blocks-features.png; r33-blocks-undo.png |

Figma SWAP transitions often retain the starting node in the browser URL. Raw URL_MISMATCH receipts are therefore not alone a failed transition; screenshot review supplies the disposition. Conversely, URL_MATCH alone is not a pass.

The first direct-entry Media recheck reached an unrelated replacement state and is INVALID_PLAYBACK for that segment; its screenshot is retained, not counted as a pass. The subsequent walk with a longer startup settle and screenshots at every step passed selection, deletion and return to List. Final evidence is r33-media-retry-walk.json.receipt.json. The earlier grid/list user-navigation walk remains separately valid. Brand section ownership copy and duplicate navigation highlighting were also repaired and visually checked in r33-brandcopy.receipt.json.

During QA, repairs included two-column binding width, CMS schema table normalization, hidden-row text bindings, per-asset names, direct-entry Media view state, missing Mailchimp Audience validation, member role editing while suspended, and complete discard snapshots for existing field reference/options controls. Existing Danger-zone entry now routes through reviewed site administration. No automated application tests were necessary because application source was not changed.

## Traceability and remaining issues

[R33 capability matrix](R33-FEATURE-PARITY.csv) identifies each authored addition and its validation level. The [81-row master ledger](PHASE6-PRODUCT-PARITY-MATRIX.csv) retains historical evidence and appends R33 mappings. A service row with a designed UI is explicitly UI_MAPPING_ONLY_SERVICE_NOT_EXECUTED. Rows outside R33 are not freshly certified.

| Severity | Scope | Status / remaining work |
|---|---|---|
| P1 | Full-product parity | OPEN: original leaf capabilities, AI/Agents/Team and older inspector coverage still need product-wide reconciliation and fresh end-to-end verification beyond this continuation. |
| P1 | Brand | PARTIAL_SIMULATION: binding values are independent; all token choices, all source typography slots, rendered propagation, starter persistence and every component style are not certified. |
| P1 | CMS | PARTIAL_SIMULATION: finite field values/types and key-conflict example; arbitrary min/max errors, reference integrity, migrations, legacy select/datetime/email/url values and server concurrency require further implementation/QA. |
| P1 | History | RUNTIME_DEPENDENCY: previous bounded restore remains; full document snapshots are not implemented by Figma. |
| P1 | Permissions and services | RUNTIME_DEPENDENCY: no emails, payments, OAuth, storage writes, publish jobs or public share links are executed. Owner actor fixture does not prove authorization. |
| P2 | Media | PARTIAL_SIMULATION: selection/naming/deletion are improved; arbitrary upload/search/filter data, per-asset version histories and image bytes remain outside verification. |
| P2 | Blocks | FINITE_PREVIEW: one authored slot, simplified source rendering, fixed placement; drag/nesting, new selection and persistence remain unverified. Contact's source template itself contains a form placeholder. |
| P2 | Responsive/accessibility | OPEN: current playback covers 1440 × 1000; arbitrary content, focus trapping, keyboard input and intermediate widths remain implementation QA. |
| P2 | Prototype presentation | OPEN: standalone dialog starts use the Figma player background; contextual dimming and back navigation across every legacy entry are not certified. |

The requested advanced surfaces are implemented in the improved file with meaningful finite workflows. Phase 6 and complete product parity remain open for the recorded items; this report does not declare the whole product complete.
