import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1);

  const rows = await prisma.$queryRaw<
    Array<{ siteId: string; pageViews: bigint; visitors: bigint }>
  >`
    SELECT "siteId",
           COUNT(*) AS "pageViews",
           COUNT(DISTINCT "sessionId") AS visitors
    FROM analytics_events
    WHERE "createdAt" >= ${startOfYesterday}
      AND "createdAt" < ${startOfToday}
    GROUP BY "siteId"
  `;

  const bounceRows = await prisma.$queryRaw<
    Array<{ siteId: string; bounceSessions: bigint; totalSessions: bigint }>
  >`
    SELECT "siteId",
           COUNT(CASE WHEN cnt = 1 THEN 1 END) AS "bounceSessions",
           COUNT(*) AS "totalSessions"
    FROM (
      SELECT "siteId", "sessionId", COUNT(*) AS cnt
      FROM analytics_events
      WHERE "createdAt" >= ${startOfYesterday}
        AND "createdAt" < ${startOfToday}
        AND "sessionId" IS NOT NULL
      GROUP BY "siteId", "sessionId"
    ) sessions
    GROUP BY "siteId"
  `;

  const bounceMap = new Map(
    bounceRows.map((r) => [
      r.siteId,
      r.totalSessions > 0n
        ? Number(r.bounceSessions) / Number(r.totalSessions)
        : 0,
    ])
  );

  const date = startOfYesterday;
  let upserted = 0;

  for (const row of rows) {
    const bounceRate = bounceMap.get(row.siteId) ?? 0;
    await prisma.siteAnalytics.upsert({
      where: { siteId_date: { siteId: row.siteId, date } },
      update: {
        pageViews: Number(row.pageViews),
        visitors: Number(row.visitors),
        uniqueVisitors: Number(row.visitors),
        bounceRate,
        avgSession: 0,
      },
      create: {
        siteId: row.siteId,
        date,
        pageViews: Number(row.pageViews),
        visitors: Number(row.visitors),
        uniqueVisitors: Number(row.visitors),
        bounceRate,
        avgSession: 0,
      },
    });
    upserted++;
  }

  return Response.json({ ok: true, upserted, date: date.toISOString().split("T")[0] });
}
