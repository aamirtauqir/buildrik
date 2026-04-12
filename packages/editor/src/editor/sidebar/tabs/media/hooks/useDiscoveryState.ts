/**
 * Media Tab — Discovery State Hook
 * Handles stock photos, videos, icons, and fonts searching.
 * @license BSD-3-Clause
 */

import { useCallback, useEffect, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import type {
  DiscFont,
  DiscIcon,
  DiscoveryStateResult,
  StockPhoto,
  StockVideo,
  DiscOrientation,
  DiscColor,
} from "../data/mediaTypes";

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
      try {
        const [photos, videos] = await Promise.all([
          composer.media.searchStock("img", query, activeOrientation, activeColor),
          composer.media.searchStock("vid", query, activeOrientation),
        ]);
        setStockPhotos(photos as StockPhoto[]);
        setStockVideos(videos as StockVideo[]);
      } catch (err) {
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
        const results = await composer.media.searchStock(
          type,
          discoverySearch,
          discOrientation,
          type === "img" ? discColor : undefined
        );
        // searchStock always returns page 1 — pass page via the service directly
        const { stockService } = await import("../api/StockService");
        const newResults = type === "img"
          ? await stockService.searchPhotos(discoverySearch, nextPage, discOrientation, discColor)
          : await stockService.searchVideos(discoverySearch, nextPage, discOrientation);

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
