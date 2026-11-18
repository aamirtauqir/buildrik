# Buildrick editor improvements — staged design and QA plan

> **SUPERSEDED / historical — do not design from. Current specs: panels/00–25 + design-audit-2026-10-18.** *(R-1018, D1-6/D1-22; owner decisions 2026-10-18)*

> Superseded specifics *(R-1018)*: Figma-only mode → BD-03 (audit code/runtime); "PARTIALLY VERIFIED" batch statuses are historical; geometry → GEO-01.

Date: 2026-10-16. Mode: DESIGN ONLY + COMPARATIVE QA. User: designer/freelancer.
Current authorization: create a separate Figma file; improve existing capabilities one batch at a time; compare old design, current implementation and proposed design after each batch.
Application code, deployment, saved project mutations, feature removal and unsupported feature additions remain outside this work.

New file: [Buildrick — Editor Improvements · Existing Features](https://www.figma.com/design/6yvgev9dRXrSLPluWkjDoz).
Protected original: [Buildrick AS-IS](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8280-2).
Canonical audit: [REPORT section15](REPORT.md#15-existing-figma-as-is-audit--existing-capabilities-only).
Evidence gallery: [99-screen index](AS-IS-REVIEW.html).
Source baseline: main, 19f964d5e7efda2c276a4c185782bb963da605ec.

## Current user direction

Focus on static wireframes first, then progress through module design and comparative QA without repeated confirmations. Active wireframes page: [04 — WIREFRAMES](https://www.figma.com/design/6yvgev9dRXrSLPluWkjDoz?node-id=25-1521). Earlier polished studies are exploratory. User explicitly reconfirmed FIGMA DESIGN ONLY: complete all design stages autonomously. No application-code implementation or deployment.

## 1. Working agreement

1. Work only in the new Figma file. Existing original/AS-IS/TO-BE pages remain untouched. Historical TO-BE and raster form alternatives are not automatically accepted references.
2. Preserve supported capability, discoverability, data ownership, permissions, values and return paths. Layout can change; a control cannot silently disappear.
3. Never add a control based only on a competitor screenshot. Require existing source/handler and reachable task, or label an unresolved implementation gap instead of drawing a working feature.
4. Each batch covers a complete bounded task with its entry, target, editing states, result and return. No entire-editor completion claim from a shell mockup.
5. QA runs after every small sub-batch. A preservation/flow failure is fixed in that batch before the next dependent batch. A missing verification is NOT RUN, never PASS.
6. Preserve original identifiers and storage contracts. A Figma screen cannot prove save/reopen, complete Undo, delivery, permissions or export behavior.
7. Present the batch's before/current/proposed evidence and unresolved items to the user. User-requested changes feed back into that batch. The current instruction authorizes routine reversible design work; no repeated permission request for every ordinary layout decision.
8. Source-backed engineering fixes are tracked separately from visual changes. Do not show recovery or persistence as working when code does not support it.
9. New file is a working proposal until its specific batch passes design QA; creating the file is not approving its contents or implementing the product.
10. Preserve current Inter/Geist Mono and code token values for the baseline. Resolve the documented text-token discrepancy explicitly before any proposed shared-token change. No production token export/regeneration in this task.

## 2. Three-way comparison

| Reference | What it proves | What it does not prove |
|---|---|---|
| Original AS-IS Figma + dated captures | Historical layout, displayed controls and sampled states | Current runtime, unseen controls, successful interactions |
| Current code + local app | Implemented contracts; behavior actually observed under recorded fixture/role | Intended visual quality or unexecuted mutation paths |
| New improvement file | Proposed placement, geometry, state and flow specification | Shipped behavior, persistence or successful live QA |

Pair comparable frames by task, selection, open panels, host viewport, authored breakpoint, canvas zoom, pseudo-state and role. Historical and current fixtures differ: never compare their counts/content as if one lost data. Record fixture differences explicitly. For visual before/after use the same content within each pair; separately check compatibility against the current fixture.

Evidence baseline: 99 screen subtrees inspected; 95 overview screenshots; 16 full-frame inspections. Fresh visuals95/96/98/99 were blocked by the previous screenshot-tool call limit. New-file creation and use_figma access now succeed; this does not establish that screenshot access has recovered. Close each missing visual before a dependent batch is marked visually verified. Unrelated safe batches can proceed.

## 3. File structure and status vocabulary

Planned pages:
- 00 — START HERE: scope, sequence, sources, current batch/status and QA rules.
- 01 — BASELINE REFERENCES: original node links and immutable source images where obtained; metadata includes fixture/date/viewport. Captured images are references, never editable UI controls.
- 02 — SHARED CONTROLS: only existing primitives/tokens required by completed slices; component instances/Auto Layout for maintainability. Build incrementally.
- 03 — BATCH 01 / SELECT AND STYLE: first bounded editing flow and its states.
- 90 — QA AND PRESERVATION: control mapping, before/current/proposed comparisons, findings and verification results.
- Later module pages are added only as their batches start. Keep previous reviewed batch revisions recoverable.

Status values:
PLANNED → BASELINE CHECKED → DESIGN IN PROGRESS → QA IN PROGRESS → DESIGN QA PASSED.
Additional states: NEEDS FIX, PARTIALLY VERIFIED, ENGINEERING DEPENDENCY, USER REVIEWED.
DESIGN QA PASSED never implies IMPLEMENTATION VERIFIED. USER REVIEWED requires actual feedback, not silence.

## 4. Sequence and dependencies

Each row is a milestone, not one giant drawing task. Letters identify smaller sub-batches; finish QA for one before beginning the next dependent sub-batch.

| Batch | Complete task slices | Original evidence / modules | Dependencies | Required QA before moving on |
|---|---|---|---|---|
| 00 | New isolated file; protected baseline links; preservation template; first-slice scope | All99 coverage ledger; REPORT15 | None | Correct new file; original unchanged; traceability and gaps explicit |
| 01 | a Select heading from canvas/Layers and inspect Style; b responsive/pseudo scope and reset; c mixed/locked/read-only states; d normal/expanded panel fit | 02/04/36/77–82/97; M10–11/17–18/37 | 00 | No heading/style/context action missing; exact selection/return; no breakpoint change from resizing; geometry and long-value checks |
| 02 | a Add/search/insert entry; b Layers/reorder/lock/hide/context menu; c Pages/create/rename/duplicate/home; d page SEO/Social/Advanced | 03–07/32–33/40–43/84–85; M12–15 | 01 | All old menus/shortcuts/catalog sections map; no lost page actions; page versus site scope; cancelled creation/settings retain context |
| 03 | a Image/media element controls; b links/text/button/attributes; c layout/container/compound children; d slider/accordion/countdown/progress and other registered contextual types | 37–39/82/93/95 plus code capability registry; M19/21–22 | 01,02 | Expand every applicable section; preserve units/custom values and child limits; no unsupported property shown; old widgets remain editable |
| 04 | a Existing form field detail; b after-submit/server settings; c submissions destination and return | 50/83/94; M20/35 | 01–03 | Placeholder/type semantics; permissions/save owner; conversion risk flagged; form → submissions → return; no fictional universal Undo |
| 05 | a Component creation/insertion; b instance/variant/reset/detach; c existing master detail/update/delete and return | 07/29/86–91; M23 | 01–03 | Master versus instance scope; shared impact; source selection preserved; all existing actions retained; incomplete update Undo remains engineering dependency |
| 06 | a Collection/record list/detail; b fields/schema; c dynamic pages/settings; d binding; e Sources/Variables/Conditions | 10–12/66–69/92 plus current source/runtime; M26–28 | 01–03 | Exact collection/field targets; draft exits; local/server/publish distinction; no new connectors; save failure retains draft |
| 07 | a Asset picker versus library; b organization/metadata/actions; c Crop/Adjust/Resize/Optimise; d upload/error/version/replace and font/icon paths | 08–09/70–73/95 plus current source; M24–25 | 01–03 | Assignment versus management; cancel returns same property; Save version versus apply-to-usages; all four edit tabs; fresh95 visual required |
| 08 | a Colours/modes; b typography/styles; c spacing/advanced tokens; d component styles/classes/presets; e checks/starters/import/export/restore | 13–16/58–65/96; M29 | 01,03,05,07 | Local application versus global source; token references retained; truthful class limitations; header fit; fresh96 visual required |
| 09 | a Template browse/preview; b new page; c replacement confirmation/applied/recovery paths | 27–28/98–99; M16 | 02,08 | Creation and replacement distinct; correct target; existing backup/Cancel retained; fresh98/99 visual required; recovery not assumed from toast |
| 10 | a Preview/page/device/share; b Issues/fix/return; c Publish checks/targets/gates/status; d session/saved/published History; e export | 19–25/30–31/34/74–76; M31–32/34/36 | 02,04–09 | Preview/draft/deployment distinction; long errors readable; Fix returns correctly; real output width; no publishing during design QA |
| 11 | a Review empty/populated/error/closed paths where implemented; b contextual AI entry/run/review/error/quota/return | 01/21/23/26 plus code/runtime; M30/33 | 01,05–06,10 | No fabricated comments/provider results; selection/round identity; available stop/recovery/role gates; no external messages or AI calls merely to verify a mockup |
| 12 | Site Settings one screen at a time: General, Languages, SEO, Domains, Redirects, Access, Analytics, Forms, Code, Headers, Danger; workspace doors | 18/44–57; M35 + M06–07 handoff | 02,04,06–08,10 | Existing save owner per screen; role/plan restrictions; workspace/site distinction; no destructive operations, real invites or purchases |
| 13 | Cross-module task replay; shared chrome/keyboard/overflow/error review; old-to-new preservation closure | M10–38; shared records from every batch | All prior batches | Zero unexplained removals/unmapped actions; no dead-end destinations; unresolved engineering/runtime gaps listed; reviewed design handoff only |

Dashboard/auth/onboarding/agency screens are not silently redesigned. Preserve editor entry/exit and workspace handoffs; if a proposed editor change affects a destination there, include the affected path and its source evidence before accepting the change. The full product inventory and60 runtime-unreviewed routes remain in REPORT.

## 5. Repeatable loop for each sub-batch

### A. Baseline and control census

Read the original frame, current implementation and relevant runtime screen. Record visible, collapsed, contextual, advanced, disabled and role-gated controls. Inspect command/context menus, keyboard actions and registry-driven sections. Use stable capability IDs; include current units/options/defaults, storage owner, permissions and history behavior. A screenshot count is not a control census.

Create preservation rows:
capability ID → old frame/entry → current handler/source → current value owner → proposed frame/control → same/relocated/clarified → state/return → QA evidence → outstanding dependency.

No design completion while an affected row is missing its proposed destination or a capability is removed without explicit authorization. New navigation must point to a real existing destination/task.

### B. Resolve structure and behavior

For material regrouping/resize compare current arrangement with two plausible existing-task compositions. Choose the smallest coherent change. Document why it improves clarity and any canvas/scroll cost. Specify units/validation/commit/cancel/focus/return, source scope and intended recovery. Retain exact existing breakpoint semantics; do not import Webflow's breakpoints or class engine.

### C. Build only that slice

Use native Figma text, components and Auto Layout with existing typography/tokens. Add full-state examples and annotations for existing behavior; prototype only actual supported transitions. Label unimplemented behavior corrections ENGINEERING DEPENDENCY. Keep normal, short-height and long-content cases; do not squeeze controls to make a clean screenshot.

### D. Comparative QA

1. Old ↔ current: identify intentional drift, fixture difference and existing defect.
2. Old/current ↔ proposed: account for every control, entry and supported value.
3. Walk entry → exact target → action → feedback → cancel/back/return.
4. Check supported error/disabled/mixed/inherited/locked states.
5. Compare at matched viewport/breakpoint/zoom; inspect full-size screenshots and scroll endpoints.
6. Review adjacent modules touched by shared controls/scope/return.
7. Independent read-only product-design-guard review for C2/C3/shared changes.
8. Record PASS/FAIL/NOT RUN with evidence. Fix design failures and repeat affected checks only.

### E. Batch handoff

Deliver exact new Figma frame links, changed/unchanged capability rows, before/current/proposed comparisons, open engineering dependencies and actual QA results. Keep user feedback alongside the reviewed version. Continue only when the dependent design checks pass; an unrelated known engineering defect may remain open if it is explicitly separated and the design does not falsely promise it is fixed.

## 6. First active design slice — Batch01a

Goal: select the existing heading, identify its editing scope, inspect/edit supported Style controls, and return without losing selection or page context.

Baseline frames: 02 (8283:2), 04 (8283:610),36 (8293:2). Adjacent state evidence for later01b–d:77/78/80/81/97.
Current source anchors:
- src/editor/inspector/config/sectionOrder.ts: Style/Behaviour/Effects registry order.
- src/editor/inspector/config/cssContext.ts: effective styles, breakpoint/pseudo context and mixed values.
- src/shared/constants/elementCapabilities.ts: conditional control eligibility.
- src/editor/inspector/ProInspector.tsx and registered sections: full control census before drawing.
- src/editor/sidebar/LeftSidebar.tsx: normal/expanded drawer.
- src/themes/tokens.generated.css: chrome tokens.
- src/editor/chrome-ui/: existing control primitives and focus behavior.

Initial preservation groups (now expanded into H01–H34 in BATCH-01A.md):
- Site/page identity, page tabs, existing shell navigation/status/help/history/review/preview/publish entries.
- Canvas selection, breadcrumbs and element actions; Layers search/selection/close/expand.
- Inspector title/type/AI/menu/close; Style/Behaviour/Effects entry.
- Current breakpoint and pseudo-state; current/inherited/reset semantics.
- Heading level H1–H6, text style, Edit text on canvas.
- Typography font/size/unit/line height/weight/colour/alignment and all currently supported More settings.
- Applicable size/spacing/fill/border and other registered sections; component context when present.
- Canvas zoom/view tools, footer context and selection visibility.
- Keyboard/context-menu equivalents, locked/mixed/role gates and legacy/custom values.

Proposed first comparison: keep normal280px drawer and300px Inspector; expose current editing scope clearly and fit existing controls. Do not widen panels as a default. Candidate scope-row rearrangement is a proposal until geometry/adjacent-panel QA.

Geometry baseline:1440−60−280−300=800px center;1280 gives640px, before gutters. Expanded700 gives380/220px. Required comparisons:1440×900 and1280×720; short-height test1440×600 is a proposed QA case, not a newly declared supported minimum. Authored375px is a page viewport, not phone-authoring support.

01a acceptance:
- All affected controls have a traceable retained/relocated destination; no invented handler/option.
- Selecting from canvas or Layers yields the same target; temporary overlay close returns focus/context.
- Current scope and value origin are understandable without changing saved content or responsive rules.
- Existing sections, menus and actions remain reachable with long names and short-height scrolling.
- Design-only checks and actual runtime observations are separately labelled.

01a now has H01–H34 source/destination mappings and eight native Figma states. See [BATCH-01A.md](BATCH-01A.md) and [comparison gallery](BATCH-01A-REVIEW.html). Status: PARTIALLY VERIFIED; scoped visual/source QA complete, prototype playback and explicitly listed unchanged-surface checks remain open.

## 7. QA gates and stop conditions

| Gate | Pass evidence | Failure blocks |
|---|---|---|
| Q1 Capability preservation | Every affected old/current capability maps to new destination or explicit unchanged surface | Any unexplained missing control/option/menu/role |
| Q2 Flow continuity | Entry/target/result/back/cancel and context recorded; prototype or exact walkthrough references | Dead end, generic wrong target, lost selection/draft |
| Q3 State/ownership truth | Local/shared/page/site/workspace + draft/server/publish + Undo owner explicit | Misleading live/saved/Undo state |
| Q4 Layout/accessibility design | Actual min/default/max, scrolling/focus, long content, short/narrow cases inspected | Clipped essential control, hidden focus/return/action |
| Q5 Shared impact | Adjacent consumers and previous accepted slices rechecked where changed | Fixed module breaks another flow |
| Q6 Runtime compatibility | Applicable source review and safe runtime evidence; mutation/reopen tests separately scheduled for implementation | Claim of implementation pass without execution |
| Q7 Evidence/readiness | Frame IDs, comparisons, QA status, missing checks and independent findings recorded | Placeholder approval, screenshot/tool success treated as runtime proof |

Design QA can verify representation, layout and navigation specification. Real undo/save/reopen/output regression testing requires later authorized implementation or an explicitly disposable test fixture. Do not mutate the saved QA site to manufacture a pass.

## 8. Known dependencies and recovery boundaries

- FA06: textarea replacement path may discard field data; label edits placeholder; select typing is misleading. Correct design copy now; safe conversion requires engineering.
- FA07: component snapshots capture instance records, but update Undo restores only the master tree. Do not promise complete recovery before fixing/restoring those records.
- FA08: dynamic/settings CMS drafts lack record-style exit guard. Existing record leave choices are Keep editing / Discard and leave, with Save separate.
- FA09/10: local persistence, server mirror, next-publish generation, page visibility and actual live deployment remain distinct.
- FA01/13: original99 frames have no instances/Auto Layout/reactions. New native components/prototype states are design artifacts, not new product capabilities.
- Four missing fresh screenshots must be closed before accepting their dependent comparisons; current successful file writes do not resolve this gap.
- No original Figma modification, app code change or deployment in these batches.

## 9. Current checkpoint

Batch00: new file created and inspected; four native Auto Layout planning boards are present on page `0:1` (00 — START HERE). Scope `2:2`, core sequence `2:23`, shared-module sequence `2:47`, comparative QA/baselines `2:71`. All four screenshots were downloaded and visually inspected: no clipped text or overlapping sections observed. Screenshot access has recovered for these boards; the four missing historical baseline captures remain outstanding until their dependent batches. See improvement-progress.json for the recorded checkpoint.
Batch01a: eight native states created on page6:8080; scoped source and visual QA complete after corrections. PARTIALLY VERIFIED: remaining checks are explicit in BATCH-01A.md. Original file and application code untouched.
Later batches: PLANNED. Review and close the applicable01a gaps before marking it DESIGN QA PASSED; then continue01b.

