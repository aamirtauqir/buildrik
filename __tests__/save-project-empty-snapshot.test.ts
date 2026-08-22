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
const formBlockDeleteMany = vi.fn();
const siteFindUnique = vi.fn();
const siteUpdate = vi.fn();

vi.mock("@/lib/prisma", () => {
  const tx = {
    page: {
      findMany: (...a: unknown[]) => pageFindMany(...a),
      deleteMany: (...a: unknown[]) => pageDeleteMany(...a),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    formBlock: { deleteMany: (...a: unknown[]) => formBlockDeleteMany(...a) },
    site: { update: (...a: unknown[]) => siteUpdate(...a) },
  };
  return {
    prisma: {
      site: {
        findUnique: (...a: unknown[]) => siteFindUnique(...a),
        update: (...a: unknown[]) => siteUpdate(...a),
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
  siteUpdate.mockResolvedValue({});
});

describe("saveProjectData with an empty page list", () => {
  it("refuses rather than deleting every page the site has", async () => {
    await expect(saveProjectData({ siteId: "s_1", pages: [] } as never)).rejects.toThrow(
      /EMPTY_SNAPSHOT/,
    );
    expect(pageDeleteMany).not.toHaveBeenCalled();
  });

  it("still deletes a page the user really did remove", async () => {
    await saveProjectData({
      siteId: "s_1",
      pages: [{ id: "p_1", blocks: [], position: 0 }],
    } as never);
    expect(pageDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["p_2"] } } }),
    );
  });
});
