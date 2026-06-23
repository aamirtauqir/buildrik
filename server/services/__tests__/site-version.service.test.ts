import { describe, it, expect, vi, beforeEach } from "vitest";

const upsert = vi.fn();
const findMany = vi.fn();
const findUnique = vi.fn();
const deleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteVersion: {
      upsert: (...a: unknown[]) => upsert(...a),
      findMany: (...a: unknown[]) => findMany(...a),
      findUnique: (...a: unknown[]) => findUnique(...a),
      deleteMany: (...a: unknown[]) => deleteMany(...a),
    },
  },
}));

import {
  createSiteVersion,
  listSiteVersions,
  getSiteVersion,
  deleteSiteVersion,
} from "@server/services/site-version.service";

beforeEach(() => [upsert, findMany, findUnique, deleteMany].forEach((m) => m.mockReset()));

describe("site-version.service", () => {
  it("createSiteVersion upserts on (siteId, versionId) carrying the payload", async () => {
    upsert.mockResolvedValueOnce({ versionId: "v1" });
    findMany.mockResolvedValueOnce([{ id: "a" }]); // prune: under cap
    const res = await createSiteVersion({
      siteId: "s1", versionId: "v1", name: "First", isAuto: false,
      payload: { id: "v1", snapshot: {} },
    });
    expect(res).toEqual({ versionId: "v1" });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { siteId_versionId: { siteId: "s1", versionId: "v1" } },
        create: expect.objectContaining({ siteId: "s1", versionId: "v1", name: "First", isAuto: false }),
        update: expect.objectContaining({ name: "First", isAuto: false }),
      })
    );
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("prunes the oldest rows beyond the 50 cap after create", async () => {
    upsert.mockResolvedValueOnce({ versionId: "v" });
    const rows = Array.from({ length: 52 }, (_, i) => ({ id: `id-${i}` })); // newest-first
    findMany.mockResolvedValueOnce(rows);
    await createSiteVersion({ siteId: "s1", versionId: "v", name: "n", isAuto: true, payload: {} });
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["id-50", "id-51"] } } });
  });

  it("listSiteVersions selects metadata only (never the snapshot payload)", async () => {
    findMany.mockResolvedValueOnce([]);
    await listSiteVersions("s1");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { siteId: "s1" },
        select: { versionId: true, name: true, isAuto: true, createdBy: true, createdAt: true },
      })
    );
  });

  it("getSiteVersion returns the payload, null when missing", async () => {
    findUnique.mockResolvedValueOnce({ payload: { id: "v1" } });
    expect(await getSiteVersion("s1", "v1")).toEqual({ id: "v1" });
    findUnique.mockResolvedValueOnce(null);
    expect(await getSiteVersion("s1", "nope")).toBeNull();
  });

  it("deleteSiteVersion uses deleteMany (a missing row is a no-op, not a throw)", async () => {
    deleteMany.mockResolvedValueOnce({ count: 0 });
    expect(await deleteSiteVersion("s1", "gone")).toEqual({ ok: true });
    expect(deleteMany).toHaveBeenCalledWith({ where: { siteId: "s1", versionId: "gone" } });
  });
});
