import { describe, it, expect, vi, beforeEach } from "vitest";

const upsert = vi.fn();
const findMany = vi.fn();
const findUnique = vi.fn();
const deleteMany = vi.fn();
const updateMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteComponent: {
      upsert: (...a: unknown[]) => upsert(...a),
      findMany: (...a: unknown[]) => findMany(...a),
      findUnique: (...a: unknown[]) => findUnique(...a),
      deleteMany: (...a: unknown[]) => deleteMany(...a),
      updateMany: (...a: unknown[]) => updateMany(...a),
    },
  },
}));

import {
  upsertSiteComponent,
  listSiteComponents,
  getSiteComponent,
  deleteSiteComponent,
  renameWorkspaceComponent,
  deleteWorkspaceComponent,
} from "@server/services/site-component.service";

beforeEach(() => [upsert, findMany, findUnique, deleteMany, updateMany].forEach((m) => m.mockReset()));

describe("site-component.service", () => {
  it("upsertSiteComponent upserts on (siteId, componentId) carrying the payload", async () => {
    upsert.mockResolvedValueOnce({ componentId: "c1" });
    const res = await upsertSiteComponent({
      siteId: "s1", componentId: "c1", name: "Card", payload: { id: "c1" },
    });
    expect(res).toEqual({ componentId: "c1" });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { siteId_componentId: { siteId: "s1", componentId: "c1" } },
        create: expect.objectContaining({ siteId: "s1", componentId: "c1", name: "Card" }),
        update: expect.objectContaining({ name: "Card" }),
      })
    );
  });

  it("listSiteComponents selects metadata only (never the payload)", async () => {
    findMany.mockResolvedValueOnce([]);
    await listSiteComponents("s1");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { siteId: "s1" },
        select: { componentId: true, name: true, createdBy: true, createdAt: true, updatedAt: true },
      })
    );
  });

  it("getSiteComponent returns the payload, null when missing", async () => {
    findUnique.mockResolvedValueOnce({ payload: { id: "c1" } });
    expect(await getSiteComponent("s1", "c1")).toEqual({ id: "c1" });
    findUnique.mockResolvedValueOnce(null);
    expect(await getSiteComponent("s1", "nope")).toBeNull();
  });

  it("deleteSiteComponent uses deleteMany (a missing row is a no-op)", async () => {
    deleteMany.mockResolvedValueOnce({ count: 0 });
    expect(await deleteSiteComponent("s1", "gone")).toEqual({ ok: true });
    expect(deleteMany).toHaveBeenCalledWith({ where: { siteId: "s1", componentId: "gone" } });
  });

  it("renameWorkspaceComponent renames the master on every site in the workspace", async () => {
    updateMany.mockResolvedValueOnce({ count: 3 });
    expect(await renameWorkspaceComponent("ws-1", "c1", "Hero v2")).toEqual({ updated: 3 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { componentId: "c1", site: { workspaceId: "ws-1", deletedAt: null } },
      data: { name: "Hero v2" },
    });
  });

  it("deleteWorkspaceComponent removes the master from every site in the workspace", async () => {
    deleteMany.mockResolvedValueOnce({ count: 2 });
    expect(await deleteWorkspaceComponent("ws-1", "c1")).toEqual({ deleted: 2 });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { componentId: "c1", site: { workspaceId: "ws-1", deletedAt: null } },
    });
  });
});
