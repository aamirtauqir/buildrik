/**
 * Media Tab — Standardized Rebuild (10-Star Experience)
 * Flattened hierarchy, canonical SearchBar integration, and high-visibility Bulk Actions.
 * Matches BuildTab vertical rhythm.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame, useToast, Button } from "@/editor/chrome-ui";
import { Upload, Plus } from "lucide-react";
import type { Composer } from "../../../../engine/Composer";
import { ROW_LG } from "@shared/constants/layout";
import { SearchBar } from "../../shared/SearchBar";
import { AssetDetailOverlay } from "./components/AssetDetailOverlay";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { LibraryView } from "./components/LibraryView";
import { MediaContextMenu } from "./components/MediaContextMenu";
import { StockSourceModal } from "./components/StockSourceModal";
import { ReplaceAcrossDialog } from "./components/ReplaceAcrossDialog";
import { MEDIA_EVENTS } from "@/shared/constants/media";
import { TypePills } from "./components/TypePills";
import { UploadZone } from "./components/UploadZone";
import { useMediaState } from "./hooks/useMediaState";
import { SlimLauncher } from "./components/SlimLauncher";
import { ExpandedMediaPanel } from "./components/ExpandedMediaPanel";
import { SelectionContextBar } from "./components/SelectionContextBar";
import "./MediaTab.css";
import type { LibraryItem } from "./data/mediaTypes";
import { createAssetVersion } from "../../../../services/MediaVersionService";
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
      <PanelFrame className="med-tab">
        <PanelFrame.Header title="Media" {...props} />
        <PanelFrame.Body>
          <div className="med-no-project">Open a project to manage media.</div>
        </PanelFrame.Body>
      </PanelFrame>
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
          
          // Upload new file — await so we only claim success when it lands.
          const ok = await state.upload([file]);
          if (ok) {
            showToast(`New version of ${item.name} created ✓`, "success");
            // Record a server-side restore point of the pre-edit asset (synced
            // assets only). Lets the Versions tab roll the asset back to this
            // state. Best-effort: never block the edit on a version write.
            if (item.assetId) {
              createAssetVersion({
                assetId: item.assetId,
                url: item.src,
                bytes: item.size,
                edits: { via: "image-editor", newFile: fileName },
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error("Failed to process edited image:", err);
          showToast("Could not save edited version", "error");
        }
      });
    },
    [onOpenImageEditor, state, showToast]
  );

  // §18 — Optimize is now a tab inside the §15 detail drawer. handleOptimized
  // is passed to the drawer as onOptimized; OptimizationPanel inside the tab
  // calls it with the new data-URL, which we upload as a versioned copy.
  const handleOptimized = React.useCallback(async (optimizedSrc: string) => {
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
      await state.upload([file]);
      showToast(`Optimized ${item.name} ✓`, "success");
      // Record a server-side restore point of the pre-optimize asset.
      if (item.assetId) {
        createAssetVersion({
          assetId: item.assetId,
          url: item.src,
          bytes: item.size,
          edits: { via: "optimize", newFile: fileName },
        }).catch(() => {});
      }
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

  // Stock modal mounts in EVERY mode — SlimLauncher's "+ Stock" used to set
  // state that only the fullpage branch rendered (dead button, found in the
  // P5 live walk).
  const stockModal = (
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
  );

  if (onOpenLibrary) {
    if (state.panelExpanded) {
      return (
        <>
        <ExpandedMediaPanel
          composer={composer}
          state={state}
          onCompact={() => state.setPanelExpanded(false)}
          onOpenLibrary={onOpenLibrary}
          onClose={onClose}
          onOpenImageEditor={onOpenImageEditor}
          onReplaceAcross={handleReplaceAcross}
          onOptimized={handleOptimized}
          onOpenIconPicker={onOpenIconPicker}
        />
        {stockModal}
        </>
      );
    }
    return (
      <>
      <SlimLauncher
        composer={composer}
        libraryItems={state.libraryItems}
        activeType={state.activeType}
        counts={state.counts}
        searchQuery={state.librarySearch}
        storage={state.storage}
        uploadQueue={state.uploadQueue}
        usageMap={state.usageMap}
        appliedAssetKey={undefined}
        onInsert={state.insertToCanvas}
        onTypeChange={state.setType}
        onSearchChange={(q) => state.setLibrarySearch(q)}
        onUpload={state.upload}
        onRetryUpload={state.retryUpload}
        onOpenStock={() => setStockModalOpen(true)}
        onOpenLibrary={onOpenLibrary}
        onClose={onClose}
        selectionContext={state.selectionContext}
        onCancelSelection={() => state.setSelectionContext(null)}
      />
      {stockModal}
      </>
    );
  }

  // ─── Fullpage mode: render full manager content ──────────────────

  return (
    <PanelFrame
      className="med-tab"
      onDragEnter={state.handlePanelDragEnter}
      onDragLeave={state.handlePanelDragLeave}
      onDragOver={state.handlePanelDragOver}
      onDrop={state.handlePanelDrop}
    >
      {/* 0. Selection Mode Header (Snap-back context) */}
      {state.selectionContext && (
        <SelectionContextBar
          label={state.selectionContext.label}
          onCancel={() => state.setSelectionContext(null)}
        />
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
          <div style={{ width: 1, height: 24, background: 'var(--bk-border)' }} />
          <Button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--bk-ink-muted)',
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
      </div>
      {/* 5. Upload Zone (Library only) */}
      {(
        <UploadZone
          storage={state.storage}
          onUpload={state.upload}
          onRetryUpload={state.retryUpload}
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
          allFolders={state.allFolders}
          onInsert={(item) => state.insertToCanvas(item.key)}
          onSelect={(item) => state.enterSelectModeWith(item.key)}
          onRename={state.openDetail}
          onMove={(item, fid) => state.moveAsset(item.key, fid)}
          onDelete={(item) => state.requestDelete(item.key)}
          onCopyUrl={state.copyUrl}
          onClose={state.closeCtxMenu}
          onEditImage={handleEditImage}
          onReplaceAcross={handleReplaceAcross}
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
          onOptimized={handleOptimized}
          onReplaceAcross={handleReplaceAcross}
        />
      )}
      {stockModal}
    </PanelFrame>
  );
}
