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
