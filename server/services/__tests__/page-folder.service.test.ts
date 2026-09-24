/**
 * Personal page folders: per user × site, EDITOR+, pages stay shared.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRole = vi.fn();
vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: (...a: unknown[]) => checkSiteRole(...a),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    pageFolder: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    page: { findMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createPageFolder,
  deletePageFolder,
  listPageFolders,
  movePageToFolder,
  updatePageFolder,
} from "@/server/services/page-folder.service";

const db = vi.mocked(prisma, true);
const forbidden = () => Object.assign(new Error("Insufficient permissions"), { name: "PermissionError", code: "FORBIDDEN" });

beforeEach(() => {
  vi.clearAllMocks();
  checkSiteRole.mockResolvedValue(undefined);
  db.page.findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }, { id: "p3" }] as never);
  db.pageFolder.update.mockImplementation((({ where, data }: { where: { id: string }; data: object }) => ({ id: where.id, ...data })) as never);
});

describe("page folders — role gate", () => {
  it("VIEWER is refused on every operation; nothing is read or written", async () => {
    checkSiteRole.mockRejectedValue(forbidden());
    db.pageFolder.findUnique.mockResolvedValue({ userId: "u1", siteId: "s1" } as never);
    await expect(listPageFolders("u1", "s1")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createPageFolder("u1", { siteId: "s1", name: "Legal" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updatePageFolder("u1", { folderId: "f1", name: "x" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(deletePageFolder("u1", "f1")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(movePageToFolder("u1", { siteId: "s1", pageId: "p1", folderId: null })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(checkSiteRole).toHaveBeenCalledWith(expect.anything(), "u1", "s1", "EDITOR");
    expect(db.pageFolder.create).not.toHaveBeenCalled();
    expect(db.pageFolder.update).not.toHaveBeenCalled();
    expect(db.pageFolder.delete).not.toHaveBeenCalled();
  });

  it("EDITOR creates a folder, appended after their existing ones", async () => {
    db.pageFolder.count.mockResolvedValue(2 as never);
    db.pageFolder.create.mockResolvedValue({ id: "f3", name: "Legal", collapsed: false, pageIds: [] } as never);
    await expect(createPageFolder("u1", { siteId: "s1", name: "Legal" })).resolves.toMatchObject({ id: "f3" });
    expect(db.pageFolder.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "u1", siteId: "s1", name: "Legal", position: 2 } }),
    );
  });
});

describe("page folders — personal", () => {
  it("lists only the caller's folders and drops deleted pages", async () => {
    db.pageFolder.findMany.mockResolvedValue([{ id: "f1", name: "M", collapsed: false, pageIds: ["p1", "gone", "p2"] }] as never);
    const out = await listPageFolders("u1", "s1");
    expect(db.pageFolder.findMany.mock.calls[0][0]!.where).toEqual({ userId: "u1", siteId: "s1" });
    expect(out[0].pageIds).toEqual(["p1", "p2"]);
  });

  it("another member's folder is NOT_FOUND for rename and delete", async () => {
    db.pageFolder.findUnique.mockResolvedValue({ userId: "someone-else", siteId: "s1" } as never);
    await expect(updatePageFolder("u1", { folderId: "f1", name: "x" })).rejects.toThrow("FOLDER_NOT_FOUND");
    await expect(deletePageFolder("u1", "f1")).rejects.toThrow("FOLDER_NOT_FOUND");
    expect(db.pageFolder.delete).not.toHaveBeenCalled();
  });
});

describe("movePageToFolder", () => {
  beforeEach(() => {
    db.page.findUnique.mockResolvedValue({ siteId: "s1" } as never);
    db.pageFolder.findMany.mockResolvedValue([
      { id: "f1", name: "A", collapsed: false, pageIds: ["p1", "p2"] },
      { id: "f2", name: "B", collapsed: false, pageIds: [] },
    ] as never);
  });

  it("moves a page out of its old folder into the new one (one folder per page)", async () => {
    await movePageToFolder("u1", { siteId: "s1", pageId: "p1", folderId: "f2" });
    expect(db.pageFolder.update).toHaveBeenCalledWith({ where: { id: "f1" }, data: { pageIds: ["p2"] } });
    expect(db.pageFolder.update).toHaveBeenCalledWith({ where: { id: "f2" }, data: { pageIds: ["p1"] } });
  });

  it("folderId null takes it out of every folder", async () => {
    await movePageToFolder("u1", { siteId: "s1", pageId: "p2", folderId: null });
    expect(db.pageFolder.update).toHaveBeenCalledTimes(1);
    expect(db.pageFolder.update).toHaveBeenCalledWith({ where: { id: "f1" }, data: { pageIds: ["p1"] } });
  });

  it("a page already in the target keeps its place (no write)", async () => {
    await movePageToFolder("u1", { siteId: "s1", pageId: "p1", folderId: "f1" });
    expect(db.pageFolder.update).not.toHaveBeenCalled();
  });

  it("refuses a page from another site and a folder that is not the caller's", async () => {
    db.page.findUnique.mockResolvedValueOnce({ siteId: "other" } as never);
    await expect(movePageToFolder("u1", { siteId: "s1", pageId: "p9", folderId: "f1" })).rejects.toThrow("PAGE_NOT_FOUND");
    await expect(movePageToFolder("u1", { siteId: "s1", pageId: "p1", folderId: "not-mine" })).rejects.toThrow("FOLDER_NOT_FOUND");
    expect(db.pageFolder.update).not.toHaveBeenCalled();
  });
});
