# Assets · Clone Phase 6 — Image editor · versions · replace results — agent brief

Source: Figma page `Editor v1 Clone` (3397:13062). The editor and its outcomes live in
the scrimmed-dialog section `4184:26629` (plus `3397:39917` "S3.6 · media ·
image-editor", the editor's base frame, and the QA contract `3697:20354`
"Editing scenarios and implementation contract"). Everything is CACHED — **never
call Figma** (≈166 calls spent today of the 200 shared cap):

- Prototype edges: `docs/design-jobs/CLONE-ASSETS/reactions-p6.json` (`sizes` = frames
  by index with the dialog card's size, `sigs` = `"control|TRIGGER|action @indices"`).
- Screenshots (1024-wide renders of 1440×900 frames):
  `docs/design-jobs/CLONE-ASSETS/shots/<nodeId with ':'→'-'>.png` for every id below
  except 4155:26562, 3707:20396, 3707:20466, 3724:43520, 3724:43535 (states of the same
  controls — read the neighbouring shot).
- The QA contract (verbatim): *"Proposed contract: Save creates a version; applying to
  site is separate. … Validation: positive whole pixels only; reject zero, negative,
  nonnumeric and values above the configured processing limit. Limit value must come
  from backend capability, not be invented in design."*

## Ground rules (founder decisions, grilling 2026-09-13 — same as Phases 1–5)

- **Clone wins** over the V1 board it re-draws (S3.6 1124:4527 editor, 1174:4849
  replace-across result states, the rail's VERSIONS block). Where two Clone frames
  disagree the LATER section wins. **Behaviour → code contract; visual/copy → the
  board.** Sample data (hero-dark.jpg, 2400 × 1600, 840 KB, "3 uses on Home and Menu",
  "Generated QA sample") is SHAPE, never literal.
- **Density 32**; dialogs: title 16/600, body 13 ink-soft, buttons 32, gap 8, radius
  token. Widths from the shots: the editor **960 × 740**; versions **640**; apply-across
  confirm **560**; result dialogs **640**. `components/libraryModal.ts` holds the shared
  modal sizing — reuse it (`MoveAssetsModal.tsx`, `StockSavedModal.tsx`,
  `SiteFontsModal.tsx` are finished Clone-style modals to copy the shape of).
- **No backend.** `media.updateAsset` accepts `userMetadata: record` (Phase 3 rides
  `tags` on it, Phase 5 `siteFont`); `media.createAssetVersion` / `listAssetVersions` /
  `restoreAssetVersion` exist (`services/MediaVersionService.ts`). The upload route
  turns EVERY Blob upload into a library asset row — that is a fact to design around,
  not to change.
- Chrome rules: `@/editor/chrome-ui` only; no raw form elements (Gate 24); no hex / raw
  shadow; `tw:` utilities not new CSS (the styling ratchet refuses growth); `--bk-*`
  tokens; two-class selectors when overriding a flowbite Button.
- Tests: Vitest + RTL, co-located `__tests__/`; fixtures in
  `packages/editor/src/editor/media/__tests__/libraryFixture.tsx`. Failing test first;
  rewrite any test protecting displaced copy in the same commit, naming the Clone node.
- Run before every commit: `npx vitest run <your suites> && npx tsc --noEmit` from
  `packages/editor`, `pnpm run gate:styling-ratchet`, the Gate-24 script
  (`grep -n "gate:" package.json`). Commit per journey: `J-<nodeId>: implemented — <what>`.
  No dev servers, no browser, no Figma, no push.
- Never touch `packages/editor/src/editor/shell/AquibraStudio.tsx` (founder's
  uncommitted edits — plumbing goes through `StudioPanels.tsx` / `StudioModals.tsx` or a
  composer event) or `packages/editor/scripts/baselines/ssot.json` (a gate rewrites it —
  restore, never commit).

## The version model (decided — build to this)

Today a saved edit becomes a NEW library asset named `<stem>_v1234.<ext>` and the rail
groups "versions" by that stem (a heuristic that also groups two unrelated uploads of
the same name). The Clone's model: **Save creates a version of the SAME asset;
applying it to the site is a separate, explicit step.**

- The edited file still lands through the upload pipeline (a Blob upload always makes
  a row), so a version IS a library asset row — flagged `userMetadata.versionOf =
  <parent asset id>` (mirrored the way `tags` / `siteFont` are: `MediaAsset.versionOf?:
  string`, `MediaManager.updateAsset` merges `{ tags, siteFont, versionOf }`, read back
  on import). Rows carrying `versionOf` are **hidden from the grid, counts, search and
  the pickers**; they are reachable only through their parent's versions.
- `versionsOf(parent)` = `[parent (v1 · Original), ...children by createdAt]` — the
  latest child is `vN · Latest saved`. The stem heuristic is deleted. The asset's own
  `src` stays the original until a version is applied.
- **Apply latest saved version across site** = `composer.mediaOps.replaceAcross(parent.src,
  version.src)` (the placements) — the parent asset's src is NOT swapped (the Clone:
  "The original and prior saved version remain available"); the rail's USED IN follows
  the placements. Best-effort server history: after a save also
  `createAssetVersion({ assetId: parent.assetId, url: version.src, bytes, edits })` when
  the parent is synced — never block the save on it.
- Save failure (the upload rejects) → the failure dialog; the editor keeps its draft.

## Screens by journey

| journey | screens |
|---|---|
| **P6-X Editor** | 3397:39917 base · 3695:43788 jpeg · 4155:26562 png · 3695:43236 crop · 3695:43319 adjust · 3695:43403 resize · 3695:43480 optimise · 3695:43547 unlocked · 3695:43624 invalid · 3695:43705 flipped · 3707:20396 1:1 · 3707:20431 16:9 · 3707:20466 Flip V · 3707:20501 Rotate 90° · 3707:20536 Zoom 150% · 3724:43505/43520/43535/43550 Adjust representative values · 3681:19920 Adjust · 3681:19973 Resize · 3681:20026 **Saved** · 3695:45549 **discard** · 3695:45542 **failure** |
| **P6-V Versions** | 3695:45529 Asset versions · 3697:20326 original selected · 3697:20341 v2 applied · 3695:45615 Apply saved version across site · 3720:43313 Applying · 3720:43316 Saved version applied · the rail's VERSIONS block (3697:20326's list) · the save path |
| **P6-R Replace results** | 3695:43897 Replacing image · 3695:43900 Replacement complete · 3695:43903 Some uses could not update · 3695:43906 Retrying failed use |

## Copy on the shots (shape = contract)

### P6-X — the editor (960 × 740)
- Head: `Edit image` (16/600) · `hero-dark.jpg · 2400 × 1600` (the file's library name ·
  its intrinsic size) · tab row `Crop · Adjust · Resize · Optimise` (32-high chips, the
  active one accent-tinted). Body: LEFT the preview well (the image inside a dashed
  frame; under it a mono status `1600 × 1200 · Free · WebP` = output size · crop preset
  · output format, and `Reset all` at the right) — RIGHT the active tab's controls.
  Foot: `Your draft stays with you across tabs. Save creates a version; site placements
  stay unchanged.` · `Cancel` · `Save version` (primary; disabled while the resize is
  invalid or nothing changed — say which you chose).
- **Crop**: `Aspect ratio` chips `Free · 1:1 · 4:3 · 3:2 · 16:9` · `Rotation` slider with
  the value (`0°`) and `↺ 90°` / `↻ 90°` · `Flip` `Horizontal` / `Vertical` (pressed when
  on) · `Zoom` slider with `100%` and the hint `Drag the image in the preview to
  reposition.` (3707:20536: 150%).
- **Adjust**: sliders `Brightness` `Contrast` `Saturation` (value `0`) `Blur` (`0px`) ·
  `Preset` chips `None · B&W · Sepia · Cool · Warm · Vibrant`. The four "representative
  values" dialogs (-10 / 0 / +10, 0 / 4 / 8 px) are the prototype's stand-in for the
  sliders — the sliders are the contract; make sure those values are reachable.
- **Resize**: `Width` / `Height` fields · `Aspect ratio locked` (full-width primary
  toggle; `Aspect ratio unlocked` secondary when off — 3695:43547) · `Scale` chips `25% ·
  50% · 75% · 100%` · `The original 1600 × 1200 file is kept. Resizing only affects the
  new version.` **Invalid** (3695:43624): both fields error-outlined, line `Maximum is
  8000 × 8000 px. Enter a smaller size to continue.` in error ink, Save disabled. The
  limit is the code's: add `MAX_IMAGE_EDIT_DIMENSION` to `shared/constants/media.ts`
  (one number, documented as the canvas-processing cap this editor enforces — the QA
  says the number must come from the code, not the design); reject zero, negative,
  non-numeric, above the cap.
- **Optimise**: `Format` chips `WebP · JPEG · PNG` · `Quality` slider (`85`) · a box
  `Original · 840 KB` / `Estimated · 492 KB (-41%)` (green when smaller) · `File size is
  an estimate until the version is saved.` Reuse `OptimizationPanel`'s estimation and
  encoding; the panel itself is displaced by this tab (delete it if nothing else opens
  it — the library's `Optimize` rail action should open the editor on this tab).
- **Saved** (3681:20026): the same card, no tab row; LEFT the saved preview + status;
  RIGHT `Version saved` (green 600) · `Version saved. Original retained. Not yet applied
  to site.` · a summary list `Width: 2400 · Height: 1600 · Crop: Original · Preset:
  Original · Format: Original · Transform: Original · Brightness: 0 · Contrast: 0 ·
  Saturation: 0 · Blur: 0` (the edits snapshot, "Original" where untouched). Foot: `To
  update site placements, use Replace across site from asset details.` · `‹ Back to
  editor` · `Done` (primary → the host's `onDone(version)`; P6-V opens Asset versions).
- **Discard** (3695:45549, 640): on Cancel with a dirty draft: `Discard changes?` ·
  `Your edits to hero-dark.jpg have not been saved.` (read the shot for the exact
  line) · `Keep editing` · `Discard changes` (danger/primary per the shot). Cancel on a
  clean draft closes at once.
- **Failure** (3695:45542, 640): the save rejected: title · body (read the shot) ·
  `Continue editing` · `Retry save` (primary).
- The editor exposes to its host: `onSave(dataUrl, edits: EditsSnapshot)` returning a
  promise (rejects → failure dialog), `onDone(version)` after Saved.

### P6-V — versions
- **Asset versions** (3695:45529, 640): title · `hero-dark.jpg · Original retained` · a
  card per version, newest first: `v2 · Latest saved · 2400 × 1600` / `Not applied to
  site` / `Crop: Free · Preset: None · Format: Original` / `Brightness: 0 · Contrast: 0 ·
  Saturation: 0 · Blur: 0` (from the saved edits snapshot); `v1 · Original · 2400 × 1600`
  / `Currently used on Home and Menu · 3 placements` (from `getUsages`). The selected
  card carries the accent border (3697:20326 = v1 selected: its own actions). Footer:
  `Close` · `Edit latest saved version` (opens the editor on that version's file) ·
  `Apply latest saved version` (primary → the confirm). 3697:20341 (v2 applied): v2's
  line reads `Applied to site · 3 placements`, v1's `Not on site`.
- **Apply saved version across site** (3695:45615, 560): title · `Update 3 uses on Home
  and Menu to the latest saved version. The original and prior saved version remain
  available.` · `Cancel` · `Apply to 3 uses` (primary; `Apply to 1 use`). Nothing to
  apply (0 uses) → the primary is disabled with the reason.
- **Applying saved version** (3720:43313, 640 × 108): a progress line while
  `replaceAcross` runs (`Applying to 3 uses…`).
- **Saved version applied** (3720:43316): title · `3 of 3 uses updated` / `Home: 2
  updated · Menu: 1 updated` / `Other elements are unchanged.` · `Done` · `View versions`
  (→ Asset versions, v2 now applied).
- **Rail VERSIONS block** (the Phase-1 rail): lists `versionsOf(selected)` — `v2 · Latest
  saved` / `v1 · Original` with the applied marker; the row opens Asset versions.
  Delete the `_v1234` stem heuristic and its `Revert` button (Apply replaces it).
- **Doors**: the editor's Saved → Done; the rail's VERSIONS rows; the drawer keeps its
  own Versions tab (leave `AssetDetailOverlay` alone).

### P6-R — replace-across results (the `Replace across site…` action's own dialogs)
- **Replacing image** (3695:43897, 640 × 108): progress `Replacing 3 uses…`.
- **Replacement complete** (3695:43900): `3 of 3 uses updated` / `Home: 2 updated ·
  Menu: 1 updated` / `Other elements are unchanged.` · `Done`.
- **Some uses could not update** (3695:43903): `2 updated · 1 failed` / `Home: 2 updated`
  / `Menu / Hero image: update could not be saved. The previous image remains.` (per
  failed placement: page / element name) · `Close` · `Retry failed use` (primary → 3695:43906
  `Retrying failed use…` → complete or this dialog again).
- `composer.mediaOps.replaceAcross` returns `{ replaced: ElementId[]; failed:
  ElementId[] }` — the per-page lines come from the elements' pages
  (`composer.elements.getAllPages()` + each element's root, the way `checkInUse` in
  `useSelectionState.ts` does it). P6-V's "Saved version applied" is the same shape
  with a different title — build ONE result component with a `title` prop and let V use
  it (name it `ReplaceResultModal`, export the per-page summary helper).

## Work split (files owned — stay inside yours; a shared file gets the smallest edit)

| agent | journey | owns |
|---|---|---|
| X | P6-X Editor | `media/ImageEditorModal.tsx` (+ split into `image-editor/` files if it passes 600 lines), `media/OptimizationPanel.tsx` (fold or delete), new `media/components/DiscardEditsModal.tsx`, `SaveFailedModal.tsx`, `shared/constants/media.ts` (the edit dimension cap), `engine/media/ImageProcessor*.ts` only if encoding needs a format/quality param, their tests |
| V | P6-V Versions | `shared/types/media.ts` (`versionOf`), `engine/media/MediaManager.ts` (mirror + read-back), `sidebar/tabs/media/hooks/useLibraryState.ts` (hide `versionOf` rows; `versionsOf(key)`), `data/mediaTypes.ts` + `mediaUtils.ts`, `media/LibraryManager.tsx` (the save path: upload → flag `versionOf` → best-effort `createAssetVersion`; the versions door; Optimize → editor), `media/components/AssetDetailsPanel.tsx` (VERSIONS block), new `media/components/VersionsModal.tsx`, `ApplyVersionModal.tsx`, `services/MediaVersionService.ts` if a field is missing, their tests |
| R | P6-R Replace results | `sidebar/tabs/media/components/ReplaceAcrossDialog.tsx` (or a new `media/components/ReplaceResultModal.tsx` + the page-summary helper), its tests |
| main | Figma cache, merges, live walk, boards.json, report | — |

Contracts between you (build to these, do not wait):
- `ImageEditorModal` props: `imageSrc`, `fileName`, `onClose`, `onSave(dataUrl: string,
  edits: EditsSnapshot): Promise<void>`, `onDone?(): void`, `initialTab?: "crop" |
  "adjust" | "resize" | "optimise"`. `EditsSnapshot` (exported from the editor):
  `{ width, height, crop: string, preset: string, format: string, transform: string,
  brightness, contrast, saturation, blur }` — the Saved summary and the versions
  cards both print it.
- `MediaAsset.versionOf?: string`; `LibraryItem.versionOf?: string`;
  `LibraryStateResult.versionsOf(key): LibraryItem[]` (parent first).
- `ReplaceResultModal` props: `{ open, title, replaced: ElementId[], failed:
  ElementId[], onRetry?(failed): Promise<…>, onDone, onViewVersions? }` and
  `summarizeByPage(composer, ids): Array<{ page: string; count: number }>`.

## Report format (end of your work)

```
Branch: <name>   Commits: <n>
Screens: <id> match | drift-fixed | drift-open (<why>) | blocked:<reason>
Contradictions decided: <which frame won, why>
Tests: <files> green, tsc clean
data-testids added: <list — the live walk drives them>
Not done / needs the live walk: <list>
```
