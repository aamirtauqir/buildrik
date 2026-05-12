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
import { Maximize2, Minimize2, Plus, Upload, X } from "lucide-react";
import { Button } from "@/editor/shared/vibcoder/Button";
import type { Composer } from "../../../../../engine/Composer";
import type { LibraryItem, MediaStateResult } from "../data/mediaTypes";
import type { MediaFolder } from "@shared/types/media";
import { useToast } from "@/editor/shared/vibcoder";
import { TypePills } from "./TypePills";
import { LibraryView } from "./LibraryView";
import { AssetDetailOverlay } from "./AssetDetailOverlay";
import { MediaContextMenu } from "./MediaContextMenu";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { StockSourceModal } from "./StockSourceModal";
import "../MediaTab.css";
import "./ExpandedMediaPanel.css";

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
}

export function ExpandedMediaPanel({
  composer,
  state,
  onCompact,
  onOpenLibrary,
  onClose,
  onOpenImageEditor,
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
  // Subscribe to folder list — keep it minimal; full FolderTree component
  // (used in fullpage LibraryManager) is too prop-heavy for this slim form.
  const [folders, setFolders] = React.useState<MediaFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);

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
    <div className="exp-panel">
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
              className={`exp-folder-item${currentFolderId === null ? " is-active" : ""}`}
              onClick={() => setCurrentFolderId(null)}
            >
              <span className="exp-folder-item__name">All assets</span>
              <span className="exp-folder-item__count">{totalCount}</span>
            </Button>
            {folders.map((f) => (
              <Button
                key={f.id}
                type="button"
                className={`exp-folder-item${currentFolderId === f.id ? " is-active" : ""}`}
                onClick={() => setCurrentFolderId(f.id)}
              >
                <span className="exp-folder-item__name">{f.name}</span>
              </Button>
            ))}
          </div>
        </nav>

        {/* Library area */}
        <div className="exp-panel__library">
          <TypePills
            activeType={state.activeType}
            counts={state.counts}
            discMode={false}
            onTypeChange={state.setType}
          />
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
            onSort={state.setSort}
            onGridN={state.setGridN}
            onFmt={state.setFmtFilter}
            onSelToggle={state.toggleSelMode}
            onSelect={state.toggleSelect}
            onSelectAll={state.selectAll}
            onRequestBulkDelete={state.requestBulkDelete}
            onRequestDelete={state.requestDelete}
            onInsert={state.insertToCanvas}
            onCtxMenu={state.openCtxMenu}
            onDetail={state.openDetail}
          />
        </div>
      </div>

      {/* Action overlays (mirror MediaTab.tsx fullpage path) */}
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
      />
    </div>
  );
}
