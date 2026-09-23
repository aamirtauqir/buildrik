/**
 * getRedirectSuggestions — the Redirects screen's "404 suggester" (Clone
 * 3397:32517) and the row the URL-repair draft (3519:19920) prefills from.
 *
 * The source is `Page.slugHistory`, the `{ slug, changedAt }` entries the
 * editor's PageManager appends on every slug change — the published site
 * sends no 404 events, so "renamed page with no redirect" is the only 404 we
 * can know about. The fixture is the seed's scratch site: a page renamed from
 * `pizza-menu` and no redirect for it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirectSuggestionSchema } from "@buildrik/shared/schemas/site-detail";

const { db } = vi.hoisted(() => ({
  db: {
    page: { findMany: vi.fn() },
    redirect: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getRedirectSuggestions } from "@server/services/site-detail.service";

type PageRow = { id: string; name: string; slug: string; isHomePage: boolean; slugHistory: unknown };

const page = (slug: string, over: Partial<PageRow> = {}): PageRow => ({
  id: `p-${slug}`,
  name: slug[0].toUpperCase() + slug.slice(1),
  slug,
  isHomePage: false,
  slugHistory: [],
  ...over,
});

const changed = (slug: string, changedAt: string) => ({ slug, changedAt });

function setup(pages: PageRow[], redirects: Array<{ fromPath: string }> = []) {
  db.page.findMany.mockResolvedValue(pages);
  db.redirect.findMany.mockResolvedValue(redirects);
}

beforeEach(() => {
  db.page.findMany.mockReset();
  db.redirect.findMany.mockReset();
});

describe("getRedirectSuggestions", () => {
  it("suggests an old slug → the page's current path, in the shared contract's shape", async () => {
    setup([
      page("home", { isHomePage: true }),
      page("menu", { slugHistory: [changed("pizza-menu", "2026-09-12T10:00:00.000Z")] }),
    ]);

    const rows = await getRedirectSuggestions("s1");

    expect(rows).toEqual([
      { fromPath: "/pizza-menu", toUrl: "/menu", pageId: "p-menu", pageName: "Menu", changedAt: "2026-09-12T10:00:00.000Z" },
    ]);
    expect(rows.every((r) => redirectSuggestionSchema.safeParse(r).success)).toBe(true);
    expect(db.page.findMany).toHaveBeenCalledWith({
      where: { siteId: "s1" },
      orderBy: { position: "asc" },
      select: { id: true, name: true, slug: true, isHomePage: true, slugHistory: true },
    });
    expect(db.redirect.findMany).toHaveBeenCalledWith({ where: { siteId: "s1" }, select: { fromPath: true } });
  });

  it("drops an old slug a redirect already covers", async () => {
    setup(
      [page("home", { isHomePage: true }), page("menu", { slugHistory: [changed("pizza-menu", "2026-09-12T10:00:00.000Z")] })],
      [{ fromPath: "/pizza-menu" }],
    );
    await expect(getRedirectSuggestions("s1")).resolves.toEqual([]);
  });

  it("maps the home page's old slug to /, whether flagged or first in site order", async () => {
    setup([page("welcome", { isHomePage: true, slugHistory: [changed("index", "2026-09-01T00:00:00.000Z")] }), page("about")]);
    expect((await getRedirectSuggestions("s1"))[0]).toMatchObject({ fromPath: "/index", toUrl: "/" });

    setup([page("landing", { slugHistory: [changed("start", "2026-09-01T00:00:00.000Z")] }), page("about")]);
    expect((await getRedirectSuggestions("s1"))[0]).toMatchObject({ fromPath: "/start", toUrl: "/" });
  });

  it("orders newest change first across pages", async () => {
    setup([
      page("home", { isHomePage: true }),
      page("about", { slugHistory: [changed("about-us", "2026-09-01T00:00:00.000Z")] }),
      page("menu", { slugHistory: [changed("pizza-menu", "2026-09-12T00:00:00.000Z")] }),
    ]);
    expect((await getRedirectSuggestions("s1")).map((r) => r.fromPath)).toEqual(["/pizza-menu", "/about-us"]);
  });

  it("skips an old slug that is now some page's live path — it is not a 404", async () => {
    setup([
      page("home", { isHomePage: true }),
      page("menu", { slugHistory: [changed("food", "2026-09-05T00:00:00.000Z")] }),
      page("food"),
    ]);
    await expect(getRedirectSuggestions("s1")).resolves.toEqual([]);
  });

  it("collapses a slug that came and went twice into one row, the newest", async () => {
    setup([
      page("home", { isHomePage: true }),
      page("b", { slugHistory: [changed("a", "2026-09-01T00:00:00.000Z"), changed("b", "2026-09-02T00:00:00.000Z"), changed("a", "2026-09-03T00:00:00.000Z")] }),
    ]);
    await expect(getRedirectSuggestions("s1")).resolves.toEqual([
      { fromPath: "/a", toUrl: "/b", pageId: "p-b", pageName: "B", changedAt: "2026-09-03T00:00:00.000Z" },
    ]);
  });

  it("survives a null history, a malformed entry, and a slug written with a leading slash", async () => {
    setup([
      page("home", { isHomePage: true, slugHistory: null }),
      page("menu", { slugHistory: [{ slug: 7 }, { slug: "no-date" }, { slug: "bad-date", changedAt: "yesterday" }, "junk", changed("/old-menu", "2026-09-12T00:00:00.000Z")] }),
    ]);
    await expect(getRedirectSuggestions("s1")).resolves.toEqual([
      { fromPath: "/old-menu", toUrl: "/menu", pageId: "p-menu", pageName: "Menu", changedAt: "2026-09-12T00:00:00.000Z" },
    ]);
  });

  it("is empty for a site with no pages", async () => {
    setup([]);
    await expect(getRedirectSuggestions("s1")).resolves.toEqual([]);
  });
});
