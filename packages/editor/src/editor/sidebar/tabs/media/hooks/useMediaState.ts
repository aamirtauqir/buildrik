/**
 * Media Tab — Orchestrator Hook (~60 lines)
 * Composes the 4 sub-hooks into a single result slice.
 * No business logic here — delegates to sub-hooks.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useToast } from "@/editor/chrome-ui";
import { useCallback, useEffect, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import { MEDIA_EVENTS } from "@/shared/constants/media";
import type { CtxMenuState, LibraryItem, MediaStateResult, MediaTypeFilter } from "../data/mediaTypes";
import { useLibraryState } from "./useLibraryState";
import { useSelectionState } from "./useSelectionState";
import { useUploadState } from "./useUploadState";
import { useDiscoveryState } from "./useDiscoveryState";
import { useServerStorageQuota } from "./useServerStorageQuota";

export function useMediaState(composer: Composer): MediaStateResult {
  const { addToast } = useToast();

  const showToast = useCallback(
    (
      msg: string,
      type: "success" | "error" | "info" | "warning",
      opts?: { action?: { label: string; onClick: () => void }; duration?: number },
    ) => {
      addToast({ description: msg, tone: type, action: opts?.action, duration: opts?.duration });
    },
    [addToast]
  );

  // Navigation
  const [detailItem, setDetailItem] = useState<LibraryItem | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [selectionContext, setSelectionContext] = useState<{ elementId: string; label?: string } | null>(null);

  // §21 — replace-across pair. Once set (after user uploads replacement),
  // ExpandedMediaPanel / MediaTab mounts <ReplaceAcrossDialog>.
  const [replaceAcrossPair, setReplaceAcrossPair] = useState<
    { oldSrc: string; newSrc: string; oldLabel: string; newLabel: string } | null
  >(null);


  // §10/§15 — per-asset usage counts (distinct pages where each asset is referenced).
  // Built from composer.elements page tree; resilient to missing engine APIs (mocks/tests).
  const [usageMap, setUsageMap] = useState<Map<string, number>>(new Map());

  // Sub-hooks
  const library = useLibraryState(composer);
  // Phase C: server-side quota replaces hardcoded 1GB IndexedDB cap when reachable.
  // Returns null on offline / unconfigured / auth-fail — useUploadState falls back to local.
  const serverQuota = useServerStorageQuota(composer);
  const upload = useUploadState(composer, showToast, serverQuota.quota);
  const selection = useSelectionState(composer, library.libraryItems, showToast, library.versionsOf);
  const discovery = useDiscoveryState(composer, showToast);

  // Recompute usageMap when library or page graph changes.
  // Equality-check guards against infinite re-renders from new Map identity.
  //
  // Read through `checkInUse` — the same `findByMediaSrc` answer the delete
  // confirm and the library's rail read. This used to walk
  // `page.root.getDescendants()` and match `el.attrs.src`, neither of which
  // the engine's page roots or elements carry (a root is `{id, type, classes,
  // tagName, children}`), so no drawer card ever showed its pips (measured
  // live 2026-09-14 against three used files). A placement on a saved
  // version counts for the file it belongs to — usage is the family's
  // (Clone 3695:45529), as the library reads it.
  useEffect(() => {
    const map = new Map<string, number>();
    for (const item of library.libraryItems) {
      const family = library.versionsOf(item.key);
      const members = (family.length > 0 ? family : [item]).map((m) => m.key);
      const pages = new Set(selection.checkInUse(members).flatMap((u) => u.pages));
      if (pages.size > 0) map.set(item.key, pages.size);
    }
    setUsageMap((prev) => {
      if (prev.size !== map.size) return map;
      for (const [k, v] of map) {
        if (prev.get(k) !== v) return map;
      }
      return prev;
    });
  }, [library.libraryItems, library.versionsOf, selection.checkInUse]);

  // Listen for selection mode requests from other parts of the UI
  useEffect(() => {
    const handler = (data: { elementId: string; label?: string }) => {
      setSelectionContext(data);
      
      // Semantic Search: Use label/context to pre-fill library search
      if (data.label && data.label.length > 2) {
        library.setLibrarySearch(data.label);
      }
      
      // Open Media Tab in Sidebar
      composer.emit("ui:switch-tab", { tab: "assets" });
    };
    composer.on("ui:media-selection-request", handler);

    // Build tab contract: empty media element dropped → open Media picker
    const needsAssetHandler = (data: { elementId: string; type: string }) => {
      setSelectionContext({ elementId: data.elementId, label: data.type });
      library.setActiveType(
        data.type === "image" ? "img"
          : data.type === "video" ? "vid"
          : data.type === "icon" ? "ico"
          : "all"
      );
      composer.emit("ui:switch-tab", { tab: "assets" });
    };
    composer.on("element:needs-asset", needsAssetHandler);

    // Contextual panel: when canvas selection changes, hint the type filter
    const selectionHandler = (data: { id?: string; type?: string }) => {
      if (!data.type) return;
      const typeMap: Record<string, typeof library.activeType> = {
        image: "img", video: "vid", icon: "ico", svg: "img",
      };
      const mapped = typeMap[data.type];
      if (mapped && library.activeType === "all") {
        library.setActiveType(mapped);
      }
    };
    composer.on("element:selected", selectionHandler);

    return () => {
      composer.off("ui:media-selection-request", handler);
      composer.off("element:needs-asset", needsAssetHandler);
      composer.off("element:selected", selectionHandler);
    };
  }, [composer, library]);

  const autoSaveStockToLibrary = useCallback(async (src: string, name: string) => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const file = new File([blob], `imported-${name.substring(0, 10)}.webp`, { type: "image/webp" });
      upload.upload([file]);
    } catch (err) {
      console.error("Silent save failed:", err);
    }
  }, [upload]);

  const insertToCanvas = useCallback(
    async (key: string) => {
      let asset:
        | { src: string; type: string; name: string; localOnly?: boolean; altText?: string }
        | undefined = composer.media.getAsset(key);
      let isStock = false;

      // If not in library, check discovery stubs (icons/fonts)
      if (!asset) {
        const icon = discovery.discIcons.find((i) => i.id === key);
        if (icon) {
          asset = { src: icon.svgDataUrl, type: "ico", name: icon.name };
        } else {
          const photo = discovery.stockPhotos.find(p => p.id === key);
          if (photo) {
            /* The provider already wrote alt text for this photo; carrying it
               is the difference between a published image with a description
               and one with none. */
            asset = { src: photo.url, type: "img", name: photo.alt, altText: photo.alt };
            isStock = true;
          } else {
            const font = discovery.discFonts.find((f) => f.id === key);
            if (font) {
              showToast(
                `To use ${font.family}: select text on canvas → Inspector → Font → My Fonts`,
                "info"
              );
              return;
            }
          }
        }
      }

      if (!asset) return;

      // Silent save stock photo to library
      if (isStock && asset.type === "img") {
        autoSaveStockToLibrary(asset.src, asset.name);
      }

      // Fonts cannot be placed as canvas elements
      if (asset.type === "font" || asset.type === "fnt") {
        showToast("To use this font: select text on canvas → Inspector → Font → My Fonts", "info");
        setDetailItem(null);
        return;
      }

      /* Clone 3695:20614 — "Canvas · Menu preview image replaced". With an
         image (or video) element selected on the canvas, Insert to canvas
         REPLACES that element's src; it used to add a second image beside
         it while the selected one kept its old src, so applying looked
         exactly like cancelling (audit A03). An explicit selection context
         (the inspector's Choose image, a dropped empty Image) still wins. */
      const selectedEl = composer.selection.getCount() === 1 ? composer.selection.getSelected() : null;
      const assetKind =
        asset.type === "vid" || asset.type === "video"
          ? "video"
          : asset.type === "img" || asset.type === "image"
            ? "image"
            : asset.type === "svg"
              ? "svg"
              : null;
      const replaceTarget =
        selectionContext?.elementId ??
        (selectedEl && assetKind && selectedEl.getType() === assetKind ? selectedEl.getId() : null);

      try {
        if (replaceTarget) {
          // SELECTION MODE: Replace existing element's media via command layer
          const result = composer.mediaOps.replaceMedia(
            replaceTarget,
            asset.src
          );
          if (result) {
            /* Replacing an element's media has the same trap as inserting one:
               a device-only asset's src is a session Object URL the sanitizer
               strips, so the element ends up with nothing. */
            if (asset.localOnly) {
              showToast(
                `${asset.name} is only on this device — it won't show on the page or publish. Re-upload when you're back online.`,
                "warning",
              );
            } else {
              showToast(`${asset.name} applied ✓`, "success");
            }
            composer.emit("ui:switch-tab", { tab: "add" });
            setSelectionContext(null);
          }
        } else {
          // STANDARD MODE: Insert new element via command layer (type-aware).
          // `path: "click"` tags telemetry; path: "drag" is set from the canvas drop handler.
          const typeMap: Record<string, "image" | "video" | "audio" | "svg" | "icon" | "lottie" | "font"> = {
            img: "image", image: "image",
            vid: "video", video: "video",
            aud: "audio", audio: "audio",
            ico: "icon", icon: "icon",
            svg: "svg",
            lottie: "lottie",
            fnt: "font", font: "font",
          };
          const mediaType = typeMap[asset.type] || "image";
          const result = composer.mediaOps.insertMediaAt(asset.src, mediaType, {
            path: "click",
            alt: asset.altText,
          });
          if (result) {
            const insertedEl = composer.elements.getElement(result.elementId);
            if (insertedEl) composer.selection.select(insertedEl);
            if (result.kind === "font-applied") {
              showToast(`Font "${asset.name}" applied to selection ✓`, "success");
            } else if (asset.localOnly) {
              /* The upload never reached the server, so this asset's src is a
                 session Object URL. The sanitizer drops that scheme on the way
                 into the document and the URL is revoked besides — measured
                 2026-08-19 — so the element mounts with no src and the page
                 shows nothing. Saying "added ✓" over that is the lie; the
                 element IS added, and it will not render or publish. */
              showToast(
                `${asset.name} is only on this device — it won't show on the page or publish. Re-upload when you're back online.`,
                "warning",
              );
            } else {
              showToast(`${asset.name} added to page ✓`, "success");
            }
          }
        }
      } catch (err) {
        // Typed engine errors carry a rescueAction field; map to user-facing toasts.
        const name = (err as { name?: string } | null)?.name;
        if (name === "MediaNoActivePageError") {
          showToast("Select a page first, then add media", "info");
        } else if (name === "MediaQuotaError") {
          showToast("Storage full — delete unused assets to free space", "error");
        } else {
          showToast("Could not apply media — try again", "error");
        }
      }
      setDetailItem(null);
    },
    [composer, showToast, discovery.discIcons, discovery.discFonts, discovery.stockPhotos, selectionContext, autoSaveStockToLibrary]
  );

  const copyUrl = useCallback(
    (item: LibraryItem) => {
      if (!navigator.clipboard) {
        showToast("Clipboard not available in this browser", "error");
        return;
      }
      navigator.clipboard.writeText(item.src).then(
        () => showToast("URL copied ✓", "success"),
        () => showToast("Could not copy URL", "error")
      );
    },
    [showToast]
  );

  const setUnifiedSearch = useCallback(
    (q: string) => {
      library.setLibrarySearch(q);
      if (q.trim().length > 2) {
        discovery.discSearchAll(q);
      }
    },
    [library.setLibrarySearch, discovery.discSearchAll]
  );

  const openCtxMenu = useCallback((e: React.MouseEvent, item: LibraryItem, anchor?: { x: number; y: number }) => {
    e.preventDefault();
    // Clamp position so menu doesn't render off-screen (~160px wide, ~140px tall)
    const MENU_W = 160;
    const MENU_H = 140;
    /* The card's `···` (Clone 3721:43552) anchors the menu to itself; a
       right-click anchors it to the pointer. A keyboard-fired click has no
       pointer at all, which is why the button passes its own box. */
    const x = Math.min(anchor?.x ?? e.clientX, window.innerWidth - MENU_W - 8);
    const y = Math.min(anchor?.y ?? e.clientY, window.innerHeight - MENU_H - 8);
    setCtxMenu({ x, y, item });
  }, []);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);
  const openDetail = useCallback((item: LibraryItem) => setDetailItem(item), []);
  const closeDetail = useCallback(() => setDetailItem(null), []);

  return {
    // Navigation
    activeType: library.activeType,
    activeTypes: library.activeTypes,
    currentFolderId: library.currentFolderId,
    setCurrentFolderId: library.setCurrentFolderId,

    // Library
    serverPage: library.serverPage,
    searchState: library.searchState,
    loadingMore: library.loadingMore,
    loadMoreError: library.loadMoreError,
    loadMoreAssets: library.loadMoreAssets,
    libraryItems: library.libraryItems,
    allLibraryItems: library.allLibraryItems,
    versionsOf: library.versionsOf,
    folders: library.folders,
    allFolders: library.allFolders,
    folderCounts: library.folderCounts,
    createFolder: library.createFolder,
    inspectFolder: library.inspectFolder,
    deleteFolder: library.deleteFolder,
    moveAsset: library.moveAsset,
    bulkMoveAssets: library.bulkMoveAssets,
    uploadQueue: upload.uploadQueue,
    counts: library.counts,
    sort: library.sort,
    sortDir: library.sortDir,
    gridN: library.gridN,
    fmtFilter: library.fmtFilter,
    selMode: selection.selMode,
    selectedKeys: selection.selectedKeys,
    setSort: library.setSort,
    setGridN: library.setGridN,
    setFmtFilter: library.setFmtFilter,
    setType: library.setActiveType,
    toggleType: library.toggleType,
    toggleSelMode: selection.toggleSelMode,
    toggleSelect: selection.toggleSelect,
    selectAll: selection.selectAll,
    shiftSelect: selection.shiftSelect,
    enterSelectModeWith: selection.enterSelectModeWith,
    checkInUse: selection.checkInUse,
    clearSelection: selection.clearSelection,
    failedUploads: upload.failedUploads,
    dismissFailedUploads: upload.dismissFailedUploads,
    upload: upload.upload,
    libraryLoading: library.libraryLoading,
    libraryError: library.libraryError,
    retryLibraryLoad: library.retryLibraryLoad,
    retryUpload: upload.retryUpload,
    dismissUpload: upload.dismissUpload,
    requestDelete: selection.requestDelete,
    requestBulkDelete: selection.requestBulkDelete,
    executeDelete: selection.executeDelete,
    cancelDelete: selection.cancelDelete,
    confirmDelete: selection.confirmDelete,
    insertToCanvas,
    renameItem: library.renameItem,
    renameFolder: library.renameFolder,
    updateItem: library.updateItem,

    // Discovery
    stockPhotos: discovery.stockPhotos,
    stockVideos: discovery.stockVideos,
    discIcons: discovery.discIcons,
    discFonts: discovery.discFonts,
    discLoading: discovery.discLoading,
    discoverySearch: discovery.discoverySearch,
    searchFailed: discovery.searchFailed,
    isDiscoveryEmpty: discovery.isDiscoveryEmpty,
    discSearchAll: discovery.discSearchAll,
    discOrientation: discovery.discOrientation,
    discColor: discovery.discColor,
    setDiscOrientation: discovery.setDiscOrientation,
    setDiscColor: discovery.setDiscColor,
    loadMoreDisc: discovery.loadMoreDisc,
    saveToLibrary: discovery.saveToLibrary,

    // Panel drag
    panelDragOver: upload.panelDragOver,
    handlePanelDragEnter: upload.handlePanelDragEnter,
    handlePanelDragLeave: upload.handlePanelDragLeave,
    handlePanelDragOver: upload.handlePanelDragOver,
    handlePanelDrop: upload.handlePanelDrop,

    // Shared
    librarySearch: library.librarySearch,
    setLibrarySearch: setUnifiedSearch,
    setLibraryQuery: library.setLibrarySearch,
    tagFilter: library.tagFilter,
    setTagFilter: library.setTagFilter,
    storage: { used: upload.storageUsed, total: upload.storageTotal },

    // Clipboard
    copyUrl,

    // Overlays
    ctxMenu,
    openCtxMenu,
    closeCtxMenu,
    detailItem,
    openDetail,
    closeDetail,
    selectionContext,
    setSelectionContext,

    // §12 expanded panel

    // §21 replace-across pair
    replaceAcrossPair,
    setReplaceAcrossPair,

    // §10/§15 usage tracking
    usageMap,
  };
}
