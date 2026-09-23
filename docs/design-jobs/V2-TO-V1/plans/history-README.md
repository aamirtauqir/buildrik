# history — V2 → V1 plan set (PLAN-ONLY; nothing applied)

Slug `history`. V1 target section `1776:8374` "16 · History" (35 boards), page `1:3`,
file `g4GzQFqzNYz5sosz1QtZXC`.

Source: `../slices/history.json` (16 `UX-I` rows) + `UX-I-42` + the rows of
`../slices/_board-level.json` that land inside this section (`VIS-1-01`,
`QA-C-01`, `QA-C-09`, `QA-C-14`, `ARR-C-07..12`).

**Nothing here has been applied.** The Figma MCP seat quota was exhausted
account-wide for the whole session — see `../reports/history.md`. Every plan is
written to be executable by someone who is not me.

## Provenance of every id in this plan set

**No node id in these files was read from Figma by me.** They come from the
repo's own committed read records, and each row says which:

| id class | where it comes from | trust |
|---|---|---|
| board ids + names + sizes (`162:2`, `163:2`, `163:64`, `163:113`, `163:167`, `163:220`, `163:269`, `453:4031`, `1138:4573`, `949:4474`, `184:*`, `879:*`, `950:4474`, `1156:*`, `1704:*`, `433:2348`) | `docs/design-jobs/baselines/figma-page-1-3-pre-reorg.tsv` — a committed dump of page 1:3 | high; ids survive a re-lay, **positions in that file are pre-reorg and stale** |
| board coordinates + the six row bands | `_board-level.json` → `ARR-C-07..12`, measured on the section as it stands now | high |
| `163:213`, `163:215`, `229:1144`, `229:1146` (confirm band, body, two buttons) + their geometry | `_board-level.json` → `QA-C-01` evidence | high — it quotes exact frames and offsets |
| `172:3`, `172:6` (captions) | `_board-level.json` → `QA-C-14`, `QA-C-09` | high |
| `163:167` (the VIS-1-01 board) | `_board-level.json` → `VIS-1-01` | high |
| `163:110`, `163:112`, `163:276`, `163:315`, `453:4038`, `453:4042`, `453:4044` + verbatim live strings | `docs/design-jobs/LEDGER.jsonl`, agent `verifier-history`, 2026-09-02 | high, but 5 days old |
| the tab-row FRAME on `163:167`; the slider thumb on `163:113`; every chip / band / label TEXT node | **nobody ever recorded them** | these are the `unresolved-id` rows — selector only |

Every row that needs a lookup carries `"unresolved-id": true` and a `selector`
of `{section, board, boardName, contains}` (or a `shape` description where there
is no text to match). `scripts/figma/history-resolve-ids.mjs` turns the whole
table into ids **in one mcp call** and refuses ambiguous rows rather than
guessing — a rename is the one failure a re-run cannot recover from.

## Run order

```bash
# 1. resolve every unresolved-id row in the copy plan  (ONE mcp call)
node scripts/figma/history-resolve-ids.mjs \
     docs/design-jobs/V2-TO-V1/plans/history-text.json --write

#    Read the resolved file before step 2. The resolver fills `expect` with the
#    node's CURRENT characters; if a chip node reads "Milestones · 12" rather
#    than "Milestones", the whole-node replacement would drop the count and the
#    row needs a splice instead. AMBIG/NOMATCH rows print to stderr and are left
#    unresolved on purpose.

# 2. copy  (expect-guarded; refuses a stale plan; reads every node back)
node scripts/figma/apply-text-fixes.mjs \
     docs/design-jobs/V2-TO-V1/plans/history-text.json --apply

# 3. the two MEASURED render defects — VIS-1-01 and QA-C-01
node scripts/figma/fix-history-render-defects.mjs            # dry run first
node scripts/figma/fix-history-render-defects.mjs --apply

# 4. the 8 missing states named by the Criticals and Majors
#    one add-state-board.mjs call per row of history-state-boards.json:
#      node scripts/figma/add-state-board.mjs <cloneFrom.id> "<newBoardName>" \
#           --wire-from <wireFrom.id> --apply
#    RECORD THE ID EACH CALL PRINTS — steps 5 and 6 need them.

# 5. the copy for the 8 new boards
#    each board's strings are in history-state-boards.json → boards[].copy.
#    Author a second selector plan against the NEW board ids, resolve it with
#    history-resolve-ids.mjs, apply with apply-text-fixes.mjs.
#    (This plan cannot be authored earlier: the clones have no ids yet.)

# 6. wire each new state from the control that produces it
#    flatten history-hotspots.json (resolve over.selector + to.newBoardName), then
node scripts/figma/add-hotspots.mjs \
     docs/design-jobs/V2-TO-V1/plans/history-hotspots.json --apply

# 7. geometry + arrangement — LAST, because step 4 adds 8 boards and re-laying
#    before it means re-laying twice
#    history-geometry-and-arrangement.json → geometry[] by hand (3 rows, one of
#    which is NOT-APPLICABLE), arrangement[] via:
node scripts/figma/layout-section.mjs 1776:8374 --apply

# 8. read-back of the whole section
node scripts/figma/verify-invariants.mjs
```

## Files

| file | rows | covers |
|---|---|---|
| `history-text.json` | 28, all `unresolved-id` | `UX-I-09` (19), `UX-I-16` (5), `UX-I-10` (2), `QA-C-14`, `QA-C-09` |
| `history-render-defects.json` | 2 ops | `VIS-1-01` (tab row 44→60, board id exact, frame by shape), `QA-C-01` (band 96→136, all four ids exact) |
| `history-state-boards.json` | 8 boards, each with full copy | `UX-I-01`, `UX-I-02`, `UX-I-12`, `UX-I-05`, `UX-I-06`, `UX-I-07`, `UX-I-15`, `UX-I-08` |
| `history-hotspots.json` | 8 rows, all `unresolved-id` | the inbound edge for each new board |
| `history-geometry-and-arrangement.json` | 3 geometry + 1 verification + 6 arrangement | `UX-I-13`, `UX-I-04` (partial), `UX-I-11` (NOT-APPLICABLE), `UX-I-42` (check), `ARR-C-07..12` |

Scripts written for this module (both pass `node --check`, neither has been run):
`scripts/figma/history-resolve-ids.mjs`, `scripts/figma/fix-history-render-defects.mjs`.
