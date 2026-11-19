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
    await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "A2" }, expectedUpdatedAt: first.updatedAt.toISOString() });
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

/* L3-022 (owner 2026-10-10): a record update names the version it was edited
   from; "Keep mine" is an explicit overwrite of the reviewed revision. */
describe("CMS record updates — precondition required (L3-022)", () => {
  async function seedEntry() {
    const site = await seedSite();
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    const first = await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "A" } });
    return { site, first };
  }
  const titleOf = async () => ((await prisma.cmsEntry.findUnique({ where: { id: "e1" } }))?.data as { title?: string })?.title;

  it("an update with no precondition is refused and changes nothing", async () => {
    const { site } = await seedEntry();
    await expect(upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "blind" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await titleOf()).toBe("A");
  });

  it("null ('I thought it was new') meeting an existing row is a CONFLICT", async () => {
    const { site, first } = await seedEntry();
    await expect(
      upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "blind" }, expectedUpdatedAt: null }),
    ).rejects.toMatchObject({ code: "CONFLICT", message: first.updatedAt.toISOString() });
    expect(await titleOf()).toBe("A");
  });

  it("the race: two saves from the same version — one lands, the other is a CONFLICT", async () => {
    const { site, first } = await seedEntry();
    const at = first.updatedAt.toISOString();
    const results = await Promise.allSettled([
      upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "tab 1" }, expectedUpdatedAt: at }),
      upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "tab 2" }, expectedUpdatedAt: at }),
    ]);
    const landed = results.filter((r) => r.status === "fulfilled");
    const refused = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(landed).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(refused[0].reason).toMatchObject({ code: "CONFLICT" });
  });

  it("Keep mine overwrites the reviewed revision; another edit since is a fresh CONFLICT", async () => {
    const { site, first } = await seedEntry();
    const theirs = await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "theirs" }, expectedUpdatedAt: first.updatedAt.toISOString() });
    const reviewed = theirs.updatedAt.toISOString();
    /* A third edit lands after the person looked at "theirs". */
    await new Promise((r) => setTimeout(r, 5));
    await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "third" }, expectedUpdatedAt: reviewed });
    await expect(
      upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "mine" }, overwrite: { reviewedUpdatedAt: reviewed } }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await titleOf()).toBe("third");
    const latest = (await prisma.cmsEntry.findUnique({ where: { id: "e1" } }))!.updatedAt.toISOString();
    await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "mine" }, overwrite: { reviewedUpdatedAt: latest } });
    expect(await titleOf()).toBe("mine");
  });
});
