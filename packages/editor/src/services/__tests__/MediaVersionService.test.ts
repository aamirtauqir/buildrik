/**
 * MediaVersionService tests — editor → dashboard asset-version bridge.
 * Thin tRPC wrappers: verify exact payload shapes and that failures
 * PROPAGATE (unlike the best-effort sync services, callers here own
 * the error UX — the Versions tab shows its own failure state).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const listQuery = vi.fn();
const createMutate = vi.fn();
const restoreMutate = vi.fn();

vi.mock("../api-client", () => ({
  createBuildrikApiClient: () => ({
    media: {
      listAssetVersions: { query: (...a: unknown[]) => listQuery(...a) },
      createAssetVersion: { mutate: (...a: unknown[]) => createMutate(...a) },
      restoreAssetVersion: { mutate: (...a: unknown[]) => restoreMutate(...a) },
    },
  }),
}));

import {
  listAssetVersions,
  createAssetVersion,
  restoreAssetVersion,
} from "../MediaVersionService";

beforeEach(() => {
  [listQuery, createMutate, restoreMutate].forEach((m) => m.mockReset());
});

describe("listAssetVersions", () => {
  it("queries media.listAssetVersions with the assetId and returns the rows", async () => {
    const rows = [
      { id: "ver-2", assetId: "asset-1", url: "https://cdn/x-v2.png", bytes: 2048, edits: { crop: true }, createdAt: new Date("2026-07-01") },
      { id: "ver-1", assetId: "asset-1", url: "https://cdn/x-v1.png", bytes: 1024, edits: null, createdAt: new Date("2026-06-01") },
    ];
    listQuery.mockResolvedValueOnce(rows);

    const result = await listAssetVersions("asset-1");

    expect(listQuery).toHaveBeenCalledWith({ assetId: "asset-1" });
    expect(result).toEqual(rows);
  });

  it("propagates a tRPC failure (caller owns the error state)", async () => {
    listQuery.mockRejectedValueOnce(new Error("UNAUTHORIZED"));
    await expect(listAssetVersions("asset-1")).rejects.toThrow("UNAUTHORIZED");
  });
});

describe("createAssetVersion", () => {
  it("passes the full snapshot input through to media.createAssetVersion", async () => {
    const created = { id: "ver-3", assetId: "asset-1", url: "https://cdn/x-v3.png", bytes: 4096, edits: { rotate: 90 }, createdAt: new Date("2026-07-10") };
    createMutate.mockResolvedValueOnce(created);

    const input = {
      assetId: "asset-1",
      url: "https://cdn/x-v3.png",
      bytes: 4096,
      edits: { rotate: 90 },
    };
    const result = await createAssetVersion(input);

    expect(createMutate).toHaveBeenCalledWith(input);
    expect(result).toEqual(created);
  });

  it("propagates a version-cap rejection (plan limit)", async () => {
    createMutate.mockRejectedValueOnce(new Error("Version limit reached for plan"));
    await expect(
      createAssetVersion({ assetId: "asset-1", url: "u", bytes: 1, edits: {} }),
    ).rejects.toThrow(/Version limit/);
  });
});

describe("restoreAssetVersion", () => {
  it("mutates media.restoreAssetVersion with the versionId and returns the restored asset pointer", async () => {
    restoreMutate.mockResolvedValueOnce({ id: "asset-1", url: "https://cdn/x-v1.png" });

    const result = await restoreAssetVersion("ver-1");

    expect(restoreMutate).toHaveBeenCalledWith({ versionId: "ver-1" });
    expect(result).toEqual({ id: "asset-1", url: "https://cdn/x-v1.png" });
  });

  it("propagates a NOT_FOUND failure", async () => {
    restoreMutate.mockRejectedValueOnce(new Error("NOT_FOUND"));
    await expect(restoreAssetVersion("gone")).rejects.toThrow("NOT_FOUND");
  });
});
