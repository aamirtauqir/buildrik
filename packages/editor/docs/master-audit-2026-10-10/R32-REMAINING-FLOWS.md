# R32 — Remaining flow completion pass

Date: 2026-10-13. Target: existing improved Figma file g4GzQFqzNYz5sosz1QtZXC, page 8463:2.
Status: IMPLEMENTED_AND_REPRESENTATIVE_QA_REVIEWED; OPEN_ITEMS_RECORDED. This is Figma design/prototype work, not runtime implementation or a product-wide parity certification.

[Open the updated review entry](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8690-13237)

## Implemented in the existing design

- Pages: folder creation/rename/removal, moving a sample selection, removing folder membership, collapse/expand, ordering, grouped delete with homepage protection and Undo, two separate copy destinations, and Journal-copy Desktop/Mobile/Preview/Build context.
- CMS: record draft versus saved values; create/save/publish eligibility/unpublish; conflict and required-field states; discard; delete/Undo; CSV/JSON import review with rejected-row feedback; collection creation/rename/deletion and empty collection state; schema deletion warning and binding protection; a dedicated template picker that returns to Dynamic pages.
- Assets: connected crop ratios, rotation/zoom, adjustment values, dimensions, supported format/preset selection, reset/cancel, version save/failure/retry, explicit version application, rename, replacement review/Undo, upload failure/retry, and used-asset deletion warning.
- Brand: token editing and usage review, mode choice, shared typography/preset/component definition views, starter review, apply/Undo, class creation, checks, import conflict strategies, and export previews.
- Settings: field drafts across seven existing sections, save/discard, retained drafts after save failure, shared Site SEO title/description state, domain verification/primary-domain review, redirect validation/import/export/suggestions, locale addition and workspace-settings handoffs.
- History: metadata-aware comparison and a bounded page-name/SEO-title restore/Undo scenario. The original runtime HIST-01 issue remains an application-code issue.
- Review: the original R31 review entry now includes all these modules. Recovery-test entry points are separated from product screens.

## Architecture and shared components

The existing module ownership is retained: Pages owns page actions, CMS owns content/schema/dynamic-page settings, Assets owns library versions and explicit placement changes, Brand owns shared definitions, and Settings owns site/workspace administration. Focused confirmations use dialogs; multi-field tasks retain the existing expanded workspaces. Editor and Build remain separate, with explicit caller return state.

Existing TO-BE button variants, text fields, workspace navigation, Inter styles, semantic color/spacing/radius variables and modal elevation were reused. New state variables are prototype state, hidden from library publishing. No original baseline or application source was edited.

## Evidence and validation

Scripts, mutation receipts, native audits, browser walks and screenshots are under `evidence/r32-*`. Structural counts are recorded in `r32-native-qa.json`; these measure the inspected roots, not completion percentages. The initial browser run restarted at 1280×720 and is INVALID_VIEWPORT; its receipt is retained separately. The QA runner now explicitly sets 1440×1000 before each walk.

The final native audit is in `r32-final-native-qa.json`: 98 R32 roots, 414 instances using 13 existing masters, and 117 unique prototype destinations. No missing destination/master, non-Inter segment, oversized dialog or visible auto-layout overflow was found in those roots. Absolute-positioned elements and every possible runtime state are outside this assertion.

Playback was visually reviewed at 1440×1000:

| Journey | Result | Screenshot evidence |
|---|---|---|
| Folder move and page order | PASS for authored selection and move command | `r32-folder-moved.png`, `r32-manager-reordered.png` |
| Duplicate → Journal copy → Build → Editor | PASS after loading-time retry; same copy destination and content retained | `r32-bulk-copies-retry.png`, `r32-copy-build-return-retry.png` |
| CMS create → title edit → save → reopen | PASS for retained title and unchanged originals; stale hidden label binding fixed | `r32-cms-new-record-binding-fix.png`, `r32-cms-reopened-binding-fix.png`; later table normalization has `r32-walk-table` evidence |
| CMS template selection | PASS for retained Journal selection | `r32-cms-template-selected.png` |
| Source connect/rename and variable add/edit | PASS for authored values | `r32-source-renamed.png`, `r32-variable-edited.png` |
| Saved versus applied asset version | PASS: saved v2 and applied v1 remain separate | `r32-media-versions-unapplied.png` |
| Brand color apply/Undo | PASS for sampled color | `r32-brand-undone.png` |
| Settings Author edit/save/return | PASS: Studio North team retained | `r32-settings-author-retained.png` |
| Domain pending/verified/primary | PASS for authored transitions | `r32-dns-pending.png`, `r32-domain-primary.png` |
| Redirect error/correct/save | PASS for authored transitions | `r32-redirect-invalid.png`, `r32-redirect-saved.png` |
| History scope/restore/Undo | PASS for transitions; changed-value/full-snapshot restoration not certified | `r32-history-restored.png`, `r32-history-undo.png` |

The first bulk-copy run captured a loading spinner and failed its return check; the retry passed. The intermediate CMS run exposed a stale label; later binding/table evidence supersedes it. Raw receipts retain VISUAL_REVIEW_REQUIRED where the runner cannot assert overlay URLs; they are not automatic pass certificates. The reviewed screenshots above provide the disposition. History field ordering was subsequently corrected and visually checked in `r32-finalfix-receipt.json`.

## Component consistency record

| Pattern | Shared definition | Reuse / exception |
|---|---|---|
| Actions | Existing 8314:3/5/7/9 masters | Shared primary, secondary, ghost and destructive variants across all modules |
| Inputs | Existing 8531:318 and workspace controls | Values bound independently of labels |
| CMS records | Existing 8539:9940 table anatomy | Original, created and imported records share columns; editing uses a separate form |
| Dialogs | Token-bound auto-layout | 560 px focused tasks; wider comparison and multi-field forms; record form scrolls |
| Global context | Existing Editor/Build shell | Copied pages preserve independent return context |
| Brand navigation | Existing workspace navigation | All eight expanded Spacing links share one destination |
| Foundations | Existing Inter styles and semantic tokens | Prototype state hidden from publishing; no competing visual token system |

Sources, variables, spacing and media-folder surfaces received composition review. Team collection navigation was played; its record save remains native-connected rather than browser-certified. Native-only features are identified in [the 31-row matrix](R32-FEATURE-PARITY.csv).

The final CMS table playback passed: the fourth row shows the revised title, new-article slug and Draft status; reopening that row retains the revised value. Original rows remain unchanged. Final evidence: `r32-cms-new-record-table-final.png`, `r32-cms-reopened-table-final.png`, and `r32-walk-table.json.receipt.json`. The table and adjacent feedback use one auto-layout stack.

## Implementation boundaries and unresolved issues

| Severity | Location | Status | Required follow-through |
|---|---|---|---|
| P1 | Full-document History restore/compare | RUNTIME_DEPENDENCY | Implement and test all restorable document fields; the prototype deliberately restores a named subset and does not claim a full snapshot engine. |
| P1 | Brand definition/starter application | PARTIAL_SIMULATION | Review/apply/Undo decisions and sampled values are connected; full token propagation, per-definition persistence and every rendered variation need implementation and broader design verification. |
| P1 | CMS schema editing and arbitrary records | PARTIAL_SIMULATION | Complete all field-type editors, real validation, references and concurrent/server outcomes. Current inputs and imports are finite authored fixtures. |
| P1 | Permissions and site administration | SPECIFIED_HANDOFF | Real roles, typed destructive confirmations, transfer destinations, subscription and sharing screens need runtime integration; no external operation was executed. |
| P2 | Media processing and service delivery | RUNTIME_DEPENDENCY | Render actual crop/filter bytes, upload files, track usage across arbitrary assets and verify placement changes in the real editor. |
| P2 | Media library controls | PARTIAL_DESIGN | Complete grid/list switching, arbitrary filter selection and unused-asset deletion; representative folder/font/filter destinations do not certify every control. |
| P2 | Arbitrary data, drag and responsive behavior | FINITE_PROTOTYPE | Validate keyboard/focus, arbitrary page sets, drag gestures and intermediate viewport sizes in implementation. |
| P2 | Full-product parity ledger | OPEN | Reconcile this evidence against the master 81-row inventory and previously proposed AI/Agents/Team scope before claiming product-wide completion. |

Figma represents the workflow and authored outcomes. It does not execute DNS, publishing, backend storage, payments, downloads, AI/MCP calls or image processing. External-service limitations must not be reported as completed backend behavior.

