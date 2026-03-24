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
      touchIcon: true,
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
    pagesWithSeo,
    pagesWithContent,
    sslDomain,
    formBlocks,
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
    prisma.page.count({
      where: { siteId, seoTitle: { not: null }, seoDescription: { not: null } },
    }),
    prisma.page.count({
      where: { siteId, NOT: { blocks: { equals: [] } } },
    }),
    prisma.domain.findFirst({ where: { siteId, sslStatus: "ACTIVE" } }),
    prisma.formBlock.findMany({
      where: { siteId, isActive: true },
      select: { id: true, name: true, _count: { select: { submissions: true } } },
    }),
  ]);

  const monthlyVisitors = currentMonthAgg._sum.visitors ?? 0;
  const previousVisitors = previousMonthAgg._sum.visitors ?? 0;
  const visitorsChange = previousVisitors > 0
    ? Math.round(((monthlyVisitors - previousVisitors) / previousVisitors) * 100)
    : 0;

  const seoScore = totalPages > 0 ? Math.round((pagesWithSeo / totalPages) * 100) : 0;
  const contentScore = totalPages > 0 ? Math.round((pagesWithContent / totalPages) * 100) : 0;
  const sslScore = sslDomain ? 100 : 0;
  const faviconScore = site.touchIcon ? 100 : 0;
  const healthScore = Math.round(seoScore * 0.3 + contentScore * 0.3 + sslScore * 0.2 + faviconScore * 0.2);

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
      healthBreakdown: { seo: seoScore, content: contentScore, ssl: sslScore, favicon: faviconScore },
    },
    formBlocks,
    recentActivity,
  };
}
