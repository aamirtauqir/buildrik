# Buildrick audit execution plan

Date: 2026-09-25. Baseline commit: `69a88e0b145dc4e52ff0fdf3578391b448c514ac` plus the existing working tree.

Source: `Buildrick_Complete_Codebase_Audit_Multi_Agent_Playbook (1).md`, supplied from Downloads. This plan operationalizes its 21 audits and five phases; it does not replace their requirements.

## Execution contract

- Start with whole-repository discovery, then inspect actual source relationships. A filename inventory is not proof that every implementation was reviewed.
- Run one audit category at a time. Specialists may partition the same category into independent repository areas; the orchestrator reconciles their evidence before the next category starts.
- Audit passes are read-only for production code. Reports and inventory artifacts are permitted.
- Complete all audits in a phase before consolidating its fix batch. Section 29 of the supplied playbook says: “Then wait for approval before modifying code.” Present the concrete batch, dependencies, test plan, and product decisions at that gate.
- Flag an observed critical security/data-loss/crash issue immediately as `P0 — IMMEDIATE FIX REQUIRED`; preserve evidence and isolate the affected operation. Do not turn an unverified suspicion into a confirmed vulnerability.
- Preserve pre-existing staged media changes, workspace configuration changes, and untracked audit assets. Do not commit, stage, deploy, or publish as part of an audit.
- Keep each production fix to one root cause and a small coherent set of files. New features and speculative redesigns are outside remediation scope.
- Record static verification and runtime verification separately. Unit/jsdom tests do not establish authenticated browser, persistence, or multi-user correctness.

## Team and scheduling

Four concurrent slots are available: lead plus at most three specialists. Roles B–G rotate through those slots; seven simultaneously running agents are unnecessary.

| Role | Responsibility | First assignment |
| --- | --- | --- |
| A: lead/orchestrator | Inventory snapshot, evidence checks, deduplication, phase gates, plan and fix order | Plan, manifest, IA consolidation, targeted test baseline |
| B: product architecture | IA, module cohesion, navigation, surfaces, search | Audit 1 editor module ownership |
| C: interaction/UX | Interaction architecture, affordances, disclosure, visual system, states, accessibility | Join at audit 6, then phase 2 |
| D: collaboration | Product ownership, transport, presence, conflict/persistence/undo boundaries | Audit 1 collaboration ownership evidence only |
| E: engineering | Workspace, backend/frontend/state boundaries, performance | Initial repository inventory; deeper audit at phase 4 |
| F: security | Auth, permissions, uploads, sessions, realtime boundaries | Join phase 4 audit 19; triage an immediate critical finding if one arises sooner |
| G: verification | Runtime scenarios, integration, regression, test quality, release evidence | Rotate into each approved fix verification and phase 3 |

No two agents edit the same file. Audit agents provide exact source locations and coverage gaps. An implementer does not solely certify their own fix: another agent reviews the patch and evidence.

## Stage A: inventory and evidence foundation

Dependencies: none. Owner: A with B/D/E for independent inventory areas.

Tasks:

1. Snapshot repository root, commit, dirty state, package manifests, configs, API mounts, database schemas/migrations, CI/deployment files, test runners, and applicable repository instructions.
2. Map production `/edit/[siteId]` and standalone demo entry points separately; trace shell → handler/state → engine/service → server → persistence.
3. Inventory every major subtree and identify uninspected areas explicitly. Record feature flags, permissions, environment requirements by name, without recording secret values.
4. Establish existing ownership-test results without modifying application code.

Artifacts: `repository-files.txt`, `INVENTORY.md`, `VERIFICATION.md`, audit-1 specialist reports.

Acceptance: all major repo areas have an owner and discovery status; active entry chains have source evidence; existing working changes are recorded; limitations and baseline failures remain visible.

Verification: reproduce file discovery; check referenced file/symbol existence; run focused existing panel/routing tests. The manifest includes non-ignored files, including untracked files; dependency/build/cache directories are excluded. It is not a full content review.

## Phase 1: product structure and ownership

Dependency: Stage A inventory available. Lead specialist: B; C joins audit 6 and D leads audit 7.

| Order | Audit | Concrete work and acceptance |
| --- | --- | --- |
| 1 | Information architecture | Map Add, Layers, Pages, Assets/Media, CMS, Components, Brand, Inspector, AI, Review, Issues, History, Activity, Publish, Notifications, Settings, Templates, commands, collaboration to element/page/site/workspace scope and left/right/global/dedicated/temporary surfaces. Trace actual owners and distinguish product decisions from defects. |
| 2 | Module cohesion and relevance | For each module document primary job, owned/excluded responsibilities, questionable features, and a functional ownership map. Compare intent/scope/handler/outcome before declaring duplication. |
| 3 | Navigation and discoverability | Trace primary and secondary entries, routes/actions, conceptual parent, Back/Close, deep links, and return context. Identify unreachable or misleading destinations with evidence. |
| 4 | Surface orchestration | Record trigger → state → mounted surface → replacement/coexistence → canvas access → close/restore. Cover dedicated media/settings and all drawers/modals/pickers. |
| 5 | Search architecture | Inventory global/module/collection/contextual search, datasets, state, backend/local execution, filters, and scope copy. Separate real duplicate engines from useful scoped entry points. |
| 6 | Interaction architecture | Trace clicks, keyboard, selection, drag/drop, destructive actions, undo, async actions, and collaboration controls to actual mutations and resulting UI. |
| 7 | Collaboration product architecture | Map synchronous editing versus asynchronous review, presence, comments, mentions, sharing, invites, roles, activity, versions, autosave, undo, publishing, and offline ownership. |

Tasks after all seven audits:

1. Consolidate findings by root cause and dependency; remove duplicates and re-check claims invalidated by another trace.
2. Write Fix Batch A with fix IDs, affected findings/files/modules, priority, risk, implementation strategy, required tests, and product decisions.
3. At the playbook approval gate, obtain approval of the concrete batch before production edits.
4. Execute approved P0 → P1 → P2 fixes in small slices, with independent review and targeted regression after each slice.

Verification: panel/routing and command tests; browser entry/return/close behavior; media → library → editor, Pages → CMS → return, selected AI → Inspector, review/activity/publish ownership. Use production-host wiring as well as the demo when auth/API behavior matters.

Exit criteria: all seven audits reconciled, approved fixes reviewed/tested/runtime exercised, open product decisions recorded, no unlabelled ownership or runtime gaps. A static-only fix stays `FIX APPLIED — NOT RUNTIME VERIFIED`.

## Phase 2: UX clarity and design system

Dependency: Phase 1 ownership decisions and fix regression accepted. Lead: C; E inventories shared primitive usage within each current category.

| Order | Audit | Concrete work and acceptance |
| --- | --- | --- |
| 8 | Signifiers and affordances | Match icons/badges/counts/status indicators to real actions and states; distinguish status from controls. |
| 9 | Cognitive load and disclosure | Classify controls as always visible/contextual/secondary/advanced; use the agreed product owners from phase 1. |
| 10 | Typography, spacing, layout | Inspect actual CSS/tokens and rendered dimensions across equivalent surfaces; record intentional exceptions. |
| 11 | Design system consistency | Map existing chrome-ui primitives and duplicate compositions, variants and API differences. |
| 12 | States, feedback, errors | Cover loading/empty/saving/retry/permission/offline/conflict/reconnect/partial-failure states, including draft retention. |
| 13 | Accessibility and usability | Exercise keyboard, focus, dialogs, labels, status announcements, contrast and presence/comment accessibility. |

Remediation: consolidate Fix Batch B, approve it, then fix shared primitives before their consumers where that addresses a verified shared root cause. Follow generated `--bk-*` tokens and the canonical chrome-ui surface. UI changes must follow applicable design-reference instructions; do not regenerate tokens or edit designs speculatively.

Verification: relevant component/accessibility tests, keyboard/browser passes, affected visual comparisons, and existing design-system gates for changed code. Include light theme, empty/error/disabled states, reduced motion, and modal focus restoration.

Exit criteria: reviewed approved batch, no critical accessibility blocker, consistent audited controls and states, recorded visual/runtime evidence. A probe-only pass is not visual verification.

## Phase 3: functional reality

Dependency: phases 1–2 fixes/regression accepted. Lead: G; D supplies realtime cases and B checks product return paths.

| Order | Audit | Concrete work and acceptance |
| --- | --- | --- |
| 14 | Functional wiring | Trace exposed routes/buttons/events/handlers/stores/APIs/backend; label implemented/partial/stub/dead/unreachable separately from runtime status. |
| 15 | End-to-end cross-module flows | Execute all 24 journeys in the playbook, capturing success, failure, cancellation, return context, state, API and persistence. |
| 16 | Collaboration runtime/conflicts | Identify actual protocol; use two independent authenticated users to exercise ordering, deduplication, simultaneous edit/delete, offline/reconnect, role revocation, undo, restore and publish. |

Remediation: consolidate Fix Batch C from verified functional blockers; approve and fix root causes; repeat affected E2E cases and adjacent flows. Do not enable demo-only collaboration as a substitute for proving its release suitability.

Verification requirements: production-equivalent local dashboard/API/database plus editor, disposable test accounts/sites, two isolated sessions, controllable network interruption, persisted state readback, and captured logs/traces. When a prerequisite is unavailable, report the exact unexecuted cases as `NOT RUNTIME VERIFIED`.

Exit criteria: all 24 journeys have explicit outcomes; critical functional failures and collaboration data-integrity cases have reviewable evidence and verified approved fixes. Mocks alone cannot pass this phase.

## Phase 4: engineering quality

Dependency: product/UX/functional boundaries stabilized. Lead roles rotate E → F → G by category; D assists only the relevant realtime scope.

| Order | Audit | Concrete work and acceptance |
| --- | --- | --- |
| 17 | Architecture/maintainability | Inspect frontend/backend/state/API boundaries, duplicated logic/state, imports, dead implementations and responsibility concentration. |
| 18 | Performance | Measure representative editor datasets, rendering/search/tree/grid work, bundles/network and realtime subscriptions/payloads; distinguish measured issues from profiling candidates. |
| 19 | Security/permissions | Trace server-enforced auth/role/site/workspace checks, publication/deletion/uploads/AI/realtime/mentions/invites, validation, rate limits and revocation. UI guards are not server authorization. |
| 20 | Test coverage/quality | Map unit/component/integration/E2E tests to real critical flows, failure paths, permission boundaries and concurrency; identify over-mocking and source-text-only assertions. |

Remediation: consolidate and approve Fix Batch D. Order: security/data integrity → architecture blockers → measured performance → meaningful test gaps. Freeze contracts before assigning parallel patches.

Verification: targeted exploit/regression cases on disposable local fixtures, static/type/design checks appropriate to changed files, before/after performance measurements, then the full applicable editor/dashboard/server test suites and production build. Never run migrations/deployments against a real environment as an audit shortcut.

Exit criteria: verified high-risk fixes; reproducible measurements for performance claims; critical behavior has meaningful tests; unrelated baseline failures remain distinguished from regressions.

## Phase 5: final verification

Dependency: all previous audits and approved fixes completed. Lead: G; A reconciles independent domain sign-offs.

Audit 21 is read-only. Re-check the 20 prior categories as `PASS`, `PARTIAL`, `FAIL`, or `NOT VERIFIED`; introduce no speculative enhancements.

Acceptance: no P0, critical dead end, misleading exposed feature, broken return path, major ownership violation, silent critical failure, collaboration data-loss risk, unauthorized realtime access, critical accessibility blocker, or known authorization bypass. Critical product and collaboration journeys work and have tests.

Deliverable: release matrix, verification evidence, and `READY FOR RELEASE / IMPLEMENTATION FREEZE` or `NOT READY`. Distinguish verified remaining blockers from missing verification; an unexecuted critical gate cannot be called passed. No deploy or publication is included.

## Finding and fix records

Each finding records: ID/category; finding; P0/P1/P2/P3; exact file and symbol; source/runtime evidence; expected behavior; confirmed or unknown root cause; affected modules; dependencies; recommendation; `VERIFIED`/`PARTIAL`/`NOT VERIFIED`/`PRODUCT DECISION REQUIRED`; separate runtime status.

Each fix records: fix ID; root cause; affected finding IDs; files/modules; dependency order; risk; approved strategy; required unit/integration/E2E/failure/return/regression cases; review result; actual commands/results; runtime evidence; final status.

Final fix statuses are only `FIXED + VERIFIED`, `FIX APPLIED — NOT RUNTIME VERIFIED`, `BLOCKED`, or `FAILED REGRESSION`. Editing code or passing a mocked test alone does not mean fixed.

## Current checkpoint

Inventory and all seven Phase 1 audits have documented reports. The lead reconciled the finding ledger and prepared proposed `FIX-BATCH-A.md`; its approval gate remains. No production remediation is in progress. Later phases and release assessment remain pending. Progress and coverage limits are maintained in `README.md`; this is not a release completion claim.
