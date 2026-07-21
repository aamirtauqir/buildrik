/**
 * T4 — clone-as-template + the workspace-scoped gallery filter. A cloned site
 * becomes a Template private to the agency's workspace (workspaceId set), shown
 * in their gallery next to the global built-ins (workspaceId null) but never to
 * other agencies. listTemplates filters built-ins OR the caller's own clones.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const siteFindFirst = vi.fn();
const siteUpdate = vi.fn();
const pageFindMany = vi.fn();
const pageDeleteMany = vi.fn();
const pageCreateMany = vi.fn();
const tplFindUnique = vi.fn();
const tplFindFirst = vi.fn();
const tplCreate = vi.fn();
const tplCount = vi.fn();
const tplFindMany = vi.fn();

vi.mock("@/lib/prisma", () => {
  const client = {
    site: {
      findFirst: (...a: unknown[]) => siteFindFirst(...a),
      update: (...a: unknown[]) => siteUpdate(...a),
    },
    page: {
      findMany: (...a: unknown[]) => pageFindMany(...a),
      deleteMany: (...a: unknown[]) => pageDeleteMany(...a),
      createMany: (...a: unknown[]) => pageCreateMany(...a),
    },
    template: {
      findUnique: (...a: unknown[]) => tplFindUnique(...a),
      findFirst: (...a: unknown[]) => tplFindFirst(...a),
      create: (...a: unknown[]) => tplCreate(...a),
      count: (...a: unknown[]) => tplCount(...a),
      findMany: (...a: unknown[]) => tplFindMany(...a),
    },
    // Interactive-transaction form: run the callback against the same mocked
    // client so applyTemplateToSite's deleteMany/createMany/update route to the
    // vi.fn()s above and their call order can be asserted.
    $transaction: (cb: (tx: unknown) => unknown) => cb(client),
  };
  return { prisma: client };
});

import {
  applyTemplateToSite,
  cloneSiteAsTemplate,
  listTemplates,
  TemplateError,
} from "@server/services/template.service";

beforeEach(() => {
  [
    siteFindFirst,
    siteUpdate,
    pageFindMany,
    pageDeleteMany,
    pageCreateMany,
    tplFindUnique,
    tplFindFirst,
    tplCreate,
    tplCount,
    tplFindMany,
  ].forEach((m) => m.mockReset());
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
    await listTemplates({ category: "ALL", page: 1, perPage: 6, sort: "popular", difficulty: "ALL" }, "w1");
    const where = tplCount.mock.calls[0][0].where;
    expect(where.isActive).toBe(true);
    expect(where.OR).toEqual([{ workspaceId: null }, { workspaceId: "w1" }]);
  });

  it("with no workspace context, shows only global built-ins", async () => {
    tplCount.mockResolvedValueOnce(0);
    tplFindMany.mockResolvedValueOnce([]);
    await listTemplates({ category: "ALL", page: 1, perPage: 6, sort: "popular", difficulty: "ALL" });
    expect(tplCount.mock.calls[0][0].where.OR).toEqual([{ workspaceId: null }]);
  });

  it("T2 search filters name+description (AND-ed with the workspace scope)", async () => {
    tplCount.mockResolvedValueOnce(0);
    tplFindMany.mockResolvedValueOnce([]);
    await listTemplates({ category: "ALL", page: 1, perPage: 6, sort: "popular", difficulty: "ALL", search: "  bistro  " }, "w1");
    const where = tplCount.mock.calls[0][0].where;
    expect(where.OR).toEqual([{ workspaceId: null }, { workspaceId: "w1" }]); // scope kept
    expect(where.AND).toEqual([
      { OR: [
        { name: { contains: "bistro", mode: "insensitive" } },
        { description: { contains: "bistro", mode: "insensitive" } },
      ] },
    ]);
  });

  it("blank search is ignored (no AND filter added)", async () => {
    tplCount.mockResolvedValueOnce(0);
    tplFindMany.mockResolvedValueOnce([]);
    await listTemplates({ category: "ALL", page: 1, perPage: 6, sort: "popular", difficulty: "ALL", search: "   " }, "w1");
    expect(tplCount.mock.calls[0][0].where.AND).toBeUndefined();
  });
});

describe("listTemplates difficulty filter", () => {
  beforeEach(() => {
    tplFindMany.mockReset();
    tplCount.mockReset();
    tplFindMany.mockResolvedValue([]);
    tplCount.mockResolvedValue(0);
  });

  it("adds where.difficulty when a specific level is requested", async () => {
    await listTemplates(
      { category: "ALL", page: 1, perPage: 6, sort: "popular", difficulty: "ADVANCED" },
      undefined
    );
    const where = tplFindMany.mock.calls[0][0].where;
    expect(where.difficulty).toBe("ADVANCED");
  });

  it("omits difficulty from where when ALL", async () => {
    await listTemplates(
      { category: "ALL", page: 1, perPage: 6, sort: "popular", difficulty: "ALL" },
      undefined
    );
    const where = tplFindMany.mock.calls[0][0].where;
    expect(where.difficulty).toBeUndefined();
  });
});

describe("applyTemplateToSite (Part ③ — replace an existing site's pages)", () => {
  it("refuses a site outside the workspace (IDOR guard)", async () => {
    siteFindFirst.mockResolvedValueOnce(null);
    await expect(applyTemplateToSite("w1", "u1", "other", "tpl1")).rejects.toBeInstanceOf(TemplateError);
    expect(pageDeleteMany).not.toHaveBeenCalled();
  });

  it("refuses a template not visible to the workspace", async () => {
    siteFindFirst.mockResolvedValueOnce({ id: "s1" });
    tplFindFirst.mockResolvedValueOnce(null);
    await expect(applyTemplateToSite("w1", "u1", "s1", "tplX")).rejects.toThrow("TEMPLATE_NOT_FOUND");
    expect(pageDeleteMany).not.toHaveBeenCalled();
  });

  it("replaces the site's pages with the template's (2 pages → the template's 3), sets templateId", async () => {
    // Site currently has 2 pages; the template being applied has 3.
    siteFindFirst.mockResolvedValueOnce({ id: "s1" });
    tplFindFirst.mockResolvedValueOnce({
      id: "tpl1",
      pages: [
        { name: "Home", slug: "home", position: 0, isHomePage: true, blocks: [{ id: "root" }] },
        { name: "About", slug: "about", position: 1, isHomePage: false, blocks: [] },
        { name: "Contact", slug: "contact", position: 2, isHomePage: false, blocks: [] },
      ],
    });
    siteUpdate.mockImplementation((args: { where: unknown; data: { templateId: string; pages: number } }) =>
      Promise.resolve({ id: "s1", templateId: args.data.templateId, pages: args.data.pages })
    );

    const site = await applyTemplateToSite("w1", "u1", "s1", "tpl1");

    // The site's existing 2 pages are deleted first.
    expect(pageDeleteMany).toHaveBeenCalledWith({ where: { siteId: "s1" } });

    // Exactly the template's 3 pages are recreated, all bound to the site.
    const created = pageCreateMany.mock.calls[0][0].data;
    expect(created).toHaveLength(3);
    expect(created.every((p: { siteId: string }) => p.siteId === "s1")).toBe(true);
    expect(created.map((p: { slug: string }) => p.slug)).toEqual(["home", "about", "contact"]);
    expect(created[0]).toMatchObject({ name: "Home", isHomePage: true });

    // delete ran before create (both inside the transaction, no empty-pages window).
    expect(pageDeleteMany.mock.invocationCallOrder[0]).toBeLessThan(pageCreateMany.mock.invocationCallOrder[0]);

    // The site now records the source template + refreshed page count + touch.
    const updateArg = siteUpdate.mock.calls[0][0];
    expect(updateArg.where).toEqual({ id: "s1" });
    expect(updateArg.data.templateId).toBe("tpl1");
    expect(updateArg.data.pages).toBe(3);
    expect(updateArg.data.lastEditedAt).toBeInstanceOf(Date);

    // Returned site is linked to the template it came from.
    expect(site.templateId).toBe("tpl1");
  });

  it("applies a template with zero pages without calling createMany", async () => {
    siteFindFirst.mockResolvedValueOnce({ id: "s1" });
    tplFindFirst.mockResolvedValueOnce({ id: "tpl0", pages: [] });
    siteUpdate.mockResolvedValueOnce({ id: "s1", templateId: "tpl0", pages: 0 });

    await applyTemplateToSite("w1", "u1", "s1", "tpl0");

    expect(pageDeleteMany).toHaveBeenCalledWith({ where: { siteId: "s1" } });
    expect(pageCreateMany).not.toHaveBeenCalled();
    expect(siteUpdate.mock.calls[0][0].data.pages).toBe(0);
  });
});
