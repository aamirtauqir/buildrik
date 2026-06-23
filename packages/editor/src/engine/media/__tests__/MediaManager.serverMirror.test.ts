/**
 * S-tier wire (2026-06-24): MediaManager now mirrors asset name/alt-text edits
 * and folder renames to the server via RemoteAssetSync (previously local-only).
 * These tests pin the new mirror behavior + its guards.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("../MediaOptimizer", () => ({
  MediaOptimizer: class {
    async checkFormatSupport() {
      return { webp: true, avif: true, jpeg: true, png: true };
    }
  },
  formatBytes: () => "0 B",
  getCompressionSavings: () => 0,
}));

import { MediaManager } from "../MediaManager";
import type { RemoteAssetSync, MediaAsset } from "@/shared/types/media";

function makeRemoteSync(): RemoteAssetSync {
  return {
    uploadAndCreate: vi.fn(async () => ({ serverId: "srv", url: "https://x/y" })),
    deleteRemote: vi.fn(async () => true),
    createFolder: vi.fn(async () => ({ serverId: "srv-f" })),
    deleteFolder: vi.fn(async () => true),
    moveAsset: vi.fn(async () => true),
    updateAsset: vi.fn(async () => true),
    renameFolder: vi.fn(async () => true),
  };
}

function makeManager(remoteSync?: RemoteAssetSync) {
  const manager = new MediaManager(remoteSync);
  (manager as any).storage.saveAsset = vi.fn(async () => {});
  (manager as any).storage.saveFolder = vi.fn(async () => {});
  return manager;
}

function seedAsset(manager: MediaManager, partial: Partial<MediaAsset> & { id: string }) {
  const asset: MediaAsset = {
    id: partial.id,
    type: "image",
    name: partial.name ?? "old.png",
    altText: partial.altText,
    originalName: "old.png",
    src: "https://x/old.png",
    mimeType: "image/png",
    size: 10,
    tags: [],
    folderId: partial.folderId,
    serverId: partial.serverId,
    localOnly: partial.localOnly,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  (manager as any).state.assets.push(asset);
  return asset;
}

function seedFolder(manager: MediaManager, id: string, name: string, localOnly?: boolean) {
  (manager as any).state.folders.push({
    id,
    name,
    parentId: null,
    localOnly,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

describe("MediaManager server mirror — asset metadata (#8/#15)", () => {
  it("mirrors an alt-text edit to remoteSync.updateAsset for a synced asset", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "a1", serverId: "srv-a1", name: "hero.png" });

    await manager.updateAsset("a1", { altText: "A red bicycle" });

    expect(remote.updateAsset).toHaveBeenCalledTimes(1);
    expect(remote.updateAsset).toHaveBeenCalledWith("srv-a1", {
      filename: "hero.png",
      altText: "A red bicycle",
    });
  });

  it("mirrors a name edit (name → server filename)", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "a1", serverId: "srv-a1", name: "old.png" });

    await manager.updateAsset("a1", { name: "renamed.png" });

    expect(remote.updateAsset).toHaveBeenCalledWith("srv-a1", {
      filename: "renamed.png",
      altText: null,
    });
  });

  it("does NOT mirror when the asset has no serverId (local-only)", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "a1", name: "old.png" }); // no serverId

    await manager.updateAsset("a1", { altText: "x" });

    expect(remote.updateAsset).not.toHaveBeenCalled();
  });

  it("does NOT call updateAsset for a folderId-only change (moveAsset owns that)", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "a1", serverId: "srv-a1", folderId: "f1" });

    await manager.updateAsset("a1", { folderId: "f2" });

    expect(remote.updateAsset).not.toHaveBeenCalled();
    expect(remote.moveAsset).toHaveBeenCalledWith("srv-a1", "f2");
  });
});

describe("MediaManager server mirror — folder rename (#9/#16)", () => {
  it("mirrors a rename to remoteSync.renameFolder for a synced folder", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedFolder(manager, "f1", "Old");

    await manager.renameFolder("f1", "New");

    expect(remote.renameFolder).toHaveBeenCalledTimes(1);
    expect(remote.renameFolder).toHaveBeenCalledWith("f1", "New");
  });

  it("does NOT mirror rename for a localOnly folder (no server row yet)", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedFolder(manager, "f1", "Old", true);

    await manager.renameFolder("f1", "New");

    expect(remote.renameFolder).not.toHaveBeenCalled();
  });
});
