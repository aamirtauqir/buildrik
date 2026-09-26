/**
 * S-1: `styles` (Site.projectStyles) is `z.unknown()` on both
 * save procedures, and its rules' selector / media query are written raw into
 * the published stylesheet and the single-file export's <style>. The write
 * boundary drops a rule that could leave it.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const siteFindUnique = vi.fn();
const siteUpdate = vi.fn();

vi.mock("@/lib/prisma", () => {
  const tx = {
    page: { findMany: vi.fn(async () => []), deleteMany: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    formBlock: { deleteMany: vi.fn() },
    // A-2: the site-level write is the compare-and-swap updateMany.
    site: { updateMany: (...a: unknown[]) => siteUpdate(...a) },
  };
  return {
    prisma: {
      site: { findUnique: (...a: unknown[]) => siteFindUnique(...a) },
      $transaction: async (fn: (t: unknown) => unknown) => fn(tx),
    },
  };
});

import { saveProjectData } from "@/server/services/sites.service";

beforeEach(() => {
  vi.clearAllMocks();
  siteFindUnique.mockResolvedValue({ id: "s_1", deletedAt: null, lastEditedAt: null });
  siteUpdate.mockResolvedValue({ count: 1 });
});

describe("saveProjectData — project style rules", () => {
  it("stores no rule whose selector or media query could leave the stylesheet", async () => {
    await saveProjectData({
      siteId: "s_1",
      pages: [{ id: "p_1", blocks: { id: "root", type: "container" } }],
      styles: [
        { id: "ok", selector: '[data-buildrick-id="el-a"]', properties: { color: "red" }, mediaQuery: "(max-width: 1023px)" },
        { id: "sel", selector: "a{}</style><script>alert(1)</script><style>", properties: { color: "red" } },
        { id: "mq", selector: ".b", properties: { color: "red" }, mediaQuery: "(max-width: 1px){}</style><script>alert(1)</script>" },
      ],
    } as never);
    const stored = siteUpdate.mock.calls[0][0].data.projectStyles as Array<{ id: string }>;
    expect(stored.map((r) => r.id)).toEqual(["ok"]);
  });
});
