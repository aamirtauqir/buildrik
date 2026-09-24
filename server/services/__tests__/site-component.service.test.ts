import { describe, it, expect, vi, beforeEach } from "vitest";

const upsert = vi.fn();
const findMany = vi.fn();
const findUnique = vi.fn();
const deleteMany = vi.fn();
const updateMany = vi.fn();
const findFirst = vi.fn();
const pageFindUnique = vi.fn();
const siteFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteComponent: {
      upsert: (...a: unknown[]) => upsert(...a),
      findMany: (...a: unknown[]) => findMany(...a),
      findUnique: (...a: unknown[]) => findUnique(...a),
      deleteMany: (...a: unknown[]) => deleteMany(...a),
      updateMany: (...a: unknown[]) => updateMany(...a),
      findFirst: (...a: unknown[]) => findFirst(...a),
    },
    page: { findUnique: (...a: unknown[]) => pageFindUnique(...a) },
    site: { findUnique: (...a: unknown[]) => siteFindUnique(...a) },
  },
}));

import {
  upsertSiteComponent,
  listSiteComponents,
  getSiteComponent,
  deleteSiteComponent,
  renameWorkspaceComponent,
  deleteWorkspaceComponent,
  listComponentLibrary,
  getLibraryComponent,
} from "@server/services/site-component.service";

beforeEach(() =>
  [upsert, findMany, findUnique, deleteMany, updateMany, findFirst, pageFindUnique, siteFindUnique].forEach((m) => m.mockReset()),
);

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

  it("listSiteComponents selects metadata only (never the payload) — incl. its scope", async () => {
    findMany.mockResolvedValueOnce([]);
    await listSiteComponents("s1");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { siteId: "s1" },
        select: { componentId: true, name: true, pageId: true, createdBy: true, createdAt: true, updatedAt: true },
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

describe("component scope — This site / This page (board 6971:77663)", () => {
  it("stores a page scope when the page is on the site; site scope is null", async () => {
    upsert.mockResolvedValue({ componentId: "c1" });
    pageFindUnique.mockResolvedValueOnce({ siteId: "s1" });
    await upsertSiteComponent({ siteId: "s1", componentId: "c1", name: "Hero", payload: {}, pageId: "p1" });
    expect(upsert.mock.calls[0][0].create.pageId).toBe("p1");
    expect(upsert.mock.calls[0][0].update.pageId).toBe("p1");
    await upsertSiteComponent({ siteId: "s1", componentId: "c2", name: "Card", payload: {} });
    expect(upsert.mock.calls[1][0].create.pageId).toBeNull();
  });

  it("refuses a page from another site", async () => {
    pageFindUnique.mockResolvedValueOnce({ siteId: "other" });
    await expect(
      upsertSiteComponent({ siteId: "s1", componentId: "c1", name: "Hero", payload: {}, pageId: "p9" }),
    ).rejects.toThrow("PAGE_NOT_FOUND");
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("FROM LIBRARY — the workspace's shared masters (board 4418:99857)", () => {
  it("lists site-scoped masters that live on another site of the SITE's workspace", async () => {
    siteFindUnique.mockResolvedValue({ workspaceId: "w1" });
    const d = (n: number) => new Date(2026, 8, n);
    findMany.mockResolvedValueOnce([
      { componentId: "btn", name: "Button / primary", siteId: "s1", updatedAt: d(1) },
      { componentId: "btn", name: "Button / primary", siteId: "s2", updatedAt: d(2) },
      { componentId: "price", name: "Price row", siteId: "s3", updatedAt: d(3) },
      { componentId: "mine", name: "Site header", siteId: "s1", updatedAt: d(4) },
    ]);
    const out = await listComponentLibrary("s1");
    expect(findMany.mock.calls[0][0].where).toEqual({ pageId: null, site: { workspaceId: "w1", deletedAt: null } });
    expect(out.map((c) => [c.componentId, c.siteCount, c.onThisSite])).toEqual([
      ["btn", 2, true],
      ["price", 1, false],
    ]);
  });

  it("libraryGet reads the newest site-scoped copy within the site's workspace only", async () => {
    siteFindUnique.mockResolvedValue({ workspaceId: "w1" });
    findFirst.mockResolvedValueOnce({ payload: { id: "price" } });
    await expect(getLibraryComponent("s1", "price")).resolves.toEqual({ id: "price" });
    expect(findFirst.mock.calls[0][0].where).toEqual({
      componentId: "price", pageId: null, site: { workspaceId: "w1", deletedAt: null },
    });
  });
});
