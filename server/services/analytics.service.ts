import { prisma } from "@/lib/prisma";

type AnalyticsRange = "today" | "yesterday" | "7d" | "30d" | "90d";
type AnalyticsGranularity = "hourly" | "daily" | "weekly" | "monthly";

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

export async function getSiteAnalytics(
  siteId: string,
  query: { range: AnalyticsRange; granularity: AnalyticsGranularity }
) {
  const { start, end } = computeDateRange(query.range);

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
