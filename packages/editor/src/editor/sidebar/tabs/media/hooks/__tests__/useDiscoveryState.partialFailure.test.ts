// @vitest-environment jsdom
/**
 * Photos (Unsplash) and videos (Pexels) are two providers with two optional
 * keys. One of them being unconfigured, refused or down must not take the
 * other's results with it — the search used to fail outright on either.
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDiscoveryState } from "../useDiscoveryState";
import { StockSearchError } from "@/services/stock/StockService";

const photosMock = vi.fn();
const videosMock = vi.fn();

vi.mock("@/services/stock/StockService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/stock/StockService")>()),
  stockService: {
    searchPhotos: (...args: unknown[]) => photosMock(...args),
    searchVideos: (...args: unknown[]) => videosMock(...args),
  },
}));

const composer = { media: { getIcons: () => [], getFonts: async () => [], uploadFile: vi.fn(), updateAsset: vi.fn() } };
const photo = { id: "p1", url: "https://images/p1.jpg", thumb: "t", alt: "A cafe", author: "A", authorUrl: "u", width: 1, height: 1, source: "unsplash" };

async function search(showToast = vi.fn()) {
  const { result } = renderHook(() => useDiscoveryState(composer as never, showToast));
  await act(async () => {
    await result.current.discSearchAll("cafe");
  });
  return { result, showToast };
}

describe("useDiscoveryState — one provider failing", () => {
  beforeEach(() => {
    photosMock.mockReset();
    videosMock.mockReset();
  });

  it("shows the photos when video search is not configured, and reports only video as failed", async () => {
    photosMock.mockResolvedValue([photo]);
    videosMock.mockRejectedValue(new StockSearchError("not-configured", "PEXELS_API_KEY is unset"));
    const { result, showToast } = await search();
    expect(result.current.stockPhotos).toEqual([photo]);
    expect(result.current.searchFailed).toEqual({ img: null, vid: "not-configured" });
    // The photos landed: no "stock search isn't set up" toast over them.
    expect(showToast).not.toHaveBeenCalled();
  });

  it("shows the videos when photo search fails", async () => {
    const video = { id: "v1", url: "https://v/1.mp4", thumb: "t", duration: 3, author: "B", source: "pexels" };
    photosMock.mockRejectedValue(new StockSearchError("unauthorized", "refused"));
    videosMock.mockResolvedValue([video]);
    const { result } = await search();
    expect(result.current.stockVideos).toEqual([video]);
    expect(result.current.searchFailed).toEqual({ img: "unauthorized", vid: null });
  });

  it("toasts once when both providers fail", async () => {
    photosMock.mockRejectedValue(new StockSearchError("not-configured", "x"));
    videosMock.mockRejectedValue(new StockSearchError("not-configured", "y"));
    const { result, showToast } = await search();
    expect(result.current.searchFailed).toEqual({ img: "not-configured", vid: "not-configured" });
    expect(showToast).toHaveBeenCalledTimes(1);
  });
});
