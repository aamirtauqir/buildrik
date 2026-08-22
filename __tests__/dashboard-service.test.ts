import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { count: vi.fn(), findMany: vi.fn() },
    workspaceMember: { count: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    invite: { count: vi.fn() },
    user: { findMany: vi.fn() },
    activityLog: { findMany: vi.fn() },
    siteAnalytics: { aggregate: vi.fn(), findMany: vi.fn() },
    aIGenerationJob: { count: vi.fn() },
    mediaAsset: { aggregate: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getDashboardStats,
  getRecentSites,
  getActivityFeed,
  getWorkspaceHealth,
  getQuickActions,
} from "@/server/services/dashboard.service";

describe("Dashboard Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDashboardStats", () => {
    it("returns correct stat structure", async () => {
      vi.mocked(prisma.site.count)
        .mockResolvedValueOnce(5)   // totalSites
        .mockResolvedValueOnce(3)   // publishedSites
        .mockResolvedValueOnce(1)   // draftSites
        .mockResolvedValueOnce(1);  // archivedSites
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(3);
      vi.mocked(prisma.invite.count).mockResolvedValue(1);
      vi.mocked(prisma.siteAnalytics.aggregate)
        .mockResolvedValueOnce({ _sum: { visitors: 1200 } } as any)   // current period
        .mockResolvedValueOnce({ _sum: { visitors: 800 } } as any);   // previous period
      vi.mocked(prisma.siteAnalytics.findMany).mockResolvedValue([]);  // daily analytics
      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([]); // member avatars
      vi.mocked(prisma.site.findMany).mockResolvedValue([
        { name: "Portfolio", lastPublishedAt: new Date("2026-03-20") },
      ] as any);

      const stats = await getDashboardStats("ws_123", "OWNER");
      expect(stats.totalSites).toBe(5);
      expect(stats.publishedSites).toBe(3);
      expect(stats.collaborators).toBe(3);
      expect(stats.pendingInvites).toBe(1);
      expect(stats.lastPublishedSiteName).toBe("Portfolio");
    });
  });

  describe("getRecentSites", () => {
    it("returns sites ordered by lastEditedAt", async () => {
      const mockSites = [
        {
          id: "s1",
          name: "Site 1",
          slug: "site-1",
          status: "PUBLISHED",
          thumbnail: null,
          pages: 5,
          lastEditedAt: new Date(),
          publishedUrl: "https://site-1.buildrik.app",
        },
      ];
      vi.mocked(prisma.site.findMany).mockResolvedValue(mockSites as any);
      const sites = await getRecentSites("ws_123");
      expect(sites).toHaveLength(1);
      expect(sites[0].id).toBe("s1");
    });
  });

  describe("getActivityFeed", () => {
    it("returns activity entries", async () => {
      vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
        {
          id: "a1",
          action: "SITE_PUBLISHED",
          actorId: "u1",
          description: 'Published "Portfolio"',
          siteId: "s1",
          createdAt: new Date(),
          metadata: null,
        },
      ] as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: "u1", fullName: "Test User", avatar: null },
      ] as any);
      const activity = await getActivityFeed("ws_123");
      expect(activity.groups).toBeDefined();
    });
  });

  describe("getQuickActions", () => {
    it("returns new user actions when 0 sites", () => {
      const actions = getQuickActions({
        siteCount: 0,
        hasPendingInvites: false,
        isNearLimit: false,
        isDunning: false,
      });
      expect(actions).toHaveLength(4);
      expect(actions[0].label).toBe("Create Site");
    });
    it("returns active user actions when 5+ sites", () => {
      const actions = getQuickActions({
        siteCount: 5,
        hasPendingInvites: false,
        isNearLimit: false,
        isDunning: false,
      });
      expect(actions[0].label).toBe("New Site");
    });
    it("returns near-limit actions", () => {
      const actions = getQuickActions({
        siteCount: 3,
        hasPendingInvites: false,
        isNearLimit: true,
        isDunning: false,
      });
      expect(
        actions.some((a: { label: string }) => a.label === "Upgrade Plan")
      ).toBe(true);
    });
    it("returns dunning actions", () => {
      const actions = getQuickActions({
        siteCount: 5,
        hasPendingInvites: false,
        isNearLimit: false,
        isDunning: true,
      });
      expect(actions[0].label).toBe("Update Payment");
    });
  });

  describe("getWorkspaceHealth", () => {
    it("returns health metrics", async () => {
      vi.mocked(prisma.site.count).mockResolvedValue(2);
      vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }] as any);
      vi.mocked(prisma.mediaAsset.aggregate).mockResolvedValue({ _sum: { bytes: 5 * 1024 * 1024 } } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        workspace: { plan: "FREE" },
      } as any);
      vi.mocked(prisma.aIGenerationJob.count).mockResolvedValue(1);
      const health = await getWorkspaceHealth("ws_123", "u1");
      expect(health.sites.used).toBe(2);
      expect(health.sites.limit).toBe(3);
      expect(health.aiCredits.used).toBe(1);
      expect(health.storage.usedMB).toBe(5); // real storage from media bytes
    });

    it("does not meter storage held by deleted sites", async () => {
      vi.mocked(prisma.site.count).mockResolvedValue(1);
      vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }] as any);
      vi.mocked(prisma.mediaAsset.aggregate).mockResolvedValue({ _sum: { bytes: 0 } } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        workspace: { plan: "FREE" },
      } as any);
      vi.mocked(prisma.aIGenerationJob.count).mockResolvedValue(0);
      await getWorkspaceHealth("ws_123", "u1");
      // The site COUNT beside it has always been scoped this way; the id list
      // feeding the storage sum was not, so a deleted site kept charging for
      // its media forever.
      expect(prisma.site.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workspaceId: "ws_123", deletedAt: null } }),
      );
    });

    it("reports the caller's role, so the UI can tell who may upgrade", async () => {
      vi.mocked(prisma.site.count).mockResolvedValue(1);
      vi.mocked(prisma.site.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.mediaAsset.aggregate).mockResolvedValue({ _sum: { bytes: 0 } } as any);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        role: "EDITOR",
        workspace: { plan: "FREE" },
      } as any);
      vi.mocked(prisma.aIGenerationJob.count).mockResolvedValue(0);
      const health = await getWorkspaceHealth("ws_123", "u1");
      expect(health.role).toBe("EDITOR");
    });
  });
});
