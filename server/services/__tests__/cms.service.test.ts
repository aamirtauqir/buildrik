/**
 * CMS persistence service (E7). Verifies site-scoped collection upsert (create vs
 * update via id + IDOR guard), the entry cross-site guard (an entry op confirms
 * its collection is in the site), and create-vs-update routing for entries.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const colFindMany = vi.fn();
const colFindFirst = vi.fn();
const colFindUnique = vi.fn();
const colCreate = vi.fn();
const colUpsert = vi.fn();
const colDelete = vi.fn();
const entFindMany = vi.fn();
const entFindFirst = vi.fn();
const entFindUnique = vi.fn();
const entCreate = vi.fn();
const entUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cmsCollection: {
      findMany: (...a: unknown[]) => colFindMany(...a),
      findFirst: (...a: unknown[]) => colFindFirst(...a),
      findUnique: (...a: unknown[]) => colFindUnique(...a),
      create: (...a: unknown[]) => colCreate(...a),
      upsert: (...a: unknown[]) => colUpsert(...a),
      delete: (...a: unknown[]) => colDelete(...a),
    },
    cmsEntry: {
      findMany: (...a: unknown[]) => entFindMany(...a),
      findFirst: (...a: unknown[]) => entFindFirst(...a),
      findUnique: (...a: unknown[]) => entFindUnique(...a),
      create: (...a: unknown[]) => entCreate(...a),
      upsert: (...a: unknown[]) => entUpsert(...a),
    },
  },
}));

import {
  listCollections,
  upsertCollection,
  listEntries,
  upsertEntry,
  CmsError,
} from "@server/services/cms.service";

beforeEach(() => {
  [colFindMany, colFindFirst, colFindUnique, colCreate, colUpsert, colDelete, entFindMany, entFindFirst, entFindUnique, entCreate, entUpsert].forEach(
    (m) => m.mockReset(),
  );
});

describe("collections", () => {
  it("list flattens _count.entries into entryCount, scoped to the site", async () => {
    colFindMany.mockResolvedValueOnce([{ id: "c1", name: "Posts", _count: { entries: 4 } }]);
    const out = await listCollections("s1");
    expect(out[0]).toMatchObject({ id: "c1", entryCount: 4 });
    expect(colFindMany.mock.calls[0][0].where).toEqual({ siteId: "s1" });
  });

  it("upsert creates when no id", async () => {
    colCreate.mockResolvedValueOnce({ id: "c2" });
    await upsertCollection("s1", { siteId: "s1", name: "Posts", slug: "posts", fields: [] });
    expect(colCreate.mock.calls[0][0].data).toMatchObject({ siteId: "s1", name: "Posts", slug: "posts" });
  });

  it("upsert with id refuses a collection already owned by another site (no write)", async () => {
    colFindUnique.mockResolvedValueOnce({ siteId: "other-site" });
    await expect(
      upsertCollection("s1", { id: "x", siteId: "s1", name: "x", slug: "x", fields: [] }),
    ).rejects.toBeInstanceOf(CmsError);
    expect(colUpsert).not.toHaveBeenCalled();
  });

  it("upsert with id creates-if-missing (engine id → DB id on first sync)", async () => {
    colFindUnique.mockResolvedValueOnce(null);
    colUpsert.mockResolvedValueOnce({ id: "eng-1" });
    await upsertCollection("s1", { id: "eng-1", siteId: "s1", name: "Posts", slug: "posts", fields: [] });
    expect(colUpsert.mock.calls[0][0]).toMatchObject({
      where: { id: "eng-1" },
      create: expect.objectContaining({ id: "eng-1", siteId: "s1" }),
    });
  });
});

describe("entries cross-site guard", () => {
  it("listEntries refuses a collection not in the site", async () => {
    colFindFirst.mockResolvedValueOnce(null);
    await expect(listEntries("s1", "other-col")).rejects.toBeInstanceOf(CmsError);
    expect(entFindMany).not.toHaveBeenCalled();
  });

  it("upsertEntry creates after confirming the collection is in the site", async () => {
    colFindFirst.mockResolvedValueOnce({ id: "c1" }); // assertCollectionInSite
    entCreate.mockResolvedValueOnce({ id: "e1" });
    await upsertEntry("s1", { siteId: "s1", collectionId: "c1", data: { title: "Hi" } });
    expect(entCreate.mock.calls[0][0].data).toMatchObject({ collectionId: "c1" });
  });

  it("upsertEntry with id refuses an entry already under another site", async () => {
    colFindFirst.mockResolvedValueOnce({ id: "c1" }); // target collection in site
    entFindUnique.mockResolvedValueOnce({ collection: { siteId: "other-site" } });
    await expect(
      upsertEntry("s1", { id: "e-x", siteId: "s1", collectionId: "c1", data: {} }),
    ).rejects.toBeInstanceOf(CmsError);
    expect(entUpsert).not.toHaveBeenCalled();
  });
});
