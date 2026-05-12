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
import { TabFrame } from "@/shared/extensions/TabFrame";
import { ROW_LG } from "@shared/constants/layout";
import { SearchBar } from "../../shared/SearchBar";
import { AssetDetailOverlay } from "./components/AssetDetailOverlay";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { LibraryView } from "./components/LibraryView";
import { MediaContextMenu } from "./components/MediaContextMenu";
import { StockSourceModal } from "./components/StockSourceModal";
import { ReplaceAcrossDialog } from "./components/ReplaceAcrossDialog";
import { OptimizationOverlay } from "./components/OptimizationOverlay";
import { MEDIA_EVENTS } from "@/shared/constants/media";
import { TypePills } from "./components/TypePills";
import { UploadZone } from "./components/UploadZone";
import { useMediaState } from "./hooks/useMediaState";
import { SlimLauncher } from "./components/SlimLauncher";
import { ExpandedMediaPanel } from "./components/ExpandedMediaPanel";
import "./MediaTab.css";
import { useToast } from "@/editor/shared/vibcoder";
import type { LibraryItem } from "./data/mediaTypes";
import type { IconConfig } from "@shared/types/media";

interface MediaTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string) => void | Promise<void>,
  ) => void;
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
      <TabFrame className="med-tab">
        <TabFrame.Header title="Media" {...props} />
        <TabFrame.Body>
          <div className="med-no-project">Open a project to manage media.</div>
        </TabFrame.Body>
      </TabFrame>
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

  // §18 — opens OptimizationOverlay for img-only items via state.optimizeItem.
  // The overlay's onOptimized handler uploads the result as a new version
  // (mirrors handleEditImage pattern).
  const handleOptimize = React.useCallback((item: LibraryItem) => {
    state.setOptimizeItem(item);
  }, [state]);

  const handleOptimized = React.useCallback(async (optimizedSrc: string) => {
    const item = state.optimizeItem;
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

  // §21 — context-menu trigger. Opens file picker; on upload-complete,
  // sets replaceAcrossPair which mounts ReplaceAcrossDialog. Defined here
  // (before early return) so React hook order stays stable.
  const handleReplaceAcross = React.useCallback((oldItem: LibraryItem) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = oldItem.type === "vid" ? "video/*" : "image/*,.svg";
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const onComplete = (payload: unknown) => {
        const p = payload as { asset?: { src?: string }; fileName?: string };
        composer.media.off(MEDIA_EVENTS.UPLOAD_COMPLETE, onComplete);
        if (p?.asset?.src) {
          state.setReplaceAcrossPair({
            oldSrc: oldItem.src,
            newSrc: p.asset.src,
            oldLabel: oldItem.name,
            newLabel: p.fileName ?? "New asset",
          });
        }
      };
      composer.media.on(MEDIA_EVENTS.UPLOAD_COMPLETE, onComplete);
      state.upload([file]);
    };
    fileInput.click();
  }, [composer, state]);

  // ─── Panel mode: slim launcher (320px) or expanded panel (560px) ────
  if (onOpenLibrary) {
    if (state.panelExpanded) {
      return (
        <ExpandedMediaPanel
          composer={composer}
          state={state}
          onCompact={() => state.setPanelExpanded(false)}
          onOpenLibrary={onOpenLibrary}
          onClose={onClose}
          onOpenImageEditor={onOpenImageEditor}
          onReplaceAcross={handleReplaceAcross}
          onOptimize={handleOptimize}
          onOpenIconPicker={onOpenIconPicker}
        />
      );
    }
    return (
      <SlimLauncher
        composer={composer}
        libraryItems={state.libraryItems}
        onInsert={state.insertToCanvas}
        onOpenLibrary={onOpenLibrary}
        onUpload={state.upload}
        onClose={onClose}
        selectionContext={state.selectionContext}
        onCancelSelection={() => state.setSelectionContext(null)}
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
    <TabFrame
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
            <div style={{ width: 8, height: 8, borderRadius: 'var(--bd-radius-full)', background: 'rgba(255,255,255,0.6)', animation: 'bd-status-pulse 2s infinite' }} />
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
          onReplaceAcross={handleReplaceAcross}
          onOptimize={handleOptimize}
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
          onOptimize={handleOptimize}
        />
      )}
      {state.optimizeItem && (
        <OptimizationOverlay
          item={state.optimizeItem}
          onOptimized={handleOptimized}
          onClose={() => state.setOptimizeItem(null)}
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
    </TabFrame>
  );
}
