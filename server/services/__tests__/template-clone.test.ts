/**
 * T4 — clone-as-template + the workspace-scoped gallery filter. A cloned site
 * becomes a Template private to the agency's workspace (workspaceId set), shown
 * in their gallery next to the global built-ins (workspaceId null) but never to
 * other agencies. listTemplates filters built-ins OR the caller's own clones.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const siteFindFirst = vi.fn();
const pageFindMany = vi.fn();
const tplFindUnique = vi.fn();
const tplCreate = vi.fn();
const tplCount = vi.fn();
const tplFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findFirst: (...a: unknown[]) => siteFindFirst(...a) },
    page: { findMany: (...a: unknown[]) => pageFindMany(...a) },
    template: {
      findUnique: (...a: unknown[]) => tplFindUnique(...a),
      create: (...a: unknown[]) => tplCreate(...a),
      count: (...a: unknown[]) => tplCount(...a),
      findMany: (...a: unknown[]) => tplFindMany(...a),
    },
  },
}));

import { cloneSiteAsTemplate, listTemplates, TemplateError } from "@server/services/template.service";

beforeEach(() => {
  [siteFindFirst, pageFindMany, tplFindUnique, tplCreate, tplCount, tplFindMany].forEach((m) => m.mockReset());
});

describe("cloneSiteAsTemplate (T4)", () => {
  it("refuses a site outside the workspace (IDOR guard)", async () => {
    siteFindFirst.mockResolvedValueOnce(null);
    await expect(cloneSiteAsTemplate("w1", "other", "X")).rejects.toBeInstanceOf(TemplateError);
    expect(tplCreate).not.toHaveBeenCalled();
  });

  it("copies the site's pages into a workspace-private template", async () => {
    siteFindFirst.mockResolvedValueOnce({ id: "s1" });
    pageFindMany.mockResolvedValueOnce([
      { name: "Home", slug: "home", position: 0, isHomePage: true, blocks: [{ id: "root" }] },
      { name: "About", slug: "about", position: 1, isHomePage: false, blocks: [] },
    ]);
    tplFindUnique.mockResolvedValueOnce(null); // slug free
    tplCreate.mockResolvedValueOnce({ id: "tpl_new" });

    const res = await cloneSiteAsTemplate("w1", "s1", "My Site");
    expect(res).toMatchObject({ templateId: "tpl_new", slug: "my-site", pageCount: 2 });
    const data = tplCreate.mock.calls[0][0].data;
    expect(data.workspaceId).toBe("w1"); // private to the agency
    expect(data.pages).toHaveLength(2);
    expect(data.pages[0]).toMatchObject({ name: "Home", slug: "home", isHomePage: true });
  });
});

describe("listTemplates workspace scope (T4)", () => {
  it("shows built-ins OR the caller's own clones, never other agencies'", async () => {
    tplCount.mockResolvedValueOnce(0);
    tplFindMany.mockResolvedValueOnce([]);
    await listTemplates({ category: "ALL", page: 1, perPage: 6, sort: "popular" }, "w1");
    const where = tplCount.mock.calls[0][0].where;
    expect(where.isActive).toBe(true);
    expect(where.OR).toEqual([{ workspaceId: null }, { workspaceId: "w1" }]);
  });

  it("with no workspace context, shows only global built-ins", async () => {
    tplCount.mockResolvedValueOnce(0);
    tplFindMany.mockResolvedValueOnce([]);
    await listTemplates({ category: "ALL", page: 1, perPage: 6, sort: "popular" });
    expect(tplCount.mock.calls[0][0].where.OR).toEqual([{ workspaceId: null }]);
  });
});
