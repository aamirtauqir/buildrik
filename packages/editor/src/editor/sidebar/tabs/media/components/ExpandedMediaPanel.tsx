/**
 * ExpandedMediaPanel — 560px expanded media panel (§12 prototype-v3).
 *
 * Rendered by MediaTab when `state.panelExpanded === true`. Composes:
 *  - Header: title + EXPANDED badge + Compact / Maximize / Close
 *  - Folder rail (180px): smart folders + user folders from MediaManager
 *  - Library area: TypePills + LibraryView with sort/format/grid-size controls
 *
 * Auto-expands on upload-complete (driven by useMediaState). Collapse via
 * the Compact button (header) or by explicit `setPanelExpanded(false)`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ConfirmDialog, useToast } from "@/editor/chrome-ui";
import { Maximize2, Minimize2, Plus, Upload, X } from "lucide-react";
import type { Composer } from "../../../../../engine/Composer";
import type { LibraryItem, MediaStateResult } from "../data/mediaTypes";
import type { IconConfig, MediaFolder } from "@shared/types/media";
import { TypePills } from "./TypePills";
import { LibraryView } from "./LibraryView";
import { FolderBreadcrumb } from "./FolderBreadcrumb";
import { AssetDetailOverlay } from "./AssetDetailOverlay";
import { MediaContextMenu } from "./MediaContextMenu";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { EmptyFolderDropZone } from "./EmptyFolderDropZone";
import { FolderContextMenu } from "./FolderContextMenu";
import { StockSourceModal } from "./StockSourceModal";
import { ReplaceAcrossDialog } from "./ReplaceAcrossDialog";
import "../MediaTab.css";
import "./ExpandedMediaPanel.css";
import { Button } from "@/editor/chrome-ui";
import { TextField } from "@/editor/chrome-ui";

export interface ExpandedMediaPanelProps {
  composer: Composer;
  state: MediaStateResult;
  onCompact(): void;
  onOpenLibrary(opts?: { searchQuery?: string; folderId?: string | null }): void;
  onClose?(): void;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string) => void | Promise<void>,
  ) => void;
  onReplaceAcross?: (oldItem: LibraryItem) => void;
  /** §18 — uploads optimized output from inline Optimize tab as a new version. */
  onOptimized?: (optimizedSrc: string) => void | Promise<void>;
  /** §20 — opens IconPickerModal; threaded into StockSourceModal "Add icon" button. */
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
}

export function ExpandedMediaPanel({
  composer,
  state,
  onCompact,
  onOpenLibrary,
  onClose,
  onOpenImageEditor,
  onReplaceAcross,
  onOptimized,
  onOpenIconPicker,
}: ExpandedMediaPanelProps) {
  const { addToast } = useToast();
  const showToast = React.useCallback((msg: string, type: "success" | "error" | "info") => {
    addToast({ description: msg, tone: type });
  }, [addToast]);
  const [stockModalOpen, setStockModalOpen] = React.useState(false);

  const handleEditImage = React.useCallback(
    (item: LibraryItem) => {
      if (!onOpenImageEditor) return;
      onOpenImageEditor(item.src, async (editedSrc) => {
        try {
          const res = await fetch(editedSrc);
          const blob = await res.blob();
          const timestamp = new Date().getTime();
          const cleanName = item.name.replace(/(_v\d+)?$/, "");
          const fileName = `${cleanName}_v${timestamp % 10000}`;
          const file = new File([blob], `${fileName}.${blob.type.split("/")[1]}`, { type: blob.type });
          state.upload([file]);
          showToast(`New version of ${item.name} created ✓`, "success");
        } catch (err) {
          console.error("Edit failed:", err);
          showToast("Could not save edited version", "error");
        }
      });
    },
    [onOpenImageEditor, state, showToast]
  );

  // §20 — smart wrapper. The raw `onOpenIconPicker` opens the modal but expects
  // the caller to supply an `onSelect` handler. StockSourceModal's "Browse full
  // icon library" button passes a no-op, so without this wrapper picking an
  // icon would do nothing in panel mode. Mirrors MediaTab's fullpage wrapper.
  const triggerIconPicker = React.useCallback(() => {
    if (!onOpenIconPicker) return;
    onOpenIconPicker(undefined, (icon) => {
      try {
        composer.mediaOps.insertMedia(icon.name, "icon");
        showToast(`${icon.name} icon added ✓`, "success");
      } catch {
        showToast("Could not add icon", "error");
      }
    });
  }, [onOpenIconPicker, composer, showToast]);

  // §18 — fallback uploads optimized output to library when parent doesn't pass
  // onOptimized (rare; mostly local-only test mount).
  const localOptimized = React.useCallback(async (optimizedSrc: string) => {
    const item = state.detailItem;
    if (!item) return;
    try {
      const res = await fetch(optimizedSrc);
      const blob = await res.blob();
      const timestamp = new Date().getTime();
      const cleanName = item.name.replace(/(_v\d+)?$/, "");
      const ext = blob.type.split("/")[1] || "webp";
      const fileName = `${cleanName}_opt_v${timestamp % 10000}`;
      const file = new File([blob], `${fileName}.${ext}`, { type: blob.type });
      state.upload([file]);
      showToast(`Optimized ${item.name} ✓`, "success");
    } catch (err) {
      console.error("Failed to save optimized image:", err);
      showToast("Could not save optimized image", "error");
    }
  }, [state, showToast]);
  const optimizedHandler = onOptimized ?? localOptimized;
  // Subscribe to folder list — keep it minimal; full FolderTree component
  // (used in fullpage LibraryManager) is too prop-heavy for this slim form.
  const [folders, setFolders] = React.useState<MediaFolder[]>([]);
  // Use shared state from useLibraryState (via useMediaState) so clicking a
  // folder here actually filters the grid. Previously a LOCAL state slice
  // here didn't propagate to useLibraryState's filter loop.
  const currentFolderId = state.currentFolderId;
  const setCurrentFolderId = state.setCurrentFolderId;

  // §13 — drag-to-folder snap target. Tracks which folder the user is
  // currently hovering during a drag so we can apply the snap outline.
  // Sentinel "__root__" represents the "All assets" target.
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);

  // §13 — folder context menu (right-click). { folderId, folderName, x, y }
  const [folderMenu, setFolderMenu] = React.useState<
    { folderId: string; folderName: string; x: number; y: number } | null
  >(null);

  // §13 — folder inline-rename. id of the folder currently being renamed.
  const [renamingFolderId, setRenamingFolderId] = React.useState<string | null>(null);
  const [renameDraft, setRenameDraft] = React.useState("");

  // §13 — folder delete confirm. Inspect result includes asset/subfolder count.
  const [deleteFolderTarget, setDeleteFolderTarget] = React.useState<
    { folderId: string; folderName: string; assetCount: number; subFolderCount: number } | null
  >(null);

  const handleFolderContextMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    folder: MediaFolder,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderMenu({
      folderId: folder.id,
      folderName: folder.name,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleStartRename = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    setRenamingFolderId(folderId);
    setRenameDraft(folder.name);
  };

  const handleCommitRename = async () => {
    const id = renamingFolderId;
    const next = renameDraft.trim();
    setRenamingFolderId(null);
    setRenameDraft("");
    if (!id || !next) return;
    const folder = folders.find((f) => f.id === id);
    if (folder && folder.name === next) return;
    try {
      await state.renameFolder(id, next);
    } catch (err) {
      showToast(
        `Rename failed: ${err instanceof Error ? err.message : "unknown error"}`,
        "error",
      );
    }
  };

  const handleCancelRename = () => {
    setRenamingFolderId(null);
    setRenameDraft("");
  };

  const handleStartDelete = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    const { assetCount, subFolderCount } = state.inspectFolder(folderId);
    setDeleteFolderTarget({
      folderId,
      folderName: folder.name,
      assetCount,
      subFolderCount,
    });
  };

  const handleConfirmDelete = async () => {
    const target = deleteFolderTarget;
    setDeleteFolderTarget(null);
    if (!target) return;
    try {
      await state.deleteFolder(target.folderId, { force: true });
      showToast(`Folder '${target.folderName}' deleted.`, "success");
    } catch (err) {
      showToast(
        `Delete failed: ${err instanceof Error ? err.message : "unknown error"}`,
        "error",
      );
    }
  };

  const readDraggedAssetKey = (e: React.DragEvent<HTMLElement>): string => {
    return (
      e.dataTransfer.getData("application/x-buildrik-media-asset-key") ||
      e.dataTransfer.getData("text/plain") ||
      ""
    );
  };

  const handleFolderDragOver = (
    e: React.DragEvent<HTMLElement>,
    id: string | null,
  ) => {
    // preventDefault is required for the drop event to fire at all.
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const marker = id ?? "__root__";
    if (dropTargetId !== marker) setDropTargetId(marker);
  };

  const handleFolderDragLeave = (id: string | null) => {
    const marker = id ?? "__root__";
    setDropTargetId((prev) => (prev === marker ? null : prev));
  };

  const handleFolderDrop = (
    e: React.DragEvent<HTMLElement>,
    folderId: string | null,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const assetKey = readDraggedAssetKey(e);
    setDropTargetId(null);
    if (!assetKey) return;
    // Multi-select drag: if the dragged asset is part of the active
    // selection set, move the whole set; otherwise single-asset move.
    if (state.selMode && state.selectedKeys.has(assetKey) && state.selectedKeys.size > 1) {
      state.bulkMoveAssets(Array.from(state.selectedKeys), folderId);
    } else {
      state.moveAsset(assetKey, folderId);
    }
  };

  React.useEffect(() => {
    const refresh = () => {
      try {
        setFolders(composer.media.getFolders(null) ?? []);
      } catch {
        setFolders([]);
      }
    };
    refresh();
    composer.media.on("media:folder:created", refresh);
    composer.media.on("media:folder:deleted", refresh);
    composer.media.on("media:folder:updated", refresh);
    return () => {
      composer.media.off("media:folder:created", refresh);
      composer.media.off("media:folder:deleted", refresh);
      composer.media.off("media:folder:updated", refresh);
    };
  }, [composer]);

  const totalCount = state.libraryItems.length;

  return (
    <div
      className="exp-panel"
      onDragEnter={state.handlePanelDragEnter}
      onDragLeave={state.handlePanelDragLeave}
      onDragOver={state.handlePanelDragOver}
      onDrop={state.handlePanelDrop}
    >
      <header className="exp-panel__header">
        <div className="exp-panel__title-group">
          <h3 className="exp-panel__title">Media library</h3>
          <span className="exp-panel__badge">EXPANDED</span>
        </div>
        <div className="exp-panel__actions">
          <Button
            type="button"
            className="med-stock-btn"
            onClick={() => setStockModalOpen(true)}
            title="Browse stock photos, videos, icons, fonts"
          >
            <Plus size={12} />
            Stock
          </Button>
          <Button
            type="button"
            className="exp-panel__compact-btn"
            onClick={onCompact}
            title="Collapse to compact view"
            aria-label="Collapse panel"
          >
            <Minimize2 size={12} />
            Compact
          </Button>
          <Button
            type="button"
            className="exp-panel__icon-btn"
            onClick={() => onOpenLibrary()}
            title="Open full library (⌘⇧M)"
            aria-label="Open full library"
          >
            <Maximize2 size={14} />
          </Button>
          {onClose ? (
            <Button
              type="button"
              className="exp-panel__icon-btn"
              onClick={onClose}
              title="Close"
              aria-label="Close panel"
            >
              <X size={14} />
            </Button>
          ) : null}
        </div>
      </header>

      <div className="exp-panel__body">
        {/* Folder rail */}
        <nav className="exp-panel__folders" aria-label="Folders">
          <div className="exp-panel__folders-head">
            <span className="exp-panel__folders-label">Folders</span>
          </div>
          <div className="exp-panel__folder-list">
            <Button
              type="button"
              data-folder-id="__root__"
              className={`exp-folder-item${currentFolderId === null ? " is-active" : ""}${dropTargetId === "__root__" ? " is-drop-target" : ""}`}
              onClick={() => setCurrentFolderId(null)}
              onDragOver={(e) => handleFolderDragOver(e, null)}
              onDragLeave={() => handleFolderDragLeave(null)}
              onDrop={(e) => handleFolderDrop(e, null)}
            >
              <span className="exp-folder-item__name">All assets</span>
              <span className="exp-folder-item__count">{totalCount}</span>
            </Button>
            {folders.map((f) => (
              <Button
                key={f.id}
                type="button"
                data-folder-id={f.id}
                className={`exp-folder-item${currentFolderId === f.id ? " is-active" : ""}${dropTargetId === f.id ? " is-drop-target" : ""}`}
                onClick={() => {
                  if (renamingFolderId !== f.id) setCurrentFolderId(f.id);
                }}
                onContextMenu={(e) => handleFolderContextMenu(e, f)}
                onDragOver={(e) => handleFolderDragOver(e, f.id)}
                onDragLeave={() => handleFolderDragLeave(f.id)}
                onDrop={(e) => handleFolderDrop(e, f.id)}
              >
                {renamingFolderId === f.id ? (
                  <TextField
                    type="text"
                    className="exp-folder-item__rename-input"
                    value={renameDraft}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={handleCommitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCommitRename();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelRename();
                      }
                    }}
                  />
                ) : (
                  <span className="exp-folder-item__name">{f.name}</span>
                )}
              </Button>
            ))}
          </div>
        </nav>

        {/* Library area */}
        <div className="exp-panel__library">
          <FolderBreadcrumb
            folders={state.allFolders}
            currentFolderId={currentFolderId}
            onNavigate={setCurrentFolderId}
          />
          <TypePills
            activeType={state.activeType}
            counts={state.counts}
            discMode={false}
            onTypeChange={state.setType}
          />
          {currentFolderId !== null &&
          state.libraryItems.length === 0 &&
          !state.librarySearch ? (
            <EmptyFolderDropZone
              folderName={
                folders.find((f) => f.id === currentFolderId)?.name ?? "this folder"
              }
              onFiles={(files) => state.upload(files, { folderId: currentFolderId })}
            />
          ) : (
            <LibraryView
              items={state.libraryItems}
              uploadQueue={state.uploadQueue}
              activeType={state.activeType}
              counts={state.counts}
              sort={state.sort}
              sortDir={state.sortDir}
              gridN={state.gridN}
              fmtFilter={state.fmtFilter}
              selMode={state.selMode}
              selectedKeys={state.selectedKeys}
              searchQuery={state.librarySearch}
              allFolders={state.allFolders}
              onSort={state.setSort}
              onGridN={state.setGridN}
              onFmt={state.setFmtFilter}
              onSelToggle={state.toggleSelMode}
              onSelect={state.toggleSelect}
              onShiftSelect={state.shiftSelect}
              onSelectAll={state.selectAll}
              onRequestBulkDelete={state.requestBulkDelete}
              onRequestDelete={state.requestDelete}
              onInsert={state.insertToCanvas}
              onCtxMenu={state.openCtxMenu}
              onDetail={state.openDetail}
              onMoveSelected={(folderId) => {
                state.bulkMoveAssets(Array.from(state.selectedKeys), folderId);
                state.toggleSelMode();
              }}
            />
          )}
        </div>
      </div>

      {/* §22 — drag-over overlay (mirrors MediaTab fullpage path) */}
      {state.panelDragOver && (
        <div className="med-drag-overlay" role="status" aria-live="polite">
          <Upload size={24} />
          <div className="med-drag-label">Drop to upload to Library</div>
        </div>
      )}

      {/* Action overlays (mirror MediaTab.tsx fullpage path) */}
      {state.ctxMenu && (
        <MediaContextMenu
          x={state.ctxMenu.x}
          y={state.ctxMenu.y}
          item={state.ctxMenu.item}
          folders={state.folders}
          allFolders={state.allFolders}
          onInsert={(item) => state.insertToCanvas(item.key)}
          onSelect={(item) => state.enterSelectModeWith(item.key)}
          onRename={state.openDetail}
          onMove={(item, fid) => state.moveAsset(item.key, fid)}
          onDelete={(item) => state.requestDelete(item.key)}
          onCopyUrl={state.copyUrl}
          onClose={state.closeCtxMenu}
          onEditImage={handleEditImage}
          onReplaceAcross={onReplaceAcross ?? (() => {})}
        />
      )}
      {state.replaceAcrossPair && (
        <ReplaceAcrossDialog
          composer={composer}
          oldSrc={state.replaceAcrossPair.oldSrc}
          newSrc={state.replaceAcrossPair.newSrc}
          oldLabel={state.replaceAcrossPair.oldLabel}
          newLabel={state.replaceAcrossPair.newLabel}
          onClose={() => state.setReplaceAcrossPair(null)}
        />
      )}
      {state.confirmDelete && (
        <ConfirmDeleteModal
          payload={state.confirmDelete}
          onConfirm={state.executeDelete}
          onCancel={state.cancelDelete}
        />
      )}
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
          composer={composer}
          libraryItems={state.libraryItems}
          onOpenItem={state.openDetail}
          onOptimized={optimizedHandler}
          onReplaceAcross={onReplaceAcross}
        />
      )}
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
        onSave={(type, item) => { state.saveToLibrary(type, item); }}
        onInsert={state.insertToCanvas}
        onOpenIconPicker={onOpenIconPicker ? triggerIconPicker : undefined}
      />
      {folderMenu && (
        <FolderContextMenu
          folderId={folderMenu.folderId}
          folderName={folderMenu.folderName}
          x={folderMenu.x}
          y={folderMenu.y}
          onClose={() => setFolderMenu(null)}
          onRename={handleStartRename}
          onDelete={handleStartDelete}
        />
      )}
      <ConfirmDialog
        open={!!deleteFolderTarget}
        onClose={() => setDeleteFolderTarget(null)}
        onConfirm={handleConfirmDelete}
        title={
          deleteFolderTarget
            ? `Delete "${deleteFolderTarget.folderName}"?`
            : "Delete folder?"
        }
        message={
          deleteFolderTarget && (deleteFolderTarget.assetCount > 0 || deleteFolderTarget.subFolderCount > 0)
            ? `This folder contains ${deleteFolderTarget.assetCount} item${deleteFolderTarget.assetCount === 1 ? "" : "s"}${deleteFolderTarget.subFolderCount > 0 ? ` and ${deleteFolderTarget.subFolderCount} subfolder${deleteFolderTarget.subFolderCount === 1 ? "" : "s"}` : ""}. Items will move to the parent folder.`
            : "Are you sure you want to delete this folder?"
        }
        confirmLabel="Delete Folder"
        destructive
      />
    </div>
  );
}
