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
import { getBuildrikClient } from "../api-client";
import { DASHBOARD_URL } from "../../shared/utils/runtimeEnv";

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
 * #24 (2026-06-24): the provider is now wired via the dashboard tRPC
 * `media.searchStockPhotos` / `searchStockVideos` proxy (keys stay server-side).
 * `true` means the UI shows the stock browser; the server returns `[]` when its
 * provider keys (UNSPLASH_ACCESS_KEY / PEXELS_API_KEY) are unset, which the
 * existing "no results" empty state handles.
 */
export const IS_STOCK_CONFIGURED = true;

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

/**
 * Live stock search via the server proxy. Honors `extras.signal` (passed to the
 * tRPC query so an aborted request rejects with AbortError, preserving the
 * stale-response-discard contract). Any non-abort error falls back to `[]` so a
 * provider/network hiccup degrades to the empty state, never a thrown UI.
 */
export const stockService: StockService = {
  async searchPhotos(query, page, orientation, color, extras) {
    if (extras?.signal?.aborted) throw makeAbortError();
    if (!query.trim()) return [];
    try {
      const res = await client().media.searchStockPhotos.query(
        { query, page, orientation: orientation ?? null, color: color ?? null },
        { signal: extras?.signal }
      );
      return res as StockPhoto[];
    } catch {
      if (extras?.signal?.aborted) throw makeAbortError();
      return [];
    }
  },
  async searchVideos(query, page, _orientation, extras) {
    if (extras?.signal?.aborted) throw makeAbortError();
    if (!query.trim()) return [];
    try {
      const res = await client().media.searchStockVideos.query(
        { query, page },
        { signal: extras?.signal }
      );
      return res as StockVideo[];
    } catch {
      if (extras?.signal?.aborted) throw makeAbortError();
      return [];
    }
  },
};

function makeAbortError(): DOMException {
  // DOMException is the standard AbortError shape across modern browsers.
  return new DOMException("Aborted", "AbortError");
}
