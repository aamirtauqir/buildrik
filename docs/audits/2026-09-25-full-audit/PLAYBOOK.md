# Buildrick Complete Codebase Audit — Playbook (as supplied 2026-09-25)

Source: the founder's "Complete Codebase Audit & Multi-Agent Execution Playbook".
This run executes the READ-ONLY audits (Prompts 1–21) and the Fix-Batch *plan*
(Prompt 29). **No fixes are executed in this run** (Prompt 30 is out of scope,
by explicit instruction).

## Global rules (every agent)

1. **One concern at a time.** IA is not typography; navigation is not performance; collaboration is not just presence UI.
2. **Read-only.** Do not modify production code. Record file path, symbol, evidence, severity, root cause, affected modules, dependencies, runtime-verification status.
3. **Comments, tickets, docs and TODOs are not proof.** Proof = code, imports, state mutations, handlers, routes, APIs, backend, DB, tests, runtime.
4. **Do not assume folder ownership.** Trace UI → component → handler → hook → store → service/API → backend → persistence → response → rendered state.
5. **Evidence format** for every important finding:
   **Finding** · **Severity** P0/P1/P2/P3 · **File** · **Symbol** · **Evidence** · **Expected behavior** · **Root cause** · **Affected modules** · **Recommendation** · **Status** VERIFIED / PARTIAL / NOT VERIFIED / PRODUCT DECISION REQUIRED
6. **Runtime truth beats static assumptions.** Run tests / the app where possible. Otherwise write `NOT RUNTIME VERIFIED`.
7. **Immediate-fix exception:** security vulnerability, permission bypass, data loss/corruption, destructive action on wrong object, production crash, secret exposure, unsafe upload, unauthorized publish/delete → flag `P0 — IMMEDIATE FIX REQUIRED` (still do not fix in this run).
8. **Collaboration principle:** identity + presence + permissions + realtime sync + conflict handling + persistence + reconnect + offline + undo semantics + history + activity + comments/review + safe publishing. Auditing only visible collab UI is incomplete.

## Whole-codebase inspection scope

Repository/workspace (packages, configs, scripts, CI, deploy), app entry & shell
(routes, guards, editor shell, rail, topbar, inspector, menus, command palette,
registries, feature flags), all product modules (Add, Layers, Pages, Assets/Media
Quick, Full Media, CMS, Components, Brand, Inspector, Selected-element AI, AI
generation, Review, Issues, History/Versioning, Activity, Publish, Notifications,
Settings, Templates, Search, Commands, Collaboration, Presence, Comments,
Mentions, Invitations, Sharing, Roles, Autosave, Undo/redo), UI architecture,
state architecture, API/backend (tRPC, services, workers, cron, webhooks,
realtime), data (Prisma), auth/authz, AI, collaboration/realtime, quality & risk
(tests, telemetry, sanitization, rate limits, uploads, headers, deps, dead code,
stubs).

## Relationship map questions

True entry points · ownership · imports · shared/mutated state · shared APIs ·
duplicated business logic/state · multiple sources of truth · coupling ·
cross-boundary features · hidden-only features · control→handler→service
mapping · competing implementations and which is active · code with no UI ·
UI pointing at stubs · unreachable routes · obsolete-but-shipped code.

---

## Prompt 1 — Information Architecture & Product Ownership
Audit ONLY product IA. Buckets: LEFT (Build/Navigate/Organize/Resources), RIGHT
(Inspect/Configure/Review/Validate), GLOBAL (project/site/workspace), DEDICATED
WORKSPACE (complex management), TEMPORARY (modal/popover/menu/picker).
Modules: Add, Layers, Pages, Assets, Full Media, CMS, Components, Brand,
Inspector, Selected-element AI, AI Generation, Review, Issues, History, Activity,
Publish, Notifications, Settings, Templates, Command Palette, Collaboration.
Verify ownership: Pages vs CMS; Add vs Components; Media Quick vs Full Media;
Brand vs Site Settings; Inspector Settings vs Site Settings; Selected AI vs
Generate-with-AI; Collaboration vs Review; Collaboration vs Activity; element vs
page vs site vs workspace scope.
Find: wrong ownership, scope leakage, misplacement, conflicting ownership,
duplicate sources of truth, boundary violations.
Per finding: Finding · Expected owner · Current owner · File · Symbol · Code
evidence · Recommendation · Priority · KEEP / CHANGE / PRODUCT DECISION REQUIRED.

## Prompt 2 — Module Cohesion, Feature Relevance & Functional Ownership
Per module (Add, Layers, Pages, Assets, CMS, Components, Brand, Inspector, AI,
Review, Issues, History, Activity, Publish, Settings, Templates, Media,
Collaboration): primary job; owned responsibilities; responsibilities it should
NOT own; supporting features; irrelevant/weak features.
Find: low cohesion, feature-module misfit, contextual irrelevance, misplacement,
boundary violations, scope leakage, responsibility ambiguity, bloat, noise,
duplicate entry points, redundant actions, cross-surface duplication, choice
overload. A duplicate is not "same icon twice" — compare intent, scope, trigger,
destination, underlying handler, state mutation, outcome, user context.
Inspect AI carefully (selected-element, global, block gen, page gen, media AI)
and Collaboration carefully (presence, comments, review, mentions, activity,
sharing, permissions, live editing) — decide shell / Review / Activity /
Comments / Topbar / Workspace settings / dedicated surface.
Per module: Module · Primary Job · Owned Responsibilities · Current Features ·
Relevant · Questionable · Misplaced · Duplicate Entry Points · Correct Owner ·
Keep/Move/Remove/Merge · proof · Priority.
End with a FUNCTIONAL OWNERSHIP MAP: Feature · Correct Owner · Primary Entry ·
Valid Secondary Entry · Duplicate to Remove?

## Prompt 3 — Navigation & Discoverability
Inspect router, editor rail, topbar, menus, command palette, breadcrumbs, tabs,
back, close, context menus, deep links, collaboration/comments/review/share/
invite entries. Can users find every major feature; one clear primary entry;
useful secondary shortcuts; hidden important actions; duplicate entries causing
choice overload; obvious current location; Back → conceptual parent; Close
dismisses rather than navigates; collab controls discoverable but not everywhere.
Per feature: Primary Entry · Secondary Entry · Route/action · Destination ·
Parent hierarchy · Back hierarchy · Discoverability issue · Duplicate entry issue
· proof · Priority · KEEP/CHANGE.

## Prompt 4 — Surface Architecture & Panel Orchestration
Classify: persistent panel, left drawer, right drawer, dedicated workspace,
full-screen, modal, popover, dropdown, inline, toast/banner.
Trace: trigger → state/action → rendered surface → what is replaced → what stays
mounted → canvas visible → canvas interactive → close → restore context.
Inspect Media Quick vs Full Media, CMS, Components, Brand import/export,
Selected AI, Review, Issues, History, Activity, Publish, Settings, Templates,
Collaboration, Comments, Presence, Sharing, Invite, pickers, destructive
confirmations.
Find: wrong surface, panel collision, competing drawers, multiple overlay states,
complex management in a small panel, simple action unnecessarily full-screen,
modal used for navigation, wrong close semantics, wrong restoration, collab UI
blocking editor, collab UI hidden when needed.
Output: Feature · Trigger · State/store · Surface · Replaces · Can coexist? ·
Canvas visible? · Canvas interactive? · Close · Restore · Issue · proof · Priority.

## Prompt 5 — Search Architecture
Find every search implementation; classify Global / Module / Collection /
Contextual. Inspect command palette, Add, Layers, Pages, Media Quick, Full Media,
CMS, CMS records, Components, Templates, History, Settings, Activity, Review,
Issues, Brand, Inspector, collaboration users/comments.
For each: dataset · scope · state location · local/server · necessity ·
placeholder/scope clarity · duplicate implementation · filter/sort relationship.
Global search = navigation + actions + jump-to; local = find item in current dataset.
Output: Search · File/component · Scope · Dataset · Needed? · Duplicate? ·
Correct owner · Recommendation · Priority.

## Prompt 6 — Interaction Architecture
Trace UI control → handler → state mutation → API/store → resulting UI for
clicks, keyboard, menus, tabs, toggles, selection, drag/drop, dependent
controls, destructive actions, undo/redo, async actions, collaboration actions.
Find: conflicting handlers, nested click conflicts, double navigation, controls
enabled incorrectly, missing dependencies, unexpected mutations, wrong
destructive behavior, wrong undo scope, remote/local interaction errors, collab
action without feedback, remote update overwriting local state.
Output: Interaction · Source · Handler · Actual · Expected · State/API · Issue · Priority.

## Prompt 7 — Collaboration Product Architecture
Map every collaboration implementation: live multi-user editing, presence,
avatars, selection/cursor presence, comments, threads, mentions, review,
sharing, invitations, roles, permissions, activity, version history, autosave,
undo/redo, publishing, offline/reconnect, conflict resolution.
Answer: what "collaboration" means in Buildrick; which functions are live vs
async/review; which module and which UI owns presence, comments, invitations,
permissions, activity history, review/approval.
Find: collab features duplicated across modules, presence in wrong surfaces,
Comments vs Review ambiguity, Activity vs collab-history overlap, Sharing vs
permissions overlap, workspace vs site collaboration ambiguity, unclear role
boundaries, bloat in Inspector/topbar, collab controls exposed when irrelevant.
Create COLLABORATION OWNERSHIP MAP: Capability · Scope · Owner · Primary Entry ·
Secondary Entry · State Source · Backend Source · Permission Boundary.

## Prompt 8 — Signifiers & Affordances
Icons, badges, status dots, counts, chevrons, arrows, ellipsis, close, expand,
chips, presence indicators, avatars, comment/sync/connection indicators.
Find: poor signifier, weak/false affordance, low information scent, redundant
indicator, visual noise, ambiguous meaning, clickable-looking non-action, action
styled as status.
Output: Control · File/component · Visual meaning · Actual function · Expected
meaning · Issue · Priority.

## Prompt 9 — Cognitive Load & Progressive Disclosure
Canvas toolbar, Inspector, left modules, topbar, collab controls, presence,
comments, Media, CMS, Components, Brand, Pages, Publish, Review, Issues, Settings.
Find: too many always-visible controls, secondary shown as primary, duplicate AI,
duplicate collab entries, overloaded toolbar/Inspector, bloat, poor grouping,
advanced features shown too early.
Classify: Always Visible / Contextual / Secondary / Advanced / More Menu /
Popover / Dedicated Workspace / Remove.
Output: Feature/control · File · Current exposure · Frequency · Context
relevance · Recommended disclosure · Priority.

## Prompt 10 — Typography, Spacing & Layout Consistency
Inspect actual CSS/Tailwind/tokens: font, weight, size, line-height, spacing,
padding, gaps, button sizes, fields, panel & drawer widths, headers, footers,
modals, alignment, collab badges/avatars/presence. Check against DESIGN.md.
Find: hardcoded drift, one-off classes, magic numbers, equivalent UI with
different sizing, random width differences, inconsistent hierarchy.
Output: Pattern · Files · Current variants · Expected standard · Intentional? ·
Issue · Priority.

## Prompt 11 — Design System & Component Consistency
Buttons, inputs, search, panel headers, drawers, modal shells, popovers, tabs,
chips, badges, rows, empty/error states, toolbars, rail items, inspector
sections, presence avatars, comment components, collab indicators.
Find: manually duplicated UI, copy-paste components, missing primitives, variant
explosion, inconsistent APIs, raw HTML bypassing primitives, collab UI using
incompatible patterns.
Output: Pattern · Existing components · Duplicate implementations · Files ·
Recommended shared component · Required variants · Priority.

## Prompt 12 — States, Feedback & Error Handling
States: default, loading, empty, no results, saving, uploading, success, error,
retry, permission, disabled, unsaved, offline, conflict, partial failure,
connecting/connected/disconnected/reconnecting, syncing/synced.
Modules: Add, Layers, Pages, Media, CMS, Components, Brand, AI, Review, Issues,
History, Activity, Publish, Settings, Templates, Collaboration. Collab: connection
lost, reconnect, remote edit conflict, permission revoked, user removed, doc
deleted, sync failure, comment send failure, invite failure, stale presence,
offline edits, resync.
Find: silent errors, console-only failures, missing retry, lost drafts, stale
state, silent AI failure, silent realtime disconnect, remote edits overwriting
local changes.
Output: Module/action · File/function · Required states · Implemented ·
Missing · Failure behavior · Data safety · Priority.

## Prompt 13 — Accessibility & Usability
Semantic buttons, links, labels, keyboard, focus, tab order, Esc, ARIA, dialogs,
menus, tooltips, contrast, disabled states, target sizes, icon-only controls,
avatars, presence indicators, comment controls. Can SR users know who is present?
Are presence colors the only indicator? Are comments keyboard accessible? Can
invite/member controls be used without a mouse?
Output: Issue · File · Evidence · Impact · Recommendation · Priority.

## Prompt 14 — Functional Wiring & Application Integrity
Trace routes, buttons, handlers, stores, hooks, APIs, backend, feature flags,
realtime handlers. Find: dead buttons, unreachable components, orphan screens,
duplicate handlers, placeholder functions, TODO/stub behavior, broken routes,
wrong return paths, UI exposed without implementation, implementation with no UI
entry, stale feature flags, collab controls wired to no-ops, realtime events
handled but never emitted / emitted but never consumed.
Status: IMPLEMENTED / PARTIAL / STUB / DEAD / UNREACHABLE / NOT RUNTIME VERIFIED.
Output: Source · File/symbol · Handler · Destination · Reachability · Return
path · Status · Priority.

## Prompt 15 — End-to-End Cross-Module Flows
Run app/tests where possible. Flows: (1) Add element→select→edit→publish
(2) Layers→Inspector→AI→return (3) Pages→dynamic page→CMS records→edit→return
(4) Media Quick→Full Media→asset edit→return (5) Component→manage master→insert
instance (6) Brand→advanced→import/export (7) Review→comment→resolve
(8) Issues→fix (9) History→restore (10) Publish→checks→success/failure
(11) Settings→save→editor (12) Templates→preview→create/replace
(13) Commands→destination→return. Collab: (14) invite→accept→open site
(15) two users same page (16) A edits while B present (17) simultaneous edits
same element (18) comment→mention→reply→resolve (19) permission changed while
online (20) collaborator removed while connected (21) connection lost→offline
change→reconnect (22) publish while another user edits (23) undo after remote
edit (24) restore history while collaborators present.
Trace UI, route, state, API, backend, realtime events, success, failure, cancel,
return, context restoration.
Output: Flow · Files/functions · State changes · API/events · Success · Failure
· Return · Issue · Runtime verified? · Priority.

## Prompt 16 — Collaboration Runtime, Sync & Conflict
Identify actual collab tech (WebSocket/SSE/CRDT/OT/Yjs/Automerge/Liveblocks/
custom) — do not assume. Trace connection init, auth, room join, presence
publish/cleanup, local op generation, remote receipt, ordering, dedup, conflict
handling, persistence, reconnect, resync, offline queue, version reconciliation.
Cases: concurrent text edits, element moves, delete-vs-edit, page deletion while
viewed, component master edit during instance edit, CMS record concurrent edit,
publish during editing, undo/redo with remote ops, autosave with remote ops,
history restore with live collaborators.
Find: lost updates, unsafe LWW, duplicate ops, out-of-order application, stale
presence, ghost collaborators, reconnect duplication, lost offline changes,
remote ops in local undo stack, permission enforcement after role change,
memory/socket leaks.
Output: Subsystem · File/function · Protocol/state · Failure mode · Repro path ·
Data-loss risk · Recommendation · Priority · Runtime verified?

## Prompt 17 — Codebase Architecture & Maintainability
Folder structure, feature boundaries, shared libs, hooks, stores, services,
APIs, types, utilities, backend boundaries, realtime architecture.
Find: god components, huge files, circular deps, feature coupling, business
logic in UI, duplicate business logic/state, global store abuse, prop drilling,
mixed concerns, dead code, magic constants, unsafe `any`, scattered realtime logic.
Output: File · Symbol · Responsibility · Problem · Dependency impact · Refactor
recommendation · Risk · Priority.

## Prompt 18 — Frontend + Realtime Performance
Rerenders, global subscriptions, selectors, Layers tree, CMS tables, media grids,
History, Activity, search, images, code splitting, network, caching, realtime
events, presence/cursor updates, collab payloads.
Find: unnecessary rerenders, N+1, unbounded lists, missing virtualization,
duplicate network calls, large bundles, expensive calcs, presence causing full
editor rerenders, too-frequent cursor events, oversized realtime messages,
reconnect storms, duplicate subscriptions, memory leaks.
Output: Area · File/function · Cause · Impact · Recommendation · Priority · Needs profiling?

## Prompt 19 — Security, Authorization & Permission Boundaries
Authentication, authorization, roles, workspace/site/CMS/media permissions,
publish, delete, AI usage, invitations, sharing, collab rooms, comments,
realtime events, WebSocket auth.
Find: UI-only authorization, missing server enforcement, unauthorized realtime
room access, updates after access revoked, forged collab events, insecure
document IDs, privilege escalation, unsafe token handling, XSS, unsafe uploads,
secret exposure, missing validation, missing rate limits, unauthorized
publish/delete, comment/mention abuse. Distinguish UX guard vs real server security.
Output: Issue · File/function · Role/action · Enforcement · Risk · Recommendation · Priority.

## Prompt 20 — Test Coverage & Test Quality
Unit, component, integration, E2E, realtime, backend tests mapped against Add,
Layers, Pages, Media, CMS, Components, Brand, AI, Review, Issues, History,
Activity, Publish, Settings, Templates, Collaboration. Collab needs: two-user
editing, simultaneous updates, conflict resolution, reconnect, offline edits,
permission revocation, invite, remove member, remote delete, undo/redo with
remote edits, publish during collaboration.
Find: critical untested flows, happy-path-only, missing failure tests, missing
permission tests, flaky realtime tests, over-mocking, implementation-coupled tests.
Output: Feature · Existing tests · Coverage · Missing scenarios · Recommended level · Priority.

## Prompt 21 — Final Release-Readiness (read-only)
Re-check all 20 categories; no new speculative improvements. Each: PASS /
PARTIAL / FAIL / NOT VERIFIED. Release-ready requires: no P0; no critical dead
end; no misleading exposed feature; no broken return path; no major ownership
violation; no silent critical failure; no collab data-loss risk; no unauthorized
realtime access; no critical a11y blocker; no known authz bypass; critical E2E
and collab flows working and tested.
Result: READY FOR RELEASE / IMPLEMENTATION FREEZE, or NOT READY + only verified blockers.

## Prompt 29 — Fix-Batch Plan (plan only)
Merge findings; dedupe; group symptoms under root causes; dependency order;
fixes that may invalidate other findings; separate product decisions from
defects; P0/P1/P2/P3; required tests per fix.
Output: Fix ID · Root Cause · Affected Findings · Affected Files · Affected
Modules · Dependencies · Risk · Fix Strategy · Required Tests · Priority.
Then wait for approval before modifying code.

## Agent specialties (Section 7)
- A Orchestrator — inventory, scope, dedupe, severity, dependency map, fix batches.
- B Product Architecture — Prompts 1–5.
- C Interaction & UX — Prompts 6, 8–13.
- D Collaboration & Realtime — Prompts 7, 16 (+ collab parts of 12, 15).
- E Engineering Architecture — Prompts 17, 18.
- F Security & Permissions — Prompt 19.
- G Verification & Test — Prompts 14, 15, 20, 21.
