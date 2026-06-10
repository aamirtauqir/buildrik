import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

type AnalyticsRange = "today" | "yesterday" | "7d" | "30d" | "90d";
type AnalyticsGranularity = "hourly" | "daily" | "weekly" | "monthly";

const RANGE_TO_DAYS: Record<AnalyticsRange, number> = {
  today: 1,
  yesterday: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function computeDateRange(range: AnalyticsRange): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const start = new Date(end);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "yesterday":
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
  }

  return { start, end };
}

function clampRange(range: AnalyticsRange, maxDays: number): AnalyticsRange {
  const requested = RANGE_TO_DAYS[range];
  if (requested <= maxDays) return range;
  if (maxDays >= 90) return "90d";
  if (maxDays >= 30) return "30d";
  return "7d";
}

/**
 * Ingest a single page-view event from a published site's first-party beacon.
 * This is the write half of analytics — without it `analytics_events` is never
 * populated and every dashboard stat reads zero. Silently no-ops for unknown
 * sites so a stale/forged beacon can't create orphan rows. All free-text is
 * length-capped defensively (the endpoint is public).
 */
export async function recordPageView(
  siteId: string,
  data: {
    path: string;
    referrer?: string | null;
    sessionId?: string | null;
    userAgent?: string | null;
    country?: string | null;
    viewportWidth?: number | null;
  }
): Promise<boolean> {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { id: true } });
  if (!site) return false;

  const cap = (v: string | null | undefined, n: number) =>
    typeof v === "string" && v.length > 0 ? v.slice(0, n) : null;
  const vw =
    typeof data.viewportWidth === "number" && data.viewportWidth > 0
      ? Math.min(Math.round(data.viewportWidth), 10000)
      : null;

  await prisma.analyticsEvent.create({
    data: {
      siteId,
      path: (cap(data.path, 1024) ?? "/"),
      referrer: cap(data.referrer, 1024),
      sessionId: cap(data.sessionId, 128),
      userAgent: cap(data.userAgent, 512),
      country: cap(data.country, 8),
      viewportWidth: vw,
    },
  });
  return true;
}

export async function getSiteAnalytics(
  siteId: string,
  query: { range: AnalyticsRange; granularity: AnalyticsGranularity }
) {
  const siteRecord = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  if (!siteRecord) throw new Error("SITE_NOT_FOUND");
  const ws = await prisma.workspace.findUnique({ where: { id: siteRecord.workspaceId }, select: { plan: true } });
  const plan = (ws?.plan ?? "FREE") as PlanName;
  const maxDays = PLAN_LIMITS[plan].analyticsRetentionDays as number;

  const clampedRange = clampRange(query.range, maxDays);
  const { start, end } = computeDateRange(clampedRange);

  const [timeSeries, trafficSourcesRaw, countriesRaw] = await Promise.all([
    prisma.siteAnalytics.findMany({
      where: { siteId, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["referrer"],
      where: { siteId, createdAt: { gte: start, lte: end } },
      _count: true,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["country"],
      where: { siteId, createdAt: { gte: start, lte: end } },
      _count: true,
    }),
  ]);

  const trafficSources = trafficSourcesRaw.map((r) => ({
    source: r.referrer ?? "direct",
    count: r._count,
  }));

  const countries = countriesRaw.map((r) => ({
    country: r.country ?? "unknown",
    count: r._count,
  }));

  return {
    clampedRange,
    timeSeries: timeSeries.map((row) => ({
      date: row.date,
      visitors: row.visitors,
      uniqueVisitors: row.uniqueVisitors,
      pageViews: row.pageViews,
      avgSession: row.avgSession,
      bounceRate: row.bounceRate,
    })),
    trafficSources,
    countries,
    devices: [],
  };
}
