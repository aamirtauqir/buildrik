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
 * #24 (2026-06-24): the provider is wired via the dashboard tRPC
 * `media.searchStockPhotos` / `searchStockVideos` proxy (keys stay server-side).
 *
 * This module used to answer EVERY failure with `[]`, which meant an
 * unconfigured deployment, an expired key and a dropped network all reached the
 * user as "No photos found for '<their query>'". The `searchFailed` state in
 * useDiscoveryState and its branch in StockSourceModal were written for exactly
 * this and were unreachable, because nothing ever threw. Failures now throw a
 * StockSearchError carrying the reason. (An `IS_STOCK_CONFIGURED` flag existed
 * here too, hardcoded `true`; removed 2026-07-25 — the configured-ness signal
 * it wanted is now the "not-configured" reason below.)
 */

/** Why a search failed. `null` on the state side means it did not. */
export type StockFailureReason = "not-configured" | "unauthorized" | "request-failed";

export class StockSearchError extends Error {
  constructor(
    public reason: StockFailureReason,
    message: string,
  ) {
    super(message);
    this.name = "StockSearchError";
  }
}

/**
 * Recover the server's reason from the transport error.
 *
 * Only the tRPC code crosses the wire, and only codes with a unique JSON-RPC
 * number survive it: PRECONDITION_FAILED is -32012 and FORBIDDEN is -32003, so
 * the router picks those two deliberately. BAD_GATEWAY shares -32603 with
 * INTERNAL_SERVER_ERROR and arrives under that name — which is why
 * "request-failed" is the fallback rather than a code match. It is also what a
 * bare network error becomes, since that carries no tRPC code at all.
 */
function toStockSearchError(err: unknown): StockSearchError {
  const code = (err as { data?: { code?: string } } | null | undefined)?.data?.code;
  if (code === "PRECONDITION_FAILED") {
    return new StockSearchError("not-configured", "Stock search is not configured on the server.");
  }
  if (code === "FORBIDDEN") {
    return new StockSearchError("unauthorized", "The stock provider rejected the server's API key.");
  }
  return new StockSearchError("request-failed", "The stock search request could not be completed.");
}

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

/**
 * Live stock search via the server proxy. Honors `extras.signal` (passed to the
 * tRPC query so an aborted request rejects with AbortError, preserving the
 * stale-response-discard contract). An abort still wins over a failure — a
 * superseded search must stay silent, not report itself as broken.
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
    } catch (err) {
      if (extras?.signal?.aborted) throw makeAbortError();
      throw toStockSearchError(err);
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
    } catch (err) {
      if (extras?.signal?.aborted) throw makeAbortError();
      throw toStockSearchError(err);
    }
  },
};

function makeAbortError(): DOMException {
  // DOMException is the standard AbortError shape across modern browsers.
  return new DOMException("Aborted", "AbortError");
}
