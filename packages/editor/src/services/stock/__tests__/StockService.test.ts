/**
 * StockService proxies the dashboard tRPC route (#24). Verifies it calls the
 * route with the right input + signal, maps through the result, and — since
 * 2026-09-07 — carries the REASON a search failed instead of flattening every
 * failure to `[]`.
 *
 * The reason survives the wire as a tRPC code. Only codes with a unique
 * JSON-RPC number round-trip: PRECONDITION_FAILED (-32012) and FORBIDDEN
 * (-32003) do; BAD_GATEWAY shares -32603 with INTERNAL_SERVER_ERROR and comes
 * back under that name, which is why "request-failed" is the fallback bucket
 * rather than a code match.
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

import { stockService, StockSearchError } from "../StockService";

/** A structurally-real tRPC client error: the client reads `err.data.code`. */
function trpcError(code: string, message = "server said no") {
  return Object.assign(new Error(message), { name: "TRPCClientError", data: { code } });
}

beforeEach(() => [searchPhotos, searchVideos].forEach((m) => m.mockReset()));

describe("StockService — request plumbing", () => {
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

  it("throws AbortError when the signal is already aborted", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(stockService.searchPhotos("x", 1, undefined, undefined, { signal: ctrl.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(searchPhotos).not.toHaveBeenCalled();
  });

  it("an in-flight abort still surfaces as AbortError, not a search failure", async () => {
    const ctrl = new AbortController();
    searchPhotos.mockImplementationOnce(async () => {
      ctrl.abort();
      throw new Error("aborted by transport");
    });
    await expect(
      stockService.searchPhotos("x", 1, undefined, undefined, { signal: ctrl.signal })
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("searchVideos calls the videos route", async () => {
    searchVideos.mockResolvedValueOnce([{ id: "7", source: "pexels" }]);
    const res = await stockService.searchVideos("x", 1);
    expect(searchVideos).toHaveBeenCalledWith({ query: "x", page: 1 }, { signal: undefined });
    expect(res).toEqual([{ id: "7", source: "pexels" }]);
  });
});

describe("StockService — the four outcomes stay distinguishable", () => {
  // ─── outcome 1: nothing matched ─────────────────────────────────────────
  it("an empty result set resolves to [] and does NOT throw", async () => {
    searchPhotos.mockResolvedValueOnce([]);
    await expect(stockService.searchPhotos("asdfgh", 1)).resolves.toEqual([]);
  });

  // ─── outcome 2: server has no provider key ──────────────────────────────
  it("PRECONDITION_FAILED becomes reason 'not-configured'", async () => {
    searchPhotos.mockRejectedValueOnce(trpcError("PRECONDITION_FAILED"));
    await expect(stockService.searchPhotos("x", 1)).rejects.toMatchObject({
      name: "StockSearchError",
      reason: "not-configured",
    });
  });

  // ─── outcome 3: provider refused the key ────────────────────────────────
  it("FORBIDDEN becomes reason 'unauthorized'", async () => {
    searchPhotos.mockRejectedValueOnce(trpcError("FORBIDDEN"));
    await expect(stockService.searchPhotos("x", 1)).rejects.toMatchObject({
      name: "StockSearchError",
      reason: "unauthorized",
    });
  });

  // ─── outcome 4: the request never landed ────────────────────────────────
  it("a bare network error becomes reason 'request-failed'", async () => {
    searchPhotos.mockRejectedValueOnce(new Error("Failed to fetch"));
    await expect(stockService.searchPhotos("x", 1)).rejects.toMatchObject({
      name: "StockSearchError",
      reason: "request-failed",
    });
  });

  it("an upstream fault (arriving as INTERNAL_SERVER_ERROR) is 'request-failed'", async () => {
    searchPhotos.mockRejectedValueOnce(trpcError("INTERNAL_SERVER_ERROR"));
    await expect(stockService.searchPhotos("x", 1)).rejects.toMatchObject({ reason: "request-failed" });
  });

  it("searchVideos carries the same reasons", async () => {
    searchVideos.mockRejectedValueOnce(trpcError("PRECONDITION_FAILED"));
    await expect(stockService.searchVideos("x", 1)).rejects.toMatchObject({ reason: "not-configured" });

    searchVideos.mockRejectedValueOnce(trpcError("FORBIDDEN"));
    await expect(stockService.searchVideos("x", 1)).rejects.toMatchObject({ reason: "unauthorized" });

    searchVideos.mockRejectedValueOnce(new Error("boom"));
    await expect(stockService.searchVideos("x", 1)).rejects.toMatchObject({ reason: "request-failed" });
  });

  it("the thrown value is a real Error subclass", async () => {
    searchPhotos.mockRejectedValueOnce(new Error("boom"));
    await expect(stockService.searchPhotos("x", 1)).rejects.toBeInstanceOf(StockSearchError);
  });
});
