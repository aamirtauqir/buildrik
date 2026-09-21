# Code ↔ Figma feature-gap audit — BRIEF (2026-09-21)

Owner: Saqib · Author: Claude · Grilling: 16 questions, all locked (below).
Figma file `g4GzQFqzNYz5sosz1QtZXC` · page **Editor v3 · IA = `4418:45431`** (source of truth since 2026-09-15).
Codebase: `packages/editor` only.

**Principle:** CODEBASE = what the product can do · FIGMA = how it should work. Functionality → prefer verified code. UX / IA / interaction / visual → prefer the Figma architecture. Never copy the code's chrome into Figma; translate capability into the v3 design language.

---

## Locked decisions

| # | Decision |
|---|---|
| Q1 | Scope: codebase = `packages/editor` only. Figma = page `4418:45431` only. `🧩 Components` `1:2` read for reuse; `Archive ·` pages read only for provenance. Dashboard surfaces out. |
| Q2 | Code inventory = **reuse** `docs/editor-feature-inventory-2026-09-16.md` (5,961 lines, 12 modules), transformed into per-feature rows. Delta since 09-16 on `src/` = **zero files** (checked). Every row marked SHIPPED/LIMITED needs a handler citation `file:line` — re-read the handler where the prose hedges or the entry is flag-gated. |
| Q3 | Status vocabulary (one per feature): **SHIPPED** (reachable in prod build, backend-connected) · **LIMITED** (works with a documented ceiling) · **FLAGGED-VIABLE** (behind `FEATURE_PUBLISH` / `FEATURE_DS_AI` / `FEATURE_COLLAB`; works when on; **all three are planned product — never "dead"**, owner order) · **STUB** (UI drawn, no backend / no-op) · **UNREACHABLE** (code exists, no door) · **DUPLICATE** (same job in 2 places). SHIPPED / LIMITED / FLAGGED-VIABLE enter Figma (flagged ones tagged `PLANNED ·`). STUB / UNREACHABLE / DUPLICATE = report rows only. |
| Q4 | Figma inventory = **one structured dump** (section-scoped `use_figma` calls, ~25) → JSON in `dump/` → all analysis offline. Screenshots ≤ 20, only for matrix ambiguities. Phase 18 re-dumps only the sections written. |
| Q5 | Figma writes: (1) same page; new boards in a new SECTION `v3 · Code-only features`, wired into STATES index `4418:140114` via a launcher. (2) New boards only for gap types **B** (code-only) and **D** (partial). (3) Every new board = clone of the family's base shell (Home `4418:81300` / drawer-closed `4418:123573`), built from the shell's own components; names `CURRENT DESIGN · <Area> · <state>` or `PLANNED · <Area> · <state>`. (4) Edits to existing live boards only to add a new feature's entry point, via the source-node + propagation-script pattern. (5) **Cap 40 new boards.** (6) Hide-don't-delete; masters on `🧩 Components` untouched; variables may be added, each documented. |
| Q6 | Topbar: edits **allowed for entry points only** (Comments toggle, presence avatar stack, connection pill) on the topbar master `4418:144989` + propagation. Nothing else on the topbar. |
| Q7 | Verification = **static**: read back `reactions` after every write (CONDITIONAL expanded), graph scan on the re-dump (0 dangling / dead end / Close-first / unreachable beyond the 1 known false positive), ≤ 1 screenshot per new family. **No Playwright / prototype playback** unless the owner triggers it. Phase 18 = a **fresh agent** that never saw the build. |
| Q8 | **No `src/` edits.** "Required code change" column filled; deltas appended to `docs/plans/2026-09-14-editor-v3-ia.md` as Tier 2/3 rows. (Only code-adjacent edit: root `CLAUDE.md:293` collab row, done 2026-09-21.) |
| Q9 | Deliverables: this folder (files below) + gzipped dump committed + one designer artifact page. |
| Q10 | Agents: 5 code-inventory agents (local only) · 3 gap-matrix agents (local only) · 1 fresh second-pass agent (local only). **Every Figma call is made by the main session.** Build serial. |
| Q11 | B-class build order: **P0** flow cannot complete without it (recovery / conflict / comment posting) → **P1** owner-named families in order comments → review threads → presence/collab → notifications/activity → sharing (view link) → permissions (viewer vs editor) → **P2** daily canvas affordances (inline text edit, multi-select align, guides/grid, cheat sheet, ⌘⇧P) → **P3** rest = "Planned for later" with node-ready specs. Cap consumed top-down. |
| Q12 | Figma-only / dummy controls: **annotation card** `AUDIT · <status>` beside the board (inside its section, board pixels untouched) for **NOT IMPLEMENTED** and **DESIGN-ONLY** only; every other status = report only. Never rename or hide a live board for status. |
| Q13 | Done-condition — see below. |
| Q14 | Phases 5–7, 10–12 run **per surface family** (~16), not per board. v3 vocabulary for locations: Rail · Drawer panel · Full-canvas view · Inspector · Topbar · Modal · Popover · Side sheet · Context menu · ⌘K · Inline. (Prompt's "right rail" = Inspector; prompt's "drawer" = side sheet.) |
| Q15 | Branch `audit/code-figma-gap-2026-09-21`; milestone commits; stage only this folder, the plan-doc append, root `CLAUDE.md`, and the 09-15 / 09-16 input folders + inventory doc. No push. |
| Q16 | Start now. **Pause before Phase 16 (build) for the owner's go** on `04-integration-plan.md`. |

## Done-condition (observable, checked before "done")

1. `01-code-inventory.md` — every `##`/`###` feature heading of the 09-16 doc has a row; status filled; ≥ 1 `file:line` per SHIPPED/LIMITED row.
2. `02-figma-inventory.md` — one row per live board family / control; row source = dump; live-board count stated.
3. `03-gap-matrix.md` — every row from 1 and 2 appears exactly once; gap type A–F set; no UNKNOWN without an owner-decision note.
4. Figma — every new board (≤ 40) reachable from STATES index `4418:140114`; read-back JSON per board in `05-figma-build-log.md`; re-dump graph 0 / 0 / 0 / 0 (+1 known false positive).
5. `06-second-pass.md` — by an agent that never saw the build; every finding CONFIRMED / NOT REPRODUCED / PARTIAL.
6. `07-traceability.md` — 100 % of code rows carry one of the 7 Phase-19 statuses; 100 % of Figma rows one of the 4; **zero ✗ Missing** unless listed under "Remaining gaps" with a reason.
7. Artifact URL published; `REPORT.md` has all 18 sections; its "NOT verified" section is non-empty.

## Files

```
BRIEF.md                 this file
01-code-inventory.md     rows: ID · Feature · Module · Purpose · Entry point(s) · Location · UX flow · Dependencies · Role · States · Status · Evidence · Duplicate of · Notes
02-figma-inventory.md    rows: ID · Board/control · Section · Class · Node ids · Trigger(s) · Destination(s) · States present · Variables · Notes
03-gap-matrix.md         Phase 14 table (12 columns) + capability-depth sub-tables (Phase 3)
04-integration-plan.md   Phase 15, Batches 1–8; per change: current · problem · proposed · why · surface · interaction · entry · exit · components · screens
05-figma-build-log.md    per new board: node id · parent section · launcher wiring · read-back reactions JSON · screenshot ref
06-second-pass.md        fresh-agent audit (Phase 18)
07-traceability.md       Phase 19, both directions
REPORT.md                18 sections, links into the above
dump/                    Figma JSON (gzipped on commit)
```

## Inputs (already in the repo, cite — do not re-find)

- `../editor-feature-inventory-2026-09-16.md` — the code inventory source (appendix = flag-gated / coming-soon / unreachable / limited lists).
- `../audit-2026-09-15/DESIGN-RULES.md` — type scale, tokens, grid, dialog anatomy, interaction-pattern table. Yardstick for every new board.
- `../audit-2026-09-15/{A-v,B-v,C-v,D-v,S-systems-v,COORD-v,QA3-static}.md` — pass-5 findings + fixes.
- `../audit-2026-09-16/3-component-behavior.md` — library state coverage per component family.
- `../plans/2026-09-14-editor-v3-ia.md` — v3 decisions, node-id map (§6, §12–15), Figma API limitations (§15 end).

## Rules every agent follows

- Evidence per claim: code rows cite `file:line`; Figma rows cite node ids + observed value (reaction destination, count, copy).
- Separate **observed** from **inferred**; consequential ambiguities go under **Owner decisions**, never invented.
- Bias: remove · merge · simplify · reuse · consolidate. Do not add a feature unless a flow cannot complete without it or the code already has it.
- Board sample data ("Bella Cucina", "In review · 3 open") is never conformed to literally — the SHAPE is the contract.
- Figma API (from §15 of the plan): ≤ 2 conditional blocks; overlay position read-only; assigning a bound paint resets opacity (re-assign with `opacity`); AFTER_TIMEOUT only on top-level frames; no string concat; NAVIGATE alone dismisses overlays; never `[CLOSE, NAVIGATE]` on a top-level frame; never a NODE action whose destination contains the source.
