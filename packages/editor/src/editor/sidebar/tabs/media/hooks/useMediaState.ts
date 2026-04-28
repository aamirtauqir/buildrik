/**
 * Media Tab — Orchestrator Hook (~60 lines)
 * Composes the 4 sub-hooks into a single result slice.
 * No business logic here — delegates to sub-hooks.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import { STORAGE_QUOTA_BYTES } from "../../../../../shared/constants/media";
import { useToast } from "@/editor/shared/vibcoder";
import type { CtxMenuState, LibraryItem, MediaStateResult, MediaTypeFilter } from "../data/mediaTypes";
import { useLibraryState } from "./useLibraryState";
import { useSelectionState } from "./useSelectionState";
import { useUploadState } from "./useUploadState";
import { useDiscoveryState } from "./useDiscoveryState";

export function useMediaState(composer: Composer): MediaStateResult {
  const { addToast } = useToast();

  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "info") => {
      addToast({ description: msg, tone: type });
    },
    [addToast]
  );

  // Navigation
  const [detailItem, setDetailItem] = useState<LibraryItem | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [selectionContext, setSelectionContext] = useState<{ elementId: string; label?: string } | null>(null);

  // Sub-hooks
  const library = useLibraryState(composer);
  const upload = useUploadState(composer, showToast, library.currentFolderId);
  const selection = useSelectionState(composer, library.libraryItems, showToast);
  const discovery = useDiscoveryState(composer, showToast);

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
      let asset: { src: string; type: string; name: string } | undefined = composer.media.getAsset(key);
      let isStock = false;

      // If not in library, check discovery stubs (icons/fonts)
      if (!asset) {
        const icon = discovery.discIcons.find((i) => i.id === key);
        if (icon) {
          asset = { src: icon.svgDataUrl, type: "ico", name: icon.name };
        } else {
          const photo = discovery.stockPhotos.find(p => p.id === key);
          if (photo) {
            asset = { src: photo.url, type: "img", name: photo.alt };
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

      try {
        if (selectionContext) {
          // SELECTION MODE: Replace existing element's media via command layer
          const result = composer.mediaCommands.replaceMedia(
            selectionContext.elementId,
            asset.src
          );
          if (result) {
            showToast(`${asset.name} applied ✓`, "success");
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
          const result = composer.mediaCommands.insertMediaAt(asset.src, mediaType, {
            path: "click",
          });
          if (result) {
            const insertedEl = composer.elements.getElement(result.elementId);
            if (insertedEl) composer.selection.select(insertedEl);
            if (result.kind === "font-applied") {
              showToast(`Font "${asset.name}" applied to selection ✓`, "success");
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
    (src: string) => {
      if (!navigator.clipboard) {
        showToast("Clipboard not available in this browser", "error");
        return;
      }
      navigator.clipboard.writeText(src).then(
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

  const openCtxMenu = useCallback((e: React.MouseEvent, item: LibraryItem) => {
    e.preventDefault();
    // Clamp position so menu doesn't render off-screen (~160px wide, ~140px tall)
    const MENU_W = 160;
    const MENU_H = 140;
    const x = Math.min(e.clientX, window.innerWidth - MENU_W - 8);
    const y = Math.min(e.clientY, window.innerHeight - MENU_H - 8);
    setCtxMenu({ x, y, item });
  }, []);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);
  const openDetail = useCallback((item: LibraryItem) => setDetailItem(item), []);
  const closeDetail = useCallback(() => setDetailItem(null), []);

  return {
    // Navigation
    activeType: library.activeType,
    currentFolderId: library.currentFolderId,
    setCurrentFolderId: library.setCurrentFolderId,

    // Library
    libraryItems: library.libraryItems,
    folders: library.folders,
    createFolder: library.createFolder,
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
    toggleSelMode: selection.toggleSelMode,
    toggleSelect: selection.toggleSelect,
    selectAll: selection.selectAll,
    failedUploads: upload.failedUploads,
    dismissFailedUploads: upload.dismissFailedUploads,
    upload: upload.upload,
    requestDelete: selection.requestDelete,
    requestBulkDelete: selection.requestBulkDelete,
    executeDelete: selection.executeDelete,
    cancelDelete: selection.cancelDelete,
    confirmDelete: selection.confirmDelete,
    insertToCanvas,
    renameItem: library.renameItem,
    updateItem: library.updateItem,

    // Discovery
    stockPhotos: discovery.stockPhotos,
    stockVideos: discovery.stockVideos,
    discIcons: discovery.discIcons,
    discFonts: discovery.discFonts,
    discLoading: discovery.discLoading,
    discoverySearch: discovery.discoverySearch,
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
    storage: { used: upload.storageUsed, total: STORAGE_QUOTA_BYTES },

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
  };
}
