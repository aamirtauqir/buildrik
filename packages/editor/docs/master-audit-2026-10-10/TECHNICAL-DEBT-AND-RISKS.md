# Technical debt and verification risks

Read-only assessment. Priority reflects user impact, not an approved implementation order. Preserve existing saved-project/API contracts and Tailwind/Flowbite chrome while designing remedies.

| ID | Priority | Risk / confidence | Evidence | Required outcome |
|---|---|---|---|---|
| R-01 | P0 | Canvas geometry mixes screen and document pixels; browser confirmed | CAN-01, canvasGeometry, ResizeOrchestrator, DOMUpdater | Define coordinate contract; verify equivalent resize at multiple zooms without changing untouched axis |
| R-02 | P0 | Keyboard/pointer resize path accepts missing coordinates; browser confirmed | CAN-02, SelectionHandles, useCanvasResize | Finite model values for every input path; defined keyboard resize/cancel behavior |
| R-03 | P0 | Resize cancellation undoes unrelated history; browser confirmed | CAN-03, ResizeHandler.cancelResize | Cancellation owns its transaction; earlier edits/history position preserved |
| R-04 | P1 | Preview/publish/canvas have separate HTML/CSS assembly; preview mismatch confirmed, full cause still needs isolated reproduction | UX-09; Composer.exportHTML:930; exportPublishPages:161; ExportEngine.exportAllPages | Same authored breakpoint styles yield equivalent output; keep publish result unverified until tested |
| R-05 | P1 | Editor-only responsive CSS overrides inline styles with !important, exported toCSS omits that block; confirmed source mechanism consistent with UX-09 | StyleEngine.editorDevicePreviewCSS:689; Composer.exportHTML uses elements.toHTML | Verify CSS cascade of failing heading; prefer a consistent serialization contract over cosmetic inspector changes |
| R-06 | P1 | Full workspace keyboard/focus ownership varies; Settings defect confirmed | UX-22; PANEL-BEHAVIOR-AUDIT | Covered chrome not reachable; Escape closes one innermost surface; restore caller focus |
| R-07 | P1 | Menu implementations diverge in navigation, bounds and eligibility | MENU-01; CONTEXT-MENU-AUDIT; existing prior patch | One tested action contract with appropriate surface-specific hosts |
| R-08 | P1 | Several meanings of Saved: document, local CMS, remote snapshot, queued mirror | useSaveCallback; cmsSync; CollectionStorage; resume-verification | Feedback names durability and recovery accurately; do not infer remote success from demo |
| R-09 | P1 | Inspector effective values disagree with canvas | UX-10/25 | Show inherited/current/breakpoint values accurately; distinguish source value from computed value |
| R-10 | P1 | Permission helpers exist but per-endpoint enforcement has not been exhaustively tested | permission.service; registered-api-procedures.json | Read and mutation role matrix with owner/editor/viewer and restrictive token fixtures |
| R-11 | P1 | Multiplayer remains explicitly production-blocked in engine instructions | src/engine/AGENTS.md; architecture report | Preserve gate; no redesign may imply verified collaborative editing |
| R-12 | P1 | Partial design conformance can be mistaken for complete parity | Earlier IA-16 and conformance evidence | Validate each AS-IS board against matching live state; record uncaptured states |
| R-13 | P2 | Navigation/store/lifecycle scopes require care during relocation | shell, tabsConfig, cmsWorkspaceStore, component managers | Preserve selection, dirty forms, caller-return context and site remount semantics |
| R-14 | P2 | Static imports cannot establish runtime use or dead code | import-graph.json, dynamic imports, command/event registries | Require consumers, registration, events and dependent workflow evidence before deprecation |
| R-15 | P2 | Performance and cross-browser coverage incomplete | No production trace in current audit | Establish representative large document and production build baseline before optimization claims |

## Preservation evidence

The current architecture supports a tested local component round trip: create heading master, insert second instance, change selection to 44px, update master, save and reload. Both instances retain computed 44px and master version 2. Preserve this behavior when reorganizing Add/Components/Inspector. See `evidence/component-workflow.json`.

CMS draft create/save/reload also succeeds locally. Preserve the separate CMS record durability boundary and do not replace it with document undo assumptions. See `evidence/resume-verification.json`.

## Source coverage limits

The AST registration map contains 314 procedure declarations across 34 imported routers: 125 queries, 188 mutations and one subscription. Direct guard-call names are discovery aids. A missing direct guard is not an authorization defect: a procedure wrapper or domain service can enforce permissions. This map does not cover every REST endpoint, dynamic spread or runtime middleware decision.

No API removal, schema migration, dependency change, framework replacement or production code patch is authorized by this audit.

## Parallel audit findings added

| Finding | Priority | Risk and evidence level | Evidence |
|---|---|---|---|
| PAGE-01 / HIST-01 | P1 | Browser-verified page shortcut mismatch and omitted page-name comparison | PAGES-HISTORY-AUDIT |
| CI-01 | P1 | Alignment bypasses lock/breakpoint writes; source confirmed | CANVAS-INSPECTOR-COVERAGE |
| CI-02 | P1 | Live runtime reverse/listener cleanup incomplete; source and existing TODOs | CANVAS-INSPECTOR-COVERAGE |
| WS-01 / WS-02 | P1 | Media metadata failures ignored; component retries not reload-durable; source confirmed | WORKSPACES-SERVICES-COVERAGE |
| WS-03 / WS-04 | P2 | Library error looks empty; analytics provider verification overstated; source confirmed | WORKSPACES-SERVICES-COVERAGE |
| WS-05 | P1 | Generic integration credential storage lacks application encryption/redaction boundary; source only, no secrets inspected | WORKSPACES-SERVICES-COVERAGE |
| RR-01 / RR-02 | P1 | Review target scope and AI publish freshness checks inconsistent; source confirmed, not exploited/deployed | REVIEW-RELEASE-COVERAGE |
| RR-03 / RR-04 | P2 | Issues false-clean state; viewer review/comment read coupling; source confirmed | REVIEW-RELEASE-COVERAGE |
| RT-01 | P1 | Image source absent after failed cloud-registration/unsettled-save reload; actual observed recovery gap, exact cause unisolated | EXTENDED-RUNTIME-AUDIT |

All findings retain acceptance criteria in TRACKING-MATRIX.csv. None authorizes code, API or data-model changes. Native gestures, role fixtures, external delivery, production performance and full accessibility remain explicit verification limits.
