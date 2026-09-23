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
    type: partial.type ?? "image",
    name: partial.name ?? "old.png",
    altText: partial.altText,
    originalName: partial.originalName ?? "old.png",
    src: "https://x/old.png",
    mimeType: partial.mimeType ?? "image/png",
    size: 10,
    tags: partial.tags ?? [],
    siteFont: partial.siteFont,
    versionOf: partial.versionOf,
    edits: partial.edits,
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

/* BLOCKERS C3 (Assets · Clone Phase 3, P3-T): tags persist locally like every
   other field and mirror to the server row's `userMetadata.tags` — the
   column exists and `media.updateAsset` already takes it, so no server
   change. The same key is read back when server rows are imported, which
   is what makes a tag survive a fresh browser. */
describe("MediaManager server mirror — tags ↔ userMetadata.tags (C3)", () => {
  it("mirrors a tags edit as userMetadata: { tags } for a synced asset, and nothing else", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "a1", serverId: "srv-a1", name: "team-photo.jpg" });

    const updated = await manager.updateAsset("a1", { tags: ["team", "staff"] });

    expect(updated?.tags).toEqual(["team", "staff"]);
    expect(remote.updateAsset).toHaveBeenCalledTimes(1);
    expect(remote.updateAsset).toHaveBeenCalledWith("srv-a1", { userMetadata: { tags: ["team", "staff"] } });
  });

  it("an unchanged tag list does not round-trip to the server", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "a1", serverId: "srv-a1" });
    (manager as any).state.assets[0].tags = ["team"];

    await manager.updateAsset("a1", { tags: ["team"] });

    expect(remote.updateAsset).not.toHaveBeenCalled();
  });

  it("does NOT mirror tags for a local-only asset", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "a1" });

    await manager.updateAsset("a1", { tags: ["team"] });

    expect(remote.updateAsset).not.toHaveBeenCalled();
    expect(manager.getAsset("a1")?.tags).toEqual(["team"]);
  });

  it("a name edit that also carries tags sends filename, altText AND userMetadata in one patch", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "a1", serverId: "srv-a1", name: "old.png" });

    await manager.updateAsset("a1", { name: "new.png", tags: ["menu"] });

    expect(remote.updateAsset).toHaveBeenCalledWith("srv-a1", {
      filename: "new.png",
      altText: null,
      userMetadata: { tags: ["menu"] },
    });
  });

  const row = (id: string, userMetadata?: unknown) => ({
    id,
    url: `https://cdn/${id}.jpg`,
    bytes: 10,
    type: "image" as const,
    mimeType: "image/jpeg",
    filename: `${id}.jpg`,
    altText: null,
    folderId: null,
    createdAt: "2026-09-13T00:00:00.000Z",
    updatedAt: "2026-09-13T00:00:00.000Z",
    ...(userMetadata !== undefined ? { userMetadata } : {}),
  });

  it("importServerAssets reads userMetadata.tags back onto the asset (strings only)", async () => {
    const manager = makeManager(makeRemoteSync());

    await manager.importServerAssets(
      [
        row("team", { tags: ["team", "staff"] }),
        row("mixed", { tags: ["food", 7, null] }),
        row("bare"),
        row("nulled", null),
        row("wrong", { tags: "menu" }),
      ],
      [],
    );

    const tags = (id: string) => manager.getAsset(id)?.tags;
    expect(tags("team")).toEqual(["team", "staff"]);
    expect(tags("mixed")).toEqual(["food"]);
    expect(tags("bare")).toEqual([]);
    expect(tags("nulled")).toEqual([]);
    expect(tags("wrong")).toEqual([]);
  });
});

/* Clone 3686:42317 (Assets · Site fonts, Phase 5): `Add font` turns an
   UPLOADED font file into an ADDED site font. The flag rides the same JSON
   column as the tags — `userMetadata.siteFont` — and the server REPLACES that
   column with whatever is sent, so a patch that carries one of the two must
   carry the other or it erases it. */
describe("MediaManager server mirror — siteFont ↔ userMetadata.siteFont (3686:42317)", () => {
  const font = (over: Partial<MediaAsset> = {}) => ({
    id: "f1",
    type: "font" as const,
    name: "Inter-Var",
    originalName: "Inter-Var.woff2",
    mimeType: "font/woff2",
    serverId: "srv-f1",
    ...over,
  });

  it("Add font mirrors { tags, siteFont: true } — the current tags ride along, since the server replaces the column", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, font({ tags: ["brand"] }));

    const updated = await manager.updateAsset("f1", { siteFont: true });

    expect(updated?.siteFont).toBe(true);
    expect(remote.updateAsset).toHaveBeenCalledTimes(1);
    expect(remote.updateAsset).toHaveBeenCalledWith("srv-f1", { userMetadata: { tags: ["brand"], siteFont: true } });
  });

  it("a tags edit on an ADDED font keeps siteFont in the patch", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, font({ siteFont: true }));

    await manager.updateAsset("f1", { tags: ["heading"] });

    expect(remote.updateAsset).toHaveBeenCalledWith("srv-f1", { userMetadata: { tags: ["heading"], siteFont: true } });
  });

  it("Remove mirrors siteFont: false with the tags intact", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, font({ siteFont: true, tags: ["brand"] }));

    const updated = await manager.updateAsset("f1", { siteFont: false });

    expect(updated?.siteFont).toBe(false);
    expect(remote.updateAsset).toHaveBeenCalledWith("srv-f1", { userMetadata: { tags: ["brand"], siteFont: false } });
  });

  it("an unchanged flag does not round-trip to the server", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, font({ siteFont: true }));

    await manager.updateAsset("f1", { siteFont: true });

    expect(remote.updateAsset).not.toHaveBeenCalled();
  });

  it("a device-only font is added locally and mirrors nothing until it syncs", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, font({ serverId: undefined }));

    await manager.updateAsset("f1", { siteFont: true });

    expect(remote.updateAsset).not.toHaveBeenCalled();
    expect(manager.getAsset("f1")?.siteFont).toBe(true);
  });

  it("a tags edit on an image sends { tags } alone — no flag was ever set, so there is nothing to preserve", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "a1", serverId: "srv-a1" });

    await manager.updateAsset("a1", { tags: ["menu"] });

    expect(remote.updateAsset).toHaveBeenCalledWith("srv-a1", { userMetadata: { tags: ["menu"] } });
  });

  const fontRow = (id: string, userMetadata?: unknown) => ({
    id,
    url: `https://cdn/${id}.woff2`,
    bytes: 10,
    type: "font" as const,
    mimeType: "font/woff2",
    filename: `${id}.woff2`,
    altText: null,
    folderId: null,
    createdAt: "2026-09-13T00:00:00.000Z",
    updatedAt: "2026-09-13T00:00:00.000Z",
    ...(userMetadata !== undefined ? { userMetadata } : {}),
  });

  it("importServerAssets reads userMetadata.siteFont back — literally true, or not added", async () => {
    const manager = makeManager(makeRemoteSync());

    await manager.importServerAssets(
      [
        fontRow("added", { tags: ["brand"], siteFont: true }),
        fontRow("stringy", { siteFont: "true" }),
        fontRow("off", { siteFont: false }),
        fontRow("bare"),
      ],
      [],
    );

    expect(manager.getAsset("added")?.siteFont).toBe(true);
    expect(manager.getAsset("added")?.tags).toEqual(["brand"]);
    expect(manager.getAsset("stringy")?.siteFont).toBeFalsy();
    expect(manager.getAsset("off")?.siteFont).toBeFalsy();
    expect(manager.getAsset("bare")?.siteFont).toBeFalsy();
  });
});

/* Clone 3695:45529 (Asset versions, Phase 6): a saved edit is a library row
   of its own, flagged `versionOf = <parent id>` and carrying the edits it was
   saved with. Both ride the same JSON column as the tags and the site-font
   flag — `userMetadata.versionOf` / `userMetadata.edits` — so a patch that
   carries any of the four carries them all, and the import reads them back. */
describe("MediaManager server mirror — versionOf / edits ↔ userMetadata (3695:45529)", () => {
  const EDITS = {
    width: 2400,
    height: 1600,
    crop: "Free",
    preset: "None",
    format: "Original",
    transform: "Original",
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
  };

  it("flagging a synced row as a version mirrors { tags, versionOf }", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "v2", serverId: "srv-v2" });

    const updated = await manager.updateAsset("v2", { versionOf: "hero" });

    expect(updated?.versionOf).toBe("hero");
    expect(remote.updateAsset).toHaveBeenCalledTimes(1);
    expect(remote.updateAsset).toHaveBeenCalledWith("srv-v2", { userMetadata: { tags: [], versionOf: "hero" } });
  });

  it("the edits snapshot rides the same column, beside the flag", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "v2", serverId: "srv-v2", versionOf: "hero" });

    await manager.updateAsset("v2", { edits: EDITS });

    expect(remote.updateAsset).toHaveBeenCalledWith("srv-v2", {
      userMetadata: { tags: [], versionOf: "hero", edits: EDITS },
    });
  });

  it("a tags edit on a version row keeps versionOf and edits in the patch — the server replaces the column", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "v2", serverId: "srv-v2", versionOf: "hero", edits: EDITS });

    await manager.updateAsset("v2", { tags: ["menu"] });

    expect(remote.updateAsset).toHaveBeenCalledWith("srv-v2", {
      userMetadata: { tags: ["menu"], versionOf: "hero", edits: EDITS },
    });
  });

  it("an unchanged flag does not round-trip to the server", async () => {
    const remote = makeRemoteSync();
    const manager = makeManager(remote);
    seedAsset(manager, { id: "v2", serverId: "srv-v2", versionOf: "hero" });

    await manager.updateAsset("v2", { versionOf: "hero" });

    expect(remote.updateAsset).not.toHaveBeenCalled();
  });

  const row = (id: string, userMetadata?: unknown) => ({
    id,
    url: `https://cdn/${id}.jpg`,
    bytes: 10,
    type: "image" as const,
    mimeType: "image/jpeg",
    filename: `${id}.jpg`,
    altText: null,
    folderId: null,
    createdAt: "2026-09-13T00:00:00.000Z",
    updatedAt: "2026-09-13T00:00:00.000Z",
    ...(userMetadata !== undefined ? { userMetadata } : {}),
  });

  it("importServerAssets reads versionOf (a string) and edits (the whole snapshot) back — anything else is a plain asset", async () => {
    const manager = makeManager(makeRemoteSync());

    await manager.importServerAssets(
      [
        row("hero"),
        row("v2", { tags: [], versionOf: "hero", edits: EDITS }),
        row("v3", { versionOf: 42 }),
        row("v4", { versionOf: "hero", edits: { crop: "Free" } }),
      ],
      [],
    );

    expect(manager.getAsset("hero")?.versionOf).toBeUndefined();
    expect(manager.getAsset("v2")?.versionOf).toBe("hero");
    expect(manager.getAsset("v2")?.edits).toEqual(EDITS);
    expect(manager.getAsset("v3")?.versionOf).toBeUndefined();
    expect(manager.getAsset("v4")?.versionOf).toBe("hero");
    expect(manager.getAsset("v4")?.edits).toBeUndefined();
  });
});
