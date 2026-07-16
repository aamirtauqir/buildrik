/**
 * MediaStorage — store/retrieve/delete/list coverage.
 *
 * jsdom ships no indexedDB and fake-indexeddb is not a dependency, so —
 * following the existing media-test pattern of mocking at the layer
 * boundary (MediaManager tests mock MediaOptimizer / storage methods) —
 * the low-level IndexedDBAdapter is replaced with an in-memory fake that
 * honors the adapter contract (open / runTransaction / runGetRequest /
 * runGetAllRequest / close, keyPath id vs assetId). What's under test is
 * MediaStorage's own logic: stored-record shaping, blob co-writes,
 * null-on-miss, and MediaStorageError wrapping per operation.
 *
 * @license BSD-3-Clause
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MediaAsset, MediaFolder } from "../../../shared/types/media";

const { instances } = vi.hoisted(() => ({
  instances: [] as Array<{
    stores: Record<string, Map<string, Record<string, unknown>>>;
    openCalls: number;
    closeCalls: number;
    failOpen: Error | null;
    failTransaction: unknown;
    failGet: unknown;
    failGetAll: unknown;
    lastTransaction: { storeNames: string[]; mode: string } | null;
  }>,
}));

vi.mock("../IndexedDBAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../IndexedDBAdapter")>();

  // keyPath mirrors the real store config: blobs are keyed by assetId.
  const keyOf = (storeName: string, value: Record<string, unknown>) =>
    storeName === "blobs" ? (value.assetId as string) : (value.id as string);

  class FakeIndexedDBAdapter {
    stores: Record<string, Map<string, Record<string, unknown>>> = {
      assets: new Map(),
      folders: new Map(),
      blobs: new Map(),
    };
    openCalls = 0;
    closeCalls = 0;
    failOpen: Error | null = null;
    failTransaction: unknown = null;
    failGet: unknown = null;
    failGetAll: unknown = null;
    lastTransaction: { storeNames: string[]; mode: string } | null = null;

    constructor() {
      instances.push(this);
    }

    async open() {
      this.openCalls += 1;
      if (this.failOpen) throw this.failOpen;
      return {};
    }

    async runTransaction(
      storeNames: string[],
      mode: string,
      callback: (tx: { objectStore: (name: string) => unknown }) => void,
    ) {
      if (this.failTransaction) throw this.failTransaction;
      this.lastTransaction = { storeNames, mode };
      const tx = {
        objectStore: (name: string) => {
          if (!storeNames.includes(name)) {
            throw new Error(`store ${name} not in transaction scope`);
          }
          const store = this.stores[name];
          return {
            put: (value: Record<string, unknown>) => store.set(keyOf(name, value), value),
            delete: (key: string) => store.delete(key),
            clear: () => store.clear(),
          };
        },
      };
      callback(tx);
    }

    async runGetRequest(storeName: string, key: string) {
      if (this.failGet) throw this.failGet;
      return this.stores[storeName].get(key);
    }

    async runGetAllRequest(storeName: string) {
      if (this.failGetAll) throw this.failGetAll;
      return [...this.stores[storeName].values()];
    }

    close() {
      this.closeCalls += 1;
    }
  }

  return { ...actual, IndexedDBAdapter: FakeIndexedDBAdapter };
});

// Import AFTER the mock so MediaStorage binds the fake adapter.
import { MediaStorage, MediaStorageError } from "../MediaStorage";

function makeAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: "asset-1",
    type: "image",
    name: "Pic",
    originalName: "pic.png",
    src: "blob:abc",
    mimeType: "image/png",
    size: 123,
    tags: ["hero"],
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
    ...overrides,
  } as MediaAsset;
}

function makeFolder(overrides: Partial<MediaFolder> = {}): MediaFolder {
  return {
    id: "folder-1",
    name: "Shots",
    parentId: null,
    ...overrides,
  } as MediaFolder;
}

function setup() {
  const storage = new MediaStorage();
  const adapter = instances[instances.length - 1];
  return { storage, adapter };
}

beforeEach(() => {
  instances.length = 0;
});

describe("MediaStorage.init", () => {
  it("opens the underlying adapter", async () => {
    const { storage, adapter } = setup();
    await storage.init();
    expect(adapter.openCalls).toBe(1);
  });

  it("wraps open failures in MediaStorageError(operation='init') with the cause", async () => {
    const { storage, adapter } = setup();
    adapter.failOpen = new Error("blocked by browser");

    const err = await storage.init().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe("init");
    expect((err as MediaStorageError).message).toBe("Failed to initialize media storage");
    expect((err as MediaStorageError).cause?.message).toBe("blocked by browser");
  });
});

describe("asset operations", () => {
  it("saveAsset without a blob writes only the assets store", async () => {
    const { storage, adapter } = setup();
    const asset = makeAsset({ folderId: "f-9", tags: ["a", "b"] });

    await storage.saveAsset(asset);

    expect(adapter.lastTransaction).toEqual({ storeNames: ["assets"], mode: "readwrite" });
    const stored = adapter.stores.assets.get("asset-1")!;
    expect(stored).toEqual({
      id: "asset-1",
      type: "image",
      folderId: "f-9",
      createdAt: asset.createdAt,
      tags: ["a", "b"],
      data: asset,
    });
    expect(adapter.stores.blobs.size).toBe(0);
  });

  it("saveAsset defaults folderId to null and tags to [] when absent", async () => {
    const { storage, adapter } = setup();
    const asset = makeAsset({
      folderId: undefined,
      tags: undefined as unknown as string[],
    });

    await storage.saveAsset(asset);

    const stored = adapter.stores.assets.get("asset-1")!;
    expect(stored.folderId).toBeNull();
    expect(stored.tags).toEqual([]);
  });

  it("saveAsset with a blob co-writes the blobs store in one transaction", async () => {
    const { storage, adapter } = setup();
    const blob = new Blob(["binary"]);

    await storage.saveAsset(makeAsset(), blob);

    expect(adapter.lastTransaction).toEqual({
      storeNames: ["assets", "blobs"],
      mode: "readwrite",
    });
    expect(adapter.stores.blobs.get("asset-1")).toEqual({ assetId: "asset-1", blob });
  });

  it("saveAsset wraps transaction failures with the asset id in the message", async () => {
    const { storage, adapter } = setup();
    adapter.failTransaction = new Error("quota exceeded");

    const err = await storage.saveAsset(makeAsset()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe("saveAsset");
    expect((err as MediaStorageError).message).toBe("Failed to save asset: asset-1");
    expect((err as MediaStorageError).cause?.message).toBe("quota exceeded");
  });

  it("non-Error rejections produce a MediaStorageError with cause undefined", async () => {
    const { storage, adapter } = setup();
    adapter.failTransaction = "string failure"; // not an Error instance

    const err = await storage.saveAsset(makeAsset()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).cause).toBeUndefined();
  });

  it("getAsset round-trips the saved MediaAsset payload", async () => {
    const { storage } = setup();
    const asset = makeAsset({ id: "round-trip", name: "RT" });
    await storage.saveAsset(asset);

    await expect(storage.getAsset("round-trip")).resolves.toEqual(asset);
  });

  it("getAsset returns null on a miss", async () => {
    const { storage } = setup();
    await expect(storage.getAsset("nope")).resolves.toBeNull();
  });

  it("getAsset wraps adapter failures (operation='getAsset')", async () => {
    const { storage, adapter } = setup();
    adapter.failGet = new Error("read failed");

    const err = await storage.getAsset("x").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe("getAsset");
    expect((err as MediaStorageError).message).toBe("Failed to get asset: x");
  });

  it("getAllAssets returns every stored asset's data payload", async () => {
    const { storage } = setup();
    const a1 = makeAsset({ id: "a1" });
    const a2 = makeAsset({ id: "a2", type: "video" });
    await storage.saveAsset(a1);
    await storage.saveAsset(a2);

    await expect(storage.getAllAssets()).resolves.toEqual([a1, a2]);
  });

  it("getAllAssets returns [] when the store is empty", async () => {
    const { storage } = setup();
    await expect(storage.getAllAssets()).resolves.toEqual([]);
  });

  it("getAllAssets wraps adapter failures (operation='getAllAssets')", async () => {
    const { storage, adapter } = setup();
    adapter.failGetAll = new Error("cursor died");

    const err = await storage.getAllAssets().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe("getAllAssets");
  });

  it("deleteAsset removes both the asset record and its blob", async () => {
    const { storage, adapter } = setup();
    await storage.saveAsset(makeAsset(), new Blob(["x"]));
    expect(adapter.stores.assets.size).toBe(1);
    expect(adapter.stores.blobs.size).toBe(1);

    await storage.deleteAsset("asset-1");

    expect(adapter.stores.assets.size).toBe(0);
    expect(adapter.stores.blobs.size).toBe(0);
    expect(adapter.lastTransaction).toEqual({
      storeNames: ["assets", "blobs"],
      mode: "readwrite",
    });
  });

  it("deleteAsset of a nonexistent id is a no-op (no throw)", async () => {
    const { storage } = setup();
    await expect(storage.deleteAsset("ghost")).resolves.toBeUndefined();
  });

  it("deleteAsset wraps adapter failures (operation='deleteAsset')", async () => {
    const { storage, adapter } = setup();
    adapter.failTransaction = new Error("tx aborted");

    const err = await storage.deleteAsset("asset-1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe("deleteAsset");
    expect((err as MediaStorageError).message).toBe("Failed to delete asset: asset-1");
  });
});

describe("blob operations", () => {
  it("getBlob returns the stored blob for an asset", async () => {
    const { storage } = setup();
    const blob = new Blob(["payload"]);
    await storage.saveAsset(makeAsset(), blob);

    await expect(storage.getBlob("asset-1")).resolves.toBe(blob);
  });

  it("getBlob returns null when no blob was stored", async () => {
    const { storage } = setup();
    await storage.saveAsset(makeAsset()); // metadata only
    await expect(storage.getBlob("asset-1")).resolves.toBeNull();
  });

  it("getBlob wraps adapter failures (operation='getBlob')", async () => {
    const { storage, adapter } = setup();
    adapter.failGet = new Error("blob read failed");

    const err = await storage.getBlob("asset-1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe("getBlob");
  });
});

describe("folder operations", () => {
  it("saveFolder stores id/parentId/data and getAllFolders returns the payloads", async () => {
    const { storage, adapter } = setup();
    const root = makeFolder({ id: "f-root", parentId: null });
    const child = makeFolder({ id: "f-child", parentId: "f-root", name: "Nested" });

    await storage.saveFolder(root);
    await storage.saveFolder(child);

    expect(adapter.stores.folders.get("f-child")).toEqual({
      id: "f-child",
      parentId: "f-root",
      data: child,
    });
    await expect(storage.getAllFolders()).resolves.toEqual([root, child]);
  });

  it("saveFolder overwrites an existing folder (put semantics)", async () => {
    const { storage } = setup();
    await storage.saveFolder(makeFolder({ name: "Before" }));
    await storage.saveFolder(makeFolder({ name: "After" }));

    const folders = await storage.getAllFolders();
    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe("After");
  });

  it("saveFolder wraps adapter failures (operation='saveFolder')", async () => {
    const { storage, adapter } = setup();
    adapter.failTransaction = new Error("tx failed");

    const err = await storage.saveFolder(makeFolder()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe("saveFolder");
    expect((err as MediaStorageError).message).toBe("Failed to save folder: folder-1");
  });

  it("getAllFolders returns [] when empty and wraps failures (operation='getAllFolders')", async () => {
    const { storage, adapter } = setup();
    await expect(storage.getAllFolders()).resolves.toEqual([]);

    adapter.failGetAll = new Error("nope");
    const err = await storage.getAllFolders().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe("getAllFolders");
  });

  it("deleteFolder removes the record; wraps failures (operation='deleteFolder')", async () => {
    const { storage, adapter } = setup();
    await storage.saveFolder(makeFolder());
    await storage.deleteFolder("folder-1");
    expect(adapter.stores.folders.size).toBe(0);

    adapter.failTransaction = new Error("tx failed");
    const err = await storage.deleteFolder("folder-1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe("deleteFolder");
    expect((err as MediaStorageError).message).toBe("Failed to delete folder: folder-1");
  });
});

describe("non-Error causes across every operation", () => {
  // Each catch block has an `error instanceof Error ? error : undefined`
  // arm — verify the undefined arm for every operation.
  const cases: Array<{
    op: string;
    knob: "failOpen" | "failTransaction" | "failGet" | "failGetAll";
    run: (s: MediaStorage) => Promise<unknown>;
  }> = [
    { op: "init", knob: "failOpen", run: (s) => s.init() },
    { op: "saveAsset", knob: "failTransaction", run: (s) => s.saveAsset(makeAsset()) },
    { op: "getAsset", knob: "failGet", run: (s) => s.getAsset("x") },
    { op: "getAllAssets", knob: "failGetAll", run: (s) => s.getAllAssets() },
    { op: "deleteAsset", knob: "failTransaction", run: (s) => s.deleteAsset("x") },
    { op: "getBlob", knob: "failGet", run: (s) => s.getBlob("x") },
    { op: "saveFolder", knob: "failTransaction", run: (s) => s.saveFolder(makeFolder()) },
    { op: "getAllFolders", knob: "failGetAll", run: (s) => s.getAllFolders() },
    { op: "deleteFolder", knob: "failTransaction", run: (s) => s.deleteFolder("x") },
    { op: "clear", knob: "failTransaction", run: (s) => s.clear() },
  ];

  it.each(cases)("$op: non-Error rejection → cause undefined", async ({ op, knob, run }) => {
    const { storage, adapter } = setup();
    (adapter as unknown as Record<string, unknown>)[knob] = { notAnError: true };

    const err = await run(storage).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe(op);
    expect((err as MediaStorageError).cause).toBeUndefined();
  });
});

describe("clear / close", () => {
  it("clear empties all three stores in one transaction", async () => {
    const { storage, adapter } = setup();
    await storage.saveAsset(makeAsset(), new Blob(["x"]));
    await storage.saveFolder(makeFolder());

    await storage.clear();

    expect(adapter.stores.assets.size).toBe(0);
    expect(adapter.stores.folders.size).toBe(0);
    expect(adapter.stores.blobs.size).toBe(0);
    expect(adapter.lastTransaction).toEqual({
      storeNames: ["assets", "folders", "blobs"],
      mode: "readwrite",
    });
  });

  it("clear wraps adapter failures (operation='clear')", async () => {
    const { storage, adapter } = setup();
    adapter.failTransaction = new Error("tx failed");

    const err = await storage.clear().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MediaStorageError);
    expect((err as MediaStorageError).operation).toBe("clear");
    expect((err as MediaStorageError).message).toBe("Failed to clear storage");
  });

  it("close delegates to the adapter", () => {
    const { storage, adapter } = setup();
    storage.close();
    expect(adapter.closeCalls).toBe(1);
  });
});
