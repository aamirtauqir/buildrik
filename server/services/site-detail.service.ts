import { prisma } from "@/lib/prisma";
import type { SiteOverview } from "@/lib/validations/site-detail";

export async function getSiteOverview(siteId: string): Promise<SiteOverview> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      publishedUrl: true,
      lastPublishedAt: true,
      lastPublishedBy: true,
      createdAt: true,
      workspaceId: true,
    },
  });

  if (!site) throw new Error("SITE_NOT_FOUND");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [
    totalPages,
    currentMonthAgg,
    previousMonthAgg,
    teamMembers,
    formSubmissions,
    unreadSubmissions,
    recentActivity,
  ] = await Promise.all([
    prisma.page.count({ where: { siteId } }),
    prisma.siteAnalytics.aggregate({
      where: { siteId, date: { gte: thirtyDaysAgo } },
      _sum: { visitors: true },
    }),
    prisma.siteAnalytics.aggregate({
      where: { siteId, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { visitors: true },
    }),
    prisma.workspaceMember.count({
      where: { workspaceId: site.workspaceId, status: "ACTIVE" },
    }),
    prisma.formSubmission.count({ where: { siteId } }),
    prisma.formSubmission.count({ where: { siteId, isRead: false } }),
    prisma.activityLog.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, action: true, description: true, createdAt: true },
    }),
  ]);

  const monthlyVisitors = currentMonthAgg._sum.visitors ?? 0;
  const previousVisitors = previousMonthAgg._sum.visitors ?? 0;
  const visitorsChange = previousVisitors > 0
    ? Math.round(((monthlyVisitors - previousVisitors) / previousVisitors) * 100)
    : 0;

  const hasPages = totalPages > 0;
  const hasPublished = site.status === "PUBLISHED";
  const hasDomain = !!site.publishedUrl;
  const healthScore = Math.round(
    ((hasPages ? 40 : 0) + (hasPublished ? 30 : 0) + (hasDomain ? 30 : 0))
  );

  return {
    site: {
      id: site.id,
      name: site.name,
      slug: site.slug,
      status: site.status,
      publishedUrl: site.publishedUrl,
      lastPublishedAt: site.lastPublishedAt,
      lastPublishedBy: site.lastPublishedBy,
      createdAt: site.createdAt,
    },
    stats: {
      totalPages,
      monthlyVisitors,
      visitorsChange,
      teamMembers,
      formSubmissions,
      unreadSubmissions,
      healthScore,
    },
    recentActivity,
  };
}
