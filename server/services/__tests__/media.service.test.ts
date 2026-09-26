import { describe, it, expect, vi, beforeEach } from "vitest";

const mediaAssetFindUnique = vi.fn();
const mediaAssetVersionFindMany = vi.fn();
const userFindMany = vi.fn();
const mediaAssetFindMany = vi.fn();
const mediaAssetCount = vi.fn();

vi.mock("@vercel/blob", () => ({ del: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mediaAsset: {
      findUnique: (...a: unknown[]) => mediaAssetFindUnique(...a),
      findMany: (...a: unknown[]) => mediaAssetFindMany(...a),
      count: (...a: unknown[]) => mediaAssetCount(...a),
    },
    mediaAssetVersion: {
      findMany: (...a: unknown[]) => mediaAssetVersionFindMany(...a),
    },
    user: { findMany: (...a: unknown[]) => userFindMany(...a) },
  },
}));

import { listAssets, listAssetVersions } from "@server/services/media.service";

beforeEach(() => {
  [mediaAssetFindUnique, mediaAssetVersionFindMany, userFindMany, mediaAssetFindMany, mediaAssetCount].forEach((m) => m.mockReset());
});

/* Board Assets 4418:62883 — the author line under each version ("Ali",
   "Sara"). `createdBy` is a bare user id, joined here to a display name. */
describe("media.service listAssetVersions", () => {
  it("joins createdBy to a display name (preferring displayName, then fullName, then email)", async () => {
    mediaAssetFindUnique.mockResolvedValueOnce({ userId: "u1" });
    mediaAssetVersionFindMany.mockResolvedValueOnce([
      { id: "v1", assetId: "a1", createdBy: "u2", createdAt: new Date("2026-01-01") },
      { id: "v2", assetId: "a1", createdBy: "u3", createdAt: new Date("2026-01-02") },
      { id: "v3", assetId: "a1", createdBy: null, createdAt: new Date("2026-01-03") },
    ]);
    userFindMany.mockResolvedValueOnce([
      { id: "u2", displayName: "Ali", fullName: "Ali Khan", email: "ali@x.com" },
      { id: "u3", displayName: null, fullName: "Sara Malik", email: "sara@x.com" },
    ]);

    const result = await listAssetVersions("u1", { assetId: "a1" } as never);

    expect(result).toEqual([
      { id: "v1", assetId: "a1", createdBy: "u2", createdAt: new Date("2026-01-01"), createdByName: "Ali" },
      { id: "v2", assetId: "a1", createdBy: "u3", createdAt: new Date("2026-01-02"), createdByName: "Sara Malik" },
      { id: "v3", assetId: "a1", createdBy: null, createdAt: new Date("2026-01-03"), createdByName: null },
    ]);
    expect(userFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["u2", "u3"] } },
      select: { id: true, displayName: true, fullName: true, email: true },
    });
  });

  it("skips the user lookup entirely when no version has a createdBy", async () => {
    mediaAssetFindUnique.mockResolvedValueOnce({ userId: "u1" });
    mediaAssetVersionFindMany.mockResolvedValueOnce([
      { id: "v1", assetId: "a1", createdBy: null, createdAt: new Date("2026-01-01") },
    ]);

    const result = await listAssetVersions("u1", { assetId: "a1" } as never);

    expect(result[0].createdByName).toBeNull();
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when the asset belongs to a different user", async () => {
    mediaAssetFindUnique.mockResolvedValueOnce({ userId: "someone-else" });
    await expect(listAssetVersions("u1", { assetId: "a1" } as never)).rejects.toThrow("NOT_FOUND");
  });
});

/* D-13 fix: cursor paging over `createdAt desc` alone is not a total
   order — a bulk upload stamps many assets with the same createdAt, and
   Prisma's cursor then skips or repeats rows at a page boundary. `id` breaks
   the tie so every page continues exactly where the last one stopped. */
describe("media.service listAssets", () => {
  it("orders by createdAt desc with an id tiebreaker, on the first page and on a cursor page", async () => {
    mediaAssetFindMany.mockResolvedValue([]);
    mediaAssetCount.mockResolvedValue(0);
    await listAssets("u1", { limit: 20 } as never);
    await listAssets("u1", { limit: 20, cursor: "a9" } as never);
    for (const [args] of mediaAssetFindMany.mock.calls) {
      expect(args.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
    }
    expect(mediaAssetFindMany.mock.calls[1][0]).toMatchObject({ cursor: { id: "a9" }, skip: 1 });
  });
});
