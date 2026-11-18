# Extraction brief — design-doc audit 2026-10-18

Mode: AUDIT ONLY. Read-only on everything except your own output file in this folder.
Never edit app code, panel docs, the brief, or other agents' files. No Figma. No browser.

## Base paths
- E = /Users/shahg/Desktop/pencil/buildrik/packages/editor
- D = E/docs/audit-and-design-2026-10-16          (design doc set under audit)
- P = D/panels                                     (panel specs 00–25)
- INV = E/docs/editor-feature-inventory-2026-10-16.md   (1,238-row CODE-READ inventory; source of "what exists")
- RL  = E/docs/editor-redesign-list-2026-10-16.md
- Root design system = /Users/shahg/Desktop/pencil/buildrik/DESIGN.md

## Precedence the docs themselves declare (respect it when judging contradictions)
- P/00-SHARED-CONTRACTS.md rules marked *(R-1017)* override panel text.
- SC-21: NO AI in this version's UI (Panel 20 DEFERRED, backend untouched). AI rows in INV = "Deferred by decision", not "omitted".
- SC-22: all other designer recommendations accepted 2026-10-17.
- ARCHITECTURE-DECISION.md is marked SUPERSEDED.
- Flagged features (publish / dsAi / collab) are PLANNED, not dead.
- Rows tagged ❌ Removed in INV are out of scope unless a doc revives them.

## Coverage status vocabulary (use exactly)
COVERED (doc specifies location + controls + states) · PARTIAL (named but missing location, controls, or states — say which) · OMITTED (no doc mentions it) · DEFERRED-BY-DECISION (cite decision) · REMOVED-N/A · CONFLICT (docs disagree — cite both).
Always cite evidence as `file §section` or `file:line`. Never claim OMITTED without grepping P and D for 2+ synonyms.

## The 40 principles (use these IDs)
A Cognitive: P01 Cognitive load · P02 Hick · P03 Fitts · P04 Progressive disclosure · P05 Recognition>recall · P06 Mental models · P07 Jakob · P08 Tesler · P09 Doherty · P10 Aesthetic-usability
B Visual: P11 Visual hierarchy · P12 Gestalt · P13 Visual balance · P14 Whitespace · P15 Type hierarchy · P16 Spacing system · P17 Alignment/grid · P18 Contrast/legibility · P19 Visual rhythm · P20 Spatial consistency
C Interaction: P21 Interaction design · P22 Affordances/signifiers · P23 Feedback/status · P24 Error prevention · P25 Error recovery · P26 Discoverability · P27 Interaction cost · P28 Microinteractions · P29 Contextual relevance · P30 Interaction density
D System: P31 Design consistency · P32 Information architecture · P33 Navigation consistency · P34 Responsive/adaptive · P35 Component reuse · P36 Tokens/systemization · P37 Semantic grouping · P38 State design · P39 Accessibility/WCAG · P40 UX debt

Important: the doc set is SPECIFICATION ONLY — no hi-fi screens exist. Judge each principle at SPEC level
("does the spec define enough for a designer to apply it, and is what it defines sound?"). Do not claim a
principle is satisfied visually.

## Output format (markdown, in your assigned file)
1. `## Scope read` — every file + line range you actually read. List anything you skipped and why.
2. Section(s) your task asks for, using markdown tables.
3. `## Principle observations` — table: PID | module/panel | observation (spec-level) | risk | evidence | suggested status (PASS-SPEC / NEEDS REVISION / BLOCKED / N/A + reason).
   Only principles you have real evidence for; skip the rest — do not pad.
4. `## Contradictions & gaps` — table: ID (your prefix + n) | type (contradiction / ambiguity / missing / stale) | statement A (cite) | statement B or what is missing (cite) | severity (Critical / Major / Minor) | proposed resolution (design-level, no new features).
5. `## Consistency notes` — same function specified with different patterns across docs (panel headers, menus, modals, empty/loading/error, naming, confirmations, undo, shortcuts, widths).

Be terse. Tables over prose. No invented capabilities, metrics, users, or research. If unsure, mark UNKNOWN.
Final chat reply to the orchestrator: ≤150 words — file written, row counts, top 5 findings.
