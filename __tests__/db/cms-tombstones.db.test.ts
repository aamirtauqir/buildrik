import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  upsertCollection, deleteCollection, listCollections,
  upsertEntry, deleteEntry, listEntries, CmsError,
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
const col = (siteId: string, id: string, slug = "blog") =>
  upsertCollection(siteId, { id, siteId, name: "Blog", slug, fields: [] });

describe("CMS tombstones", () => {
  it("delete tombstones instead of removing, and lists hide it", async () => {
    const site = await seedSite();
    await col(site.id, "c1");
    await deleteCollection(site.id, "c1");
    expect(await listCollections(site.id)).toEqual([]);
    const row = await prisma.cmsCollection.findUnique({ where: { id: "c1" } });
    expect(row?.deletedAt).toBeInstanceOf(Date);
  });

  it("a deleted collection's slug is free again", async () => {
    const site = await seedSite();
    await col(site.id, "c1");
    await deleteCollection(site.id, "c1");
    await expect(col(site.id, "c2")).resolves.toMatchObject({ id: "c2", slug: "blog" });
  });

  it("upserting a tombstoned id is GONE, never a resurrection", async () => {
    const site = await seedSite();
    await col(site.id, "c1");
    await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "A" } });
    await deleteEntry(site.id, "e1");
    await expect(
      upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "A2" } }),
    ).rejects.toMatchObject({ code: "GONE" });
    await deleteCollection(site.id, "c1");
    await expect(col(site.id, "c1")).rejects.toBeInstanceOf(CmsError);
  });

  it("collection delete tombstones its entries", async () => {
    const site = await seedSite();
    await col(site.id, "c1");
    await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: {} });
    await deleteCollection(site.id, "c1");
    expect((await prisma.cmsEntry.findUnique({ where: { id: "e1" } }))?.deletedAt).toBeInstanceOf(Date);
    await expect(listEntries(site.id, "c1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
