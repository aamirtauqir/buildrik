import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { SettingsOverview, SiteOverview } from "@buildrik/shared/schemas/site-detail";
import { INTEGRATION_CATALOG } from "@buildrik/shared/schemas/integrations";

const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

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
    /* `actorId` is selected now. It was not, so the surface could not name who
       did anything and every row read as if the system did it — while board
       817:5114 puts the actor on every row. Taking 20 rather than 5 because
       consecutive identical entries collapse below, and 96% of this table is
       `site.settings.updated`: without headroom the de-duped list would often
       be one row long. */
    prisma.activityLog.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, action: true, description: true, createdAt: true, actorId: true },
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
    recentActivity: await shapeActivity(recentActivity),
  };
}

/**
 * Resolve actor names and collapse consecutive identical entries.
 *
 * Board 817:5114 draws an actor on every row; this surface could not show one
 * because the query dropped `actorId`. And 96% of `activity_logs` is
 * `site.settings.updated`, so the un-collapsed list rendered the same sentence
 * five times — observed live as "Updated 2 settings" repeated down the panel.
 * Same collapse rule the dashboard's ActivityFeed already uses: same actor AND
 * same visible text, consecutive only, so a genuine repeat later still shows.
 */
async function shapeActivity(
  rows: Array<{ id: string; action: string; description: string | null; createdAt: Date; actorId: string | null }>,
) {
  const actorIds = [...new Set(rows.map((r) => r.actorId).filter(Boolean))] as string[];
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, fullName: true } })
    : [];
  const names = new Map(actors.map((a) => [a.id, a.fullName]));

  const out: Array<{
    id: string; action: string; description: string | null;
    createdAt: Date; actorName: string | null; count: number;
  }> = [];
  for (const r of rows) {
    const actorName = r.actorId ? (names.get(r.actorId) ?? null) : null;
    const last = out[out.length - 1];
    if (last && last.actorName === actorName && (last.description ?? last.action) === (r.description ?? r.action)) {
      last.count += 1;
      continue;
    }
    out.push({ id: r.id, action: r.action, description: r.description, createdAt: r.createdAt, actorName, count: 1 });
  }
  return out.slice(0, 5);
}

/**
 * The editor's Settings Overview (Clone 3397:32915): one line per settings
 * section plus the NEEDS ATTENTION rows, every fact from a column that already
 * exists. One site read, then one `Promise.all` over the tables behind the
 * lines. `pages` is the only per-row read — translations live in a JSON
 * column, so "no page has translations[locale]" cannot be a count; a site's
 * pages are tens, not thousands.
 */
export async function getSettingsOverview(siteId: string): Promise<SettingsOverview> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      name: true,
      workspaceId: true,
      defaultLocale: true,
      enabledLocales: true,
      allowIndexing: true,
      robotsTxt: true,
      headCode: true,
      bodyCode: true,
      cspPolicy: true,
      hstsMaxAge: true,
      projectSettings: true,
      workspace: {
        select: {
          plan: true,
          subscription: { select: { plan: true, price: true, interval: true } },
        },
      },
    },
  });
  if (!site) throw new Error("SITE_NOT_FOUND");

  const { workspaceId } = site;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    pages,
    primaryDomain,
    pendingDns,
    redirects,
    slugHistory,
    analyticsDays,
    forms,
    submissions,
    connected,
    webhook,
    members,
  ] = await Promise.all([
    prisma.page.findMany({ where: { siteId }, select: { translations: true } }),
    prisma.domain.findFirst({ where: { siteId, isPrimary: true }, select: { domain: true } }),
    prisma.dnsRecord.findMany({
      where: { verified: false, domain: { siteId } },
      orderBy: [{ domainId: "asc" }, { type: "asc" }],
      select: { type: true, host: true, domain: { select: { domain: true } } },
    }),
    prisma.redirect.findMany({ where: { siteId }, select: { fromPath: true } }),
    prisma.slugHistory.findMany({ where: { siteId }, select: { oldSlug: true } }),
    prisma.siteAnalytics.count({ where: { siteId, date: { gte: sevenDaysAgo } } }),
    prisma.formBlock.count({ where: { siteId } }),
    prisma.formSubmission.count({ where: { siteId } }),
    prisma.workspaceIntegration.count({ where: { workspaceId, isActive: true } }),
    prisma.workspaceWebhook.findUnique({
      where: { workspaceId },
      select: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, event: true, httpStatus: true, error: true, createdAt: true },
        },
      },
    }),
    prisma.workspaceMember.count({ where: { workspaceId, status: "ACTIVE" } }),
  ]);

  // Translations exist only for non-default locales — the default locale's
  // content is Page.blocks (page.service `DEFAULT_LOCALE_USES_BLOCKS`), so it
  // can never be "not started".
  const translatedPages = new Map<string, number>();
  for (const page of pages) {
    if (!isRecord(page.translations)) continue;
    for (const [locale, entry] of Object.entries(page.translations)) {
      if (entry) translatedPages.set(locale, (translatedPages.get(locale) ?? 0) + 1);
    }
  }
  const notStarted = site.enabledLocales.filter(
    (locale) => locale !== site.defaultLocale && !translatedPages.has(locale),
  );

  // SlugHistory.oldSlug is written bare ("old-page"); Redirect.fromPath is a
  // path ("/old-page"). Compare them as paths.
  const redirected = new Set(redirects.map((r) => r.fromPath));
  const suggestions = slugHistory.filter(
    (h) => !redirected.has(h.oldSlug.startsWith("/") ? h.oldSlug : `/${h.oldSlug}`),
  ).length;

  // `projectSettings` is the editor's ProjectSettings JSON: analytics is keyed
  // by provider id (googleAnalytics, facebookPixel, …) with an `enabled` flag;
  // cookieConsent sits beside them but is a banner, not a provider.
  const settings = isRecord(site.projectSettings) ? site.projectSettings : {};
  const analytics = isRecord(settings.analytics) ? settings.analytics : {};
  const providers = Object.entries(analytics)
    .filter(([id, config]) => id !== "cookieConsent" && isRecord(config) && config.enabled === true)
    .map(([id]) => id);
  const customCode = isRecord(settings.customCode) ? settings.customCode : {};

  const plan = planOf(site.workspace.plan);
  const limits = PLAN_LIMITS[plan];
  // A cancelled subscription keeps its row (status CANCELLED, plan still PRO)
  // while the workspace drops to FREE — its price belongs to a plan the
  // workspace no longer has.
  const subscription = site.workspace.subscription;
  const subscriptionMonthly =
    subscription && subscription.plan === plan ? monthlyPrice(subscription.price, subscription.interval) : null;
  const priceMonthly = subscriptionMonthly ?? Number(limits.priceMonthly);

  const lastDelivery = webhook?.deliveries[0] ?? null;
  const lastDeliveryStatus = lastDelivery ? (lastDelivery.status === "OK" ? "ok" : "failed") : null;

  const attention: SettingsOverview["attention"] = notStarted.map((locale) => ({
    kind: "locale-not-started",
    title: `${localeName(locale)} locale has no translated pages`,
    detail: `0 of ${pages.length} ${pages.length === 1 ? "page" : "pages"} · not started`,
    section: "localization",
  }));
  if (pendingDns.length > 0) {
    attention.push({
      kind: "dns-pending",
      title:
        pendingDns.length === 1
          ? "One DNS record is still pending"
          : `${pendingDns.length} DNS records are still pending`,
      detail: pendingDns.map((r) => `${r.type} ${r.host} for ${r.domain.domain}`).join(" · "),
      section: "domains",
    });
  }
  if (lastDelivery && lastDeliveryStatus === "failed") {
    // `error` already reads "502 Bad Gateway" for an HTTP failure and the
    // exception message for a transport one; the bare status is the fallback.
    const reason = lastDelivery.error ?? (lastDelivery.httpStatus === null ? "failed" : String(lastDelivery.httpStatus));
    attention.push({
      kind: "webhook-failed",
      title: "A webhook delivery failed",
      detail: `${lastDelivery.event} · ${reason} · ${shortDate(lastDelivery.createdAt)}`,
      section: "webhooks",
    });
  }

  return {
    site: { name: site.name, defaultLocale: site.defaultLocale, plan },
    general: { siteName: site.name, language: site.defaultLocale },
    localization: { locales: site.enabledLocales.length, notStarted },
    seo: { allowIndexing: site.allowIndexing, robotsTxtSet: filled(site.robotsTxt) },
    domains: { primary: primaryDomain?.domain ?? null, pendingDns: pendingDns.length },
    redirects: { rules: redirects.length, suggestions },
    analytics: { providers, receiving: analyticsDays > 0 },
    forms: { forms, submissions },
    customCode: { head: filled(site.headCode), body: filled(site.bodyCode), css: filled(customCode.globalCss) },
    headers: { csp: filled(site.cspPolicy), hsts: (site.hstsMaxAge ?? 0) > 0 },
    integrations: { connected, available: INTEGRATION_CATALOG.length },
    webhooks: { endpoints: webhook ? 1 : 0, lastDelivery: lastDeliveryStatus },
    members: { used: members, seats: Number(limits.teamMembers) },
    billing: { plan, priceMonthly },
    attention,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function planOf(raw: string): PlanName {
  return raw === "PRO" || raw === "BUSINESS" ? raw : "FREE";
}

/**
 * `Subscription.price` is Stripe's `unit_amount` — minor units for the whole
 * billing period. A yearly plan is reported as its monthly equivalent, the way
 * PLAN_LIMITS.priceYearly is ("$23/mo billed yearly"). Rows have carried both
 * our MONTHLY/YEARLY and Stripe's month/year spellings (see plan-card.tsx);
 * an interval that is neither is unpriceable and falls back to PLAN_LIMITS.
 */
function monthlyPrice(priceMinor: number, interval: string): number | null {
  switch (interval.trim().toUpperCase()) {
    case "MONTHLY":
    case "MONTH":
      return priceMinor / 100;
    case "YEARLY":
    case "YEAR":
    case "ANNUAL":
      return Math.round(priceMinor / 12) / 100;
    default:
      return null;
  }
}

/** "ar" → "Arabic". A tag Intl cannot parse (an underscore, say) reads as its code. */
function localeName(locale: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(locale) ?? locale.toUpperCase();
  } catch {
    return locale.toUpperCase();
  }
}

/** "1 Jul" — three-letter month (en-GB would say "Sept"); the year joins only when it is not this year. */
function shortDate(date: Date): string {
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  const year = date.getFullYear();
  return `${date.getDate()} ${month}${year === new Date().getFullYear() ? "" : ` ${year}`}`;
}
