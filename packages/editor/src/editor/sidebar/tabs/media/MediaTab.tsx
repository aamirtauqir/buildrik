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
import { IconBrowserOverlay } from "./components/IconBrowserOverlay";
import { StockBrowserOverlay } from "./components/StockBrowserOverlay";
import { ExpandedMediaPanel } from "./components/ExpandedMediaPanel";
import { SelectionContextBar } from "./components/SelectionContextBar";
import "./MediaTab.css";
import type { LibraryItem } from "./data/mediaTypes";
import { createAssetVersion } from "../../../../services/MediaVersionService";
import type { IconConfig } from "@shared/types/media";

interface MediaTabProps {
  composer: Composer | null;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
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
  const [iconBrowserOpen, setIconBrowserOpen] = React.useState(false);
  /*
    Boards 303:1997 / 303:2032 draw a status pill over the grid while a
    long-running media job is happening: "Image editor — crop · rotate ·
    adjust" while the editor is open, "Optimising → WebP…" while an optimised
    copy is being written. Both spans are owned here.

    The editor pill has no close signal to hang off: the modal's open state
    lives in AquibraStudio, which this tab cannot reach. It clears on save
    completion, and on the first pointerdown back in the drawer — while the
    editor is open the drawer is inert, so that gesture only happens after the
    user has left the modal.
  */
  const [statusPill, setStatusPill] = React.useState<string | null>(null);
  const [stockBrowserOpen, setStockBrowserOpen] = React.useState(false);

  const showToast = React.useCallback((msg: string, type: "success" | "error" | "info") => {
    addToast({ description: msg, tone: type });
  }, [addToast]);

  const handleEditImage = React.useCallback(
    (item: LibraryItem) => {
      if (!onOpenImageEditor) return;
      setStatusPill("Image editor — crop · rotate · adjust");
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
        } finally {
          setStatusPill(null);
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
    setStatusPill("Optimising → WebP…");
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
    } finally {
      setStatusPill(null);
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

  /*
    Mounted by EVERY branch, not just the fullpage one. The detail overlay and
    the delete confirm used to live inside the fullpage return, so the drawer —
    the surface the board's five drill-ins hang off — could not reach
    asset-detail, versions or used-in at all. Same shape as the `stockModal`
    note above: a modal that only one of three renderers mounts is a feature
    that exists for a third of its users.
  */
  const sharedOverlays = (
    <>
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
          onUpdate={state.updateItem}
          onClose={state.closeDetail}
          onEditImage={handleEditImage}
          composer={composer}
          onOptimized={handleOptimized}
          onReplaceAcross={handleReplaceAcross}
        />
      )}
    </>
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
        activeTypes={state.activeTypes}
        counts={state.counts}
        searchQuery={state.librarySearch}
        storage={state.storage}
        uploadQueue={state.uploadQueue}
        usageMap={state.usageMap}
        appliedAssetKey={undefined}
        onInsert={state.insertToCanvas}
        onToggleType={state.toggleType}
        onSearchChange={(q) => state.setLibrarySearch(q)}
        onExpand={() => state.setPanelExpanded(true)}
        statusPill={statusPill}
        onDismissStatusPill={() => setStatusPill(null)}
        onUpload={state.upload}
        onRetryUpload={state.retryUpload}
        loading={state.libraryLoading}
        loadError={state.libraryError}
        onRetryLoad={state.retryLibraryLoad}
        currentFolderId={state.currentFolderId}
        allFolders={state.allFolders}
        onFolderChange={state.setCurrentFolderId}
        selectionMode={state.selMode}
        selectedKeys={state.selectedKeys}
        onEnterSelection={(key) => {
          if (!state.selMode) state.toggleSelMode();
          state.toggleSelect(key);
        }}
        onToggleSelect={state.toggleSelect}
        onExitSelection={state.toggleSelMode}
        // Move needs a destination, and the drawer has no folder picker of its
        // own yet — the fullpage manager owns that popover. Until it does, the
        // control opens the library where the picker lives rather than
        // pretending to work. (Board 145:349 draws "Move to…" with an ellipsis,
        // which is the same promise: a second step follows.)
        onBulkMove={onOpenLibrary ? () => onOpenLibrary() : undefined}
        onBulkDelete={() =>
          state.requestBulkDelete(
            state.libraryItems.filter((i) => state.selectedKeys.has(i.key)),
          )
        }
        onOpenStock={() => setStockBrowserOpen(true)}
        onOpenLibrary={onOpenLibrary}
        onClose={onClose}
        onOpenDetail={state.openDetail}
        onOpenIconPicker={() => setIconBrowserOpen(true)}
        selectionContext={state.selectionContext}
        onCancelSelection={() => state.setSelectionContext(null)}
      />
      {stockBrowserOpen && (
        <StockBrowserOverlay
          onClose={() => setStockBrowserOpen(false)}
          photos={state.stockPhotos}
          videos={state.stockVideos}
          loading={state.discLoading}
          searchQuery={state.discoverySearch}
          orientation={state.discOrientation}
          color={state.discColor}
          onSearch={state.discSearchAll}
          onSetOrientation={state.setDiscOrientation}
          onSetColor={state.setDiscColor}
          onLoadMore={state.loadMoreDisc}
          onSave={(type, item) => state.saveToLibrary(type, item)}
        />
      )}
      {iconBrowserOpen && (
        <IconBrowserOverlay
          onClose={() => setIconBrowserOpen(false)}
          onPick={(icon) => {
            try {
              const result = composer.mediaOps.insertMedia(icon.name, "icon");
              if (result) showToast(`${icon.name} icon added ✓`, "success");
            } catch {
              showToast("Could not add icon", "error");
            }
          }}
        />
      )}
      {stockModal}
      {sharedOverlays}
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
          selectedTypes={state.activeTypes}
          counts={state.counts}
          discMode={false}
          onToggle={state.toggleType}
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
      {sharedOverlays}
      {stockModal}
    </PanelFrame>
  );
}
