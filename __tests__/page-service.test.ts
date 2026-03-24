import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    page: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    site: { findUnique: vi.fn(), update: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    formSubmission: { deleteMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Page Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("listPages", () => {
    it("returns pages ordered by position without blocks", async () => {
      const { listPages } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.findMany).mockResolvedValue([
        { id: "p1", siteId: "s1", name: "Home", slug: "home", position: 0, isHomePage: true, seoTitle: null, seoDescription: null, updatedAt: new Date(), createdAt: new Date() },
        { id: "p2", siteId: "s1", name: "About", slug: "about", position: 1, isHomePage: false, seoTitle: null, seoDescription: null, updatedAt: new Date(), createdAt: new Date() },
      ] as any);
      const result = await listPages("s1");
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Home");
    });
  });

  describe("createPage", () => {
    it("creates page and increments site.pages count", async () => {
      const { createPage } = await import("@/server/services/page.service");
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", workspaceId: "ws1", pages: 3 } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.page.count).mockResolvedValue(3);
      vi.mocked(prisma.page.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.page.create).mockResolvedValue({ id: "p3", name: "Contact", slug: "contact", position: 3 } as any);
      vi.mocked(prisma.site.update).mockResolvedValue({} as any);

      const result = await createPage({ siteId: "s1", name: "Contact" });
      expect(result.name).toBe("Contact");
      expect(prisma.site.update).toHaveBeenCalled();
    });

    it("throws PAGE_LIMIT when at plan limit", async () => {
      const { createPage } = await import("@/server/services/page.service");
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", workspaceId: "ws1", pages: 10 } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.page.count).mockResolvedValue(10);

      await expect(createPage({ siteId: "s1", name: "Too Many" })).rejects.toThrow("PAGE_LIMIT");
    });
  });

  describe("updatePage", () => {
    it("updates page fields", async () => {
      const { updatePage } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.findUnique).mockResolvedValue({ id: "p1", updatedAt: new Date("2026-03-24T00:00:00Z") } as any);
      vi.mocked(prisma.page.update).mockResolvedValue({ id: "p1", name: "Updated Home" } as any);

      const result = await updatePage({ pageId: "p1", siteId: "s1", name: "Updated Home" });
      expect(result.name).toBe("Updated Home");
    });

    it("throws CONFLICT on optimistic lock failure", async () => {
      const { updatePage } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.findUnique).mockResolvedValue({ id: "p1", updatedAt: new Date("2026-03-24T12:00:00Z") } as any);

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
      vi.mocked(prisma.page.findUnique).mockResolvedValue({ id: "p1", siteId: "s1" } as any);
      vi.mocked(prisma.formSubmission.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.page.delete).mockResolvedValue({ id: "p1" } as any);
      vi.mocked(prisma.site.update).mockResolvedValue({} as any);

      await deletePage({ pageId: "p1", siteId: "s1" });
      expect(prisma.page.delete).toHaveBeenCalled();
      expect(prisma.site.update).toHaveBeenCalled();
    });

    it("throws LAST_PAGE when only 1 page remains", async () => {
      const { deletePage } = await import("@/server/services/page.service");
      vi.mocked(prisma.page.count).mockResolvedValue(1);

      await expect(deletePage({ pageId: "p1", siteId: "s1" })).rejects.toThrow("LAST_PAGE");
    });
  });
});
