import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    template: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn() },
    site: { create: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
    page: { createMany: vi.fn() },
    aIGenerationJob: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), count: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    workspace: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Template Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("listTemplates", () => {
    it("returns paginated templates", async () => {
      const { listTemplates } = await import("@/server/services/template.service");
      vi.mocked(prisma.template.count).mockResolvedValue(10);
      vi.mocked(prisma.template.findMany).mockResolvedValue([
        { id: "t1", name: "Portfolio Pro", slug: "portfolio-pro", category: "PORTFOLIO", description: "A pro portfolio", thumbnail: null, previewUrl: null, usageCount: 500, isActive: true, pages: [], createdAt: new Date(), updatedAt: new Date() },
      ] as any);
      const result = await listTemplates({ category: "ALL", page: 1, perPage: 6, sort: "popular" });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(10);
    });
  });

  describe("getTemplate", () => {
    it("returns template by id", async () => {
      const { getTemplate } = await import("@/server/services/template.service");
      // getTemplate uses a workspace-scoped findFirst (not findUnique) so a
      // private template can't leak by id across workspaces.
      vi.mocked(prisma.template.findFirst).mockResolvedValue({
        id: "t1", name: "Portfolio Pro", slug: "portfolio-pro", category: "PORTFOLIO",
        description: "A pro portfolio", thumbnail: null, previewUrl: null, pages: [{ name: "Home", slug: "home", blocks: [] }],
        usageCount: 500, isActive: true, createdAt: new Date(), updatedAt: new Date(),
      } as any);
      const result = await getTemplate("t1");
      expect(result?.name).toBe("Portfolio Pro");
    });
  });

  describe("useTemplate", () => {
    it("creates site from template", async () => {
      const { useTemplate } = await import("@/server/services/template.service");
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({ workspace: { plan: "FREE" } } as any);
      vi.mocked(prisma.site.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.template.findUnique).mockResolvedValue({
        id: "t1", name: "Portfolio Pro", slug: "portfolio-pro", pages: [
          { name: "Home", slug: "home", position: 0, isHomePage: true, blocks: [{ type: "hero", data: {} }] },
        ],
      } as any);
      vi.mocked(prisma.site.create).mockResolvedValue({
        id: "new-site", name: "My Site", slug: "my-site", status: "DRAFT",
      } as any);
      vi.mocked(prisma.page.createMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.template.update).mockResolvedValue({} as any);

      const result = await useTemplate("ws1", "u1", "t1", "My Site");
      expect(result.id).toBe("new-site");
    });
  });
});

describe("AI Generation Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("createGenerationJob", () => {
    it("creates a generation job", async () => {
      const { createGenerationJob } = await import("@/server/services/ai-generation.service");
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ plan: "PRO" } as any);
      vi.mocked(prisma.aIGenerationJob.count).mockResolvedValue(0);
      vi.mocked(prisma.aIGenerationJob.create).mockResolvedValue({
        id: "job1", status: "QUEUED", progress: 0, workspaceId: "ws1", userId: "u1",
        businessType: "PORTFOLIO", selectedPages: ["Home", "About"], description: null,
        steps: null, metadata: null, error: null, siteId: null,
        completedAt: null, cancelledAt: null, createdAt: new Date(),
      } as any);
      const result = await createGenerationJob("ws1", "u1", {
        name: "My AI Site", businessType: "PORTFOLIO", pages: ["Home", "About"],
      });
      expect(result.id).toBe("job1");
      expect(result.status).toBe("QUEUED");
    });

    it("throws when rate limited (3/hr)", async () => {
      const { createGenerationJob } = await import("@/server/services/ai-generation.service");
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ plan: "PRO" } as any);
      vi.mocked(prisma.aIGenerationJob.count)
        .mockResolvedValueOnce(0)  // monthly check passes
        .mockResolvedValueOnce(3); // hourly check hits limit
      await expect(createGenerationJob("ws1", "u1", {
        name: "My AI Site", businessType: "PORTFOLIO", pages: ["Home"],
      })).rejects.toThrow("AI_RATE_LIMITED");
    });
  });

  describe("getJobStatus", () => {
    it("returns job status scoped to the workspace", async () => {
      const { getJobStatus } = await import("@/server/services/ai-generation.service");
      vi.mocked(prisma.aIGenerationJob.findFirst).mockResolvedValue({
        id: "job1", status: "GENERATING_CONTENT", progress: 50,
        steps: [{ step: "structure", status: "completed" }],
        siteId: null, error: null,
      } as any);
      const result = await getJobStatus("job1", "ws1");
      expect(result?.status).toBe("GENERATING_CONTENT");
      expect(result?.progress).toBe(50);
      // IDOR guard: the lookup must filter by workspaceId, not just job id
      const where = vi.mocked(prisma.aIGenerationJob.findFirst).mock.calls[0][0]?.where;
      expect(where).toMatchObject({ id: "job1", workspaceId: "ws1" });
    });
  });

  describe("cancelJob", () => {
    it("cancels a queued job scoped to the workspace", async () => {
      const { cancelJob } = await import("@/server/services/ai-generation.service");
      vi.mocked(prisma.aIGenerationJob.findFirst).mockResolvedValue({
        id: "job1", status: "QUEUED",
      } as any);
      vi.mocked(prisma.aIGenerationJob.update).mockResolvedValue({
        id: "job1", status: "CANCELLED",
      } as any);
      const result = await cancelJob("job1", "ws1");
      expect(result.status).toBe("CANCELLED");
      const where = vi.mocked(prisma.aIGenerationJob.findFirst).mock.calls[0][0]?.where;
      expect(where).toMatchObject({ id: "job1", workspaceId: "ws1" });
    });
  });
});
