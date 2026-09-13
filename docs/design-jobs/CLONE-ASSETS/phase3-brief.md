# Assets · Clone Phase 3 — Upload · Import URL · Stock · Menu & tags — agent brief

Source: Figma page `Editor v1 Clone` (3397:13062). Phase 3 gathers the screens from
four places: section `3721:43502` "Media · Upload import stock · verified return
states", section `3721:43517` "Media · Menu and tag completion", the CURRENT DESIGN
frames inside `3397:16873` "Manage and choose assets · Media" (drag-over uploading,
the drawer's upload-rejected → replacement flow, the picker), and the overlays in the
scrimmed-dialog section `4184:26629`. Everything is CACHED — **never call Figma**
(200-call daily cap, shared; ~124 spent today):

- Prototype edges: `docs/design-jobs/CLONE-ASSETS/reactions-p3.json` — `sizes` lists
  the frames by index (with the dialog card's size where one is drawn), `sigs` are
  `"control|TRIGGER|action @frame indices"`.
- Screenshots (1024-wide renders of 1440×900 frames, scale 0.711):
  `docs/design-jobs/CLONE-ASSETS/shots/<nodeId with ':'→'-'>.png`. Read them with the
  Read tool. Phase 1 + 2 walk logs (`phase1-journeys.md`, `phase2-journeys.md`) record
  what the library already conforms to — do not undo any of it.

## Ground rules (founder decisions, grilling 2026-09-13 — same as Phases 1–2)

- **Clone wins** over the V1 (1:3) board it re-draws (1205:4804 import-url, 1164:4713
  picker, 1163:13948 drag-over, 145:148 upload-failed, 145:96 uploading are all
  re-drawn here). Where two Clone frames disagree, the LATER section wins. Record
  every such call in your report.
- **Density 32**: controls 32px, rows 28/32 (DESIGN.md compact). The Clone's 44px
  controls are refused. Modals: title 16/600, body 13 ink-soft, buttons 32, gap 8,
  radius token. Dialog widths from the shots: 640 (Upload files / complete, Import,
  Imported, Stock, Stock saved), 720 (the picker), 560 (Replacement confirm).
  `components/libraryModal.ts` holds the shared sizing classes — extend it, don't fork.
- **Behaviour → code contract; visual/copy → the board.** Sample data
  ("pasta-2-small.jpg", "62 MB", "50 MB per file", "restaurant interior") is SHAPE,
  never literal. Size limits are the code's (`MEDIA_SIZE_LIMITS`: image 10 MB, SVG
  1 MB, video 100 MB, audio 50 MB, font 5 MB) — say the real numbers.
- **No backend.** tRPC / service / Prisma untouched. `media.updateAsset` already
  accepts `userMetadata: record` and `listAssets` returns the full row, so a tag
  mirror needs no server change. If a screen truly needs the server, write
  `blocked:<reason>` in your report and build the editor half.
- Chrome rules: import UI only from `@/editor/chrome-ui` (Modal = `ModalRoot` /
  `ModalContent` / `ModalTitle` / `ModalBody` / `ModalClose`; buttons = `Button`;
  inputs = `TextInput` / `TextField`; `Tabs` exists); no raw
  `<button>/<input>/<select>/<textarea>` in chrome (Gate 24); no hex, no raw
  box-shadow, `var(--bk-*)` tokens only; `tw:`-prefixed Tailwind utilities (the
  styling ratchet refuses new CSS — Phase 2's last commit moved 75 lines of CSS to
  `tw:` utilities for exactly that reason); `--bk-size-row` (32px), `--bk-text-11/12/13/14/16`,
  `--bk-space-4/8/12/16/24`. Two-class CSS selectors when overriding a flowbite
  Button's own `tw:h-10`/`tw:px-4`.
- Tests: Vitest + RTL, co-located `__tests__/`. Shared builders in
  `packages/editor/src/editor/media/__tests__/libraryFixture.tsx` (`makeMediaState`,
  `TEN`, `makeComposer`, `makeFolder`) — add any new `MediaStateResult` field there
  too. Write the failing test first. Rewrite any old test that protected the displaced
  V1 copy, in the same commit, with a comment naming the Clone node id.
- Run before every commit: `npx vitest run src/editor/media src/editor/sidebar/tabs/media`
  and `npx tsc --noEmit` (from `packages/editor`). Commit per journey:
  `J-<nodeId>: implemented — <what changed and why>`. Do NOT run the dev servers or a
  browser — the live walk is done centrally afterwards.
- Never touch `packages/editor/src/editor/shell/AquibraStudio.tsx` or
  `packages/editor/scripts/baselines/ssot.json` (a gate rewrites the latter — restore
  it, never commit it).

## Screens by journey

| journey | screens | overlays |
|---|---|---|
| **P3-U Upload** | 3397:18137 fullpage · drag-over · uploading · 3584:45522 drawer · Upload rejected · 3584:45876 drawer · uploading · 3585:23337 drawer · Replacement uploaded · 3437:36027 drawer baseline (Build · Choose media) | 3724:20828 Upload files · 3724:20832 Upload complete · 3585:23326 Upload this replacement file? |
| **P3-I Import URL · Stock · picker** | 3721:45178 / 3721:45511 Canvas · imported / stock image applied to Menu preview (return states) | 3397:18835 Import image from URL · 3695:43873 Image imported · 3695:43876 Image could not be imported · 3695:45569 Stock assets · 3695:45573 Stock image saved · 3397:18325 Choose an image (picker) · 3685:19960 Picker upload · 3685:20037 Picker upload complete · 3721:45102 Image picker · hero-imported.jpg selected · 3695:43921 Image picker · team selected · 3721:45823 Asset details (see the decision below) |
| **P3-T Menu & tags** | 3721:43552 Assets · Unused · browse (card ··· menu) · 3721:43697 Tag menu · 3721:43902 Tag team · 3721:44107 Tag food · 3721:45960 Products · team photo moved · 3721:44843 Canvas · New image inserted into Home | 3721:45952 Move team-photo.jpg (the P2 Move modal, N = 1, from the card menu) |
| prototype placeholders | 3721:45924 Asset URL · 3721:45933 Alt text · 3721:45942 No site references — their copy says "Prototype preview only … require the application" | out of scope, recorded centrally |

## Copy on the shots (shape = contract)

### P3-U
- **Drag-over** (3397:18137): the whole grid column becomes a dashed accent drop zone (1px dashed `--bk-accent`, tinted fill) with a centred card: `Drop files to upload` (accent, 600) over one line of the accepted formats and the limit — `PNG · JPG · GIF · WebP · AVIF · SVG · MP4 · WebM · MOV · TTF · OTF · WOFF · WOFF2 — up to 50 MB per file` on the board; say what the code accepts (`ALLOWED_MIME_TYPES` / `MEDIA_EXTENSIONS`) and the code's limits. The rail and toolbar stay; dropping uploads into the current scope (already wired: `LibraryManager` `fileDragProps`).
- **Upload files** modal (3724:20828, after the header ↑ Upload's file picker returns): title `Upload files` · one line per file `pasta-2-small.jpg · JPG · 8 MB` · `Ready to upload to this site library.` · `Cancel` · `Upload file` (primary; `Upload N files` when N > 1). A file the code refuses (type/size) reads its reason on its line and is excluded from the count; with nothing uploadable the primary is disabled with the reason.
- **Upload complete** (3724:20832): title `Upload complete` · `pasta-2-small.jpg is now in your library.` (`N files are now in your library.`) · `Not used on this site. Choose the image when you are ready to insert it.` · `Done` (primary) · `View asset` (selects the file in the details rail and closes the modal; absent for N > 1). The modal waits for the upload(s) to finish — show the queue's progress inside it while they run; a failure reads its reason in place (the rail's failed-upload row stays the code's door).
- **Drawer · Upload rejected** (3584:45522, the 280 Media drawer = `SlimLauncher`): the failed row above the footer reads `pasta-2.jpg` · `Upload failed — file is 62 MB, the limit is 50 MB per file` (the REAL sizes and the real limit for that type) · `Choose a smaller file…` (opens the file picker for a replacement).
- **Upload this replacement file?** (3585:23326, 560): title · `pasta-2-small.jpg · 8 MB` · `JPG image · Within the 50 MB limit. The original 62 MB file was not uploaded.` · `Upload file` (primary, full-width) · `Cancel` (text). Confirming uploads it and drops the failed row.
- **Drawer · uploading** (3584:45876): the row `pasta-2-small.jpg` · `62%` · `✕` over an accent progress bar (already the code's shape — verify it matches, fix drift).
- **Drawer · Replacement uploaded** (3585:23337): a banner at the top of the drawer: `pasta-2-small.jpg` · `Uploaded · JPG · 8 MB · In site library` · `Manage in full library` (link → opens the fullpage library with the file selected). The grid's count chip ticks (`image 129`).
- **Drawer baseline** (3437:36027): search · `All ▾` · `☑ Select` · type chips with counts · 2-col cards (STOCK / AI badges where the source says so) · `Showing 200 of 412 · Load more` · `Manage assets ↗` · footer `↑ Upload · Stock · Icons · Aa Fonts` + `Images, videos and fonts · up to 50 MB per file`. Verify the live drawer against it; fix drift you find in the drawer's chrome, note anything you leave.

### P3-I
- **Import image from URL** (3397:18835, 640): title · `Add an image to your library. Importing does not replace an image on the canvas.` · URL field · `Cancel` · `Import image` (primary, disabled until the URL is fetchable — keep the field's own error line for a non-URL).
- **Image imported** (3695:43873): title · `hero-imported.jpg · Image` / `Added to your library · Not used on this site.` · `Done` (primary) · `View asset` (selects it in the rail; in the PICKER context: the Library tab with it selected — 3721:45102).
- **Image could not be imported** (3695:43876): title · `This URL does not return a supported image. Use a direct JPG, PNG, WebP or SVG image URL.` (say the real accepted types) · `Cancel` · `Edit URL` (primary → the import modal again with the URL still in the field).
- **Stock assets** (3695:45569, 640): title · `Browse stock photos and save an image to this site. Your canvas selection stays unchanged.` · search field · results (card: image · title · attribution/source line) with ONE selected · `Cancel` · `Save to library` (primary, disabled until a result is selected). Keep the code's sources (photos / videos / icons / fonts) as the behaviour behind a source switch, drawn to this shape; the not-configured / searching / no-results / search-failed states keep their V1 copy (the Clone keeps them as REFERENCE VARIANTs 3397:18935 / 18533 / 18581 / 18655). `Insert` from stock is gone — stock saves to the library, the canvas is untouched.
- **Stock image saved** (3695:45573): title · `restaurant-interior.jpg is now in your asset library.` / `Not used on this site. Choose it from Assets when you are ready to insert or replace an image.` · `Done` (primary) · `View asset`.
- **Choose an image** — the picker (3397:18325, 720; `MediaLibraryPanel`, opened by the inspector's Choose image): title `Choose an image` · `For Menu preview · Image` (the element it is for) · segmented `Library` / `Upload` / `From URL` (active = filled accent) · label `Search library` · field `Search images…` · 3-column cards (thumb · name · `used ×3` / `Unused`), selected = accent border · hint `PNG, JPG, GIF, WebP, AVIF or SVG · up to 10 MB for this image field.` (the real list + limit for the allowed types) · `Cancel` · `Use selected image` (primary, disabled with nothing selected). **Upload** (3685:19960): the file chosen → panel `pasta-2-small.jpg · Ready to upload` · primary `Upload image`; after it lands (3685:20037): back on Library with the new file selected and the hint line `Image added · pasta-2-small.jpg selected. Use it to update this image element.` **From URL**: opens the Import image from URL modal over the picker; imported → Library with it selected (3721:45102). `Use selected image` → the element updated, picker closed (3721:45178 — already the code's behaviour, verify).
- **Asset details dialog** (3721:45823 — `View asset` in the prototype opens a 640 dialog: filename · Unused · `Image · Added to this site library` · preview · `Back to library` · `Edit image` · `Choose for canvas`). DECISION for you to build to: in the LIBRARY, `View asset` selects the file in the details rail — the rail IS the asset's details, and this dialog's three sub-dialogs (3721:45924 / 45933 / 45942) say "Prototype preview only". Do not build the dialog; write the decision in your report so the walk log records it.

### P3-T
- **Card ··· menu** (3721:43552): a card shows a `···` button top-right on hover/focus; it opens the card's context menu (`MediaContextMenu`: Select · Rename… · Edit image… · Move to folder… · Delete) anchored to the button — the same menu right-click opens.
- **Move from the menu** (3721:45952 → 3721:45960): `Move to folder…` in the menu opens the Phase-2 `MoveAssetsModal` for that one file (`Move 1 asset`), replacing the folder submenu; after the move the count line reads `Products · team-photo.jpg moved` (scope · `<file> moved`), cleared by the next scope/filter change. No bulk selection is created.
- **Unused · browse** (3721:43552): under the toolbar, the Unused scope draws a note band `10 unused assets · No current site references.` (`N unused assets · No current site references.`; the board's "showing 3 sample records" is fixture). Only the Unused scope draws it.
- **Tag filter** (3721:43697 / 43902 / 44107): a TAGS chip is a FILTER, not a search string: the active chip is highlighted; the search field shows the token `Tag: menu · Clear filter ×` (× clears the tag); the count line reads `1 matching assets · Tag: menu` (`N matching assets · Tag: <tag>`); clicking another chip swaps the tag; the folder / smart scope stays and combines with the tag. Search typed while a tag is active searches within the tag.
- **Tags come from somewhere** (BLOCKERS C3): today nothing writes `tags`, so the TAGS section never renders live. Add the writer to the details rail as a `TAGS` block (existing chips with ×, an `Add tag` field, Enter adds, lower-cased, deduped, ≤ 24 chars), mirrored to the server as `userMetadata.tags` through the existing `remoteSync.updateAsset` patch (`AssetUploadService.updateAsset` sends `filename`/`altText` — extend it with `userMetadata`), and read back from `userMetadata.tags` when the library lists server rows (`BuildrikSyncProvider` → `MediaManager` merge). The Clone draws no tag editor — say in your report that the block is the code's addition (authority `code:tag-writer`) so the record is honest.
- **Insert from a tag scope** (3721:44843): Insert to canvas from a tag-filtered grid inserts and returns to the canvas the way Phase 1 does — verify with a test, no new work expected.

## Work split (files owned — stay inside yours; a shared file gets the smallest possible edit)

| agent | journey | owns |
|---|---|---|
| U | P3-U | `LibraryManager.tsx` (upload wiring + drag-over overlay only), new `components/UploadFilesModal.tsx`, `components/UploadCompleteModal.tsx`, `sidebar/tabs/media/components/SlimLauncher.tsx`, `UploadZone.tsx`, new `ReplacementUploadModal.tsx`, `hooks/useUploadState.ts`, `shared/constants/media.ts` (a limit/format-list helper if needed) |
| I | P3-I | `components/ImportUrlModal.tsx`, new `components/ImportResultModal.tsx`, `sidebar/tabs/media/components/StockSourceModal.tsx`, new `components/StockSavedModal.tsx`, `MediaLibraryPanel.tsx` (the picker), `hooks/useDiscoveryState.ts`, `LibraryManager.tsx` (import/stock wiring only), `fetchUrlAsFile.ts` |
| T | P3-T | `hooks/useLibraryState.ts` (tag filter), `components/FolderTree.tsx` (chip state), `components/AssetGrid.tsx` (count line, band, card ··· button), `components/AssetDetailsPanel.tsx` (TAGS block), `sidebar/tabs/media/components/MediaContextMenu.tsx`, `data/mediaTypes.ts`, `data/mediaUtils.ts`, `services/AssetUploadService.ts` + `services/BuildrikSyncProvider.ts` + `engine/media/MediaManager.ts` (tags mirror), `LibraryManager.tsx` (search token + menu-move wiring only) |
| main | Figma cache, merges, live walk, boards.json, report | — |

## Report format (end of your work)

```
Branch: <name>   Commits: <n>
Screens: <id> match | drift-fixed | drift-open (<why>) | blocked:<reason>
Contradictions decided: <which frame won, why>
Tests: <files> green, tsc clean
data-testids added: <list — the live walk drives them>
Not done / needs the live walk: <list>
```
