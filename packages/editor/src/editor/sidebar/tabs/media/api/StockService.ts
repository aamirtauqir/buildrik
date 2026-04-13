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
 * @license BSD-3-Clause
 */

import type {
  StockPhoto,
  StockVideo,
} from "../../../../../engine/media/MediaManager";

export type StockOrientation = "landscape" | "portrait" | "squarish" | undefined;
export type StockColor = string | undefined;

export interface StockService {
  searchPhotos(
    query: string,
    page: number,
    orientation?: StockOrientation,
    color?: StockColor,
  ): Promise<StockPhoto[]>;
  searchVideos(
    query: string,
    page: number,
    orientation?: StockOrientation,
  ): Promise<StockVideo[]>;
}

/**
 * Empty stub. Returns `[]` for every query. Keeps the UI functional —
 * empty-state messaging is already designed ("No results, try stock search").
 * Real provider calls land as a follow-up when API keys are wired.
 */
export const stockService: StockService = {
  async searchPhotos() {
    return [];
  },
  async searchVideos() {
    return [];
  },
};
