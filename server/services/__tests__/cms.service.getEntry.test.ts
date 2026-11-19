/**
 * L3-021 — the conflict diff shows "theirs": the server's current copy of one
 * record and the revision (updatedAt) Keep mine will overwrite. Scoped like
 * every entry read: the record's collection must belong to the site.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({ entFindFirst: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { cmsEntry: { findFirst: (...a: unknown[]) => mocks.entFindFirst(...a) } },
}));

import { getEntry, CmsError } from "@server/services/cms.service";

const AT = new Date("2026-10-10T10:00:00.000Z");

beforeEach(() => mocks.entFindFirst.mockReset());

describe("getEntry (L3-021)", () => {
  it("returns the server's copy with its revision, scoped to the site", async () => {
    mocks.entFindFirst.mockResolvedValue({ id: "e1", collectionId: "c1", data: { name: "Theirs" }, status: "PUBLISHED", updatedAt: AT, deletedAt: null });
    await expect(getEntry("s1", "e1")).resolves.toMatchObject({ id: "e1", data: { name: "Theirs" }, status: "PUBLISHED", updatedAt: AT });
    expect(mocks.entFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "e1", collection: { siteId: "s1" } } }));
  });

  it("a record another site owns, or none at all, is NOT_FOUND", async () => {
    mocks.entFindFirst.mockResolvedValue(null);
    await expect(getEntry("s1", "e1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("a deleted record is GONE", async () => {
    mocks.entFindFirst.mockResolvedValue({ id: "e1", collectionId: "c1", data: {}, status: "DRAFT", updatedAt: AT, deletedAt: AT });
    const e = await getEntry("s1", "e1").catch((x: unknown) => x);
    expect(e).toBeInstanceOf(CmsError);
    expect((e as CmsError).code).toBe("GONE");
  });
});
