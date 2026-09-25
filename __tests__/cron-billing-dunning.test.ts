/**
 * C-2 — route test for the billing-dunning cron: 401 without the bearer,
 * and the selection query + effect (a warning email at the right day count)
 * with Prisma mocked. Follows the cron-account-deletion.test.ts pattern.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

const sendDunningReminderEmailMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));
vi.mock("@server/services/email.service", () => ({
  sendDunningReminderEmail: (...a: unknown[]) => sendDunningReminderEmailMock(...a),
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/cron/billing-dunning/route";

const mockPrisma = prisma as unknown as {
  subscription: { findMany: ReturnType<typeof vi.fn> };
  user: { findMany: ReturnType<typeof vi.fn> };
};

function makeReq(authHeader?: string): NextRequest {
  return new Request("http://localhost/api/cron/billing-dunning", {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
  mockPrisma.user.findMany.mockResolvedValue([]);
});

describe("billing-dunning cron", () => {
  it("returns 401 without the bearer", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 with the wrong bearer", async () => {
    const res = await GET(makeReq("Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("selects only non-FREE, PAST_DUE, already-past-period-end subscriptions", async () => {
    mockPrisma.subscription.findMany.mockResolvedValue([]);
    await GET(makeReq("Bearer test-secret"));
    const where = mockPrisma.subscription.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ plan: { not: "FREE" }, status: "PAST_DUE" });
    expect(where.stripeCurrentPeriodEnd.lt).toBeInstanceOf(Date);
  });

  it("emails the owner exactly at the 7-day warning boundary and counts it", async () => {
    const now = Date.now();
    mockPrisma.subscription.findMany.mockResolvedValue([
      {
        id: "sub1",
        workspaceId: "ws1",
        // 0 days past due → daysLeft = 7 → hits WARN_AT_DAYS[0] (7)
        stripeCurrentPeriodEnd: new Date(now),
        workspace: { ownerId: "u1" },
      },
    ]);
    mockPrisma.user.findMany.mockResolvedValue([{ id: "u1", email: "owner@example.com" }]);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, notified: 1 });
    expect(sendDunningReminderEmailMock).toHaveBeenCalledWith("owner@example.com", 7);
  });

  it("does not email outside a warning day and does not count it", async () => {
    const now = Date.now();
    mockPrisma.subscription.findMany.mockResolvedValue([
      {
        id: "sub1",
        workspaceId: "ws1",
        // 2 days past due → daysLeft = 5, not in [7,3,1] window
        stripeCurrentPeriodEnd: new Date(now - 2 * 24 * 60 * 60 * 1000),
        workspace: { ownerId: "u1" },
      },
    ]);
    mockPrisma.user.findMany.mockResolvedValue([{ id: "u1", email: "owner@example.com" }]);

    const res = await GET(makeReq("Bearer test-secret"));
    await expect(res.json()).resolves.toEqual({ ok: true, notified: 0 });
    expect(sendDunningReminderEmailMock).not.toHaveBeenCalled();
  });
});
