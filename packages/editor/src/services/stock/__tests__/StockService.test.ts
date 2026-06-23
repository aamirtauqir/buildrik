/**
 * StockService now proxies the dashboard tRPC route (#24). Verifies it calls the
 * route with the right input + signal, maps through the result, returns [] for
 * empty queries / errors, and honors AbortSignal.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const searchPhotos = vi.fn();
const searchVideos = vi.fn();

vi.mock("../../api-client", () => ({
  getBuildrikClient: () => ({
    media: {
      searchStockPhotos: { query: searchPhotos },
      searchStockVideos: { query: searchVideos },
    },
  }),
}));
vi.mock("../../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));

import { stockService, IS_STOCK_CONFIGURED } from "../StockService";

beforeEach(() => [searchPhotos, searchVideos].forEach((m) => m.mockReset()));

describe("StockService", () => {
  it("is marked configured now that the route exists", () => {
    expect(IS_STOCK_CONFIGURED).toBe(true);
  });

  it("searchPhotos calls the route with input + signal and returns the result", async () => {
    const ctrl = new AbortController();
    searchPhotos.mockResolvedValueOnce([{ id: "u1", source: "unsplash" }]);
    const res = await stockService.searchPhotos("cats", 2, "portrait", "blue", { signal: ctrl.signal });
    expect(searchPhotos).toHaveBeenCalledWith(
      { query: "cats", page: 2, orientation: "portrait", color: "blue" },
      { signal: ctrl.signal }
    );
    expect(res).toEqual([{ id: "u1", source: "unsplash" }]);
  });

  it("returns [] for an empty query without calling the route", async () => {
    expect(await stockService.searchPhotos("   ", 1)).toEqual([]);
    expect(searchPhotos).not.toHaveBeenCalled();
  });

  it("returns [] when the route throws (non-abort)", async () => {
    searchPhotos.mockRejectedValueOnce(new Error("network"));
    expect(await stockService.searchPhotos("x", 1)).toEqual([]);
  });

  it("throws AbortError when the signal is already aborted", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(stockService.searchPhotos("x", 1, undefined, undefined, { signal: ctrl.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(searchPhotos).not.toHaveBeenCalled();
  });

  it("searchVideos calls the videos route", async () => {
    searchVideos.mockResolvedValueOnce([{ id: "7", source: "pexels" }]);
    const res = await stockService.searchVideos("x", 1);
    expect(searchVideos).toHaveBeenCalledWith({ query: "x", page: 1 }, { signal: undefined });
    expect(res).toEqual([{ id: "7", source: "pexels" }]);
  });
});
