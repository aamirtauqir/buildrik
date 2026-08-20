/**
 * AssetUploadService tests — Vercel Blob upload wrapper, reachability probe
 * (400 = reachable+authed, 401 = dead session), and the RemoteAssetSync
 * factory's payloads + null/boolean failure contracts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Factories only close over these; dereferenced lazily at call time (TDZ-safe —
// same pattern as buildrik-sync-provider.test.ts).
const uploadMock = vi.fn();
const media = {
  createAsset: vi.fn(),
  deleteAsset: vi.fn(),
  createFolder: vi.fn(),
  deleteFolder: vi.fn(),
  moveAsset: vi.fn(),
  updateAsset: vi.fn(),
  renameFolder: vi.fn(),
};

vi.mock("@vercel/blob/client", () => ({
  upload: (...args: unknown[]) => uploadMock(...args),
}));

vi.mock("../api-client", () => ({
  createBuildrikApiClient: () => ({
    media: {
      createAsset: { mutate: (i: unknown) => media.createAsset(i) },
      deleteAsset: { mutate: (i: unknown) => media.deleteAsset(i) },
      createFolder: { mutate: (i: unknown) => media.createFolder(i) },
      deleteFolder: { mutate: (i: unknown) => media.deleteFolder(i) },
      moveAsset: { mutate: (i: unknown) => media.moveAsset(i) },
      updateAsset: { mutate: (i: unknown) => media.updateAsset(i) },
      renameFolder: { mutate: (i: unknown) => media.renameFolder(i) },
    },
  }),
}));

vi.mock("../../shared/utils/runtimeEnv", () => ({
  DASHBOARD_URL: "http://dash.test",
}));

import {
  uploadBlob,
  createRemoteAssetSync,
} from "../AssetUploadService";

const pngBlob = () => new Blob(["abc"], { type: "image/png" });

beforeEach(() => {
  uploadMock.mockReset();
  for (const fn of Object.values(media)) fn.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadBlob", () => {
  it("posts to the dashboard signing route with the full clientPayload", async () => {
    uploadMock.mockResolvedValue({ url: "https://blob.example/x.png" });
    const blob = pngBlob();

    const res = await uploadBlob(blob, "x.png", "image/png", {
      type: "image",
      folderId: "folder-1",
      siteId: "site-1",
    });

    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [filename, passedBlob, opts] = uploadMock.mock.calls[0] as [
      string,
      Blob,
      { access: string; handleUploadUrl: string; clientPayload: string; contentType?: string },
    ];
    expect(filename).toBe("x.png");
    expect(passedBlob).toBe(blob);
    expect(opts.access).toBe("public");
    expect(opts.handleUploadUrl).toBe("http://dash.test/api/asset-upload");
    expect(opts.contentType).toBe("image/png");
    expect(JSON.parse(opts.clientPayload)).toEqual({
      bytes: 3,
      type: "image",
      mimeType: "image/png",
      filename: "x.png",
      folderId: "folder-1",
      siteId: "site-1",
    });

    expect(res).toEqual({
      url: "https://blob.example/x.png",
      bytes: 3,
      contentType: "image/png",
    });
  });

  it("defaults folderId/siteId to null and empty contentType to undefined", async () => {
    uploadMock.mockResolvedValue({ url: "https://blob.example/y.woff2" });

    await uploadBlob(pngBlob(), "y.woff2", "", { type: "font" });

    const opts = uploadMock.mock.calls[0][2] as { clientPayload: string; contentType?: string };
    expect(opts.contentType).toBeUndefined();
    expect(JSON.parse(opts.clientPayload)).toMatchObject({ folderId: null, siteId: null });
  });

  it("propagates upload failures to the caller (caller owns retry)", async () => {
    uploadMock.mockRejectedValue(new Error("quota exceeded"));
    await expect(
      uploadBlob(pngBlob(), "x.png", "image/png", { type: "image" })
    ).rejects.toThrow("quota exceeded");
  });
});

describe("createRemoteAssetSync — uploadAndCreate", () => {
  const meta = {
    filename: "x.png",
    mimeType: "image/png",
    bytes: 3,
    type: "image" as const,
    folderId: null,
    siteId: null,
  };

  it("uploads then creates the asset row, falling back to the factory siteId", async () => {
    uploadMock.mockResolvedValue({ url: "https://blob.example/x.png" });
    media.createAsset.mockResolvedValue({
      id: "asset-1",
      url: "https://blob.example/x.png",
      bytes: 3,
    });

    const sync = createRemoteAssetSync({ siteId: "site-9" });
    const out = await sync.uploadAndCreate(pngBlob(), meta);

    expect(out).toEqual({ serverId: "asset-1", url: "https://blob.example/x.png" });
    expect(media.createAsset).toHaveBeenCalledWith({
      url: "https://blob.example/x.png",
      bytes: 3,
      type: "image",
      mimeType: "image/png",
      filename: "x.png",
      folderId: null,
      siteId: "site-9", // meta.siteId null → factory opts.siteId wins
    });
    // The blob upload also carried the site scope for onUploadCompleted.
    const opts = uploadMock.mock.calls[0][2] as { clientPayload: string };
    expect(JSON.parse(opts.clientPayload)).toMatchObject({ siteId: "site-9" });
  });

  it("prefers meta.siteId over the factory siteId when given", async () => {
    uploadMock.mockResolvedValue({ url: "https://blob.example/x.png" });
    media.createAsset.mockResolvedValue({ id: "a", url: "u", bytes: 3 });

    const sync = createRemoteAssetSync({ siteId: "factory-site" });
    await sync.uploadAndCreate(pngBlob(), { ...meta, siteId: "meta-site" });

    expect(media.createAsset.mock.calls[0][0]).toMatchObject({ siteId: "meta-site" });
  });

  it("returns null when the blob upload fails (unauthenticated / quota)", async () => {
    uploadMock.mockRejectedValue(new Error("Failed to retrieve token: 401"));

    const sync = createRemoteAssetSync();
    await expect(sync.uploadAndCreate(pngBlob(), meta)).resolves.toBeNull();
    expect(media.createAsset).not.toHaveBeenCalled();
  });

  it("returns null when createAsset rejects after a successful upload", async () => {
    uploadMock.mockResolvedValue({ url: "https://blob.example/x.png" });
    media.createAsset.mockRejectedValue(new Error("UNAUTHORIZED"));

    const sync = createRemoteAssetSync();
    await expect(sync.uploadAndCreate(pngBlob(), meta)).resolves.toBeNull();
  });
});

describe("createRemoteAssetSync — mutations", () => {
  it("deleteRemote: true on success, true on NOT_FOUND (already gone), false otherwise", async () => {
    const sync = createRemoteAssetSync();

    media.deleteAsset.mockResolvedValue({});
    await expect(sync.deleteRemote("a1")).resolves.toBe(true);
    expect(media.deleteAsset).toHaveBeenCalledWith({ assetId: "a1" });

    media.deleteAsset.mockRejectedValue(new Error("NOT_FOUND: asset missing"));
    await expect(sync.deleteRemote("a1")).resolves.toBe(true);

    media.deleteAsset.mockRejectedValue(new Error("network down"));
    await expect(sync.deleteRemote("a1")).resolves.toBe(false);
  });

  it("createFolder sends name/parentId/siteId and returns the server id (null on failure)", async () => {
    const sync = createRemoteAssetSync({ siteId: "site-9" });

    media.createFolder.mockResolvedValue({ id: "folder-7" });
    await expect(sync.createFolder({ name: "Logos" })).resolves.toEqual({
      serverId: "folder-7",
    });
    expect(media.createFolder).toHaveBeenCalledWith({
      name: "Logos",
      parentId: null,
      siteId: "site-9",
    });

    media.createFolder.mockRejectedValue(new Error("UNAUTHORIZED"));
    await expect(sync.createFolder({ name: "Logos" })).resolves.toBeNull();
  });

  it("deleteFolder: NOT_FOUND is success, other failures are false", async () => {
    const sync = createRemoteAssetSync();

    media.deleteFolder.mockResolvedValue({});
    await expect(sync.deleteFolder("f1")).resolves.toBe(true);
    expect(media.deleteFolder).toHaveBeenCalledWith({ folderId: "f1" });

    media.deleteFolder.mockRejectedValue(new Error("folder not found"));
    await expect(sync.deleteFolder("f1")).resolves.toBe(true);

    media.deleteFolder.mockRejectedValue(new Error("timeout"));
    await expect(sync.deleteFolder("f1")).resolves.toBe(false);
  });

  it("moveAsset returns true/false and forwards ids", async () => {
    const sync = createRemoteAssetSync();

    media.moveAsset.mockResolvedValue({});
    await expect(sync.moveAsset("a1", "f2")).resolves.toBe(true);
    expect(media.moveAsset).toHaveBeenCalledWith({ assetId: "a1", folderId: "f2" });

    media.moveAsset.mockRejectedValue(new Error("nope"));
    await expect(sync.moveAsset("a1", "f2")).resolves.toBe(false);
  });

  it("updateAsset sends ONLY the keys the caller changed", async () => {
    const sync = createRemoteAssetSync();
    media.updateAsset.mockResolvedValue({});

    await expect(sync.updateAsset("a1", { altText: "a logo" })).resolves.toBe(true);

    const payload = media.updateAsset.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toEqual({ assetId: "a1", altText: "a logo" });
    expect("filename" in payload).toBe(false); // omitted key must not null the row

    media.updateAsset.mockRejectedValue(new Error("validation"));
    await expect(sync.updateAsset("a1", { filename: "new.png" })).resolves.toBe(false);
  });

  it("renameFolder: NOT_FOUND is success, other failures are false", async () => {
    const sync = createRemoteAssetSync();

    media.renameFolder.mockResolvedValue({});
    await expect(sync.renameFolder("f1", "Brand")).resolves.toBe(true);
    expect(media.renameFolder).toHaveBeenCalledWith({ folderId: "f1", name: "Brand" });

    media.renameFolder.mockRejectedValue(new Error("NOT_FOUND"));
    await expect(sync.renameFolder("f1", "Brand")).resolves.toBe(true);

    media.renameFolder.mockRejectedValue(new Error("500"));
    await expect(sync.renameFolder("f1", "Brand")).resolves.toBe(false);
  });
});
