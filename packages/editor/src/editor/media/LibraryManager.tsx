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
  Upload, Plus, Search, Download, AlertCircle,
} from "lucide-react";
import type { Composer } from "../../engine/Composer";
import { useMediaState } from "../sidebar/tabs/media/hooks/useMediaState";
import { StockSourceModal } from "../sidebar/tabs/media/components/StockSourceModal";
import { ConfirmDeleteModal } from "../sidebar/tabs/media/components/ConfirmDeleteModal";
import { MediaContextMenu } from "../sidebar/tabs/media/components/MediaContextMenu";
import { ImportUrlModal } from "./components/ImportUrlModal";
import { RenameAssetModal } from "./components/RenameAssetModal";
import { DownloadPreparedModal } from "./components/DownloadPreparedModal";
import { CreateFolderModal } from "./components/CreateFolderModal";
import { MoveAssetsModal } from "./components/MoveAssetsModal";
import { MoveFailedModal } from "./components/MoveFailedModal";
import { fetchUrlAsFile } from "./fetchUrlAsFile";
import { STORAGE_QUOTA_BYTES } from "../../shared/constants/media";
import { useToast, Button, TextInput, OverlayMount } from "@/editor/chrome-ui";
import { OptimizationPanel } from "./OptimizationPanel";
import type { LibraryItem } from "../sidebar/tabs/media/data/mediaTypes";
import type { IconConfig } from "../../shared/types/media";
import { FolderTree, type SmartFolder } from "./components/FolderTree";
import { AssetDetailsPanel } from "./components/AssetDetailsPanel";
import { AssetGrid } from "./components/AssetGrid";
import { formatBytes } from "@shared/utils/helpers/number";
import { formatQuotaSize } from "@/editor/sidebar/tabs/media/components/StorageQuotaBar";
import { generateAltTextRemote } from "../../services/AltTextService";
import { DEFAULT_MODEL } from "@buildrik/shared/schemas/ai";
import "./LibraryManager.css";

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

  // Usage count map: src → count (memoized to avoid N² on every render)
  const usageMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of state.libraryItems) {
      const count = composer.mediaOps.getUsages(item.src).count;
      if (count > 0) map.set(item.key, count);
    }
    return map;
  }, [state.libraryItems, composer]);

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

  // In-use/unused counts for badges
  const inUseCount = React.useMemo(
    () => state.libraryItems.filter((i) => (usageMap.get(i.key) ?? 0) > 0).length,
    [state.libraryItems, usageMap]
  );
  const unusedCount = state.libraryItems.length - inUseCount;
  const recentCount = React.useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return state.libraryItems.filter((i) => new Date(i.createdAt).getTime() >= cutoff).length;
  }, [state.libraryItems]);

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
     exactly it again. */
  const [moveFailure, setMoveFailure] = React.useState<{ keys: string[]; folderId: string | null } | null>(null);

  React.useEffect(() => {
    setMoveResult(null);
  }, [state.selectedKeys, state.selMode, selectedAssetId, state.currentFolderId, smartFolder]);

  const runMove = React.useCallback(
    async (keys: string[], folderId: string | null) => {
      const items = keys
        .map((k) => state.libraryItems.find((i) => i.key === k))
        .filter((i): i is LibraryItem => i !== undefined);
      const wasHere = new Set(items.filter((i) => (i.folderId ?? null) === folderId).map((i) => i.key));
      try {
        await state.bulkMoveAssets(keys, folderId);
      } catch {
        setMoveFailure({ keys, folderId });
        return;
      }
      setMoveFailure(null);
      const nameOf = (i: LibraryItem) => i.displayName ?? i.name;
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

  /* A dropped asset carries the whole checked set when it is part of it;
     an unchecked one moves alone even beside a selection. Same rule the
     retired 560 panel used; the result now reads in the rail. */
  const handleDropOnFolder = React.useCallback(
    (assetKey: string, folderId: string | null) => {
      const keys =
        state.selMode && state.selectedKeys.has(assetKey) ? Array.from(state.selectedKeys) : [assetKey];
      void runMove(keys, folderId);
    },
    [state.selMode, state.selectedKeys, runMove],
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

  const handleImportFromUrl = React.useCallback(async (url: string) => {
    try {
      addToast({ description: "Importing...", tone: "info", duration: 2000 });
      const file = await fetchUrlAsFile(url);
      state.upload([file]);
      addToast({ description: `${file.name} imported`, tone: "success" });
    } catch {
      addToast({ description: "Could not import from that URL", tone: "error" });
    }
  }, [state, addToast]);

  /* Clone 3700:20353 — "Upload files or move existing assets into this
     folder": files picked while a folder is the scope land IN that folder,
     the rule the drop path below already followed. The picker used to file
     everything at the root, so uploading from an empty folder's own CTA left
     that folder empty. */
  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        state.upload(Array.from(e.target.files), { folderId: state.currentFolderId });
        e.target.value = "";
      }
    },
    [state]
  );

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

  // Collect all unique tags from assets (Bug #9 fix)
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    const assets = composer.media.getAssets();
    for (const asset of assets) {
      if (Array.isArray(asset.tags)) {
        for (const tag of asset.tags) {
          if (tag && typeof tag === "string") tagSet.add(tag);
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [state.libraryItems, composer]);

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
            <TextInput
              ref={searchRef}
              type="text"
              placeholder="Search across all folders…"
              value={state.librarySearch}
              onChange={(e) => state.setLibraryQuery(e.target.value)}
            />
            <span className="mgr-kbd">⌘K</span>
          </div>
        </div>

        {/* Upload is the primary — it is the action the library exists for.
            Stock was primary here until the Clone walk. */}
        <div className="mgr-right">
          <Button className="mgr-btn" data-testid="mgr-btn-import" onClick={() => setImportUrlOpen(true)}>
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
          setLibrarySearch={state.setLibrarySearch}
          folderCounts={state.folderCounts}
          onNewFolder={() => setCreateFolderOpen(true)}
          deleteFolder={state.deleteFolder}
          onTrashClick={() =>
            addToast({ description: "Trash coming soon", tone: "info" })
          }
          onMoveAssetToFolder={handleDropOnFolder}
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
          selectedAssetId={selectedAssetId}
          onSelectAsset={setSelectedAssetId}
          onInsert={insertAndReturn}
          onUploadClick={handleUploadClick}
          onOpenStockModal={() => setStockModalOpen(true)}
          onMoveSelected={() => setMoveModalOpen(true)}
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
      <StockSourceModal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        activeType={state.activeType}
        photos={state.stockPhotos}
        videos={state.stockVideos}
        icons={state.discIcons}
        fonts={state.discFonts}
        loading={state.discLoading}
        searchQuery={state.discoverySearch}
        searchFailed={state.searchFailed}
        orientation={state.discOrientation}
        color={state.discColor}
        onSearch={state.discSearchAll}
        onSetOrientation={state.setDiscOrientation}
        onSetColor={state.setDiscColor}
        onLoadMore={state.loadMoreDisc}
        onSave={state.saveToLibrary}
        onInsert={insertAndReturn}
        onOpenIconPicker={handleOpenIconPicker}
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
          folders={state.folders}
          allFolders={state.allFolders}
          onInsert={(item) => insertAndReturn(item.key)}
          onSelect={(item) => state.enterSelectModeWith(item.key)}
          onRename={setRenameTarget}
          onMove={(item, fid) => state.moveAsset(item.key, fid)}
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
        onClose={() => setImportUrlOpen(false)}
        onImport={handleImportFromUrl}
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
      <MoveAssetsModal
        open={moveModalOpen}
        items={checkedItems}
        folders={state.allFolders}
        onClose={() => setMoveModalOpen(false)}
        onMove={(folderId) => void runMove(checkedItems.map((i) => i.key), folderId)}
      />
      <MoveFailedModal
        open={moveFailure !== null}
        onClose={() => setMoveFailure(null)}
        onRetry={() => {
          if (moveFailure) void runMove(moveFailure.keys, moveFailure.folderId);
        }}
      />
      {/* Replace-all picker now lives inside <AssetDetailsPanel> — see
          ./components/AssetDetailsPanel.tsx (D5 Stage 2). */}
    </div>
  );
}

