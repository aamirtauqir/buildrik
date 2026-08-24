/**
 * `listAssets` pages, and now says how much there is to page through.
 *
 * The service has always over-fetched by one and returned a `nextCursor`. What
 * it never returned was a COUNT — so the editor, which pulls one page at boot,
 * had no way to tell a complete library from a truncated one and simply showed
 * the first page as if it were everything.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mediaAsset: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { listAssets } from "@/server/services/media.service";

const row = (id: string) => ({ id, filename: `${id}.png` });

describe("listAssets — the page and its edges", () => {
  beforeEach(() => {
    vi.mocked(prisma.mediaAsset.findMany).mockReset();
    vi.mocked(prisma.mediaAsset.count).mockReset();
  });

  it("returns the total that matches the filter, not the page length", async () => {
    vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue([row("a"), row("b")] as never);
    vi.mocked(prisma.mediaAsset.count).mockResolvedValue(412 as never);

    const r = await listAssets("u1", { siteId: "s1", limit: 2 } as never);

    expect(r.total).toBe(412);
    expect(r.items).toHaveLength(2);
    expect(r.nextCursor).toBeNull();
  });

  /* The count has to see the SAME `where` the page did, or "showing 200 of N"
     compares two different questions. */
  it("counts under the same filter the page was fetched with", async () => {
    vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.mediaAsset.count).mockResolvedValue(0 as never);

    await listAssets("u1", { siteId: "s1", type: "image", search: "logo", limit: 10 } as never);

    const findWhere = vi.mocked(prisma.mediaAsset.findMany).mock.calls[0][0].where;
    const countWhere = vi.mocked(prisma.mediaAsset.count).mock.calls[0][0].where;
    expect(countWhere).toEqual(findWhere);
  });

  /* `findMany` can stop as soon as it has a page; `count` has to walk the whole
     match set, and on `search` there is no index on filename/altText to walk.
     Counting again on every page makes the later pages — already the slowest —
     slower still, for an answer that has not changed. */
  it("does not re-count on a later page", async () => {
    vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue([row("c")] as never);

    const r = await listAssets("u1", { siteId: "s1", limit: 2, cursor: "b" } as never);

    expect(prisma.mediaAsset.count).not.toHaveBeenCalled();
    expect(r.total).toBeNull();
    expect(r.items).toHaveLength(1);
  });

  it("hands back a cursor only when a further page exists", async () => {
    vi.mocked(prisma.mediaAsset.findMany).mockResolvedValue([row("a"), row("b"), row("c")] as never);
    vi.mocked(prisma.mediaAsset.count).mockResolvedValue(9 as never);

    const r = await listAssets("u1", { siteId: "s1", limit: 2 } as never);

    expect(r.items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(r.nextCursor).toBe("b");
    expect(r.total).toBe(9);
  });
});
