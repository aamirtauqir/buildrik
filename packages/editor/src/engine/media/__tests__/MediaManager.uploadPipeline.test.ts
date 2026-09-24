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
import { MediaQuotaError } from "../MediaStorageTypes";
import { MEDIA_EVENTS, STORAGE_QUOTA_BYTES } from "@/shared/constants/media";
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
    const errors = captureEvents(manager, MEDIA_EVENTS.UPLOAD_ERROR);

    const result = await manager.uploadFile(
      makeFile("<svg/>", "big.svg", "image/svg+xml", 2 * 1024 * 1024),
    );

    expect(result.success).toBe(false);
    // Clone 3584:45522 (re-draws board 145:148) names both numbers, so the assertion checks both.
    expect(result.error).toMatch(/Upload failed — file is 2 MB, the limit is 1 MB per file/);
    // The drawer's replacement flow reads the real numbers off the event, not the prose.
    expect(errors[0]).toMatchObject({ fileName: "big.svg", size: 2 * 1024 * 1024, limit: 1024 * 1024 });
  });

  it("rejects a video over the 100MB video limit (limit is per-type, not global)", async () => {
    const manager = new MediaManager();
    mockStorage(manager);

    const result = await manager.uploadFile(
      makeFile("v", "clip.mp4", "video/mp4", 101 * 1024 * 1024),
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Upload failed — file is 101 MB, the limit is 100 MB per file/);
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

  it("throws MediaQuotaError and emits media:quota:exceeded when the new file would exceed the 1GB cap", async () => {
    const manager = new MediaManager();
    const storage = mockStorage(manager);
    const quotaEvents = captureEvents(manager, MEDIA_EVENTS.QUOTA_EXCEEDED);
    // Fill the library to the 1GB cap so the next byte trips the gate.
    seedAsset(manager, { id: "big", size: STORAGE_QUOTA_BYTES });

    await expect(
      manager.uploadFile(makeFile("i", "one-more.png", "image/png", 4096), {
        autoOptimize: false,
        generateThumbnail: false,
      }),
    ).rejects.toBeInstanceOf(MediaQuotaError);

    expect(quotaEvents).toHaveLength(1);
    expect(quotaEvents[0]).toEqual({
      usedBytes: STORAGE_QUOTA_BYTES,
      quotaBytes: STORAGE_QUOTA_BYTES,
      attemptedBytes: 4096,
    });
    // Gate runs before any persistence — nothing written.
    expect(storage.saveAsset).not.toHaveBeenCalled();
  });

  it("allows an upload that exactly fills the remaining quota (boundary is inclusive)", async () => {
    const manager = new MediaManager();
    mockStorage(manager);
    // Leave exactly 4096 bytes of headroom.
    seedAsset(manager, { id: "big", size: STORAGE_QUOTA_BYTES - 4096 });

    const result = await manager.uploadFile(
      makeFile("i", "fits.png", "image/png", 4096),
      { autoOptimize: false, generateThumbnail: false },
    );

    expect(result.success).toBe(true);
  });
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

  /* Walk 2026-09-24: placements made from the session Object URL kept it and
     saved it. The server copy must replace it everywhere. */
  it("on mirror success, announces blob → server URL so placements are re-pointed", async () => {
    const manager = new MediaManager(makeRemoteSync());
    mockStorage(manager);
    const remaps = captureEvents(manager, MEDIA_EVENTS.LOCAL_URLS_REBUILT);
    await manager.uploadFile(makeFile("img", "a.png", "image/png"), { autoOptimize: false, generateThumbnail: false });
    const last = remaps.at(-1) as { remapped: Record<string, string> };
    const [[from, to]] = Object.entries(last.remapped);
    expect(from.startsWith("blob:")).toBe(true);
    expect(to).toBe("https://cdn/x.png");
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

/* Clone 3695:45529 (Asset versions, Phase 6): the editor's Save lands through
   this pipeline like any upload — a Blob upload always makes a row — so the
   row is BORN a version. Flagging it afterwards would let the grid draw the
   file as a library card for the whole upload (the row is in state and
   MEDIA_UPDATED fires before uploadFile resolves). The server row is created
   without its JSON column (`onUploadCompleted` may win the create race), so
   the column is mirrored explicitly once the row has a server id. */
describe("uploadFile — a version row is born flagged and its column mirrored (3695:45529)", () => {
  const EDITS = {
    width: 1200,
    height: 800,
    crop: "16:9",
    preset: "None",
    format: "WebP",
    transform: "Original",
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
  };

  it("carries versionOf and edits on the asset from the first persist, then mirrors { tags, versionOf, edits }", async () => {
    const remote = makeRemoteSync();
    const manager = new MediaManager(remote);
    const storage = mockStorage(manager);

    const result = await manager.uploadFile(makeFile("img", "hero-dark-v2.png", "image/png"), {
      autoOptimize: false,
      generateThumbnail: false,
      versionOf: "hero",
      edits: EDITS,
    });

    expect(result.success).toBe(true);
    expect(result.asset?.versionOf).toBe("hero");
    expect(result.asset?.edits).toEqual(EDITS);
    const firstPersisted = (storage.saveAsset as ReturnType<typeof vi.fn>).mock.calls[0][0] as MediaAsset;
    expect(firstPersisted.versionOf).toBe("hero");
    expect(remote.updateAsset).toHaveBeenCalledWith("srv-1", {
      userMetadata: { tags: [], versionOf: "hero", edits: EDITS },
    });
  });

  it("a plain upload mirrors nothing extra", async () => {
    const remote = makeRemoteSync();
    const manager = new MediaManager(remote);
    mockStorage(manager);

    await manager.uploadFile(makeFile("img", "a.png", "image/png"), { autoOptimize: false, generateThumbnail: false });

    expect(remote.updateAsset).not.toHaveBeenCalled();
  });

  it("a version that stays device-only keeps its flag locally and mirrors nothing", async () => {
    const remote = makeRemoteSync({ uploadAndCreate: vi.fn(async () => null) });
    const manager = new MediaManager(remote);
    mockStorage(manager);

    const result = await manager.uploadFile(makeFile("img", "hero-dark-v2.png", "image/png"), {
      autoOptimize: false,
      generateThumbnail: false,
      versionOf: "hero",
    });

    expect(result.asset?.versionOf).toBe("hero");
    expect(result.asset?.localOnly).toBe(true);
    expect(remote.updateAsset).not.toHaveBeenCalled();
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

  // A record persisted mid-upload — no serverId, src still a session blob:
  // URL — is a stranded upload, not a synced one. Ten of them sat under a
  // "0 not on the server" pill on 2026-09-13.
  it("treats a serverId-less blob: asset as local-only and queues it", () => {
    const manager = new MediaManager(makeRemoteSync());
    mockStorage(manager);
    seedAsset(manager, { id: "a-stranded", src: "blob:http://localhost:3000/551dd30e" });
    seedAsset(manager, { id: "a-stock", src: "https://images.pexels.com/x.jpg" });
    seedAsset(manager, { id: "a-audio", type: "audio", src: "blob:http://localhost:3000/aud" });

    manager.rebuildRetryQueueFromState();

    expect((manager as any).retryQueue.has("a-stranded")).toBe(true);
    expect((manager as any).state.assets.find((a: MediaAsset) => a.id === "a-stranded").localOnly).toBe(true);
    expect((manager as any).retryQueue.has("a-stock")).toBe(false);
    expect((manager as any).retryQueue.has("a-audio")).toBe(false);
  });

  // The queue survived reloads; nothing drained it until the network
  // flapped or a NEW upload succeeded. init() now drains it itself.
  it("init() drains a rebuilt retry queue while online", async () => {
    const remote = makeRemoteSync();
    const manager = new MediaManager(remote);
    const s = mockStorage(manager);
    s.getAllAssets = vi.fn(async () => [
      {
        id: "a-local",
        type: "image",
        name: "x",
        originalName: "x.png",
        src: "blob:http://localhost:3000/abc",
        mimeType: "image/png",
        size: 3,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        localOnly: true,
      },
    ]);

    await manager.init();
    await vi.waitFor(() => expect(remote.uploadAndCreate).toHaveBeenCalledTimes(1));
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

/* `download` on a cross-origin href is ignored and the tab navigates to the
   file — the editor was replaced by the raw asset the first day assets had a
   Blob-store src. Remote sources are fetched into a same-origin Object URL. */
describe("downloadAssets", () => {
  it("fetches a remote asset into an object URL before clicking the download link", async () => {
    const manager = new MediaManager(makeRemoteSync());
    mockStorage(manager);
    const blob = new Blob(["png"], { type: "image/png" });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, blob: async () => blob })));
    const createObjectURL = vi.fn(() => "blob:http://localhost/dl");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const clicked: { href: string; download: string; target: string }[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.href, download: this.download, target: this.target });
    });

    const started = manager.downloadAssets([{ src: "https://cdn/hero.jpg", name: "hero-dark.jpg" }]);
    expect(started).toBe(1);
    await vi.waitFor(() => expect(clicked).toHaveLength(1));
    expect(clicked[0].href).toBe("blob:http://localhost/dl");
    expect(clicked[0].download).toBe("hero-dark.jpg");
    expect(clicked[0].target).toBe("");
    click.mockRestore();
    vi.unstubAllGlobals();
  });

  it("opens the file in a new tab when the host refuses the fetch, never in this one", async () => {
    const manager = new MediaManager(makeRemoteSync());
    mockStorage(manager);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("CORS"); }));
    const clicked: { href: string; target: string }[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.href, target: this.target });
    });
    manager.downloadAssets([{ src: "https://cdn/hero.jpg", name: "hero-dark.jpg" }]);
    await vi.waitFor(() => expect(clicked).toHaveLength(1));
    expect(clicked[0].target).toBe("_blank");
    click.mockRestore();
    vi.unstubAllGlobals();
  });
});
