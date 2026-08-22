/**
 * The usage page's site count must be the count the product enforces.
 *
 * `getWorkspaceUsage` collected its site ids with `where: { workspaceId }` and
 * no `deletedAt` filter, so every soft-deleted site kept its slot in the
 * number shown to the user — while `assertSiteQuota` counts `deletedAt: null`
 * and lets them make another one.
 *
 * Measured on the dev database before the fix: `E2E Blank WS 0a95fc` is on FREE
 * (cap 3) with 3 live sites and 27 deleted. The usage screen read "30 of 3".
 * `Vocab Check WS` read "15 of 3" on 1 live site. That is the screen whose job
 * is to prompt an upgrade.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const siteFindMany = vi.fn();
const workspaceFindUnique = vi.fn();
const mediaAggregate = vi.fn();
const submissionCount = vi.fn();
const submissionFindMany = vi.fn();
const memberCount = vi.fn();
const aiCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findMany: (...a: unknown[]) => siteFindMany(...a) },
    workspace: { findUnique: (...a: unknown[]) => workspaceFindUnique(...a) },
    mediaAsset: { aggregate: (...a: unknown[]) => mediaAggregate(...a) },
    formSubmission: {
      count: (...a: unknown[]) => submissionCount(...a),
      findMany: (...a: unknown[]) => submissionFindMany(...a),
    },
    workspaceMember: { count: (...a: unknown[]) => memberCount(...a) },
    aIGenerationJob: { count: (...a: unknown[]) => aiCount(...a) },
  },
}));

import { getWorkspaceUsage } from "@/server/services/usage.service";

beforeEach(() => {
  vi.clearAllMocks();
  workspaceFindUnique.mockResolvedValue({ plan: "FREE" });
  mediaAggregate.mockResolvedValue({ _sum: { bytes: 0 } });
  submissionCount.mockResolvedValue(0);
  submissionFindMany.mockResolvedValue([]);
  memberCount.mockResolvedValue(1);
  aiCount.mockResolvedValue(0);
  siteFindMany.mockResolvedValue([{ id: "s1" }, { id: "s2" }, { id: "s3" }]);
});

describe("getWorkspaceUsage", () => {
  it("asks the database only for live sites", async () => {
    await getWorkspaceUsage("ws-1");
    expect(siteFindMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1", deletedAt: null },
      select: { id: true },
    });
  });

  it("reports the site count the quota check would agree with", async () => {
    const usage = await getWorkspaceUsage("ws-1");
    const sites = usage.metrics.find((m) => m.key === "sites");
    expect(sites?.used).toBe(3);
    expect(sites?.limit).toBe(3);
  });

  it("counts submissions and storage against live sites only", async () => {
    await getWorkspaceUsage("ws-1");
    expect(mediaAggregate.mock.calls[0][0].where.siteId.in).toEqual(["s1", "s2", "s3"]);
    expect(submissionCount.mock.calls[0][0].where.siteId.in).toEqual(["s1", "s2", "s3"]);
  });
});
