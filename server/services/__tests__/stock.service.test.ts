import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchStockPhotos, searchStockVideos } from "@server/services/stock.service";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.UNSPLASH_ACCESS_KEY;
  delete process.env.PEXELS_API_KEY;
});

describe("stock.service — photos (Unsplash)", () => {
  it("returns [] (no fetch) when UNSPLASH_ACCESS_KEY is unset — preserves the stub", async () => {
    expect(await searchStockPhotos("cats", 1, null, null)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps Unsplash results to the StockPhoto shape + drops malformed rows", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "k";
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "u1",
            urls: { regular: "r.jpg", thumb: "t.jpg" },
            width: 800,
            height: 600,
            alt_description: "A cat",
            user: { name: "Jane", links: { html: "https://u/jane" } },
          },
          { id: "bad" }, // no urls.regular → dropped
        ],
      }),
    });
    const res = await searchStockPhotos("cats", 1, "landscape", null);
    expect(res).toEqual([
      { id: "u1", url: "r.jpg", thumb: "t.jpg", alt: "A cat", author: "Jane", authorUrl: "https://u/jane", width: 800, height: 600, source: "unsplash" },
    ]);
    const [url, opts] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(url).toContain("orientation=landscape");
    expect(opts.headers.Authorization).toBe("Client-ID k");
  });

  it("returns [] on an upstream error response", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "k";
    fetchMock.mockResolvedValueOnce({ ok: false });
    expect(await searchStockPhotos("x", 1, null, null)).toEqual([]);
  });
});

describe("stock.service — videos (Pexels)", () => {
  it("returns [] without PEXELS_API_KEY", async () => {
    expect(await searchStockVideos("x", 1)).toEqual([]);
  });

  it("maps Pexels videos, preferring an hd link", async () => {
    process.env.PEXELS_API_KEY = "p";
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        videos: [
          {
            id: 7,
            duration: 12,
            image: "thumb.jpg",
            user: { name: "Sam" },
            video_files: [
              { link: "sd.mp4", quality: "sd" },
              { link: "hd.mp4", quality: "hd" },
            ],
          },
        ],
      }),
    });
    expect(await searchStockVideos("x", 1)).toEqual([
      { id: "7", url: "hd.mp4", thumb: "thumb.jpg", duration: 12, author: "Sam", source: "pexels" },
    ]);
  });
});
