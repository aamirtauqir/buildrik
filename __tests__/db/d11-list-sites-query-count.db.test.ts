/**
 * IMPORTANT 5 (controller, fix round 1) — D-11's own runtime_check asks for
 * "one aggregate query and no per-site analytics fetch." A DB-tier
 * correctness test can't read a query log directly against the shared
 * `prisma` singleton (no `log: [{emit:'event', level:'query'}]` config, and
 * changing that globally is out of scope), so this spies on the delegate
 * methods instead: it proves (a) exactly ONE `siteAnalytics.groupBy` call
 * happens regardless of how many sites match, (b) the id-scan `site.findMany`
 * call (across ALL matching sites) never selects `analytics`, and (c) the
 * number of `site.findMany` calls stays at 2 (ids scan + page fetch) whether
 * 3 sites match or 30 — i.e. it's O(1) queries, not O(matching sites).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { listSites } from "@/server/services/sites.service";
import {
  createTestUser,
  createTestWorkspace,
  createTestWorkspaceMember,
  createTestSite,
  truncateTables,
} from "./helpers";

beforeEach(async () => {
  await truncateTables("site", "workspaceMember", "workspace", "user");
});

async function seedSites(workspaceId: string, ownerId: string, count: number) {
  for (let i = 0; i < count; i++) {
    await createTestSite({ workspaceId, createdBy: ownerId, name: `Site ${i}` });
  }
}

describe("listSites traffic path — query count (D-11 / IMPORTANT 5)", () => {
  it("issues exactly one siteAnalytics.groupBy and 2 site.findMany calls, regardless of matching-site count", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    await createTestWorkspaceMember({ userId: owner.id, workspaceId: workspace.id, role: "OWNER" });
    await seedSites(workspace.id, owner.id, 12);

    const findManySpy = vi.spyOn(prisma.site, "findMany");
    const groupBySpy = vi.spyOn(prisma.siteAnalytics, "groupBy");

    await listSites(workspace.id, owner.id, { page: 1, perPage: 5, sort: "traffic" });

    expect(groupBySpy).toHaveBeenCalledTimes(1);
    expect(findManySpy).toHaveBeenCalledTimes(2);

    // Call 1: the id scan across ALL matching sites — must not select
    // `analytics` (that would be the old "full payload for every matching
    // site" shape this fix removed).
    const idScanArgs = findManySpy.mock.calls[0][0] as { select?: Record<string, unknown> };
    expect(idScanArgs.select).toEqual({ id: true });

    // Call 2: the page fetch — scoped to just this page's ids, not every
    // matching site.
    const pageFetchArgs = findManySpy.mock.calls[1][0] as { where?: { id?: { in?: string[] } } };
    expect(pageFetchArgs.where?.id?.in?.length).toBeLessThanOrEqual(5);

    findManySpy.mockRestore();
    groupBySpy.mockRestore();
  });

  it("the aggregate query, not a growing per-site query count, scales with a larger matching set", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    await createTestWorkspaceMember({ userId: owner.id, workspaceId: workspace.id, role: "OWNER" });
    await seedSites(workspace.id, owner.id, 30);

    const findManySpy = vi.spyOn(prisma.site, "findMany");
    const groupBySpy = vi.spyOn(prisma.siteAnalytics, "groupBy");

    await listSites(workspace.id, owner.id, { page: 1, perPage: 5, hasTraffic: "none" });

    // Same fixed query count at 30 matching sites as at 12 above — proves
    // this path does not issue one analytics query per matching site.
    expect(groupBySpy).toHaveBeenCalledTimes(1);
    expect(findManySpy).toHaveBeenCalledTimes(2);

    findManySpy.mockRestore();
    groupBySpy.mockRestore();
  });
});
