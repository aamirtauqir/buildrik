# Assets · Clone Phase 2 — Organisation & actions — agent brief

Source: Figma page `Editor v1 Clone` (3397:13062), section `3695:45625`
"CURRENT · Assets organisation and actions · audit fixes" (25 screens) plus
the overlays it opens (in "Dialog overlays · scrimmed"). Everything you need
is CACHED — **never call Figma** (200-call daily cap, shared; 56 spent):

- Prototype edge graph: `docs/design-jobs/CLONE-ASSETS/reactions-3695-45625.json`
  (`sigs`: `"control|TRIGGER|action" → [screen indices]`; `screens` lists the indices).
- Screenshots (1024×640 renders of 1440×900 frames, scale 0.711):
  `docs/design-jobs/CLONE-ASSETS/shots/<nodeId with ':'→'-'>.png`. Read them with
  the Read tool. The Phase-1 walk log `phase1-journeys.md` records what the
  library already conforms to (header, grid, rail, bulk mode, search, sort).

## Ground rules (from the founder's decisions, grilling 2026-09-13)

- **Clone wins** over the V1 (1:3) board it re-draws. Where two Clone frames
  disagree, the LATER section wins ("organisation and actions · audit fixes"
  is later than "selection and browsing"). Record any such call in your report.
- **Density 32**: controls 32px, rows 28/32 (DESIGN.md compact). The Clone's
  44px controls are refused. Modals: title 16/600, body 13 ink-soft, buttons
  32, gap 8, radius token, width ~560 (the shots' 400×~170 at 0.711 ≈ 560 real).
- **Behaviour → code contract; visual/copy → the board.** Sample data
  ("hero-dark.jpg", "24 files", "Campaign images") is SHAPE, never literal.
- **No backend.** tRPC / service / Prisma untouched. If a screen needs it,
  write it in your report as `blocked:<reason>` and build the editor half.
- Chrome rules: import UI only from `@/editor/chrome-ui` (Modal = `ModalRoot`
  / `ModalContent` / `ModalTitle` / `ModalBody` / `ModalClose`; buttons =
  `Button`); no raw `<button>/<input>/<select>/<textarea>` in chrome (Gate 24);
  no hex, no raw box-shadow, `var(--bk-*)` tokens only; `tw:`-prefixed
  Tailwind utilities; `--bk-size-row` (32px), `--bk-size-nav` (240px),
  `--bk-text-11/12/13/14/16`, `--bk-space-4/8/12/16/24`. Two-class CSS
  selectors when overriding a flowbite Button's own `tw:h-10`/`tw:px-4`
  (a single-class rule ties and loses on source order).
- Existing code to build on: `packages/editor/src/editor/media/LibraryManager.tsx`
  (orchestrator), `components/FolderTree.tsx`, `components/AssetGrid.tsx`,
  `components/AssetDetailsPanel.tsx`, `components/ImportUrlModal.tsx` (a
  finished Clone-style modal to copy the shape of), `LibraryManager.css`;
  state in `packages/editor/src/editor/sidebar/tabs/media/hooks/` (`useMediaState`
  composes `useLibraryState`, `useSelectionState`, `useUploadState`,
  `useDiscoveryState`); confirm dialog `sidebar/tabs/media/components/ConfirmDeleteModal.tsx`;
  rename overlay `sidebar/tabs/media/components/AssetDetailOverlay.tsx`.
- Tests: Vitest + RTL, co-located `__tests__/`. Shared builders in
  `packages/editor/src/editor/media/__tests__/libraryFixture.tsx`
  (`makeMediaState`, `TEN`, `makeComposer`) — add any new `MediaStateResult`
  field there too. Write the failing test first. Rewrite any old test that
  protected the displaced V1 copy, in the same commit, with a comment naming
  the Clone node id.
- Run before every commit: `npx vitest run src/editor/media src/editor/sidebar/tabs/media`
  and `npx tsc --noEmit` (from `packages/editor`). Commit per journey:
  `J-<nodeId>: implemented — <what changed and why>`. Do NOT run the dev
  servers or a browser — the live walk is done centrally afterwards.
- Never touch `packages/editor/src/editor/shell/AquibraStudio.tsx` or
  `packages/editor/scripts/baselines/ssot.json`.

## Screens by journey

| journey | screens | overlays |
|---|---|---|
| **P2-A Folders** | 3698:20337 Products scope · 3698:20541 Hero shots · 3698:20745 Icons · 3698:20949 Recent · 3698:21153 In use · 3700:20353 Campaign images · empty folder created | 3700:20347 New folder · 3700:20350 Folder name already exists |
| **P2-B Move & drag** | 3699:20381 Moved to Hero shots · 3683:19964 2 files moved to Products · 4207:26629 / 4215:26635 / 4220:26643 dragging over folders (grid, 2 items, list) | 3683:19950 Move 2 assets · 3699:20347 Files could not be moved |
| **P2-C Delete · Rename · Download** | 3708:20446 … 3708:22384 Deleted · <file> ×10 (the library after a delete) | 3708:20650 Delete hero-dark.jpg? · 3708:21082 (mp4) · 3708:22372 (woff2) · 3701:20385 Delete 2 selected files? · 3701:20353 Rename hero-dark.jpg · 3701:20400 A file with that name exists · 3701:20394 Download prepared |
| **P2-D List selected per type** | 3705:20396 chef-intro.mp4 · 3705:20617 menu-cover.png · 3705:20838 logo-mark.svg · 3705:21059 Inter-Var.woff2 · 3705:21280 terrace-night.jpg | — |
| done in Phase 1 | 3720:20491 / 3720:20730 (2 / 4 columns · no selection) | — |
| reference | 3711:20473 QA · Implementation checkpoint (text in `phase1-journeys.md` § notes) | — |

## Copy on the shots (shape = contract)

- **New folder** modal: title `New folder` · label `Folder name:` · input · `Cancel` · `Create folder` (primary).
- **Folder name already exists**: title `Folder name already exists` · `Products already exists. Choose a different name. Your assets have not changed.` · `Cancel` · `Use Campaign images` (primary = use the next free name, e.g. `Products 2`).
- **Empty folder** (grid area, not a modal): H `Campaign images` · `Folder created · No assets yet` · `Upload files or move existing assets into this folder.` · `Upload files` (primary).
- **Folder scope**: rail row active (tint), count line `N files · <Folder>` (done in Phase 1), grid filtered.
- **Move 2 assets** modal: title `Move 2 assets` · `hero-dark.jpg is in Hero shots; chef-intro.mp4 is unfiled. Choose a destination.` · one full-width secondary button per folder · `Cancel`.
- **Moved to Hero shots** (rail, selection kept, bar `2 selected` stays): H `Moved to Hero shots` · `chef-intro.mp4 moved; hero-dark.jpg was already here. Site placements are unchanged.` (or `2 assets moved successfully. Their existing site placements are unchanged.`) · file list · `View destination` (primary → scope that folder) · `Clear selection`.
- **Files could not be moved**: title · `No files moved. Your selection and current folders are unchanged. Try again.` · `Cancel` · `Retry` (primary).
- **Dragging** (4215:26635): ghost = stacked row(s) with `2 items` badge; every folder row gets a dashed outline; hovered target tinted; rail dimmed; footer left reads `Drop 2 files on a folder to move them · release outside to cancel` (singular: `Drop on a folder to move · release outside to cancel`).
- **Bulk rail, ≥2 checked** (4215:26635): H `2 assets selected` · `Actions apply to both selected files. Moving files only changes library organisation.` · `Move to folder` (primary) · `Clear selection`.
- **Bulk rail, 1 checked** (3705:21059 — LATER section, wins over Phase 1's 3695:20154): the FULL details rail of that one file (preview · meta · USED IN · its actions), not the "1 asset selected" hint.
- **Delete <file>?** (single): title `Delete hero-dark.jpg?` · `Used in 3 site placements. Deleting this file permanently breaks those elements. Replace the file instead if you want to preserve them.` · `Cancel` · `Replace instead` (opens the replace-across picker) · `Delete permanently` (danger). For an unused file the middle sentence is absent and there is no `Replace instead`.
- **Delete 2 selected files?** (bulk): `hero-dark.jpg (3 uses) and chef-intro.mp4 (1 use) will be permanently deleted. This affects 4 placements.` · `Cancel` · `Delete 2 files` (danger).
- **Deleted · <file>**: library without it, rail back to `Select an asset to see details.`, counts updated. The shipped Undo toast stays (code: data-safety door).
- **Rename hero-dark.jpg**: title · `Changing the file name will not move or replace its site usages.` · input holding the full filename (`hero-home.jpg`) · `Cancel` · `Save name` (primary).
- **A file with that name exists**: `Choose a different file name. The original file name has not changed.` · `Cancel` · `Edit name` (primary → back to the rename modal).
- **Download prepared**: `The selected file or selected-file archive is ready. Your assets and site placements are unchanged.` · `Done` (primary).

## Report format (end of your work)

```
Branch: <name>   Commits: <n>
Screens: <id> match | drift-fixed | drift-open (<why>) | blocked:<reason>
Contradictions decided: <which frame won, why>
Tests: <files> green, tsc clean
Not done / needs the live walk: <list>
```
