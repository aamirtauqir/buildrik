# Acceptance checklist — Phases 4, 5 and 6

10 October 2026, **15:40 UTC ledger snapshot**. Scope is completion of these three design phases only. This worker read sources and audit artifacts and wrote this checklist; no application/test/browser/Figma changes were made. The original master requirements were restated by the coordinator for this review and are made explicit below. Evidence checks operationalize those requirements; they do not introduce a requirement to fix production code, make every provider succeed or obtain a new approval of recorded gaps.

**Current gate disposition:** Phase 4 remains open; Phases 5 and 6 are not started in the master STATUS. The 43-screen ledger is substantial AS-IS work, not a completion certificate. Complete and compare the major current UI before TO-BE redesign. Phase 7 planning and Phase 8 implementation are deferred, outside the requested completion scope.

## Definitions and required trace

| Term | Evidence required / interpretation |
|---|---|
| Captured runtime | Actual application screenshot and state/geometry record with fixture, time, viewport, role, selection and route. A source component or older designed board is not a runtime capture. |
| Native reconstructed | Editable Figma node ID with text/vector/frame structure and supported raster assets; native readback. Whole-UI flattened screenshots are reference evidence, not the reconstruction. |
| Compared | Matching browser/reference and rendered Figma state inspected for major dimensions, typography, color, clipping, stacking and content; discrepancies corrected or explicitly recorded. No pixel-perfect claim is required. |
| Source-only | Real implementation/state path documented, but no corresponding runtime/native state established. Useful evidence, not a substitute for an obtainable major current screen. |
| Unavailable / unsafe to trigger | Specific missing fixture, provider/role access, or side effect makes a state unsuitable to generate now. Preserve source/known limitations; do not fabricate success. |
| Designed | Separate TO-BE node(s) linked to actual findings, responsibility and behavior decisions. Design demonstrates intent; it does not repair source code. |
| Prototyped | Connected start, meaningful action, result, return/cancel and relevant recovery. Complex non-simulatable behavior is documented accurately instead of a misleading click-through. |

Required trace for each major task/state: **F-ID → actual finding/risk ID (or preservation rationale) → AS-01–40 family → W-/I- state if applicable → AS-IS node + capture + comparison → TO-BE node + decision → reusable component/token references → prototype control/action/outcome/return → explicit limitation → gate disposition**. Backend rows F-047–081 may trace to a caller and service boundary instead of requiring a fictitious standalone screen.

Use the existing [81-feature matrix](INFORMATION-ARCHITECTURE-MATRIX.csv), [findings register](TRACKING-MATRIX.csv), [40-family screen register](AS-IS-SCREEN-COVERAGE.md), [Inspector state spec](AS-IS-INSPECTOR-STATE-SPEC.md), [43-workspace-state spec](AS-IS-WORKSPACE-STATE-SPEC.md) and [panel/context contract](PANEL-AND-CONTEXT-RULES.md). A frame's numeric name is not an AS family ID or W state ID. Evidence annotations, component-library presentation boards and masters are not additional application screens.

## Phase 4 — EXISTING APPLICATION / AS-IS

Master requirement: reconstruct all major current UI, including relevant responsive and state variants, using native editable/reusable Figma structure and Auto Layout where appropriate. Use actual dimensions, colors and type, label broken behavior, compare against the running application, preserve existing boards and avoid both whole-screen flattening and unsupported pixel-perfect claims.

| Check | Acceptance evidence | Snapshot disposition |
|---|---|---|
| P4-01 — distinct preserved baseline | Existing file/pages intact; dedicated [AS-IS page 8280:2](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8280-2); current source/fixture distinguished from older boards and pre-existing code edits | Page and preservation reports exist; retain throughout remaining work. |
| P4-02 — major surface breadth | AS-01–40 each has linked current native representative(s), or a specific genuine unavailable boundary. Obtainable whole destinations cannot be dismissed as generic source coverage | **Open:** independent review identifies missing Settings, Brand and content detail destinations; updated reconciliation below credits eight newer frames without claiming all gaps closed. |
| P4-03 — current context/type breadth | Inspector by supported type, current Style/Behaviour/Effects placement, component/locked/multi/root overlays, page settings, contextual menus and caller-owned choosers | Partial: heading/image and page variants exist; multiselect/locked/component detail, live configured interactions and other relevant contexts remain limited. |
| P4-04 — responsive representation | Actual desktop and constrained editing states, full workspace fit, overlay behavior, scrolling, menus/dialog bounds, device context. Distinguish mobile site Preview from mobile editing canvas | Partial: original 1280×720 frames plus newer 1440-wide states; Mobile Preview exists. Dedicated editing breakpoint/View and broader constrained-state proof remain open. |
| P4-05 — state honesty | Relevant empty/populated/loading/error/dirty/saved/disabled/permission states identified per family; current bugs and unsupported controls retained and annotated | Mixed: genuine empty Review, existing Activity event and saved General captured. Many recovery/role/provider variants remain source-only; do not replace later empty/populated states with earlier errors. |
| P4-06 — native editability and reuse | Native node readback; real text/vector/frame structure; source imagery allowed; reusable controls with provenance; Auto Layout where composition needs it | 43 native screen entries and separate 29-master sample library documented. Master wrappers do not prove every screen is appropriately structured or fluid. |
| P4-07 — measured fidelity | Browser state/geometry → matching rendered Figma review; dimensions/colors/type/spacing/scroll/stacking; actual missing images and values preserved | First-ten correction report compares Review, Heading and CMS. Broaden comparisons to full workspaces, dialogs, iframe imagery and newer wide states; account for remaining wrap/tone/font/raster differences. |
| P4-08 — durable evidence ledger | Every node has capture/annotation link, current name/dimensions, comparison disposition and source-only/unavailable notes. Temporary capture references copied to retained evidence | 43-node JSON plus retained runtime captures now exist. Verify complete node↔capture↔comparison links; do not assume every capture has a matching retained screenshot. |
| P4-09 — no hidden redesign | Actual labels, category placement, state defects and host shapes match the present app. Extraction artifacts may be corrected, product defects may not be silently improved | Required on every addition. Current Assets/Behaviour labels and the three takeover shapes remain AS-IS. |
| P4-10 — gate decision | Explicit consolidated review: major current surfaces reconstructed and compared; lower-level or unavailable states bounded with evidence; no critical obtainable family left unaccounted | **Not met at snapshot.** No fixed numeric frame count is the gate. |

Do not trigger Share preview casually: opening can reuse or create a share token. Do not send reviews, publish, change DNS/OAuth/billing, generate provider output or mutate user projects merely to obtain a preferred state. Safe existing empty/error/locked views are valid representatives. The [workspace spec](AS-IS-WORKSPACE-STATE-SPEC.md) names the source of each side effect. This does not block capture of the ordinary read-only Settings/Brand/CMS destinations.

## Reconcile the two different counts of 43

[figma-as-is-frames.json](evidence/figma-as-is-frames.json), modified 15:02:45 UTC, contains **43 unique native screen entries**, all with empty creation-error arrays. It records IDs/names/node counts/annotation IDs, not a complete comparison or runtime-success result. [FIGMA-AS-IS-COVERAGE-REVIEW](FIGMA-AS-IS-COVERAGE-REVIEW.md) inspected **35 screens at 14:56 UTC**; its numerical coverage snapshot predates frames 36–43. Its identified gaps remain useful, but its frame count must not be repeated as the final ledger count.

The newer entries are 36 Heading Style 1440 (`8293:2`), 37 Image Style 1440 (`8293:373`), 38 Image Behaviour (`8293:734`), 39 Image Effects (`8293:994`), 40 selected-root Page Inspector (`8293:1239`), 41 Page settings SEO (`8293:1528`), 42 Social (`8293:1858`) and 43 Advanced (`8293:2168`). They extend AS-02/03/04/05/06/13 context coverage; Image Effects does not establish an interaction-editor flow, and Page settings SEO is not Site Settings SEO.

The workspace spec has a separate **43 state identifiers**: 12 CMS + 10 Media + 7 Brand + 7 Templates + 7 Settings. Twelve of the 43 native screen entries are primary workspace representatives: frames 08/09/10/11/12/13/14/15/16/18/27/28. Frame 38 additionally supplies the current static CMS-binding Inspector state. One frame can represent portions of multiple W states; a compound W state may require multiple frames. **The equal totals do not mean 43/43 workspace states are reconstructed.**

The mapping below uses the actual ledger and retained source capture text, not new Figma inspection. “Representative” establishes a matching state family, not visual comparison or all subvariants. Frame-number/node lookup follows the table.

| Workspace state | Native representative in ledger | Precise remaining boundary |
|---|---|---|
| W-C01 collections loading/error | None established | Source-only; ordinary loaded CMS is not an error/loading variant. |
| W-C02 root/no selected collection | None established | Frames 10/12 show populated selected collection, not root/empty hint state. |
| W-C03 records table | 10 | Actual collection/draft table represented; filtering/pagination variants not certified. |
| W-C04 no fields/no records | None established | Source-only empty-state variants. |
| W-C05 collection overflow/import doors | None established | Dynamic pages/Settings/import/disabled connectors remain distinct obtainable menu/screen states. |
| W-C06 new/existing record sheet | 11 | Draft editor representative; new and all schema renderer variants separate. |
| W-C07 dirty/offline/refused/conflict/gone | None established | Source-only; do not fabricate backend recovery states. |
| W-C08 record leave guard | None established | Source-only dialog; capture safe dirty fixture only within authorized scope. |
| W-C09 fields/selected field detail | 12, table portion only | Capture text explicitly says Select a field; selected FieldInspector is missing. |
| W-C10 field add/key clash/delete guard | None established | Source-only; opening safe dialogs is distinct from confirming schema changes. |
| W-C11 binding chooser/summary | 38, static choice only | Capture includes CMS binding / Source / Static / From CMS. Collection/field/record pickers and bound summary are not established. |
| W-C12 binding/record return | None established | Navigation/return contract source-only; static binding controls do not prove the journey. |
| W-M01 Assets quick drawer | 08 | Ordinary launcher representative; not restricted caller picker. |
| W-M02 search/pagination/upload failure | None established | Partial/error search and failed-upload rows not proven by ordinary drawer. |
| W-M03 property chooser | None established | Source-only Choose {noun} and return target. |
| W-M04 full library | 09 | Library represented; capture says Select an asset to see details. |
| W-M05 full-library selected details | None established | Earlier runtime detail observed, but frame 09 is unselected and cannot stand in for it. |
| W-M06 quick detail/version/usage | None established | Separate detail owner; source-only versions/restore/usage. |
| W-M07 upload confirmation/progress | None established | Earlier runtime observed; no dedicated native upload frame in ledger. |
| W-M08 upload completion/failed entries | None established | Earlier runtime observation is not a native reconstruction. |
| W-M09 local cloud-registration failure | None established | Historical RT-01 footer observation; frame 09 retained text has no not-on-server pill, so do not infer it. |
| W-M10 insertion/unsettled-save/reload | Shell/image frames show missing-image fixture only | Missing image is represented elsewhere; the multi-step recovery sequence itself is not connected/reconstructed. |
| W-B01 Colours palette | 13 | Native representative, with current token list; not every palette/unknown-usage variant. |
| W-B02 selected token detail | 13, visible Action detail | Retained capture shows Action / Change / Used by. Historical background-token mutation is a different selected-token fixture. Menus/rename/delete not established. |
| W-B03 color picker | 14 | Native picker representative; historical successful token edit remains separate runtime evidence. |
| W-B04 Fonts & type styles | 15 | Type page representative; font picker/value edits not established. |
| W-B05 spacing/preset actions | 16, table/detail only | Capture has Space 1 and Normal values; expanded preset menu choices not established. |
| W-B06 other token kinds | None established | Source-only extra kind pages; spacing table is not all token kinds. |
| W-B07 read-only/loading/preview/tools | 13–16 preview portion only | Right live preview represented; loading/read-only/AI/restore/generation states not established. |
| W-T01 gallery/sidebar | 27 | Current gallery representative; separate creation/error flows not implied. |
| W-T02 selected template preview | 28 | Native preview; font substitution recorded; iframe support limitations retained. |
| W-T03 Back/replace-mode context | 27–28, gallery/preview return portion | Replace-mode Back to Pages/banner not established. |
| W-T04 template create confirm/success/error | None established | Frame 33 is ordinary New page dialog, not template-create confirmation. |
| W-T05 template replace confirm | None established | Source-only confirmation; do not apply template to produce a screenshot. |
| W-T06 backup failure | None established | Source-only failure; triggering checkpoint failure not required. |
| W-T07 applying/cancel/error | None established | Source-only async states; no false completed-apply screen. |
| W-S01 settings/nav/role | 18, General representative | Current navigation and Owner visible. Workspace doors may be below scroll; their own panes unrepresented. |
| W-S02 settings search | None established | Source-only search/results/empty state. |
| W-S03 General loading/dirty/saved | 18, loaded saved portion | Capture has Author Buildrick audit 1010 and All changes saved. Prior runtime save/reload is separate; loading/dirty variants not reconstructed. |
| W-S04 footer/validation/refusal | 18, clean footer only | Discard/Save and clean status exist; invalid/error/refusal variants unrepresented. |
| W-S05 read-only/upgrade | None established | Requires actual role/plan state; source-only is honest. |
| W-S06 unsaved exit dialog | None established | Source-only; safe fixture/cancel can establish later, not claim from clean footer. |
| W-S07 specialized object dialogs | None established | Domain/redirect/locale/analytics/archive dialogs are not the General frame; never submit external/destructive actions for coverage. |

Relevant ledger nodes: 08 `8283:1998`; 09 `8283:2325`; 10 `8283:2523`; 11 `8286:2`; 12 `8286:272`; 13 `8286:511`; 14 `8286:733`; 15 `8286:985`; 16 `8286:1160`; 18 `8286:1613`; 27 `8290:1629`; 28 `8290:1811`; 38 `8293:734`. Frame source records are retained under [figma-runtime-captures](evidence/figma-runtime-captures). This table is a dated acceptance snapshot; coordinator additions must be credited after ledger/readback updates rather than editing the counts by assumption.

## Phase 5 — NEW DESIGN / TO-BE

Master requirement: keep AS-IS intact and create a distinct mature-workspace design that solves critical issues, accurately supports selected types and advanced Inspector controls, defines panel/canvas behavior and uses coherent visual tokens. Phase 3 placements/dimensions are proposals requiring validation, not already accepted outcomes. This checklist defines evidence; it does not draw TO-BE screens while Gate 4 is open.

- [ ] **P5-01 — separate design and traceability:** dedicated TO-BE page/frames; AS-IS and original boards preserved; each material change links F-ID, finding/risk and proposed responsibility. Preserved features have an explicit KEEP rationale; no silent capability loss.
- [ ] **P5-02 — complete workspace ownership:** Add/Layers/Pages/Assets-or-proposed-Media/Components/Brand/CMS and right Inspector/AI/Review/History/Issues/Activity/Publish have clear intent, scope, entry and return. Evaluate Components within Add versus independent rail without duplicating its manager; CMS records do not become another owner of Pages.
- [ ] **P5-03 — accurate advanced Inspector:** common/advanced controls and effective value/origin/reset scope defined; supported type sections reflect all 55 registered types and root/component/locked/multi overlays. No invented specialized commerce, binding or layout controls for unsupported types. Component override suppression and CMS eligibility match the accepted capability contract.
- [ ] **P5-04 — formal panel policy:** each panel states default/min/max dimensions, whether resize is supported, open/close, dock/overlay, collapse/expand, full-screen transition, header/footer/content scroll, focus, Escape and caller return. Preserve canvas minimum and distinguish editor viewport from site breakpoint. Validate or revise provisional dimensions; 423/1063 calculations are not accepted support guarantees.
- [ ] **P5-05 — canvas interaction design:** selected/hovered/multiselected/locked states; click/drag insertion; movement/reorder before/inside/after; parent/nested selection; pointer/keyboard resize and cancel; align/distribute/snap; breakpoint/zoom/scroll; Preview; Undo/Redo and scoped shortcuts. Define visual feedback, refusal/cancel and history boundary even where continuous gestures cannot be accurately simulated in Figma.
- [ ] **P5-06 — critical issue solutions:** recorded design/behavior treatment for canvas geometry/history CAN-01/02/03; effective values UX-10/25 and CI-01; Preview UX-09/11/IA-08; focus UX-22/IA-07; action eligibility/menu scope IA-03/04/05/15/MENU-01; page shortcut PAGE-01; comparison HIST-01; route precedence IA-06. A proposed UI must not claim a source defect is fixed.
- [ ] **P5-07 — truthful service states:** local/queued/remote/published meaning defined for media RT-01/WS-01, components WS-02/03, CMS and Settings; roles/rounds RR-01/04, AI publish RR-02, unavailable checks RR-03, analytics WS-04, credential redaction WS-05. Permission and persistence boundaries remain explicit rather than disguised by generic success copy.
- [ ] **P5-08 — coherent visual treatment:** reusable color/type/spacing/radius/elevation/icon grammar applied consistently across shell, drawers, workspaces, forms, tables and overlays; density and readability checked with long real labels, errors and empty states. Preserve Tailwind/Flowbite/chrome-ui compatibility; no unsolicited framework replacement.
- [ ] **P5-09 — responsive and accessible design proof:** representative 1440×900, 1280×720, 1024×768 and 200% zoom-fit scenarios; intentional scroll; selected target can be revealed; menus stay within edges; meaningful labels/focus order/disabled reasons; modal focus isolation and return. Contrast/keyboard/motion intent documented; Figma alone does not certify screen-reader or DOM behavior.
- [ ] **P5-10 — critical gate:** major journeys have concrete design solutions and complete behavior/state rules; material ambiguities resolved or explicitly limited. Backend/engine dependencies remain tagged for later implementation. No mere collection of attractive disconnected screenshots qualifies.

Unimplemented/limited behavior remains visible: interactive script Preview restrictions, reverse-on-exit lifecycle gaps, default-locale-only publishing, Sheets OAuth, remote audio mirroring, Vue/Next export, reserved commerce controls and gated production collaboration. Design may depict a proposed future solution only as such; it must not retroactively become current product support.

## Required representative journeys and state contracts

These are the major coverage units across Phases 4–6, not a demand to execute external side effects. Phase 4 shows current states; Phase 5 defines the intended behavior; Phase 6 connects accurately simulatable actions and documents the rest. Relevant error/empty/permission branches are part of the same journey rather than extra success claims.

| Journey ID / trace | Required route and context | Acceptance branch / limitation |
|---|---|---|
| J-01 Build/select/style — F-001/006/010–014/038–042; AS-03/06/08/09; Inspector I-* | Add → chosen target → selection → style/layout at active breakpoint → canvas → Undo/Redo | Hover/multi/parent/nested, locked/unsupported, resize/drag cancellation, snapping/zoom, mixed/effective values and focus. Native gesture physics documented when not simulated. |
| J-02 Structure/context — F-003/007–009; AS-07/11; MENU-01/IA-03–05 | Layers/canvas → context menu/shortcut → clipboard/group/reorder → preserved selection | Same action eligibility and reason across doors; cross-parent/root/locked refusal; edge/submenu keyboard; cancel does not execute or clear unrelated state. |
| J-03 Pages/templates — F-002/004/070/077/080; AS-12–14; W-T01–07 | Pages → named new-page/template → preview → explicit new vs replace → page return | Backup/replace confirmation, cancel, premium/admin restriction, backup unavailable; no data loss implied by a simulated Apply. Ordinary New page is not template confirmation. |
| J-04 Components — F-005/072; AS-10; I-COMP/I-COMPO | Add saved component → instance → manager/master → update/reset override → return | Site/workspace/master/instance identity, library error vs empty, local/remote pending, destructive detach/reset scope; no duplicate manager. |
| J-05 Media — F-018/022/023/067/079; AS-15–17; W-M01–10 | Selected property → chooser → full library/detail → use/replace → return | Caller/type retained, upload/register/save stages, error/retry/local-only, cancel, metadata/version/delete-grace meaning; provider and binary effects simulated/annotated only. |
| J-06 CMS — F-019–021/047/057; AS-04/18–20; W-C01–12 | Collection/record → schema/detail → bind selected element → open bound record → return | Actual first incomplete step, record versus document save, validation/conflict/dirty exit, import and dynamic-page limitations; no fake published output. |
| J-07 Brand — F-024/078; AS-21/22; W-B01–07 | Palette/type/spacing → selected token → edit/sample → affected scope → element return | Global token vs local override, truthful usage, autosave/Undo vs restore point, unsupported AI/generator gate; no new final Save assumed. |
| J-08 Settings — F-032–034/048/064/073/076/081; AS-23–28; W-S01–07 | Category → role/scope → edit/save/cancel → workspace door or caller return | Footer vs immediate object actions; clean/dirty/error/conflict/locked; scope/plan labels; no secrets, billing/OAuth/DNS/deletion execution. |
| J-09 AI/Issues — F-025/043/049/051; AS-29/35 | Contextual AI → target/proposal → apply/cancel/recovery; Issues → scoped check → locate/fix destination | Provider fail/unsupported, stale result, explicit privileged confirmation; unknown checks never become clean. Mocked AI output clearly labeled. |
| J-10 Review/history — F-029–031/044/055/058/071/074; AS-32–36 | Comment/pin or review round → compare/history → return; saved version → compare/restore confirmation | Internal/client/site/revision scope; viewer permitted read independent of denial; session/saved/published distinctions; cancellation/safety copy; no messages or approval side effects. |
| J-11 Preview/export/publish — F-026–028/033/075; AS-30/31/39/40 | Current page/device → Preview → return → Export or Publish checks/target/confirmation | Device/selection/zoom retained; script limits; planned formats disabled; stale save/review/provider blockers; share opener auto-token risk. No live deployment/download success inferred from Figma. |
| J-12 Global navigation/recovery — F-035–037/050/053/068/069; AS-01/02/37/38 | Palette/help/site menu → drawer/right mode/workspace → nested dialog → close/return | One active owner; dirty guard; loading/error/retry; unavailable role/session/concurrency labeled; no hidden covered controls; onboarding does not erase primary context. |

## Phase 6 — reusable system and connected prototype

Master requirement: reusable foundations and a meaningful component library, plus connected primary journeys and recovery/state validation. Every interactive control has a defined action or explicit limitation. Complex behavior that cannot be accurately simulated must be documented rather than misrepresented.

- [ ] **P6-01 — foundation system:** named colors, typography, spacing, radius, shadows/elevation, icons, control metrics, panel/layout grids, responsive rules, motion and state semantics. Distinguish site Brand tokens from editor chrome tokens; relate accepted designs to existing Tailwind/Flowbite/chrome-ui values.
- [ ] **P6-02 — complete relevant component families:** buttons, inputs, selects, tabs, tooltips, menu/context-menu/dropdown rows, popovers, modals/dialogs, panel headers/sections, tree/navigation, toolbars/canvas controls, property rows, color picker and notifications. Add needed table/sheet/workspace compositions used by the journeys. Components must be reusable native structures, with Auto Layout/constraints where appropriate.
- [ ] **P6-03 — meaningful variants:** relevant default/hover/focus/pressed/selected/disabled/loading/error/success/empty states, size/density and icon/label/validation differences. Document which axes are valid rather than multiplying every combination mechanically. Disabled controls retain reasons where relevant; destructive and permission-restricted actions stay distinct.
- [ ] **P6-04 — screen composition:** TO-BE screens use the defined library and tokens; intentional exceptions documented; no second divergent component set introduced per workspace. Check edits propagate to instances without destroying captured AS-IS.
- [ ] **P6-05 — primary prototype connectivity:** J-01–12 representative nav, panel open/close, context controls, Inspector, page/component/assets/CMS/Settings, responsive mode, dialogs, Preview and Publish have defined entry/action/outcome/return. Meaningful menus and active controls are connected rather than decorative hotspots.
- [ ] **P6-06 — recovery and cancellation:** representative invalid/unsaved/permission/loading/failure/retry and destructive-confirm/cancel branches connected where Figma can express them; focus/return and dismissal rules annotated where Figma cannot execute actual DOM focus.
- [ ] **P6-07 — responsive prototype states:** viewport/state transitions reflect the accepted panel policy; proper scroll areas and overlay stacking; document versus editor responsive context explicit. A scaled screenshot is not responsive behavior.
- [ ] **P6-08 — limitations register per control:** continuous native drag/resize physics, actual history/sync/conflicts, role enforcement, browser clipboard/file access, provider AI, DNS/email/webhook/publish, keyboard/screen-reader semantics and sandbox interactions are labeled as simulated, unsupported or requiring later runtime QA. No click success screen presented as executed service proof.
- [ ] **P6-09 — walkthrough validation:** inspect representative journeys end to end; record start node, controls followed, result, back/cancel/retry, scenario and defect/limitation. Check links, no unintended dead ends, retained caller/selection and coherent status. Read back nodes/interactions and review rendered examples, not only successful creation responses.
- [ ] **P6-10 — gate report:** reusable system covers the designed surfaces; major journeys connected or specifically documented as non-simulatable; every interactive control has an action/limitation; unresolved design defects are not disguised as implementation QA gaps. Publish final design links and clear completion scope for Phases 4/5/6 only.

The existing [AS-IS reusable-controls library](FIGMA-AS-IS-COMPONENT-LIBRARY.md) supplies **11 component sets / 29 observed masters / 6 instances**. It is a valuable current-state reference. It deliberately lacks invented hover/focus/loading variants and full prototype wiring; it is **not** already the Phase 6 TO-BE design system. Reuse compatible foundations while preserving its AS-IS provenance and original library bindings.

## Changes that still require later implementation approval

This is a design-readiness boundary, not a Phase 7 implementation plan. The user authorized completing Phases 4–6; that does not authorize app fixes or deployment. No new permission question is needed to finish the authorized design artifacts.

| May be completed within design scope | Must wait for the later explicit implementation phase |
|---|---|
| Native AS-IS corrections supported by actual evidence; separate TO-BE frames; design tokens/components/prototype interactions; acceptance annotations and limitations | Application TS/TSX/CSS changes; test-source changes; route/state-manager rewrites; live menu/Inspector/panel behavior fixes |
| Intended geometry/finite-input/transaction behavior and honest gesture simulation | CAN-01/02/03 engine geometry, keyboard resize, transaction/cancel fixes; CI-01 write gates; CI-02 runtime lifecycle implementation |
| Designs for durability/status/retry and local/server distinctions | Media URL mapping/metadata persistence changes, durable component retry/outbox, CMS/schema/sync changes and storage migrations |
| Role/review/AI confirmation and redacted credential design | RR-01/04 authorization changes, RR-02 publish baseline changes, token/secret encryption/redaction/API/migration work |
| Preview capability labels and proposed isolated runtime design | Sandbox policy, visitor scripts, export/hosting/CMS dynamic output or provider integration changes |
| Documentation of accepted responsive/accessible/motion behavior | Live focus/inert/keyboard handling, breakpoints/scroll/DOM motion code and screen-reader/runtime certification |
| Linked design handoff with known limits | Publishing/deployments, merges/releases, real review/email/webhook sends, billing/OAuth/DNS changes or implementation rollout |

Figma prototype demonstrations must remain distinct from actual external effects. They can define a publishing/review journey without triggering either service. A complete Phase 6 handoff does not imply the remaining Phase 2 runtime blockers, backend risks or product bugs are repaired.

## Final completion statements and accounting checks

Before each phase close, use precise evidence rather than a frame/master total:

1. **Gate 4:** “Major current UI reconstructed natively and compared against matching runtime; specific unavailable/lower-level states and fidelity differences remain labeled.” Supply the latest 40-family reconciliation, node/capture ledger and comparison report. Do not say all 43 W states are reconstructed because the screen total is 43.
2. **Gate 5:** “Separate TO-BE screens resolve the traced critical design issues with explicit type/context/panel/canvas/responsive/state contracts; implementation dependencies remain open.” Supply issue→solution nodes and accepted behavior rules, not just visual boards.
3. **Gate 6:** “Reusable foundations/components support the designed surfaces; representative journeys and recovery are connected, with accurately named simulation limits and no unexplained interactive controls.” Supply library/prototype links and walkthrough evidence.

The coordinator should update STATUS and final ledgers after actual readback/review. This checklist does not mark any gate passed, create TO-BE design early, request implementation approval, or extend the user's goal into Phase 7/8.
