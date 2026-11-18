# Buildrick Figma Design Execution Plan

> **Final focused B3 packet — 2026-10-20:** [42 states and review board](evidence/figma-design-execution/b4-20261020-b3-handoff.md) now cover palette/Help/shortcuts, Tablet Preview and Share outcomes. Independent sampled geometry/native-route findings were corrected; 91 links have valid destinations and loading states have no automatic success timers. Actual search/key/clipboard/network behavior and full playback remain unrun. B9's replay/coaching was explicitly excluded.

> **Current execution and review — 2026-10-20:** [current completion record](evidence/figma-design-execution/COMPLETION-2026-10-20.md) and [Figma task index](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=262-2) supersede the older progress descriptions below for current output. Missing Analytics/Security/Permissions, CMS creation/import/protection/recovery/Site variables and Templates recovery are drawn. B4 now explicitly classifies all 122 historical rows and maps 69 blocks/120 native routes. Independent review corrections and bounded structural checks are recorded. [B10 current review](evidence/figma-design-execution/b10-reviewer-20261020.md) assesses all 40 principles and 23 consistency rows without transferring old spec verdicts to new screens. **B9 remains pending on R1**: user explicitly confirmed interviews are unavailable. Full row-level visual verification, complete prototype playback, accessibility, user studies and runtime remain unverified; no application/deployment authorization is inferred.

> **B8 checkpoint (first pass) — 2026-10-19:** Publish PB01–PB23, Export EX01–EX08, Issues IS01–IS03 and Review R01–R14 are on page `06 · Site delivery` ([record](evidence/figma-design-execution/B8-delivery-2026-10-19.md)). Site settings S01–S21 and Account › Privacy S22–S24 are now drawn too; Analytics and Security headers screens are still open. B4 instance items IC01–IC06 are on page `04 · Inspector`. No independent review has run.
>
> **B7 checkpoint — 2026-10-19:** every B7 bullet now has drawn frames on page `07 · Recovery and access`. Global states G01–G37, History/Activity H01–H16, Plans P01–P12 (incl. dashboard “Choose what stays active”), Collaboration CL01–CL09, area-aware recovery RJ01–RJ04. Record: [B7](evidence/figma-design-execution/B7-global-states-2026-10-19.md). Status **PARTIALLY VERIFIED**: principal screenshots only, no independent review yet.
>
> **B6 checkpoint — 2026-10-19:** every B6 bullet now has drawn frames on page `05 · Resources`:
> - Assets A01–A34
> - Brand B01–B62
> - Components K01–K39
> - Templates T01–T23
>
> Records: [Brand](evidence/figma-design-execution/B6-brand-completion-2026-10-19.md) · [Components and Templates](evidence/figma-design-execution/B6-components-templates-2026-10-19.md).
>
> Instance reset, Variant unavailable and breakpoint overrides move to B4. Status: **PARTIALLY VERIFIED**. Brand passed an independent review once its P1s were fixed. The Components review is pending, and Templates has not been independently reviewed yet. Keyboard, playback and runtime are not verified.

> **Current Figma execution checkpoint — 2026-10-19:** the user subsequently authorized implementing the Figma plan with a separate QA agent. [B3 missing-flow evidence](evidence/figma-design-execution/B3-missing-flows-2026-10-19.md) records **40 native states P44–83**, covering bounded B3.1/B3.2 guards, creation and recovery. Independent QA findings were fixed and freshly rechecked; selected visual and route-structure checks pass, while actual playback was blocked by Figma WebGL. **PARTIALLY VERIFIED; full B3 remains open.** This supersedes the earlier documentation-only checkpoint for Figma output. Application changes and deployment remain outside this scope; historical planning paragraphs below retain their original provenance.

> **BD-25 — compact Pages width, 2026-10-18:** normal Pages/Structure/rename/recovery manager is284px, matching Add/Layers. Rail56px + panel284px =340px. Supersedes earlier560px normal manager width; expanded Listings remains720px. See the canonical brief and `pages-compact-width.md` evidence.

> **BD-24 — latest owner correction, 2026-10-18:** Pages management is in the left rail after Layers. The bottom bar contains created-page tabs and save status. This overrides earlier bottom Pages-button / no-Pages-in-rail instructions in this record and its historical references. The manager anchors beside the 56px rail, below the 56px topbar, above the 32px bottom bar; existing widths, guard/return and permission contracts remain. See the canonical decision in PRODUCT-DESIGN-BRIEF.md and `evidence/figma-design-execution/pages-placement-correction.md`.

Date: 2026-10-18 · Mode: **FIGMA DESIGN EXECUTION / NO APPLICATION CHANGES**

**Current execution checkpoint:** user authorized starting Figma design and requested a separate audit agent. New destination: [Buildrick · Editor design · 2026-10-18](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7). B0–B2 in progress; see [execution evidence](evidence/figma-design-execution/README.md). Planning-only statements below record the earlier scope and are superseded for Figma output only. Application implementation remains unauthorized.

**First-pass result:** the integrated visual checkpoint is available for composition feedback. 12 J-F1 states, 9 companions, 6 viewport samples and 4 task geometry states exist. Independent visual corrections passed for 3 bounded frames; full batch exit criteria are not all closed. Remaining coverage, 200% full-editor and runtime limits are explicit in the evidence.

> For agentic workers: use `superpowers:executing-plans` for sequential execution after the user reviews this plan and authorizes Figma work. Load the applicable Figma skills before their tool calls. Checkboxes below describe future work; writing this plan does not complete them.

**Goal:** Translate the approved editor requirements into a coherent, editable Figma design system, connected screen flows and a traceable design handoff.

**Architecture:** One shared component system supports the editor shell, resource areas and task surfaces. Build one complete editing journey first, then expand by dependency; retain existing requirement IDs and canonical ownership rather than creating a parallel product specification.

**Tools:** Markdown planning records; Figma Design variables, styles, components, auto layout and prototype connections through the Figma plugin. Application React/TypeScript and chrome-ui sources are read-only implementation evidence.

**Status:** Execution proposal for user review. No Figma file, screen, prototype or application change has been made by this planning task. Earlier successful Figma `whoami` establishes account connectivity only; file access, font availability and design writes remain untested.

**User scope reaffirmed, 2026-10-18:** this is a **Figma-design plan only**. The subsequent source-coverage investigation updates planning documents only. It authorizes neither application implementation nor Figma execution. See the [source-coverage review](evidence/figma-plan-coverage-review-2026-10-18.md) for gaps found, corrections and remaining source decisions.

## 1. Scope and authority

The user's current request authorizes this plan. Execution will start after a subsequent instruction approving it. It does not authorize changing application code, generated tokens, production data, deploying, publishing a library or sending research invitations.

This plan schedules work; [PRODUCT-DESIGN-BRIEF.md](PRODUCT-DESIGN-BRIEF.md) remains the canonical product decision record. New consequential product choices belong there, with references to their affected panel/shared contract. Do not call this plan a new final IA.

Read requirements in this order, resolving differences by explicit scope and approval rather than file timestamp alone:

1. Current user instructions and [AGENTS.md](../../AGENTS.md).
2. [Owner decisions](design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md), including Round 2; [shared contracts](panels/00-SHARED-CONTRACTS.md), especially SC-20–33.
3. [Product brief](PRODUCT-DESIGN-BRIEF.md), its incorporated Inspector/block annexes, [remaining IA handoff](REMAINING-IA-HANDOFF.md), [CMS dynamic design](CMS-DYNAMIC-BINDING-DESIGN.md), and the relevant current panel specification.
4. [Design-system specification](design-audit-2026-10-18/DESIGN_SYSTEM_SPECIFICATION.md) as adopted by SC-27; approved owner choices resolve its older OWNER/PROPOSAL labels. Root DESIGN.md and generated tokens establish existing implementation, not permission to reverse approved design changes.
5. The audit matrices are investigation and coverage registers. Recheck their findings against amended specs before treating them as current blockers.

The audit's restriction on using old Figma boards as input remains respected. This work plans **new Figma output from the documents**. Existing historical boards are not an audit dependency. Inspect only the authorized destination and approved reusable library resources during execution; an old board never overrides these documents.

### Evidence inspected for this plan

- Standing instructions, brief context/decision register and current precedence annotations.
- Owner decisions (45 initial choices and 16 Round 2 answers); shared recovery, keyboard, geometry, visual and notice contracts.
- Current panel amendments for Forms, Export and CMS Sources; screen index; design-system component map; interaction and feature coverage register structures; research plan.
- Read-only source spot checks: chrome-ui component files and generated token definitions. For example, generated rail/drawer/tall-row values still differ from approved spec values; those are implementation discrepancies, not reasons to change the design target.
- No full reread of every inventory/annex row, no current application walkthrough, no user interviews and no Figma canvas inspection in this planning task. B0 and each module's preflight explicitly perform the remaining scoped evidence work.

### Reconciliation already established

| Earlier audit statement | Current evidence | Planning consequence |
|---|---|---|
| Forms build/visitor states missing | [Inspector delta §3.1](panels/06-INSPECTOR-DELTA.md) now specifies both | Design from amended contract; verify all form rows during B4, rather than reopen ownership |
| Export has no specification | [Topbar §14](panels/01-TOPBAR.md) now contains geometry, states and T-EX-01–07 | Include Export in B8 |
| E-commerce scope needs owner choice | Owner P1 defers commerce and preserves existing block rendering/text-image editing | Design compatibility state only; no commerce setup flow |
| Brand logo/URL may be hidden with AI | Owner P3 explicitly keeps it and supersedes older OD-A4 | Include in Brand; annotate flag-decoupling dependency |
| Visual deviations await approval | Owner V1–V9 and SC-27 adopt the visual rules | Do not request approval again for those values |
| Sources should be hidden until built | Owner Q12 requires persisted pasted-JSON Sources this version; CMS §10.1 defines them | Include Sources; persistence is a shipping dependency |
| Figma authentication is broken | This conversation's `whoami` succeeded | Recheck at execution; do not inherit stale authentication/call-budget claims |

This is not a claim that every audit gap is closed. The historical 1,179 trace rows / 1,238 intake rows are counts from the existing register, not independently verified working features or a new coverage percentage.

## 2. Delivery approach and visual direction

**Recommended: foundations + one complete journey, then module batches.** This proves the components inside the actual workspace before repeating them across all screens. It also surfaces navigation and space conflicts while correction is still inexpensive.

Alternatives considered:

- Draw every panel independently: quick isolated frames, but shared states and shell fit would be resolved repeatedly. Reject for cross-panel consistency.
- Finish every reusable component before any screen: extensive early library work, but little evidence that the components compose well. Use only a small initial library, expanding alongside real consumers.

Visual direction follows the approved professional editor system: light chrome, Inter UI, Geist Mono values, neutral surfaces, blue accent for meaningful active/selection states, Lucide icons and compact readable controls. No new branding exploration is required. Canvas website content and Brand tokens remain a separate design domain from editor chrome.

Routine visual choices within approved rules can be made by the designer. A required change to ownership, capability, permission, save semantics or approved geometry is recorded as a conflict and raised for a bounded decision before the affected design is finalized.

## 3. Files, Figma organization and traceability

### Local records

| Path relative to this folder | Responsibility / allowed change |
|---|---|
| `FIGMA-DESIGN-EXECUTION-PLAN.md` | This execution sequence, checkboxes and planning review record |
| `PRODUCT-DESIGN-BRIEF.md` | Pointer to this plan and exact approval status; consequential future decisions |
| `panels/00-SHARED-CONTRACTS.md` and affected `panels/*.md` | Amend a genuine spec gap in its owning contract during authorized design execution; no duplicate spec |
| `design-audit-2026-10-18/FEATURE_TRACEABILITY_MATRIX.md` | Preserve FIDs/INV mapping; append Figma mapping/status per inspected batch |
| `design-audit-2026-10-18/SCREEN_DESIGN_SPECIFICATIONS.md` | Preserve S01–S31; append execution references and current scoped review status without erasing audit provenance |
| `design-audit-2026-10-18/INTERACTION_AND_STATE_MATRIX.md` | Reconcile affected state rows and attach their design evidence |
| `design-audit-2026-10-18/40_PRINCIPLE_AUDIT.md` | Preserve P01–P40; reconcile old findings and attach design evidence for every applicable principle |
| `design-audit-2026-10-18/CROSS_SCREEN_CONSISTENCY_AUDIT.md` | Preserve CS-01–23; check the actual component/screen consumers and record remaining deviations |
| `evidence/figma-plan-coverage-review-2026-10-18.md` | Source-to-plan investigation, corrected planning gaps and unresolved source decisions; not a replacement product specification |
| `evidence/figma-design-execution/` | Create during execution: batch manifests, screenshots and review findings; never populate with claimed-but-unrun results |

**Proposed destination:** a new Figma Design file named `Buildrick · Editor design · 2026-10-18`. This isolates the new document-driven design from historical boards. Approval to execute this plan includes creating that file; if the user names an existing file instead, use an additive section/page structure there. Preserve unrelated pages, components and variables. Do not rename or delete historical files.

Resolve ownership at execution using `whoami`: use the only available plan if there is one; if multiple plans exist and no owner is specified, ask which team owns the file. Record the actual returned file URL/key in the brief and manifests, never guess one.

Proposed Figma pages:

| Page | Contents |
|---|---|
| `00 · Read me` | Scope, authority links, conventions, review state, journey entry links |
| `01 · Foundations` | Chrome variables/styles, type, spacing, radius, elevation, geometry, contrast swatches |
| `02 · Components` | Shared atoms, rows, overlays, field controls, navigation and their state sets |
| `03 · Editor` | Shell, Add, Layers, selection, responsive editing, Pages and Preview |
| `04 · Inspector` | Four tabs, Page/special contexts, block/native coverage and Interactions |
| `05 · Resources` | CMS, bindings, Sources, Assets, Brand, Components and Templates |
| `06 · Site delivery` | Site settings, Forms inbox, Publish, Review, client review, History, Issues and Export |
| `07 · Recovery and access` | Shared states, collaboration, plans/trial, permissions, undo/recently deleted |
| `08 · First run` | Research-gated onboarding and Getting started; no screens before R1 evidence |
| `09 · Journey review` | Prototype starting points, walkthrough instructions and review findings linked to canonical screens |

Use sections within pages for individual modules; keep one canonical component/frame and link to it instead of copying it into competing final versions. Clearly label alternatives as proposals.

Frame naming: `S06 / Text / Tablet override / 1440x900 / v1`. Component naming: `Inspector/FieldRow`, `Navigation/RailItem`, `Feedback/SaveStatus`. Frame descriptions carry source FIDs/contract IDs, target/scope, dependency and evidence status. Names/sections may be refined without changing requirement IDs.

For each inspected FID, append `Batch`, `Screen ID`, `File + node link`, `State evidence`, `Design status`, `Dependency`, `Reviewer/date`. Use `NOT DRAWN`, `DRAWN`, `DESIGN REVIEW PASSED`, `DEFERRED-BY-DECISION`, or `REMOVED-N/A`; keep runtime status separate and NOT RUN until an implementation task actually tests it. Non-visual invariants get annotation/acceptance references, not fake screens. New requirements outside the old inventory retain their SC/T-CM/FD-DYN IDs and receive their own mapping.

## 4. Geometry, components and content fixtures

Use SC-27 and DS §2 as the dimensions authority: rail 56; Add/Layers 284 default, 260–360 bounded; Inspector 300; task 360, 320–420 bounded; area nav 240; detail 320; topbar 56; canvas toolbar 44; bottom bar 32. Brand preview is 468 with its specified fallback. Inspector overlay at ≤1366 has the documented 12 inset; at ≤1280 apply the task sheet/48 peek behavior and SC-19 target visibility rule. Do not combine docked widths where the spec calls for an overlay.

Validate editor frames at **1440×900, 1366×768, 1280×720, 1024×768, 1440×600 and 1920×1080**. These are review samples, not a new supported-viewport policy. Check each threshold at one pixel either side where behavior changes. Explicitly inspect the **740px docked-task canvas column**, toolbar wrapping, resource-nav collapse, detail-as-subview and fixed Brand-preview fallback. Use 320/375-wide samples for the external client review page and visitor form, not an invented mobile editor layout. Include a 200% text-enlargement inspection; actual browser zoom and assistive technology remain implementation tests.

Record width budgets as `workspace − rail − docked left − docked right = canvas column`, then separately account for gutters and overlays. Record vertical budgets for topbar wrapping, banner slot, toolbar rows and bottom bar. The authored Desktop canvas remains 1440 with Fit and one-click 100%; panel width changes never change the authored breakpoint. Selection handles/labels remain screen-sized.

Build the minimum shared set before the first journey: Button/IconButton, TextInput/Search, Select, Tabs/Segmented control, RailItem, PanelHeader, Row/TreeRow, Toolbar, Inspector FieldRow, NumericUnit, Tooltip/Menu, SaveStatus, Banner, Toast, EmptyState, Skeleton and basic modal/guard variants. Expand with ColorPicker, BoxModel, Alignment, accordion/override counts, shared bulk bar, icon picker, resource rows and complex overlays in the owning batch. Match code component names where useful; a Figma component does not imply its code exists.

Each component needs only applicable states: default, hover, pressed, focus, selected, disabled-with-reason, loading, error, mixed, inherited/overridden and expanded. DS §4 determines the set. Document label/slot properties, sizing, wrapping, keyboard intent and consumer references; avoid an all-combinations variant explosion.

Use clearly synthetic content: a client service site with Home/About/Contact, a Blog collection, image assets, Brand tokens, a reusable header and a contact form. Add long page/asset names, nested Layers, a multi-select with mixed values and realistic form errors. Represent the original CTRL-07 scale fixtures: **100 pages, 5,000 tree nodes, 1,000 assets, 1,000 CMS records, 100 component definitions with nested references and 1,000 token usages**. Draw populated excerpts with visible counts, search/filter/pagination and retained selection; do not create thousands of Figma nodes or claim performance validation from a drawing.

## 5. Ordered execution batches

All batches start by reading the current owning specs and applicable acceptance rows. Each ends with a manifest, design evidence and a short outcome report. Batch numbers describe the main sequence, not promised dates or equal effort estimates. B9 is a conditional branch: start its first-run design as soon as the interviews and the required shell/template components are available, rather than waiting for B8. Research coordination can start alongside B0, without agent outreach.

### B0 — Reconcile requirements and initialize the design record

**Inputs:** brief; owner decisions; SC-1–33; screen/state/traceability matrices; relevant annexes. **Output:** reconciled screen-to-batch mapping, scoped open-risk list, authorized destination and actual file reference.

- [ ] Read the full shared contracts and initial journey panel specs; compare affected audit rows to current R-1018/R-1018b amendments.
- [ ] Classify each encountered discrepancy as already resolved, visual detail to specify, engineering dependency, research gate or consequential owner choice. Preserve source IDs and quote the conflicting rules where necessary.
- [ ] Seed mappings for every S01–S31 entry from section 6; begin per-FID reconciliation for B1/B2. Never mark an entire module covered merely because its main frame exists.
- [ ] Reconcile all 45 initial and 16 Round 2 owner decisions, relevant SC-22 earlier decisions, P01–P40 principles and CS-01–23 consistency rows against current specs. Give each an affected batch, current decision status and evidence requirement. Resolve or retain each relevant documentation-audit gap ID; old NEEDS REVISION text alone does not reopen an approved choice.
- [x] Verify Figma connectivity and advertised capabilities; load create-new-file skill before file creation and resolve file ownership. Record actual URL/key.
- [x] Create the page structure and Read me with planning/design/runtime status distinctions. Inspect the destination before writing; an empty destination has no existing screen components to reuse.

**Exit:** every screen has a disposition and batch; B1/B2 have no unresolved consequential choice; no unavailable evidence is labelled verified. Other module-specific blockers remain scoped to those modules.

### B1 — Foundations and initial component set

**Inputs:** SC-27, DS §2–4, current font/token/component sources. **Output:** Foundations, initial Components and a compact state specimen.

- [x] Resolve fonts and supported styles through Figma; match Inter and Geist Mono from the source. Record a font limitation rather than silently substitute.
- [x] Create/reuse scoped chrome variables and text/effect styles for approved values. Separate customer-site Brand tokens. Do not regenerate or edit application token files.
- [ ] Build the initial shared set in section 4, with auto layout and explicit component properties. Resolve NumericUnit/FieldRow geometry from DS and INS-D11 before their first use.
- [ ] Check contrast pairs including selected rows, disabled reasons and focus states; inspect long labels, mixed values and control clipping.
- [ ] Screenshot and structurally inspect the specimen; fix layout/state defects before B2.

**Exit:** editable shared components reproduce the approved visual rules; component use and any new design-only variables are documented. No whole-product library-complete claim.

### B2 — Editor shell and first complete journey

**Inputs:** P01–06, P11; SC-1–5, 8, 12–19, 24–31; Inspector base contracts. **Output:** Editor frames and journey J-F1.

- [x] Compose Topbar, stable rail, Add/Layers, canvas toolbar, Inspector and Pages/status within one shell. Keep Site settings in the topbar, canvas view controls local and bottom bar limited to Pages/status.
- [x] Draw J-F1: open existing Home → Add text → select through Layers → edit text/style → switch to Tablet → change one property → show override/fallback → Undo/Redo → Preview → return to the same page/selection/breakpoint/view.
- [x] Draw companion cases: insertion rejected by lock/stale target; multi-select Mixed; pending/failed save; narrow overlay revealing its target; focus mode exit restoring the prior panels.
- [ ] Validate width/height budgets at the section 4 samples, including wrapped topbar, two-row toolbar, overlay/tray/peek, long names and focus states.
- [x] Link supported prototype actions; annotate real editing, keyboard, save and undo semantics where Figma simulation cannot implement them faithfully.
- [ ] Review the journey visually and against source requirements. Resolve shared-component defects before extending to all modules.
- [ ] Prepare the separate strategy §7 core-loop task-test fixture (build a section → send review → publish). Run the five-user test once P01–05/P11/P12 and the relevant B8 task paths are represented; until then record it as pending. This is distinct from R1's first-run test and has no assigned owner/date in the strategy yet.

**Exit:** an integrated, reviewable editing journey with meaningful error/recovery and return context. This is the first visual checkpoint; user feedback applies to composition, not an implicit reopening of approved IA.

### B3 — Complete canvas, Layers, Pages and navigation

**Started2026-10-18 after the user's next-phase instruction.** [Pages first-slice evidence](evidence/figma-design-execution/B3-pages-start.md) represents27 states and selected connected routes. Full checklist remains open; bounded visual checks do not close pending per-FID, Canvas/Layers, restricted-state or runtime work.

**Continued2026-10-19:** [Pages continuation evidence](evidence/figma-design-execution/B3-pages-continuation.md) adds16 scenes for opening/exact return,100-page desktop/short lists, offline and Viewer access. These are partial state coverage; the checklist below remains open, including creation/templates, switch guards, folder/reorder and runtime/accessibility.

**Inputs:** P01–05, P11, P18, P24; shared action/shortcut/lock/undo contracts. **Output:** complete S01–05/S12/S22/S28 families and their trace mappings.

- [ ] Cover insertion routes, drag/drop feedback, quick-add, context menus, inline text/list keys, keyboard resize, marquee, multi-selection and inherited locks; provide non-drag alternatives.
- [ ] Include Paste HTML sanitization/review and invalid-input recovery, Move to page, Group vs Wrap/Unwrap, multi-target validation, contextual action eligibility and clipboard failures. Preserve each operation's captured target and one-step history semantics where specified.
- [ ] Cover Pages management, reorder, page settings, long lists, SEO/indexing ownership, switch guards, status priority and delete/restore entry.
- [ ] Draw Pages Listings/Structure/folders, page rename → URL/redirect consequence → exact return; palette scoped/unscoped groups, nested result/Show all levels; shortcuts platform toggle and single-key-off state (P11 §§4–7; P18 §§5/9). Include keyboard splitters, bounded collapse/restore and region/skip-link focus when a resource area replaces the canvas.
- [ ] Complete topbar menu/bell, Command palette, shortcuts, Help, Preview and return flows; restore URL targets and invalid-target fallbacks per SC-26/IA-07.
- [ ] Draw Share preview link as its own dialog/flow: mint/reuse loading, unavailable/expired link, copy success/failure, exact guarded return and dashboard-owned link-management boundary (P01 §7.3; IAF-15). Preserve the specified external-door navigation to Site health, Invite teammates and Account settings without inventing their whole dashboard interiors. Draw Permissions from P10 §6 and reconcile the stale P18 open-status footer before marking its palette/menu path complete (section 8).
- [ ] Inspect every affected preservation/FID row against a frame, shared variant or justified non-visual annotation. Finish postponed first-journey controls rather than letting the specimen stand for full coverage.

**Exit:** existing editing/navigation tasks remain discoverable, with exact destinations and context-preserving return. First-run coaching remains B9.

#### B3 continuation work plan — 2026-10-19

**Execution update after authorization:** P44–83 now supply visual/route evidence for the About settings slice of B3.1 and blank/SaaS Landing creation slice of B3.2, plus exact-return companions. See [delivered output, QA and explicit remaining branches](evidence/figma-design-execution/B3-missing-flows-2026-10-19.md). The older documentation-only statements below describe the planning step, not the latest execution state. Keep packet checkboxes open: broader owner/permission cases, remaining creation branches, B3.3 organization, B3.4–6 and integrated acceptance remain unfinished.

**Gap-first correction after user feedback:** B3.2's core creation/template contracts already exist in P11 §6 and P15 §§4–6/10, including failure retry, capacity, cancellation and exact return. Do not rewrite them or report them as new design. Their outstanding work is visual/execution evidence and engineering validation. The documentation continuation instead addresses independent B3.4 gaps T2-32/T5-21 in [P05 §5.1](panels/05-CANVAS.md#51-grid-and-ruler-guides--targeted-gap-resolution-2026-10-19); this is not completion of B3.2 or B3.4. T2-22/T1-11 remain open; Q7's already-decided binding destination is not reopened.

**B3.1 written-detail update:** user authorized proceeding. Shared behavior now lives in [SC-24.1–3](panels/00-SHARED-CONTRACTS.md#sc-241-navigation-transaction-and-draft-ownership--b31-2026-10-19); Pages-specific flows, twelve reproducible acceptance fixtures and current source gaps live in [P11 §7.1–7.4](panels/11-PAGES-AND-BOTTOM-BAR.md#71-b31-page-navigation-and-settings-return-contract). The feature/state matrices carry bounded mappings. Independent read-only review passed the bounded written slice after two handoff clarifications; see section 9. **Written detail delivered; visual/runtime acceptance NOT RUN.** Next documentation packet is B3.2; do not mark full B3.1 design or B3 complete.

**Deliverable now:** a resumable documentation sequence and the first slice's acceptance matrix. **Status: planning specification; no additional screens drawn or runtime checks run.** Existing B3 checkboxes remain open. Product ownership, geometry and action rules remain in the brief and panel contracts; this subsection schedules and tests them rather than replacing them.

**Resume evidence:** the local B3 Pages continuation record reports P28–P43 and explicitly leaves dirty offline cancellation, switch guards, creation/templates, folders/reorder, Permissions and Versions destinations unfinished. Those historical scene counts and links were read as records only; the destination was not inspected. The next slice is therefore **B3.1 — resolve drafts before leaving**, followed by creation and organization. Starting B4 now would leave basic page journeys incomplete; repeating the already recorded presentation rollout would not resolve these gaps.

**User task:** a site editor can move from a draft or page-management task to a named page without losing input or opening the wrong target. Viewer navigation remains separate from management rights. Task frequency is unknown; ordering is based on dependencies and risk to saved work, not invented usage data.

**Applicability:** inspect Pages, bottom navigation, Page settings, shared guards, save feedback and origin return. CMS/Site settings/Brand participate only as guard-owning origins; their full designs stay in B5/B6/B8. Canvas/Layers and global navigation receive later bounded packets below. Commerce, first-run research and application implementation are outside this continuation. Full feature-row reconciliation remains unfinished; this packet does not certify B0 or all B3 coverage.

| Order / packet | Inputs and dependency | Reviewable output and acceptance | Verification / completion evidence |
|---|---|---|---|
| **B3.1 Drafts and exact return — written detail delivered; validation open** | P11 §§4–7; SC-1/2/4/17/24; brief IA-05/07. No new owner decision required for the mapped cases | PG-G01–12 now map to P11 §7.1–7.4 and SC-24.1–3. Visual states/variants remain to be produced in authorized visual work | Document review below; later trace every branch and inspect its named target, feedback and focus. No completion from a generic guard screenshot |
| **B3.2 Create a page and return** | B3.1; P11 §6, P15 Templates, P23 capacity and SC-15 | Blank create: name validation → capacity → create → named page. Template create/replacement: captured source → template choice → consequence handling → correct target/return. Include cancel, failed create, offline and restricted-plan cases without duplicating a page on retry | Source-check actual create/template routes before expanding the handoff. Keep the capacity API and T-4 Undo dependency visible; no success claim from a drawn capacity count |
| **B3.3 Organize and recover pages** | B3.1; P11 §§5/7, P24 recovery, SC-32 | Folders/privacy, search across views, reorder/menu alternatives, bulk partial results, rename → URL/redirect return, delete → Undo/Recently deleted. Preserve homepage/only-page and in-folder restrictions | Map PG-02–08 and T-PG-06/14–16/19 to the affected branches; distinguish unchanged earlier evidence from newly reviewed gaps. Review long names and 100-page fixtures at normal/short heights |
| **Checkpoint after B3.1–3** | All three packets | Every mapped Pages task has entry, target, outcome and recovery; list search/scroll and active page agree after each return. No global Saved label conceals a failed local operation | Independently review the bounded written flows; assess geometry, grouping, labels/status and interaction separately during visual work. This checkpoint does not close Canvas/Layers or B3 |
| **B3.4 Canvas and Layers editing** | Shared target/draft contracts established by B3.1; P03–06, SC-3/12/14/17, P24 | Insertion/paste, selection, inherited locks, move/group/wrap, inline text, drag cancel and non-drag alternatives; explicit Inspector reveal and exact target. Reuse the existing core journey where applicable | Inspect source and each affected FID/control before assigning a frame. Investigate T2-22/T2-32/T5-21 and related section 8 gaps; do not convert unresolved canvas behavior into a guessed contract |
| **B3.5 Navigation and contextual doors** | B3.1; P01/P18/P22, P10 §6 | Command palette/Help/shortcuts, Share preview link, Permissions, URL recovery, View/Preview return and status-to-History entry. External account/team/site-health doors preserve context without inventing dashboard interiors | Inspect the exact destinations and failure states. Link History/notification internals to B7 and delivery/review internals to B8; an unwired door is not a completed end-to-end journey |
| **B3.6 Coverage and integrated review** | B3.1–5; B0 mapping debt | Reconcile every affected preservation/FID/state row to current evidence, a justified non-visual contract or a named dependency. Attach a complete journey across Pages → editing → recovery → return | Review S01–05/S12/S22/S28 against the screen map and original B3 checklist. Explicit cross-batch dependencies remain open; B3 exit cannot pass while a required route/state is missing |

**Files:** update this sequence and the brief checkpoint now. During subsequent documentation work, place necessary contract amendments in the owning panel/shared contract; use the existing feature/screen/state registers for mappings. Do not create a second capability inventory or reserve invented Figma node IDs. New packet IDs identify work, not replacement product requirements.

##### B3.1 — draft and page-navigation acceptance matrix

The canonical shared guard is SC-24: **Leave without saving?**, **Keep editing** (default/Escape), **Discard changes**, **Save and leave** where explicit Save exists. Brand's pending/failed-save variant has **Leave and keep retrying**, never Discard. Ordinary autosaved canvas changes do not acquire a new page-switch confirmation. Site settings Preview/Publish uses its separately specified variant and is not the page-switch flow below.

Capture site, origin owner/object, draft identity, invoking control, intended destination and relevant view state before a guarded transition. One pending destination remains fixed until completion or cancellation. A blocked second click cannot retarget it. Page settings is modal: resolve/close its topmost guard before activating underlying page navigation; do not simulate clicking a tab through the scrim.

| Case / requirement | Entry and target | Required result, cancellation and failure |
|---|---|---|
| **PG-G01 / T-PG-04** | Dirty CMS record → open/close rail Pages | Opening the manager preserves the record draft and active page; closing returns to its invoking control. No leave guard merely for viewing the manager |
| **PG-G02 / T-PG-02** | Dirty CMS record → activate **Open About in Editor** from strip or manager | SC-24 names the affected record/task and keeps About as the destination. Keep editing/Escape retains the record and clears pending navigation; focus returns to the source task. Mere tab focus never triggers this transition |
| **PG-G03 / IA-07** | PG-G02 → Save and leave | Show saving for that record, prevent repeated submit, await the owning operation's confirmed result, then open About once. Validation/error/conflict/queued result retains input and pending intent; retry revalidates the same operation. Do not label a queued save successful |
| **PG-G04 / SC-24** | PG-G02 → Discard changes | Discard only that registered form draft, then open About. Existing successful saves, canvas edits and other owners' work remain. If discard is unsupported, the destination stays blocked; never pretend it completed |
| **PG-G05 / T-PG-07** | Home on canvas → About row → Page settings → edit → close/Cancel/Escape | Settings retains About's ID while canvas stays Home. Dirty dismissal invokes the shared guard; Keep editing returns to About's draft; confirmed save/discard returns to the captured manager row or original Inspector entry. Do not switch Home to About merely by managing settings |
| **PG-G06 / P11 §7** | About settings → Save, or Cmd/Ctrl+S | Footer Save closes only after the owning writer succeeds; keyboard Save stays in the form. Invalid slug/head code and save error keep input and show local recovery. Successful local form commit and document/server sync must have distinguishable status; neither proves publishing |
| **PG-G07 / T-PG-17** | Offline About settings with staged edits → close | Preserve the draft. Save is unavailable with the existing connection reason; no Save-and-leave path can claim success. Keep editing retains the modal; explicit discard returns to its captured origin. Once closed, opening an already-loaded page remains available |
| **PG-G08 / P11 §4, P05 §5** | Resolved leave → About first visit or revisit | Preserve editor-wide breakpoint/width. First visit uses Fit/no selection; revisit restores valid page-specific zoom/pan/selection. Explicit page opening resets authored pseudo-state to Base, announces the page and keeps its bottom entry visible. Invalid element IDs are not transplanted from Home |
| **PG-G09 / SC-24 Brand variant** | Brand pending/failed save → Open About | Keep editing returns to Brand. Save and leave uses its specified flush/retry and failure retention. Leave and keep retrying opens About while honest global pending/failure status persists; offline omits Save and leave. No Discard for applied Brand history steps |
| **PG-G10 / IA-03/07** | More than one affected staged owner | Identify each owner and resolve in an explicit sequence; stop at first failed/invalid save. Keep completed saves, preserve unresolved drafts and retry only unresolved work. Cancellation cancels continuation, not successful prior saves |
| **PG-G11 / IA-07** | Destination/origin deleted or access changes while guard is open | Revalidate target and permission before save/navigation. Explain the unavailable target and offer the surviving containing page/list; do not silently select another object or resend under another account. If the original focus target vanished, focus its surviving section header |
| **PG-G12 / T-PG-11, IA-05** | Viewer bottom navigation; or current Home selected from a resource area | Viewer can open pages while management remains unavailable. Opening Home from another area returns to Editor even if Home is already the remembered page. Same-page contextual Back preserves its captured context; explicit page navigation follows PG-G08 instead |

**Composition and hierarchy constraints for later visual work:** retain the 284px normal manager and its pinned search/views, 84px creation footer and one scrolling body; keep expanded Listings at 720px. Page settings remains 720px maximum with bounded height and sticky tabs/footer. Do not stack a second active focus trap behind the guard. The guard identifies the affected draft before its actions; the safe default is Keep editing. Saving/error feedback stays attached to its owner, while bottom status reports outstanding operations. Existing compact field/action styles and widths remain; long owner/page names wrap without shrinking their type. This subsection introduces no new sizing token.

**Review separately:** geometry at 1440×900 and 1440×600 plus the existing narrow/200% samples; grouping and action hierarchy; labels and local/global status clarity; keyboard/focus and interaction. Geometry/visual fit, actual keyboard/screen-reader behavior, prototype playback, save/reopen and permission enforcement are **NOT RUN** here. Follow the existing full viewport matrix in section 4; these named cases are a first slice, not reduced acceptance coverage.

**Fresh source evidence — 2026-10-19, working tree HEAD `19f964d5e`:** `src/editor/shell/PageTabBar.tsx:67` calls `composer.elements.setActivePage(pageId)` directly in its click handler. `src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx:81–120` has separate Done/Cancel/guarded-close paths: Cancel discards directly; dirty close opens the existing warning. `src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts:230–293` validates slug/head code, awaits `updatePage`, marks the local snapshot clean and emits a toast. These bounded source reads do **not** establish a server persistence receipt or a cross-module guard implementation. SC-24's uniform dirty-close behavior remains a design target, not an observed runtime result.

**Implementation dependencies to retain:** one guarded-navigation/draft-owner contract; per-page view snapshots; clear owner-specific commit/sync receipts; permission/target revalidation. Investigate the existing implementations before any later coding task. Application changes require their own authorization under the active scope.

**Document verification:** contract/source comparison and link/ID checks are recorded in section 9. All PG-G cases are specified, not executed. Independent review evaluates this planning increment only; it cannot promote historical scenes, B3 or the whole design to complete.

### B4 — Inspector, block/native coverage, Forms and Interactions

**Inputs:** FD-INS-02/03, all linked 122-row/69-block/120-native-route registers, P06, P19, form build/outcome contracts. **Output:** Inspector page and form/interaction journeys.

- [ ] Build Content / Style / Behavior / Effects with persistent identity/scope; cover Page, single/multi-selection, instance/main-component and special contexts.
- [ ] Finish numeric/unit conversion, color/token picker, box model, alignment, overrides/reset, advanced attributes, conditions and effects controls using their owning tab.
- [ ] Map every Inspector preservation row and every block/native route. Reuse component/context variants where contracts are identical; supply a distinct frame whenever controls, eligibility or semantics differ. Do not substitute six representative blocks for the full register.
- [ ] Reconcile every reused BIC/IC/II operation against current SC-15 before drawing confirmations: old Tabs/Modal/compound-item prose must not revive superseded always-confirm deletion. Explicitly cover compound parent/child selection, native-child styling, empty/broken relationship repair and safe conversion/content preservation; keep existing advanced/unknown values legible and preserved.
- [ ] Draw the II-04 Font → Manage site fonts → Use → originating Inspector field round trip with B6, including upload/add-to-site/assignment as distinct actions. Include header-wide Apply style to all/Reset style, semantic type conversion and pseudo-state context reset as source-mapped tasks rather than assuming field variants cover them.
- [ ] Add integration specimens for local literal vs shared Light/Dark token edit, background-image replacement, unavailable provenance, invalid field draft → selection/page/tab/state switch → return, stale async picker result, eligible/skipped batch counts and Apply-style zero-property no-op. Use integration-closure II-01–06 and the preservation map; save excludes invalid drafts and runtime enforcement remains untested.
- [ ] Required compound examples: Tabs pair selection/repair, transient reveal of hidden child content, Modal trigger/dialog and shared-definition refusal with local-root alternative, Table/cell/wrapper return, unsupported merged/ragged tables and native/custom fallback. Keep these inside the full B69/native mapping, not as replacements for it.
- [ ] Draw form build configuration, associated labels vs placeholders, unique submission keys, success configuration and published visitor success/failure/retry states. Preserve the documented interim result-page behavior as a separately labelled engineering-dependent state.
- [ ] Retain the warning for existing Password fields while excluding new Password/Upload authoring; separate document field edits from service-saved After submit and recipient permissions. Draw inbox Configure in Inspector from another page and the missing-form fallback (P06 §3.1; P10 Forms).
- [ ] Resolve form-field type conversion before completing that interaction: P06 §7 says INS-D05's confirm has no SC-15 classification. Record the choice in the shared contract/brief; do not silently apply the separate CMS field-conversion rule.
- [ ] Draw Interactions selection/edit/play/reduced-motion/failure cases and annotate output-engine dependencies. Include its feature-flag-off state; the flag and SC-9 release dependencies still govern availability.
- [ ] Include presets-first Add picker, CSS-animation vs triggered-interaction drill-ins, target picking/missing target, authored-property conflict and retained unknown/legacy configuration. Keep unsupported Reverse/breakpoint controls hidden until their named dependencies; resolve the separate client-review animation decision before its B8 specimen (P19 §§4–5/14).

**Exit:** full indexed Inspector coverage, form build ownership in Behavior and inbox ownership in Site settings; no claim that a prototype proves rendering, conversion, persistence or output correctness.

### B5 — CMS, bindings and persisted Sources

**Inputs:** P07, FD-DYN-01, P06, SC-9/13/15/24/26; owner Q12. **Output:** CMS area, binding/condition controls and J-F2.

- [ ] Draw collections/schema, records, record conflicts with field diff/rebase, dynamic pages, draft preview, deletion/recovery and permission/offline cases.
- [ ] Draw collection creation and CSV preview/column mapping/JSON import; all 16 supported field-type entry controls; Used by/Show usages; stored-data conversion preflight; adding a required field to existing published records; collection-slug impact and redirect handoff. Preserve per-owner server/refusal/interim behavior (P07 §§4–9, T-CM-01–13).
- [ ] Draw J-F2: bind from the property's owning row → choose record/field → inspect resolved/missing data → edit the referenced record → save/cancel → return to the exact element/property. Distinguish Content's binding summary from the actual property's editing home.
- [ ] Cover Collection list filtering/sorting and visibility conditions; retain the documented browser-script scope for supported live sources.
- [ ] Schedule **all three approved dynamic creation ways** (FD-DYN §§8–10, T-DYN-01–05/18): property-row binding; contextual Add field click/keyboard/drag with type mapping, paired image-alt binding and Undo; automatic List of {collection} cards and Create collection page from CMS, collection creation or missing record-link entry. Draw distinct origin returns, cancel, page-created/link-save-failed recovery, retry-only-link and generated-page Undo/missing-link state. Coordinate the Add/Inspector/canvas nodes with B3/B4.
- [ ] Complete list query/filter/three-sort-key/skip/limit/pagination, related-record and editable No-items-slot cases; collection-page pagination prohibition and collision states. Cover the Record switcher, Show drafts, draft-record Preview exception, Show hidden ghosts, no records and deleted preview record (FD-DYN §§11–14, T-DYN-06–11/13/17–20).
- [ ] Draw legacy conditions as **inactive until explicitly activated**: index → Locate → Activate or Keep inactive → immediate-source return. Include unevaluable rules, pre-publish warning and hidden-render disclosure that this is not access control (FD-DYN §§12.3–12.4). Conditional P5 form bindings and members remain outside the approved active UI.
- [ ] Draw CMS → Data → Sources for **persisted pasted JSON**: Check data, Add, preview, rename, Replace data, usage consequences, delete/restore, invalid JSON/duplicate keys, offline-disabled writes and server receipt failures.
- [ ] Draw source-consumer repair for deleted sources, missing or type-changed paths and static publish shown/hidden outcomes; source payload is not a visitor runtime fetch (P07 §10.1, T-CM-20–22). Register SC-9's stray “per-collection link” dependency wording as a source conflict, not permission to introduce feeding collections.
- [ ] Include Site variables and the read-only Conditions index. Leave fetched URL/API Sources, Source→collection feeding and element-property→Source bindings outside the committed interaction design until the explicit questions in CMS §10.1 are resolved. Do not conflate them with already-approved dynamic binding sources.

**Exit:** supported Sources are fully designed with the mandatory persistence dependency visible in handoff; unresolved extensions do not block drawing the approved JSON/Conditions scope.

### B6 — Assets, Brand, Components and Templates

**Inputs:** P08/09/13/15; component package contract; SC-13/15/32/33; owner P3/P4/N1/N2/N7/N8/V8. **Output:** resource management/apply flows and J-F3.

- [ ] Draw Assets management vs field-specific picking, upload/progress/failure, quota, folders, image editing and the shared icon picker through both doors.
- [ ] Draw version-family → Upload new version/Save version → optional Replace across site, including blocked placements, all-or-none page replacement, one Undo and CMS usages as links only; never infer globally unused from a partial scan. Draw site Fonts management through Inspector and Brand, distinguishing personal file upload, add/remove site font and assignment (P08 §§5–7, T-AS-05–07; II-04).
- [ ] Draw Brand tokens, preview, From logo or URL, Connect with restore point, local application/save feedback and pending-save leave guard.
- [ ] Map all 14 token kinds/reusable-style/tool destinations; paired dark/Auto website values and preview lock/discard while editor chrome remains light. Draw starter Preview → Apply/Cancel, import dry-run/mode/diff/restore checkpoint, export CSS/JSON/Tailwind and Checks → Open/Fix/Ignore. Include local recovery/offline constraints and honest format-fidelity reporting (P09 §§5–9, T-BR-01/03/04/12/13/15).
- [ ] Draw Components through Add → Components and the Layers instance link; distinguish This site vs workspace Library, page-only scope, adoption, editable package import/export, overrides, impact and restoration.
- [ ] Draw Create/share vs This page, duplicate, capacity refusal and **Update from selection → Choose on canvas → Return to review → Update**. Cover pinned revision/dependency/override conflict review, site-local drafts vs Share update, detach/delete/restore and explicit revision-service fallback. Coordinate B4 instance variant-unavailable/reset/breakpoint-state overrides. New variant authoring remains deferred (P13 §§5–9, T-CP-03/04/06/10/14–17).
- [ ] Draw package roots/destination → validate/dependency-map → review → Import receipt; cancel-before-commit vs close-during-commit; unknown outcome → receipt reconciliation before retry; conditional Undo vs Review imported resources; successful import with failed Insert. Include inaccessible/incompatible required dependencies, shared scope/capacity and no writes before Import; annotate validator categories without inventing new screens (PKG-01 named subsections: Portable content and references; Import workflow, states and commit; Permission, lifetime and migration; T-PKG acceptance).
- [ ] Draw Templates preview/apply/replace, Brand connection, Free/Pro state and saved-template recovery. Cover Creating/Replacing origin, stale target/mode preservation, page-created/import-failed partial result, retry into the same page, slow/unknown outcome, backup failure, imported-parts/component-flattening report and Save as template Name/Description/rename (P15 §§5–9, T-TP-01–04/07/12/15–17/21).
- [ ] Draw J-F3: selected image → asset picker → choose/apply → return to the same property; include deleted target and cancelled picker. Add resource-manager return and component-package failure/retry walks.

**Exit:** managing shared resources and applying them locally have distinct scope and one canonical owner; Brand chrome never inherits the website's preview colors.

### B7 — Global recovery, history, collaboration and plans

**Inputs:** P12/21–24; SC-4/6/9/15/20/24/30–32; owner S1–6/Q10. **Output:** shared state families used by every previous batch.

- [ ] Draw skeleton/crash/offline/session-expiry/conflict/storage-full/server-newer recovery and retry. One banner slot and one toast pipeline; never show Saved before its receipt.
- [ ] Draw History Saves/Session, Compare, Time travel, Activity and exact safety-snapshot/restore consequences. Distinguish Undo restore from document ⌘Z and interim recovery from server-dependent soft delete.
- [ ] Include Saves filtering and inline Visual/Semantic comparison → dedicated Compare; Activity exact-item vs interim panel landing/pagination; Issues Ignored/Restore and load-damage Locate-only cases. Reconcile unresolved Saves-filter/Session-key declarations with current P12/P18 before closing them (P12 §5).
- [ ] Draw presence, remote deletion, concurrent-edit signals, people popover, access loss, viewer and plan-lock distinctions; cover collaboration flag-off as well as flag-on, without exposing unavailable actions.
- [ ] Separate **Phase A Presence** from **Phase B Live editing** and their release gates. Draw Follow start/stop/peer leaves/changes area, Wait/Edit anyway advisory, hidden/redacted location, Viewer Go-there refusal, own-operation undo skip and backup before Get latest/resync (P21 §§4–5/11).
- [ ] Draw same-user reauthentication versus different-account no-resend, retained-copy ownership, same-browser Edit here takeover with save failure/race, new-version safe reload/chunk failure, deleted site/workspace-deletion states and phone Open read-only anyway vs a nonblocking narrow-desktop notice (P22 §§5–7). Show unknown **role** as write-disabled separately from unknown **plan** pending behavior; do not translate plan-loading into an access grant.
- [ ] Draw Free/Pro/trial limits, over-limit active set, trial end, locked-but-readable resources and protection-removal consequences. Preserve content and allowed Preview/export.
- [ ] Draw the **linked dashboard Billing → Choose what stays active** screen from P23 §5.5a: OWNER-only 640px dialog, sites then pages, selection counts, search above 20 rows, consequence confirm, saved result and 30-day change cooldown. Billing opens in a **new tab**, preserving editor context; on window focus recheck the plan and reflect unlock/pending fallback per P23 §5.7. This does not authorize redesigning the rest of Billing.
- [ ] Apply shared bulk selection and Recently deleted patterns to each owning list; verify each consumer's confirm exception rather than assuming all delete actions match.
- [ ] Draw the area-aware recovery journey: Editor edit → CMS delete → live toast recovery → expired-toast Open Editor to undo, without altering a hidden document. Include off-page scope labels, superseded Undo disabled, field undo vs committed step, page-restore slug collision/missing folder, partial component relink and restored-over-limit read-only item (P24 §§4/6).

**Exit:** loss/recovery states are reachable in relevant journeys; backend dependencies stay separate from visual review results.

### B8 — Site settings, Publish, Review, Issues, Forms inbox and Export

**Inputs:** P10/12/14/17; P01 §14; P25 non-visual event contracts; SC-7/8/9/20/24. **Output:** delivery surfaces and J-F4/J-F5.

- [ ] Draw every indexed Site settings section and Danger zone, with local save, validation, permissions and return to origin; cover form inbox/filtering/retention/export/delete separately from form building.
- [ ] Provide staged/immediate/mixed Languages examples, field-conflict review independent of flags, Save settings first, immediate Access target vs next-publish interim warning, Permissions entry, DNS read-only verification vs Planned CRUD, and exact-form return/fallback (P10 §§4–7). Preserve workspace-owned external doors and one writer per setting.
- [ ] Draw Issues → Fix and return; Publish tray from **CMS/Assets/Brand/Site settings/Templates/Components**, including the Settings dirty-save variant; checks, stale approval, blocking protection/plan state, progress, cancel where supported, failure/retry and release history.
- [ ] Draw What will change → page Compare (including session-list interim state), the one 720px review-and-publish dialog and role-specific stale override, unknown start/lost polling/live-but-recording-failed results, queued-ADMIN-only cancellation, reload/sign-in resumption and republish vs unpublish. Unknown outcome checks the existing job before retry (P14 §§4–5).
- [ ] Draw designer-side Review and external client review at desktop/mobile: invite/link scope, unavailable/revoked/expired access, comments, approval and return. Annotate authz dependencies; a Figma simulation sends no invitations or approvals.
- [ ] Include snapshot/send failure and Send without preview, identity entry, approval consequence confirm **plus six-digit emailed code**, already-answered race, Client/Team/All and Team only/To client with draft guard, list-only older-round comments and exact Viewer/EDITOR restrictions. Map invitation, code and **token-free receipt** content specimens to the delivery handoff; send nothing (P17 §§4–6, OD-R7).
- [ ] Draw external-review tablet (768–1023) sheet, phone comments/approval sheets, keyboard crosshair and phone Desktop-view 1:1 pan → place/cancel → Fit; retain page-only-note interim fallback before R-2/security acceptance. Inspect 320/375, tablet and 1920-wide client-review variants; distinguish these from editor responsive controls (P17 §4, T-CR-03/06/07).
- [ ] Draw Export modal tabs/options/preparing/failure/offline/Free output semantics per T-EX-01–07; omit removed Soon tiles and do not add an export paywall to over-limit sites.
- [ ] Draw J-F4: issues → exact affected target → fix → return → checks → publish result; J-F5: create review → reviewer comment → locate/fix → resolve → approval, including a stale round. Annotate analytics events at their existing contract points without inventing product UI.
- [ ] Include P25's actual visible exception: **Account settings → Privacy → “Share product usage data with Buildrick”**, its specified help text and per-user scope. Draw on/off and save/load/refusal states as a bounded linked account surface, keeping product telemetry separate from published-site visitor analytics. Annotate the recorded legal/default and A-1/A-4/A-5 dependencies; do not decide legal consent policy or imply telemetry is implemented. No internal analytics dashboard is added.
- [ ] Prepare the three-non-designer client-review test from strategy §7 once S16 is drawn, and complete the core-loop test fixture prepared in B2. Coordinate actual testing with the user; report pending owner/date/evidence separately from heuristic review.

**Exit:** settings, draft, review, publish and export scopes are explicit; success/failure screens never imply these operations actually ran.

### B9 — Research-gated first run

**Inputs:** P16, strategy hypotheses and [R1 research plan](design-audit-2026-10-18/research/INTERVIEW-PLAN.md). **Output:** S21 onboarding and research evidence links.

- [ ] Locate completed evidence for the five approved interviews; the current research kit is a plan, not completed interviews. If evidence is absent, record this batch as blocked by R1 and continue independent batches.
- [ ] Reconcile findings with strategy before drawing first-run coaching, empty canvas and Getting-started achievement states. Existing-editor blank/error canvas behavior can be represented in B2/B3 without inventing this onboarding flow.
- [ ] Build short-height and dismissal/resume variants using the shared banner/toast pipeline; no pulse or competing notices.
- [ ] Map RailCoach/Add-tip/checklist arbitration, eligible-action counts including none available, silent seeded progress, Start blank per-page/per-user persistence and replay preserving completion history (P16 §§4–5). Do not confuse checklist progress with launch readiness.
- [ ] Conduct the approved five-user moderated **first-run** prototype test with the first first-run Figma pass, immediately alongside that conditional branch; preserve participant consent and recorded findings. The research plan explicitly distinguishes this from the core-loop and client-review tests. Scheduling, recruitment messages and actual testing require separate user coordination; do not fabricate them.

**Exit:** first-run design has its required research evidence, or remains explicitly excluded from completed design scope. A user decision changing R1 must be recorded before bypassing it.

### B10 — Integrated review and design handoff

**Inputs:** all completed batches and manifests; outstanding dependency/research records. **Output:** linked canonical Figma file, updated matrices and bounded design review report.

- [ ] Walk J-F1–J-F5 with normal, cancelled, interrupted and failed cases. Verify immediate-source return, preserved page/selection/breakpoint/scroll, and clear scope at every transition.
- [ ] Reconcile every FID/INV mapping and new requirement ID; no unexplained missing controls. Explicitly account for S30 compatibility and S31 deferral.
- [ ] Complete the **40-principle design review** and **23 consistency-row review** with source-to-component/frame evidence, applicability and actual results. Check repeated consumers (headers, menus, rows, guards, copy, status, motion and focus); do not copy old spec verdicts onto new Figma designs. Research-dependent principles remain unvalidated until their study evidence exists.
- [ ] Reconcile all affected source acceptance IDs (T-*, IC/II/BIC/PKG/ACC and owner decisions) to a frame, state, prototype step, design annotation, approved deferral or later runtime check. Screen presence and module counts alone cannot close coverage.
- [ ] Review geometry samples and component consumers after final shared changes; inspect screenshot and editable-node evidence. Recheck only affected evidence after fixes.
- [ ] Obtain independent read-only design-guard review of evidence, preservation, ownership, geometry, continuity, states and handoff. Fix blocking design findings and record re-review.
- [ ] Publish the **handoff record locally** with Figma links, component/variable mapping, implementation dependencies, research status and remaining prototype limitations. This does not publish a Figma library or deploy an application.

**Exit:** declared screen scope has no unresolved design-blocking defect; all exclusions/dependencies remain explicit. Use `DESIGN REVIEW PASSED` for Figma review, never SC-16 `VERIFIED`, which requires actual application evidence.

## 6. Screen completeness map

These are stable audit IDs, not a claim that every frame is already specified or drawn. Subscreens, dialogs and exceptional states remain required by their panel contracts.

| Screen ID | Surface | Batch / canonical input |
|---|---|---|
| S01 | Topbar/site menu/bell | B2 → B3; P01 |
| S02 | Left rail | B2 → B3; P02 |
| S03 | Add/quick-add | B2 → B3; P03 |
| S04 | Layers | B2 → B3; P04 |
| S05 | Canvas/toolbars/context menu | B2 → B3; P05 |
| S06 | Inspector/special contexts | B2 → B4; FD-INS/P06 |
| S07 | Forms build, settings, inbox, visitor outcomes | B4 build/outcomes; B8 inbox/settings; P06/P10 |
| S08 | CMS/records/schema/dynamic/data/binding | B5; P07/FD-DYN |
| S09 | Assets/pickers/image editor | B6; P08 |
| S10 | Brand | B6; P09 |
| S11 | Site settings | B8; P10 |
| S12 | Pages/bottom bar/status/page settings | B2 → B3; P11 |
| S13 | Right task host | B2 shell behavior; B7/B8 task contents; P12 |
| S14 | Publish/release history | B8; P14 |
| S15 | Designer Review task | B8; P12/P17 |
| S16 | External client review | B8; P17 |
| S17 | History/Activity/Compare/Time travel | B7; P12/IAF-18 |
| S18 | Issues | B8; P12/P14 |
| S19 | Components/package management | B6; P13 |
| S20 | Templates | B6; P15 |
| S21 | First run/Getting started | B9; P16/R1 |
| S22 | Command palette/shortcuts/Help | B3; P18 |
| S23 | Interactions | B4; P19 |
| S24 | Collaboration | B7; P21 |
| S25 | Global states | B1 primitives → B7 integration; P22 |
| S26 | Plans/trial | B7; P23 |
| S27 | Undo/Recently deleted | B3/B5/B6 owning lists → B7 cross-check; P24 |
| S28 | Preview | B2 → B3; SC-8/P01 |
| S29 | Export | B8; P01 §14 |
| S30 | Existing commerce block compatibility | B4 preservation-only; owner P1; no new commerce workflow |
| S31 | AI | Deferred by SC-21; check B3/B6/B7 for accidental active AI entry points; P20 |
| Linked surface X01 | Choose what stays active (dashboard Billing) | B7; P23 §5.5a; linked dependency of S26, not a new editor area |
| Linked surface X02 | Product telemetry opt-out (Account settings → Privacy) | B8; P25 §6.4/A-4; bounded account-control handoff, not an analytics dashboard |
| Non-visual remainder | Analytics event catalogue, reports and pipeline | B8/B10 annotations; P25; keep X02 visible-control exception separate |

## 7. Execution mechanics and acceptance evidence

Before Figma calls, load `figma:figma-use` and its required references; load `figma:figma-generate-design` for composed views and `figma:figma-create-new-file` before file creation. This is document-to-design work, not a capture of the current application's old visual layout. Discover suitable local components/resources before drawing replacements; use local components in an empty file and reuse them across views. No external library publication is necessary for this plan.

Build semantically editable text, vector icons, components and auto-layout containers. Screenshots are evidence, never flattened deliverable screens. For website content images, use explicit content assets supported by the current tools; image sourcing does not authorize copying whole UI screenshots into a frame.

Read destination state before a write; keep calls bounded to recoverable groups; await operations and return created/mutated IDs. Persist IDs per batch. On error, follow the tool's retry-safety signal and reread the affected canvas before retrying when required. Never recreate an entire batch because the response was uncertain. Keep user edits and unrelated file content intact.

**Batch manifest fields:** date, requirement/spec references, file/page/node IDs, variables/components used, affected FIDs, frames and state cases, prototype connections, inspected viewport samples, screenshots, reviewer findings, outstanding questions/dependencies and next resumable step.

**Every screen family needs a completed applicability matrix** for: normal, loading, empty, no results, error/retry, disabled/permission, offline, partial/conflict, long content, many items, success, locked/plan and cancellation/return. Reference an existing shared component/state when sufficient; mark N/A with a reason, not a blank cell. Per-control contracts additionally cover validation, draft/commit/cancel, undo and consequences.

**Design acceptance:** legible hierarchy; no clipped required controls; specified scroll/sticky regions; target remains visible; correct ownership/entry/return; source-mapped controls and variants; keyboard/focus intent and non-drag paths; meaningful shared/destructive feedback; all screen UI remains editable.

**Prototype limits:** Figma can demonstrate destinations and selected state transitions. Native keyboard handling, browser zoom, screen-reader output, network timing, autosave receipts, undo semantics, server permissions, persistence, generated website output and performance require later application validation. Annotate unsimulated behavior rather than creating a false success path.

## 8. Decisions, dependencies and approval checkpoints

| Item | Handling |
|---|---|
| Execute this plan / create destination | Pending user review; no Figma writes in the current planning task |
| Proposed new file vs user-provided existing file | New isolated file is the recommendation; a user-specified destination replaces it without rewriting the product plan |
| Account/library/font access | B0/B1 checks; account login alone proves none of these |
| Source properties, fetched API Sources and collection feeding | Scope unresolved in P07 §10.1; finish approved JSON/Conditions design and raise these only before extending it |
| Form-field type conversion | P06 §7 leaves its INS-D05 confirm unclassified in SC-15; resolve before finalizing this B4 interaction, while independent controls continue |
| Permissions stale-status reconciliation — T1-29 | P10 §6 already specifies the **480px read-only Permissions dialog**, ST-06 role rows, “You”, loading/unknown-access states and Manage members in Organization workspace link. B3/B8 use that contract and reconcile P18 §14's stale open footer. Do not reopen the role decision or invent an executable Delete-site action inside this informational dialog; site deletion stays with the existing canonical action |
| Review animations — D3-22 | P17 §14 and P19 §14 leave `/review` interaction runtime vs “Animations don't play in review” undecided. Resolve for B4/B8; do not assume the script-free review sandbox can play authored interactions |
| Notification/recovery routing — T1-07, T1-13, T1-24, T5-16 | P22 §14: review-closed toast exception vs bell; bell View all vs Load more; Project update failed severity; dashboard RecoveryBanner mounting. Reconcile B3/B7/B8. T5-16 first needs source investigation, not an invented product decision |
| Canvas/shortcut details — T2-22, T2-32, T5-21, T1-11, T3-19 | P05/P18 footer gaps: selection-caption placement, ruler-guide gestures, snap-grid existence, explicit Inspector hide/show route, Saves filters and Session j/k/g/G keys. B0/B3/B7 verify current contracts/source before design. Q5 already settles focus mode; Q7 already settles CMS-bind landing and must not be reopened |
| Remaining Inspector/sample details — F-EN-A1.2, T3-20, T3-26 | P06 type refinement on load/paste; P03 inserted-site social-icon choice; P13 light-on-dark component thumbnail fallback. Inspect and specify within B3/B4/B6, keeping website content assets distinct from Lucide chrome icons |
| Sources dependency wording conflict | SC-9 says “per-collection link”, while P07 §10.1 and FD-DYN §7.1 limit current Sources to pasted JSON consumed by Conditions. Keep the conflict visible and request a specific scope decision only if extending into collection feeding; no blanket precedence shortcut expands Q12 |
| First-run research | R1 applies specifically to first-run Figma; five interviews before it, five-user first-run test with its first Figma pass; no evidence found in inspected kit. B9 runs as soon as these dependencies allow |
| Additional strategy research | Five-user core-loop test after relevant shell/task flows; three non-designer review tests after S16. Owner/date unassigned in source; planned here, not conducted |
| SC-9 release blockers | Map each to its screen/guard/interim state; they block shipping the affected behavior, not all visual design |
| Historical audit statuses and remaining annex-only coverage | Reconcile per batch, with evidence; do not bulk mark closed |

Checkpoints: (1) user reviews this plan before execution; (2) integrated B2 journey is presented for visual feedback before mass expansion; (3) B10 handoff states exactly what is design-reviewed and what still needs research/engineering. Routine component fixes and later batches proceed within approved scope; do not request approval for every ordinary layout choice. A consequential new conflict pauses only its dependent work.

**Negative-scope acceptance:** historical maps must not revive AI entry points, Beginner mode, Classes selector, new variant authoring, multi-reference fields/“contains any of”, per-record CMS history, scheduled publish, Vue/Next Soon tiles, commerce authoring, visitor login/members or a chrome dark theme. Preserve compatible existing data and approved read-only/editable subsets. Brand website dark values and non-AI From logo or URL remain included; do not hide them because similarly named future work is deferred.

## 9. Planning verification record

**Targeted Canvas-gap review, 2026-10-19:** existing creation/template contracts were located and reused, not rewritten. P05 §5.1 resolves T5-21's source question and supplies T2-32's missing written interactions; the two original audit rows were updated. Four-file document checks passed (new local links/anchors, whitespace and unique audit IDs). Independent read-only review found no remaining blocking contradiction after clarifying axes, dismissal, concurrent writes, recovery limits and legacy-value preservation. G1/G2/G3/G5/G7/G9 pass for this written proposal; G4/G6/G8 NOT RUN. T2-22/T1-11 and visual/runtime work remain open. No new screen, application change or whole-batch completion is claimed.

### B3.1 detailed-contract review — 2026-10-19

- Delivered SC-24.1–3, P11 §7.1–7.4, existing feature/state matrix amendments and matching brief/plan checkpoint. User authorization covers this documentation slice. No application or Figma changes.
- Rechecked current source in the shared tab guard/dirty registry, direct page-switch handlers and Page settings drawer/warning/save model. Failed-discard continuation, direct Cancel discard and missing receipt semantics in the inspected registry are source observations; no runtime defect reproduction or repair is claimed.
- Document checks passed for all six changed files: added local links and heading anchors resolve; no added trailing whitespace; twelve unique PG-G acceptance rows; all seven mapped FIDs already exist in the historical register. Source/field/role/ownership preservation was checked within the mapped slice.
- Independent read-only `design_guard_reviewer` inspected the six-file increment and cited source. Two introduced ambiguities were corrected and re-read: separate valid manager/Inspector fixtures in PG-G05; retained navigation intention and explicit temporary footer after validation failure. No remaining blocking contradiction or unsupported claim was found in the bounded written slice.
- **G1/G2/G3/G5/G7/G9 PASS for the written B3.1 scope. G4/G6/G8 NOT RUN.** Grouping/hierarchy and label/status requirements pass document review; actual geometry, visual clarity, interaction/accessibility, persistence/permissions/output and user testing remain unverified. Overall design readiness remains **PROPOSAL**; written detail delivered does not mean full B3.1 visual acceptance or B3 completion.
- Next documentation packet: **B3.2 — create a page and return**, using P11 §6, P15, P23 and SC-15. B3.1's visual/runtime validation stays tracked separately.


### Documentation continuation review — 2026-10-19

Scope: the current checkpoint, B3.1–6 sequence, PG-G01–12 acceptance matrix and matching brief checkpoint. Earlier reviews below retain their original scope/date.

- Checked the twelve case definitions against SC-24, P11 and IA-05/07; inspected the three source files named in B3.1. The direct Cancel discard and direct page-tab switch are source observations, not runtime reproductions.
- Automated document checks passed: PG-G01–12 are unique and sequential, all six packets are present, newly added local links resolve and added lines contain no trailing whitespace. Reviewed the addition against saved before-copies; only the plan and brief were edited in this task.
- Independent read-only `design_guard_reviewer` compared this increment with the before-copies, owning contracts and cited source. No blocking contradiction, unsupported claim or lost capability was found in the mapped set. **G1/G2/G3/G5/G7/G9 PASS for this bounded written planning increment; G4/G6/G8 NOT RUN.** Grouping/hierarchy and labels/status scope pass as written requirements only. Readiness remains **PROPOSAL** for the planned design work; this does not close B3 or validate its historical scenes.
- Geometry, visual grouping, rendered labels/status, interaction/accessibility, Figma playback, application persistence/permissions/output and user testing: **NOT RUN**. Their acceptance requirements are written; existing scene results were not revalidated.

### Historical planning review — 2026-10-18

The object of this review is the execution plan, not a finished UI. Planned scope includes shared systems and requires the project's independent design-guard review.

- Initial self-review completed: authority precedence, all S01–S31 dispositions, B0–B10 dependencies, source paths, research and implementation boundaries, and no duplicated product authority. Initial document checks passed for the original draft; the deeper source-coverage review below supersedes its coverage assessment.
- Independent read-only review completed on 2026-10-18 by `design_guard_reviewer`. Two P2 findings were corrected: B9 now runs as a conditional branch with its first-run test; separate core-loop and client-review research checkpoints are included. The reviewer reread the corrections and confirmed both resolved, with no remaining blocking finding in the inspected plan. It also accepted the scoped form-conversion and feature-flag dependencies.
- Gate result: G1–G7/G9 pass **for written planning coverage only**. G4/G6 here mean the plan specifies geometry/interaction validation, not that any proposed Figma screen has passed it. Final status remains **execution proposal for user review**.
- Figma visual/interaction validation: NOT RUN; scheduled in B1–B10.
- Application/runtime/accessibility/persistence/output tests: NOT RUN; outside this planning task.

### Subsequent original-document coverage investigation

The user's no-code/Figma-plan-only request triggered the [source-coverage review](evidence/figma-plan-coverage-review-2026-10-18.md). It records 18 grouped planning corrections, full team reads of all 27 canonical panel/strategy files, bounded annex coverage, explicit remaining questions and the two additional linked account/dashboard surfaces. S01–S31 and B0–B10 remain stable. This is a stronger execution checklist, not a claim of exhaustive row-level design completion or approval to execute.
