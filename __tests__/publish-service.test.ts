import { describe, it, expect, vi, beforeEach } from "vitest";

// Prevent startPublish from making real HTTP calls to the worker
vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    page: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    domain: {
      findFirst: vi.fn(),
    },
    publishBuildJob: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

// Sites deploy into the workspace's OWN Vercel account, so runPrePublishChecks
// hard-fails without a connection and startPublish refuses to queue. Mocked at
// the service boundary rather than at prisma so tests don't have to build a
// well-formed encrypted-token row.
vi.mock("@server/services/integrations.service", () => ({
  getActiveVercelConnection: vi.fn(),
  markInactive: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getActiveVercelConnection } from "@server/services/integrations.service";
import {
  runPrePublishChecks,
  startPublish,
  getPublishStatus,
  cancelPublish,
  completePublish,
  unpublishSite,
} from "@/server/services/publish.service";

const VERCEL_CONNECTED = { token: "t", teamId: null };

describe("Publish Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: the workspace HAS Vercel connected. Tests that care about the
    // missing-connection path override this explicitly.
    vi.mocked(getActiveVercelConnection).mockResolvedValue(VERCEL_CONNECTED as never);
  });

  describe("runPrePublishChecks", () => {
    // The check that did not exist. Without a Vercel connection the worker
    // reached runVercelDeploy and threw VERCEL_NOT_CONNECTED — but only after
    // the job had queued, shown a progress bar and marked the site PUBLISHING.
    it("hard-fails when the workspace has no Vercel connection", async () => {
      vi.mocked(getActiveVercelConnection).mockResolvedValue(null);
      vi.mocked(prisma.page.count).mockResolvedValue(3);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        metaTitleTemplate: "t",
        touchIcon: "i",
        deletedAt: null,
        workspaceId: "w1",
      } as never);
      vi.mocked(prisma.domain.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.page.findMany).mockResolvedValue([] as never);

      const result = await runPrePublishChecks("site-1");

      expect(result.ready).toBe(false);
      const vercel = result.checks.find((c) => c.label === "Vercel connected");
      expect(vercel?.status).toBe("fail");
    });

    it("fails when site has no pages", async () => {
      vi.mocked(prisma.page.count).mockResolvedValue(0);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1",
        metaTitleTemplate: null,
        touchIcon: null,
      } as any);
      vi.mocked(prisma.domain.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.page.findMany).mockResolvedValue([]);

      const result = await runPrePublishChecks("s1");
      expect(result.ready).toBe(false);
      const pageCheck = result.checks.find((c) => c.label === "Pages ready");
      expect(pageCheck?.status).toBe("fail");
    });

    it("passes when site has pages and warns about SEO", async () => {
      vi.mocked(prisma.page.count).mockResolvedValue(3);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1",
        metaTitleTemplate: null,
        touchIcon: null,
      } as any);
      vi.mocked(prisma.domain.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.page.findMany).mockResolvedValue([]);

      const result = await runPrePublishChecks("s1");
      expect(result.ready).toBe(true);
      const seoCheck = result.checks.find((c) => c.label === "SEO configured");
      expect(seoCheck?.status).toBe("warning");
    });

    it("checks domain connection", async () => {
      vi.mocked(prisma.page.count).mockResolvedValue(1);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1",
        metaTitleTemplate: "Title",
        touchIcon: "/favicon.png",
      } as any);
      vi.mocked(prisma.domain.findFirst).mockResolvedValue({
        id: "d1",
        domain: "example.com",
        status: "VERIFIED",
      } as any);
      vi.mocked(prisma.page.findMany).mockResolvedValue([]);

      const result = await runPrePublishChecks("s1");
      const domainCheck = result.checks.find((c) => c.label === "Domain connected");
      expect(domainCheck?.status).toBe("pass");
    });

    it("warns about empty pages", async () => {
      vi.mocked(prisma.page.count).mockResolvedValue(3);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1",
        metaTitleTemplate: "Title",
        touchIcon: "/fav.png",
      } as any);
      vi.mocked(prisma.domain.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.page.findMany).mockResolvedValue([
        { id: "p1", name: "About", blocks: [] },
      ] as any);

      const result = await runPrePublishChecks("s1");
      const emptyCheck = result.checks.find((c) => c.label === "Empty pages");
      expect(emptyCheck?.status).toBe("warning");
      expect(emptyCheck?.detail).toContain("1");
    });

    it("warns about missing favicon", async () => {
      vi.mocked(prisma.page.count).mockResolvedValue(2);
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1",
        metaTitleTemplate: "T",
        touchIcon: null,
      } as any);
      vi.mocked(prisma.domain.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.page.findMany).mockResolvedValue([]);

      const result = await runPrePublishChecks("s1");
      const faviconCheck = result.checks.find((c) => c.label === "Favicon");
      expect(faviconCheck?.status).toBe("warning");
    });
  });

  describe("startPublish", () => {
    it("creates a job and updates site status", async () => {
      vi.mocked(prisma.publishBuildJob.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.publishBuildJob.create).mockResolvedValue({
        id: "job1",
        siteId: "s1",
        workspaceId: "ws1",
        status: "QUEUED",
        progress: 0,
      } as any);
      vi.mocked(prisma.site.update).mockResolvedValue({ id: "s1" } as any);

      const job = await startPublish("s1", "ws1", "user1");
      expect(job.id).toBe("job1");
      expect(prisma.site.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "s1" },
          data: expect.objectContaining({
            status: "PUBLISHING",
            lastPublishedBy: "user1",
          }),
        })
      );
    });

    it("throws when already publishing", async () => {
      vi.mocked(prisma.publishBuildJob.findFirst).mockResolvedValue({
        id: "existing",
        status: "BUILDING",
      } as any);

      await expect(startPublish("s1", "ws1", "user1")).rejects.toThrow("ALREADY_PUBLISHING");
    });
  });

  describe("getPublishStatus", () => {
    it("returns job status", async () => {
      vi.mocked(prisma.publishBuildJob.findUnique).mockResolvedValue({
        id: "job1",
        status: "BUILDING",
        progress: 40,
        steps: [],
        error: null,
      } as any);

      const job = await getPublishStatus("job1");
      expect(job?.status).toBe("BUILDING");
      expect(job?.progress).toBe(40);
    });
  });

  describe("cancelPublish", () => {
    it("cancels a QUEUED job", async () => {
      vi.mocked(prisma.publishBuildJob.findUnique).mockResolvedValue({
        id: "job1",
        status: "QUEUED",
      } as any);
      vi.mocked(prisma.publishBuildJob.update).mockResolvedValue({
        id: "job1",
        status: "CANCELLED",
      } as any);

      const job = await cancelPublish("job1");
      expect(job.status).toBe("CANCELLED");
    });

    it("throws when job is not cancellable", async () => {
      vi.mocked(prisma.publishBuildJob.findUnique).mockResolvedValue({
        id: "job1",
        status: "COMPLETED",
      } as any);

      await expect(cancelPublish("job1")).rejects.toThrow("NOT_CANCELLABLE");
    });
  });

  describe("completePublish", () => {
    it("marks job completed and sets publishedUrl on site", async () => {
      vi.mocked(prisma.publishBuildJob.findUnique).mockResolvedValue({
        id: "job1",
        siteId: "s1",
      } as any);
      vi.mocked(prisma.publishBuildJob.update).mockResolvedValue({
        id: "job1",
        status: "COMPLETED",
      } as any);
      vi.mocked(prisma.site.update).mockResolvedValue({ id: "s1" } as any);

      const job = await completePublish("job1", "https://example.buildrik.com");
      expect(job.status).toBe("COMPLETED");
      expect(prisma.site.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ publishedUrl: "https://example.buildrik.com" }),
        })
      );
    });
  });

  describe("unpublishSite", () => {
    it("sets site to DRAFT and clears publishedUrl", async () => {
      vi.mocked(prisma.site.update).mockResolvedValue({
        id: "s1",
        status: "DRAFT",
        publishedUrl: null,
      } as any);

      const site = await unpublishSite("s1");
      expect(site.status).toBe("DRAFT");
      expect(prisma.site.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "DRAFT", publishedUrl: null },
        })
      );
    });
  });
});
