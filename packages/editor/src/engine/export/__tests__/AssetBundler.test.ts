/**
 * AssetBundler Tests
 * URL extraction, fetch bundling (fetch stubbed), URL rewriting, state reset.
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { AssetBundler } from "../AssetBundler";

vi.mock("../../../shared/utils/devLogger", () => ({
  devWarn: vi.fn(),
}));

function okResponse(contentType: string | null = "image/png", bytes = [1, 2, 3]) {
  return {
    ok: true,
    headers: { get: () => contentType },
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AssetBundler.extractImageUrls", () => {
  it("collects img src and background url() references, deduplicated", () => {
    const html = `
      <img src="https://cdn.x/pic.png" />
      <img src="https://cdn.x/pic.png" />
      <div style="background-image: url('https://cdn.x/bg.jpg')"></div>
      <div style="background: url(https://cdn.x/tile.webp)"></div>
    `;

    const urls = new AssetBundler().extractImageUrls(html);

    expect(urls.sort()).toEqual([
      "https://cdn.x/bg.jpg",
      "https://cdn.x/pic.png",
      "https://cdn.x/tile.webp",
    ]);
  });

  it("skips data: URLs and non-image sources", () => {
    const html = `
      <img src="data:image/png;base64,AAAA" />
      <video src="https://cdn.x/movie.mp4"></video>
    `;

    expect(new AssetBundler().extractImageUrls(html)).toEqual([]);
  });

  it("keeps image URLs that carry query strings", () => {
    const html = '<img src="https://cdn.x/pic.png?v=2" />';

    expect(new AssetBundler().extractImageUrls(html)).toEqual(["https://cdn.x/pic.png?v=2"]);
  });
});

describe("AssetBundler.extractFontUrls", () => {
  it("collects font-file url() references from CSS and ignores images", () => {
    const css = `
      @font-face { font-family: A; src: url("https://cdn.x/font.woff2") format("woff2"); }
      @font-face { font-family: B; src: url(https://cdn.x/font.ttf); }
      .hero { background-image: url("https://cdn.x/bg.png"); }
    `;

    const urls = new AssetBundler().extractFontUrls(css);

    expect(urls.sort()).toEqual(["https://cdn.x/font.ttf", "https://cdn.x/font.woff2"]);
  });
});

describe("AssetBundler.fetchAsset", () => {
  it("bundles a fetched asset with sequential local paths and header MIME type", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse("image/png")));
    const bundler = new AssetBundler();

    const first = await bundler.fetchAsset("https://cdn.x/a.png");
    const second = await bundler.fetchAsset("https://cdn.x/b.jpg");

    expect(first).toMatchObject({
      originalUrl: "https://cdn.x/a.png",
      localPath: "assets/asset-1.png",
      mimeType: "image/png",
    });
    expect(first!.content.byteLength).toBe(3);
    expect(second!.localPath).toBe("assets/asset-2.jpg");
    expect(bundler.getUrlMap().get("https://cdn.x/a.png")).toBe("assets/asset-1.png");
  });

  it("falls back to extension-derived MIME type when the header is absent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse(null)));
    const bundler = new AssetBundler();

    const asset = await bundler.fetchAsset("https://cdn.x/font.woff2");

    expect(asset!.mimeType).toBe("font/woff2");
    expect(asset!.localPath).toBe("assets/asset-1.woff2");
  });

  it("uses .bin and octet-stream for extensionless URLs", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse(null)));

    const asset = await new AssetBundler().fetchAsset("https://cdn.x/blob");

    expect(asset!.localPath).toBe("assets/asset-1.bin");
    expect(asset!.mimeType).toBe("application/octet-stream");
  });

  it("returns null for non-ok responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })));

    expect(await new AssetBundler().fetchAsset("https://cdn.x/missing.png")).toBeNull();
  });

  it("returns null for data: URLs without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await new AssetBundler().fetchAsset("data:image/png;base64,AAAA")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("AssetBundler.bundleAssets", () => {
  it("bundles successes and drops failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("good") ? okResponse() : Promise.reject(new Error("network down"))
      )
    );
    const bundler = new AssetBundler();

    const result = await bundler.bundleAssets(["https://cdn.x/good.png", "https://cdn.x/bad.png"]);

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].originalUrl).toBe("https://cdn.x/good.png");
  });

  it.todo(
    "BUG: bundleAssets never reports failures — fetchAsset swallows every error to null, so no promise ever rejects and the `errors` array is always empty even when every fetch fails"
  );

  it("pins current behavior: a failed fetch yields empty assets AND an empty errors array", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("network down"))));

    const result = await new AssetBundler().bundleAssets(["https://cdn.x/bad.png"]);

    expect(result.assets).toEqual([]);
    expect(result.errors).toEqual([]); // failures are silently dropped
  });
});

describe("AssetBundler URL rewriting", () => {
  it("rewrites every occurrence of a bundled URL in HTML, including regex-special URLs", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse()));
    const bundler = new AssetBundler();
    const url = "https://cdn.x/img.png?v=1";
    const asset = (await bundler.fetchAsset(url))!;

    const html = `<img src="${url}" /><div style="background: url(${url})"></div>`;
    const rewritten = bundler.rewriteUrls(html, [asset]);

    expect(rewritten).toBe(
      '<img src="assets/asset-1.png" /><div style="background: url(assets/asset-1.png)"></div>'
    );
  });

  it("rewrites font URLs in CSS", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse("font/woff2")));
    const bundler = new AssetBundler();
    const asset = (await bundler.fetchAsset("https://cdn.x/font.woff2"))!;

    const css = '@font-face { src: url("https://cdn.x/font.woff2"); }';

    expect(bundler.rewriteFontUrls(css, [asset])).toBe(
      '@font-face { src: url("assets/asset-1.woff2"); }'
    );
  });
});

describe("AssetBundler state", () => {
  it("getUrlMap returns a defensive copy", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse()));
    const bundler = new AssetBundler();
    await bundler.fetchAsset("https://cdn.x/a.png");

    const copy = bundler.getUrlMap();
    copy.clear();

    expect(bundler.getUrlMap().size).toBe(1);
  });

  it("reset() clears the URL map and restarts the asset counter", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse()));
    const bundler = new AssetBundler();
    await bundler.fetchAsset("https://cdn.x/a.png");

    bundler.reset();
    expect(bundler.getUrlMap().size).toBe(0);

    const next = await bundler.fetchAsset("https://cdn.x/b.png");
    expect(next!.localPath).toBe("assets/asset-1.png");
  });
});
