/**
 * C-2 — route test for the ssl-check cron: 401 without the bearer, the
 * selection query (VERIFIED + ACTIVE within a 30-day window), the warning
 * email effect, and the expiry sweep with Prisma mocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

const sendSSLExpiringEmailMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    domain: { findMany: vi.fn(), updateMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));
vi.mock("@server/services/email.service", () => ({
  sendSSLExpiringEmail: (...a: unknown[]) => sendSSLExpiringEmailMock(...a),
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/cron/ssl-check/route";

const mockPrisma = prisma as unknown as {
  domain: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  user: { findMany: ReturnType<typeof vi.fn> };
};

function makeReq(authHeader?: string): NextRequest {
  return new Request("http://localhost/api/cron/ssl-check", {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
  mockPrisma.user.findMany.mockResolvedValue([]);
  mockPrisma.domain.updateMany.mockResolvedValue({ count: 0 });
});

describe("ssl-check cron", () => {
  it("returns 401 without the bearer", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 with the wrong bearer", async () => {
    const res = await GET(makeReq("Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("selects VERIFIED/ACTIVE domains expiring within 30 days", async () => {
    mockPrisma.domain.findMany.mockResolvedValue([]);
    await GET(makeReq("Bearer test-secret"));
    const where = mockPrisma.domain.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ status: "VERIFIED", sslStatus: "ACTIVE" });
    expect(where.sslExpiresAt.lte).toBeInstanceOf(Date);
    expect(where.sslExpiresAt.gte).toBeInstanceOf(Date);
  });

  it("emails the owner at a warning boundary and counts it", async () => {
    const now = Date.now();
    mockPrisma.domain.findMany.mockResolvedValue([
      {
        id: "d1",
        domain: "example.com",
        sslExpiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
        site: { workspace: { ownerId: "u1" } },
      },
    ]);
    mockPrisma.user.findMany.mockResolvedValue([{ id: "u1", email: "owner@example.com" }]);

    const res = await GET(makeReq("Bearer test-secret"));
    await expect(res.json()).resolves.toEqual({ ok: true, notified: 1 });
    expect(sendSSLExpiringEmailMock).toHaveBeenCalledWith("owner@example.com", "example.com", "d1");
  });

  it("flips ACTIVE + already-expired domains to EXPIRED", async () => {
    mockPrisma.domain.findMany.mockResolvedValue([]);
    await GET(makeReq("Bearer test-secret"));
    expect(mockPrisma.domain.updateMany).toHaveBeenCalledWith({
      where: { sslStatus: "ACTIVE", sslExpiresAt: { lt: expect.any(Date) } },
      data: { sslStatus: "EXPIRED" },
    });
  });
});
