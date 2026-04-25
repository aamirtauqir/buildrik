import { describe, it, expect, vi, beforeEach } from "vitest";

const { aiUsageFindUnique, aiUsageUpsert, workspaceMemberFindFirst } = vi.hoisted(() => ({
  aiUsageFindUnique: vi.fn(),
  aiUsageUpsert: vi.fn(),
  workspaceMemberFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aIUsage: { findUnique: aiUsageFindUnique, upsert: aiUsageUpsert },
    workspaceMember: { findFirst: workspaceMemberFindFirst },
  },
}));

import { checkQuota, recordUsage, TIER_LIMITS } from "@server/services/quota.service";

describe("quota.service", () => {
  beforeEach(() => {
    aiUsageFindUnique.mockReset();
    aiUsageUpsert.mockReset();
    workspaceMemberFindFirst.mockReset();
  });

  it("FREE tier defaults to 10/day when user has no workspace membership", async () => {
    workspaceMemberFindFirst.mockResolvedValueOnce(null);
    aiUsageFindUnique.mockResolvedValueOnce(null);
    const result = await checkQuota("user-1");
    expect(result.limit).toBe(TIER_LIMITS.FREE);
    expect(result.used).toBe(0);
    expect(result.ok).toBe(true);
  });

  it("PRO tier returns 200/day", async () => {
    workspaceMemberFindFirst.mockResolvedValueOnce({ workspace: { plan: "PRO" } });
    aiUsageFindUnique.mockResolvedValueOnce({ count: 5 });
    const result = await checkQuota("user-1");
    expect(result.limit).toBe(200);
    expect(result.used).toBe(5);
    expect(result.ok).toBe(true);
  });

  it("blocks at limit", async () => {
    workspaceMemberFindFirst.mockResolvedValueOnce({ workspace: { plan: "FREE" } });
    aiUsageFindUnique.mockResolvedValueOnce({ count: 10 });
    const result = await checkQuota("user-1");
    expect(result.ok).toBe(false);
    expect(result.used).toBe(10);
  });

  it("BUSINESS tier is unlimited (Infinity)", async () => {
    workspaceMemberFindFirst.mockResolvedValueOnce({ workspace: { plan: "BUSINESS" } });
    aiUsageFindUnique.mockResolvedValueOnce({ count: 100000 });
    const result = await checkQuota("user-1");
    expect(result.ok).toBe(true);
    expect(result.limit).toBe(Infinity);
  });

  it("recordUsage upserts +1 for the right dayBucket", async () => {
    aiUsageUpsert.mockResolvedValueOnce({});
    await recordUsage("user-1", "claude-sonnet-4-6");
    expect(aiUsageUpsert).toHaveBeenCalledOnce();
    const call = aiUsageUpsert.mock.calls[0][0];
    expect(call.create.userId).toBe("user-1");
    expect(call.create.count).toBe(1);
    expect(call.update.count.increment).toBe(1);
    expect(call.update.model).toBe("claude-sonnet-4-6");
  });
});
