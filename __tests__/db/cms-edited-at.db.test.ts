import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  upsertCollection, upsertEntry, deleteCollection, deleteEntry,
  importCsvEntries, CmsError,
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

async function cmsEditedAt(siteId: string): Promise<Date | null> {
  const s = await prisma.site.findUnique({ where: { id: siteId }, select: { cmsEditedAt: true } });
  return s?.cmsEditedAt ?? null;
}

describe("Site.cmsEditedAt bumps on CMS mutations", () => {
  it("starts null on a fresh site", async () => {
    const site = await seedSite();
    expect(await cmsEditedAt(site.id)).toBeNull();
  });

  it("upsertCollection (new) sets cmsEditedAt to a recent timestamp", async () => {
    const site = await seedSite();
    const before = Date.now();
    await upsertCollection(site.id, { siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    const after = Date.now();
    const stamped = await cmsEditedAt(site.id);
    expect(stamped).toBeInstanceOf(Date);
    expect(stamped!.getTime()).toBeGreaterThanOrEqual(before);
    expect(stamped!.getTime()).toBeLessThanOrEqual(after + 5);
  });

  it("upsertCollection (existing id) bumps cmsEditedAt", async () => {
    const site = await seedSite();
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    const first = (await cmsEditedAt(site.id))!.getTime();
    await new Promise((r) => setTimeout(r, 5));
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog v2", slug: "blog", fields: [] });
    const second = (await cmsEditedAt(site.id))!.getTime();
    expect(second).toBeGreaterThan(first);
  });

  it("upsertEntry (new + existing) bumps cmsEditedAt", async () => {
    const site = await seedSite();
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    const baseline = (await cmsEditedAt(site.id))!.getTime();
    await new Promise((r) => setTimeout(r, 5));
    await upsertEntry(site.id, { siteId: site.id, collectionId: "c1", data: { title: "A" } });
    const afterNew = (await cmsEditedAt(site.id))!.getTime();
    expect(afterNew).toBeGreaterThan(baseline);

    await new Promise((r) => setTimeout(r, 5));
    const e1 = await upsertEntry(site.id, { siteId: site.id, collectionId: "c1", data: { title: "A" } });
    await upsertEntry(site.id, { id: e1.id, siteId: site.id, collectionId: "c1", data: { title: "A2" } });
    const afterUpdate = (await cmsEditedAt(site.id))!.getTime();
    expect(afterUpdate).toBeGreaterThan(afterNew);
  });

  it("deleteEntry bumps cmsEditedAt", async () => {
    const site = await seedSite();
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    const e1 = await upsertEntry(site.id, { siteId: site.id, collectionId: "c1", data: { title: "A" } });
    const baseline = (await cmsEditedAt(site.id))!.getTime();
    await new Promise((r) => setTimeout(r, 5));
    await deleteEntry(site.id, e1.id);
    const after = (await cmsEditedAt(site.id))!.getTime();
    expect(after).toBeGreaterThan(baseline);
  });

  it("deleteCollection bumps cmsEditedAt", async () => {
    const site = await seedSite();
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    const baseline = (await cmsEditedAt(site.id))!.getTime();
    await new Promise((r) => setTimeout(r, 5));
    await deleteCollection(site.id, "c1");
    const after = (await cmsEditedAt(site.id))!.getTime();
    expect(after).toBeGreaterThan(baseline);
  });

  it("importCsvEntries bumps cmsEditedAt exactly once for N rows", async () => {
    const site = await seedSite();
    await upsertCollection(site.id, {
      id: "c1", siteId: site.id, name: "Blog", slug: "blog",
      fields: [{ id: "f1", name: "Title", slug: "title", type: "text", order: 0 }],
    });
    const baseline = (await cmsEditedAt(site.id))!.getTime();
    await new Promise((r) => setTimeout(r, 5));
    const csv = "title\nA\nB\nC\nD\nE";
    const result = await importCsvEntries(site.id, "c1", csv, { title: "title" });
    expect(result.imported).toBe(5);
    const after = (await cmsEditedAt(site.id))!.getTime();
    expect(after).toBeGreaterThan(baseline);
  });

  it("conflict (CONFLICT) on upsert does NOT bump cmsEditedAt", async () => {
    const site = await seedSite();
    const c = await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog v2", slug: "blog", fields: [] });
    const baseline = (await cmsEditedAt(site.id))!.getTime();
    await new Promise((r) => setTimeout(r, 5));
    let caught: unknown;
    try {
      await upsertCollection(site.id, {
        id: "c1", siteId: site.id, name: "Blog v3", slug: "blog", fields: [],
        expectedUpdatedAt: c.updatedAt.toISOString(),
      });
    } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(CmsError);
    expect((caught as CmsError).code).toBe("CONFLICT");
    const after = (await cmsEditedAt(site.id))!.getTime();
    expect(after).toBe(baseline);
  });

  it("GONE on upsert (re-upsert tombstoned row) does NOT bump cmsEditedAt", async () => {
    const site = await seedSite();
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
    await deleteCollection(site.id, "c1");
    const baseline = (await cmsEditedAt(site.id))!.getTime();
    await new Promise((r) => setTimeout(r, 5));
    let caught: unknown;
    try {
      await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog v2", slug: "blog", fields: [] });
    } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(CmsError);
    expect((caught as CmsError).code).toBe("GONE");
    const after = (await cmsEditedAt(site.id))!.getTime();
    expect(after).toBe(baseline);
  });
});
