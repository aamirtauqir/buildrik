/**
 * StockService — adapter for external stock photo/video search (Unsplash, Pexels).
 *
 * Currently a stub: returns empty results. The MediaTab imports it eagerly
 * and `useDiscoveryState` imports it lazily; both paths resolve to this
 * module so the library view loads without a network dependency.
 *
 * To enable real stock search, swap the `searchPhotos` / `searchVideos`
 * implementations for fetch calls against the providers (both require API
 * keys set at the app layer, not committed here).
 *
 * S19 (2026-05-09): added optional `signal` + `source` so consumers can
 * (a) discard stale responses via AbortController per the prototype §25
 * critical contract #4, and (b) switch between Unsplash / Pexels / Pixabay.
 *
 * @license BSD-3-Clause
 */

import type { StockPhoto, StockVideo } from "../../engine/media/MediaManager";

export type StockOrientation = "landscape" | "portrait" | "squarish" | undefined;
export type StockColor = string | undefined;
export type StockSource = "unsplash" | "pexels" | "pixabay";

export interface StockSearchExtras {
  /** AbortSignal — when aborted, the promise rejects with DOMException("AbortError"). */
  signal?: AbortSignal;
  /** Provider override; defaults to "unsplash" when unset. */
  source?: StockSource;
}

export interface StockService {
  searchPhotos(
    query: string,
    page: number,
    orientation?: StockOrientation,
    color?: StockColor,
    extras?: StockSearchExtras,
  ): Promise<StockPhoto[]>;
  searchVideos(
    query: string,
    page: number,
    orientation?: StockOrientation,
    extras?: StockSearchExtras,
  ): Promise<StockVideo[]>;
}

/**
 * Set to true once a real provider (Unsplash / Pexels / Pixabay) is wired
 * up — either by replacing the stub below or swapping to the dashboard
 * tRPC `media.searchStock` route. UI consumers should gate "Browse stock"
 * surfaces on this flag so users see a "not configured" banner instead of
 * empty results that look like "no matches."
 */
export const IS_STOCK_CONFIGURED = false;

/**
 * Empty stub. Returns `[]` for every query. Keeps the UI functional —
 * empty-state messaging is already designed ("No results, try stock search").
 *
 * Honors `extras.signal` so consumer-side AbortController contracts hold:
 * an aborted call rejects with the standard AbortError so `try/catch +
 * isAborted` patterns work in both stub and live providers.
 */
export const stockService: StockService = {
  async searchPhotos(_query, _page, _orientation, _color, extras) {
    if (extras?.signal?.aborted) throw makeAbortError();
    return [];
  },
  async searchVideos(_query, _page, _orientation, extras) {
    if (extras?.signal?.aborted) throw makeAbortError();
    return [];
  },
};

function makeAbortError(): DOMException {
  // DOMException is the standard AbortError shape across modern browsers.
  return new DOMException("Aborted", "AbortError");
}
