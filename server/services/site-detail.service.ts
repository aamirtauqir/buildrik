import { prisma } from "@/lib/prisma";
import type { SiteOverview } from "@buildrik/shared/schemas/site-detail";

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
      favicon: true,
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
    /* SEO health used to count pages whose `seoTitle` AND `seoDescription`
       COLUMNS were set. The editor writes a page's SEO into its `settings`
       JSON — checked in the database: settings.seo populated, both columns
       null — so this scored 0% for every site built in the editor, which is
       every site. Read both and decide in JS; a site's page count is tens, not
       thousands. */
    prisma.page.findMany({
      where: { siteId },
      select: { seoTitle: true, seoDescription: true, settings: true },
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

  const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  const pagesWithSeoCount = pagesWithSeo.filter((page) => {
    const seo =
      typeof page.settings === "object" && page.settings !== null
        ? ((page.settings as { seo?: Record<string, unknown> }).seo ?? {})
        : {};
    const title = filled(seo.metaTitle) ? seo.metaTitle : page.seoTitle;
    const description = filled(seo.metaDescription) ? seo.metaDescription : page.seoDescription;
    return filled(title) && filled(description);
  }).length;

  const seoScore = totalPages > 0 ? Math.round((pagesWithSeoCount / totalPages) * 100) : 0;
  const contentScore = totalPages > 0 ? Math.round((pagesWithContent / totalPages) * 100) : 0;
  const sslScore = sslDomain ? 100 : 0;
  /* Scored on `touchIcon` alone while calling itself "favicon", so a site with
     a favicon and no Apple touch icon read 0 on a row that names the thing it
     has. Either counts. */
  const faviconScore = site.favicon || site.touchIcon ? 100 : 0;
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
