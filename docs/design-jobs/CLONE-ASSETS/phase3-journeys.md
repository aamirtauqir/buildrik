# Assets · Clone Phase 3 — Upload · Import URL · Stock · Menu & tags — walk log

Brief: `phase3-brief.md`. Sources: sections `3721:43502`, `3721:43517`, the CURRENT
DESIGN frames in `3397:16873`, overlays in `4184:26629`. Graph: `reactions-p3.json`.
Shots: `shots/`. Figma calls this phase: 3 census/graph + 28 shots (≈124 today).

## Live env

Same as Phase 2 (`phase2-journeys.md` § Live env): unified editor on `scratch-ver`,
1440×900, Blob token present. `PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY` absent —
stock RESULTS are `blocked:env`; the not-configured state is walkable.

## Work split

| agent | journey | files owned |
|---|---|---|
| U | P3-U Upload — library modals, drag-over, drawer rejected → replacement | `LibraryManager.tsx` (upload), `UploadFilesModal.tsx`, `UploadCompleteModal.tsx`, `SlimLauncher.tsx`, `UploadZone.tsx`, `ReplacementUploadModal.tsx`, `useUploadState.ts` |
| I | P3-I Import URL · Stock · picker | `ImportUrlModal.tsx`, `ImportResultModal.tsx`, `StockSourceModal.tsx`, `StockSavedModal.tsx`, `MediaLibraryPanel.tsx`, `useDiscoveryState.ts` |
| T | P3-T Menu & tags — card ··· menu, menu-move, tag filter + writer + mirror | `useLibraryState.ts`, `FolderTree.tsx`, `AssetGrid.tsx`, `AssetDetailsPanel.tsx`, `MediaContextMenu.tsx`, tags mirror (`AssetUploadService.ts`, `BuildrikSyncProvider.ts`, `MediaManager.ts`) |
| main | Figma cache, merges, live walk, boards.json, report | — |

## Drift table

| screen | journey | verdict | note |
|---|---|---|---|
| 3397:18137 | P3-U drag-over · uploading | drift-fixed | dashed accent zone a gutter in from the column's edges, centred card `Drop files to upload` + the code's format list and limits; rail + top bar stay; drop uploads into the scope; live-3397-18137 |
| 3724:20828 | P3-U Upload files modal | drift-fixed | 640; one line per file `<name> · JPG · 90.3 KB`; a refused file's reason in place and excluded (17 MB JPG → `the limit is 10 MB per file`); `Ready to upload to this site library.` · Cancel · Upload file; % + bar while uploading; live-3724-20828 |
| 3724:20832 | P3-U Upload complete | drift-fixed | `<name> is now in your library.` · hint · Done (primary) · View asset → rail. FOUND: named the picked JPG over a rail printing the landed WebP — names the library's file now; live-3724-20832 |
| 3584:45522 | P3-U drawer · Upload rejected | drift-fixed | `Upload failed — file is 17 MB, the limit is 10 MB per file` · `Choose a smaller file…`. FOUND: legacy flex-row rules centred the name and ran the reason off the band → flush-left column, orphaned rules deleted; live-3584-45522 |
| 3585:23326 | P3-U Upload this replacement file? | drift-fixed | 560; `<name> · 90.3 KB` · `JPG image · Within the 10 MB limit. The original 17 MB file was not uploaded.` · Upload file (full width) · Cancel; live-3585-23326 |
| 3584:45876 | P3-U drawer · uploading | match | name · `75%` · accent bar. Board's ✕ drift-open — the pipeline has no cancel |
| 3585:23337 | P3-U drawer · Replacement uploaded | drift-fixed | banner `<name>` · `Uploaded · WEBP · 83.8 KB · In site library` · `Manage in full library` → fullpage with the file selected. FOUND: named the picked JPG — the stored name now; live-3585-23337 |
| 3437:36027 | P3-U drawer baseline (Build · Choose media) | drift-fixed | `Manage assets ↗` under the header; footer `↑ Upload · Stock · Icons` on one line (FOUND: `Browse stock` wrapped the row at 280) · the code's limits line. Left: title `Media`, no `Aa Fonts` door; live-3437-36027 |
| 3397:18835 | P3-I Import image from URL | drift-fixed | 640, board copy, 32 field, Import image gated + busy; a Blob-hosted JPG imported live; live-3397-18835 |
| 3695:43873 | P3-I Image imported | drift-fixed | `<file> · Image` / `Added to your library · Not used on this site.` · Done · View asset → rail. FOUND: printed the engine's stem — display name now; live-3695-43873 |
| 3695:43876 | P3-I Image could not be imported | drift-fixed | the real accept set (LIBRARY_KINDS — FOUND: listed audio formats the library has no bucket for) · Cancel · Edit URL keeps the URL; live-3695-43876 |
| 3695:45569 | P3-I Stock assets | drift-fixed / results `blocked:env` | 640, board copy, search, Photos · Videos · Icons, one selects, Cancel · Save to library; Insert removed. No provider key → not-configured state walked; FOUND: that failure blanked the Icons source (engine list) — scoped to provider sources; live-3695-45569, live-stock-notconfigured |
| 3695:45573 | P3-I Stock image saved | drift-fixed | `user.svg is now in your asset library.` · hint · Done · View asset → rail (FOUND: printed `user`); live-3695-45573 |
| 3397:18325 | P3-I Choose an image (picker) | drift-fixed; subtitle drift-open | 720, segmented tabs (active filled), Search library, 3-col cards with usage, hint from the gate's tables, Cancel · Use selected image gated. FOUND: cards printed stems. `For <element>` needs the element's name — lives in the Layers panel's custom-name map, not the engine; live-3397-18325 |
| 3685:19960 | P3-I Picker upload | drift-fixed | `<name> · Ready to upload` · Upload image; live-3685-19960 |
| 3685:20037 | P3-I Picker upload complete | drift-fixed | lands on Library selected + `Image added · <name> selected. Use it to update this image element.`; Use → element src updated (one run saw it not apply with the canvas selection cleared — not reproduced twice after; harness suspected); live-3685-20037 |
| 3721:45102 | P3-I Image picker · imported selected | drift-fixed | From URL opens the import dialog over the picker; lands selected; live-3721-45102 |
| 3695:43921 | P3-I Image picker · team selected | match | click selects, stays open |
| 3721:45178 / 3721:45511 | P3-I Canvas · imported / stock image applied | match | Use selected image → element src, picker closed, selection kept; live-3721-45178 |
| 3721:45823 | P3-I Asset details dialog | drift-open (decided) | not built — View asset = the rail / the picker's Library tab; its sub-dialogs say "Prototype preview only" |
| 3721:45924 / 45933 / 45942 | Asset URL · Alt text · No site references | out-of-scope | prototype placeholders ("Prototype preview only … require the application") |
| 3721:43552 | P3-T Unused · browse (card ··· menu, band) | drift-fixed | band `29 unused assets · No current site references.`; 24 white `···` on hover opens the card menu anchored under it. FOUND: chrome-ui `IconButton` never merged its classes (size=sm rendered 32 + transparent) → twMerge; live-3721-43552 |
| 3721:45952 / 3721:45960 | P3-T Move from the menu · team photo moved | drift-fixed | `Move 1 asset` modal; count line `Unused · <file> moved`, Products 0 → 1, rail untouched, no bulk selection; live-3721-45952/45960 |
| 3721:43697 / 43902 / 44107 | P3-T Tag menu / team / food | drift-fixed | rail TAGS block writes (`Menu` → `menu`), `media.updateAsset` 200 with `userMetadata.tags`, listAssets returns them, chips survive reload; chip → pressed + token `Tag: menu · Clear filter ×` + `1 matching asset · Tag: menu`; × clears; chip × removes a tag. C3 closed; live-3721-43697 |
| 3721:44843 | P3-T Canvas · New image inserted (from a tag scope) | match | Insert from `Tag: team` inserts + selects, library closes; live-3721-44843 |

## Notes

- **Contradictions decided:** `Manage assets ↗` sits under the drawer header (3584/3585 win over 3437:36027); the drawer's ↑ Upload stays direct (no confirm drawn there); footer door `Stock`, CTAs keep `Browse stock`; the picker's active tab is filled accent (later frames); fonts / orientation / colour / provider pills dropped from Stock (no room, no consumer); the code keeps the scope a menu move ran from (3721:45960 jumps to Products).
- **Found on the walk, fixed:** four dialogs named the picked file or the engine's stem over a rail printing the stored WebP; the drawer footer wrapped; the rejected row's legacy flex-row rules; the refusal listing audio; the photo failure blanking the Icons source; `IconButton` not merging classes (chrome-ui, pre-existing); two agents' duplicate accept-copy helpers folded into `shared/constants/media.ts`.
- **Blocked / open:** stock photo & video results `blocked:env` (no `PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY`); drawer uploading ✕ (no engine cancel); picker subtitle `For <element>` (element names live in the Layers panel, not the engine); 3721:45823 Asset details dialog by decision; the drawer's `Aa Fonts` door (Phase 5).
- **Not verified:** stock results with a real key; a non-CORS image host on import (reads "could not be imported" — pre-existing).
- Tests: 105+ files green across `src/editor/media`, `src/editor/sidebar/tabs/media`, `src/engine/media`, `src/services`, `src/editor/chrome-ui`; `tsc --noEmit` clean; `verify:ds` exit 0.
