import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  upsertCollection, upsertEntry, CmsError,
} from "@/server/services/cms.service";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
});

async function seedSite() {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  return createTestSite({ workspaceId: workspace.id, createdBy: user.id });
}

describe("CMS preconditions (expectedUpdatedAt)", () => {
  it("collection: first save without expectedUpdatedAt succeeds and returns a fresh row", async () => {
    const site = await seedSite();
    const row = await upsertCollection(site.id, {
      siteId: site.id, name: "Blog", slug: "blog", fields: [], expectedUpdatedAt: undefined,
    });
    expect(row.updatedAt).toBeInstanceOf(Date);
  });

  it("collection: same expectedUpdatedAt allows the second save", async () => {
    const site = await seedSite();
    const first = await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    const same = first.updatedAt.toISOString();
    const second = await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog v2", slug: "blog", fields: [], expectedUpdatedAt: same });
    expect(second.name).toBe("Blog v2");
    expect(second.updatedAt.getTime()).toBeGreaterThan(first.updatedAt.getTime());
  });

  it("collection: stale expectedUpdatedAt throws CONFLICT carrying the current updatedAt", async () => {
    const site = await seedSite();
    const first = await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    // Second save with the stale value mutates the row
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog v2", slug: "blog", fields: [] });
    // Third save with the original (now stale) expected value must CONFLICT
    let caught: unknown;
    try {
      await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog v3", slug: "blog", fields: [], expectedUpdatedAt: first.updatedAt.toISOString() });
    } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(CmsError);
    expect((caught as CmsError).code).toBe("CONFLICT");
  });

  it("entry: stale expectedUpdatedAt throws CONFLICT", async () => {
    const site = await seedSite();
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    const first = await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "A" } });
    await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "A2" } });
    await expect(
      upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "A3" }, expectedUpdatedAt: first.updatedAt.toISOString() }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("expectedUpdatedAt: null bypasses the precondition (editor after a state reset)", async () => {
    const site = await seedSite();
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog v2", slug: "blog", fields: [], expectedUpdatedAt: null });
    const row = await prisma.cmsCollection.findUnique({ where: { id: "c1" } });
    expect(row?.name).toBe("Blog v2");
  });
});
