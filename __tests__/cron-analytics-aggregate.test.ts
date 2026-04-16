import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    siteAnalytics: { upsert: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/cron/analytics-aggregate/route";

const mockPrisma = prisma as typeof prisma & {
  $queryRaw: ReturnType<typeof vi.fn>;
  siteAnalytics: { upsert: ReturnType<typeof vi.fn> };
};

function makeReq(authHeader?: string): NextRequest {
  return new Request("http://localhost/api/cron/analytics-aggregate", {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
});

describe("analytics-aggregate", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await GET(makeReq("Bearer wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("happy path: upserts once per site from $queryRaw rows", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([
        { siteId: "site-1", pageViews: 100n, visitors: 40n },
      ])
      .mockResolvedValueOnce([
        { siteId: "site-1", bounceSessions: 10n, totalSessions: 20n },
      ]);
    mockPrisma.siteAnalytics.upsert.mockResolvedValue({});

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.upserted).toBe(1);
    expect(mockPrisma.siteAnalytics.upsert).toHaveBeenCalledTimes(1);
    const call = mockPrisma.siteAnalytics.upsert.mock.calls[0][0];
    expect(call.where.siteId_date.siteId).toBe("site-1");
    expect(call.create.pageViews).toBe(100);
    expect(call.create.visitors).toBe(40);
    expect(call.create.uniqueVisitors).toBe(40);
  });

  it("bounceRate calculated correctly: 1 bounce session out of 2 total = 0.5", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([
        { siteId: "site-2", pageViews: 50n, visitors: 20n },
      ])
      .mockResolvedValueOnce([
        { siteId: "site-2", bounceSessions: 1n, totalSessions: 2n },
      ]);
    mockPrisma.siteAnalytics.upsert.mockResolvedValue({});

    await GET(makeReq("Bearer test-secret"));
    const call = mockPrisma.siteAnalytics.upsert.mock.calls[0][0];
    expect(call.create.bounceRate).toBe(0.5);
    expect(call.update.bounceRate).toBe(0.5);
  });

  it("no events for yesterday: no upserts, returns upserted: 0", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockPrisma.siteAnalytics.upsert.mockResolvedValue({});

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, upserted: 0 });
    expect(mockPrisma.siteAnalytics.upsert).not.toHaveBeenCalled();
  });

  it("avgSession is always 0", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([
        { siteId: "site-3", pageViews: 200n, visitors: 80n },
      ])
      .mockResolvedValueOnce([
        { siteId: "site-3", bounceSessions: 5n, totalSessions: 10n },
      ]);
    mockPrisma.siteAnalytics.upsert.mockResolvedValue({});

    await GET(makeReq("Bearer test-secret"));
    const call = mockPrisma.siteAnalytics.upsert.mock.calls[0][0];
    expect(call.create.avgSession).toBe(0);
    expect(call.update.avgSession).toBe(0);
  });
});
