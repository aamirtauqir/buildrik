import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * Media Tab — Standardized Rebuild (10-Star Experience)
 * Flattened hierarchy, canonical SearchBar integration, and high-visibility Bulk Actions.
 * Matches BuildTab vertical rhythm.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Upload, Plus } from "lucide-react";
import type { Composer } from "../../../../engine/Composer";
import { PanelShell } from "@shared/ui/panel";
import { ROW_LG } from "@shared/constants/layout";
import { SearchBar } from "../../shared/SearchBar";
import { AssetDetailOverlay } from "./components/AssetDetailOverlay";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { LibraryView } from "./components/LibraryView";
import { MediaContextMenu } from "./components/MediaContextMenu";
import { StockSourceModal } from "./components/StockSourceModal";
import { TypePills } from "./components/TypePills";
import { UploadZone } from "./components/UploadZone";
import { useMediaState } from "./hooks/useMediaState";
import { SlimLauncher } from "./components/SlimLauncher";
import "./MediaTab.css";
import { useToast } from "@/editor/shared/vibcoder";
import type { LibraryItem } from "./data/mediaTypes";
import type { IconConfig } from "../../../../../shared/types/media";

interface MediaTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  onOpenImageEditor?: (imageSrc: string, onSave: (editedSrc: string) => void) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  /** When provided, MediaTab renders as the slim 280px launcher (panel mode). */
  onOpenLibrary?: (opts?: { searchQuery?: string; folderId?: string | null }) => void;
}

export function MediaTab(props: MediaTabProps) {
  if (!props.composer) {
    return (
      <PanelShell className="med-tab">
        <PanelShell.Header title="Media" {...props} />
        <PanelShell.Content>
          <div className="med-no-project">Open a project to manage media.</div>
        </PanelShell.Content>
      </PanelShell>
    );
  }
  return <MediaTabWithComposer {...props} composer={props.composer} />;
}

function MediaTabWithComposer({
  composer,
  onClose,
  onOpenImageEditor,
  onOpenIconPicker,
  onOpenLibrary,
}: Omit<MediaTabProps, "composer"> & { composer: Composer }) {
  const state = useMediaState(composer);
  const { addToast } = useToast();
  const [stockModalOpen, setStockModalOpen] = React.useState(false);

  const showToast = React.useCallback((msg: string, type: "success" | "error" | "info") => {
    addToast({ description: msg, tone: type });
  }, [addToast]);

  const handleEditImage = React.useCallback(
    (item: LibraryItem) => {
      if (!onOpenImageEditor) return;
      onOpenImageEditor(item.src, async (editedSrc) => {
        try {
          // Convert data URL to Blob
          const res = await fetch(editedSrc);
          const blob = await res.blob();
          
          // Non-destructive: Create a new filename with version/timestamp
          const timestamp = new Date().getTime();
          const cleanName = item.name.replace(/(_v\d+)?$/, ""); // Remove old version tag if any
          const fileName = `${cleanName}_v${timestamp % 10000}`;
          
          const file = new File([blob], `${fileName}.${blob.type.split('/')[1]}`, { type: blob.type });
          
          // Upload new file
          state.upload([file]);
          showToast(`New version of ${item.name} created ✓`, "success");
        } catch (err) {
          console.error("Failed to process edited image:", err);
          showToast("Could not save edited version", "error");
        }
      });
    },
    [onOpenImageEditor, state, showToast]
  );

  // ─── Panel mode: render slim launcher ──────────────────────���──────
  if (onOpenLibrary) {
    return (
      <SlimLauncher
        composer={composer}
        libraryItems={state.libraryItems}
        onInsert={state.insertToCanvas}
        onOpenLibrary={onOpenLibrary}
        onUpload={state.upload}
        onClose={onClose}
      />
    );
  }

  // ─── Fullpage mode: render full manager content ──────────────────
  const handleOpenIconPicker = React.useCallback(() => {
    if (!onOpenIconPicker) return;
    onOpenIconPicker(undefined, (icon) => {
      try {
        const result = composer.mediaOps.insertMedia(icon.name, "icon");
        if (result) {
          showToast(`${icon.name} icon added ✓`, "success");
        }
      } catch {
        showToast("Could not add icon", "error");
      }
    });
  }, [onOpenIconPicker, composer, showToast]);

  return (
    <PanelShell
      className="med-tab"
      onDragEnter={state.handlePanelDragEnter}
      onDragLeave={state.handlePanelDragLeave}
      onDragOver={state.handlePanelDragOver}
      onDrop={state.handlePanelDrop}
    >
      {/* 0. Selection Mode Header (Snap-back context) */}
      {state.selectionContext && (
        <div className="med-selection-bar" style={{
          background: 'var(--bd-accent)',
          color: 'white',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13,
          fontWeight: 500
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 'var(--bd-radius-full)', background: 'rgba(255,255,255,0.6)', animation: 'pulse 2s infinite' }} />
            Selecting image for: <span style={{ opacity: 0.9 }}>{state.selectionContext.label || 'Canvas Element'}</span>
          </div>
          <Button 
            onClick={() => state.setSelectionContext(null)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '2px 10px',
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer'
            }}
          >
            Cancel Selection
          </Button>
        </div>
      )}
      {/* 1. Header bar — type pills + stock button + close */}
      <div className="med-tabs-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: ROW_LG }}>
        <TypePills
          activeType={state.activeType}
          counts={state.counts}
          discMode={false}
          onTypeChange={state.setType}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button className="med-stock-btn" onClick={() => setStockModalOpen(true)}>
            <Plus size={14} />
            Add from Stock
          </Button>
          <div style={{ width: 1, height: 24, background: 'var(--bd-border-light)' }} />
          <Button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--bd-fg-muted)',
            cursor: 'pointer', padding: 4, display: 'flex'
          }}>
            <Upload size={18} style={{ transform: 'rotate(180deg)' }} />
          </Button>
        </div>
      </div>
      {/* 2. Unified Library */}
      <div className="med-content">
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
          onSearchChange={state.setLibrarySearch}
          folders={state.folders}
          currentFolderId={state.currentFolderId}
          setCurrentFolderId={state.setCurrentFolderId}
          onCreateFolder={state.createFolder}
          onDeleteFolder={state.deleteFolder}
          onMoveAsset={state.moveAsset}
          stockPhotos={state.stockPhotos}
          stockVideos={state.stockVideos}
          discLoading={state.discLoading}
          onSaveToLibrary={state.saveToLibrary}
          onEditImage={handleEditImage}
        />
      </div>
      {/* 5. Upload Zone (Library only) */}
      {(
        <UploadZone
          storage={state.storage}
          onUpload={state.upload}
          uploadQueue={state.uploadQueue}
          disabled={state.storage.used >= state.storage.total}
        />
      )}
      {/* Drag Feedback Overlay */}
      {state.panelDragOver && (
        <div className="med-drag-overlay">
          <Upload size={24} />
          <div className="med-drag-label">Drop to upload to Library</div>
        </div>
      )}
      {/* Action Modals */}
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
      {/* Stock Source Modal — replaces old Discovery tab */}
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
        onSave={(type, item) => {
          state.saveToLibrary(type, item);
          // Don't close modal — let user save multiple items
        }}
        onInsert={state.insertToCanvas}
        onOpenIconPicker={handleOpenIconPicker}
      />
    </PanelShell>
  );
}
