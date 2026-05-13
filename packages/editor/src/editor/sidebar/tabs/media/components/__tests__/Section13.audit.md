# §13 folder navigation audit (prototype-v3 §13)

## Prototype intent
- Click folder → library shows breadcrumb + contents
- Drag asset onto folder → snap feedback + move on drop
- Right-click folder → Rename / Delete (Delete warns if non-empty)
- Empty folder → drop-zone view

## Current state

### Folder click → breadcrumb + contents

- Folder selection state: **state-field**, lifted into `useLibraryState` —
  `currentFolderId: string | null` + `setCurrentFolderId` defined at
  `hooks/useLibraryState.ts:24` and re-exported through `useMediaState.ts:312-313`
  onto the `MediaStateResult` contract. Folder rail click handler in the
  expanded panel calls it directly: `ExpandedMediaPanel.tsx:224` (All assets)
  and `ExpandedMediaPanel.tsx:234` (per-folder). Setting it triggers the
  `libraryItems` `useMemo` re-filter at `useLibraryState.ts:81-84`
  (`folderByAssetId.get(i.key) === currentFolderId`).

- Library filters by current folder: **Y** — `useLibraryState.ts:72-76`
  builds `folderByAssetId` (Map keyed by asset id → `folderId | null`) and
  `useLibraryState.ts:81-84` filters items where the lookup matches
  `currentFolderId` BEFORE the type/format/search filters. Verified live —
  Section12 test at `__tests__/Section12.test.tsx:14-15` mocks
  `currentFolderId` through the same state slice.

- Breadcrumb component: **N (panel/expanded mode only)** — `grep -rn
  breadcrumb` across `editor/sidebar/tabs/media/` returns zero hits. The
  expanded panel header (`ExpandedMediaPanel.tsx:166-212`) renders
  `<h3>Media library</h3>` + EXPANDED badge + Stock / Compact / Maximize / Close
  buttons. No crumb trail anywhere. The fullpage `LibraryManager.tsx:147-159`
  DOES build a `breadcrumbPath` and render `<div class="mgr-breadcrumb">` at
  `LibraryManager.tsx:260-271` (CSS: `LibraryManager.css:52-68`), but that
  path is the fullpage modal, NOT the sidebar tab panel under audit.

- SlimLauncher (panel-collapsed mode): **does not show folders at all** —
  `SlimLauncher.tsx:58-66` filters only by `activeType` + `searchQuery`. It
  never reads `currentFolderId`. Per `MediaTab.panel-mode.test.tsx:3`,
  "folders sidebar lives only in expanded mode." So in compact 320px mode the
  folder rail (and any §13 affordance) is intentionally hidden.

### Drag asset onto folder

- AssetCell drag handlers: **N** — `AssetCell.tsx:48-91` renders a native
  `<button>` with no `draggable` attribute (only the inner `<img>` is
  explicitly set `draggable={false}` at line 63). Cell consumers in panel /
  expanded paths cannot initiate a drag.

- LibraryView grid cards drag handlers: **N** — `LibraryView.tsx` `med-img-card`
  (line 65), `med-vid-card` (line 173), `med-ico-card` (line 257),
  `med-fnt-card` (line 317) all render plain `<div role="button">` with NO
  `draggable` / `onDragStart`. Only the fullpage `AssetGrid.tsx:338-339,
  358-360` sets `draggable + onDragStart`, and even there the payload
  (`AssetGrid.tsx:311-316`) is the canvas-drop contract
  (`application/x-aquibra-media-*`), not a folder-move payload.

- Folder rail drop handlers: **N** — `ExpandedMediaPanel.tsx:230-238`
  renders each user-folder as a `<Button>` with only `onClick` (folder
  selection). No `onDragEnter` / `onDragOver` / `onDragLeave` / `onDrop`.
  `FolderTree.tsx:91` (fullpage) is the same — no drop wiring on tree nodes.
  The only drag handlers in the media tab are panel-scoped upload drops
  (`MediaTab.tsx:217-220`, `ExpandedMediaPanel.tsx:161-164` →
  `useMediaState.ts` panel-drag* handlers, which forward to
  `useUploadState.ts` for FILE uploads).

- Snap-feedback CSS / state: **N** — `grep -rn "snap\|folder-drop\|
  folder-active\|folder-drag-over"` across `editor/sidebar/tabs/media/` and
  `editor/media/` CSS returns zero hits. The only drag overlay is
  `med-drag-overlay` (`MediaTab.tsx:290`, `ExpandedMediaPanel.tsx:279`) which
  is the panel-wide file-upload affordance.

- Move-on-drop handler: **engine API exists, drop wiring does not** —
  `useLibraryState.ts:186-188` defines
  `moveAsset(assetId, folderId): Promise<void>` which calls
  `composer.media.updateAsset(assetId, { folderId })`. It is already wired
  into the `Move to ▸` submenu of `MediaContextMenu.tsx:113-133` via
  `state.moveAsset(item.key, fid)` at `ExpandedMediaPanel.tsx:293` and
  `MediaTab.tsx:303`. So the engine path is ready — only the drop-event
  binding is missing.

### Right-click folder → Rename / Delete

- Folder right-click handler: **N** — no `onContextMenu` on any folder
  element in `ExpandedMediaPanel.tsx:221-238` or `FolderTree.tsx:91`. The
  only context-menu wiring in the media tab is on ASSET cards
  (`LibraryView.tsx:66, 174, 258, 318`) which route to
  `MediaContextMenu.tsx`. `MediaContextMenu` is hard-coded for `LibraryItem`
  (`MediaContextMenu.tsx:16`), not folders.

- ContextMenu primitive used (for assets): **Y** —
  `MediaContextMenu.tsx:60-145` renders a fixed-position
  `<div class="med-ctx-menu">` with backdrop. Reusable shape but
  asset-specific props (`item: LibraryItem`, `onRename`, `onCopyUrl`,
  `onEditImage`, `onReplaceAcross`).

- Rename action: **N (no folder-rename anywhere)** —
  `composer.media.renameFolder` / `composer.media.updateFolder` **do not
  exist** in the engine. `grep -rn "renameFolder\|updateFolder"
  packages/editor/src/engine/` returns zero hits.
  `MediaManager.ts:1021-1209` exposes only `createFolder` / `deleteFolder` /
  `getFolders` / `ensureProjectFolder`. The `MEDIA_EVENTS.FOLDER_UPDATED`
  constant is declared (`shared/constants/media.ts:95`) but **never
  emitted** by `MediaManager` — only `FOLDER_CREATED` (line 431, 1065) and
  `FOLDER_DELETED` (line 1209) fire. `useLibraryState.ts:54-55, 63-64`
  subscribes to `FOLDER_CREATED` / `FOLDER_DELETED`, ignoring
  `FOLDER_UPDATED`. The `media:folder:updated` listener wired in
  `ExpandedMediaPanel.tsx:148, 152` is dead code today.
  (Pages tab has its own `renameFolder` in `useFolders.ts:53, 110-184`,
   but that's the Pages domain — different folder concept.)

- Delete with non-empty warning: **PARTIAL** — `useLibraryState.ts:156-184`
  ships a textbook two-step flow:
  - `inspectFolder(id)` returns `{ assetCount, subFolderCount }` from
    `composer.media.getAssets({ folderId })` + `composer.media.getFolders(id)`
    (pure, render-safe).
  - `deleteFolder(id, { force? })` throws
    `"FOLDER_NOT_EMPTY: call inspectFolder first, prompt the user, retry
    with force:true"` when not forced.
  Both are returned on the `LibraryStateResult`
  (`useLibraryState.ts:222-223`) and surfaced through `useMediaState`'s
  spread of `library` at `useMediaState.ts:317-320` (folders + moveAsset
  are explicit; `inspectFolder` / `deleteFolder` ride along via the spread
  if `useMediaState.ts` re-exposes them — verify before consuming).
  Engine-level cascade also exists: `MediaManager.ts:1196-1199` orphans
  any assets under the deleted folder to root. **Gap:** no UI consumer in
  panel/expanded mode calls these. The expanded folder rail
  (`ExpandedMediaPanel.tsx:221-238`) renders no delete affordance at all.
  Only fullpage `FolderTree.tsx:184` wires `onDelete={() =>
  deleteFolder(folder.id)}` and even there, it calls without `{force:true}`
  and never catches the `FOLDER_NOT_EMPTY` throw with a real dialog — the
  rejection just surfaces as an unhandled promise.

### Empty folder drop zone

- Empty-folder view: **N (no folder-specific empty state)** — the
  expanded-panel library area always renders `LibraryView`, which shows
  type-section `EmptyState` (`LibraryView.tsx:365-375`,
  rendered at lines 585, 611, 635, 658). Copy comes from `EMPTY_MSGS`
  (`data/mediaData.ts` via `LibraryView.tsx:12`) keyed by asset TYPE, not
  by folder. When the active folder is empty the user just sees the
  per-type "No images" / "No videos" cards with no upload-drop affordance
  and no "Drop files here to add to this folder" copy. The panel-wide
  upload zone is mounted only in fullpage `MediaTab.tsx:281-287`
  (`UploadZone`), NOT inside `ExpandedMediaPanel`. `SlimLauncher.tsx:117-138`
  has a distinct `sl-empty` state for empty-library / filter-no-match but
  no folder-aware variant.

## Gaps

- **Task 22 (breadcrumb header):** MISSING — no breadcrumb component
  exists in `ExpandedMediaPanel` or `LibraryView`. Build a header strip
  above `LibraryView` inside `ExpandedMediaPanel.tsx:242-274` that reads
  `state.currentFolderId` + `state.folders`, computes the parent chain
  (parent → … → current), and renders `All assets > Subfolder > Current`
  with each crumb calling `state.setCurrentFolderId(crumb.id)`. Borrow
  the structure from `LibraryManager.tsx:147-159, 260-271` (fullpage
  breadcrumb), but use BEM-scoped selectors (`exp-panel__breadcrumb` /
  `exp-panel__crumb` / `exp-panel__crumb--current` / `exp-panel__crumb-sep`)
  per the §12 audit precedent. CSS lives in `ExpandedMediaPanel.css`,
  not `MediaTab.css`.

- **Task 23 (drag-to-folder snap + move):** MISSING — three sub-pieces.
  (a) Mark asset cards draggable in `LibraryView.tsx` (img/vid/ico/fnt
  sections), reusing `dragPayload.setMediaDragData` from
  `data/dragPayload.ts:35-…` for the canvas payload but ALSO write a
  new internal key `application/x-buildrik-media-asset-key` carrying
  `item.key`. (b) Add `onDragEnter` / `onDragOver` / `onDragLeave` /
  `onDrop` to each folder `<Button>` in `ExpandedMediaPanel.tsx:221-238`.
  On dragover, read the asset-key payload, set a local
  `dragOverFolderId` state, add `is-drag-over` class (new CSS rule in
  `ExpandedMediaPanel.css` — e.g. `.exp-folder-item.is-drag-over { outline:
  2px solid var(--bd-accent); background: var(--bd-accent-soft); }`).
  (c) On drop, call `state.moveAsset(assetKey, folder.id)` (already
  defined at `useLibraryState.ts:186-188`). For multi-select drag, call
  `state.bulkMoveAssets(Array.from(selectedKeys), folder.id)` from
  `useLibraryState.ts:190-196`. Also wire the "(Root)" target so users
  can drop back to All assets.

- **Task 24 (folder right-click → Rename / Delete):** MISSING for
  Rename, PARTIAL for Delete.
  (a) **Rename** requires NEW engine work: add
  `composer.media.renameFolder(id, name): Promise<void>` to
  `engine/media/MediaManager.ts` (mirror `createFolder` shape — update
  `state.folders` row, emit `MEDIA_EVENTS.FOLDER_UPDATED` which already
  exists as a constant at `shared/constants/media.ts:95`, mirror to
  `remoteSync.updateFolder` if present), then expose
  `renameFolder` on `LibraryStateResult` next to `createFolder`
  (`useLibraryState.ts:218-240`), wire `FOLDER_UPDATED` listener so
  the folder list re-renders. Then add a `FolderContextMenu` component
  (or extend `MediaContextMenu` with a folder mode) showing
  Rename / Delete. Pattern of the existing `MediaContextMenu`
  fixed-position floating menu works (`MediaContextMenu.tsx:60-145`)
  but the prop shape must be folder-typed (`folder: MediaFolder`).
  Wire `onContextMenu` on the folder `<Button>` in
  `ExpandedMediaPanel.tsx:229-238` to capture (x, y, folder) into a
  new local state `folderCtxMenu`.
  (b) **Delete with warning:** the two-step flow already lives at
  `useLibraryState.ts:156-184`. Wire a real confirm modal:
  on context-menu Delete, call `state.inspectFolder(folder.id)`,
  reuse `ConfirmDeleteModal` (`components/ConfirmDeleteModal.tsx`) or
  the `shared/extensions/ConfirmDialog` to show `"Delete folder
  '{name}' and N assets / M subfolders? Assets will move to All
  assets."`, then on confirm call `state.deleteFolder(folder.id,
  { force: true })`. The orphan-to-root cascade is already in
  `MediaManager.ts:1196-1199`. The fullpage `FolderTree.tsx:184`
  no-prompt inline call is the anti-pattern to NOT copy.

- **Task 25 (empty folder drop zone):** MISSING — when
  `state.currentFolderId !== null && state.libraryItems.length === 0`
  inside the expanded panel's library area
  (`ExpandedMediaPanel.tsx:243-274`), render an `UploadZone` (already
  imported pattern in `MediaTab.tsx:281-287`) gated to upload INTO the
  current folder. `useUploadState.ts` already runs through
  `composer.media.upload`; to upload into the active folder, pass the
  current folder id at the upload site (likely `state.upload(files,
  state.currentFolderId)` — verify `useUploadState.ts` accepts a
  folder argument, or extend it; `MediaManager.ts` `uploadFile`
  takes a folder param per the existing storage queries). Distinct CSS
  from `med-empty` (which is per-type) — new selector
  `exp-panel__empty-folder` with copy "Drop files here, or click to
  upload to {folderName}".

## Implementation hints

- Engine APIs already shipped (do NOT re-invent):
  - `composer.media.getFolders(parentId: string | null = null)`
    (`MediaManager.ts:1212-1214`) — children of a parent.
  - `composer.media.createFolder(name, parentId?)`
    (`MediaManager.ts:1021-1066`) — emits `FOLDER_CREATED`.
  - `composer.media.deleteFolder(id)` (`MediaManager.ts:1159-1210`)
    — orphans children to root, emits `FOLDER_DELETED`.
  - `composer.media.updateAsset(id, { folderId })`
    (around `MediaManager.ts:977`) — the move primitive.
  - `composer.media.getAssets({ folderId })` (`MediaManager.ts:990`) —
    used by `inspectFolder` to count non-empty.

- Engine APIs that NEED to be added:
  - `composer.media.renameFolder(id, name): Promise<void>` — must
    emit `MEDIA_EVENTS.FOLDER_UPDATED` (constant already declared at
    `shared/constants/media.ts:95`, listener already subscribed at
    `useLibraryState.ts` + `ExpandedMediaPanel.tsx:148,152` — both are
    waiting). Mirror to `remoteSync.updateFolder` if Phase B sync layer
    has the route (check `MediaRemoteSync` adjacent to
    `MediaManager.ts`).

- Hook APIs ready for re-use (do NOT duplicate):
  - `state.currentFolderId`, `state.setCurrentFolderId` — breadcrumb
    crumb clicks call `setCurrentFolderId(crumb.id)`.
  - `state.folders` — full folder list (currently flat parent=null
    children only at the rail; breadcrumb needs the parent chain, may
    need to walk `folder.parentId` upward).
  - `state.moveAsset(key, folderId | null)` — single-asset drop.
  - `state.bulkMoveAssets(keys, folderId | null)` — multi-select drop.
  - `state.inspectFolder(id)` — non-empty check.
  - `state.deleteFolder(id, { force })` — gated delete.

- Existing UI patterns to mirror:
  - `MediaContextMenu.tsx` floating menu shape (fixed position, clamped
    to viewport, backdrop + `useClickOutside`) — copy for
    `FolderContextMenu`.
  - `ConfirmDeleteModal.tsx` for the non-empty warning.
  - `UploadZone.tsx` for the empty-folder drop zone.
  - `LibraryManager.tsx:147-159, 260-271` for breadcrumb shape (parent
    chain build + `<button class="mgr-crumb">` per crumb, but rename
    selectors to `exp-panel__crumb` per BEM precedent).

- CSS conventions: new selectors land in
  `components/ExpandedMediaPanel.css` (NOT `MediaTab.css`), namespaced
  `exp-panel__*` per the §12 audit precedent. Tokens via
  `var(--bd-*)` aliases; no inline hex.
