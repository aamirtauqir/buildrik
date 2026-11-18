# Phase 2 — completed accessible audit, with explicit verification limits

10 October 2026. **Gate 2 is met for the accessible audit scope:** major editor workflows and UI families have evaluated outcomes, evidence-linked findings and explicit remaining verification boundaries. This is an audit/design handoff, not a claim that all functionality passes, all bugs are fixed, or the product is production-ready. No application/test code was changed. Phase 8 remains unauthorized.

The review combined the existing discovery manifests, earlier browser evidence, authenticated disposable-project workflows, three independent domain source/contract audits, and a separate coverage/gate review. [Independent gate checklist](AUDIT-GATE-REVIEW.md). Its documentation reconciliation requirements are addressed by the refreshed inventory, functional matrix, tracking matrix and risk report. The native gesture attempt concluded without a verified result and is explicitly retained as a blocker rather than a pass.

## Deliverables and traceability

| Deliverable | Artifact | Scope |
|---|---|---|
| Architecture, component dependencies, data/state flow and ownership | [Architecture report](PHASE-1-ARCHITECTURE.md) | Major module discovery; linked file/import/API manifests; no dead-code inference from import counts |
| Assessed feature inventory | [CSV](FEATURE-INVENTORY.csv) / [readable ledger](FEATURE-INVENTORY.md) | 81 unique IDs; UI and service-boundary rows intentionally overlap; explicit evidence and runtime limits |
| Functional workflows | [Functional matrix](FUNCTIONAL-AUDIT-MATRIX.md) | Tested successful paths, failed paths, source/contract evidence and unavailable external paths |
| Canvas and inspector | [Coverage](CANVAS-INSPECTOR-COVERAGE.md), [canvas failures](PHASE-2-CANVAS-FINDINGS.md) | Geometry/history defects, capability/write boundaries, native-gesture limitation, preview and runtime separation |
| Pages and History | [Runtime audit](PAGES-HISTORY-AUDIT.md) | Server round trips, confirmed deletion/undo, named snapshots/restore and comparison/shortcut defects |
| CMS, media, components, Brand, Settings and visitor content | [Workspace/service coverage](WORKSPACES-SERVICES-COVERAGE.md) | Actual UI→engine→service boundaries, tested contracts, unsupported behaviors and service/provider limits |
| Review, release, permissions, AI and recovery | [Coverage](REVIEW-RELEASE-COVERAGE.md) | Runtime read/error states; selected backend and UI contracts; authorization/freshness/source risks |
| Additional browser outcomes | [Extended runtime audit](EXTENDED-RUNTIME-AUDIT.md) | Media failed-sync recovery, grouping/undo, token propagation, Issues/Activity/Review/Notifications, Settings and preview |
| Context menus | [Menu audit](CONTEXT-MENU-AUDIT.md) | 55 types × locked/unlocked availability matrix, major menu-family responsibilities and keyboard differences; not 110 successfully executed actions |
| Panels | [Panel audit](PANEL-BEHAVIOR-AUDIT.md) | Current hosts, widths, overflow/focus/Escape, dedicated workspaces and return-state behavior |
| Technical risks and finding register | [Risks](TECHNICAL-DEBT-AND-RISKS.md), [tracking CSV](TRACKING-MATRIX.csv) | 60 tracked entries including prior findings, risks and coverage observations; not 60 independently runtime-confirmed bugs |

Information-architecture decisions and current competitor research belong to Phase 3. This audit does not silently adopt earlier redesign proposals or create Figma screens before their gate.

## What the browser established

- Authenticated document insertion/save/reload and CMS collection/draft-record round trips work in the tested disposable fixture. The prior development API404 blocker was recovered without source changes.
- Pages duplicate, F2 rename with Keep URL, confirmed delete, Undo and server reload work. Advertised page ⌘D fails; canvas ⌘D works in the separate tested context.
- Saved History checkpoint/restore/Undo restore works and retains safety saves. Compare misses a page-name difference that Restore changes.
- Canvas sibling duplicate/undo/redo and four-element grouping/undo preserve tested identities/order. Three existing resize failures remain P0: zoom scaling, keyboard NaN and cancellation undoing a prior edit.
- Media bytes uploaded, but server registration returned 500. Local insertion worked; after an unsettled-save reload the library retained the local asset while the image lost its source. Cloud durability is not verified.
- A bound Brand background token propagated to computed canvas color; Undo/Redo and acknowledged save/reload retained the appropriate states.
- Issues detected actual missing-image and site warnings; Activity/Review showed failed-load recovery; Notifications had an empty dialog and Escape return. Successful review delivery/event history is not inferred.
- Preview rendered content in the script-disabled iframe. Earlier responsive output mismatch remains open. This preview cannot establish working visitor interaction scripts.

## Focused existing tests executed in this parallel continuation

| Batch | Files | Initial result | Qualification |
|---|---:|---|---|
| Canvas/inspector | 30 | 373 passed, 3 TODO, 0 failed | Real-engine and mocked contracts; native gestures are separate |
| Workspaces/services | 12 | 153 passed, 0 failed | Client persistence/override/undo contracts; provider effects mocked |
| Review/release editor | 30 | 400 passed, 2 timed out | Original exit 1 and raw JSON retained |
| Review/release backend | 11 | 110 passed, 0 failed | Authorization/publish/notification service contracts; no external delivery |
| Diagnostic rerun | 2 filtered files | Both timeout cases passed with 60s harness limit; 78 filtered skips | Same two cases, not additional unique coverage; original failures not erased |

Raw JSON files are under `evidence/`, named `canvas-inspector-tests`, `workspaces-services-tests`, `review-release-tests`, `review-release-backend-tests` and `review-release-timeout-rerun`. First-run total is **1,036 passes, two timeouts and three TODOs**. The two timeouts later passed the narrowly selected diagnostic rerun. Do not describe all original runs as green or infer production performance from the busy development/test environment. Earlier Pages/History's 93 passes and older test runs are separate evidence, not silently added to this total.

## Material risks carried into design

P0 canvas correctness precedes visual polish. P1 risks include scoped mutation/locking, truthful local-versus-server durability, review-target authorization, AI publish baseline protection, component/media retry durability, generic integration credential handling, page shortcut and history comparison accuracy. Source-confirmed risks are explicitly distinguished from browser reproductions. Unsupported reverse interactions, multilingual publishing, Sheets OAuth, remote audio mirroring and planned export options must not become apparently functional Figma controls without implementation labels.

Passing tests do not clear defects when tests encode the current deficient contract. UI relocation must preserve document schemas, engine transactions, permission enforcement, caller context and each service's persistence boundary. No removal, API change, schema migration or framework replacement is approved.

## Explicit remaining blockers and QA breadth

| Boundary | Audit disposition | Required follow-up evidence |
|---|---|---|
| Native drag/reorder | Actual local browser attempt incomplete; source and selected contracts evaluated | Complete browser before/inside/after/cancel at multiple zooms and scroll positions; no synthetic-event substitute |
| Media remote registration/recovery | Failed path observed; local database errors occurred in the same session, exact cause not isolated | Controlled refusal/offline/reconnect and acknowledged save; durable image mapping across devices |
| Role and workspace permutations | Source/contract assessed; actual role fixtures unavailable | OWNER/ADMIN/EDITOR/VIEWER plus site overrides, revocation and restrictive token sessions |
| Provider and external workflows | Source assessed; no publish, message, billing, OAuth or webhook action executed | Authorized staging/provider fixtures for deployed output, forms delivery, AI success, DNS, client sign-off and rollback |
| Concurrency/offline/collaboration | Specific outbox/history contracts tested; broad runtime convergence unverified | Multiple sessions and failure fixtures; collaboration stays gated |
| Full accessibility/responsive/performance | Major keyboard/focus/layout problems evaluated; exhaustive certification incomplete | Screen reader/contrast/focus coverage, supported browsers/devices and representative production-build documents |

These are visible boundaries of the audit, not evidence that the affected modules work, nor additional approval requirements invented for Phase 3. They remain tracked acceptance/QA work. Phase 3 can now define ownership, context rules and panel responsibilities using the assessed baseline; AS-IS reconstruction must still precede TO-BE design.
