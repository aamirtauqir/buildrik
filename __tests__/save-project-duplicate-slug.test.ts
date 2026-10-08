/**
 * L3-001 (server half): two pages with one slug used to reach the client as a
 * raw Prisma P2002 — a 500 whose message carried server file paths, on every
 * autosave, with nothing that said which page to fix. The (siteId, slug) unique
 * key still refuses the write; the service now names the slug and the pages
 * that hold it, and the router answers CONFLICT with that.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const pageUpsert = vi.fn();
const siteFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => {
  const tx = {
    page: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
      deleteMany: vi.fn(),
      upsert: (...a: unknown[]) => pageUpsert(...a),
      update: vi.fn(),
    },
    formBlock: { deleteMany: vi.fn() },
    site: { updateMany: vi.fn(async () => ({ count: 1 })) },
  };
  return {
    prisma: {
      site: { findUnique: (...a: unknown[]) => siteFindUnique(...a) },
      $transaction: async (fn: (t: unknown) => unknown) => fn(tx),
    },
  };
});
vi.mock("@/server/services/sanitize.service", () => ({ sanitizeBlocks: vi.fn() }));

import { saveProjectData, PageSlugTakenError } from "@/server/services/sites.service";

const p2002 = () =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the fields: (`siteId`,`slug`)", {
    code: "P2002",
    clientVersion: "5",
    meta: { target: ["siteId", "slug"] },
  });

beforeEach(() => {
  vi.clearAllMocks();
  siteFindUnique.mockResolvedValue({ id: "s_1", deletedAt: null, lastEditedAt: new Date() });
});

describe("saveProjectData with two pages on one slug", () => {
  it("throws a PageSlugTakenError naming the slug and both pages", async () => {
    pageUpsert.mockResolvedValueOnce({}).mockRejectedValueOnce(p2002());
    const err = await saveProjectData({
      siteId: "s_1",
      pages: [
        { id: "p_1", name: "About", slug: "about", blocks: [], position: 0 },
        { id: "p_2", name: "About us", slug: "about", blocks: [], position: 1 },
      ],
    } as never).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PageSlugTakenError);
    expect((err as PageSlugTakenError).slug).toBe("about");
    expect((err as PageSlugTakenError).pageNames).toEqual(["About", "About us"]);
  });

  it("names the slug it was writing when the other holder is not in this save", async () => {
    pageUpsert.mockRejectedValueOnce(p2002());
    const err = await saveProjectData({
      siteId: "s_1",
      pages: [{ id: "p_1", name: "Team", slug: "team", blocks: [], position: 0 }],
    } as never).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PageSlugTakenError);
    expect((err as PageSlugTakenError).slug).toBe("team");
    expect((err as PageSlugTakenError).pageNames).toEqual(["Team"]);
  });

  it("lets any other database error through unchanged", async () => {
    const other = new Error("connection reset");
    pageUpsert.mockRejectedValueOnce(other);
    await expect(
      saveProjectData({
        siteId: "s_1",
        pages: [{ id: "p_1", name: "Team", slug: "team", blocks: [], position: 0 }],
      } as never),
    ).rejects.toBe(other);
  });
});
