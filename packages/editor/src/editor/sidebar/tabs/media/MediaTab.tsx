/**
 * Media Tab — Standardized Rebuild (10-Star Experience)
 * Flattened hierarchy, canonical SearchBar integration, and high-visibility Bulk Actions.
 * Matches BuildTab vertical rhythm.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ImageEditorOptions } from "../../../shell/hooks/useStudioModals";
import type { EditsSnapshot } from "@shared/types/media";
import { PanelFrame, useToast } from "@/editor/chrome-ui";
import { EVENTS } from "@shared/constants/events";
import type { Composer } from "../../../../engine/Composer";
import { AssetDetailOverlay } from "./components/AssetDetailOverlay";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { ReplaceAcrossDialog } from "./components/ReplaceAcrossDialog";
import { MEDIA_EVENTS } from "@/shared/constants/media";
import { useMediaState } from "./hooks/useMediaState";
import { SlimLauncher } from "./components/SlimLauncher";
import { RenameAssetModal } from "@/editor/media/components/RenameAssetModal";
import { useMediaWriteAccess } from "./hooks/useMediaWriteAccess";
import { IconBrowserOverlay } from "./components/IconBrowserOverlay";
import { StockBrowserOverlay } from "./components/StockBrowserOverlay";
import "./MediaTab.css";
import type { LibraryItem } from "./data/mediaTypes";
import { createAssetVersion } from "../../../../services/MediaVersionService";
import { regenerateAltText } from "../../../../services/AltTextService";
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
  /** ⌘K "Search stock photos" (and its no-results fallback) opens the drawer
   *  straight on the stock browser, with that query when one was typed. */
  initialStockQuery?: string;
}

export function MediaTab(props: MediaTabProps) {
  if (!props.composer) {
    return (
      <PanelFrame className="med-tab">
        <PanelFrame.Header title="Assets" onClose={props.onClose} />
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
  initialStockQuery,
  isOpen = true,
}: Omit<MediaTabProps, "composer"> & { composer: Composer; isOpen?: boolean }) {
  const state = useMediaState(composer);

  /* Board 4418:59771: the drawer draws no search box — the topbar field reads
     "Search all N assets…" while Assets is open and drives the library search.
     The context carries the current query, so re-announcing (the count moved,
     or the search was set from here — Clear search, a selection request's
     prefill) shows the drawer's real query instead of wiping the field. */
  const assetTotal = state.serverPage?.total ?? state.libraryItems.length;
  const setLibrarySearchRef = React.useRef(state.setLibrarySearch);
  setLibrarySearchRef.current = state.setLibrarySearch;
  const fromTopbarRef = React.useRef("");
  React.useEffect(() => {
    if (!isOpen) return;
    const onQuery = ({ query }: { query: string }) => {
      fromTopbarRef.current = query;
      setLibrarySearchRef.current(query);
    };
    composer.on(EVENTS.UI_SEARCH_QUERY, onQuery);
    return () => {
      composer.off(EVENTS.UI_SEARCH_QUERY, onQuery);
      composer.emit(EVENTS.UI_SEARCH_CONTEXT, null);
    };
  }, [composer, isOpen]);
  const announcedRef = React.useRef<{ total: number; query: string } | null>(null);
  React.useEffect(() => {
    if (!isOpen) {
      announcedRef.current = null;
      return;
    }
    const query = state.librarySearch;
    const last = announcedRef.current;
    const unchanged = last && last.total === assetTotal;
    announcedRef.current = { total: assetTotal, query };
    if (unchanged && (last.query === query || fromTopbarRef.current === query)) return;
    fromTopbarRef.current = query;
    composer.emit(EVENTS.UI_SEARCH_CONTEXT, { placeholder: `Search all ${assetTotal} assets…`, query });
  }, [composer, isOpen, assetTotal, state.librarySearch]);
  const { addToast } = useToast();
  const [iconBrowserOpen, setIconBrowserOpen] = React.useState(false);
  /* G3-019: the long-running media jobs report through the standard dark
     toast, not a status pill over the grid. The image editor needs no
     "editor open" notice — its modal is the notice, and it draws its own
     saved / failed state; the optimise job shows a persistent "Optimizing → WebP…" toast
     that the outcome replaces. */
  const { removeToast } = useToast();
  const write = useMediaWriteAccess();
  /* G3-021: the hub's Rename… opens the library's own rename modal. */
  const [renameTarget, setRenameTarget] = React.useState<LibraryItem | null>(null);
  /* A deleted asset takes its open hub with it (the delete lands after the
     confirm; a cancelled confirm leaves the hub where it was). */
  const detailKey = state.detailItem?.key;
  const detailGone = detailKey != null && !state.libraryItems.some((i) => i.key === detailKey);
  React.useEffect(() => {
    if (detailGone) state.closeDetail();
  }, [detailGone, state]);

  const [stockBrowserOpen, setStockBrowserOpen] = React.useState(initialStockQuery !== undefined);
  const { discSearchAll } = state;
  React.useEffect(() => {
    if (initialStockQuery) void discSearchAll(initialStockQuery);
  }, [initialStockQuery, discSearchAll]);

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
      const onSave = async (editedSrc: string, edits?: EditsSnapshot) => {
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
    const progressId = addToast({ description: "Optimizing → WebP…", tone: "info", duration: Infinity });
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
      removeToast(progressId);
    }
  }, [state, showToast, addToast, removeToast]);

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
          /* The live row, so a rename from the hub shows at once. */
          item={state.libraryItems.find((i) => i.key === state.detailItem?.key) ?? state.detailItem}
          onUpdate={state.updateItem}
          onClose={state.closeDetail}
          onEditImage={handleEditImage}
          composer={composer}
          onOptimized={handleOptimized}
          onReplaceAcross={handleReplaceAcross}
          /* A local-only file has no server row for the model to read. */
          onGenerateAltText={(it) =>
            it.assetId ? regenerateAltText(composer.media, it.key, it.assetId) : Promise.resolve(null)
          }
          onInsert={(it) => state.insertToCanvas(it.key)}
          onRename={setRenameTarget}
          onCopyUrl={state.copyUrl}
          onDownload={(it) => composer.media.downloadAssets([{ src: it.src, name: it.displayName ?? it.name }])}
          onDelete={(it) => state.requestDelete(it.key)}
          viewOnly={write.canWrite ? undefined : { rename: write.reason("rename"), delete: write.reason("delete") }}
        />
      )}
      {renameTarget && (
        <RenameAssetModal
          item={renameTarget}
          libraryItems={state.libraryItems}
          onRename={state.renameItem}
          onClose={() => setRenameTarget(null)}
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
        onInsert={state.insertToCanvas}
        onToggleType={state.toggleType}
        onSearchChange={(q) => state.setLibrarySearch(q)}
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
