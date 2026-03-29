/**
 * Media Tab — Orchestrator Hook (~60 lines)
 * Composes the 4 sub-hooks into a single result slice.
 * No business logic here — delegates to sub-hooks.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCallback, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import { STORAGE_QUOTA_BYTES } from "../../../../../shared/constants/media";
import { STORAGE_KEYS } from "../../../../../shared/constants/storageKeys";
import { useToast } from "../../../../../shared/ui/Toast";
import type { CtxMenuState, LibraryItem, MediaSource, MediaStateResult } from "../data/mediaTypes";
import { useDiscoveryState } from "./useDiscoveryState";
import { useLibraryState } from "./useLibraryState";
import { useSelectionState } from "./useSelectionState";
import { useUploadState } from "./useUploadState";

export function useMediaState(composer: Composer): MediaStateResult {
  const { addToast } = useToast();

  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "info") => {
      addToast({ message: msg, variant: type });
    },
    [addToast]
  );

  // Navigation
  const [source, setSourceState] = useState<MediaSource>("mine");
  const [detailItem, setDetailItem] = useState<LibraryItem | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [tipDismissed, setTipDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEYS.MEDIA_TIP_DISMISSED) === "1"
  );

  // Sub-hooks
  const library = useLibraryState(composer);
  const upload = useUploadState(composer, showToast);
  const selection = useSelectionState(composer, library.libraryItems, showToast);
  const discovery = useDiscoveryState(composer, showToast);

  const setSource = useCallback((src: MediaSource) => {
    setSourceState(src);
  }, []);

  const insertToCanvas = useCallback(
    async (key: string) => {
      const asset = composer.media.getAsset(key);
      if (!asset) return;

      // Fonts cannot be placed as canvas elements — guide user to the correct flow
      if (asset.type === "font") {
        showToast("To use this font: select text on canvas → Inspector → Font → My Fonts", "info");
        setDetailItem(null);
        return;
      }

      try {
        if (typeof (composer.elements as { insertMedia?: unknown })?.insertMedia === "function") {
          const newId = await (
            composer.elements as unknown as {
              insertMedia: (src: string, type: string) => Promise<string>;
            }
          ).insertMedia(asset.src, asset.type);
          if (newId && typeof (composer.selection as { select?: unknown })?.select === "function") {
            (composer.selection as unknown as { select: (id: string) => void }).select(newId);
          }
        }
        showToast(`${asset.name} added to page ✓`, "success");
      } catch {
        showToast("Could not insert — try again", "error");
      }
      setDetailItem(null);
    },
    [composer, showToast]
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

  const dismissTip = useCallback(() => {
    setTipDismissed(true);
    localStorage.setItem(STORAGE_KEYS.MEDIA_TIP_DISMISSED, "1");
  }, []);

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
    source,
    activeType: library.activeType,
    setSource,
    setType: library.setActiveType,

    // Library
    libraryItems: library.libraryItems,
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
    toggleSelMode: selection.toggleSelMode,
    toggleSelect: selection.toggleSelect,
    selectAll: () => selection.selectAll(library.libraryItems.map((i) => i.key)),
    failedUploads: upload.failedUploads,
    dismissFailedUploads: upload.dismissFailedUploads,
    upload: upload.upload,
    deleteItem: selection.requestDelete,
    requestDelete: selection.requestDelete,
    requestBulkDelete: selection.requestBulkDelete,
    executeDelete: selection.executeDelete,
    cancelDelete: selection.cancelDelete,
    confirmDelete: selection.confirmDelete,
    insertToCanvas,
    renameItem: library.renameItem,

    // Panel drag
    panelDragOver: upload.panelDragOver,
    handlePanelDragEnter: upload.handlePanelDragEnter,
    handlePanelDragLeave: upload.handlePanelDragLeave,
    handlePanelDragOver: upload.handlePanelDragOver,
    handlePanelDrop: upload.handlePanelDrop,

    // Discovery
    stockPhotos: discovery.stockPhotos,
    stockVideos: discovery.stockVideos,
    discIcons: discovery.discIcons,
    discFonts: discovery.discFonts,
    discLoading: discovery.discLoading,
    discoverySearch: discovery.discoverySearch,
    discSearchAll: discovery.discSearchAll,
    loadMoreDisc: discovery.loadMoreDisc,
    saveToLibrary: discovery.saveToLibrary,

    // Shared
    librarySearch: library.librarySearch,
    setLibrarySearch: library.setLibrarySearch,
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

    // Tips
    tipDismissed,
    dismissTip,
  };
}
