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
| 3397:18137 | P3-U drag-over · uploading | | |
| 3724:20828 | P3-U Upload files modal | | |
| 3724:20832 | P3-U Upload complete | | |
| 3584:45522 | P3-U drawer · Upload rejected | | |
| 3585:23326 | P3-U Upload this replacement file? | | |
| 3584:45876 | P3-U drawer · uploading | | |
| 3585:23337 | P3-U drawer · Replacement uploaded | | |
| 3437:36027 | P3-U drawer baseline (Build · Choose media) | | |
| 3397:18835 | P3-I Import image from URL | | |
| 3695:43873 | P3-I Image imported | | |
| 3695:43876 | P3-I Image could not be imported | | |
| 3695:45569 | P3-I Stock assets | | |
| 3695:45573 | P3-I Stock image saved | | |
| 3397:18325 | P3-I Choose an image (picker) | | |
| 3685:19960 | P3-I Picker upload | | |
| 3685:20037 | P3-I Picker upload complete | | |
| 3721:45102 | P3-I Image picker · imported selected | | |
| 3695:43921 | P3-I Image picker · team selected | | |
| 3721:45178 / 3721:45511 | P3-I Canvas · imported / stock image applied | | |
| 3721:45823 | P3-I Asset details dialog | | |
| 3721:45924 / 45933 / 45942 | Asset URL · Alt text · No site references | out-of-scope | prototype placeholders ("Prototype preview only … require the application") |
| 3721:43552 | P3-T Unused · browse (card ··· menu, band) | | |
| 3721:45952 / 3721:45960 | P3-T Move from the menu · team photo moved | | |
| 3721:43697 / 43902 / 44107 | P3-T Tag menu / team / food | | |
| 3721:44843 | P3-T Canvas · New image inserted (from a tag scope) | | |
