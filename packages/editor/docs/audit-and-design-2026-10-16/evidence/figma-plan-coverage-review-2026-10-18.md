# Figma plan — original-document coverage review

Date: 2026-10-18. Scope: **documentation investigation and Figma-plan corrections only**.

The user explicitly reaffirmed that application code must not change and asked whether original design-document additions had been missed. This review compares source requirements to the [execution plan](../FIGMA-DESIGN-EXECUTION-PLAN.md). It creates no Figma design and does not verify application behavior.

## Result

The first plan mapped all 31 audit screen families, but that count was **insufficient evidence of complete task coverage**. The deeper review found one explicitly omitted visible surface, several approved nested workflows only implied by broad module headings, untracked unresolved source decisions and incomplete audit-evidence requirements.

The plan now names those workflows, source/acceptance references and batch owners. It includes two bounded linked dashboard/account surfaces required by the original documents, without expanding into a general dashboard redesign. Existing product approval status is unchanged. Open source decisions remain open; assigning a decision to a batch is not resolving it.

## 1. Corrections made to the plan

Paths and section references below are relative to the parent design-doc folder. References identify the original contracts; their current owner/shared amendments take precedence over stale historical prose.

| ID | Finding | Source evidence | Plan correction |
|---|---|---|---|
| PR-01 | **Actual omission:** P25 incorrectly classified as wholly non-visual | `panels/25-ANALYTICS-EVENTS.md` §6.4, A-4, OD-A4 | B8 + linked X02: Account settings → Privacy telemetry toggle, help, per-user scope and states; legal/default dependencies annotated; internal analytics dashboard stays out |
| PR-02 | Original quality review requires more than screen presence | `design-audit-2026-10-18/40_PRINCIPLE_AUDIT.md` P01–P40; `CROSS_SCREEN_CONSISTENCY_AUDIT.md` CS-01–23 | B0 reconciles rows; B10 checks actual component/frame evidence and preserves research-dependent unknowns; owner and source acceptance IDs also mapped |
| PR-03 | Pages/palette/share child destinations were implicit | P11 §§4–7; P18 §§5/9/14; P10 §6; P01 §7.3; IAF-15 | B3: Listings/Structure/folders, URL/redirect return, scoped/nested palette, shortcut settings, Share-preview separate from client Review, external doors and the P10 Permissions contract; reconcile P18's stale open footer |
| PR-04 | Inspector compound/integration behavior cannot be represented by root-frame counts alone | `evidence/inspector-2026-10-16/integration-closure.md`; `inspector-preservation-map.md`; `block-coverage.md`; sampled Tabs/Modal/Table annex records | B4: invalid draft interruptions, unknown source, stale picker/batch result, shared-vs-local token edit, Font management return, compound child/repair, Modal/shared restriction and Table unsupported state |
| PR-05 | Old block confirm wording can contradict current policy | `block-coverage.md:64`; `block-coverage-components.md` Tabs/Modal; current SC-15 | B4 expressly reconciles BIC/IC/II operation instructions against current SC-15; preserves genuine impact/conversion review and separately tracks unclassified form conversion |
| PR-06 | Three approved dynamic creation routes were compressed to property binding/dynamic pages | `CMS-DYNAMIC-BINDING-DESIGN.md` §§8–10, T-DYN-01–05/18; BD-22; owner D9 | B5: Way 1 binding, Way 2 Add field insertion, Way 3 generated collection page/list; all entries/returns, one-step Undo and partial page/link recovery |
| PR-07 | List pagination, No-items slot, legacy activation and preview controls lacked explicit tasks | FD-DYN §§11–14, T-DYN-06–11/13/17–20 | B5: query/sort/skip/limit/pagination/related-record/empty slot, inactive legacy rules and explicit activation, draft-record Preview and hidden ghosts, missing-record/path recovery |
| PR-08 | CMS schema/import safety hidden by generic “collections/schema” | P07 §§4–9, T-CM-01–13 | B5: CSV mapping/JSON import, 16 field types, Used by/Show usages, data-conversion preflight, required-field behavior and collection-slug/redirect impact |
| PR-09 | Assets versions, usage scope and Fonts lifecycle absent as independent journeys | P08 §§5–7, T-AS-05–07; Inspector II-04 | B4/B6: upload vs site-font enrollment vs assignment, version-family replacement, blocked placements/atomic page batch/Undo, CMS usages as links, honest partial usage scan |
| PR-10 | Brand tools and customer-site dark values were under-scheduled | P09 §§5–9, T-BR-01/03/04/12/13/15 | B6: all token kinds, Light/Dark/Auto preview ownership, starters, dry-run import/modes/diff/checkpoint, CSS/JSON/Tailwind export and Checks/Open/Fix/Ignore |
| PR-11 | Component lifecycle was reduced to manager/adoption headings | P13 §§5–9, T-CP-03/04/06/10/14–17; IAF-11 | B6: create/share/page-only/duplicate/capacity, source-picking update, pinned revisions/conflicts/site-local draft/share, explicit service fallback and B4 instance-state linkage |
| PR-12 | Package recovery requires durable-job distinctions | `evidence/ia-final-2026-10-16/control-and-package-contracts.md` PKG-01 named content/import/permission/acceptance subsections (lines 100–152); P13 §8 | B6: roots/destination/dependency-map/review/receipt, cancel vs close, unknown-outcome reconciliation, conditional recovery, import-success/Insert-failure |
| PR-13 | Template creation and partial recovery were buried under “apply/replace” | P15 §§5–9, T-TP-01–04/07/12/15–17/21 | B6: mode/origin/stale target, created-page partial failure, retry same page, unknown outcome, backup failure, imported-parts report and Save as template |
| PR-14 | Publish tray consumers and intermediate/result states incomplete | SC-7; P14 §§4–5; P10 §5; P13/P15 area contracts | B8: all six resource/settings/template/component area consumers; What will change/Compare; one gate dialog; privilege-specific override/cancel; unknown start/lost polling/live-but-recording-failed/reload/sign-in outcomes |
| PR-15 | Review approval/audience/phone interactions need separate specimens | P17 §§4–6, OD-R7, T-CR-03/06/07 | B8: six-digit email code, snapshot failure/Send without preview, already-answered race, Team/client permissions and drafts, tablet/phone sheets and 1:1 pan-to-place pin; invitation/code and token-free receipt specimens, no messages sent |
| PR-16 | Collaboration phases and recovery branches were implicit | P21 §§4–5/11; P22 §§5–7; P24 §§4/6; P12 §5 | B7: Presence vs Live editing, Follow, typing advisory, redaction/role cases, reauth/account mismatch, tab takeover, safe reload, retained copies, area-aware Undo and restore collisions/partial relink |
| PR-17 | Linked active-set screen and settings save-scope variants not explicit enough | P23 §5.5a, T-PL-29/32; P10 §§4–7 | B7 X01 dashboard Billing active-set dialog/owner/cooldown/search; B8 staged/immediate/mixed Languages, Access target/interim, DNS/read-only, exact-form return |
| PR-18 | First-run microstates and source-sized density fixtures needed explicit coverage | P16 §§4–5; handoff CTRL-07/GEO-01; current owner P1/P4/P6/P7/P10/P11, SC-21 | B9 guidance arbitration/progress/persistence/replay; section 4 all six density fixtures and wide/200%-text cases; negative-scope acceptance prevents reviving deferred controls |

These are planning corrections. They do not assert that a screen, research session, service, engine fix or runtime test has been completed.

## 2. Original-document open items and stale-status reconciliation

| Source item | Required handling / affected batch |
|---|---|
| T1-29 Permissions stale footer — P18 §14 vs P10 §6 | **Contract found during cross-review:** P10 defines the 480px read-only ST-06 role dialog, You, loading/unknown-access and Manage members link. B3/B8 use it and reconcile the stale P18 footer. No new executable Delete-site door or role decision is inferred |
| INS-D05 form-field type conversion — P06 §7 | Classify under SC-15 before completing B4 interaction; no automatic substitution of CMS-field conversion policy |
| D3-22 authored interactions on `/review` — P17/P19 §14 | Choose supported review runtime versus explicit no-animation disclosure for B4/B8; preserve sandbox constraints until resolved |
| T1-07 review-closed toast/bell; T1-13 View all/Load more; T1-24 Project update failed ladder — P22 §14 | Reconcile in B3/B7/B8; do not call blanket notification coverage sufficient |
| T5-16 dashboard RecoveryBanner mounting — P22 §14 | First inspect source/reachability; design scope depends on that fact. No runtime inference from documentation |
| T2-22 caption placement, T2-32 guide gestures, T5-21 grid snap, T1-11 explicit Inspector hide/show, T3-19 Saves filters/session keys — P05/P18 footers | B0/B3/B7 compare actual current contracts/source and record disposition. Focus mode Q5 and bind landing Q7 are already decided |
| F-EN-A1.2 type refinement; T3-20 inserted-site social icons; T3-26 component thumbnail fallback — P06/P03/P13 | B3/B4/B6 inspect and specify without conflating site content icons with chrome Lucide requirements |
| Sources property binding/fetched API/collection feeding — P07 §10.1; FD-DYN §18 | Keep approved pasted-JSON/Conditions scope; extensions need an explicit scope decision |
| Source contract contradiction: SC-9 “per-collection link” vs P07/FD-DYN Conditions-only current scope | Flag exact discrepancy; no collection-feeding approval can be inferred from a dependency-table phrase |

Some “Not applied” footer lists are stale. Confirmed examples **not reopened**: P10 Permissions content despite P18's footer, Q3 Brand guard, Q5 focus mode, Q7 bind landing, Q11 per-form inbox filter, Q16 saved-template recovery and SC-3 Apply-style/Reset-style rows. Audit gaps retain provenance but must be checked against these later amendments.

## 3. Read coverage and limits

Three independent read-only design-guard reviewers split the canonical panel sources; the primary agent examined cross-cutting audit/authority material and reproduced the important unresolved-source statements. The reviewers did not modify files or call Figma.

| Material | Read coverage in this investigation | Plan destinations |
|---|---|---|
| `panels/00-SHARED-CONTRACTS.md`, `00-STRATEGY.md`, and numbered panels 01–25 | **Full bodies across the review team**; 27 canonical panel/strategy files. AI P20 distinguished current deferral from future design body | B0–B10; S01–S31 and X01/X02 |
| `design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md` | Full initial decisions and Round 2 | Authority and amended scope |
| `CMS-DYNAMIC-BINDING-DESIGN.md` | Full 449-line body | B3/B4 integration, B5, B8 checks |
| `evidence/ia-final-2026-10-16/control-and-package-contracts.md` | Full 152-line body | B6 packages, common control/access boundaries |
| Inspector `feature-coverage.md`, `inspector-preservation-map.md`, `integration-closure.md`, `block-coverage.md`, `element-coverage-reconciliation.md`, `native-tag-coverage.md` | Full bodies across assigned reviewer reads | B4 preservation, native route and integration tasks |
| Individual long B69 annexes: foundations, media/sections, components | **Sampled/indexed**, including Button, SVG, Tabs, Modal, Table and product-card excerpt; not all individual records reread | Full row-level reconciliation remains mandatory B4 work |
| `40_PRINCIPLE_AUDIT.md` | Full 40 principle rows and review criteria | B0/B10 explicit review ledger |
| `CROSS_SCREEN_CONSISTENCY_AUDIT.md` | Full CS-01–23 register; screen/shared-pattern tables inspected in excerpts | B0/B10 consistency ledger |
| Product brief, remaining IA handoff, IAF-01–23 module records | Authority/decision registers, ownership/geometry/control sections and selected module sections; **not a fresh full-body audit of every historical annex** | Governing references and cross-cutting acceptance |
| Feature traceability and documentation audit | Structure, omitted/conflict summaries, decision-register sections and targeted source references; **not every one of the 1,179 FID rows semantically reverified** | B0 per-batch reconciliation and B10 full closeout |
| Application, server, browser, Figma, real research evidence | No runtime/Figma/research validation. File hashes used only to check the no-code-change boundary | All actual behavior/visual/research checks remain NOT RUN |

Automated inventory/heading/ID scans locate requirements; they are not semantic verification. The accurate result is **substantially strengthened document-to-plan coverage**, not certification that every original control has already been drawn or exhaustively re-audited.

## 4. Verification

- Local document checks **PASS**: resolving links, stable unique S01–S31 IDs, linked X01/X02, B0–B10, 18 PR finding dispositions, tracked open-item identifiers, unique brief checkpoint and clean whitespace. These are document integrity checks, not semantic proof of every feature row.
- Application boundary **PASS**: SHA-256 comparison of 6,229 files under editor `src`, `demo`, `scripts` and editor-root files found no changed/deleted files and no additions in that captured scope. This check establishes only unchanged contents within that set.
- Independent targeted re-review completed: `plan_audit_editor` accepted its corrections with no introduced contradiction; `plan_audit_resources` accepted all eight workflow additions and requested two citation fixes; `plan_audit_delivery` accepted coverage and requested three wording corrections. Applied the citation fixes (PKG named subsections, P13 §8), limited token-free wording to receipt, preserved Billing's new-tab route and reconciled P18's stale Permissions footer against P10's actual contract. The primary agent reproduced the latter three against current source documents before applying them. No remaining requested plan correction was left unapplied; unresolved product/source questions stay in section 2.
- Figma visuals/prototypes, user tests, keyboard/assistive technology, code/runtime/persistence/output: **NOT RUN**.

Changes are limited to this evidence record, the execution plan and a brief checkpoint. The earlier first-plan review remains historical; this deeper investigation supersedes any inference that mapping 31 families alone establishes exhaustive coverage.
