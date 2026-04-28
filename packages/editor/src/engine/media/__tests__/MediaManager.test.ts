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
