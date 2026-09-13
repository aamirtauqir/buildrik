/**
 * Media Tab — Discovery State Hook
 * Handles stock photos, videos, icons, and fonts searching.
 * @license BSD-3-Clause
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { displayNameFor } from "../data/mediaUtils";
import type { Composer } from "../../../../../engine/Composer";
import {
  stockService,
  StockSearchError,
  type StockFailureReason,
} from "../../../../../services/stock/StockService";
import type {
  DiscFont,
  DiscIcon,
  DiscoveryStateResult,
  DiscSource,
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
 * S19 (2026-05-09): added AbortController per search so stale results are
 * discarded mid-fetch (prototype §25 critical contract #4) + source provider
 * state (Unsplash / Pexels / Pixabay).
 *
 * 2026-09-07: stockService throws a StockSearchError naming WHY a search
 * failed instead of returning []. The catch below already existed and could
 * never run — every failure arrived as an empty array, so the modal reported
 * the user's query as fruitless whatever had actually gone wrong.
 */

function isAbortError(err: unknown): boolean {
  return (
    err instanceof DOMException && err.name === "AbortError"
  );
}

function reasonOf(err: unknown): StockFailureReason {
  return err instanceof StockSearchError ? err.reason : "request-failed";
}

const EXT_FOR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/** "Restaurant interior" · image/jpeg → "restaurant-interior.jpg"; a video has no title, so its provider id names it. */
function stockFileName(item: StockPhoto | StockVideo | DiscIcon, mime: string): string {
  const title = "alt" in item ? item.alt : "name" in item ? item.name : "";
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = EXT_FOR_MIME[mime] ?? (mime.split("/")[1] || "bin");
  return `${slug || item.id}.${ext}`;
}

/** One line each, because these are three different things to go and do. */
const FAILURE_TOAST: Record<StockFailureReason, string> = {
  "not-configured": "Stock search isn't set up on this site",
  unauthorized: "The stock provider rejected our API key",
  "request-failed": "Couldn't reach the stock library",
};

export function useDiscoveryState(
  composer: Composer,
  showToast: (msg: string, type: "success" | "error" | "info") => void
): DiscoveryStateResult {
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [stockVideos, setStockVideos] = useState<StockVideo[]>([]);
  const [discIcons, setDiscIcons] = useState<DiscIcon[]>([]);
  const [discFonts, setDiscFonts] = useState<DiscFont[]>([]);
  const [discoverySearch, setDiscoverySearch] = useState("");
  /** WHY the last stock search failed, or null. Distinguishes "not configured"
      from "key refused" from "request failed" from "genuinely no results" —
      the modal rendered all four the same. */
  const [searchFailed, setSearchFailed] = useState<StockFailureReason | null>(null);
  const [discOrientation, setDiscOrientation_] = useState<DiscOrientation>("all");
  const [discColor, setDiscColor_] = useState<DiscColor>("all");
  const [discSource, setDiscSource_] = useState<DiscSource>("unsplash");
  const [discLoading, setDiscLoading] = useState({
    img: false,
    vid: false,
    ico: false,
    fnt: false,
  });
  // Cursor-based pagination: track current page per type
  const [pageState, setPageState] = useState({ img: 1, vid: 1 });

  // Stale-discard: every search aborts the previous one. Late resolutions
  // are silently dropped — no setState, no toast — so out-of-order responses
  // never overwrite the active query's results.
  const searchAbortRef = useRef<AbortController | null>(null);
  const loadMoreAbortRef = useRef<AbortController | null>(null);

  // Abort any in-flight requests on unmount.
  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
      loadMoreAbortRef.current?.abort();
    };
  }, []);

  const discSearchAll = useCallback(
    async (query: string, orientation?: DiscOrientation, color?: DiscColor) => {
      setDiscoverySearch(query);
      const activeOrientation = orientation ?? discOrientation;
      const activeColor = color ?? discColor;

      // Abort any prior in-flight search before starting a new one.
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      if (!query.trim()) {
        setStockPhotos([]);
        setStockVideos([]);
        setSearchFailed(null);
        setPageState({ img: 1, vid: 1 });
        return;
      }

      setSearchFailed(null);
      setPageState({ img: 1, vid: 1 });
      setDiscLoading((prev) => ({ ...prev, img: true, vid: true }));
      // P5: stockService expects "landscape"|"portrait"|"squarish"|undefined.
      // DiscOrientation adds "all" which maps to "no filter" → undefined.
      const o = activeOrientation === "all" ? undefined : activeOrientation;
      const c = activeColor === "all" ? undefined : (activeColor as string | undefined);
      try {
        const [photos, videos] = await Promise.all([
          stockService.searchPhotos(query, 1, o, c, { signal: controller.signal, source: discSource }),
          stockService.searchVideos(query, 1, o, { signal: controller.signal, source: discSource }),
        ]);
        // Drop late resolutions: if a newer search has already started,
        // this controller is no longer the active one.
        if (controller.signal.aborted) return;
        setStockPhotos(photos as StockPhoto[]);
        setStockVideos(videos as StockVideo[]);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        /* The toast used to be the ONLY signal, and it auto-dismissed. The
           modal reads `searchFailed` for the persistent message, so the reason
           has to outlive the toast (blocker A-STOCK). */
        const reason = reasonOf(err);
        setSearchFailed(reason);
        showToast(FAILURE_TOAST[reason], "error");
      } finally {
        if (!controller.signal.aborted) {
          setDiscLoading((prev) => ({ ...prev, img: false, vid: false }));
        }
      }
    },
    [composer, showToast, discOrientation, discColor, discSource]
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

  const setDiscSource = useCallback((s: DiscSource) => {
    setDiscSource_(s);
    // Re-search is fired by the effect below — calling discSearchAll
    // synchronously here would close over the stale source value.
  }, []);

  // Source-change re-search: skips the very first render so we don't
  // fire a stray search when the hook mounts with the default provider.
  const sourceMountRef = useRef(true);
  useEffect(() => {
    if (sourceMountRef.current) {
      sourceMountRef.current = false;
      return;
    }
    if (discoverySearch.trim()) {
      discSearchAll(discoverySearch, discOrientation, discColor);
    }
    // Intentionally only depend on discSource — the others would
    // double-fire alongside their own setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discSource]);

  const loadMoreDisc = useCallback(
    async (type: "img" | "vid") => {
      if (!discoverySearch.trim()) return;

      // Per-pagination abort: a new "load more" while one is in-flight
      // cancels the previous, keeping page-state tight.
      loadMoreAbortRef.current?.abort();
      const controller = new AbortController();
      loadMoreAbortRef.current = controller;

      const nextPage = pageState[type] + 1;
      setDiscLoading((prev) => ({ ...prev, [type]: true }));
      try {
        const o2 = discOrientation === "all" ? undefined : discOrientation;
        const c2 = discColor === "all" ? undefined : (discColor as string | undefined);
        const newResults = type === "img"
          ? await stockService.searchPhotos(discoverySearch, nextPage, o2, c2, { signal: controller.signal, source: discSource })
          : await stockService.searchVideos(discoverySearch, nextPage, o2, { signal: controller.signal, source: discSource });

        if (controller.signal.aborted) return;
        if (type === "img") {
          setStockPhotos((prev) => [...prev, ...(newResults as StockPhoto[])]);
        } else {
          setStockVideos((prev) => [...prev, ...(newResults as StockVideo[])]);
        }
        setPageState((prev) => ({ ...prev, [type]: nextPage }));
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        // Page 2+ keeps the results already on screen, so this reports through
        // the toast only — replacing the grid with an error would discard them.
        showToast(FAILURE_TOAST[reasonOf(err)], "error");
      } finally {
        if (!controller.signal.aborted) {
          setDiscLoading((prev) => ({ ...prev, [type]: false }));
        }
      }
    },
    [composer, discoverySearch, discOrientation, discColor, discSource, pageState, showToast]
  );

  /* Clone 3695:45573 reads "restaurant-interior.jpg is now in your asset
     library" — the file is named from the result's own title, with the
     extension the body really has, not `<providerId>.jpg`. Resolves with the
     asset the library now holds so the orchestrator can show that dialog and
     select it on View asset; null when the engine refused (the toast says so,
     the stock dialog stays open with its selection). An icon is a real save
     too: its SVG data URL is fetched and lands through the same upload gate,
     sanitizer included. */
  const saveToLibrary = useCallback(
    async (type: "img" | "vid" | "ico", item: StockPhoto | StockVideo | DiscIcon): Promise<{ key: string; name: string } | null> => {
      setDiscLoading((prev) => ({ ...prev, [type]: true }));
      try {
        const response = await fetch("svgDataUrl" in item ? item.svgDataUrl : item.url);
        const blob = await response.blob();
        const file = new File([blob], stockFileName(item, blob.type), { type: blob.type });
        const result = await composer.media.uploadFile(file);
        if (!result.success || !result.asset) throw new Error(result.error ?? "Upload failed");
        await composer.media.updateAsset(result.asset.id, { assetSource: "stock" });
        /* The name the library prints — the engine stores the stem. */
        return { key: result.asset.id, name: displayNameFor(result.asset.name, result.asset.mimeType) };
      } catch (err) {
        showToast("Failed to save to library", "error");
        return null;
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

  // Icons + fonts are loaded once and were rendered unfiltered — the search
  // box did nothing for those tabs. Filter them client-side by the query so
  // search applies across all tabs, not just stock photos/videos.
  const _q = discoverySearch.trim().toLowerCase();
  const filteredIcons = _q
    ? discIcons.filter(
        (i) =>
          i.name.toLowerCase().includes(_q) || i.category.toLowerCase().includes(_q),
      )
    : discIcons;
  const filteredFonts = _q
    ? discFonts.filter(
        (f) =>
          f.family.toLowerCase().includes(_q) || f.category.toLowerCase().includes(_q),
      )
    : discFonts;

  return {
    stockPhotos,
    stockVideos,
    discIcons: filteredIcons,
    discFonts: filteredFonts,
    discLoading,
    discoverySearch,
    searchFailed,
    isDiscoveryEmpty: stockPhotos.length === 0 && stockVideos.length === 0 && filteredIcons.length === 0,
    discOrientation,
    discColor,
    discSource,
    discSearchAll,
    setDiscOrientation,
    setDiscColor,
    setDiscSource,
    loadMoreDisc,
    saveToLibrary,
  };
}
