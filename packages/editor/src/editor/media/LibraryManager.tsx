import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
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
  Upload, Plus, X, Search, FolderOpen, Download, AlertCircle,
} from "lucide-react";
import type { Composer } from "../../engine/Composer";
import { useMediaState } from "../sidebar/tabs/media/hooks/useMediaState";
import { StockSourceModal } from "../sidebar/tabs/media/components/StockSourceModal";
import { ConfirmDeleteModal } from "../sidebar/tabs/media/components/ConfirmDeleteModal";
import { MediaContextMenu } from "../sidebar/tabs/media/components/MediaContextMenu";
import { AssetDetailOverlay } from "../sidebar/tabs/media/components/AssetDetailOverlay";
import { STORAGE_QUOTA_BYTES } from "../../shared/constants/media";
import { useToast } from "@/editor/shared/vibcoder";
import type { LibraryItem } from "../sidebar/tabs/media/data/mediaTypes";
import type { IconConfig } from "../../shared/types/media";
import { FolderTree, type SmartFolder } from "./components/FolderTree";
import { AssetDetailsPanel } from "./components/AssetDetailsPanel";
import { AssetGrid } from "./components/AssetGrid";
import { FolderBreadcrumb } from "../sidebar/tabs/media/components/FolderBreadcrumb";
import { fmtBytes } from "./utils/fmtBytes";
import { generateAltTextRemote } from "../../services/AltTextService";
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

// fmtBytes moved to ./utils/fmtBytes.ts (D5 Stage 2, audit-remediation 2026-05-08).

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

  // Selected asset details
  const selectedItem = React.useMemo(() => {
    if (!selectedAssetId) return null;
    return state.libraryItems.find((item) => item.key === selectedAssetId) || null;
  }, [selectedAssetId, state.libraryItems]);

  const usageCount = React.useMemo(() => {
    if (!selectedItem) return 0;
    return composer.mediaOps.getUsages(selectedItem.src).count;
  }, [selectedItem, composer]);

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

  // Build breadcrumb path
  const breadcrumbPath = React.useMemo(() => {
    const parts = [{ id: null as string | null, name: "Home" }];
    if (state.currentFolderId) {
      const folder = state.folders.find((f) => f.id === state.currentFolderId);
      if (folder) parts.push({ id: folder.id, name: folder.name });
    }
    return parts;
  }, [state.currentFolderId, state.folders]);

  const handleUploadClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFromUrl = React.useCallback(async () => {
    const url = window.prompt("Paste image or media URL:");
    if (!url?.trim()) return;
    try {
      addToast({ description: "Importing...", tone: "info", duration: 2000 });
      const res = await fetch(url.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = blob.type.split("/")[1] || "bin";
      const name = url.split("/").pop()?.split("?")[0] || `imported.${ext}`;
      const file = new File([blob], name, { type: blob.type });
      state.upload([file]);
      addToast({ description: `${name} imported`, tone: "success" });
    } catch {
      addToast({ description: "Could not import from that URL", tone: "error" });
    }
  }, [state, addToast]);

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        state.upload(Array.from(e.target.files));
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

  return (
    <div className="mgr">
      {/* ═══ TOP BAR ═══ */}
      <div className="mgr-top">
        <div className="mgr-title">
          <FolderOpen size={16} />
          Asset Library
          <span className="mgr-tag">MANAGE</span>
        </div>

        <div className="mgr-middle">
          <FolderBreadcrumb
            folders={state.folders}
            currentFolderId={state.currentFolderId}
            onNavigate={state.setCurrentFolderId}
          />
          <div className="mgr-search">
            <Search size={14} />
            <Input
              ref={searchRef}
              type="text"
              placeholder="Search across all folders..."
              value={state.librarySearch}
              onChange={(e) => state.setLibrarySearch(e.target.value)}
            />
            <span className="mgr-kbd">⌘K</span>
          </div>
        </div>

        <div className="mgr-right">
          <Button className="mgr-btn" onClick={handleImportFromUrl}>
            <Download size={14} />
            Import URL
          </Button>
          <Button className="mgr-btn" onClick={handleUploadClick}>
            <Upload size={14} />
            Upload
          </Button>
          <Button className="mgr-btn-primary" onClick={() => setStockModalOpen(true)}>
            <Plus size={14} />
            Add from stock
          </Button>
          <Button className="mgr-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </Button>
        </div>
      </div>
      {/* ═══ BODY ═══ */}
      <div className="mgr-body">
        {/* ─── LEFT: Folder tree ─── */}
        {/* D5 Stage 1 (audit-remediation 2026-05-08): LEFT panel + collapsed
            state + recursive renderer + TreeNode all live in
            ./components/FolderTree.tsx now. */}
        <FolderTree
          folders={state.folders}
          currentFolderId={state.currentFolderId}
          setCurrentFolderId={state.setCurrentFolderId}
          counts={state.counts}
          smartFolder={smartFolder}
          setSmartFolder={setSmartFolder}
          recentCount={recentCount}
          inUseCount={inUseCount}
          unusedCount={unusedCount}
          allTags={allTags}
          libraryItems={state.libraryItems}
          setLibrarySearch={state.setLibrarySearch}
          createFolder={state.createFolder}
          deleteFolder={state.deleteFolder}
          onTrashClick={() =>
            addToast({ description: "Trash coming soon", tone: "info" })
          }
        />

        {/* ─── MIDDLE: Asset grid ─── */}
        {/* D5 Stage 3 (audit-remediation 2026-05-08): MIDDLE panel +
            viewMode + sortMenuOpen + bulkMovePickerOpen all live in
            ./components/AssetGrid.tsx now. Virtualization deferred —
            see comment in AssetGrid.tsx for the full reasoning. */}
        <AssetGrid
          state={state}
          visibleItems={visibleItems}
          usageMap={usageMap}
          smartFolder={smartFolder}
          breadcrumbPath={breadcrumbPath}
          selectedAssetId={selectedAssetId}
          onSelectAsset={setSelectedAssetId}
          onUploadClick={handleUploadClick}
          onOpenStockModal={() => setStockModalOpen(true)}
          addToast={addToast}
        />
        {/* ─── RIGHT: Details rail ─── */}
        {/* D5 Stage 2 (audit-remediation 2026-05-08): RIGHT panel +
            detailTab + replaceAllPickerOpen all live in
            ./components/AssetDetailsPanel.tsx now. */}
        <AssetDetailsPanel
          selectedItem={selectedItem}
          versions={versions}
          usageCount={usageCount}
          libraryItems={state.libraryItems}
          onSelectAsset={setSelectedAssetId}
          onInsert={state.insertToCanvas}
          onEditImage={handleEditImage}
          onOpenRename={state.openDetail}
          onRequestDelete={state.requestDelete}
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
                  model: result.model ?? "claude-haiku-4-5",
                },
              },
            });
            return result;
          }}
        />
      </div>
      {/* ═══ STATUS BAR ═══ */}
      <div className="mgr-status">
        <span><strong style={{ color: "var(--buildrick-text-secondary)" }}>{state.counts.all}</strong> assets</span>
        <span className="mgr-status-dot" />
        <span>{fmtBytes(state.storage.used)} / {fmtBytes(state.storage.total)}</span>
        <div className="mgr-status-right">
          <div className="mgr-quota-bar">
            <div className="mgr-quota-fill" style={{ width: `${storageUsedPct}%` }} />
          </div>
          <span className="mgr-sync-pill">
            <AlertCircle size={10} />
            This device only
          </span>
        </div>
      </div>
      {/* Hidden file input */}
      <Input
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
        orientation={state.discOrientation}
        color={state.discColor}
        onSearch={state.discSearchAll}
        onSetOrientation={state.setDiscOrientation}
        onSetColor={state.setDiscColor}
        onLoadMore={state.loadMoreDisc}
        onSave={state.saveToLibrary}
        onInsert={state.insertToCanvas}
        onOpenIconPicker={handleOpenIconPicker}
      />
      {state.confirmDelete && (
        <ConfirmDeleteModal
          payload={state.confirmDelete}
          onConfirm={state.executeDelete}
          onCancel={state.cancelDelete}
        />
      )}
      {state.ctxMenu && (
        <MediaContextMenu
          x={state.ctxMenu.x}
          y={state.ctxMenu.y}
          item={state.ctxMenu.item}
          folders={state.folders}
          onRename={state.openDetail}
          onMove={(item, fid) => state.moveAsset(item.key, fid)}
          onDelete={(item) => state.requestDelete(item.key)}
          onCopyUrl={state.copyUrl}
          onClose={state.closeCtxMenu}
          onEditImage={handleEditImage}
        />
      )}
      {/* Bug #2 fix: mount AssetDetailOverlay so rename from context menu actually shows */}
      {state.detailItem && (
        <AssetDetailOverlay
          item={state.detailItem}
          onInsert={state.insertToCanvas}
          onRename={state.renameItem}
          onUpdate={state.updateItem}
          onDelete={(key) => {
            state.requestDelete(key);
            state.closeDetail();
          }}
          onClose={state.closeDetail}
          onEditImage={handleEditImage}
        />
      )}
      {/* Replace-all picker now lives inside <AssetDetailsPanel> — see
          ./components/AssetDetailsPanel.tsx (D5 Stage 2). */}
    </div>
  );
}

