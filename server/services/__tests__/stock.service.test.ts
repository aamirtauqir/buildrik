/**
 * Stock search has four outcomes and they must not look alike.
 *
 * Until 2026-09-07 every one of them returned `[]`: no API key, an expired key,
 * a dead network, and a query that genuinely matched nothing. The editor drew
 * all four as "No photos found for …", so an unconfigured deployment was
 * indistinguishable from an unpopular search term. These tests pin the four
 * apart — the empty one stays `[]`, the other three throw a coded StockError.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchStockPhotos, searchStockVideos, StockError } from "@server/services/stock.service";

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
  it("maps Unsplash results to the StockPhoto shape + drops malformed rows", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "k";
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
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

  // ─── outcome 1: nothing matched ─────────────────────────────────────────
  it("returns [] — not an error — when the provider genuinely matched nothing", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "k";
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ results: [] }) });
    await expect(searchStockPhotos("asdfgh", 1, null, null)).resolves.toEqual([]);
  });

  // ─── outcome 2: the deployment has no key ───────────────────────────────
  it("throws NOT_CONFIGURED (without calling fetch) when UNSPLASH_ACCESS_KEY is unset", async () => {
    await expect(searchStockPhotos("cats", 1, null, null)).rejects.toMatchObject({
      name: "StockError",
      code: "NOT_CONFIGURED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ─── outcome 3: the key exists and the provider refused it ──────────────
  it("throws UNAUTHORIZED when Unsplash rejects the key (401)", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "expired";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(searchStockPhotos("cats", 1, null, null)).rejects.toMatchObject({
      name: "StockError",
      code: "UNAUTHORIZED",
    });
  });

  it("throws UNAUTHORIZED on 403 too", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "revoked";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(searchStockPhotos("cats", 1, null, null)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  // ─── outcome 4: the request never landed ────────────────────────────────
  it("throws REQUEST_FAILED on a non-auth upstream error response", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "k";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(searchStockPhotos("x", 1, null, null)).rejects.toMatchObject({
      name: "StockError",
      code: "REQUEST_FAILED",
    });
  });

  it("throws REQUEST_FAILED when the network is down", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "k";
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(searchStockPhotos("x", 1, null, null)).rejects.toMatchObject({ code: "REQUEST_FAILED" });
  });

  it("throws REQUEST_FAILED when the body is not the shape Unsplash promises", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "k";
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ nope: 1 }) });
    await expect(searchStockPhotos("x", 1, null, null)).rejects.toMatchObject({ code: "REQUEST_FAILED" });
  });

  it("still returns [] for a blank query once the key is present", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "k";
    await expect(searchStockPhotos("   ", 1, null, null)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("StockError is a real Error subclass so `instanceof` works across the router", async () => {
    await expect(searchStockPhotos("cats", 1, null, null)).rejects.toBeInstanceOf(StockError);
  });
});

describe("stock.service — videos (Pexels)", () => {
  it("maps Pexels videos, preferring an hd link", async () => {
    process.env.PEXELS_API_KEY = "p";
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
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

  it("returns [] when Pexels genuinely matched nothing", async () => {
    process.env.PEXELS_API_KEY = "p";
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ videos: [] }) });
    await expect(searchStockVideos("asdfgh", 1)).resolves.toEqual([]);
  });

  it("throws NOT_CONFIGURED without PEXELS_API_KEY", async () => {
    await expect(searchStockVideos("x", 1)).rejects.toMatchObject({
      name: "StockError",
      code: "NOT_CONFIGURED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws UNAUTHORIZED when Pexels rejects the key", async () => {
    process.env.PEXELS_API_KEY = "expired";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(searchStockVideos("x", 1)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws REQUEST_FAILED on an upstream fault", async () => {
    process.env.PEXELS_API_KEY = "p";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(searchStockVideos("x", 1)).rejects.toMatchObject({ code: "REQUEST_FAILED" });
  });
});
