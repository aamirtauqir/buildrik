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
  Upload, Plus, Search, Download, AlertCircle, X,
} from "lucide-react";
import type { Composer } from "../../engine/Composer";
import { useMediaState } from "../sidebar/tabs/media/hooks/useMediaState";
import { StockSourceModal } from "../sidebar/tabs/media/components/StockSourceModal";
import { ConfirmDeleteModal } from "../sidebar/tabs/media/components/ConfirmDeleteModal";
import { MediaContextMenu } from "../sidebar/tabs/media/components/MediaContextMenu";
import { ImportUrlModal } from "./components/ImportUrlModal";
import { ImportResultModal, type ImportResult } from "./components/ImportResultModal";
import { StockSavedModal } from "./components/StockSavedModal";
import { RenameAssetModal } from "./components/RenameAssetModal";
import { DownloadPreparedModal } from "./components/DownloadPreparedModal";
import { CreateFolderModal } from "./components/CreateFolderModal";
import { MoveAssetsModal } from "./components/MoveAssetsModal";
import { MoveFailedModal } from "./components/MoveFailedModal";
import { UploadFilesModal } from "./components/UploadFilesModal";
import { UploadCompleteModal } from "./components/UploadCompleteModal";
import { UrlImportError, fetchUrlAsFile } from "./fetchUrlAsFile";
import { LIBRARY_KINDS, STORAGE_QUOTA_BYTES, getAssetTypeFromMime } from "../../shared/constants/media";
import { useToast, Button, IconButton, TextInput, OverlayMount } from "@/editor/chrome-ui";
import { OptimizationPanel } from "./OptimizationPanel";
import type { LibraryItem } from "../sidebar/tabs/media/data/mediaTypes";
import { displayNameFor } from "../sidebar/tabs/media/data/mediaUtils";
import type { IconConfig, MediaAsset } from "../../shared/types/media";
import { FolderTree, type SmartFolder } from "./components/FolderTree";
import { AssetDetailsPanel } from "./components/AssetDetailsPanel";
import { AssetGrid } from "./components/AssetGrid";
import { formatBytes } from "@shared/utils/helpers/number";
import { formatQuotaSize } from "@/editor/sidebar/tabs/media/components/StorageQuotaBar";
import { generateAltTextRemote } from "../../services/AltTextService";
import { DEFAULT_MODEL } from "@buildrik/shared/schemas/ai";
import "./LibraryManager.css";

/* Clone 3721:43697 — the search field's tag token, `Tag: menu · Clear filter ×`,
   in the placeholder's own grey inside the field; × clears the tag. */
const SEARCH_TAG_TOKEN =
  "tw:flex tw:shrink-0 tw:items-center tw:gap-1 tw:whitespace-nowrap tw:text-[13px] tw:text-[var(--bk-ink-soft)]";
const SEARCH_TAG_CLEAR = "tw:h-5 tw:w-5 tw:text-[var(--bk-ink-soft)]";

interface LibraryManagerProps {
  composer: Composer;
  onClose: () => void;
  onOpenImageEditor?: (imageSrc: string, onSave: (editedSrc: string) => void) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
}

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

export function LibraryManager({ composer, onClose, onOpenImageEditor, onOpenIconPicker }: LibraryManagerProps) {
  const state = useMediaState(composer);
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
      if (e.key === "Escape") onClose();
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
  const usageMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of state.allLibraryItems) {
      const count = composer.mediaOps.getUsages(item.src).count;
      if (count > 0) map.set(item.key, count);
    }
    return map;
  }, [state.allLibraryItems, composer]);

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

  const usageCount = React.useMemo(() => {
    if (!selectedItem) return 0;
    return composer.mediaOps.getUsages(selectedItem.src).count;
  }, [selectedItem, composer]);

  /* Clone 3695:20340 — USED IN names the pages ("1 place — Menu preview").
     Same trace the delete confirm runs, so the two never disagree. */
  const usedIn = React.useMemo(
    () => (selectedItem ? (state.checkInUse([selectedItem.key])[0]?.pages ?? []) : []),
    [selectedItem, state],
  );

  // Version history: group _v1234 files by base name
  const versions = React.useMemo(() => {
    if (!selectedItem) return [];
    // Strip _v1234 suffix to find base name
    const baseName = selectedItem.name.replace(/_v\d+$/, "");
    return state.libraryItems
      .filter((item) => {
        const itemBase = item.name.replace(/_v\d+$/, "");
        return itemBase === baseName && item.type === selectedItem.type;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedItem, state.libraryItems]);

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
  /* The optimizer shipped as a tab on the PICKER modal, so the only door to it
     was being mid-way through choosing an image for an element. It belongs
     beside Edit, on the asset you are looking at. */
  const [optimizeItem, setOptimizeItem] = React.useState<LibraryItem | null>(null);
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
        .map((k) => state.libraryItems.find((i) => i.key === k))
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

  const handleOpenIconPicker = React.useCallback(() => {
    if (!onOpenIconPicker) return;
    onOpenIconPicker(undefined, (icon) => {
      try {
        composer.mediaOps.insertMedia(icon.name, "icon");
        addToast({ description: `${icon.name} icon added`, tone: "success" });
      } catch {
        addToast({ description: "Could not add icon", tone: "error" });
      }
    });
  }, [onOpenIconPicker, composer, addToast]);

  // Bug #1 fix: Edit button → open image editor, save as new version
  // Resolves fresh blob URL via getAssetSrc (item.src may be stale after page reload)
  const handleEditImage = React.useCallback(
    async (item: LibraryItem) => {
      if (!onOpenImageEditor) {
        addToast({ description: "Image editor unavailable", tone: "error" });
        return;
      }
      if (item.type !== "img") {
        addToast({ description: "Only images can be edited", tone: "info" });
        return;
      }
      // Resolve to a fresh blob URL — the stored src may be dead across sessions
      const freshSrc = (await composer.media.getAssetSrc(item.key)) || item.src;
      onOpenImageEditor(freshSrc, async (editedSrc) => {
        try {
          const res = await fetch(editedSrc);
          const blob = await res.blob();
          const timestamp = Date.now();
          const cleanName = item.name.replace(/_v\d+$/, "");
          const ext = (blob.type.split("/")[1] || "webp").replace("+xml", "");
          const fileName = `${cleanName}_v${timestamp % 10000}.${ext}`;
          const file = new File([blob], fileName, { type: blob.type });
          state.upload([file]);
          addToast({ description: `New version of ${item.name} saved`, tone: "success" });
        } catch {
          addToast({ description: "Could not save edited version", tone: "error" });
        }
      });
    },
    [onOpenImageEditor, state, addToast, composer]
  );

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

        <div className="mgr-middle">
          <div className="mgr-search">
            <Search size={14} />
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
              placeholder={state.tagFilter ? "" : "Search across all folders…"}
              aria-label={state.tagFilter ? `Search within tag ${state.tagFilter}` : undefined}
              data-testid="mgr-search-input"
              value={state.librarySearch}
              onChange={(e) => state.setLibraryQuery(e.target.value)}
            />
            <span className="mgr-kbd">⌘K</span>
          </div>
        </div>

        {/* Upload is the primary — it is the action the library exists for.
            Stock was primary here until the Clone walk. */}
        <div className="mgr-right">
          <Button
            className="mgr-btn"
            data-testid="mgr-btn-import"
            onClick={() => {
              setImportDraft("");
              setImportUrlOpen(true);
            }}
          >
            <Download size={14} />
            Import URL
          </Button>
          <Button className="mgr-btn-primary" data-testid="mgr-btn-upload" onClick={handleUploadClick}>
            <Upload size={14} />
            Upload
          </Button>
          <Button className="mgr-btn" data-testid="mgr-btn-stock" onClick={() => setStockModalOpen(true)}>
            <Plus size={14} />
            Add from stock
          </Button>
          <Button className="mgr-close" data-testid="mgr-btn-close" onClick={onClose}>
            Close
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
          deleteFolder={state.deleteFolder}
          onTrashClick={() =>
            addToast({ description: "Trash coming soon", tone: "info" })
          }
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
          onSelectAsset={setSelectedAssetId}
          onInsert={insertAndReturn}
          onEditImage={handleEditImage}
          onOptimizeImage={setOptimizeItem}
          onOpenRename={setRenameTarget}
          onRequestDelete={state.requestDelete}
          replacePickerOpen={replacePickerOpen}
          onReplacePickerOpenChange={setReplacePickerOpen}
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
          onRegenerateAltText={async (key) => {
            const result = await generateAltTextRemote(key);
            if (!result) return null;
            if (result.skipped) return result;
            await composer.media.updateAsset(key, {
              altText: result.altText,
              generatedMetadata: {
                altText: {
                  generatedAt: new Date().toISOString(),
                  model: result.model ?? DEFAULT_MODEL,
                },
              },
            });
            return result;
          }}
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
        icons={state.discIcons}
        loading={state.discLoading}
        searchQuery={state.discoverySearch}
        searchFailed={state.searchFailed}
        onSearch={state.discSearchAll}
        onLoadMore={state.loadMoreDisc}
        onSave={async (type, item) => {
          const saved = await state.saveToLibrary(type, item);
          if (saved) {
            setStockModalOpen(false);
            setStockSaved(saved);
          }
        }}
        onOpenIconPicker={handleOpenIconPicker}
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
        />
      )}
      {optimizeItem && (
        <OverlayMount open onClose={() => setOptimizeItem(null)}>
          <OptimizationPanel
            imageSrc={optimizeItem.src}
            onOptimized={async (src) => {
              await state.updateItem(optimizeItem.key, { src });
              setOptimizeItem(null);
              addToast({ description: `${optimizeItem.name} optimized`, tone: "success" });
            }}
            onClose={() => setOptimizeItem(null)}
          />
        </OverlayMount>
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
        open={moveModalOpen || menuMoveTarget !== null}
        items={menuMoveTarget ? [menuMoveTarget] : checkedItems}
        folders={state.allFolders}
        onClose={() => {
          setMoveModalOpen(false);
          setMenuMoveTarget(null);
        }}
        onMove={(folderId) =>
          void (menuMoveTarget
            ? runMove([menuMoveTarget.key], folderId, "menu")
            : runMove(checkedItems.map((i) => i.key), folderId))
        }
      />
      <MoveFailedModal
        open={moveFailure !== null}
        onClose={() => setMoveFailure(null)}
        onRetry={() => {
          if (moveFailure) void runMove(moveFailure.keys, moveFailure.folderId, moveFailure.from);
        }}
      />
      {/* Replace-all picker now lives inside <AssetDetailsPanel> — see
          ./components/AssetDetailsPanel.tsx (D5 Stage 2). */}
    </div>
  );
}

