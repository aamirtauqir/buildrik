/**
 * Media Tab — SSOT State Hook
 * Single source of truth for ALL media tab state + actions.
 * Components receive typed prop slices — no child calls composer.media directly.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Composer } from "../../../../engine/Composer";
import { MEDIA_EVENTS } from "../../../../shared/constants/media";
import { STORAGE_TOTAL_BYTES } from "./mediaData";
import type {
  CtxMenuState,
  DiscFont,
  DiscIcon,
  LibraryItem,
  MediaSource,
  MediaStateResult,
  MediaTypeFilter,
  StockPhoto,
  StockVideo,
  UploadProgress,
} from "./mediaTypes";
import type { MediaAsset, MediaSortBy, SortDirection } from "./mediaTypes";
import {
  countByType,
  filterByFmt,
  filterBySearch,
  filterByType,
  toLibraryItem,
} from "./mediaUtils";

// ────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────

function sortItems(items: LibraryItem[], by: MediaSortBy, dir: SortDirection): LibraryItem[] {
  const d = dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    switch (by) {
      case "name":
        return a.name.localeCompare(b.name) * d;
      case "date":
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * d;
      case "size":
        return (a.size - b.size) * d;
      case "type":
        return a.type.localeCompare(b.type) * d;
      default:
        return 0;
    }
  });
}

// ────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────

export function useMediaState(composer: Composer): MediaStateResult {
  // --- Navigation ---
  const [source, setSourceState] = useState<MediaSource>("mine");
  const [activeType, setActiveType] = useState<MediaTypeFilter>("all");

  // --- Library raw assets from engine ---
  const [rawAssets, setRawAssets] = useState<MediaAsset[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);

  // --- Library view controls ---
  const [sort, setSortBy] = useState<MediaSortBy>("date");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [gridN, setGridNState] = useState<2 | 3 | 4>(3);
  const [fmtFilter, setFmtFilterState] = useState<string>("");
  const [selMode, setSelMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // --- Search (shared between Library and Discovery) ---
  const [searchQuery, setSearchQuery] = useState("");

  // --- Discovery ---
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [stockVideos, setStockVideos] = useState<StockVideo[]>([]);
  const [discIcons, setDiscIcons] = useState<DiscIcon[]>([]);
  const [discFonts, setDiscFonts] = useState<DiscFont[]>([]);
  const [discLoading, setDiscLoading] = useState<Record<"img" | "vid" | "ico" | "fnt", boolean>>({
    img: false,
    vid: false,
    ico: false,
    fnt: false,
  });

  // --- Overlays ---
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [detailItem, setDetailItem] = useState<LibraryItem | null>(null);

  // --- Tips ---
  const [tipIdx, setTipIdx] = useState(0);
  const [tipDismissed, setTipDismissed] = useState(false);

  // Tip cycling
  useEffect(() => {
    if (tipDismissed) return;
    const id = window.setInterval(() => setTipIdx((i) => i + 1), 8000);
    return () => clearInterval(id);
  }, [tipDismissed]);

  // ── Subscribe to engine events ────────────────
  useEffect(() => {
    // Load initial assets
    const loadAssets = () => {
      const assets = composer.media.getAssets();
      setRawAssets([...assets]);
    };
    loadAssets();

    const onAdded = () => loadAssets();
    const onUpdated = () => loadAssets();
    const onDeleted = () => loadAssets();

    const onUploadProgress = (payload: unknown) => {
      const p = payload as UploadProgress;
      setUploadQueue((prev) => {
        const idx = prev.findIndex((u) => u.fileName === p.fileName);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = p;
          return next;
        }
        return [...prev, p];
      });
      if (p.status === "complete" || p.status === "error") {
        // Remove from queue after 1.5 s
        setTimeout(
          () => setUploadQueue((prev) => prev.filter((u) => u.fileName !== p.fileName)),
          1500
        );
      }
    };

    composer.media.on(MEDIA_EVENTS.MEDIA_ADDED, onAdded);
    composer.media.on(MEDIA_EVENTS.MEDIA_UPDATED, onUpdated);
    composer.media.on(MEDIA_EVENTS.MEDIA_DELETED, onDeleted);
    composer.media.on(MEDIA_EVENTS.UPLOAD_COMPLETE, onAdded);
    composer.media.on(MEDIA_EVENTS.UPLOAD_START, onUploadProgress);

    return () => {
      composer.media.off(MEDIA_EVENTS.MEDIA_ADDED, onAdded);
      composer.media.off(MEDIA_EVENTS.MEDIA_UPDATED, onUpdated);
      composer.media.off(MEDIA_EVENTS.MEDIA_DELETED, onDeleted);
      composer.media.off(MEDIA_EVENTS.UPLOAD_COMPLETE, onAdded);
      composer.media.off(MEDIA_EVENTS.UPLOAD_START, onUploadProgress);
    };
  }, [composer]);

  // ── Derived state ─────────────────────────────
  const allLibraryItems = rawAssets.map(toLibraryItem);
  const byType = filterByType(allLibraryItems, activeType);
  const byFmt = filterByFmt(byType, fmtFilter);
  const bySearch = filterBySearch(byFmt, searchQuery);
  const libraryItems = sortItems(bySearch, sort, sortDir);
  const counts = countByType(allLibraryItems);
  const storageUsed = rawAssets.reduce((acc, a) => acc + a.size, 0);

  // ── Navigation ────────────────────────────────
  const setSource = useCallback((src: MediaSource) => {
    setSourceState(src);
    setSearchQuery("");
  }, []);

  const setType = useCallback((t: MediaTypeFilter) => {
    setActiveType(t);
    setFmtFilterState("");
  }, []);

  // ── Library actions ───────────────────────────
  const setSort = useCallback((by: MediaSortBy, dir: SortDirection) => {
    setSortBy(by);
    setSortDir(dir);
  }, []);

  const setGridN = useCallback((n: 2 | 3 | 4) => setGridNState(n), []);
  const setFmtFilter = useCallback((f: string) => setFmtFilterState(f), []);

  const toggleSelMode = useCallback(() => {
    setSelMode((v) => {
      if (v) setSelectedKeys(new Set());
      return !v;
    });
  }, []);

  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(libraryItems.map((i) => i.key)));
  }, [libraryItems]);

  const upload = useCallback(
    (files: File[]) => {
      files.forEach((file) => composer.media.uploadFile(file));
    },
    [composer]
  );

  const deleteItem = useCallback(
    async (key: string) => {
      await composer.media.deleteAsset(key);
      setDetailItem((prev) => (prev?.key === key ? null : prev));
    },
    [composer]
  );

  const bulkDelete = useCallback(async () => {
    const keys = [...selectedKeys];
    for (const key of keys) {
      await composer.media.deleteAsset(key);
    }
    setSelectedKeys(new Set());
    setSelMode(false);
  }, [composer, selectedKeys]);

  const insertToCanvas = useCallback(
    (key: string) => {
      const asset = composer.media.getAsset(key);
      if (!asset) return;
      // composer.elements.insertMedia — wire when canvas API is ready
      // For now, emit a custom event that the canvas can listen to
      const event = new CustomEvent("aqb:media:insert", {
        detail: { assetId: key, src: asset.src },
      });
      window.dispatchEvent(event);
    },
    [composer]
  );

  const renameItem = useCallback(
    async (key: string, name: string) => {
      await composer.media.updateAsset(key, { name });
    },
    [composer]
  );

  // ── Discovery ─────────────────────────────────
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const discSearchAll = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(async () => {
        setDiscLoading((prev) => ({ ...prev, img: true, vid: true }));
        const [photos, videos] = await Promise.all([
          composer.media.searchStock("img", query) as Promise<StockPhoto[]>,
          composer.media.searchStock("vid", query) as Promise<StockVideo[]>,
        ]);
        setStockPhotos(photos);
        setStockVideos(videos);
        setDiscLoading((prev) => ({ ...prev, img: false, vid: false }));
      }, 400);
    },
    [composer]
  );

  const loadMoreDisc = useCallback(
    async (type: "img" | "vid") => {
      setDiscLoading((prev) => ({ ...prev, [type]: true }));
      const results = await composer.media.searchStock(type, searchQuery);
      if (type === "img") setStockPhotos((prev) => [...prev, ...(results as StockPhoto[])]);
      else setStockVideos((prev) => [...prev, ...(results as StockVideo[])]);
      setDiscLoading((prev) => ({ ...prev, [type]: false }));
    },
    [composer, searchQuery]
  );

  const saveToLibrary = useCallback(
    async (type: "img" | "vid", item: StockPhoto | StockVideo) => {
      const url = type === "img" ? (item as StockPhoto).url : (item as StockVideo).url;
      // Fetch blob and upload
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `${item.id}.${type === "img" ? "jpg" : "mp4"}`, {
        type: blob.type,
      });
      await composer.media.uploadFile(file);
    },
    [composer]
  );

  // Load icons + fonts once on mount
  useEffect(() => {
    setDiscIcons(composer.media.getIcons());
    composer.media.getFonts().then(setDiscFonts);
  }, [composer]);

  // ── Overlays ──────────────────────────────────
  const openCtxMenu = useCallback((e: React.MouseEvent, item: LibraryItem) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);
  const openDetail = useCallback((item: LibraryItem) => setDetailItem(item), []);
  const closeDetail = useCallback(() => setDetailItem(null), []);

  // ── Result ────────────────────────────────────
  return {
    // Navigation
    source,
    activeType,
    setSource,
    setType,

    // Library
    libraryItems,
    uploadQueue,
    counts,
    sort,
    sortDir,
    gridN,
    fmtFilter,
    selMode,
    selectedKeys,
    setSort,
    setGridN,
    setFmtFilter,
    toggleSelMode,
    toggleSelect,
    selectAll,
    upload,
    deleteItem,
    bulkDelete,
    insertToCanvas,
    renameItem,

    // Discovery
    stockPhotos,
    stockVideos,
    discIcons,
    discFonts,
    discLoading,
    discSearchAll,
    loadMoreDisc,
    saveToLibrary,

    // Shared
    searchQuery,
    setSearch: setSearchQuery,
    storage: { used: storageUsed, total: STORAGE_TOTAL_BYTES },

    // Overlays
    ctxMenu,
    openCtxMenu,
    closeCtxMenu,
    detailItem,
    openDetail,
    closeDetail,

    // Tips
    tipIdx,
    tipDismissed,
    dismissTips: () => setTipDismissed(true),
  };
}
