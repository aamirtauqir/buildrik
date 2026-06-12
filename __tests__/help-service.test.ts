import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    helpArticle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    supportTicket: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Help Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("listCategories()", () => {
    it("returns 6 categories", async () => {
      const { listCategories } = await import("@/server/services/help.service");
      const result = listCategories();
      expect(result).toHaveLength(6);
      expect(result[0]).toHaveProperty("key");
      expect(result[0]).toHaveProperty("label");
      expect(result[0]).toHaveProperty("icon");
    });
  });

  describe("searchArticles(query)", () => {
    it("returns matching articles from prisma", async () => {
      const { searchArticles } = await import("@/server/services/help.service");
      vi.mocked(prisma.helpArticle.findMany).mockResolvedValue([
        {
          id: "art1",
          title: "Getting Started Guide",
          slug: "getting-started",
          category: "getting-started",
          excerpt: "Learn how to begin",
          readTime: 3,
          content: "...",
          helpfulYes: 0,
          helpfulNo: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);
      const result = await searchArticles("getting started");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Getting Started Guide");
      expect(prisma.helpArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.any(Object) })
      );
    });

    it("returns empty array when no matches", async () => {
      const { searchArticles } = await import("@/server/services/help.service");
      vi.mocked(prisma.helpArticle.findMany).mockResolvedValue([]);
      const result = await searchArticles("xyznonexistent");
      expect(result).toHaveLength(0);
    });
  });

  describe("getArticle(slug)", () => {
    it("returns article by slug", async () => {
      const { getArticle } = await import("@/server/services/help.service");
      vi.mocked(prisma.helpArticle.findUnique).mockResolvedValue({
        id: "art1",
        title: "Getting Started",
        slug: "getting-started",
        category: "getting-started",
        content: "Full content here",
        excerpt: "Short excerpt",
        readTime: 5,
        helpfulYes: 10,
        helpfulNo: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      const article = await getArticle("getting-started");
      expect(article).not.toBeNull();
      expect(article!.slug).toBe("getting-started");
      expect(article!.title).toBe("Getting Started");
    });

    it("returns null when article not found", async () => {
      const { getArticle } = await import("@/server/services/help.service");
      vi.mocked(prisma.helpArticle.findUnique).mockResolvedValue(null);
      const article = await getArticle("nonexistent-slug");
      expect(article).toBeNull();
    });
  });

  describe("submitFeedback(articleId, helpful)", () => {
    it("increments helpfulYes when helpful is true", async () => {
      const { submitFeedback } = await import("@/server/services/help.service");
      vi.mocked(prisma.helpArticle.update).mockResolvedValue({} as any);
      await submitFeedback("art1", true);
      expect(prisma.helpArticle.update).toHaveBeenCalledWith({
        where: { id: "art1" },
        data: { helpfulYes: { increment: 1 } },
      });
    });

    it("increments helpfulNo when helpful is false", async () => {
      const { submitFeedback } = await import("@/server/services/help.service");
      vi.mocked(prisma.helpArticle.update).mockResolvedValue({} as any);
      await submitFeedback("art1", false);
      expect(prisma.helpArticle.update).toHaveBeenCalledWith({
        where: { id: "art1" },
        data: { helpfulNo: { increment: 1 } },
      });
    });
  });

  describe("createTicket(userId, input)", () => {
    it("creates a support ticket", async () => {
      const { createTicket } = await import("@/server/services/help.service");
      vi.mocked(prisma.supportTicket.create).mockResolvedValue({
        id: "ticket1",
        userId: "user1",
        subject: "My issue",
        category: "TECHNICAL",
        description: "This is a detailed description of my issue",
        status: "OPEN",
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      const ticket = await createTicket("user1", {
        subject: "My issue",
        category: "TECHNICAL",
        description: "This is a detailed description of my issue",
      });
      expect(ticket.id).toBe("ticket1");
      expect(ticket.status).toBe("OPEN");
      expect(prisma.supportTicket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user1",
          subject: "My issue",
          category: "TECHNICAL",
          status: "OPEN",
          attachments: [],
        }),
      });
    });

    // Regression: W3.8 — attachments were collected in the form then dropped
    // (service hardcoded attachments: []). Found by /codex audit 2026-06-12.
    it("persists provided attachment URLs", async () => {
      const { createTicket } = await import("@/server/services/help.service");
      vi.mocked(prisma.supportTicket.create).mockResolvedValue({ id: "ticket2" } as any);
      await createTicket("user1", {
        subject: "With files",
        category: "BUG",
        description: "This is a detailed description with screenshots attached",
        attachments: ["https://blob.example.com/tickets/user1/a.png"],
      });
      expect(prisma.supportTicket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          attachments: ["https://blob.example.com/tickets/user1/a.png"],
        }),
      });
    });
  });
});
