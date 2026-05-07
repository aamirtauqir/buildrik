/**
 * Media Tab — Discovery State Hook
 * Handles stock photos, videos, icons, and fonts searching.
 * @license BSD-3-Clause
 */

import { useCallback, useEffect, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import { stockService } from "../../../../../services/stock/StockService";
import type {
  DiscFont,
  DiscIcon,
  DiscoveryStateResult,
  StockPhoto,
  StockVideo,
  DiscOrientation,
  DiscColor,
} from "../data/mediaTypes";

/**
 * P5 (2026-05-07): stock search bypasses engine. Editor calls services/stock/
 * StockService directly. Engine no longer hosts an API-call surface for stock
 * (decision A3 RESOLVED — codex finding 3: UI already bypasses engine).
 *
 * Future: when dashboard.media.searchStock tRPC ships with quota+rate-limit,
 * swap stockService → tRPC client. Until then, stockService stub returns [].
 */

export function useDiscoveryState(
  composer: Composer,
  showToast: (msg: string, type: "success" | "error" | "info") => void
): DiscoveryStateResult {
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [stockVideos, setStockVideos] = useState<StockVideo[]>([]);
  const [discIcons, setDiscIcons] = useState<DiscIcon[]>([]);
  const [discFonts, setDiscFonts] = useState<DiscFont[]>([]);
  const [discoverySearch, setDiscoverySearch] = useState("");
  const [discOrientation, setDiscOrientation_] = useState<DiscOrientation>("all");
  const [discColor, setDiscColor_] = useState<DiscColor>("all");
  const [discLoading, setDiscLoading] = useState({
    img: false,
    vid: false,
    ico: false,
    fnt: false,
  });
  // Cursor-based pagination: track current page per type
  const [pageState, setPageState] = useState({ img: 1, vid: 1 });

  const discSearchAll = useCallback(
    async (query: string, orientation?: DiscOrientation, color?: DiscColor) => {
      setDiscoverySearch(query);
      const activeOrientation = orientation ?? discOrientation;
      const activeColor = color ?? discColor;

      if (!query.trim()) {
        setStockPhotos([]);
        setStockVideos([]);
        setPageState({ img: 1, vid: 1 });
        return;
      }

      setPageState({ img: 1, vid: 1 });
      setDiscLoading((prev) => ({ ...prev, img: true, vid: true }));
      // P5: stockService expects "landscape"|"portrait"|"squarish"|undefined.
      // DiscOrientation adds "all" which maps to "no filter" → undefined.
      const o = activeOrientation === "all" ? undefined : activeOrientation;
      const c = activeColor === "all" ? undefined : (activeColor as string | undefined);
      try {
        const [photos, videos] = await Promise.all([
          stockService.searchPhotos(query, 1, o, c),
          stockService.searchVideos(query, 1, o),
        ]);
        setStockPhotos(photos as StockPhoto[]);
        setStockVideos(videos as StockVideo[]);
      } catch {
        showToast("Discovery search failed", "error");
      } finally {
        setDiscLoading((prev) => ({ ...prev, img: false, vid: false }));
      }
    },
    [composer, showToast, discOrientation, discColor]
  );

  const setDiscOrientation = useCallback((o: DiscOrientation) => {
    setDiscOrientation_(o);
    if (discoverySearch) {
      discSearchAll(discoverySearch, o, discColor);
    }
  }, [discoverySearch, discColor, discSearchAll]);

  const setDiscColor = useCallback((c: DiscColor) => {
    setDiscColor_(c);
    if (discoverySearch) {
      discSearchAll(discoverySearch, discOrientation, c);
    }
  }, [discoverySearch, discOrientation, discSearchAll]);

  const loadMoreDisc = useCallback(
    async (type: "img" | "vid") => {
      if (!discoverySearch.trim()) return;

      const nextPage = pageState[type] + 1;
      setDiscLoading((prev) => ({ ...prev, [type]: true }));
      try {
        // P5: direct stockService call — no engine hop, no broken dynamic import.
        const o2 = discOrientation === "all" ? undefined : discOrientation;
        const c2 = discColor === "all" ? undefined : (discColor as string | undefined);
        const newResults = type === "img"
          ? await stockService.searchPhotos(discoverySearch, nextPage, o2, c2)
          : await stockService.searchVideos(discoverySearch, nextPage, o2);

        if (type === "img") {
          setStockPhotos((prev) => [...prev, ...(newResults as StockPhoto[])]);
        } else {
          setStockVideos((prev) => [...prev, ...(newResults as StockVideo[])]);
        }
        setPageState((prev) => ({ ...prev, [type]: nextPage }));
      } catch {
        showToast("Could not load more results", "error");
      } finally {
        setDiscLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    [composer, discoverySearch, discOrientation, discColor, pageState, showToast]
  );

  const saveToLibrary = useCallback(
    async (type: "img" | "vid", item: StockPhoto | StockVideo) => {
      setDiscLoading((prev) => ({ ...prev, [type]: true }));
      try {
        // Fetch the actual file from URL and upload it to library
        const response = await fetch(item.url);
        const blob = await response.blob();
        const file = new File([blob], `${item.id}.${type === "img" ? "jpg" : "mp4"}`, {
          type: blob.type,
        });
        const result = await composer.media.uploadFile(file);
        // Mark as stock source
        if (result.success && result.asset) {
          await composer.media.updateAsset(result.asset.id, { assetSource: "stock" });
        }
        showToast("Saved to library ✓", "success");
      } catch (err) {
        showToast("Failed to save to library", "error");
      } finally {
        setDiscLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    [composer, showToast]
  );

  // Initial load for icons and fonts (if query is empty)
  useEffect(() => {
    const loadStatic = async () => {
      setDiscLoading((prev) => ({ ...prev, ico: true, fnt: true }));
      try {
        const icons = composer.media.getIcons();
        const fonts = await composer.media.getFonts();
        setDiscIcons(icons);
        setDiscFonts(fonts);
      } finally {
        setDiscLoading((prev) => ({ ...prev, ico: false, fnt: false }));
      }
    };
    loadStatic();
  }, [composer]);

  return {
    stockPhotos,
    stockVideos,
    discIcons,
    discFonts,
    discLoading,
    discoverySearch,
    isDiscoveryEmpty: stockPhotos.length === 0 && stockVideos.length === 0 && discIcons.length === 0,
    discOrientation,
    discColor,
    discSearchAll,
    setDiscOrientation,
    setDiscColor,
    loadMoreDisc,
    saveToLibrary,
  };
}
