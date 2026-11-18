# Gap inventory brief (plan Task 0.3)

Worktree: `/Users/shahg/Desktop/buildrik-worktrees/design-2l9` (branch `feat/design-2l9`). Editor = `packages/editor`.
Plan: `docs/superpowers/plans/2026-10-22-implement-2l9-design.md` (read Global Constraints, Manifest schema, Phase 1 task list, Phase 2 lane table).

You are READ-ONLY on code. Zero Figma calls. You write exactly two files: `packages/editor/docs/design-2l9/inventory/<group>.md` and `<group>.json`.

## Input
- Boards: `packages/editor/docs/design-2l9/dump/page-<id>.json`. Decode: `node -e "import('./packages/editor/scripts/design-2l9/dump.mjs').then(m=>{const d=require('./packages/editor/docs/design-2l9/dump/page-3-8.json');console.log(JSON.stringify(m.decode(d).slice(0,2),null,1))})"` (run from the worktree root). Each row: id, name, w, h, texts[] (on-screen copy; `Shell/...: a ‖ b` = shell chrome texts joined), instances[] (outermost component names), boxes[] (top-level children name,x,y,w,h).
- Archetype screenshots do not exist yet; judge from texts, instances and boxes.
- Manifest rows for your pages: `packages/editor/scripts/conformance/boards-2l9.json` (status `active` rows only).

## Method (keep it bounded — do NOT examine 2,000 boards one by one)
1. Cluster your active frames into archetypes by name prefix + shared structure (same boxes/instances, differing in state or sample data). Typically 15–60 archetypes per page.
2. For each archetype, find the code surface that renders it (file:line) and compare the board's copy, controls and structure with the code. Status: `match` (code already renders it), `drift` (exists, differs — say how), `missing` (no code), `code-ahead` (code has a capability the board lacks — name it and where it should live), `blocked:<reason>` (owner/blocked items: class-first styling → `blocked:owner-class-first`; editor AI surfaces → `blocked:pr33-ai-removal`, because AI removal lives in unmerged PR #33; first-run → out of scope).
3. Shell chrome (topbar, bottom bar/page switcher, inspector header, breakpoint switcher, publish tray, load-failed, CMS status badges) belongs to Phase 1: tag those rows `phase1` in notes instead of re-analysing them per board.
4. Remember precedence: behaviour follows the code contract, visuals/copy follow the board; board sample data ("Bella Cucina", "Fieldwork Studio") is never a drift.

## Output
- `<group>.md`: one table per family: `archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes`. Then a short "Top drifts" list (≤10) and "code-ahead dispositions".
- `<group>.json`: `{ "<nodeId>": {"status": "match|drift|missing|code-ahead|blocked:<r>", "note": "<≤140 chars>", "archetype": "<name>"} }` for EVERY active nodeId of your pages (members of an archetype share its status; add `"inheritsFrom": "<archetype example nodeId>"` for members that differ only in sample data or interaction state; never for error/empty/loading/disabled/read-only variants).
- Every `match`/`drift` cites file:line. Final reply to the lead: counts per status, top 5 drifts, anything you could not map. Keep the reply under 400 words.
