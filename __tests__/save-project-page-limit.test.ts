/**
 * L3-013: the plan's page limit was enforced only in `pages.create`, which the
 * editor never calls — it saves full snapshots through saveProjectData. The
 * limit now holds at the write boundary the editor actually uses. A site
 * already over its limit (a downgrade) keeps saving as long as the save does
 * not add pages.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const pageCount = vi.fn();
const workspaceFindUnique = vi.fn();
const siteFindUnique = vi.fn();
const siteUpdate = vi.fn();

vi.mock("@/lib/prisma", () => {
  const tx = {
    page: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    formBlock: { deleteMany: vi.fn() },
    site: { updateMany: (...a: unknown[]) => siteUpdate(...a) },
  };
  return {
    prisma: {
      site: { findUnique: (...a: unknown[]) => siteFindUnique(...a) },
      page: { count: (...a: unknown[]) => pageCount(...a) },
      workspace: { findUnique: (...a: unknown[]) => workspaceFindUnique(...a) },
      $transaction: async (fn: (t: unknown) => unknown) => fn(tx),
    },
  };
});
vi.mock("@/server/services/sanitize.service", () => ({ sanitizeBlocks: vi.fn() }));

import { saveProjectData } from "@/server/services/sites.service";

const pages = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p_${i}`, blocks: [], position: i, slug: `p-${i}`, name: `P${i}` }));

beforeEach(() => {
  vi.clearAllMocks();
  siteFindUnique.mockResolvedValue({ id: "s_1", deletedAt: null, lastEditedAt: null, workspaceId: "w_1" });
  workspaceFindUnique.mockResolvedValue({ plan: "FREE" });
  siteUpdate.mockResolvedValue({ count: 1 });
});

describe("saveProjectData enforces the plan's pages-per-site limit", () => {
  it("refuses a save that takes a FREE site past 10 pages", async () => {
    pageCount.mockResolvedValue(10);
    await expect(saveProjectData({ siteId: "s_1", pages: pages(11) } as never)).rejects.toThrow("PAGE_LIMIT:10");
    expect(siteUpdate).not.toHaveBeenCalled();
  });

  it("accepts a save at the limit", async () => {
    pageCount.mockResolvedValue(9);
    await saveProjectData({ siteId: "s_1", pages: pages(10) } as never);
    expect(siteUpdate).toHaveBeenCalled();
  });

  it("lets a site already over its limit keep saving when it adds no page", async () => {
    pageCount.mockResolvedValue(12);
    await saveProjectData({ siteId: "s_1", pages: pages(12) } as never);
    expect(siteUpdate).toHaveBeenCalled();
  });

  it("uses the workspace's plan (BUSINESS allows 50)", async () => {
    workspaceFindUnique.mockResolvedValue({ plan: "BUSINESS" });
    pageCount.mockResolvedValue(30);
    await saveProjectData({ siteId: "s_1", pages: pages(31) } as never);
    expect(siteUpdate).toHaveBeenCalled();
  });
});
