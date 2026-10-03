/**
 * An entry write into a DELETED collection answers GONE (C0a live run,
 * 2026-10-02). It answered NOT_FOUND — "Collection not found" — which the
 * editor's sync layer treats as a failure to retry, so the device that still
 * held the collection kept a permanent "didn't sync" notice and a publish
 * blocked on it. GONE is the answer it drops.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
const entryFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    cmsCollection: { findFirst: (...a: unknown[]) => findFirst(...a) },
    cmsEntry: { findUnique: (...a: unknown[]) => entryFindUnique(...a) },
  },
}));

import { upsertEntry } from "@/server/services/cms.service";

const input = { id: "e1", siteId: "s1", collectionId: "c1", data: { name: "x" } };

beforeEach(() => {
  findFirst.mockReset();
  entryFindUnique.mockReset();
});

describe("upsertEntry — collection state", () => {
  it("a tombstoned collection is GONE and nothing is written", async () => {
    findFirst.mockResolvedValueOnce({ deletedAt: new Date("2026-10-02T10:00:00Z") });
    await expect(upsertEntry("s1", input)).rejects.toMatchObject({ code: "GONE" });
    expect(entryFindUnique).not.toHaveBeenCalled();
  });

  it("a collection that is not this site's stays NOT_FOUND", async () => {
    findFirst.mockResolvedValueOnce(null);
    await expect(upsertEntry("s1", input)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("looks the collection up within the site, deleted or not", async () => {
    findFirst.mockResolvedValueOnce(null);
    await upsertEntry("s1", input).catch(() => {});
    expect(findFirst.mock.calls[0][0]).toMatchObject({ where: { id: "c1", siteId: "s1" } });
    expect(findFirst.mock.calls[0][0].where).not.toHaveProperty("deletedAt");
  });
});
