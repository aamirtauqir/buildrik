import { it, expect, beforeEach } from "vitest";
import { upsertCollection, upsertEntry, deleteEntry, getPublishedCmsForCollections } from "@/server/services/cms.service";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
});

it("returns every field of the named collections and only live PUBLISHED entries", async () => {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
  const fields = [
    { id: "f1", name: "Title", slug: "title", type: "text", order: 0 },
    { id: "f2", name: "Notes", slug: "notes", type: "text", order: 1 },
  ];
  await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields });
  await upsertEntry(site.id, { id: "pub", siteId: site.id, collectionId: "c1", data: { title: "P", notes: "n" }, status: "PUBLISHED" });
  await upsertEntry(site.id, { id: "draft", siteId: site.id, collectionId: "c1", data: { title: "D" } });
  await upsertEntry(site.id, { id: "gone", siteId: site.id, collectionId: "c1", data: { title: "G" }, status: "PUBLISHED" });
  await deleteEntry(site.id, "gone");
  const rows = await getPublishedCmsForCollections(site.id, ["c1", "not-mine"]);
  expect(rows.collections.map((c) => c.id)).toEqual(["c1"]);
  expect(rows.collections[0].fields).toHaveLength(2);
  expect(rows.entries.map((e) => e.id)).toEqual(["pub"]);
  expect(rows.entries[0].data).toEqual({ title: "P", notes: "n" });
});
