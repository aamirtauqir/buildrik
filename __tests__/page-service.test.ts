import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    page: { findMany: vi.fn() },
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
});
