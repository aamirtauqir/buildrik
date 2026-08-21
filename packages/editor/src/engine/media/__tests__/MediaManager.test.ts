import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("../MediaOptimizer", () => ({
  MediaOptimizer: class {
    async checkFormatSupport() {
      return { webp: true, avif: true, jpeg: true, png: true };
    }
    async optimize() {
      return {
        success: true,
        blob: new Blob(["x"]),
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 1,
        dimensions: { width: 1, height: 1 },
      };
    }
    async convertToWebP() {
      return {
        success: true,
        blob: new Blob(["x"]),
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 1,
        dimensions: { width: 1, height: 1 },
      };
    }
    async compressJpeg() {
      return {
        success: true,
        blob: new Blob(["x"]),
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 1,
        dimensions: { width: 1, height: 1 },
      };
    }
    async previewCompression() {
      return [];
    }
    async batchOptimize() {
      return [];
    }
    async getBestFormat() {
      return "webp";
    }
  },
  formatBytes: () => "0 B",
  getCompressionSavings: () => 0,
}));

import { MediaManager } from "../MediaManager";

describe("MediaManager deduplication", () => {
  it("returns same promise for concurrent getAssetSrc calls", async () => {
    const manager = new MediaManager();
    (manager as any).state.assets = [{ id: "a1", src: "binary" }];
    (manager as any).storage.getBlob = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve(new Blob(["x"])), 10))
    );

    const p1 = manager.getAssetSrc("a1");
    const p2 = manager.getAssetSrc("a1");
    expect(p1).toBe(p2);

    await p1;
    expect((manager as any).storage.getBlob).toHaveBeenCalledTimes(1);
  });
});

/**
 * A blob: URL dies with the window that made it, so the library re-creates one
 * for every locally-stored asset on load. It used to heal only itself: measured
 * live, after a reload the library held a fresh URL while the <img> already
 * placed on the page still carried the dead one — a broken image on a canvas
 * whose media panel showed the picture perfectly well.
 */
describe("MediaManager — rebuilt local URLs are reported, not just applied", () => {
  function managerWith(assets: Array<{ id: string; src: string }>) {
    const manager = new MediaManager();
    const m = manager as unknown as {
      storage: { getAllAssets: () => unknown; getAllFolders: () => unknown; getBlob: () => unknown };
      loadFromStorage: () => Promise<void>;
    };
    m.storage.getAllAssets = vi.fn(async () => assets);
    m.storage.getAllFolders = vi.fn(async () => []);
    m.storage.getBlob = vi.fn(async () => new Blob(["bin"]));
    return { manager, load: () => m.loadFromStorage() };
  }

  it("emits old → new for every asset whose object URL was rebuilt", async () => {
    const { manager, load } = managerWith([
      { id: "a1", src: "blob:http://localhost/dead-one" },
      { id: "a2", src: "blob:http://localhost/dead-two" },
    ]);
    const seen: Array<Record<string, string>> = [];
    manager.on("media:local-urls-rebuilt", (p: unknown) => {
      seen.push((p as { remapped: Record<string, string> }).remapped);
    });

    await load();

    expect(seen).toHaveLength(1);
    const remapped = seen[0];
    expect(Object.keys(remapped).sort()).toEqual([
      "blob:http://localhost/dead-one",
      "blob:http://localhost/dead-two",
    ]);
    for (const [dead, live] of Object.entries(remapped)) {
      expect(live).not.toBe(dead);
      expect(live.startsWith("blob:")).toBe(true);
    }
  });

  it("says nothing about assets that live on a server", async () => {
    const { manager, load } = managerWith([
      { id: "a1", src: "https://cdn.example/img.png" },
      { id: "a2", src: "data:image/png;base64,AAA" },
    ]);
    const seen: unknown[] = [];
    manager.on("media:local-urls-rebuilt", (p: unknown) => seen.push(p));

    await load();

    expect(seen).toHaveLength(0);
  });
});
