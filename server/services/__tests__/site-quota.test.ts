/**
 * The site cap, in one place.
 *
 * The same twelve lines — read the membership, read the plan, count live sites,
 * throw SITE_LIMIT at or over the cap — were written three times: creating a
 * site (`sites.service.ts:175`), duplicating one (`:373`) and instantiating a
 * template (`template.service.ts:139`). Byte-identical, so they agreed, which
 * is the good version of this problem: the next edit to one of them is where it
 * stops being true.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const memberFindFirst = vi.fn();
const siteCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: { findFirst: (...a: unknown[]) => memberFindFirst(...a) },
    site: { count: (...a: unknown[]) => siteCount(...a) },
  },
}));

import { assertSiteQuota } from "@/server/services/site-quota";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("assertSiteQuota", () => {
  it("allows a workspace under its cap", async () => {
    memberFindFirst.mockResolvedValue({ workspace: { plan: "FREE" } });
    siteCount.mockResolvedValue(2); // FREE = 3
    await expect(assertSiteQuota("ws-1", "u-1")).resolves.toBeUndefined();
  });

  it("throws SITE_LIMIT at the cap, not just past it", async () => {
    memberFindFirst.mockResolvedValue({ workspace: { plan: "FREE" } });
    siteCount.mockResolvedValue(3);
    await expect(assertSiteQuota("ws-1", "u-1")).rejects.toThrow("SITE_LIMIT");
  });

  it("reads the workspace's own plan, so PRO gets PRO's cap", async () => {
    memberFindFirst.mockResolvedValue({ workspace: { plan: "PRO" } });
    siteCount.mockResolvedValue(3); // PRO = 15
    await expect(assertSiteQuota("ws-1", "u-1")).resolves.toBeUndefined();
  });

  it("falls back to FREE when there is no membership row", async () => {
    memberFindFirst.mockResolvedValue(null);
    siteCount.mockResolvedValue(3);
    await expect(assertSiteQuota("ws-1", "u-1")).rejects.toThrow("SITE_LIMIT");
  });

  it("counts only live sites — a soft-deleted one does not hold a slot", async () => {
    memberFindFirst.mockResolvedValue({ workspace: { plan: "FREE" } });
    siteCount.mockResolvedValue(1);
    await assertSiteQuota("ws-1", "u-1");
    expect(siteCount).toHaveBeenCalledWith({ where: { workspaceId: "ws-1", deletedAt: null } });
  });
});
