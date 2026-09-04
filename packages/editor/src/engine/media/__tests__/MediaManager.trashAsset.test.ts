/**
 * trashAsset removes the file from the library at once and keeps the
 * irreversible half — storage, object URL, server row — until commit.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { MediaManager } from "../MediaManager";
import { MEDIA_EVENTS } from "../../../shared/constants/media";
import type { MediaAsset } from "../../../shared/types/media";

vi.mock("../MediaOptimizer", () => ({ MediaOptimizer: class { optimize = vi.fn(); } }));

function seeded() {
  const deleteRemote = vi.fn(async () => true);
  const manager = new MediaManager({ deleteRemote } as never);
  const storageDelete = vi.fn(async () => {});
  (manager as unknown as { storage: { deleteAsset: unknown } }).storage.deleteAsset = storageDelete;
  const a = { id: "a1", name: "one.png", src: "blob:one", type: "image", serverId: "srv-1" } as unknown as MediaAsset;
  const b = { id: "b2", name: "two.png", src: "blob:two", type: "image" } as unknown as MediaAsset;
  (manager as unknown as { state: { assets: MediaAsset[] } }).state.assets = [a, b];
  const events: string[] = [];
  manager.on(MEDIA_EVENTS.MEDIA_DELETED, () => events.push("deleted"));
  manager.on(MEDIA_EVENTS.MEDIA_ADDED, () => events.push("added"));
  return { manager, storageDelete, deleteRemote, events };
}

describe("MediaManager.trashAsset", () => {
  it("leaves the library immediately but keeps storage and the server row until commit", async () => {
    const { manager, storageDelete, deleteRemote, events } = seeded();
    const t = await manager.trashAsset("a1");
    expect(manager.getAssets().map((x) => x.id)).toEqual(["b2"]);
    expect(events).toEqual(["deleted"]);
    expect(storageDelete).not.toHaveBeenCalled();
    expect(deleteRemote).not.toHaveBeenCalled();

    await t!.commit();
    expect(storageDelete).toHaveBeenCalledWith("a1");
    expect(deleteRemote).toHaveBeenCalledWith("srv-1");
  });

  it("restore puts it back where it was, and a later commit is a no-op", async () => {
    const { manager, storageDelete, events } = seeded();
    const t = await manager.trashAsset("a1");
    t!.restore();
    expect(manager.getAssets().map((x) => x.id)).toEqual(["a1", "b2"]);
    expect(events).toEqual(["deleted", "added"]);
    await t!.commit();
    expect(storageDelete).not.toHaveBeenCalled();
  });

  it("returns null for an asset that is not there", async () => {
    const { manager } = seeded();
    expect(await manager.trashAsset("nope")).toBeNull();
  });

  it("takes the hard path at once for a file still uploading — no undo it cannot honour", async () => {
    const { manager, storageDelete } = seeded();
    (manager as unknown as { inFlightUploads: Set<string> }).inFlightUploads.add("a1");
    expect(await manager.trashAsset("a1")).toBeNull();
    expect(storageDelete).toHaveBeenCalledWith("a1");
    expect(manager.getAssets().map((x) => x.id)).toEqual(["b2"]);
  });
});
