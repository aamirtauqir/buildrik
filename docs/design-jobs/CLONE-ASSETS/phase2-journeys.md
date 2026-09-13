# Assets · Clone Phase 2 — Organisation & actions — walk log

Brief: `phase2-brief.md`. Source section `3695:45625` (25 screens) + the
overlays it opens. Graph: `reactions-3695-45625.json`. Shots: `shots/`.

## Live env

Same as Phase 1 (`phase1-journeys.md` § Live env) — unified editor on
`scratch-ver`, 1440×900, Blob token present (every upload reaches the
server). Library seeded with the ten Clone fixtures (+ duplicates from the
Phase-1 token pass).

## Work split

| agent | journey | files owned |
|---|---|---|
| A | P2-A Folders — scopes, New folder modal, duplicate name, empty folder | `FolderTree.tsx`, new `CreateFolderModal.tsx`, `LibraryManager.tsx` wiring, `AssetGrid.tsx` empty branch |
| C | P2-C Delete · Rename · Download | `ConfirmDeleteModal.tsx`, `useSelectionState.ts`, new `RenameAssetModal.tsx`, download-prepared modal, rail call sites |
| B (after A+C merge) | P2-B Move & drag + bulk rail states + P2-D | `AssetGrid.tsx` (bulk bar, drag), `FolderTree.tsx` drop targets, `AssetDetailsPanel.tsx` bulk rail, move modals |
| main | Figma cache, merges, live walk, boards.json, report | — |

## Drift table

| screen | journey | verdict | note |
|---|---|---|---|
| 3698:20337 | P2-A scope Products | drift-fixed | rows 32 · glyph · name · count, active tint, count line `0 files · Products`; live-3700-20353. Open: SMART counts are scoped to the folder (Clone keeps global) — after B |
| 3698:20541 | P2-A scope Hero shots | drift-fixed | same |
| 3698:20745 | P2-A scope Icons | drift-fixed | same |
| 3698:20949 | P2-A scope Recent | match | Phase 1 rail |
| 3698:21153 | P2-A scope In use | match | Phase 1 rail |
| 3700:20347 | P2-A New folder modal | drift-fixed | modal replaces V1's inline row (1205:4829 retired); live-3700-20347 |
| 3700:20350 | P2-A Folder name already exists | drift-fixed | second step, `Use Products 2`; live-3700-20350 |
| 3700:20353 | P2-A empty folder created | drift-fixed | heading · `Folder created · No assets yet` · hint · Upload files; live-3700-20353. Toolbar row above it → B |
| 3683:19950 | P2-B Move N assets modal | | |
| 3699:20381 | P2-B Moved to Hero shots (rail) | | |
| 3683:19964 | P2-B 2 files moved to Products (rail) | | |
| 3699:20347 | P2-B Files could not be moved | | |
| 4207:26629 | P2-B dragging (grid) over folders | | |
| 4215:26635 | P2-B dragging 2 items over folders | | |
| 4220:26643 | P2-B dragging (list) over folders | | |
| 3708:20650 | P2-C Delete hero-dark.jpg? | drift-fixed | `Used in 1 site placement…` · Cancel · Replace instead · Delete permanently; live-3708-20650 |
| 3708:21082 | P2-C Delete chef-intro.mp4? | drift-fixed | same modal per type |
| 3708:22372 | P2-C Delete Inter-Var.woff2? | drift-fixed | same modal per type |
| 3701:20385 | P2-C Delete 2 selected files? | drift-fixed | `fresh-verify.webp (unused) and pasta-closeup.webp (1 use) … This affects 1 placement.`; live-3701-20385 |
| 3708:20446 … 3708:22384 | P2-C Deleted · <file> ×10 | drift-fixed | rail cleared, count 24 → 23, Undo toast kept (code); live-3708-20446. Toast names the stem (`"fresh-renamed"`) — minor, fix with B's merge |
| 3701:20353 | P2-C Rename hero-dark.jpg | drift-fixed | modal, full filename, Save disabled until changed; row + rail update; live-3701-20353 |
| 3701:20400 | P2-C A file with that name exists | drift-fixed | Edit name returns with the typed value; live-3701-20400 |
| 3701:20394 | P2-C Download prepared | drift-fixed | modal after bulk Download; live-3701-20394. FOUND: Download NAVIGATED the editor to the raw Blob URL (cross-origin `download` ignored) — fixed in the engine (fetch → object URL) |
| 3705:20396 … 3705:21280 | P2-D List · <file> selected ×5 | | |
| 3720:20491 / 3720:20730 | 2 / 4 columns · no selection | match (Phase 1) | |
| 3711:20473 | QA checkpoint (reference) | out-of-scope | text in phase1-journeys |
