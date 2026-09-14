/**
 * getLocales — the editor's Settings → Localization (Clone 3397:32376 Locales
 * table, 3737:44869 Translation checklist).
 *
 * The fixture is the seed (`prisma/seed-settings-clone.ts`) in mock form:
 * six pages in site order, `fr` on the first two, `ar` on none. The default
 * locale is always LIVE at `/`; the others count non-empty
 * `translations[code]` entries and list the untranslated page names in site
 * order. The output is run through the shared Zod contract.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { localesSummarySchema } from "@buildrik/shared/schemas/site-detail";

const { db } = vi.hoisted(() => ({
  db: {
    site: { findUnique: vi.fn() },
    page: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getLocales } from "@server/services/site-detail.service";

const PAGE_NAMES = ["Home", "Menu", "Contact", "About", "Reservations", "Privacy"];

function pages(translatedInto: Record<string, number>) {
  return PAGE_NAMES.map((name, i) => {
    const translations: Record<string, unknown> = {};
    for (const [code, count] of Object.entries(translatedInto)) {
      if (i < count) translations[code] = { blocks: [] };
    }
    return { name, translations: Object.keys(translations).length ? translations : null };
  });
}

beforeEach(() => {
  db.site.findUnique.mockReset();
  db.page.findMany.mockReset();
});

describe("getLocales — the seeded site", () => {
  it("builds the Locales table and the checklists, and matches the shared contract", async () => {
    db.site.findUnique.mockResolvedValue({ defaultLocale: "en", enabledLocales: ["en", "fr", "ar"], deletedAt: null });
    db.page.findMany.mockResolvedValue(pages({ fr: 2 }));

    const summary = localesSummarySchema.parse(await getLocales("s1"));

    expect(summary).toEqual({
      total: 6,
      locales: [
        { code: "en", path: "/", translated: 6, total: 6, status: "LIVE", pending: [] },
        { code: "fr", path: "/fr", translated: 2, total: 6, status: "PENDING", pending: ["Contact", "About", "Reservations", "Privacy"] },
        { code: "ar", path: "/ar", translated: 0, total: 6, status: "NOT_STARTED", pending: PAGE_NAMES },
      ],
    });
    expect(db.page.findMany).toHaveBeenCalledWith({
      where: { siteId: "s1" },
      orderBy: { position: "asc" },
      select: { name: true, translations: true },
    });
  });

  it("is LIVE for a locale every page carries, and ignores empty entries", async () => {
    db.site.findUnique.mockResolvedValue({ defaultLocale: "en", enabledLocales: ["en", "fr", "de"], deletedAt: null });
    db.page.findMany.mockResolvedValue([
      { name: "Home", translations: { fr: { blocks: [] }, de: {} } },
      { name: "Menu", translations: { fr: { blocks: [{ type: "text" }] }, de: null } },
    ]);

    const { locales } = await getLocales("s1");

    expect(locales[1]).toEqual({ code: "fr", path: "/fr", translated: 2, total: 2, status: "LIVE", pending: [] });
    expect(locales[2]).toEqual({ code: "de", path: "/de", translated: 0, total: 2, status: "NOT_STARTED", pending: ["Home", "Menu"] });
  });

  it("keeps the enabled-locale order and reads the default locale as LIVE even when it is not first", async () => {
    db.site.findUnique.mockResolvedValue({ defaultLocale: "fr", enabledLocales: ["en", "fr"], deletedAt: null });
    db.page.findMany.mockResolvedValue([{ name: "Home", translations: null }]);

    const { locales } = await getLocales("s1");

    expect(locales.map((l) => [l.code, l.path, l.status])).toEqual([
      ["en", "/en", "NOT_STARTED"],
      ["fr", "/", "LIVE"],
    ]);
  });

  it("is LIVE with nothing pending for a site with no pages yet", async () => {
    db.site.findUnique.mockResolvedValue({ defaultLocale: "en", enabledLocales: ["en", "ar"], deletedAt: null });
    db.page.findMany.mockResolvedValue([]);

    await expect(getLocales("s1")).resolves.toEqual({
      total: 0,
      locales: [
        { code: "en", path: "/", translated: 0, total: 0, status: "LIVE", pending: [] },
        { code: "ar", path: "/ar", translated: 0, total: 0, status: "LIVE", pending: [] },
      ],
    });
  });

  it("throws SITE_NOT_FOUND for a missing or deleted site", async () => {
    db.site.findUnique.mockResolvedValueOnce(null);
    await expect(getLocales("missing")).rejects.toThrow("SITE_NOT_FOUND");
    db.site.findUnique.mockResolvedValueOnce({ defaultLocale: "en", enabledLocales: ["en"], deletedAt: new Date() });
    await expect(getLocales("gone")).rejects.toThrow("SITE_NOT_FOUND");
    expect(db.page.findMany).not.toHaveBeenCalled();
  });
});
