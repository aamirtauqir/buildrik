# V2 → V1 — shared agent brief

**Goal (founder, 2026-09-07):** every finding and recommendation carried by the
Figma page **`2668:2` "Editor v2 — Proposal"** is applied to the Figma page
**`1:3` "🖥️ Editor v1"**. V2 is the SOURCE. V1 is the TARGET. This is design
work in Figma, not code work.

## Figma access — read this first

The Figma MCP tools are usually **absent from the session tool list**. That is a
fact about the request, not about the server. Use the committed client:

```js
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC",
  code: `...plugin API JS...`,
  description: "what this does",     // REQUIRED — omitting it is a validation error
  skillNames: "figma-use",
}}, 1);
```

- `node scripts/baseline/figma-mcp.mjs tools/list` — sanity check.
- The CLI branch truncates at 6000 chars. **Import `connect`/`rpc` for anything big.**
- Payload cap ~20,000 chars per call. Chunk. A rejected payload has reported
  success in this repo before — read the result, don't assume.
- `figma.currentPage` resets each call: `await figma.setCurrentPageAsync(page)` first,
  **once** per call.
- **THE BUDGET IS 200 TOOL CALLS PER DAY, 15 PER MINUTE** (Figma Professional plan,
  Full seat — https://developers.figma.com/docs/figma-mcp-server/rate-limits-access).
  That is the whole allowance, shared across every agent and every session on this
  account. A read costs exactly what a write costs. On 2026-09-07 fifteen parallel
  agents spent the entire day's 200 on reconnaissance and applied nothing.
- **Therefore: never explore with the quota.** Node ids come from the findings
  lanes (`docs/design-jobs/findings/*.jsonl` — most rows already name their
  targets) and from `BOARD-BASELINE.json`, both free. Spend calls only on batched
  writes that read themselves back in the same call.
- When the allowance is spent the server answers `You've reached the Figma MCP
  tool call limit for your Full seat on the Professional plan.` That is a **daily
  cap, not a rate limit** — backing off does not clear it, and probing it wastes
  nothing only because there is nothing left to waste. Stop, write the plan, resume
  in the next window.
- Do not fetch screenshots in bulk — one render is one call and buys less than one
  batched write of six rows.

## Hard rules

1. **Write only inside page `1:3`.** Page `2668:2` is read-only source. Never
   delete a board. Never touch other pages.
2. **A write is not verified by the write.** Read every changed node back and
   quote the read-back value in your report. This repo has reported success on a
   dead POST and failure on four that landed.
3. **Reuse the existing tooling** in `scripts/figma/` before writing anything new:
   - `apply-text-fixes.mjs <plan.json> [--apply]` — board copy. Rows:
     `{id, text, expect?, width?, why}`. `expect` refuses stale plans.
   - `apply-truth-marks.mjs <plan.json> [--apply]` — `[not-implemented]` /
     `[unreachable]` / `RETIRED` board markers. It never deletes a design.
   - `add-state-board.mjs <sourceBoardId> "<new name>" [--wire-from <id>] [--apply]`
     — a missing state board, cloned from the board it should be built from,
     collision-tested against every sibling.
   - `add-hotspots.mjs <plan.json> [--apply]` — `hotspot/*` rect over a label +
     wire it. Rows: `{over, to, name, pad, why}`. Use this, not board-level
     reactions (`wire-edges.mjs` walks to the board and makes the whole board clickable).
   - `layout-section.mjs`, `order-sections.mjs` — arrangement.
   - `render-defects.mjs --min=8 [--page=1:3]` — measured defect sweep.
   - `verify-invariants.mjs` — loose / oob / overlap / secoverlap / dangling.
   Only write a new script when none of these fits, and put it in `scripts/figma/`.
4. **Precedence (founder, final):** behaviour → the CODE contract (Zod schemas,
   service returns). Everything VISUAL — layout, colour, type, on-screen copy →
   the BOARD. You are moving boards, so a visual change needs no code permission;
   a behavioural claim printed on a board must match the code or carry a marker.
5. **Board sample data is never conformed to literally.** The SHAPE is the contract.
6. **Reuse existing components.** Page `1:2 "🧩 Components"` and section
   `2040:8372 "28 · Library · shared chrome"` hold the shared chrome (Rail,
   Settings nav row, indented List row). Instance them; do not draw a second
   rail. If you change a shared component, list every instance you checked.
7. **Do not `git stash`, do not commit, do not stage.** The founder's tree is live.
8. **A null result is your harness until proven otherwise.** A silent sweep is
   the quota, not a clean file.

## Design system (page 1:3 must obey)

- One accent `#1A56DB`, hover `#1E429F`. Purple / violet / indigo banned outside
  the allow-listed PRO badge + avatar tones.
- Inter for body/UI. No system fallbacks named in any stack.
- Weights cap at **600**. No 700 in chrome.
- Type scale 11/12/13/14/16/20/24 · leading 16/18/20/21/24/30/32.
- Spacing 2/4/8/12/16/20/24/28/32/36/40/48/64 · radius sm 4 / md 6 / lg 8 / full 9999.
- Ink `#111827`, ink-soft `#4B5563`, ink-muted `#6B7280`, border `#E5E7EB`,
  border-medium `#D1D5DB`, bg-app `#F3F4F6`, bg-panel `#FFFFFF`,
  success `#0E9F6E`, warning `#C27803`, error `#E02424`.
- `#1A264D` is NOT a token and must not spread (CONF-1-01).

## Shell dimensions (V2 §11, measured)

Rail 60 · Topbar 56 · Drawer 280 · Drawer expanded 700 · Media drawer 560 ·
Inspector 300 · Issues 360 · Structure 400 · Canvas palette 520 · Block picker 380 ·
Conflict modal 440 · Comment popover 236 · Page menu 160 · Zoom flyout 196 ·
Settings sub-nav 140. `--bk-size-nav` (240) has ZERO consumers.

**Open conflict you must not silently resolve:** `SPEC-NAVIGATION` proposes the
expanded drawer at 560 and says "700 leaves the drawer"; `SPEC-PAGES-PANEL` and
`SPEC-PUBLISH-PANEL` are drawn at 700, which is what the code does today
(`LeftSidebar.tsx:586-587`). **Draw 700**, and file the 560 proposal as an open
decision on your board rather than applying it.

## Your deliverable

1. `docs/design-jobs/V2-TO-V1/plans/<slug>-*.json` — the plans you applied.
2. `docs/design-jobs/V2-TO-V1/reports/<slug>.md` — one table, one row per finding:

   | V2 finding id | recommendation | affected V1 board(s) | action taken | read-back evidence | status |

   Status is `IMPLEMENTED`, `ALREADY-CORRECT` (with the read-back that proves it),
   `NOT-APPLICABLE` (with the reason), or `BLOCKED` (with what blocks it).
   **Never `IMPLEMENTED` without a read-back.**
3. State plainly what you did NOT cover. Six of eighteen boards walked is six.
