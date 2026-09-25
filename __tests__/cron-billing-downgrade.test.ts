/**
 * C-2 — route test for the billing-downgrade cron: 401 without the bearer,
 * the selection query (grace-period cutoff), and the downgrade effect with
 * Prisma mocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

const reconcileWorkspaceToFreePlanMock = vi.fn().mockResolvedValue(0);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findMany: vi.fn(), update: vi.fn() },
    workspace: { update: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
  },
}));
vi.mock("@server/services/billing.service", () => ({
  reconcileWorkspaceToFreePlan: (...a: unknown[]) => reconcileWorkspaceToFreePlanMock(...a),
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/cron/billing-downgrade/route";

const mockPrisma = prisma as unknown as {
  subscription: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  workspace: { update: ReturnType<typeof vi.fn> };
};

function makeReq(authHeader?: string): NextRequest {
  return new Request("http://localhost/api/cron/billing-downgrade", {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
  reconcileWorkspaceToFreePlanMock.mockResolvedValue(0);
});

describe("billing-downgrade cron", () => {
  it("returns 401 without the bearer", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 with the wrong bearer", async () => {
    const res = await GET(makeReq("Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("selects non-FREE PAST_DUE subscriptions past the 7-day grace cutoff", async () => {
    mockPrisma.subscription.findMany.mockResolvedValue([]);
    await GET(makeReq("Bearer test-secret"));
    const where = mockPrisma.subscription.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ plan: { not: "FREE" }, status: "PAST_DUE" });
    expect(where.stripeCurrentPeriodEnd.lt).toBeInstanceOf(Date);
    // Cutoff is in the past relative to now (grace period elapsed).
    expect(where.stripeCurrentPeriodEnd.lt.getTime()).toBeLessThan(Date.now());
  });

  it("downgrades each due subscription to FREE/CANCELLED and reconciles the workspace", async () => {
    mockPrisma.subscription.findMany.mockResolvedValue([{ id: "sub1", workspaceId: "ws1" }]);
    reconcileWorkspaceToFreePlanMock.mockResolvedValueOnce(2);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, downgraded: 1, unpublished: 2 });
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub1" },
      data: { plan: "FREE", status: "CANCELLED" },
    });
    expect(mockPrisma.workspace.update).toHaveBeenCalledWith({
      where: { id: "ws1" },
      data: { plan: "FREE" },
    });
    expect(reconcileWorkspaceToFreePlanMock).toHaveBeenCalledWith("ws1");
  });

  it("no due subscriptions → { ok: true, downgraded: 0, unpublished: 0 }, never reconciles", async () => {
    mockPrisma.subscription.findMany.mockResolvedValue([]);
    const res = await GET(makeReq("Bearer test-secret"));
    await expect(res.json()).resolves.toEqual({ ok: true, downgraded: 0, unpublished: 0 });
    expect(reconcileWorkspaceToFreePlanMock).not.toHaveBeenCalled();
  });
});
