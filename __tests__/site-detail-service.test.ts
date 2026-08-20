import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    page: { count: vi.fn(), findMany: vi.fn() },
    siteAnalytics: { aggregate: vi.fn(), findMany: vi.fn() },
    activityLog: { findMany: vi.fn() },
    workspaceMember: { count: vi.fn() },
    formSubmission: { count: vi.fn() },
    formBlock: { findMany: vi.fn() },
    redirect: { findMany: vi.fn(), create: vi.fn(), createMany: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    domain: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    workspace: { findUnique: vi.fn() },
    shareLink: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    analyticsEvent: { findMany: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
    dnsRecord: { createMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Site Detail Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("getSiteOverview", () => {
    it("returns site with stats and activity", async () => {
      const { getSiteOverview } = await import("@/server/services/site-detail.service");
      vi.mocked(prisma.site.findUnique).mockResolvedValue({
        id: "s1", name: "Portfolio", slug: "portfolio", status: "PUBLISHED",
        publishedUrl: "https://portfolio.buildrik.app", lastPublishedAt: new Date(),
        lastPublishedBy: null, createdAt: new Date(), workspaceId: "ws1", touchIcon: null,
      } as any);
      vi.mocked(prisma.page.count)
        .mockResolvedValueOnce(5)   // totalPages
        .mockResolvedValueOnce(4);  // pagesWithContent
      /* SEO health reads the rows now, not a count: the editor writes a page's
         SEO into its `settings` JSON, so counting the seoTitle/seoDescription
         COLUMNS scored 0% for every editor-built site. */
      vi.mocked(prisma.page.findMany).mockResolvedValue([
        { seoTitle: null, seoDescription: null, settings: { seo: { metaTitle: "T", metaDescription: "D" } } },
        { seoTitle: "T", seoDescription: "D", settings: null },
        { seoTitle: null, seoDescription: null, settings: null },
      ] as any);
      vi.mocked(prisma.siteAnalytics.aggregate)
        .mockResolvedValueOnce({ _sum: { visitors: 300 } } as any)   // current month
        .mockResolvedValueOnce({ _sum: { visitors: 200 } } as any);  // previous month
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(3);
      vi.mocked(prisma.formSubmission.count).mockResolvedValueOnce(15).mockResolvedValueOnce(4);
      vi.mocked(prisma.activityLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.domain.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.formBlock.findMany).mockResolvedValue([]);

      const result = await getSiteOverview("s1");
      expect(result.site.name).toBe("Portfolio");
      expect(result.stats.totalPages).toBe(5);
      expect(result.stats.monthlyVisitors).toBe(300);
      expect(result.stats.teamMembers).toBe(3);
      expect(result.stats.formSubmissions).toBe(15);
      expect(result.stats.unreadSubmissions).toBe(4);
      // 2 of 5 pages carry both a title and a description.
      expect(result.stats.healthBreakdown.seo).toBe(40);
    });
  });

  describe("updateSiteSettings", () => {
    it("updates site fields", async () => {
      const { updateSiteSettings } = await import("@/server/services/site-settings.service");
      vi.mocked(prisma.site.update).mockResolvedValue({ id: "s1", name: "New Name" } as any);
      const result = await updateSiteSettings("s1", { name: "New Name" });
      expect(result.name).toBe("New Name");
    });
  });

  describe("Redirect Service", () => {
    it("listRedirects returns redirects for site", async () => {
      const { listRedirects } = await import("@/server/services/redirect.service");
      vi.mocked(prisma.redirect.findMany).mockResolvedValue([
        { id: "r1", siteId: "s1", fromPath: "/old", toUrl: "/new", type: "301", createdAt: new Date() },
      ] as any);
      const result = await listRedirects("s1");
      expect(result).toHaveLength(1);
    });

    it("createRedirect adds new redirect", async () => {
      const { createRedirect } = await import("@/server/services/redirect.service");
      vi.mocked(prisma.redirect.count).mockResolvedValue(5);
      vi.mocked(prisma.redirect.create).mockResolvedValue({
        id: "r2", siteId: "s1", fromPath: "/old", toUrl: "/new", type: "301",
      } as any);
      const result = await createRedirect("s1", { fromPath: "/old", toUrl: "/new", type: "301" }, "FREE");
      expect(result.fromPath).toBe("/old");
    });

    it("importRedirects rejects malformed rows with the offending line number", async () => {
      const { importRedirects } = await import("@/server/services/redirect.service");
      const csv = "from,to,type\n/ok,https://x.com,301\nbroken-row-no-comma";
      await expect(importRedirects("s1", csv, "FREE")).rejects.toThrow("INVALID_CSV_ROW:3");
    });

    it("importRedirects rejects fromPath without leading slash", async () => {
      const { importRedirects } = await import("@/server/services/redirect.service");
      const csv = "from,to,type\nno-slash,https://x.com,301";
      await expect(importRedirects("s1", csv, "FREE")).rejects.toThrow("INVALID_CSV_ROW:2");
    });

    it("importRedirects round-trips its own quoted export format", async () => {
      const { importRedirects } = await import("@/server/services/redirect.service");
      vi.mocked(prisma.redirect.count).mockResolvedValue(0);
      vi.mocked(prisma.redirect.createMany).mockResolvedValue({ count: 1 } as any);
      const csv = 'from,to,type\n"/old","https://x.com","302"';
      await importRedirects("s1", csv, "FREE");
      const data = vi.mocked(prisma.redirect.createMany).mock.calls[0][0]!.data;
      expect(data).toEqual([{ siteId: "s1", fromPath: "/old", toUrl: "https://x.com", type: "302" }]);
    });

    it("exportRedirects neutralizes formula payloads", async () => {
      const { exportRedirects } = await import("@/server/services/redirect.service");
      vi.mocked(prisma.redirect.findMany).mockResolvedValue([
        { id: "r1", siteId: "s1", fromPath: "/a", toUrl: "=HYPERLINK(\"http://evil\")", type: "301", createdAt: new Date() },
      ] as any);
      const csv = await exportRedirects("s1");
      expect(csv).toContain(`"'=HYPERLINK`);
    });
  });

  describe("Domain Service", () => {
    it("listDomains returns domains for site", async () => {
      const { listDomains } = await import("@/server/services/domain.service");
      vi.mocked(prisma.domain.findMany).mockResolvedValue([
        { id: "d1", domain: "example.com", status: "VERIFIED", sslStatus: "ACTIVE", createdAt: new Date() },
      ] as any);
      const result = await listDomains("s1");
      expect(result).toHaveLength(1);
    });

    it("connectDomain creates domain with DNS records", async () => {
      const { connectDomain } = await import("@/server/services/domain.service");
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as any);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ plan: "PRO" } as any);
      vi.mocked(prisma.domain.count).mockResolvedValue(0);
      vi.mocked(prisma.domain.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.domain.create).mockResolvedValue({
        id: "d2", domain: "example.com", status: "PENDING", sslStatus: "PENDING",
      } as any);
      vi.mocked(prisma.dnsRecord.createMany).mockResolvedValue({ count: 2 });
      const result = await connectDomain("s1", "example.com");
      expect(result.domain).toBe("example.com");
      expect(result.status).toBe("PENDING");
    });

    it("rejects duplicate domain", async () => {
      const { connectDomain } = await import("@/server/services/domain.service");
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as any);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ plan: "PRO" } as any);
      vi.mocked(prisma.domain.count).mockResolvedValue(0);
      vi.mocked(prisma.domain.findFirst).mockResolvedValue({ id: "d1" } as any);
      await expect(connectDomain("s1", "example.com")).rejects.toThrow("DOMAIN_IN_USE");
    });
  });

  describe("Share Link Service", () => {
    it("listShareLinks returns active links", async () => {
      const { listShareLinks } = await import("@/server/services/share-link.service");
      vi.mocked(prisma.shareLink.findMany).mockResolvedValue([
        { id: "sl1", name: "Client Review", token: "abc123", viewCount: 5, isActive: true, createdAt: new Date() },
      ] as any);
      const result = await listShareLinks("s1");
      expect(result).toHaveLength(1);
    });

    it("createShareLink generates token", async () => {
      const { createShareLink } = await import("@/server/services/share-link.service");
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as any);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ id: "ws1", plan: "FREE" } as any);
      vi.mocked(prisma.shareLink.count).mockResolvedValue(0);
      vi.mocked(prisma.shareLink.create).mockResolvedValue({
        id: "sl2", name: "New Link", token: "xyz789", viewCount: 0, isActive: true,
      } as any);
      const result = await createShareLink("s1", { name: "New Link" });
      expect(result.name).toBe("New Link");
      expect(result.isActive).toBe(true);
    });
  });

  describe("Analytics Service", () => {
    it("getSiteAnalytics returns metrics", async () => {
      const { getSiteAnalytics } = await import("@/server/services/analytics.service");
      vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as any);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ id: "ws1", plan: "FREE" } as any);
      vi.mocked(prisma.siteAnalytics.findMany).mockResolvedValue([
        { date: new Date("2026-03-20"), visitors: 100, uniqueVisitors: 80, pageViews: 200, avgSession: 120, bounceRate: 0.4, topPages: null },
      ] as any);
      vi.mocked(prisma.analyticsEvent.groupBy).mockResolvedValue([]);
      // 3 device-bucket counts: mobile, tablet, desktop.
      vi.mocked(prisma.analyticsEvent.count)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(40);
      const result = await getSiteAnalytics("s1", { range: "7d", granularity: "daily" });
      expect(result.timeSeries).toHaveLength(1);
      expect(result.timeSeries[0].visitors).toBe(100);
      // Devices derived from viewport buckets; empty buckets dropped.
      expect(result.devices).toEqual([
        { device: "mobile", count: 10 },
        { device: "desktop", count: 40 },
      ]);
    });
  });
});
