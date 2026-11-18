import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  const prisma = {
    page: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    site: { findUnique: vi.fn(), update: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    formBlock: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(prisma));
  return { prisma };
});

import { prisma } from "@/lib/prisma";

describe("Page Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("listPages", () => {
    it("returns pages ordered by position without blocks", async () => {
      const { listPages } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.findMany).mockResolvedValue([
        { id: "p1", siteId: "s1", name: "Home", slug: "home", position: 0, isHomePage: true, seoTitle: null, seoDescription: null, updatedAt: new Date(), createdAt: new Date() },
        { id: "p2", siteId: "s1", name: "About", slug: "about", position: 1, isHomePage: false, seoTitle: null, seoDescription: null, updatedAt: new Date(), createdAt: new Date() },
      ] as never);
      const result = await listPages("s1");
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Home");
    });
  });

  describe("createPage", () => {
    it("creates page and increments site.pages count", async () => {
      const { createPage } = await import("@/server/services/page.service");
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", workspaceId: "ws1", pages: 3 } as never);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as never);
      vi.mocked(prisma.page.count).mockResolvedValue(3);
      vi.mocked(prisma.page.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.page.create).mockResolvedValue({ id: "p3", name: "Contact", slug: "contact", position: 3 } as never);
      vi.mocked(prisma.site.update).mockResolvedValue({} as never);

      const result = await createPage({ siteId: "s1", name: "Contact" });
      expect(result.name).toBe("Contact");
      expect(prisma.site.update).toHaveBeenCalled();
    });

    /* X-A1 round 1: a page stored as [] loaded with a root shared by every
       blank page; a new page now stores its own root, id unique per site. */
    it("writes a blank root whose id is unique to the page, not []", async () => {
      const { createPage } = await import("@/server/services/page.service");
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", workspaceId: "ws1", pages: 1 } as never);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as never);
      vi.mocked(prisma.page.count).mockResolvedValue(1);
      vi.mocked(prisma.page.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.page.create).mockResolvedValue({ id: "p2" } as never);
      vi.mocked(prisma.site.update).mockResolvedValue({} as never);

      await createPage({ siteId: "s1", name: "Contact" });
      const blocks = vi.mocked(prisma.page.create).mock.calls.at(-1)![0].data.blocks as { id: string; children: unknown[] };
      expect(Array.isArray(blocks)).toBe(false);
      expect(blocks.id).not.toBe("root");
      expect(blocks.children).toEqual([]);
    });

    it("throws PAGE_LIMIT when at plan limit", async () => {
      const { createPage } = await import("@/server/services/page.service");
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", workspaceId: "ws1", pages: 10 } as never);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as never);
      vi.mocked(prisma.page.count).mockResolvedValue(10);

      await expect(createPage({ siteId: "s1", name: "Too Many" })).rejects.toThrow("PAGE_LIMIT");
    });
  });

  describe("updatePage", () => {
    it("updates page fields", async () => {
      const { updatePage } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.findFirst).mockResolvedValue({ id: "p1", siteId: "s1", updatedAt: new Date("2026-03-24T00:00:00Z") } as never);
      vi.mocked(prisma.page.update).mockResolvedValue({ id: "p1", name: "Updated Home" } as never);

      const result = await updatePage({ pageId: "p1", siteId: "s1", name: "Updated Home" });
      expect(result.name).toBe("Updated Home");
    });

    it("throws CONFLICT on optimistic lock failure", async () => {
      const { updatePage } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.findFirst).mockResolvedValue({ id: "p1", siteId: "s1", updatedAt: new Date("2026-03-24T12:00:00Z") } as never);

      await expect(updatePage({
        pageId: "p1", siteId: "s1", name: "Conflict",
        updatedAt: new Date("2026-03-24T00:00:00Z"),
      })).rejects.toThrow("CONFLICT");
    });
  });

  describe("deletePage", () => {
    it("deletes page and decrements site.pages count", async () => {
      const { deletePage } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.count).mockResolvedValue(3);
      vi.mocked(prisma.page.findFirst).mockResolvedValue({ id: "p1", siteId: "s1" } as never);
      vi.mocked(prisma.page.findMany).mockResolvedValue([{ id: "p1", slug: "about" }] as never);
      vi.mocked(prisma.page.update).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(prisma.site.update).mockResolvedValue({} as never);

      await deletePage({ pageId: "p1", siteId: "s1", userId: "u1" });
      // A-21: to the trash, not out of the database.
      expect(prisma.page.delete).not.toHaveBeenCalled();
      expect(prisma.formBlock.deleteMany).not.toHaveBeenCalled();
      expect(prisma.page.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: expect.objectContaining({ deletedById: "u1", trashedSlug: "about", slug: "about~deleted~p1", deletedAt: expect.any(Date) }),
      });
      expect(prisma.site.update).toHaveBeenCalled();
    });

    it("throws LAST_PAGE when only 1 page remains", async () => {
      const { deletePage } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.count).mockResolvedValue(1);
      vi.mocked(prisma.page.findFirst).mockResolvedValue({ id: "p1", siteId: "s1" } as never);

      await expect(deletePage({ pageId: "p1", siteId: "s1", userId: "u1" })).rejects.toThrow("LAST_PAGE");
    });
  });

  /* The router's EDITOR gate runs against input.siteId. A page id from another
     site must not ride through on it (audit 2026-09-24). */
  describe("site binding", () => {
    it("updatePage refuses a page that belongs to another site", async () => {
      const { updatePage } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.update).mockClear();
      vi.mocked(prisma.page.findFirst).mockResolvedValue({ id: "p9", siteId: "other", updatedAt: new Date() } as never);
      await expect(updatePage({ pageId: "p9", siteId: "s1", name: "x" })).rejects.toThrow("NOT_FOUND");
      expect(prisma.page.update).not.toHaveBeenCalled();
    });

    it("deletePage refuses a page that belongs to another site", async () => {
      const { deletePage } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.delete).mockClear();
      vi.mocked(prisma.page.count).mockResolvedValue(3);
      vi.mocked(prisma.page.findFirst).mockResolvedValue({ id: "p9", siteId: "other" } as never);
      await expect(deletePage({ pageId: "p9", siteId: "s1", userId: "u1" })).rejects.toThrow("NOT_FOUND");
      expect(prisma.page.delete).not.toHaveBeenCalled();
    });
  });
});
