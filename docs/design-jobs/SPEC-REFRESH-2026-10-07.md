# Spec refresh 2026-10-07 — BLOCKED: stale specs point at deleted Figma nodes

Goal: clear `check-spec-age.mjs --mode=prepush` (308 of 344 specs older than 14 days).

## Finding

All 308 stale specs in `packages/editor/scripts/conformance/raw-figma/` carry a `nodeId`
from the old Editor v1 pages (`boards.json` rows with no `page`). Of 17 probed
(`get_design_context`, file `g4GzQFqzNYz5sosz1QtZXC`), 16 return
"The provided node ID was not found in the file" (node deleted). None of the 308 maps to a
`boards.json` row on the v3 page `4418:45431` or the Clone page `3397:13062`.

Probed and gone: inspector-loading 159:102, inspector-instance-selected, inspector-bound-to-cms 160:105,
inspector-ai-agent-run 160:512, inspector-empty-template-applied 1175:4841, inspector-token-picker 1176:4804,
layers-load-error 781:4217, layers-loading 775:4130, pages-bulk-select, pages-tree, brand-starters,
brand-token-detail, shell-states-returning-default, s1-1-coach-dismissed, s1-4-7-of-7, s1-flows-recovery-banner.

## Board moved — needs build / re-point

- `topbar` (node 681:26): exists but is now named **RETIRED · Topbar** ("RETIRED 21 Sep 2026 —
  superseded by Topbar 4418:144989"). Refetch changes copy ("Saved 2m ago" -> "Saved") and drops
  the SaveStatus pill spec. Not committed: it would make a retired board the contract.
  Re-point the `topbar` recipe/raw file to 4418:144989 first.

## Needed (owner/designer decision, not done here)

Re-map each stale surface to its v3 node (`boards.json` rows with `page: 4418:45431`), or retire
the specs whose boards were deleted, then refresh. Refreshing by the stored nodeIds is impossible.

Figma calls used: 19 of the 150 budget. Tooling used: scratch fetch script on `scripts/baseline/figma-mcp.mjs`.

## Resolution (owner decision 2026-10-07): RETIRE

- 308 stale specs retired: removed `raw-figma/<s>.json` and `specs/<s>.json` for each (616 files).
- 168 recipes in `surfaces/` removed, with their `.conformance-baseline.json` keys: 160 matched boards.json rows by recipe name (160 + 5 + 3 = 168), 5 were unattributed recipes that joined a retired spec (media-card, layers-load-error, shell-default, s1-2f-save-indicator-saved-stale, media-bulk-bar), and 3 orphans (canvas-zoom-levels, shell-state-4-multi-select, components-create-modal-canvas-save-as) whose rows were superseded but whose recipes survived the first pass. 36 `inspector-v4-*` recipes remain.
- `boards.json`: 291 active/design-ahead V1 rows marked `state: superseded`, `status: out-of-scope`, `authority: superseded:v3-4418:45431`, `recipe: null`, reason "V1 node deleted — superseded by Editor v3 page 4418:45431 (owner 2026-10-07)" (same fields as 807:8723); 15 already retired/out-of-scope rows only lost their recipe. Counts recomputed; `coveredFloor` 204 -> 36; `activeFamilies` array now the 8 families with active rows. No v3 or Clone page row touched.
- `.hex-drift-baseline.json` re-recorded (106 pairs belonged to the retired captures).
- Topbar (681:26, RETIRED in Figma) retired the same way; its v3 replacement is 4418:144989, to be re-pointed when the topbar is next built.
- Gates after: check-spec-age exit 0 (36 specs), check-boards 0, check-anchors 0, `npm run verify:ds` exit 0.
