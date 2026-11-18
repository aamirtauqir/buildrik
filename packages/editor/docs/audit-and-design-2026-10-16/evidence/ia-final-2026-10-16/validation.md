# FD-IA-09 validation and limits

Review date: 2026-10-16. Baseline revision: `19f964d5e7efda2c276a4c185782bb963da605ec`. Mode: AUDIT_AND_DESIGN. This validates the written handoff and a synthetic documentation specimen, not a redesigned application.

## Actual checks

| Check | Result | Evidence and precise boundary |
|---|---|---|
| Inventory traceability | 1,238 source rows / unique IDs mapped | `inventory-intake.json`, `capability-preservation.json`; includes repeated reports and historical/engine-only claims, not 1,238 distinct verified working features |
| Module handoff structure | 23 module records with A–M sections | JSON/Markdown records cover ownership, workflows, controls, states, dependencies, preservation, acceptance and unknowns |
| Source anchors | 126 references resolve | Referenced files exist at editor/package or repository root. Existence is not runtime verification or a full line-by-line audit |
| DOM flow specimen | **22/22 PASS** | [Recorded flows](specimen-flow-results.json), [script](specimen-flow-check.js); synthetic DOM clicks/input events, not full pointer or keyboard end-to-end testing |
| Geometry specimen | **72/72 PASS** | [Recorded measurements](specimen-geometry-results.json), [script](specimen-geometry-check.js); 12 configurations × 6 conditions; bounds/root overflow, not every control’s content fit |
| Supplemental checks | **16/16 PASS** | [Results](specimen-extra-results.json), [script](specimen-extra-check.js); rendered ID uniqueness, 1440px Editor task reservation and inert underlying resource workspace |
| Native keyboard sample | **2/2 PASS** | [Results](specimen-keyboard-results.json); browser `press F6` moved from History task to bottom region; `press Escape` closed task and returned focus to invoking History button |
| Embedded script syntax | PASS | Extracted final HTML script checked with `node --check`; no application build needed or claimed |
| Artifact consistency | See [structural checks](artifact-checks.json) | Unique intake/acceptance IDs, dispositions, module fields, MD/JSON table agreement, source references, local links and app diff boundary |
| Independent review | PASS — bounded written scope | [Three read-only reviews](independent-review.md); reviewers inspected reported evidence; they did not independently execute the browser suites |

The final flow suite was rerun after fixing task focus restoration and duplicate control IDs. One intermediate test failed after a selector was renamed; the final control identity was corrected and the complete 22-case suite reran successfully. Geometry measurements preceded the final non-layout Conditions explanatory text and duplicate-ID cleanup. The later 1440px Editor task reservation correction has its own passing supplemental measurement; these changes do not establish new production-layout evidence.

## Representative specimen conditions

- Viewports: **1440×900, 1280×720, 1024×768, 1440×600, 1920×1080**; plus selected CSS text enlargement at 1440×900.
- Configurations: Editor, CMS, Assets, Brand, Components, Settings, Pages, Templates, Compare, Time Travel, Help, CMS + History task.
- At 1440×900 the ordinary Editor canvas column measured 800px, with 284px left panel and 300px Inspector. The local canvas toolbar measured 44px; topbar/bottom bar 56/32px.
- At 1280px the Inspector overlays; canvas column 940px. At 1024px canvas column 684px and local toolbar 88px. The authored website viewport remains an independent state.
- Resource navigation collapses at ≤1280px; task sheet is 560px within bounds. At 1440px normal resource layout has 240px navigation and 320px detail.
- At selected enlarged text the topbar/bottom bar grew to 130/49px. This is **not** a real 200% browser-zoom test or a complete text-resize test: some explicit typography remains smaller.
- Supplemental 1440px Editor + History check: canvas right edge and task left edge both 1080px, task width 360px; no unintended task overlap.

Screenshots inspected: [Editor 1440](specimen-editor-1440.png) and [CMS task with enlarged text](specimen-cms-task-large-text.png). They illustrate surface hierarchy and working-area budgets. Representative control examples do not replace module/control contracts or prove a finished full-density production screen.

## Current application observations

Read-only standalone baseline: `http://localhost:5050/`, 1440×900, empty Home without authenticated site context. [CMS](runtime-cms.json), [Brand](runtime-brand.json) and [Assets](runtime-assets.json) captures record observed visible navigation/state; corresponding PNGs are in this folder. Some baseline controls were activated through their DOM handler after a pointer timeout, so no pointer usability pass is claimed. No real site was saved, published, imported, restored or mutated. A development annotation overlay was present.

Earlier Inspector/BIC evidence remains its own bounded baseline: 69 registered block insertions/default Inspector views do not prove all native variants, saved-project or output behavior. This task does not multiply or silently expand that earlier coverage.

## Not run / not certified

- Redesigned application, engine or service implementation; production permissions, persistence, conflict reconciliation, package round trip and background job recovery.
- Authenticated roles/flags, real multi-user collaboration, external AI/data/publish providers, full upload/edit/delete flows or release operations.
- Complete pointer/keyboard testing, assistive technology, contrast certification, actual browser zoom and every long-content/control-density combination.
- Large-project runtime performance, 5k-node/long-list behavior, old-document migration, preview/export/published parity.
- Expanded BD-20 dynamic-system detailed semantics and future controls. Its approved destinations are mapped; the separate detailed feature draft is still PROPOSED.

**Readiness:** G1/G2/G3/G5/G7/G9 pass for the reviewed written IA. G4/G6 pass only for specified layouts/interactions and sampled documentation evidence. **G8 implementation NOT RUN.** Implementation acceptance remains in the per-module, shared, package, preservation and previous Inspector/BIC tests. Do not turn a simulated save or file dialog into a service-success claim.
