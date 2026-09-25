/**
 * D-11 (listSites part) — hasTraffic filter and sort=traffic used to pull
 * every matching site's FULL payload (domains + every analytics row) into
 * memory regardless of page, reduce() the visitor sum there, then paginate
 * in JS. listSites now resolves ids + one siteAnalytics.groupBy aggregate
 * first, and only fetches the full payload for the resulting page of ids.
 * This test pins the OUTPUT (correct filtering/sorting/pagination/total),
 * not the query plan — the ledger's "one aggregate query, no per-site fetch"
 * check needs a Prisma query log / EXPLAIN, left to the controller's runtime
 * check.
 */
import { describe, it, expect, beforeEach } from "vitest";
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

async function seedSiteWithVisitors(workspaceId: string, ownerId: string, name: string, visitors30d: number) {
  const site = await createTestSite({ workspaceId, createdBy: ownerId, name });
  if (visitors30d > 0) {
    await prisma.siteAnalytics.create({
      data: { siteId: site.id, date: new Date(), visitors: visitors30d },
    });
  }
  return site;
}

describe("listSites — traffic filter/sort (D-11)", () => {
  it("hasTraffic buckets filter correctly, including sites with zero analytics rows", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    await createTestWorkspaceMember({ userId: owner.id, workspaceId: workspace.id, role: "OWNER" });
    const zero = await seedSiteWithVisitors(workspace.id, owner.id, "Zero", 0);
    const low = await seedSiteWithVisitors(workspace.id, owner.id, "Low", 50);
    const mid = await seedSiteWithVisitors(workspace.id, owner.id, "Mid", 500);
    const high = await seedSiteWithVisitors(workspace.id, owner.id, "High", 2000);

    const none = await listSites(workspace.id, owner.id, { page: 1, perPage: 20, sort: "lastEdited", hasTraffic: "none" });
    expect(none.data.map((s) => s.id)).toEqual([zero.id]);

    const oneToHundred = await listSites(workspace.id, owner.id, { page: 1, perPage: 20, sort: "lastEdited", hasTraffic: "1-100" });
    expect(oneToHundred.data.map((s) => s.id)).toEqual([low.id]);

    const thousand = await listSites(workspace.id, owner.id, { page: 1, perPage: 20, sort: "lastEdited", hasTraffic: "1000+" });
    expect(thousand.data.map((s) => s.id)).toEqual([high.id]);
    void mid;
  });

  it("sort=traffic orders sites by 30-day visitors descending, across pages", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    await createTestWorkspaceMember({ userId: owner.id, workspaceId: workspace.id, role: "OWNER" });
    const low = await seedSiteWithVisitors(workspace.id, owner.id, "Low", 10);
    const high = await seedSiteWithVisitors(workspace.id, owner.id, "High", 900);
    const mid = await seedSiteWithVisitors(workspace.id, owner.id, "Mid", 300);

    const page1 = await listSites(workspace.id, owner.id, { page: 1, perPage: 2, sort: "traffic" });
    expect(page1.data.map((s) => s.id)).toEqual([high.id, mid.id]);
    expect(page1.total).toBe(3);
    expect(page1.totalPages).toBe(2);

    const page2 = await listSites(workspace.id, owner.id, { page: 2, perPage: 2, sort: "traffic" });
    expect(page2.data.map((s) => s.id)).toEqual([low.id]);
  });
});
