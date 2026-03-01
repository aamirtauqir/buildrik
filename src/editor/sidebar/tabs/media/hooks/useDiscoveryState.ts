/**
 * Media Tab — Discovery State Hook
 * Single responsibility: stock results, discoverySearch, saveToLibrary.
 * discoverySearch is INDEPENDENT from librarySearch — no cross-contamination.
 * @license BSD-3-Clause
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import type { DiscFont, DiscIcon, StockPhoto, StockVideo } from "../data/mediaTypes";
import type { DiscoveryStateResult } from "../data/mediaTypes";

type ShowToast = (msg: string, type: "success" | "error" | "info") => void;

export function useDiscoveryState(composer: Composer, showToast: ShowToast): DiscoveryStateResult {
  const [discoverySearch, setDiscoverySearch_] = useState("");
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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef("");

  // Load icons + fonts once on mount
  useEffect(() => {
    setDiscIcons(composer.media.getIcons());
    composer.media.getFonts().then(setDiscFonts);
  }, [composer]);

  // Clear pending debounce on unmount to prevent state updates after removal
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const discSearchAll = useCallback(
    (query: string) => {
      setDiscoverySearch_(query);
      latestQueryRef.current = query;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const q = latestQueryRef.current;
        if (!q.trim()) {
          setStockPhotos([]);
          setStockVideos([]);
          return;
        }
        setDiscLoading((prev) => ({ ...prev, img: true, vid: true }));
        try {
          const [photos, videos] = await Promise.all([
            composer.media.searchStock("img", q) as Promise<StockPhoto[]>,
            composer.media.searchStock("vid", q) as Promise<StockVideo[]>,
          ]);
          setStockPhotos(photos);
          setStockVideos(videos);
        } catch {
          showToast("Could not load stock content — check connection", "error");
        } finally {
          setDiscLoading((prev) => ({ ...prev, img: false, vid: false }));
        }
      }, 400);
    },
    [composer]
  );

  const setDiscoverySearch = useCallback(
    (q: string) => {
      discSearchAll(q);
    },
    [discSearchAll]
  );

  const loadMoreDisc = useCallback(
    async (type: "img" | "vid") => {
      setDiscLoading((prev) => ({ ...prev, [type]: true }));
      try {
        const results = await composer.media.searchStock(type, discoverySearch);
        if (type === "img") setStockPhotos((prev) => [...prev, ...(results as StockPhoto[])]);
        else setStockVideos((prev) => [...prev, ...(results as StockVideo[])]);
      } finally {
        setDiscLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    [composer, discoverySearch]
  );

  const saveToLibrary = useCallback(
    async (type: "img" | "vid", item: StockPhoto | StockVideo) => {
      // Guard: check if saveStockAsset capability exists
      if (typeof (composer.media as { saveStockAsset?: unknown })?.saveStockAsset !== "function") {
        showToast("Saving stock assets coming soon", "info");
        return;
      }
      try {
        await (
          composer.media as unknown as {
            saveStockAsset: (type: "img" | "vid", item: StockPhoto | StockVideo) => Promise<void>;
          }
        ).saveStockAsset(type, item);
        showToast("Saved to My Library ✓", "success");
      } catch {
        showToast("Could not save — try again", "error");
      }
    },
    [composer, showToast]
  );

  const isDiscoveryEmpty =
    stockPhotos.length === 0 &&
    stockVideos.length === 0 &&
    discIcons.length === 0 &&
    discFonts.length === 0;

  return {
    stockPhotos,
    stockVideos,
    discIcons,
    discFonts,
    discLoading,
    discoverySearch,
    isDiscoveryEmpty,
    setDiscoverySearch,
    discSearchAll,
    loadMoreDisc,
    saveToLibrary,
  };
}
