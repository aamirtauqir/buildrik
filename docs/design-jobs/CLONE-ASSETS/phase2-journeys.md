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
| 3698:20337 | P2-A scope Products | drift-fixed | rows 32 · glyph · name · count, active tint, count line `N files · Products`; live-3700-20353. After B's merge: SMART counts are library-wide (were the scope's), and **All assets is the whole library** — the root scope listed only unfiled files, which the first real move exposed (`23 files · All assets` over 21 rows) |
| 3698:20541 | P2-A scope Hero shots | drift-fixed | same |
| 3698:20745 | P2-A scope Icons | drift-fixed | same |
| 3698:20949 | P2-A scope Recent | match | Phase 1 rail |
| 3698:21153 | P2-A scope In use | match | Phase 1 rail |
| 3700:20347 | P2-A New folder modal | drift-fixed | modal replaces V1's inline row (1205:4829 retired); live-3700-20347 |
| 3700:20350 | P2-A Folder name already exists | drift-fixed | second step, `Use Products 2`; live-3700-20350 |
| 3700:20353 | P2-A empty folder created | drift-fixed | heading · `Folder created · No assets yet` · hint · Upload files; the toolbar row is hidden above it (B), kept for search/filter no-results; live-3700-20353 |
| 3683:19950 | P2-B Move N assets modal | drift-fixed | 560 modal, `Move 2 assets`, body names where each file is (`hero-dark.webp is unfiled; chef-intro.mp4 is in Hero shots.`), one 32 secondary button per folder (all, nested too), Cancel; replaces the bulk bar's inline Root/folder popover; live-3683-19950 |
| 3699:20381 | P2-B Moved to Hero shots (rail) | drift-fixed | mixed copy `star-icon.svg moved; chef-intro.mp4 was already here. Site placements are unchanged.`; View destination scopes to the folder keeping the checked set; result clears on selection/scope change; live-3699-20381 |
| 3683:19964 | P2-B 2 files moved to Products (rail) | drift-fixed | `Moved to Hero shots` · `2 assets moved successfully. Their existing site placements are unchanged.` · files · View destination (primary) · Clear selection; bar stays `2 selected`; folder count updates; `media.moveAsset` 200, survives reload; live-3683-19964 |
| 3699:20347 | P2-B Files could not be moved | drift-fixed | title · `No files moved. Your selection and current folders are unchanged. Try again.` · Cancel · Retry; reached by forcing `IDBObjectStore.put` to throw (the remote mirror swallows its own failures — only the local write can reject); Retry after restoring moved the files; live-3699-20347 |
| 4207:26629 | P2-B dragging (grid) over folders | drift-fixed | thumb ghost 130×94 + `1 item`; every FOLDERS row dashed accent outline, hovered tinted; rail `data-dimmed` (opacity .5, no pointer events); footer left `Drop on a folder to move · release outside to cancel` AHEAD of the count · quota (the shots keep both). Walked with synthesized DragEvents, the ghost pulled on screen for the shot — Chrome's native drag snapshot is not reachable through browse. FOUND + fixed: a drop that unmounts the dragged row (folder scope → other folder) never delivers dragend to React, so the ghost outlived the drag |
| 4215:26635 | P2-B dragging 2 items over folders | drift-fixed | checked row carries the checked set: stacked-row ghost + `2 items`; footer `Drop 2 files on a folder to move them · …`; drop on Icons → `Moved to Icons`, counts move, chrome restores. Bulk rail ≥2: `2 assets selected` · both-files hint · Move to folder (primary) · Clear selection; live-4215-26635, live-4215-bulk2 |
| 4220:26643 | P2-B dragging (list) over folders | drift-fixed | row ghost 210×38 + `1 item`; same chrome |
| 3708:20650 | P2-C Delete hero-dark.jpg? | drift-fixed | `Used in 1 site placement…` · Cancel · Replace instead · Delete permanently; live-3708-20650 |
| 3708:21082 | P2-C Delete chef-intro.mp4? | drift-fixed | same modal per type |
| 3708:22372 | P2-C Delete Inter-Var.woff2? | drift-fixed | same modal per type |
| 3701:20385 | P2-C Delete 2 selected files? | drift-fixed | `fresh-verify.webp (unused) and pasta-closeup.webp (1 use) … This affects 1 placement.`; live-3701-20385 |
| 3708:20446 … 3708:22384 | P2-C Deleted · <file> ×10 | drift-fixed | rail cleared, count 24 → 23, Undo toast kept (code); live-3708-20446. Toast now names the file in full (`Deleted "hero-dark.webp".` — it read the engine's stem) |
| 3701:20353 | P2-C Rename hero-dark.jpg | drift-fixed | modal, full filename, Save disabled until changed; row + rail update; live-3701-20353 |
| 3701:20400 | P2-C A file with that name exists | drift-fixed | Edit name returns with the typed value; live-3701-20400 |
| 3701:20394 | P2-C Download prepared | drift-fixed | modal after bulk Download; live-3701-20394. FOUND: Download NAVIGATED the editor to the raw Blob URL (cross-origin `download` ignored) — fixed in the engine (fetch → object URL) |
| 3705:20396 | P2-D List · chef-intro.mp4 selected | drift-fixed | one checked = the file's FULL rail (video preview · meta · USED IN · **Insert to canvas primary** · Rename · Replace across site… · Delete, no Edit image) — displaces Phase 1's 3695:20154 `1 asset selected` hint (later section wins); Insert is primary in the full rail everywhere. Not conformed: the board's ALT TEXT block on a video (Phase 1: img-only); VERSIONS block = the duplicate-stem heuristic; live-3705-20396 |
| 3705:20617 / 20838 / 21280 | P2-D List · png / svg / jpg selected | match | Insert (primary) · Edit image · Rename · Replace across site… · (Optimize for rasters) · Delete |
| 3705:21059 | P2-D List · Inter-Var.woff2 selected | drift-open | `Aa Bb` · Rename · Delete only; `Manage font` absent — Site fonts overlay is Phase 5 |
| 3720:20491 / 3720:20730 | 2 / 4 columns · no selection | match (Phase 1) | |
| 3711:20473 | QA checkpoint (reference) | out-of-scope | text in phase1-journeys |

## Notes

- **Contradictions decided** (later Clone frame wins): footer during a drag keeps the count · quota after the hint (all three drag shots draw both); the ghost badge reads `1 item` for a single drag (4207/4220 draw it); Insert to canvas is primary in every full rail (3695:20340 outlined it, 3705:20396 + 4207:26629 fill it); the Move modal offers folders only — unfiling is a drop on All assets.
- **Found on the walk, fixed:** root scope = the whole library (was unfiled-only); SMART counts library-wide; Undo toast full filename; stale drag ghost after a row-unmounting drop; Download navigating the editor (P2-C).
- **Open, not Phase 2:** `Manage font` (Phase 5); ALT TEXT on video/svg rails (Phase 1 chose img-only); with ≥2 files checked a context-menu Delete on an unchecked file cannot show the replace picker from `Replace instead` (the rail is the bulk branch) — N=1 is fixed by the full-rail change; duplicate-stem uploads read as VERSIONS (pre-existing heuristic).
- **Not verified:** Chrome's native `setDragImage` snapshot (browse has no Input CDP; the ghost element was measured and shot in the DOM instead).
- Tests: 62 files / 560 tests green in `src/editor/media` + `src/editor/sidebar/tabs/media`; `tsc --noEmit` clean; `verify:ds` exit 0.
