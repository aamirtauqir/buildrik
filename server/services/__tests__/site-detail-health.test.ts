/**
 * Site health scores what the editor actually writes.
 *
 * The SEO component counted pages whose `seoTitle` AND `seoDescription`
 * COLUMNS were set, but the editor writes a page's SEO into its `settings`
 * JSON — checked in the database: settings.seo populated, both columns null.
 * So SEO scored 0% for every site built in the editor, which is every site.
 * The favicon component scored `touchIcon` alone while calling itself
 * "Favicon", so a site with a favicon and no Apple touch icon read 0 on a row
 * naming the thing it has.
 *
 * Walked live on a three-page site with SEO set on one page: the card moved
 * from "30/100 · Weakest: SEO 0%" to "40/100 · SEO 33%".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { db } = vi.hoisted(() => ({ db: {
  site: { findUnique: vi.fn() },
  page: { count: vi.fn(), findMany: vi.fn() },
  siteAnalytics: { aggregate: vi.fn() },
  workspaceMember: { count: vi.fn() },
  formSubmission: { count: vi.fn() },
  activityLog: { findMany: vi.fn() },
  domain: { findFirst: vi.fn() },
  formBlock: { findMany: vi.fn() },
} }));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getSiteOverview } from "@server/services/site-detail.service";

const baseSite = {
  id: "s1",
  name: "Bella",
  slug: "bella",
  status: "DRAFT",
  publishedUrl: null,
  lastPublishedAt: null,
  lastPublishedBy: null,
  createdAt: new Date(),
  workspaceId: "w1",
  touchIcon: null,
  favicon: null,
};

function setup(pages: unknown[], siteOverrides: Record<string, unknown> = {}) {
  db.site.findUnique.mockResolvedValue({ ...baseSite, ...siteOverrides });
  db.page.count.mockResolvedValue(pages.length);
  db.page.findMany.mockResolvedValue(pages);
  db.siteAnalytics.aggregate.mockResolvedValue({ _sum: { visitors: 0 } });
  db.workspaceMember.count.mockResolvedValue(1);
  db.formSubmission.count.mockResolvedValue(0);
  db.activityLog.findMany.mockResolvedValue([]);
  db.domain.findFirst.mockResolvedValue(null);
  db.formBlock.findMany.mockResolvedValue([]);
}

beforeEach(() => {
  Object.values(db).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset()),
  );
});

describe("site health — SEO", () => {
  it("counts a page whose SEO lives in its settings JSON", async () => {
    setup([
      { seoTitle: null, seoDescription: null, settings: { seo: { metaTitle: "T", metaDescription: "D" } } },
      { seoTitle: null, seoDescription: null, settings: null },
      { seoTitle: null, seoDescription: null, settings: {} },
    ]);

    const overview = await getSiteOverview("s1");

    expect(overview.stats.healthBreakdown.seo).toBe(33);
  });

  it("still counts the legacy columns", async () => {
    setup([{ seoTitle: "T", seoDescription: "D", settings: null }]);
    const overview = await getSiteOverview("s1");
    expect(overview.stats.healthBreakdown.seo).toBe(100);
  });

  it("needs both a title and a description", async () => {
    setup([{ seoTitle: null, seoDescription: null, settings: { seo: { metaTitle: "T" } } }]);
    const overview = await getSiteOverview("s1");
    expect(overview.stats.healthBreakdown.seo).toBe(0);
  });
});

describe("site health — favicon", () => {
  it("a favicon alone scores the favicon row", async () => {
    setup([], { favicon: "https://cdn/favicon.ico" });
    const overview = await getSiteOverview("s1");
    expect(overview.stats.healthBreakdown.favicon).toBe(100);
  });

  it("a touch icon alone still counts", async () => {
    setup([], { touchIcon: "https://cdn/touch.png" });
    const overview = await getSiteOverview("s1");
    expect(overview.stats.healthBreakdown.favicon).toBe(100);
  });

  it("neither is zero", async () => {
    setup([]);
    const overview = await getSiteOverview("s1");
    expect(overview.stats.healthBreakdown.favicon).toBe(0);
  });
});
