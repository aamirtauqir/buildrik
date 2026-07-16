/**
 * MediaManager.uploadFile pipeline + Phase B2/B5 retry machinery.
 *
 * Covers the branches reachable in jsdom with a stubbed Image (jsdom never
 * fires img.onload, so getMediaDimensions would hang without it):
 *  - per-type size validation (validateFile → getMaxFileSize)
 *  - MIME sniff mismatch (spoofed SVG declared image/png → sanitizer route)
 *  - SVG sanitize accept + reject paths
 *  - server mirror success (asset re-keyed to server CUID) and failure
 *    (localOnly + retryQueue)
 *  - P1C tombstone: deleteAsset while uploadAndCreate is in flight
 *  - P2 durability: retry queue rebuild from persisted localOnly markers
 *    and the retryLocalOnlyAssets drain
 *
 * Storage is mocked per-instance (IndexedDB is absent in jsdom); the
 * MediaOptimizer module mock mirrors MediaManager.test.ts.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../MediaOptimizer", () => ({
  MediaOptimizer: class {
    async checkFormatSupport() {
      return { webp: true, avif: true, jpeg: true, png: true };
    }
    async convertToWebP() {
      return {
        success: true,
        blob: new Blob(["webp"], { type: "image/webp" }),
        originalSize: 4,
        optimizedSize: 4,
        compressionRatio: 1,
        dimensions: { width: 1, height: 1 },
      };
    }
  },
  formatBytes: () => "0 B",
  getCompressionSavings: () => 0,
}));

import { MediaManager } from "../MediaManager";
import { MEDIA_EVENTS } from "@/shared/constants/media";
import type { MediaAsset, RemoteAssetSync } from "@/shared/types/media";

/** jsdom never loads images — fire onerror so getMediaDimensions resolves undefined. */
class NonLoadingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 0;
  height = 0;
  set src(_v: string) {
    queueMicrotask(() => this.onerror?.());
  }
}

function makeFile(content: string, name: string, type: string, sizeOverride?: number): File {
  const file = new File([content], name, { type });
  if (sizeOverride !== undefined) {
    Object.defineProperty(file, "size", { value: sizeOverride });
  }
  return file;
}

function makeRemoteSync(overrides: Partial<RemoteAssetSync> = {}): RemoteAssetSync {
  return {
    uploadAndCreate: vi.fn(async () => ({ serverId: "srv-1", url: "https://cdn/x.png" })),
    deleteRemote: vi.fn(async () => true),
    createFolder: vi.fn(async () => ({ serverId: "srv-f1" })),
    deleteFolder: vi.fn(async () => true),
    moveAsset: vi.fn(async () => true),
    updateAsset: vi.fn(async () => true),
    renameFolder: vi.fn(async () => true),
    ...overrides,
  } as RemoteAssetSync;
}

function mockStorage(manager: MediaManager) {
  const s = (manager as any).storage;
  s.init = vi.fn(async () => {});
  s.saveAsset = vi.fn(async () => {});
  s.deleteAsset = vi.fn(async () => {});
  s.getBlob = vi.fn(async () => new Blob(["bin"]));
  s.saveFolder = vi.fn(async () => {});
  s.deleteFolder = vi.fn(async () => {});
  s.getAllAssets = vi.fn(async () => []);
  s.getAllFolders = vi.fn(async () => []);
  return s;
}

function captureEvents(manager: MediaManager, event: string): unknown[] {
  const calls: unknown[] = [];
  manager.on(event, (p) => calls.push(p));
  return calls;
}

function seedAsset(
  manager: MediaManager,
  partial: Partial<MediaAsset> & { id: string },
): MediaAsset {
  const asset: MediaAsset = {
    type: partial.type ?? "image",
    name: partial.name ?? "x",
    originalName: partial.originalName ?? "x.png",
    src: partial.src ?? "binary",
    mimeType: partial.mimeType ?? "image/png",
    size: partial.size ?? 3,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
  (manager as any).state.assets.push(asset);
  return asset;
}

beforeEach(() => {
  vi.stubGlobal("Image", NonLoadingImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadFile — validation (size per type, allowed MIME)", () => {
  it("rejects unsupported MIME type and emits upload:error", async () => {
    const manager = new MediaManager();
    const storage = mockStorage(manager);
    const errors = captureEvents(manager, MEDIA_EVENTS.UPLOAD_ERROR);

    const result = await manager.uploadFile(makeFile("x", "doc.pdf", "application/pdf"));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Unsupported file type/);
    expect(errors).toHaveLength(1);
    expect(storage.saveAsset).not.toHaveBeenCalled();
  });

  it("rejects an SVG over the 1MB SVG limit", async () => {
    const manager = new MediaManager();
    mockStorage(manager);

    const result = await manager.uploadFile(
      makeFile("<svg/>", "big.svg", "image/svg+xml", 2 * 1024 * 1024),
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/File too large\. Max: 1MB/);
  });

  it("rejects a video over the 100MB video limit (limit is per-type, not global)", async () => {
    const manager = new MediaManager();
    mockStorage(manager);

    const result = await manager.uploadFile(
      makeFile("v", "clip.mp4", "video/mp4", 101 * 1024 * 1024),
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/File too large\. Max: 100MB/);
  });

  it("accepts an image over 1MB but under the 10MB image limit", async () => {
    const manager = new MediaManager();
    mockStorage(manager);

    const result = await manager.uploadFile(
      makeFile("i", "big.png", "image/png", 2 * 1024 * 1024),
      { autoOptimize: false, generateThumbnail: false },
    );

    expect(result.success).toBe(true);
  });

  it.todo(
    "AUDIT: quota pre-check is not implemented — MediaQuotaError, MEDIA_EVENTS.QUOTA_EXCEEDED " +
      "and STORAGE_QUOTA_BYTES all exist (MediaStorageTypes.ts / constants/media.ts) and the UI " +
      "handles the error by name (useMediaState.ts), but nothing in uploadFile or MediaStorage " +
      "ever throws MediaQuotaError or emits media:quota:exceeded. Uploads past 1GB are never blocked.",
  );
});

describe("uploadFile — SVG sanitize path", () => {
  it("sanitizes a malicious SVG and stores the clean blob", async () => {
    const manager = new MediaManager();
    const storage = mockStorage(manager);
    const added = captureEvents(manager, MEDIA_EVENTS.MEDIA_ADDED);
    const completed = captureEvents(manager, MEDIA_EVENTS.UPLOAD_COMPLETE);

    const malicious =
      `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">` +
      `<script>steal()</script><circle cx="4" cy="4" r="4"/></svg>`;
    const result = await manager.uploadFile(makeFile(malicious, "icon.svg", "image/svg+xml"), {
      autoOptimize: false,
      generateThumbnail: false,
    });

    expect(result.success).toBe(true);
    expect(result.asset?.mimeType).toBe("image/svg+xml");
    expect(result.asset?.type).toBe("svg");

    const savedBlob = storage.saveAsset.mock.calls[0][1] as Blob;
    const savedText = await savedBlob.text();
    expect(savedText).toMatch(/<circle/);
    expect(savedText).not.toMatch(/<script/i);
    expect(savedText).not.toMatch(/onload=/i);

    expect(added).toHaveLength(1);
    expect(completed).toHaveLength(1);
  });

  it("rejects an SVG whose sanitized output has a non-<svg> root", async () => {
    const manager = new MediaManager();
    const storage = mockStorage(manager);
    const errors = captureEvents(manager, MEDIA_EVENTS.UPLOAD_ERROR);

    const fragment = `<g><rect width="4" height="4"/></g>`;
    const result = await manager.uploadFile(makeFile(fragment, "frag.svg", "image/svg+xml"), {
      autoOptimize: false,
      generateThumbnail: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/SVG rejected/);
    expect(errors).toHaveLength(1);
    expect(storage.saveAsset).not.toHaveBeenCalled();
  });

  it("routes a spoofed SVG (declared image/png, SVG magic bytes) through the sanitizer", async () => {
    const manager = new MediaManager();
    mockStorage(manager);

    const spoofed =
      `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script>` +
      `<rect width="2" height="2"/></svg>`;
    const result = await manager.uploadFile(makeFile(spoofed, "fake.png", "image/png"), {
      autoOptimize: false,
      generateThumbnail: false,
    });

    // Sniffed content wins over the spoofed extension type.
    expect(result.success).toBe(true);
    expect(result.asset?.mimeType).toBe("image/svg+xml");
    expect(result.asset?.type).toBe("svg");
  });
});

describe("uploadFile — non-image branch", () => {
  it("stores a small video without dimensions or thumbnail", async () => {
    const manager = new MediaManager();
    mockStorage(manager);

    const result = await manager.uploadFile(makeFile("vid", "clip.mp4", "video/mp4"));

    expect(result.success).toBe(true);
    expect(result.asset?.type).toBe("video");
    expect(result.asset?.width).toBeUndefined();
    expect(result.asset?.thumbnailSrc).toBeUndefined();
  });
});

describe("uploadFile — server mirror (Phase B2)", () => {
  it("re-keys the asset to the server CUID on mirror success and emits media:updated", async () => {
    const remote = makeRemoteSync();
    const manager = new MediaManager(remote);
    mockStorage(manager);
    const updated = captureEvents(manager, MEDIA_EVENTS.MEDIA_UPDATED);

    const result = await manager.uploadFile(makeFile("img", "a.png", "image/png"), {
      autoOptimize: false,
      generateThumbnail: false,
    });

    expect(result.success).toBe(true);
    expect(result.asset?.id).toBe("srv-1");
    expect(result.asset?.serverId).toBe("srv-1");
    expect(result.asset?.src).toBe("https://cdn/x.png");
    expect(result.asset?.localOnly).toBe(false);
    expect((manager as any).state.assets[0].id).toBe("srv-1");
    expect(updated.length).toBeGreaterThanOrEqual(1);
  });

  it("marks the asset localOnly and queues a retry when the mirror fails", async () => {
    const remote = makeRemoteSync({ uploadAndCreate: vi.fn(async () => null) });
    const manager = new MediaManager(remote);
    mockStorage(manager);

    const result = await manager.uploadFile(makeFile("img", "a.png", "image/png"), {
      autoOptimize: false,
      generateThumbnail: false,
    });

    expect(result.success).toBe(true);
    const asset = (manager as any).state.assets[0] as MediaAsset;
    expect(asset.localOnly).toBe(true);
    expect((manager as any).retryQueue.has(asset.id)).toBe(true);
  });

  it("keeps audio local without queuing a retry (no server schema for audio)", async () => {
    const remote = makeRemoteSync();
    const manager = new MediaManager(remote);
    mockStorage(manager);

    const result = await manager.uploadFile(makeFile("aud", "song.mp3", "audio/mpeg"));

    expect(result.success).toBe(true);
    expect(remote.uploadAndCreate).not.toHaveBeenCalled();
    expect((manager as any).retryQueue.size).toBe(0);
  });
});

describe("uploadFile — P1C tombstone (delete during in-flight upload)", () => {
  it("deletes the just-created server row when the asset was deleted mid-upload", async () => {
    let resolveUpload!: (v: { serverId: string; url: string } | null) => void;
    const remote = makeRemoteSync({
      uploadAndCreate: vi.fn(
        () => new Promise<{ serverId: string; url: string } | null>((res) => (resolveUpload = res)),
      ),
    });
    const manager = new MediaManager(remote);
    mockStorage(manager);
    const added = captureEvents(manager, MEDIA_EVENTS.MEDIA_ADDED);

    const uploadPromise = manager.uploadFile(makeFile("img", "a.png", "image/png"), {
      autoOptimize: false,
      generateThumbnail: false,
    });
    await vi.waitFor(() => expect(remote.uploadAndCreate).toHaveBeenCalled());

    const localId = (manager as any).state.assets[0].id as string;
    await manager.deleteAsset(localId);
    expect((manager as any).state.assets).toHaveLength(0);

    resolveUpload({ serverId: "srv-9", url: "https://cdn/late.png" });
    const result = await uploadPromise;

    expect(result.success).toBe(true);
    expect(remote.deleteRemote).toHaveBeenCalledWith("srv-9");
    // Asset must NOT be resurrected, and no media:added fires for it.
    expect((manager as any).state.assets).toHaveLength(0);
    expect(added).toHaveLength(0);
  });

  it("queues the server row for pending delete when deleteRemote fails after tombstone", async () => {
    let resolveUpload!: (v: { serverId: string; url: string } | null) => void;
    const remote = makeRemoteSync({
      uploadAndCreate: vi.fn(
        () => new Promise<{ serverId: string; url: string } | null>((res) => (resolveUpload = res)),
      ),
      deleteRemote: vi.fn(async () => false),
    });
    const manager = new MediaManager(remote);
    mockStorage(manager);

    const uploadPromise = manager.uploadFile(makeFile("img", "a.png", "image/png"), {
      autoOptimize: false,
      generateThumbnail: false,
    });
    await vi.waitFor(() => expect(remote.uploadAndCreate).toHaveBeenCalled());
    await manager.deleteAsset((manager as any).state.assets[0].id as string);

    resolveUpload({ serverId: "srv-9", url: "https://cdn/late.png" });
    await uploadPromise;

    expect((manager as any).pendingRemoteDeletes.has("srv-9")).toBe(true);
  });

  it("does not resurrect a deleted asset as localOnly when the in-flight upload fails", async () => {
    let resolveUpload!: (v: { serverId: string; url: string } | null) => void;
    const remote = makeRemoteSync({
      uploadAndCreate: vi.fn(
        () => new Promise<{ serverId: string; url: string } | null>((res) => (resolveUpload = res)),
      ),
    });
    const manager = new MediaManager(remote);
    mockStorage(manager);

    const uploadPromise = manager.uploadFile(makeFile("img", "a.png", "image/png"), {
      autoOptimize: false,
      generateThumbnail: false,
    });
    await vi.waitFor(() => expect(remote.uploadAndCreate).toHaveBeenCalled());
    await manager.deleteAsset((manager as any).state.assets[0].id as string);

    resolveUpload(null); // mirror failed
    const result = await uploadPromise;

    expect(result.success).toBe(true);
    expect((manager as any).state.assets).toHaveLength(0);
    expect((manager as any).retryQueue.size).toBe(0);
  });
});

describe("retry queue rebuild (Phase B5 P2 durability)", () => {
  it("rebuildRetryQueueFromState seeds retryQueue from persisted localOnly markers", () => {
    const manager = new MediaManager(makeRemoteSync());
    mockStorage(manager);
    seedAsset(manager, { id: "a-local", localOnly: true });
    seedAsset(manager, { id: "a-synced", localOnly: false, serverId: "srv-a" });
    seedAsset(manager, { id: "a-plain" });

    manager.rebuildRetryQueueFromState();

    expect((manager as any).retryQueue.has("a-local")).toBe(true);
    expect((manager as any).retryQueue.has("a-synced")).toBe(false);
    expect((manager as any).retryQueue.has("a-plain")).toBe(false);
    // Idempotent — running twice does not duplicate (Set semantics).
    manager.rebuildRetryQueueFromState();
    expect((manager as any).retryQueue.size).toBe(1);
  });

  it("rebuildFolderRetryQueueFromState seeds folderRetryQueue from localOnly folders", () => {
    const manager = new MediaManager(makeRemoteSync());
    mockStorage(manager);
    (manager as any).state.folders.push(
      {
        id: "f-local",
        name: "Drafts",
        parentId: null,
        localOnly: true,
        createdAt: "",
        updatedAt: "",
      },
      { id: "f-ok", name: "Synced", parentId: null, createdAt: "", updatedAt: "" },
    );

    manager.rebuildFolderRetryQueueFromState();

    const queue = (manager as any).folderRetryQueue as Map<
      string,
      { name: string; parentId: string | null }
    >;
    expect(queue.get("f-local")).toEqual({ name: "Drafts", parentId: null });
    expect(queue.has("f-ok")).toBe(false);
  });

  it("retryLocalOnlyAssets drains the queue: uploads blobs and re-keys to server CUIDs", async () => {
    const remote = makeRemoteSync({
      uploadAndCreate: vi.fn(async () => ({ serverId: "srv-r1", url: "https://cdn/r1.png" })),
    });
    const manager = new MediaManager(remote);
    const storage = mockStorage(manager);
    seedAsset(manager, {
      id: "a-local",
      localOnly: true,
      originalName: "r1.png",
      mimeType: "image/png",
    });
    manager.rebuildRetryQueueFromState();

    await manager.retryLocalOnlyAssets();

    expect(remote.uploadAndCreate).toHaveBeenCalledWith(expect.any(Blob), {
      filename: "r1.png",
      mimeType: "image/png",
      bytes: 3,
      type: "image",
      folderId: null,
    });
    expect((manager as any).retryQueue.size).toBe(0);
    expect((manager as any).state.assets[0].id).toBe("srv-r1");
    expect((manager as any).state.assets[0].localOnly).toBe(false);
    expect(storage.deleteAsset).toHaveBeenCalledWith("a-local");
  });

  it("drops queue entries whose server type is unsupported (audio) or whose blob is gone", async () => {
    const remote = makeRemoteSync();
    const manager = new MediaManager(remote);
    const storage = mockStorage(manager);
    storage.getBlob = vi.fn(async () => null); // local blob lost
    seedAsset(manager, { id: "a-audio", type: "audio", localOnly: true });
    seedAsset(manager, { id: "a-noblob", type: "image", localOnly: true });
    manager.rebuildRetryQueueFromState();

    await manager.retryLocalOnlyAssets();

    expect(remote.uploadAndCreate).not.toHaveBeenCalled();
    expect((manager as any).retryQueue.size).toBe(0);
  });

  it("keeps failed entries queued for the next pass", async () => {
    const remote = makeRemoteSync({ uploadAndCreate: vi.fn(async () => null) });
    const manager = new MediaManager(remote);
    mockStorage(manager);
    seedAsset(manager, { id: "a-local", localOnly: true });
    manager.rebuildRetryQueueFromState();

    await manager.retryLocalOnlyAssets();

    expect((manager as any).retryQueue.has("a-local")).toBe(true);
  });

  it("drains pendingRemoteDeletes alongside the asset queue", async () => {
    const remote = makeRemoteSync();
    const manager = new MediaManager(remote);
    mockStorage(manager);
    (manager as any).pendingRemoteDeletes.add("srv-dead");

    await manager.retryLocalOnlyAssets();

    expect(remote.deleteRemote).toHaveBeenCalledWith("srv-dead");
    expect((manager as any).pendingRemoteDeletes.size).toBe(0);
  });
});
