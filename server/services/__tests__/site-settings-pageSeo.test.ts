/**
 * The SEO tab previews what the editor writes.
 *
 * `getSiteSettings` returned the SITE columns `metaTitle` / `metaDescription`,
 * and no screen in the product writes them — 0 of 52 rows in the dev database
 * had one. The editor's SEO panel writes the PAGE's settings JSON, so Site →
 * SEO showed "Meta title: Not set" straight after someone set it in the editor,
 * under a banner reading "SEO content is edited in the editor. This is a live
 * preview." Walked live before the fix: set a meta title in the editor, saved,
 * and the tab still said Not set.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const siteFindUnique = vi.fn();
const pageFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: (...a: unknown[]) => siteFindUnique(...a), update: vi.fn() },
    page: { findFirst: (...a: unknown[]) => pageFindFirst(...a) },
    slugHistory: { create: vi.fn() },
  },
}));
vi.mock("@buildrik/shared/schemas/sites", () => ({}));

import { getSiteSettings } from "@server/services/site-settings.service";

const site = {
  id: "s1",
  name: "Bella Cucina",
  slug: "bella",
  metaTitle: null,
  metaDescription: null,
  deletedAt: null,
  workspace: { plan: "FREE" },
};

beforeEach(() => {
  siteFindUnique.mockReset();
  pageFindFirst.mockReset();
  siteFindUnique.mockResolvedValue(site);
});

describe("getSiteSettings — page SEO", () => {
  it("carries the home page's SEO from its settings JSON", async () => {
    pageFindFirst.mockResolvedValue({
      name: "Home",
      seoTitle: null,
      seoDescription: null,
      settings: { seo: { metaTitle: "Bella Cucina — Trattoria", metaDescription: "Wood-fired." } },
    });

    const result = await getSiteSettings("s1");

    expect(result.pageSeo).toEqual({
      pageName: "Home",
      metaTitle: "Bella Cucina — Trattoria",
      metaDescription: "Wood-fired.",
      ogImage: null,
    });
  });

  it("falls back to the page's own columns when the JSON has none", async () => {
    pageFindFirst.mockResolvedValue({
      name: "Home",
      seoTitle: "From the column",
      seoDescription: "Also the column",
      settings: null,
    });

    const result = await getSiteSettings("s1");

    expect(result.pageSeo?.metaTitle).toBe("From the column");
    expect(result.pageSeo?.metaDescription).toBe("Also the column");
  });

  it("prefers the home page, then the first by position", async () => {
    pageFindFirst.mockResolvedValue({ name: "Home", seoTitle: null, seoDescription: null, settings: null });
    await getSiteSettings("s1");
    expect(pageFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ isHomePage: "desc" }, { position: "asc" }],
      }),
    );
  });

  it("is null for a site with no pages", async () => {
    pageFindFirst.mockResolvedValue(null);
    const result = await getSiteSettings("s1");
    expect(result.pageSeo).toBeNull();
  });

  it("treats an empty string as unset", async () => {
    pageFindFirst.mockResolvedValue({
      name: "Home",
      seoTitle: null,
      seoDescription: null,
      settings: { seo: { metaTitle: "   ", metaDescription: "" } },
    });
    const result = await getSiteSettings("s1");
    expect(result.pageSeo?.metaTitle).toBeNull();
    expect(result.pageSeo?.metaDescription).toBeNull();
  });
});
