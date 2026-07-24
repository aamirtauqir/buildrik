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

  const evWindow = { siteId, createdAt: { gte: start, lte: end } };
  const [timeSeries, trafficSourcesRaw, countriesRaw, mobile, tablet, desktop] = await Promise.all([
    prisma.siteAnalytics.findMany({
      where: { siteId, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["referrer"],
      where: evWindow,
      _count: true,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["country"],
      where: evWindow,
      _count: true,
    }),
    // Coarse device classes derived from the collected viewport width.
    prisma.analyticsEvent.count({ where: { ...evWindow, viewportWidth: { lt: 768 } } }),
    prisma.analyticsEvent.count({ where: { ...evWindow, viewportWidth: { gte: 768, lt: 1024 } } }),
    prisma.analyticsEvent.count({ where: { ...evWindow, viewportWidth: { gte: 1024 } } }),
  ]);

  const trafficSources = trafficSourcesRaw.map((r) => ({
    source: r.referrer ?? "direct",
    count: r._count,
  }));

  const countries = countriesRaw.map((r) => ({
    country: r.country ?? "unknown",
    count: r._count,
  }));

  // The daily rollup cron aggregates only up to YESTERDAY, so today's bar is
  // always missing and the "today" range looked permanently empty despite live
  // traffic. Fold in a live count of today's events as the current-day row.
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const rolledRows = timeSeries
    .filter((row) => row.date < startOfToday)
    .map((row) => ({
      date: row.date,
      visitors: row.visitors,
      uniqueVisitors: row.uniqueVisitors,
      pageViews: row.pageViews,
      avgSession: row.avgSession,
      bounceRate: row.bounceRate,
    }));

  const dailyRows = [...rolledRows];
  if (end >= startOfToday) {
    const todayWindow = { siteId, createdAt: { gte: startOfToday, lte: end } };
    const [todayPageViews, todaySessions] = await Promise.all([
      prisma.analyticsEvent.count({ where: todayWindow }),
      prisma.analyticsEvent.findMany({ where: todayWindow, select: { sessionId: true }, distinct: ["sessionId"] }),
    ]);
    if (todayPageViews > 0) {
      const uniq = todaySessions.filter((s) => s.sessionId).length || todayPageViews;
      dailyRows.push({
        date: startOfToday,
        visitors: uniq,
        uniqueVisitors: uniq,
        pageViews: todayPageViews,
        avgSession: 0,
        bounceRate: 0,
      });
    }
  }

  const devices = [
    { device: "mobile", count: mobile },
    { device: "tablet", count: tablet },
    { device: "desktop", count: desktop },
  ].filter((d) => d.count > 0);

  return {
    clampedRange,
    // Source rows are daily; bucket them to the requested granularity. (hourly
    // has no finer source than daily, so it falls back to daily.)
    timeSeries: bucketByGranularity(dailyRows, query.granularity),
    trafficSources,
    countries,
    devices,
  };
}

type DailyRow = {
  date: Date;
  visitors: number;
  uniqueVisitors: number;
  pageViews: number;
  avgSession: number;
  bounceRate: number;
};

function bucketKey(date: Date, granularity: AnalyticsGranularity): string {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  if (granularity === "monthly") return `${y}-${m}`;
  if (granularity === "weekly") {
    // ISO-ish week bucket: start-of-week (Monday) date as the key.
    const d = new Date(Date.UTC(y, date.getUTCMonth(), date.getUTCDate()));
    const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
    d.setUTCDate(d.getUTCDate() - day);
    return d.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10); // daily / hourly fallback
}

function bucketByGranularity(rows: DailyRow[], granularity: AnalyticsGranularity): DailyRow[] {
  if (granularity === "daily" || granularity === "hourly" || rows.length === 0) return rows;
  const buckets = new Map<string, DailyRow & { _n: number }>();
  for (const r of rows) {
    const key = bucketKey(r.date, granularity);
    const b = buckets.get(key);
    if (!b) {
      buckets.set(key, { ...r, _n: 1 });
    } else {
      b.visitors += r.visitors;
      b.uniqueVisitors += r.uniqueVisitors;
      b.pageViews += r.pageViews;
      b.avgSession += r.avgSession;
      b.bounceRate += r.bounceRate;
      b._n += 1;
    }
  }
  // Sums for counts; averages for rate/duration metrics.
  return [...buckets.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ _n, ...row }) => ({
      ...row,
      avgSession: Math.round(row.avgSession / _n),
      bounceRate: Math.round((row.bounceRate / _n) * 100) / 100,
    }));
}
