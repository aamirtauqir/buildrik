/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * LibraryManager — fullpage 3-column asset manager (Surface 0)
 * Three columns: folder tree (240px) | asset grid (5-col) | details rail (320px)
 * Opens via "Manage library" button or J shortcut from MediaTab.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Upload, Search, AlertCircle, X, ChevronDown,
} from "lucide-react";
import type { Composer } from "../../engine/Composer";
import { useMediaState } from "../sidebar/tabs/media/hooks/useMediaState";
import { StockSourceModal } from "../sidebar/tabs/media/components/StockSourceModal";
import { ConfirmDeleteModal } from "../sidebar/tabs/media/components/ConfirmDeleteModal";
import { ConfirmFolderDeleteModal } from "../sidebar/tabs/media/components/ConfirmFolderDeleteModal";
import { ReplaceAcrossDialog } from "../sidebar/tabs/media/components/ReplaceAcrossDialog";
import { MediaContextMenu } from "../sidebar/tabs/media/components/MediaContextMenu";
import { ImportUrlModal } from "./components/ImportUrlModal";
import { ImportResultModal, type ImportResult } from "./components/ImportResultModal";
import { StockSavedModal } from "./components/StockSavedModal";
import { RenameAssetModal } from "./components/RenameAssetModal";
import { DownloadPreparedModal } from "./components/DownloadPreparedModal";
import { CreateFolderModal } from "./components/CreateFolderModal";
import { MoveAssetsModal } from "./components/MoveAssetsModal";
import { MoveFailedModal } from "./components/MoveFailedModal";
import { ReplaceResultModal, type ReplaceOutcome } from "./components/ReplaceResultModal";
import { UploadFilesModal } from "./components/UploadFilesModal";
import { UploadCompleteModal } from "./components/UploadCompleteModal";
import { VersionsModal } from "./components/VersionsModal";
import { ApplyVersionModal } from "./components/ApplyVersionModal";
import { UrlImportError, fetchUrlAsFile } from "./fetchUrlAsFile";
import type { ImageEditorOptions } from "../shell/hooks/useStudioModals";
import { LIBRARY_KINDS, MEDIA_EVENTS, STORAGE_QUOTA_BYTES, getAssetTypeFromMime } from "../../shared/constants/media";
import { useToast, Button, IconButton, Menu, MenuItem, Popover, TextInput, Tooltip } from "@/editor/chrome-ui";
import { useMediaWriteAccess } from "@/editor/sidebar/tabs/media/hooks/useMediaWriteAccess";
import type { LibraryItem, VersionEntry } from "../sidebar/tabs/media/data/mediaTypes";
import { displayNameFor } from "../sidebar/tabs/media/data/mediaUtils";
import type { EditsSnapshot, IconConfig, MediaAsset } from "../../shared/types/media";
import { FolderTree, type SmartFolder } from "./components/FolderTree";
import { AssetDetailsPanel } from "./components/AssetDetailsPanel";
import { AssetGrid } from "./components/AssetGrid";
import { formatBytes } from "@shared/utils/helpers/number";
import { formatQuotaSize } from "@/editor/sidebar/tabs/media/components/StorageQuotaBar";
import { regenerateAltText } from "../../services/AltTextService";
import { createAssetVersion } from "../../services/MediaVersionService";
import "./LibraryManager.css";

/* Clone 3721:43697 — the search field's tag token, `Tag: menu · Clear filter ×`,
   in the placeholder's own grey inside the field; × clears the tag. */
const SEARCH_TAG_TOKEN =
  "tw:flex tw:shrink-0 tw:items-center tw:gap-1 tw:whitespace-nowrap tw:text-[13px] tw:text-[var(--bk-ink-soft)]";
const SEARCH_TAG_CLEAR = "tw:h-5 tw:w-5 tw:text-[var(--bk-ink-soft)]";

/** The editor's tabs (P6-X); the rail's Optimize opens on `optimise`. */
export type ImageEditorTab = "crop" | "adjust" | "resize" | "optimise";

/**
 * What the library tells the image editor beyond the file (P6-X contract):
 * the name its head prints, the tab to open on, and the door its Saved
 * screen's Done leads through. Handed as the third argument so a host still
 * on `openImageEditor(src, onSave)` type-checks and simply ignores it — the
 * shell forwards it once the editor's new props land.
 */

interface LibraryManagerProps {
  composer: Composer;
  onClose: () => void;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string, edits?: EditsSnapshot) => void | Promise<void>,
    door?: ImageEditorOptions,
  ) => void;
}

/* 3720:43313 — `replaceAcross` is synchronous, so the Applying card would
   never be seen without a beat; the prototype advances it on an AFTER
   delay. Long enough to read, short enough to feel like work, not a wait. */
const APPLY_DWELL_MS = 350;

// ─── Type pills config ──────────────────────────────────────
const TYPE_PILLS = [
  { id: "all" as const, label: "All" },
  { id: "img" as const, label: "Images" },
  { id: "vid" as const, label: "Videos" },
  { id: "ico" as const, label: "Icons" },
  { id: "fnt" as const, label: "Fonts" },
] as const;

const SORT_OPTIONS = [
  { value: "date", label: "Recent" },
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
  { value: "type", label: "Type" },
] as const;

/* Which door a move came through decides where its receipt reads: the checked
   set's move reports in the rail (Clone 3683:19964), the card menu's in the
   count line (3721:45960). */
type MoveDoor = "selection" | "menu";

export function LibraryManager({ composer, onClose, onOpenImageEditor }: LibraryManagerProps) {
  const state = useMediaState(composer);
  /* Audit G3-064 (B5): a viewer's Import URL and Upload stay on show,
     aria-disabled, with the reason on a tooltip. The rest of the media gate
     lives in the grid, folder rail, details and menu components. */
  const mediaWrite = useMediaWriteAccess();
  const [uploadMenuOpen, setUploadMenuOpen] = React.useState(false);
  const viewOnlyTip = (control: React.ReactElement) =>
    mediaWrite.canWrite ? control : (
      <Tooltip content={mediaWrite.reason("upload")} placement="bottom">
        {control}
      </Tooltip>
    );
  const { addToast } = useToast();
  const [stockModalOpen, setStockModalOpen] = React.useState(false);
  const [selectedAssetId, setSelectedAssetId] = React.useState<string | null>(null);
  const [smartFolder, setSmartFolder] = React.useState<SmartFolder>(null);
  /* Board 1163:13948 — the whole manager is the drop target. dragenter fires
     per child element, so a counter is the only way to know when the pointer
     has really left rather than crossed a card boundary. */
  const [isDragOver, setIsDragOver] = React.useState(false);
  const dragDepth = React.useRef(0);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  /* P0 — folder delete confirm. Distinct from `state.confirmDelete` (assets)
     because the payload is different (no in-use list, has sub-folder count)
     and the secondary action (Move files…) belongs to the move picker, not
     the asset delete. SSOT per type — see `ConfirmFolderDeletePayload`. */
  const [folderConfirm, setFolderConfirm] = React.useState<{
    folderId: string;
    folderName: string;
    assetCount: number;
    subFolderCount: number;
  } | null>(null);

  /* Clone 3585:23337 — the drawer's "Manage in full library" selects the file
     it just uploaded through the engine (`composer.media.selectAssets`) and
     then opens this manager; the shell's `onOpenLibrary` carries no argument.
     Consumed on mount so a later open starts clean. */
  React.useEffect(() => {
    const handed = composer.media.getSelectedAssets()[0];
    if (!handed) return;
    composer.media.selectAssets([]);
    setSelectedAssetId(handed.id);
  }, [composer]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      /* An open ⋯ / Tags ▾ menu spends its Escape closing itself (chrome-ui
         Popover marks it defaultPrevented): the first Escape closes the
         menu, not the whole library. */
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Usage count map over the WHOLE library: key → count (memoized to avoid
  // N² on every render). The smart filters and the SMART row counts both
  // read it, and the counts are library-wide even inside a folder scope
  // (Clone 3698:20337 keeps them while Products is the scope).
  //
  // Clone 3695:45529 (Phase 6): a file's usage is its FAMILY's — the
  // original's placements plus every saved version's. Applying v2 across
  // the site moves the placements to v2's src, and the card must go on
  // reading `used ×3`, not flip to "unused" while the image is on three
  // pages. The rail's USED IN reads the same aggregate below.
  //
  // A replace changes no library row, so nothing above re-renders on its
  // own; the engine's replace events are the tick that re-reads the counts.
  const [placementsTick, setPlacementsTick] = React.useState(0);
  React.useEffect(() => {
    const bump = () => setPlacementsTick((t) => t + 1);
    composer.media.on(MEDIA_EVENTS.REPLACE_COMMITTED, bump);
    composer.media.on(MEDIA_EVENTS.REPLACE_PARTIAL, bump);
    return () => {
      composer.media.off(MEDIA_EVENTS.REPLACE_COMMITTED, bump);
      composer.media.off(MEDIA_EVENTS.REPLACE_PARTIAL, bump);
    };
  }, [composer]);
  const usageMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of state.allLibraryItems) {
      const family = state.versionsOf(item.key);
      const members = family.length > 0 ? family : [item];
      const count = members.reduce((n, member) => n + composer.mediaOps.getUsages(member.src).count, 0);
      if (count > 0) map.set(item.key, count);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- placementsTick is the re-read trigger
  }, [state.allLibraryItems, state.versionsOf, composer, placementsTick]);

  // Apply smart folder filter on top of state.libraryItems
  const visibleItems = React.useMemo(() => {
    let items = state.libraryItems;
    if (smartFolder === "recent") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // last 7 days
      items = items
        .filter((i) => new Date(i.createdAt).getTime() >= cutoff)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (smartFolder === "in-use") {
      items = items.filter((i) => (usageMap.get(i.key) ?? 0) > 0);
    } else if (smartFolder === "unused") {
      items = items.filter((i) => (usageMap.get(i.key) ?? 0) === 0);
    }
    return items;
  }, [state.libraryItems, smartFolder, usageMap]);

  // SMART row counts — library-wide, never the scope's
  const inUseCount = usageMap.size;
  const unusedCount = state.allLibraryItems.length - inUseCount;
  const recentCount = React.useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return state.allLibraryItems.filter((i) => new Date(i.createdAt).getTime() >= cutoff).length;
  }, [state.allLibraryItems]);

  /* The checked set, in list order — what the bulk rail, the Move modal and
     a drag of a checked row are all about. */
  const checkedItems = React.useMemo(
    () => (state.selMode ? state.libraryItems.filter((i) => state.selectedKeys.has(i.key)) : []),
    [state.selMode, state.libraryItems, state.selectedKeys],
  );

  /* Clone 3705:21059 / 3705:20396 (section 3695:45625, later than
     3695:20154): in select mode the rail shows the ONE checked file's full
     details, the checked set otherwise. Phase 1's "1 asset selected" hint is
     displaced. Outside select mode the rail is the clicked card. */
  const selectedItem = React.useMemo(() => {
    if (state.selMode) return checkedItems.length === 1 ? checkedItems[0] : null;
    if (!selectedAssetId) return null;
    return state.libraryItems.find((item) => item.key === selectedAssetId) || null;
  }, [state.selMode, checkedItems, selectedAssetId, state.libraryItems]);

  /* Clone 3695:45529 — a file's family with where each member stands on the
     site: the original first, then the saved versions oldest to newest,
     each with the placements carrying its src and the pages they sit on.
     The count is `getUsages`, the pages the join the delete confirm runs
     (`checkInUse`), so the rail, the dialog and the confirm never disagree. */
  const familyOf = React.useCallback(
    (key: string): VersionEntry[] =>
      state.versionsOf(key).map((item, i) => ({
        item,
        index: i + 1,
        placements: composer.mediaOps.getUsages(item.src).count,
        pages: state.checkInUse([item.key])[0]?.pages ?? [],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- placementsTick is the re-read trigger
    [state.versionsOf, state.checkInUse, composer, placementsTick],
  );

  const versions = React.useMemo(() => (selectedItem ? familyOf(selectedItem.key) : []), [selectedItem, familyOf]);

  /* The family's placements — USED IN follows them to whichever version
     the site carries (the aggregate `usageMap` reads). */
  const usageCount = React.useMemo(() => versions.reduce((n, v) => n + v.placements, 0), [versions]);

  /* Clone 3695:20340 — USED IN names the pages ("1 place — Menu preview"). */
  const usedIn = React.useMemo(() => [...new Set(versions.flatMap((v) => v.pages))], [versions]);

  const handleUploadClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /* Clone 3695:20614 / 44165 — every Insert to canvas lands on a "Canvas ·"
     screen: the library closes and the person sees what they placed. It
     used to stay open over the canvas, so the applied image was invisible
     until Close (audit A03 — "demonstrate a distinct applied-image result"). */
  const insertAndReturn = React.useCallback(
    async (key: string) => {
      await state.insertToCanvas(key);
      onClose();
    },
    [state, onClose],
  );

  /* Assets that never reached the server. Their src is a session Object URL,
     so they will not render on a published page — which is what the status
     pill below exists to say. */
  const localOnlyCount = React.useMemo(
    () => state.libraryItems.filter((i) => i.localOnly).length,
    [state.libraryItems],
  );

  const [importUrlOpen, setImportUrlOpen] = React.useState(false);
  /* Clone 3700:20347 — `row/＋ New folder` opens a modal. The folder lands
     under the current scope (the hook's own rule), so the names the modal
     refuses are that level's siblings — a root name is free inside a folder. */
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);
  const siblingFolderNames = React.useMemo(
    () => state.allFolders.filter((f) => f.parentId === state.currentFolderId).map((f) => f.name),
    [state.allFolders, state.currentFolderId],
  );
  /* Clone 3700:20353 — the folder just created IS the scope: its row lights
     in FOLDERS and the grid shows its (empty) contents. A smart-folder scope
     it was opened from is released with it, the way clicking a folder row
     releases one. */
  const handleCreateFolder = React.useCallback(
    async (name: string) => {
      const folder = await state.createFolder(name);
      setSmartFolder(null);
      state.setCurrentFolderId(folder.id);
    },
    [state],
  );
  /* Clone 3701:20353 — Rename is a modal of its own. It used to open the
     drawer's asset drill-in hub (`AssetDetailOverlay`, board 146:2), which has
     no name field at all. */
  const [renameTarget, setRenameTarget] = React.useState<LibraryItem | null>(null);
  /* Clone 3701:20394 — the result of a bulk Download, once every selected
     file has been handed to the browser. */
  const [downloadPrepared, setDownloadPrepared] = React.useState(false);
  /* Clone 3708:20650 — "Replace instead" on the delete confirm opens the
     rail's replace-across picker for that asset, so the picker's open state
     lives here rather than in the rail. */
  const [replacePickerOpen, setReplacePickerOpen] = React.useState(false);
  /* Audit G3-027 / board 6940:79709 — the picked replacement opens Replace
     across site: before → after, the PAGES it is used on (each can be
     unticked), then "Replace N uses on M pages". The srcs are the FAMILY's
     (`familyOf`): the picker's "across 1 use" counts a placement sitting on
     an applied version, so the run must reach that version's src too — walked
     live 2026-09-14, a family whose one placement was on v2 reported "0 of 0
     uses updated" and the canvas kept v2. The dialog reports the run
     (Clone 3695:43897 → 3695:43900 / 3695:43903). */
  const [replacePair, setReplacePair] = React.useState<{
    sources: string[];
    newSrc: string;
    oldLabel: string;
    newLabel: string;
  } | null>(null);

  /* ─── P2-B Move & drag ─────────────────────────────────────────────── */
  /* Clone 3683:19950 — the Move modal, from the bulk bar or the rail. */
  const [moveModalOpen, setMoveModalOpen] = React.useState(false);
  /* Clone 3699:20381 / 3683:19964 — the last move's result, read in the
     rail with the selection kept, until the selection or the scope changes. */
  const [moveResult, setMoveResult] = React.useState<{
    folderId: string | null;
    folderName: string;
    names: string[];
    moved: string[];
    alreadyThere: string[];
  } | null>(null);
  /* Clone 3699:20347 — the move the engine refused, held so Retry can run
     exactly it again — including which door it came through. */
  const [moveFailure, setMoveFailure] = React.useState<{ keys: string[]; folderId: string | null; from: MoveDoor } | null>(null);
  /* Clone 3721:45952 — the card menu's `Move to folder…` opens the same Move
     modal for that ONE file; it creates no selection. */
  const [menuMoveTarget, setMenuMoveTarget] = React.useState<LibraryItem | null>(null);
  /* A1 / QA 2026-09-24: the folder-delete confirm's "Move files…" hands the
     folder's files to the same Move modal (board B1-13 7564:185465). */
  const [folderMoveItems, setFolderMoveItems] = React.useState<LibraryItem[] | null>(null);
  /* Clone 3721:45960 — a menu move's receipt is the count line (`Products ·
     team-photo.jpg moved`), not the rail, which keeps whatever it showed. It
     clears on the next scope or filter change. */
  const [movedNote, setMovedNote] = React.useState<string | null>(null);
  /* Clone 4207:26629 / 4215:26635 — the keys in flight while a card or row
     is dragged: the folders outline, the rail dims, the footer says what a
     drop does. React state, so every surface reads the one fact. */
  const [assetDrag, setAssetDrag] = React.useState<{ keys: string[] } | null>(null);

  React.useEffect(() => {
    setMoveResult(null);
  }, [state.selectedKeys, state.selMode, selectedAssetId, state.currentFolderId, smartFolder]);

  React.useEffect(() => {
    setMovedNote(null);
  }, [state.currentFolderId, smartFolder, state.tagFilter, state.librarySearch, state.fmtFilter, state.activeTypes]);

  const runMove = React.useCallback(
    async (keys: string[], folderId: string | null, from: MoveDoor = "selection") => {
      setAssetDrag(null);
      const items = keys
        .map((k) => state.allLibraryItems.find((i) => i.key === k))
        .filter((i): i is LibraryItem => i !== undefined);
      const wasHere = new Set(items.filter((i) => (i.folderId ?? null) === folderId).map((i) => i.key));
      try {
        await state.bulkMoveAssets(keys, folderId);
      } catch {
        setMoveFailure({ keys, folderId, from });
        return;
      }
      setMoveFailure(null);
      const nameOf = (i: LibraryItem) => i.displayName ?? i.name;
      if (from === "menu") {
        setMovedNote(items[0] ? nameOf(items[0]) : null);
        return;
      }
      setMoveResult({
        folderId,
        folderName: folderId === null ? "All assets" : (state.allFolders.find((f) => f.id === folderId)?.name ?? "folder"),
        names: items.map(nameOf),
        moved: items.filter((i) => !wasHere.has(i.key)).map(nameOf),
        alreadyThere: items.filter((i) => wasHere.has(i.key)).map(nameOf),
      });
    },
    [state],
  );

  /* A dropped asset carries the whole checked set when it is part of it
     (4215:26635); an unchecked one moves alone even beside a selection. */
  const handleDropOnFolder = React.useCallback(
    (assetKey: string, folderId: string | null) => {
      const keys = assetDrag?.keys.includes(assetKey) ? assetDrag.keys : [assetKey];
      void runMove(keys, folderId);
    },
    [assetDrag, runMove],
  );

  /* Clone 3699:20381's View destination — edge `Action / Move to folder|CLIC|
     SWA>Assets · Hero shots · folder/scope`: the destination becomes the
     scope, the selection stays. Scoping clears the result (effect above). */
  const viewMoveDestination = React.useCallback(() => {
    if (!moveResult) return;
    setSmartFolder(null);
    state.setCurrentFolderId(moveResult.folderId);
  }, [moveResult, state]);

  /* Edge `Action / Clear selection` — the checked set empties, select mode
     stays (the bar's ✕ Clear rule); a card selection is dropped with it. */
  const clearRailSelection = React.useCallback(() => {
    state.clearSelection();
    setSelectedAssetId(null);
  }, [state]);

  const handleDownload = React.useCallback(
    (assets: ReadonlyArray<{ src: string; name: string }>) => {
      const started = composer.media.downloadAssets(assets);
      if (started > 0) setDownloadPrepared(true);
      return started;
    },
    [composer],
  );

  /* Clone 3708:20446 — after the delete the rail is back to "Select an asset
     to see details.": a selection pointing at a deleted asset is dropped, one
     pointing elsewhere is kept. */
  const handleExecuteDelete = React.useCallback(async () => {
    const deleted = state.confirmDelete?.keys ?? [];
    await state.executeDelete();
    if (selectedAssetId && deleted.includes(selectedAssetId)) setSelectedAssetId(null);
  }, [state, selectedAssetId]);

  const handleReplaceInstead = React.useCallback(
    (key: string) => {
      state.cancelDelete();
      setSelectedAssetId(key);
      setReplacePickerOpen(true);
    },
    [state],
  );

  /* ─── P3-I Import URL · Stock ──────────────────────────────────────── */
  /* Clone 3397:18835 → 3695:43873 / 3695:43876: the import's outcome is a
     dialog, not a toast. The file goes through the engine's own upload gate
     (the same one a picked file passes) and lands in the current scope, the
     rule the file picker and the drop path already follow. Its outcome
     names the asset so View asset can select it. */
  const [importDraft, setImportDraft] = React.useState("");
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  /* Clone 3695:45573 — the stock save's result, with the asset it landed as. */
  const [stockSaved, setStockSaved] = React.useState<{ key: string; name: string } | null>(null);

  const handleImportFromUrl = React.useCallback(
    async (url: string) => {
      let file: File;
      try {
        file = await fetchUrlAsFile(url);
      } catch {
        setImportResult({ kind: "failed", url, accepts: LIBRARY_KINDS });
        return;
      }
      try {
        const result = await composer.media.uploadFile(
          file,
          state.currentFolderId != null ? { folderId: state.currentFolderId } : undefined,
        );
        if (!result.success || !result.asset) {
          setImportResult({ kind: "failed", url, accepts: LIBRARY_KINDS, reason: result.error });
          return;
        }
        setImportResult({
          kind: "imported",
          key: result.asset.id,
          /* The name the library prints — the engine stores the stem and
             the pipeline may have landed a WebP (code:auto-webp). */
          name: displayNameFor(result.asset.name, result.asset.mimeType),
          type: getAssetTypeFromMime(result.asset.mimeType) ?? getAssetTypeFromMime(file.type) ?? "image",
        });
      } catch (err) {
        setImportResult({
          kind: "failed",
          url,
          accepts: LIBRARY_KINDS,
          reason: err instanceof UrlImportError || !(err instanceof Error) ? undefined : err.message,
        });
      }
    },
    [composer, state.currentFolderId],
  );

  /* `View asset` (3695:43873 / 3695:45573): the details rail IS the asset's
     details — the prototype's Asset details dialog (3721:45823) is not built,
     its sub-dialogs say "Prototype preview only". A smart scope that would
     hide a file placed nowhere ("In use") is released, and select mode's
     checked-set rail gives way to the card. */
  const viewAsset = React.useCallback(
    (key: string) => {
      if (state.selMode) state.toggleSelMode();
      setSmartFolder(null);
      setSelectedAssetId(key);
    },
    [state],
  );

  /* Clone 3724:20828 / 3724:20832 — the picker's files wait in the Upload
     files confirm (the header ↑ Upload and both empty-state Uploads share
     this input). Once sent, the same modal reads the queue until the batch
     resolves; then Upload complete names what landed. A drop skips the
     confirm — edge `AFTE|NAV>3397:17505` goes straight back to the library. */
  const [uploadBatch, setUploadBatch] = React.useState<{ files: File[]; uploading: boolean } | null>(null);
  const [uploadDone, setUploadDone] = React.useState<{
    landed: MediaAsset[];
    failed: Array<{ fileName: string; reason: string }>;
  } | null>(null);

  const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setUploadBatch({ files: Array.from(e.target.files), uploading: false });
      e.target.value = "";
    }
  }, []);

  /* Clone 3700:20353 — "Upload files or move existing assets into this
     folder": files picked while a folder is the scope land IN that folder,
     the rule the drop path below already followed. The picker used to file
     everything at the root, so uploading from an empty folder's own CTA left
     that folder empty. A batch where nothing landed shows no result — the
     grid's failed rows (with their reasons) are the door. */
  const runUploadBatch = React.useCallback(
    async (files: File[]) => {
      setUploadBatch({ files, uploading: true });
      const results = await state.upload(files, { folderId: state.currentFolderId });
      setUploadBatch(null);
      const landed = results.flatMap((r) => (r.success && r.asset ? [r.asset] : []));
      if (landed.length === 0) return;
      setUploadDone({
        landed,
        failed: results.filter((r) => !r.success).map((r) => ({ fileName: r.fileName, reason: r.error ?? "Upload failed" })),
      });
    },
    [state],
  );

  /* Edge `Action / View asset` — the rail IS the asset's details (decision in
     the P3 brief: the prototype's 3721:45823 dialog is a placeholder). A smart
     scope that would hide the new card is released. */
  const viewUploadedAsset = React.useCallback(() => {
    if (!uploadDone) return;
    setSmartFolder(null);
    setSelectedAssetId(uploadDone.landed[0].id);
    setUploadDone(null);
  }, [uploadDone]);

  /* ─── P6-V Versions ────────────────────────────────────────────────── */
  /* Clone 3695:45529 — the Asset versions dialog, open on this file's family
     (its parent's key: a version's own key resolves to the same family). */
  const [versionsFor, setVersionsFor] = React.useState<string | null>(null);
  /* 3695:45615 — the apply confirm for the latest saved version, then
     (3720:43313) the Applying card while the placements move. */
  const [applyTarget, setApplyTarget] = React.useState<{ parentKey: string; versionKey: string } | null>(null);
  const [applying, setApplying] = React.useState(false);
  /* 3720:43316 — what the apply did, per element, until Done or View
     versions. `sources` are the srcs the placements carried, kept so Retry
     can run exactly the same replace for the ones that failed. */
  const [applyResult, setApplyResult] = React.useState<{
    parentKey: string;
    versionKey: string;
    sources: string[];
    replaced: string[];
    failed: string[];
  } | null>(null);

  const versionsFamily = React.useMemo(() => (versionsFor ? familyOf(versionsFor) : []), [versionsFor, familyOf]);
  /* What the apply would move: every placement NOT already on the target
     version — the original's, and an older version's if one was applied
     before. Their pages name the confirm's "on Home and Menu". */
  const applyFamily = React.useMemo(() => (applyTarget ? familyOf(applyTarget.parentKey) : []), [applyTarget, familyOf]);
  const applySources = applyFamily.filter((v) => v.item.key !== applyTarget?.versionKey && v.placements > 0);
  const applyUses = applySources.reduce((n, v) => n + v.placements, 0);
  const applyPages = [...new Set(applySources.flatMap((v) => v.pages))];
  const applyName = applyFamily[0]?.item.displayName ?? applyFamily[0]?.item.name ?? "";

  /* The family at SAVE time, not at open time: a second save from the same
     editor session numbers itself after the version the first one made. */
  const versionsOfRef = React.useRef(state.versionsOf);
  versionsOfRef.current = state.versionsOf;

  /* Clone 3681:20026 → 3695:45529 — Edit image opens the editor on the file
     (a fresh blob URL: the stored src may be dead across sessions), with the
     name its head prints and the tab to open on. Its Save lands the edited
     file through the upload pipeline AS A VERSION of the family's parent —
     `<stem>-v<N>.<ext>`, N the next index, in the parent's folder, born
     flagged with the parent's key and the edits it was saved with — never
     as a library card of its own. The parent's src stays the original;
     applying is the dialog's explicit step. A refused upload rethrows so the
     editor shows its failure dialog and keeps the draft. The server's
     version history is written best-effort once both rows are synced —
     never awaited into the save. Done opens Asset versions on the family. */
  const handleEditImage = React.useCallback(
    async (item: LibraryItem, initialTab?: ImageEditorTab) => {
      if (!onOpenImageEditor) {
        addToast({ description: "Image editor unavailable", tone: "error" });
        return;
      }
      if (item.type !== "img") {
        addToast({ description: "Only images can be edited", tone: "info" });
        return;
      }
      const parentKey = item.versionOf ?? item.key;
      const freshSrc = (await composer.media.getAssetSrc(item.key)) || item.src;
      const onSave = async (editedSrc: string, edits?: EditsSnapshot) => {
        const family = versionsOfRef.current(parentKey);
        const parent = family[0] ?? item;
        const res = await fetch(editedSrc);
        const blob = await res.blob();
        const stem = parent.name.replace(/\.[^/.]+$/, "");
        const file = new File([blob], displayNameFor(`${stem}-v${Math.max(family.length, 1) + 1}`, blob.type), { type: blob.type });
        const result = await composer.media.uploadFile(file, {
          ...(parent.folderId ? { folderId: parent.folderId } : {}),
          versionOf: parentKey,
          ...(edits ? { edits } : {}),
        });
        if (!result.success || !result.asset) throw new Error(result.error ?? "Could not save the version");
        const saved = result.asset;
        if (parent.assetId && saved.serverId && !saved.localOnly) {
          void createAssetVersion({ assetId: parent.assetId, url: saved.src, bytes: saved.size, edits: edits ?? {} }).catch(() => {
            /* History is a convenience; the version itself has landed. */
          });
        }
      };
      onOpenImageEditor(freshSrc, onSave, {
        fileName: item.displayName ?? item.name,
        initialTab,
        onDone: () => setVersionsFor(parentKey),
      });
    },
    [onOpenImageEditor, addToast, composer],
  );

  /* Move every placement the family has on the site onto the target
     version — one `replaceAcross` per src the placements carry (the
     original's, or an earlier applied version's), each its own undo step.
     A placement that failed keeps its old src, so running the same sources
     again is exactly the retry. */
  const applyOnto = React.useCallback(
    (target: { parentKey: string; versionKey: string }, sources: string[]) => {
      const version = familyOf(target.parentKey).find((v) => v.item.key === target.versionKey);
      const results = version ? sources.map((src) => composer.mediaOps.replaceAcross(src, version.item.src)) : [];
      setPlacementsTick((t) => t + 1);
      return {
        replaced: results.flatMap((r) => r.replaced.map((e) => e.elementId)),
        failed: results.flatMap((r) => r.failed.map((f) => f.elementId)),
      };
    },
    [familyOf, composer],
  );

  /* 3695:45615 → 3720:43313 → 3720:43316: the confirm's Apply. Held on the
     Applying card for a beat, then the result takes its place. */
  const runApply = React.useCallback(
    async (target: { parentKey: string; versionKey: string }, sources: string[]) => {
      setVersionsFor(null);
      setApplying(true);
      await new Promise((resolve) => setTimeout(resolve, APPLY_DWELL_MS));
      const outcome = applyOnto(target, sources);
      setApplying(false);
      setApplyTarget(null);
      setApplyResult({ ...target, sources, ...outcome });
    },
    [applyOnto],
  );

  /* 3695:43906 — Retry failed use: the same replace for the same sources;
     what landed before stays counted. */
  /* The result card's Retry runs the failed placements again and reads the
     outcome back (the card's own contract, shared with Replace across site). */
  const retryApply = React.useCallback(async (): Promise<ReplaceOutcome> => {
    if (!applyResult) return { replaced: [], failed: [] };
    const outcome = applyOnto(applyResult, applyResult.sources);
    const merged = { replaced: [...applyResult.replaced, ...outcome.replaced], failed: outcome.failed };
    setApplyResult({ ...applyResult, ...merged });
    return merged;
  }, [applyResult, applyOnto]);

  /* Clone 3721:43697 — TAGS lists the LIBRARY's tags (`menu · team · food`
     stay while Products is the scope), so it reads the unscoped list. It used
     to re-read the engine on every scoped-list change, which is the same set
     one memo later. */
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    for (const item of state.allLibraryItems) {
      for (const tag of item.tags ?? []) {
        if (tag) tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [state.allLibraryItems]);

  const storageUsedPct = Math.min(100, (state.storage.used / state.storage.total) * 100);

  const fileDragProps = {
    onDragEnter: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      dragDepth.current += 1;
      setIsDragOver(true);
    },
    onDragOver: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragOver(false);
    },
    onDrop: (e: React.DragEvent) => {
      const files = Array.from(e.dataTransfer.files ?? []);
      dragDepth.current = 0;
      setIsDragOver(false);
      if (!files.length) return;
      e.preventDefault();
      state.upload(files, { folderId: state.currentFolderId });
    },
  };

  return (
    <div className="mgr" data-testid="mgr-root" {...fileDragProps}>
      {/* ═══ TOP BAR ═══ */}
      {/* Clone 3695:45155 — the top bar is title · search · actions. The MANAGE
          tag and the folder breadcrumb the V1 board drew are gone; the scope
          now reads in the grid's count line ("24 files · All assets") and the
          rail highlights the folder, so the crumb said it a third time. */}
      <div className="mgr-top" data-testid="mgr-top">
        <h2 className="mgr-title">Asset library</h2>

        {/* Board 4418:58292 "mgr-top": title · a full-width search · the dark
            Upload split button (▾ holds Import from URL and Add from stock) ·
            ‹ Back to canvas. */}
        <div className="mgr-search">
          <Search size={16} />
          {/* Clone 3721:43697 — while a tag is the filter the field leads
              with its token, `Tag: menu · Clear filter ×`, where the
              placeholder was; typing after it searches within the tag. */}
          {state.tagFilter && (
            <span className={SEARCH_TAG_TOKEN} data-testid="mgr-search-tag-token">
              Tag: {state.tagFilter} · Clear filter
              <IconButton
                size="sm"
                label="Clear the tag filter"
                className={SEARCH_TAG_CLEAR}
                data-testid="mgr-search-tag-clear"
                onClick={() => state.setTagFilter(null)}
              >
                <X size={12} />
              </IconButton>
            </span>
          )}
          <TextInput
            ref={searchRef}
            type="text"
            placeholder={state.tagFilter ? "" : "Search all assets…"}
            aria-label={state.tagFilter ? `Search within tag ${state.tagFilter}` : "Search all assets"}
            data-testid="mgr-search-input"
            value={state.librarySearch}
            onChange={(e) => state.setLibraryQuery(e.target.value)}
          />
        </div>

        <div className="mgr-right">
          <div className={`mgr-upload-split${mediaWrite.canWrite ? "" : " mgr-upload-split--view-only"}`}>
            {viewOnlyTip(
              <Button
                className="mgr-btn-primary"
                data-testid="mgr-btn-upload"
                aria-disabled={mediaWrite.canWrite ? undefined : "true"}
                onClick={() => mediaWrite.canWrite && handleUploadClick()}
              >
                <Upload size={16} />
                Upload
              </Button>,
            )}
            <span className="mgr-upload-divider" aria-hidden="true" />
            <Popover
              open={uploadMenuOpen}
              onClose={() => setUploadMenuOpen(false)}
              placement="bottom-end"
              label="More ways to add"
              trigger={
                <Button
                  className="mgr-btn-primary mgr-upload-caret"
                  data-testid="mgr-btn-upload-menu"
                  aria-label="More ways to add"
                  aria-haspopup="menu"
                  aria-expanded={uploadMenuOpen}
                  onClick={() => setUploadMenuOpen((v) => !v)}
                >
                  <ChevronDown size={16} />
                </Button>
              }
            >
              <Menu label="More ways to add">
                <MenuItem
                  data-testid="mgr-btn-import"
                  aria-disabled={mediaWrite.canWrite ? undefined : "true"}
                  onClick={() => {
                    setUploadMenuOpen(false);
                    if (!mediaWrite.canWrite) return;
                    setImportDraft("");
                    setImportUrlOpen(true);
                  }}
                >
                  Import from URL…
                </MenuItem>
                <MenuItem
                  data-testid="mgr-btn-stock"
                  onClick={() => {
                    setUploadMenuOpen(false);
                    setStockModalOpen(true);
                  }}
                >
                  Add from stock…
                </MenuItem>
              </Menu>
            </Popover>
          </div>
          <Button className="mgr-close" data-testid="mgr-btn-close" onClick={onClose}>
            ‹ Back to canvas
          </Button>
        </div>
      </div>
      {/* ═══ BODY ═══ */}
      <div className="mgr-body" data-testid="mgr-body">
        {/* ─── LEFT: Folder tree ─── */}
        {/* D5 Stage 1 (audit-remediation 2026-05-08): LEFT panel + collapsed
            state + recursive renderer + TreeNode all live in
            ./components/FolderTree.tsx now. */}
        {/* Clone 3698:20337 / 3700:20353 — the rail is handed EVERY folder,
            not the root-only list. `createFolder` files a new folder under
            the current scope, and the tree renders children under their
            parent, so a folder made inside "Products" had no row at all
            until now: the tree never received it. */}
        <FolderTree
          folders={state.allFolders}
          currentFolderId={state.currentFolderId}
          setCurrentFolderId={state.setCurrentFolderId}
          counts={state.counts}
          smartFolder={smartFolder}
          setSmartFolder={setSmartFolder}
          recentCount={recentCount}
          inUseCount={inUseCount}
          unusedCount={unusedCount}
          allTags={allTags}
          tagFilter={state.tagFilter}
          setTagFilter={state.setTagFilter}
          folderCounts={state.folderCounts}
          onNewFolder={() => setCreateFolderOpen(true)}
          deleteFolder={async (folderId: string) => {
            /* P0 — close the silent-refusal gap. The hook rejects non-empty
               folders unless force:true, and the old wrapper passed the bare
               `state.deleteFolder` straight through: a non-empty click
               threw FOLDER_NOT_EMPTY into the void, an empty click deleted
               with no confirm. Inspect first → ALWAYS open the confirm modal
               (plan §A1: empty → "Delete \"<name>\"?" with no Move files…;
               non-empty → counts + warning + Move files…). The modal itself
               decides whether to render the warning via isEmpty; the wrapper
               never force-deletes silently. */
            const folder = state.folders.find((f) => f.id === folderId);
            const folderName = folder?.name ?? "Untitled";
            const { assetCount, subFolderCount } = state.inspectFolder(folderId);
            setFolderConfirm({ folderId, folderName, assetCount, subFolderCount });
          }}
          onMoveAssetToFolder={handleDropOnFolder}
          assetDragActive={assetDrag !== null}
        />

        {/* ─── MIDDLE: Asset grid ─── */}
        {/* D5 Stage 3 (audit-remediation 2026-05-08): MIDDLE panel +
            viewMode + sortMenuOpen + bulkMovePickerOpen all live in
            ./components/AssetGrid.tsx now. Virtualization deferred —
            see comment in AssetGrid.tsx for the full reasoning. */}
        <AssetGrid
          isDragOver={isDragOver}
          onDownload={handleDownload}
          onDismissUpload={state.dismissUpload}
          state={state}
          visibleItems={visibleItems}
          usageMap={usageMap}
          smartFolder={smartFolder}
          movedNote={movedNote}
          selectedAssetId={selectedAssetId}
          onSelectAsset={setSelectedAssetId}
          onInsert={insertAndReturn}
          onUploadClick={handleUploadClick}
          onOpenStockModal={() => setStockModalOpen(true)}
          onMoveSelected={() => setMoveModalOpen(true)}
          onAssetDragStart={(keys) => setAssetDrag({ keys })}
          onAssetDragEnd={() => setAssetDrag(null)}
          addToast={addToast}
        />
        {/* ─── RIGHT: Details rail ─── */}
        {/* D5 Stage 2 (audit-remediation 2026-05-08): RIGHT panel +
            detailTab + replaceAllPickerOpen all live in
            ./components/AssetDetailsPanel.tsx now. */}
        <AssetDetailsPanel
          selectedItem={selectedItem}
          bulk={
            state.selMode && checkedItems.length !== 1
              ? {
                  names: checkedItems.map((i) => i.displayName ?? i.name),
                  onMove: () => setMoveModalOpen(true),
                  onClear: clearRailSelection,
                }
              : null
          }
          moveResult={moveResult ? { ...moveResult, onView: viewMoveDestination, onClear: clearRailSelection } : null}
          dimmed={assetDrag !== null}
          versions={versions}
          usageCount={usageCount}
          usedIn={usedIn}
          libraryItems={state.libraryItems}
          onOpenVersions={() => {
            if (selectedItem) setVersionsFor(selectedItem.versionOf ?? selectedItem.key);
          }}
          onInsert={insertAndReturn}
          onEditImage={handleEditImage}
          /* Clone 3695:43480 — Optimise is a tab of the editor now; the rail's
             Optimize opens the editor on it. */
          onOptimizeImage={(item) => void handleEditImage(item, "optimise")}
          onOpenRename={setRenameTarget}
          onRequestDelete={state.requestDelete}
          replacePickerOpen={replacePickerOpen}
          onReplacePickerOpenChange={setReplacePickerOpen}
          onReplaceAcross={(candidate) => {
            if (!selectedItem) return;
            const sources = versions.length > 0 ? versions.map((v) => v.item.src) : [selectedItem.src];
            setReplacePair({
              sources,
              newSrc: candidate.src,
              oldLabel: selectedItem.displayName ?? selectedItem.name,
              newLabel: candidate.displayName ?? candidate.name,
            });
          }}
          composer={composer}
          addToast={addToast}
          onUpdateTags={(key, tags) => void state.updateItem(key, { tags })}
          /* Clone 3696:21550 — Site fonts is mounted once in the shell and
             opens on the composer event, with this file highlighted. */
          onManageFont={(item) => composer.emit("ui:site-fonts", { assetId: item.key })}
          onUpdateAltText={(key, altText) => {
            // User-typed edit — clear AI provenance so the chip disappears.
            // Empty user edit also counts as "no longer AI's text."
            void composer.media.updateAsset(key, {
              altText,
              generatedMetadata: undefined,
            });
          }}
          // Regenerate is an explicit ask to REPLACE the current text.
          onRegenerateAltText={(key) => regenerateAltText(composer.media, key, key)}
        />
      </div>
      {/* ═══ STATUS BAR ═══ */}
      <div className="mgr-status" data-testid="mgr-status">
        {/* Clone 4215:26635 / 4207:26629 — while an asset is in flight the
            footer leads with what a drop does; the board keeps the count and
            the quota after it. */}
        {assetDrag && (
          <span className="tw:mr-2 tw:font-semibold tw:text-[var(--bk-accent-text)]" role="status" data-testid="mgr-status-drag-hint">
            {assetDrag.keys.length === 1
              ? "Drop on a folder to move · release outside to cancel"
              : `Drop ${assetDrag.keys.length} files on a folder to move them · release outside to cancel`}
          </span>
        )}
        <span><strong style={{ color: "var(--bk-ink-soft)" }}>{state.counts.all}</strong> assets</span>
        <span className="mgr-status-dot" />
        <span>{formatQuotaSize(state.storage.used)} / {formatQuotaSize(state.storage.total)}</span>
        <div className="mgr-status-right">
          <div className="mgr-quota-bar" data-testid="mgr-quota-bar">
            <div className="mgr-quota-fill" data-testid="mgr-quota-fill" style={{ width: `${storageUsedPct}%` }} />
          </div>
          {/* This was a hardcoded string. It is the library's only persistent
              signal for whether assets reached the server, and it said "This
              device only" unconditionally — so in production, where the blob
              token is required and assets DO sync, it told every user the
              opposite of the truth. `localOnly` is a real per-asset flag,
              persisted to IndexedDB, and `MediaManager` already rebuilds its
              retry queue by scanning for it. */}
          {localOnlyCount > 0 && (
            <span className="mgr-sync-pill" data-testid="mgr-sync-pill">
              <AlertCircle size={10} />
              {localOnlyCount} not on the server
            </span>
          )}
        </div>
      </div>
      {/* Hidden file input */}
      <TextInput
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.svg,.ttf,.otf,.woff,.woff2"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {/* Modals */}
      {/* Clone 3695:45569 → 3695:45573: Save to library lands the file and
          the dialog gives way to the result; a refused save (null, toasted
          by the hook) keeps the dialog open with its selection. Insert is
          gone — stock saves to the library, the canvas is untouched. */}
      <StockSourceModal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        photos={state.stockPhotos}
        videos={state.stockVideos}
        loading={state.discLoading}
        searchQuery={state.discoverySearch}
        searchFailed={state.searchFailed}
        onSearch={state.discSearchAll}
        orientation={state.discOrientation}
        color={state.discColor}
        onSetOrientation={state.setDiscOrientation}
        onSetColor={state.setDiscColor}
        onLoadMore={state.loadMoreDisc}
        onSave={async (type, item) => {
          const saved = await state.saveToLibrary(type, item);
          if (saved) {
            setStockModalOpen(false);
            setStockSaved(saved);
          }
        }}
      />
      <StockSavedModal
        saved={stockSaved}
        onClose={() => setStockSaved(null)}
        onViewAsset={() => {
          if (stockSaved) viewAsset(stockSaved.key);
        }}
      />
      {state.confirmDelete && (
        <ConfirmDeleteModal
          payload={state.confirmDelete}
          onConfirm={handleExecuteDelete}
          onCancel={state.cancelDelete}
          onReplaceInstead={handleReplaceInstead}
        />
      )}
      {folderConfirm && (
        <ConfirmFolderDeleteModal
          payload={folderConfirm}
          onCancel={() => setFolderConfirm(null)}
          onConfirm={async () => {
            /* Failure path: any throw here is NOT FOLDER_NOT_EMPTY (the
               inspector already ran), so surface it via toast and KEEP the
               folder. The ConfirmDeleteModal pattern is the same — execute
               always closes the modal, success tells the toast. */
            try {
              await state.deleteFolder(folderConfirm.folderId, { force: true });
              setFolderConfirm(null);
            } catch {
              setFolderConfirm(null);
              addToast({ description: "Could not delete folder", tone: "error" });
            }
          }}
          onMoveFiles={() => {
            /* The folder's files go straight into the Move modal; the folder
               itself stays until the user deletes it (now empty). */
            const inFolder = state.allLibraryItems.filter((i) => (i.folderId ?? null) === folderConfirm.folderId);
            setFolderConfirm(null);
            setFolderMoveItems(inFolder);
          }}
        />
      )}
      {state.ctxMenu && (
        <MediaContextMenu
          x={state.ctxMenu.x}
          y={state.ctxMenu.y}
          item={state.ctxMenu.item}
          onInsert={(item) => insertAndReturn(item.key)}
          onSelect={(item) => state.enterSelectModeWith(item.key)}
          onRename={setRenameTarget}
          onMoveToFolder={setMenuMoveTarget}
          onDelete={(item) => state.requestDelete(item.key)}
          onCopyUrl={state.copyUrl}
          onClose={state.closeCtxMenu}
          onEditImage={handleEditImage}
          /* G3-057 — the menu's "Replace across pages…" was a branch no
             caller wired; it opens the same picker as the rail's ⋯. */
          onReplaceAcross={(item) => {
            setSelectedAssetId(item.key);
            setReplacePickerOpen(true);
          }}
        />
      )}
      {/* ─── P6-V Versions ──────────────────────────────────────────────── */}
      {/* Clone 3695:45529 — Asset versions, from the editor's Done or a rail
          row. Edit latest saved version gives way to the editor (its Done
          brings the dialog back); Apply opens the confirm over it, and
          Cancel there returns here. */}
      <VersionsModal
        open={versionsFor !== null && applyTarget === null}
        versions={versionsFamily}
        onClose={() => setVersionsFor(null)}
        onEditLatest={(latest) => {
          setVersionsFor(null);
          void handleEditImage(latest);
        }}
        onApplyLatest={(latest) => {
          if (versionsFor) setApplyTarget({ parentKey: versionsFor, versionKey: latest.key });
        }}
      />
      <ApplyVersionModal
        open={applyTarget !== null}
        name={applyName}
        uses={applyUses}
        pages={applyPages}
        applying={applying}
        onClose={() => setApplyTarget(null)}
        onApply={() => {
          if (applyTarget) void runApply(applyTarget, applySources.map((v) => v.item.src));
        }}
      />
      {/* 3720:43316 — the result under P6-V's title; View versions returns to
          Asset versions with the applied marker moved. */}
      {applyResult && (
        <ReplaceResultModal
          open
          title="Saved version applied"
          replaced={applyResult.replaced}
          failed={applyResult.failed}
          composer={composer}
          onRetry={retryApply}
          onDone={() => setApplyResult(null)}
          onViewVersions={() => {
            setVersionsFor(applyResult.parentKey);
            setApplyResult(null);
          }}
        />
      )}
      <ImportUrlModal
        open={importUrlOpen}
        initialUrl={importDraft}
        onClose={() => setImportUrlOpen(false)}
        onImport={handleImportFromUrl}
      />
      <ImportResultModal
        result={importResult}
        onClose={() => setImportResult(null)}
        onViewAsset={() => {
          if (importResult?.kind === "imported") viewAsset(importResult.key);
        }}
        onEditUrl={(url) => {
          setImportDraft(url);
          setImportUrlOpen(true);
        }}
      />
      <CreateFolderModal
        open={createFolderOpen}
        existingNames={siblingFolderNames}
        onClose={() => setCreateFolderOpen(false)}
        onCreate={(name) => void handleCreateFolder(name)}
      />

      {renameTarget && (
        <RenameAssetModal
          item={renameTarget}
          libraryItems={state.libraryItems}
          onRename={state.renameItem}
          onClose={() => setRenameTarget(null)}
        />
      )}
      <DownloadPreparedModal open={downloadPrepared} onClose={() => setDownloadPrepared(false)} />
      <UploadFilesModal
        open={uploadBatch !== null}
        files={uploadBatch?.files ?? []}
        uploading={uploadBatch?.uploading ?? false}
        uploadQueue={state.uploadQueue}
        onCancel={() => setUploadBatch(null)}
        onUpload={(files) => void runUploadBatch(files)}
      />
      <UploadCompleteModal
        open={uploadDone !== null}
        landed={uploadDone?.landed ?? []}
        failed={uploadDone?.failed ?? []}
        onDone={() => setUploadDone(null)}
        onViewAsset={viewUploadedAsset}
      />
      {/* One Move modal for both doors: the checked set (3683:19950) or the
          card menu's one file (3721:45952). */}
      <MoveAssetsModal
        open={moveModalOpen || menuMoveTarget !== null || folderMoveItems !== null}
        items={menuMoveTarget ? [menuMoveTarget] : (folderMoveItems ?? checkedItems)}
        folders={state.allFolders}
        onClose={() => {
          setMoveModalOpen(false);
          setMenuMoveTarget(null);
          setFolderMoveItems(null);
        }}
        onMove={(folderId) => {
          if (menuMoveTarget) void runMove([menuMoveTarget.key], folderId, "menu");
          else if (folderMoveItems) {
            setFolderMoveItems(null);
            void runMove(folderMoveItems.map((i) => i.key), folderId);
          } else void runMove(checkedItems.map((i) => i.key), folderId);
        }}
      />
      <MoveFailedModal
        open={moveFailure !== null}
        onClose={() => setMoveFailure(null)}
        onRetry={() => {
          if (moveFailure) void runMove(moveFailure.keys, moveFailure.folderId, moveFailure.from);
        }}
      />
      {/* The replace-all picker lives inside <AssetDetailsPanel>; the pick
          it hands over is scoped per page here before anything runs. */}
      {replacePair && (
        <ReplaceAcrossDialog
          composer={composer}
          oldSrc={replacePair.sources[0]}
          sources={replacePair.sources}
          newSrc={replacePair.newSrc}
          oldLabel={replacePair.oldLabel}
          newLabel={replacePair.newLabel}
          onClose={() => setReplacePair(null)}
        />
      )}
    </div>
  );
}

