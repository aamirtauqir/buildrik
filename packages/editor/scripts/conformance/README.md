# Conformance harness (Phase 0)

Plan: `docs/designs/2026-07-26-editor-conformance-plan.md`. Drift is invisible
to code review and to the test suite — it only shows up when the running
product is measured against the Figma board. This directory holds the tooling
that does the measuring.

## Pieces

| File | Job | Status |
|---|---|---|
| `check-token-resolution.mjs` | Every `var(--token)` in `src/`+`demo/` must resolve to a definition (or carry a fallback → WARN). Runs in `verify:ds` and editor CI. | LIVE |
| `measure.mjs` | Drives the running editor at 1440×900 to a surface state, dumps live geometry / computed fills / radii / font sizes + computed contrast per text-on-fill pair. | Phase 0b |
| `surfaces/*.json` | Per-surface state recipes (rail tab, selection, panel) + board ref. | Phase 0b |
| `specs/*.json` | Figma board specs, extracted via the Figma plugin API (agent step — MCP is not scriptable from node). | Phase 0c |
| `diff.mjs` | `surface · property · figma · code · verdict` report. | Phase 0c |

## Rules the harness encodes (learned 2026-07-20 week, six defects)

1. **Every `var(--token)` must resolve.** Undefined CSS vars fail silently;
   this class alone produced three of the six defects.
2. **Contrast is computed, never eyeballed.** Text-on-fill under 4.5:1
   (3:1 for ≥18px) fails the run.
3. **Measure at the width the board specifies, with the inspector open.**
   The canvas-toolbar overlap only existed at 1440 with a selection.
