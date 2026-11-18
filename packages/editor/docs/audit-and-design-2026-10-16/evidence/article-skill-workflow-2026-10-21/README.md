# Article-guided skill run — Buildrick

2026-10-21 · **PARTIALLY VERIFIED — five article workflows applied within the evidence available**

The owner requested applying the workflow described in [Figma's article](https://www.figma.com/resource-library/claude-skills-for-product-designers/). The linked skill instructions were inspected. After the initial product-designer critique, the owner explicitly requested the remaining workflows. The outputs below now include a competitor comparison, native FigJam board, six archived Inspector captures reconciled to existing components, and an empty-input interview pipeline check. No skills were installed globally. Completing a pipeline check is not completing a research study.

## Follow-up verification

**Latest approval/keyboard pass:** [Closure evidence](APPROVAL-KEYBOARD-CLOSURE.md) adds28 native approval states, completes retry/reconnection fixtures, and records43/43 local keyboard-specimen checks. Native pointer playback reached16 successes before timeout; exhaustive playback and application accessibility remain unverified.

**Previous continuation:** [Recovery repairs and playback](RECOVERY-CONTINUATION.md) adds ten editable native states and corrects locked-target cancellation, initial Publish routing and existing-thread preservation during second-comment recovery. The owner explicitly reconfirmed Figma continuation for this task. This pass records 89 successful pointer transitions plus two initial missed clicks, with 49 successful post-repair acceptance transitions; an independent review and exact limits are linked. Overall remains **PARTIALLY VERIFIED**. No application-code changes or R1/B9 waiver.

The owner confirmed “Participants abhi available nahi.” [Playback results](BROWSER-PLAYBACK.md) and [expanded competitor research](COMPETITIVE-EVIDENCE-EXTENSION.md) cover that verification pass, which made no application or design mutations. A later authorized [C01/C02 navigation repair](NAVIGATION-FIXES.md) and [scoped independent review](navigation-fix-review.md) record the routes added. [Later browser acceptance](NAVIGATION-PLAYBACK.md) records a fresh ten-frame control read and 36/36 pointer transitions. [Independent evidence review](navigation-playback-review.md) supports closing C01/C02 for pointer navigation only. Broader playback, keyboard/accessibility, rendering stability and R1/B9 remain pending. No design/application changes were needed in this replay.

## Skill selection

| Article workflow | Disposition for this task |
|---|---|
| `product-designer` | Read its instructions and inspected its Python script before execution. Generated its checklist, supplied evidence-backed answers and ran its report generator. Target: professional client-site designers; deliverable: critique of the existing high-fidelity prototype. |
| `interview-synthesis` | Upstream script inspected and executed on zero real transcripts: 0 snippets/themes/opportunities. [Research gaps](RESEARCH-GAPS.md) document neutral next questions and script limitations. Actual study synthesis remains pending. |
| `competitive-teardown` | [Webflow/Framer comparison](COMPETITIVE-TEARDOWN.md), pricing snapshot, evidence matrix, bounded SWOT and action plan produced from official sources. [Follow-up](COMPETITIVE-EVIDENCE-EXTENSION.md) adds 40 public reviews, current hiring counts and all twelve dimension dispositions: seven provisional desk scores, five N/E; no aggregate ranking. |
| `figma-use-figjam` | [Native evidence/hypothesis/action board](https://www.figma.com/board/MlF9NBcUbDbEVDHIAwehWL) created with 12 cards, source links and links to both the canonical prototype and archived study. |
| `prototype-to-figma` | Existing 16 Oct Inspector HTML rendered headlessly; six states captured and reconciled to existing Figma components. [Import handoff](PROTOTYPE-IMPORT.md) records native annotations, source-return connection, fidelity limits and exact IDs. This is an archival study, not a replacement of current approved UI. |

The [product-designer skill](https://github.com/borghei/Claude-Skills/blob/main/product-team/product-designer/SKILL.md) provides the critique checklist workflow. Its research, IA testing, usability study and engineering feasibility checkpoints are not satisfied by this run. The [interview-synthesis skill](https://github.com/borghei/Claude-Skills/blob/main/project-management/discovery/interview-synthesis/SKILL.md) expects completed transcripts; it does not conduct live interviews.

## Evidence and actual results

Canonical file: `2L9OTGzBrL6kYmU18yA1c7`, page `3:10`.

- Current text and native reactions inspected for F1–F5 starting specimens: `302:3396`, `302:11636`, `302:19069`, `303:32296`, `307:14695`.
- Current 1440×996 screenshots visually inspected for F1, F4 and F5. These contain a 1440×900 product scene plus the 96px prototype controller.
- F4 blocking Fix destination `303:32650` inspected for exact-list context.
- Five opaque text/background color pairs inspected and calculated.
- **52 checklist items: 15 scoped passes, 2 prototype failures, 35 not tested.**

Passes concern only the evidence stated in each answer. They do not certify an entire heuristic or all screens.

### C01 — Task instructions promise an unavailable action

**Later status:** [navigation repair](NAVIGATION-FIXES.md) and [scoped review](navigation-fix-review.md) report the exact child-selection routes added. The finding below is the pre-repair observation. [Browser acceptance](NAVIGATION-PLAYBACK.md) now covers both entry methods for all three children, sibling cycles and Hero return. C01 is closed for this pointer-navigation scope; this historical critique remains as provenance.

**Major / severity 2 for independent prototype testing.** In [F1.01](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=302-3396), contextual copy `302:3510` instructs the visitor to select a child. The specimen's only product reaction is Add (`302:3422`); neither canvas-child nor layer-child selection is connected. The controller's generic instruction does not explain this limit.

Recommended repair: identify the intended first task in the prototype controller and explicitly explain the limited interactive scope. If this specimen is intended to test child selection, connect the exact child destination before that test. Keep product guidance and capability intact. This finding is about the prototype specimen, not an observed application defect.

### C02 — Identically styled Fix links have different operability

**Later status:** [navigation repair](NAVIGATION-FIXES.md) and [scoped review](navigation-fix-review.md) report both named image destinations and returns added. The finding below is the pre-repair observation. [Browser acceptance](NAVIGATION-PLAYBACK.md) now covers both target locations and both return choices, closing C02 for pointer navigation only. Alt-text editing/saving remains outside the simulation.

**Major / severity 2 for independent prototype testing.** In [F4.01](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=303-32296), the missing-source Fix (`303:32421`) navigates to the correct list, but the alt-text Fix (`303:32429`) has no native reaction. Both appear actionable.

Recommended repair: if the test remains focused on the publishing blocker, make the limited prototype coverage explicit in the controller; if the test includes alt-text repair, connect its destination and return. Do not remove the application's alt-text repair capability to disguise a prototype limitation.

### Measured contrast sample

| Text node | Foreground/background design values | Ratio |
|---|---|---|
| `303:32419` — collection error | `#C81E1E` / `#FDE8E8` | 4.886:1 |
| `307:23965` — resolved status | `#057A55` / white | 5.355:1 |
| `310:20927` — selected-object annotation | `#1A56DB` / white | 6.180:1 |
| `302:3508` — Inspector section title | `#111827` / white | 17.740:1 |
| `302:3510` — Inspector guidance | `#4B5563` / white | 7.557:1 |

These five pairs exceed the normal-text 4.5:1 threshold described by [W3C](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). This is a design-value calculation, not full accessibility conformance. No keyboard, screen-reader, focus-state, alternate-mode or browser-rendering verification occurred.

## Reproducible run and script limitation

Source script was downloaded to `/tmp/buildrick-design-critique-20261021.py`, read in full, then executed with standard-library Python. Its source URL and SHA-256 are in [run-scope.json](run-scope.json).

Commands used:

```sh
python3 /tmp/buildrick-design-critique-20261021.py --checklist --json > checklist-template.json
python3 prepare-critique.py
python3 /tmp/buildrick-design-critique-20261021.py --answers assessed-only.json --json > upstream-assessed-report.json
```

Run from this evidence directory for the relative paths above.

The inspected script computes failed count as total minus passed even when answers are null. Therefore the full [evidence checklist](checklist-evidence.json) preserves 35 unknown items, while only the 17 assessed items were supplied to its aggregator. Its output grade is **not** a whole-editor, research or WCAG score. Use the explicit three-way counts above.

Raw current evidence: [Figma specimen read](figma-sample.json), [color/target read](figma-colors.json), [contrast calculations](contrast.json), [upstream assessed-only report](upstream-assessed-report.json).

## Next work and limits

The subsequent workflow extension's [final scoped review](FINAL-REVIEW.md) records independent checks, resolved review findings, exact artifact links and temporary-capture cleanup.

Resolve the two prototype-testing issues before using these specimens for unguided tasks. [Browser playback follow-up](BROWSER-PLAYBACK.md) now verifies the five selected paths and the archived Source/Back loop. Keyboard/focus, constrained viewports and desktop playback remain unverified. Continue to use real components and scoped evidence when applying the article's workflows; select a skill according to its input and purpose rather than running every skill indiscriminately.

The initial critique did not change Figma. The subsequent authorized workflow added a FigJam board and a separate archived Inspector study page. Current approved journey screens and application code were not changed. No real interviews, task-completion metrics, SUS score or exhaustive prototype playback are claimed. The follow-up recorded 75 successful transitions plus three manually checked transitions; it does not cover every route. A scoped independent artifact review was requested for this extension; see its record for the actual coverage. R1/B9 evidence remains pending. The earlier native route audit remains valid within its stated graph scope; a valid graph does not establish that every visibly actionable control is wired.
