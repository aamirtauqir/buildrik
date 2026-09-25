/**
 * S-4 (P0-4, A19-4) — blob ownership comes from the key, not from which DB
 * rows happen to exist.
 *
 * Ownership used to be inferred from MediaAsset/MediaAssetVersion rows, but
 * favicon, OG, touch-icon, avatar and workspace-icon blobs never get a row, so
 * `createAsset({ url: <victim favicon> })` passed every guard and the
 * follow-up `deleteAsset` called `del()` on the victim's blob. Now every media
 * upload lands under `u/<userId>/` (enforced at token issue), only such URLs
 * may be written to a row, and `del()` never fires outside that prefix.
 *
 * Real Postgres rows. `@vercel/blob` is mocked — there is no Blob store
 * locally, so a live delete is NOT exercised; the assertion is on whether the
 * service asks Blob to delete.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";

const delMock = vi.fn();
vi.mock("@vercel/blob", () => ({ del: (...a: unknown[]) => delMock(...a) }));

vi.mock("@vercel/blob/client", () => ({
  // Stand-in for the token phase of handleUpload: hand the requested pathname
  // to our gate and return what it decided.
  handleUpload: async (opts: {
    body: { payload: { pathname: string; clientPayload: string } };
    onBeforeGenerateToken: (pathname: string, clientPayload: string) => Promise<unknown>;
  }) => ({ token: await opts.onBeforeGenerateToken(opts.body.payload.pathname, opts.body.payload.clientPayload) }),
}));

let sessionUserId: string | null = null;
vi.mock("@server/auth", () => ({
  auth: async () => (sessionUserId ? { user: { id: sessionUserId } } : null),
}));

import { prisma } from "@/lib/prisma";
import {
  createAsset,
  createAssetVersion,
  deleteAsset,
  isOwnedBlobUrl,
  restoreAssetVersion,
} from "@/server/services/media.service";
import { POST } from "@/packages/dashboard/app/api/asset-upload/route";
import { createTestUser, truncateTables } from "./helpers";

const STORE = "https://abc123.public.blob.vercel-storage.com";
const asset = (url: string) => ({ url, bytes: 10, type: "image" as const, mimeType: "image/png", filename: "a.png" });

const prevToken = process.env.BLOB_READ_WRITE_TOKEN;
beforeEach(async () => {
  await truncateTables("mediaAssetVersion", "mediaAsset", "user");
  delMock.mockReset();
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
  sessionUserId = null;
});
afterAll(() => {
  process.env.BLOB_READ_WRITE_TOKEN = prevToken;
});

describe("isOwnedBlobUrl", () => {
  it("accepts only the caller's prefix on a Vercel Blob host", () => {
    expect(isOwnedBlobUrl(`${STORE}/u/U1/a-x1.png`, "U1")).toBe(true);
    expect(isOwnedBlobUrl(`${STORE}/u/U2/a-x1.png`, "U1")).toBe(false);
    expect(isOwnedBlobUrl(`${STORE}/sites/S/favicon.png`, "U1")).toBe(false);
    expect(isOwnedBlobUrl(`${STORE}/a-x1.png`, "U1")).toBe(false);
    expect(isOwnedBlobUrl(`${STORE}/u/U1/../U2/a.png`, "U1")).toBe(false);
    expect(isOwnedBlobUrl(`${STORE}/u/U1/%2e%2e/U2/a.png`, "U1")).toBe(false);
    expect(isOwnedBlobUrl(`${STORE}/u/U1/..%2F..%2Fsites%2Fvictim%2Ffavicon.png`, "U1")).toBe(false);
    expect(isOwnedBlobUrl(`${STORE}/u/U1/..%2f..%2fu%2fU2%2fa.png`, "U1")).toBe(false);
    expect(isOwnedBlobUrl(`${STORE}/u/U1/..%5C..%5Csites%5Cv.png`, "U1")).toBe(false);
    expect(isOwnedBlobUrl(`${STORE}/u/U1/%2e%2e%2F%2e%2e%2Fsites/v.png`, "U1")).toBe(false);
    expect(isOwnedBlobUrl(`${STORE}/u/U1/a\\..\\b.png`, "U1")).toBe(false);
    expect(isOwnedBlobUrl("https://evil.example/u/U1/a.png", "U1")).toBe(false);
    expect(isOwnedBlobUrl("http://abc.public.blob.vercel-storage.com/u/U1/a.png", "U1")).toBe(false);
    expect(isOwnedBlobUrl("not a url", "U1")).toBe(false);
  });
});

describe("createAsset — S-4", () => {
  it("refuses another site's favicon URL", async () => {
    const user = await createTestUser();
    await expect(createAsset(user.id, asset(`${STORE}/sites/victim/favicon.png`))).rejects.toThrow("URL_NOT_OWNED");
    expect(await prisma.mediaAsset.count()).toBe(0);
  });

  it("refuses a URL under another user's prefix", async () => {
    const [me, other] = [await createTestUser(), await createTestUser()];
    await expect(createAsset(me.id, asset(`${STORE}/u/${other.id}/p-x1.png`))).rejects.toThrow("URL_NOT_OWNED");
  });

  it("accepts a URL under the caller's own prefix", async () => {
    const user = await createTestUser();
    const row = await createAsset(user.id, asset(`${STORE}/u/${user.id}/p-x1.png`));
    expect(row.url).toBe(`${STORE}/u/${user.id}/p-x1.png`);
  });
});

describe("deleteAsset — S-4", () => {
  it("removes a legacy row outside the prefix but never deletes its blob", async () => {
    const user = await createTestUser();
    const legacy = await prisma.mediaAsset.create({
      data: { userId: user.id, ...asset(`${STORE}/sites/victim/favicon.png`) },
    });

    await expect(deleteAsset(user.id, { assetId: legacy.id })).resolves.toEqual({ success: true });

    expect(await prisma.mediaAsset.count()).toBe(0);
    expect(delMock).not.toHaveBeenCalled();
  });

  it("never deletes a blob reached through an encoded separator", async () => {
    const user = await createTestUser();
    const url = `${STORE}/u/${user.id}/..%2F..%2Fsites%2Fvictim%2Ffavicon.png`;
    await expect(createAsset(user.id, asset(url))).rejects.toThrow("URL_NOT_OWNED");
    const legacy = await prisma.mediaAsset.create({ data: { userId: user.id, ...asset(url) } });
    await deleteAsset(user.id, { assetId: legacy.id });
    expect(delMock).not.toHaveBeenCalled();
  });

  it("deletes the blob of an owned, unreferenced asset", async () => {
    const user = await createTestUser();
    const url = `${STORE}/u/${user.id}/p-x1.png`;
    const row = await createAsset(user.id, asset(url));

    await deleteAsset(user.id, { assetId: row.id });

    expect(delMock).toHaveBeenCalledWith(url);
  });
});

describe("asset versions — S-4", () => {
  it("createAssetVersion refuses a foreign URL", async () => {
    const user = await createTestUser();
    const row = await createAsset(user.id, asset(`${STORE}/u/${user.id}/p-x1.png`));
    await expect(
      createAssetVersion(user.id, { assetId: row.id, url: `${STORE}/sites/victim/og-image.png`, bytes: 1, edits: {} }),
    ).rejects.toThrow("URL_NOT_OWNED");
  });

  it("restoreAssetVersion refuses a legacy version pointing outside the prefix", async () => {
    const user = await createTestUser();
    const row = await createAsset(user.id, asset(`${STORE}/u/${user.id}/p-x1.png`));
    const version = await prisma.mediaAssetVersion.create({
      data: { assetId: row.id, url: `${STORE}/sites/victim/favicon.png`, bytes: 1, edits: {} },
    });
    await expect(restoreAssetVersion(user.id, { versionId: version.id })).rejects.toThrow("URL_NOT_OWNED");
    const after = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.url).toBe(`${STORE}/u/${user.id}/p-x1.png`);
  });
});

describe("POST /api/asset-upload token issue — S-4", () => {
  function tokenRequest(pathname: string) {
    const clientPayload = JSON.stringify({ bytes: 10, type: "image", mimeType: "image/png", filename: "p.png" });
    return new NextRequest("http://localhost/api/asset-upload", {
      method: "POST",
      body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname, clientPayload, multipart: false } }),
    });
  }

  it("refuses a pathname outside the caller's prefix", async () => {
    const user = await createTestUser();
    sessionUserId = user.id;
    for (const pathname of [
      "p.png",
      "sites/victim/favicon.png",
      `u/other/p.png`,
      `u/${user.id}/../other/p.png`,
      `u/${user.id}/..%2F..%2Fsites%2Fvictim%2Ffavicon.png`,
      `u/${user.id}/..%5C..%5Cp.png`,
      `u/${user.id}/..\\..\\p.png`,
    ]) {
      const res = await POST(tokenRequest(pathname));
      expect(res.status, pathname).toBe(403);
    }
  });

  it("issues a token under the caller's prefix", async () => {
    const user = await createTestUser();
    sessionUserId = user.id;
    const res = await POST(tokenRequest(`u/${user.id}/p.png`));
    expect(res.status).toBe(200);
  });
});
