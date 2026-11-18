# Audit 1: information architecture, reconciled source pass

Status: source audit completed with explicit product decisions and runtime limitations. Date: 2026-09-25. Production code remains unchanged.

## Evidence and closure

The initial repository census and relationship map are in `../INVENTORY.md`. Read together with `01-ia-product.md`, `01-ia-collaboration.md`, and `01-ia-backend.md`; those reports contain the file/symbol/evidence records and inspected-versus-inventoried limitations.

The closure pass resolves the remaining IA owner questions:

- Pages owns authored document pages. CMS owns collections/records and dynamic route bindings; Publish derives generated output files without creating authored Page rows.
- Root `src` files are detached artifacts in the inspected import graph, not alternate active feature owners. The workspace specialist parsed 3,290 discovered source files and found only the root wizard-to-sectionData edge among those three targets.
- Alternate rail modes are development-only. They do not prove multiple production rail owners.
- Inspector has one active shell root; the canvas rich-text toolbar is a contextual editing surface with a different responsibility.
- Brand schema-generation UI and its service are gated by `dsAi`. Application ownership remains a product decision for the enabled capability.
- Workspace Team creates/manages invitations; Auth owns acceptance and onboarding; site grants are membership outcomes. Review does not own acceptance.
- The inspected comment contract implements flat notes, not structured mention recipients or parent-child reply threads. External-client comment reads are scoped separately; internal notes must not be represented as client-delivered messages.

## Reconciled finding ledger

| ID | Evidence IDs | Priority | Disposition | Runtime |
| --- | --- | --- | --- | --- |
| IA-001 | IA-PROD-01 | P2 | CHANGE: normalize competing AI destinations/session ownership | Browser check recorded separately in runtime evidence |
| IA-002 | IA-C01 | P2 | CHANGE: draft/preview labels identify a published-site destination | NOT RUNTIME VERIFIED |
| IA-003 | IA-PROD-02 | P2 | PRODUCT DECISION REQUIRED: Brand component summary versus management | NOT RUNTIME VERIFIED |
| IA-004 | IA-PROD-03 | P2 conditional | PRODUCT DECISION REQUIRED: Brand AI schema application owner | NOT RUNTIME VERIFIED |
| IA-005 | IA-PROD-04 + IA-C02 | P2 | PRODUCT DECISION REQUIRED: site Review surface | NOT RUNTIME VERIFIED |
| IA-006 | IA-C03 | P2 | CHANGE: Mentions filter actually contains account/security/billing notifications | NOT RUNTIME VERIFIED |

IA-005 merges the same Review placement observation from two specialists. Add insertion versus Components management, quick assets versus the full library/picker, local undo versus workspace Activity, and saved versions versus published history retain their separate responsibilities. These are not duplicate implementations merely because users have multiple entry points.

## Product decision handling

Unresolved placement decisions are recorded, not silently approved. Subsequent audits use observed current ownership while testing recommendations against actual navigation, state and interaction dependencies. No component move, schema change or feature expansion is authorized by this report. The consolidated phase fix plan will separate defects from decisions.

## Verification limits

The initial seven unit/component/source-contract files passed 82 tests, recorded in `../VERIFICATION.md`; this does not certify browser behavior. Browser evidence belongs in `runtime-evidence.md` as each scenario is exercised. Authenticated sharing, invitation delivery, server security, full persistence, deployment and multi-user correctness are unverified here and retain their later-phase gates.

Every major repository area was inventoried; source inspection is concentrated on the ownership chains, not every line of all files. Deep interaction/runtime/security/performance branches are deliberately assigned to their own audits. The source IA category can therefore advance to Audit 2 with these limitations visible; the overall Phase 1 fix/regression gate is not passed.
