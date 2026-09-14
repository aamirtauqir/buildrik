/**
 * Media Tab — Standardized Rebuild (10-Star Experience)
 * Flattened hierarchy, canonical SearchBar integration, and high-visibility Bulk Actions.
 * Matches BuildTab vertical rhythm.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ImageEditorOptions } from "../../../shell/hooks/useStudioModals";
import type { EditsSnapshot } from "@shared/types/media";
import { PanelFrame, useToast, Button } from "@/editor/chrome-ui";
import { Upload, Plus } from "lucide-react";
import type { Composer } from "../../../../engine/Composer";
import { ROW_LG } from "@shared/constants/layout";
import { SearchBar } from "../../shared/SearchBar";
import { AssetDetailOverlay } from "./components/AssetDetailOverlay";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { MediaContextMenu } from "./components/MediaContextMenu";
import { ReplaceAcrossDialog } from "./components/ReplaceAcrossDialog";
import { MEDIA_EVENTS } from "@/shared/constants/media";
import { TypePills } from "./components/TypePills";
import { UploadZone } from "./components/UploadZone";
import { useMediaState } from "./hooks/useMediaState";
import { SlimLauncher } from "./components/SlimLauncher";
import { IconBrowserOverlay } from "./components/IconBrowserOverlay";
import { StockBrowserOverlay } from "./components/StockBrowserOverlay";
import { SelectionContextBar } from "./components/SelectionContextBar";
import "./MediaTab.css";
import type { LibraryItem } from "./data/mediaTypes";
import { createAssetVersion } from "../../../../services/MediaVersionService";
import { displayNameFor } from "./data/mediaUtils";
import type { IconConfig } from "@shared/types/media";

interface MediaTabProps {
  composer: Composer | null;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string, edits: EditsSnapshot) => void | Promise<void>,
    options?: ImageEditorOptions,
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
        <PanelFrame.Header title="Assets" {...props} />
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
  onOpenLibrary,
}: Omit<MediaTabProps, "composer"> & { composer: Composer }) {
  const state = useMediaState(composer);
  const { addToast } = useToast();
  const [iconBrowserOpen, setIconBrowserOpen] = React.useState(false);
  /*
    Boards 303:1997 / 303:2032 draw a status pill over the grid while a
    long-running media job is happening: "Image editor — crop · rotate ·
    adjust" while the editor is open, "Optimizing → WebP…" while an optimised
    copy is being written. Both spans are owned here.

    The editor pill has no close signal to hang off: the modal's open state
    lives in AquibraStudio, which this tab cannot reach. It clears on save
    completion, and on the first pointerdown back in the drawer — while the
    editor is open the drawer is inert, so that gesture only happens after the
    user has left the modal.
  */
  const [statusPill, setStatusPill] = React.useState<string | null>(null);

  /*
    Board 1159:4593 draws ONE manager. The 560 "expanded" panel was a second
    one with its own grid, folder rail and toolbar; it is gone, so every
    expand signal (the header brackets, the upload auto-expand) opens the
    fullpage manager instead. Drag-to-folder lived only in that panel and was
    ported into FolderTree first — see FolderTree.drop.test.tsx.
  */
  React.useEffect(() => {
    if (!state.panelExpanded || !onOpenLibrary) return;
    state.setPanelExpanded(false);
    onOpenLibrary();
  }, [state.panelExpanded, state, onOpenLibrary]);
  const [stockBrowserOpen, setStockBrowserOpen] = React.useState(false);

  const showToast = React.useCallback((msg: string, type: "success" | "error" | "info") => {
    addToast({ description: msg, tone: type });
  }, [addToast]);

  /* Clone 3681:20026 / 3695:45529 (Phase 6): a saved edit is a VERSION of the
     same asset — the file lands flagged `versionOf` (hidden from the grid) with
     the edits it was made with — the way the fullpage library saves one. This
     used to upload a plain `<stem>_v1234` sibling that the grid showed as a
     second card once the stem heuristic went. Done opens the fullpage library
     on the parent, where Asset versions lives. */
  const handleEditImage = React.useCallback(
    (item: LibraryItem) => {
      if (!onOpenImageEditor) return;
      const parentKey = item.versionOf ?? item.key;
      setStatusPill("Image editor — crop · rotate · adjust");
      const onSave = async (editedSrc: string, edits?: EditsSnapshot) => {
        try {
          const res = await fetch(editedSrc);
          const blob = await res.blob();
          const versionCount = composer.media.getAssets().filter((a) => a.versionOf === parentKey).length;
          const stem = item.name.replace(/\.[^/.]+$/, "");
          const file = new File([blob], displayNameFor(`${stem}-v${versionCount + 2}`, blob.type), { type: blob.type });
          const result = await composer.media.uploadFile(file, {
            ...(item.folderId ? { folderId: item.folderId } : {}),
            versionOf: parentKey,
            ...(edits ? { edits } : {}),
          });
          if (!result.success || !result.asset) throw new Error(result.error ?? "Could not save the version");
          const saved = result.asset;
          if (item.assetId && saved.serverId && !saved.localOnly) {
            createAssetVersion({ assetId: item.assetId, url: saved.src, bytes: saved.size, edits: edits ?? {} }).catch(() => {
              /* History is a convenience; the version itself has landed. */
            });
          }
        } finally {
          setStatusPill(null);
        }
      };
      onOpenImageEditor(item.src, onSave, {
        fileName: item.displayName ?? item.name,
        onDone: () => {
          composer.media.selectAssets([parentKey]);
          onOpenLibrary?.();
        },
      });
    },
    [onOpenImageEditor, composer, onOpenLibrary]
  );

  // §18 — Optimize is now a tab inside the §15 detail drawer. handleOptimized
  // is passed to the drawer as onOptimized; OptimizationPanel inside the tab
  // calls it with the new data-URL, which we upload as a versioned copy.
  const handleOptimized = React.useCallback(async (optimizedSrc: string) => {
    const item = state.detailItem;
    if (!item) return;
    setStatusPill("Optimizing → WebP…");
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

  /*
    Mounted by EVERY branch, not just the fullpage one. The detail overlay and
    the delete confirm used to live inside the fullpage return, so the drawer —
    the surface the board's five drill-ins hang off — could not reach
    asset-detail, versions or used-in at all. A modal that only one of three
    renderers mounts is a feature that exists for a third of its users. (A
    StockSourceModal mount sat here until Clone Phase 3 with nothing that ever
    opened it — the drawer's Browse stock opens StockBrowserOverlay.)
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
      {/*
        Moved here from the fullpage return, which is the exact failure the
        block comment above describes — and this modal was the one left out of
        the fix. `handleReplaceAcross` hangs off AssetDetailOverlay's "Replace
        across site" row, the overlay is shared, so the drawer could open the
        file picker, upload the replacement and set replaceAcrossPair with
        nothing mounted to render it. The work happened and the dialog never
        came.
      */}
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
    </>
  );

  /* The fullpage-manager branch that used to follow this return is gone, and
     with it `LibraryView` (687 lines), `MultiSelectBanner` and
     `SelectionBanner`. It was guarded by `if (onOpenLibrary)`, and the shell
     supplies that prop from a plain `useCallback` (`StudioPanels:306`), so it
     is never undefined — the branch below it could not be reached in any build.
     Same shape as the publish opener that spent itself on
     `onVercelPublish ?? onOpenPublish`. The live manager is `editor/media/
     LibraryManager`, which the Media family walk verified against its boards. */
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
        failedUploads={state.failedUploads}
        onDismissUpload={state.dismissUpload}
        loading={state.libraryLoading}
        loadError={state.libraryError}
        onRetryLoad={state.retryLibraryLoad}
        serverPage={state.serverPage}
        searchState={state.searchState}
        loadingMore={state.loadingMore}
        loadMoreError={state.loadMoreError}
        onLoadMore={state.loadMoreAssets}
        currentFolderId={state.currentFolderId}
        allFolders={state.allFolders}
        onFolderChange={state.setCurrentFolderId}
        selectionMode={state.selMode}
        onToggleSelection={state.toggleSelMode}
        selectedKeys={state.selectedKeys}
        onEnterSelection={(key) => {
          if (!state.selMode) state.toggleSelMode();
          state.toggleSelect(key);
        }}
        onToggleSelect={state.toggleSelect}
        onExitSelection={state.toggleSelMode}
        // The drawer has its own picker now — the same folder list the context
        // menu shows. The library fallback stays only for a caller that cannot
        // move (no composer). (Board 145:349 draws "Move to…" with an ellipsis:
        // a second step follows, and the step is the picker, not a detour.)
        onBulkMove={onOpenLibrary ? () => onOpenLibrary() : undefined}
        onBulkMoveTo={(folderId) => {
          const keys = [...state.selectedKeys];
          void Promise.all(keys.map((k) => state.moveAsset(k, folderId))).then(() => {
            showToast(`Moved ${keys.length} file${keys.length === 1 ? "" : "s"}`, "success");
            state.toggleSelMode();
          });
        }}
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
      {sharedOverlays}
      </>
    );
}
