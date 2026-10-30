/**
 * What a save carrying no pages does to a site that has some.
 *
 * saveProjectData infers "this is a full snapshot, delete anything missing from
 * it" from every incoming page having a `position`. `[].every(...)` is true, so
 * a save with zero pages is treated as a complete snapshot of an empty site and
 * every existing page is deleted. Nothing rejects it: the Zod array has no
 * `.min(1)`, and the optimistic-concurrency check passes happily because the
 * revision is untouched.
 *
 * This has happened. One failed project load followed by one autosave is enough
 * — the editor had nothing to send, and the write boundary treated "nothing" as
 * "the user deleted everything". A client-side fix is not the guard; the guard
 * belongs here, where the delete is issued.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const pageFindMany = vi.fn();
const pageDeleteMany = vi.fn();
const pageUpdate = vi.fn();
const formBlockDeleteMany = vi.fn();
const siteFindUnique = vi.fn();
const siteUpdate = vi.fn();

vi.mock("@/lib/prisma", () => {
  const tx = {
    page: {
      findMany: (...a: unknown[]) => pageFindMany(...a),
      findFirst: vi.fn(async () => null),
      deleteMany: (...a: unknown[]) => pageDeleteMany(...a),
      upsert: vi.fn(),
      update: (...a: unknown[]) => pageUpdate(...a),
      create: vi.fn(),
    },
    formBlock: { deleteMany: (...a: unknown[]) => formBlockDeleteMany(...a) },
    site: { updateMany: (...a: unknown[]) => siteUpdate(...a) },
  };
  return {
    prisma: {
      site: {
        findUnique: (...a: unknown[]) => siteFindUnique(...a),
      },
      $transaction: async (fn: (t: unknown) => unknown) => fn(tx),
    },
  };
});
vi.mock("@/server/services/sanitize.service", () => ({ sanitizeBlocks: vi.fn() }));

import { saveProjectData } from "@/server/services/sites.service";

beforeEach(() => {
  vi.clearAllMocks();
  siteFindUnique.mockResolvedValue({ id: "s_1", deletedAt: null, lastEditedAt: null });
  pageFindMany.mockResolvedValue([{ id: "p_1" }, { id: "p_2" }]);
  siteUpdate.mockResolvedValue({ count: 1 });
});

describe("saveProjectData with an empty page list", () => {
  it("refuses rather than deleting every page the site has", async () => {
    await expect(saveProjectData({ siteId: "s_1", pages: [] } as never)).rejects.toThrow(
      /EMPTY_SNAPSHOT/,
    );
    expect(pageDeleteMany).not.toHaveBeenCalled();
  });

  it("still trashes a page the user really did remove (A-21)", async () => {
    pageFindMany
      .mockResolvedValueOnce([{ id: "p_1" }, { id: "p_2" }])
      .mockResolvedValueOnce([{ id: "p_2", slug: "about" }]);
    await saveProjectData({
      siteId: "s_1",
      pages: [{ id: "p_1", blocks: [], position: 0 }],
    } as never);
    expect(pageFindMany.mock.calls[1][0].where).toEqual({ id: { in: ["p_2"] }, siteId: "s_1", deletedAt: null });
    expect(pageUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p_2" }, data: expect.objectContaining({ slug: "about~deleted~p_2" }) }),
    );
    expect(pageDeleteMany).not.toHaveBeenCalled();
  });
});
