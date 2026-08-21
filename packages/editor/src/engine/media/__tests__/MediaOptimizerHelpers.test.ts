/**
 * MediaOptimizerHelpers — pure helper coverage.
 *
 * jsdom's Image never actually loads, so loadImage is exercised against a
 * stubbed global Image that fires onload/onerror deterministically.
 * fetch-based helpers use Node's real fetch for data: URLs (supported by
 * undici) and a stubbed fetch for remote-URL branches.
 *
 * byte formatting is no longer defined here — the duplicate was drained in
 * favor of the canonical shared/utils/helpers/number.ts:formatBytes, which
 * owns that behavior + its tests.
 *
 * @license BSD-3-Clause
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dataUrlToBlob,
  estimateSize,
  getCompressionSavings,
  getMimeType,
  loadImage,
} from "../MediaOptimizerHelpers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadImage", () => {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin: string | null = null;
    private _src = "";

    get src() {
      return this._src;
    }
    set src(value: string) {
      this._src = value;
      queueMicrotask(() => {
        if (value.includes("bad")) this.onerror?.();
        else this.onload?.();
      });
    }
  }

  it("resolves with the image element and sets crossOrigin=anonymous", async () => {
    vi.stubGlobal("Image", FakeImage);

    const img = await loadImage("https://cdn.example.com/pic.png");

    expect(img).toBeInstanceOf(FakeImage);
    expect(img.crossOrigin).toBe("anonymous");
    expect(img.src).toBe("https://cdn.example.com/pic.png");
  });

  it("rejects with 'Failed to load image' when the image errors", async () => {
    vi.stubGlobal("Image", FakeImage);

    await expect(loadImage("https://cdn.example.com/bad.png")).rejects.toThrow(
      "Failed to load image",
    );
  });
});

describe("dataUrlToBlob", () => {
  it("converts a base64 data URL to a Blob (size + type preserved)", async () => {
    // "hello" base64-encoded
    const blob = await dataUrlToBlob("data:text/plain;base64,aGVsbG8=");
    expect(blob.size).toBe(5);
    expect(blob.type).toBe("text/plain");
    expect(await blob.text()).toBe("hello");
  });

  /* This asserted that a fetch failure propagates — a contract that only
     existed because the function fetched the data URL, which the dashboard's
     CSP refused ("Fetch API cannot load data:image/webp", seen live). It
     decodes now, so there is no network to fail; what CAN go wrong is being
     handed something that is not a data URL. */
  it("rejects input that is not a data URL", async () => {
    await expect(dataUrlToBlob("https://cdn.example/x.png")).rejects.toThrow("Not a data URL");
    await expect(dataUrlToBlob("data:image/png;base64")).rejects.toThrow("Not a data URL");
  });
});

describe("getMimeType", () => {
  it("maps every export format to its MIME type", () => {
    expect(getMimeType("jpeg")).toBe("image/jpeg");
    expect(getMimeType("png")).toBe("image/png");
    expect(getMimeType("webp")).toBe("image/webp");
    expect(getMimeType("avif")).toBe("image/avif");
  });
});

describe("estimateSize", () => {
  it("estimates byte size from base64 payload length (len * 3/4, rounded)", async () => {
    // 8 base64 chars → 6 bytes
    await expect(estimateSize("data:image/png;base64,AAAAAAAA")).resolves.toBe(6);
    // "aGVsbG8=" is 8 chars incl. padding → round(8*3/4) = 6 (over-estimate
    // of the true 5 decoded bytes — padding is not subtracted; current behavior).
    await expect(estimateSize("data:text/plain;base64,aGVsbG8=")).resolves.toBe(6);
  });

  it("returns 0 for a data URL with an empty or missing payload", async () => {
    await expect(estimateSize("data:,")).resolves.toBe(0);
    await expect(estimateSize("data:no-comma-here")).resolves.toBe(0);
  });

  it("fetches non-data URLs and returns the blob size", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({ blob: () => Promise.resolve(new Blob(["12345678"])) }),
      ),
    );

    await expect(estimateSize("https://example.com/img.png")).resolves.toBe(8);
  });

  it("returns 0 when the fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );

    await expect(estimateSize("https://example.com/img.png")).resolves.toBe(0);
  });
});

describe("getCompressionSavings", () => {
  it("computes savings percentage with one decimal", () => {
    expect(getCompressionSavings(1000, 250)).toBe("75.0%");
    expect(getCompressionSavings(3000, 1000)).toBe("66.7%");
  });

  it("returns 0.0% when nothing was saved", () => {
    expect(getCompressionSavings(1000, 1000)).toBe("0.0%");
  });

  it("returns 100.0% when the optimized size is zero", () => {
    expect(getCompressionSavings(1000, 0)).toBe("100.0%");
  });

  it("goes negative when 'optimization' grew the file (as-is)", () => {
    expect(getCompressionSavings(1000, 1500)).toBe("-50.0%");
  });

  it("guards division by zero: originalSize <= 0 → '0%'", () => {
    expect(getCompressionSavings(0, 100)).toBe("0%");
    expect(getCompressionSavings(-10, 100)).toBe("0%");
  });
});

/**
 * `dataUrlToBlob` used to call `fetch(dataUrl)`. A data: URL is bytes the page
 * already holds, but fetching one is a network request as far as the browser is
 * concerned, and the dashboard's CSP refused it — "Fetch API cannot load
 * data:image/webp", seen live — so image optimization failed silently.
 */
describe("dataUrlToBlob decodes without asking the network", () => {
  const PNG_1x1 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  it("returns the bytes with the right type, and never calls fetch", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const blob = await dataUrlToBlob(PNG_1x1);
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBeGreaterThan(60);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("handles a plain (non-base64) data URL", async () => {
    const blob = await dataUrlToBlob("data:text/plain,hello%20there");
    expect(blob.type).toBe("text/plain");
    expect(await blob.text()).toBe("hello there");
  });

  it("refuses something that is not a data URL", async () => {
    await expect(dataUrlToBlob("https://cdn.example/x.png")).rejects.toThrow("Not a data URL");
  });
});
