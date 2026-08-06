<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260806-114656.md -->

# Rail + drawer inner panels — rebuild to the boards

2026-08-06. Founder order: *"sab se pehle left side ki rail karo, un ke inner
sections totally mismatch hain"* — and **no Codex** (`codex_reviews=disabled`;
the last Codex direction was reversed by evidence). Claude-only voices.

## Scope — from `packages/editor/scripts/conformance/boards.json`

| Family | Root board | Boards | Shipped code |
|---|---|---:|---|
| Rail | `52:6` (in shell board) | 1 | `rail/tabsConfig.ts` + LayoutShell — RAIL_FIGMA matches 6 items; logo tile is NOT on the board |
| Insert | `137:2` | 9 | `sidebar/tabs/build/` (ElementsTab etc.) |
| Layers | `142:2` | 11 | `panels/layers/` + `sidebar/tabs/layers/` |
| Pages | `140:2` | 10 | `sidebar/tabs/pages/` |
| Media | `144:2` | 17 | `editor/media/` + `sidebar/tabs/media/` |
| Content | `148:2` | 11 | `sidebar/tabs/content/` |
| Brand | `152:2` | 26 | `editor/design-system/` |
| **Total** | | **85** | |

Order: Insert → Layers → Pages → Media → Content → Brand (frequency order, and
Brand last because 26 boards of one panel = volume, low judgement).

## Premises (founder-stated, gate below)

1. The drawer panels' inner sections **do not match their boards** — confirmed
   for the shell already (inspector body accordion-vs-flat was the visible
   proof); the drawer inners are the founder's named pain.
2. The board is the contract for everything visual (standing precedence rule,
   `packages/editor/CLAUDE.md` §FIGMA UI REBUILD).
3. Per-board loop is Figma's official skill: `figma-design-to-code` →
   `get_design_context` → build → **verify = board screenshot vs live
   screenshot, by eye**. Probes/harness = regression net only.
4. Behaviour stays: panels keep their Composer wiring, handlers, tests on
   behaviour. Re-derivation changes what renders, not what it does.

## Per-family loop (the standing CLAUDE.md loop, applied 6×)

1. `get_design_context` on the root board; states fetched as needed per board.
2. Rebuild the panel's render tree to the board: structure, section order,
   copy (shape, not sample data), geometry, `--bk-*` tokens via `tw:`.
3. Behaviour tests on touched files BEFORE re-derivation where thin.
4. Live screenshot at 1440×900 with the panel open, matching board state,
   side-by-side vs board screenshot. Iterate until the eye says match.
5. Tests protecting the old design rewritten in the same commit.
6. One commit per family minimum; ratchets stay green (`--update` with reason
   where board-driven CSS genuinely grows).

## Known deltas going in (from the shell pass)

- Rail: logo tile ships, board has none. Insert active-state tint differs by
  state, not drift.
- Tip banner / FAB / "0/7 done" checklist float over the drawer — on no board.
  Founder call needed: demo-only or chrome (surfaced at the gate).
- Drawer inner sections: founder says "totally mismatch" — the per-board fetch
  will produce the exact delta list per family.

## Acceptance

Per family: side-by-side screenshot match (board vs live), behaviour tests
green, family commit pushed. Arc done when all 6 families + rail pass the eye
test. `boards.json` recipe coverage may grow behind it (regression net), never
gates the visual call.

## Premise gate — DECIDED (founder, 2026-08-06)

Voice (Claude-only, Codex disabled) found 4 of 6 families re-derived to these
boards on 08-04 and recommended flipping to Pages→Brand full + 4 audits.
**Founder held the original: ALL SIX full rebuild, original order.** Presented,
decided, final. **Brand IA: boards win** — the 26 drawer screens replace the
4-tab workspace render tree; registries and state stay.

## Step 0 (from the voice, absorbed)

- DELETE `rail/DrawerPanel.tsx` (+test/CSS) and `sidebar/tabs/ElementsTab.tsx`
  + `tabs/elements/` — dead code, nothing routes them. `BuildTab` is Insert.
- **PanelFrame/PanelHeader/SearchBar FROZEN** for the arc — 10+ consumers.
- Plumbing mines: `TabRouter.tsx` display:contents trap (root layout change →
  every panel's scroll collapses to 16px); `LeftSidebar.tsx:565` variable width
  + `ui:media-panel-width`/`ui:templates-panel-width` events (320↔700) — never
  hard-code 320.
- Corrected: tip banner (`138:244`) + onboarding checklist (`807:6694`) ARE
  board-backed. Only History FAB undecided, out of scope.
- Per family commit: existing specs stay green + root-board recipe added
  (regression net armed; eye still decides).

## Decision Audit Trail

| # | Phase | Decision | Class | Principle | Rationale |
|---|---|---|---|---|---|
| 1 | CEO | All 6 full rebuild, original order | Premise gate | founder | held after evidence of 08-04 re-derivations |
| 2 | CEO | Brand IA = boards (drawer screens) | User decision | precedence rule | visual → board |
| 3 | CEO | Dead code deleted step 0 | Mechanical | P4/no-dead-code | zero routers import them |
| 4 | CEO | PanelFrame frozen | Mechanical | P2 blast-radius | 10+ consumers incl. out-of-scope panels |
| 5 | CEO | Recipes ride per family | Mechanical | gate-must-fail doctrine | net armed, never gates the eye |

## NOT in scope

- Inspector flat body (board `52:56` / `824:5095`) — next arc after this one;
  already the named biggest shell mismatch.
- Drawer drill-ins beyond the 85 boards (Media drill-in boards ARE in the 17).
- Backend/behaviour changes; `AquibraStudio.tsx` (founder's dirty file).
