/**
 * CMS persistence service (E7). Verifies site-scoped collection upsert (create vs
 * update via id + IDOR guard), the entry cross-site guard (an entry op confirms
 * its collection is in the site), and create-vs-update routing for entries.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const colFindMany = vi.fn();
const colFindFirst = vi.fn();
const colCreate = vi.fn();
const colUpdate = vi.fn();
const colDelete = vi.fn();
const entFindMany = vi.fn();
const entFindFirst = vi.fn();
const entCreate = vi.fn();
const entUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cmsCollection: {
      findMany: (...a: unknown[]) => colFindMany(...a),
      findFirst: (...a: unknown[]) => colFindFirst(...a),
      create: (...a: unknown[]) => colCreate(...a),
      update: (...a: unknown[]) => colUpdate(...a),
      delete: (...a: unknown[]) => colDelete(...a),
    },
    cmsEntry: {
      findMany: (...a: unknown[]) => entFindMany(...a),
      findFirst: (...a: unknown[]) => entFindFirst(...a),
      create: (...a: unknown[]) => entCreate(...a),
      update: (...a: unknown[]) => entUpdate(...a),
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
  [colFindMany, colFindFirst, colCreate, colUpdate, colDelete, entFindMany, entFindFirst, entCreate, entUpdate].forEach(
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

  it("upsert with id refuses a collection from another site (NOT_FOUND, no update)", async () => {
    colFindFirst.mockResolvedValueOnce(null);
    await expect(
      upsertCollection("s1", { id: "other", siteId: "s1", name: "x", slug: "x", fields: [] }),
    ).rejects.toBeInstanceOf(CmsError);
    expect(colUpdate).not.toHaveBeenCalled();
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

  it("upsertEntry with id refuses an entry from another site", async () => {
    colFindFirst.mockResolvedValueOnce({ id: "c1" }); // collection in site
    entFindFirst.mockResolvedValueOnce(null); // but the entry isn't
    await expect(
      upsertEntry("s1", { id: "other-entry", siteId: "s1", collectionId: "c1", data: {} }),
    ).rejects.toBeInstanceOf(CmsError);
    expect(entUpdate).not.toHaveBeenCalled();
  });
});
