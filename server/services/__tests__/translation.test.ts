import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const findUniqueMock = vi.fn();
const updateMock = vi.fn();
const siteFindUniqueMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    page: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
    site: {
      findUnique: (...args: unknown[]) => siteFindUniqueMock(...args),
    },
  },
}));

vi.mock("@/lib/constants/plan-limits", () => ({ PLAN_LIMITS: {} }));
vi.mock("@buildrik/shared/schemas/pages", () => ({}));

import {
  resolveTranslation,
  setTranslation,
  removeTranslation,
  buildFallbackChain,
} from "@server/services/page.service";

describe("buildFallbackChain", () => {
  it("region locale falls to base then default", () => {
    expect(buildFallbackChain("fr-FR", "en")).toEqual(["fr-FR", "fr", "en"]);
  });

  it("base-only locale falls straight to default", () => {
    expect(buildFallbackChain("de", "en")).toEqual(["de", "en"]);
  });

  it("default locale request returns single-entry chain", () => {
    expect(buildFallbackChain("en", "en")).toEqual(["en"]);
  });

  it("region matching default still includes base hop", () => {
    expect(buildFallbackChain("en-US", "en")).toEqual(["en-US", "en"]);
  });
});

describe("resolveTranslation", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
    siteFindUniqueMock.mockReset();
  });

  it("returns null when page missing", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    await expect(resolveTranslation("missing", "fr")).resolves.toBeNull();
  });

  it("exact-locale hit returns translation entry, isFallback=false", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "p1",
      siteId: "s1",
      blocks: [{ type: "hero" }],
      translations: { fr: { blocks: [{ type: "hero-fr" }] } },
      site: { defaultLocale: "en" },
    });
    const r = await resolveTranslation("p1", "fr");
    expect(r).toEqual({ locale: "fr", blocks: [{ type: "hero-fr" }], isFallback: false });
  });

  it("region locale falls back to base language, isFallback=true", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "p1",
      siteId: "s1",
      blocks: [{ type: "hero" }],
      translations: { fr: { blocks: [{ type: "hero-fr" }] } },
      site: { defaultLocale: "en" },
    });
    const r = await resolveTranslation("p1", "fr-FR");
    expect(r).toEqual({ locale: "fr", blocks: [{ type: "hero-fr" }], isFallback: true });
  });

  it("all-miss falls back to defaultLocale via Page.blocks (canonical), isFallback=true", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "p1",
      siteId: "s1",
      blocks: [{ type: "hero-en" }],
      translations: null,
      site: { defaultLocale: "en" },
    });
    const r = await resolveTranslation("p1", "de");
    expect(r).toEqual({ locale: "en", blocks: [{ type: "hero-en" }], isFallback: true });
  });

  it("default-locale request reads from Page.blocks directly", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "p1",
      siteId: "s1",
      blocks: [{ type: "hero-en" }],
      translations: { fr: { blocks: [{ type: "hero-fr" }] } },
      site: { defaultLocale: "en" },
    });
    const r = await resolveTranslation("p1", "en");
    expect(r).toEqual({ locale: "en", blocks: [{ type: "hero-en" }], isFallback: false });
  });
});

describe("setTranslation", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
    siteFindUniqueMock.mockReset();
  });

  it("rejects when page missing", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    await expect(
      setTranslation({ pageId: "x", siteId: "s1", locale: "fr", blocks: [] }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("rejects when siteId does not match page.siteId", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "p1", siteId: "OTHER", translations: null });
    await expect(
      setTranslation({ pageId: "p1", siteId: "s1", locale: "fr", blocks: [] }),
    ).rejects.toThrow("SITE_MISMATCH");
  });

  it("rejects when locale not in enabledLocales", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "p1", siteId: "s1", translations: null });
    siteFindUniqueMock.mockResolvedValueOnce({ defaultLocale: "en", enabledLocales: ["en", "fr"] });
    await expect(
      setTranslation({ pageId: "p1", siteId: "s1", locale: "de", blocks: [] }),
    ).rejects.toThrow("LOCALE_NOT_ENABLED");
  });

  it("rejects when writing the default locale (default lives on Page.blocks)", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "p1", siteId: "s1", translations: null });
    siteFindUniqueMock.mockResolvedValueOnce({ defaultLocale: "en", enabledLocales: ["en", "fr"] });
    await expect(
      setTranslation({ pageId: "p1", siteId: "s1", locale: "en", blocks: [] }),
    ).rejects.toThrow("DEFAULT_LOCALE_USES_BLOCKS");
  });

  it("merges new locale into existing translations map", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "p1",
      siteId: "s1",
      translations: { de: { blocks: [{ type: "hero-de" }] } },
    });
    siteFindUniqueMock.mockResolvedValueOnce({ defaultLocale: "en", enabledLocales: ["en", "fr", "de"] });
    updateMock.mockResolvedValueOnce({ id: "p1" });
    await setTranslation({ pageId: "p1", siteId: "s1", locale: "fr", blocks: [{ type: "hero-fr" }] });
    const call = updateMock.mock.calls[0][0];
    expect(call.where.id).toBe("p1");
    expect(call.data.translations).toEqual({
      de: { blocks: [{ type: "hero-de" }] },
      fr: { blocks: [{ type: "hero-fr" }] },
    });
  });
});

describe("removeTranslation", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
  });

  it("is idempotent when locale absent (returns page without update call)", async () => {
    const page = { id: "p1", siteId: "s1", translations: { fr: { blocks: [] } } };
    findUniqueMock.mockResolvedValueOnce(page);
    const r = await removeTranslation({ pageId: "p1", siteId: "s1", locale: "de" });
    expect(r).toBe(page);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("removes the targeted locale entry", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "p1",
      siteId: "s1",
      translations: { fr: { blocks: [{ a: 1 }] }, de: { blocks: [{ b: 2 }] } },
    });
    updateMock.mockResolvedValueOnce({ id: "p1" });
    await removeTranslation({ pageId: "p1", siteId: "s1", locale: "fr" });
    const call = updateMock.mock.calls[0][0];
    expect(call.data.translations).toEqual({ de: { blocks: [{ b: 2 }] } });
  });

  it("nulls the column when removing the last translation", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "p1",
      siteId: "s1",
      translations: { fr: { blocks: [{ a: 1 }] } },
    });
    updateMock.mockResolvedValueOnce({ id: "p1" });
    await removeTranslation({ pageId: "p1", siteId: "s1", locale: "fr" });
    const call = updateMock.mock.calls[0][0];
    // Prisma.JsonNull is the sentinel that maps to SQL NULL. The runtime
    // value is an opaque object exported from @prisma/client; identity
    // check is the right assertion here.
    expect(call.data.translations).toBe(Prisma.JsonNull);
  });

  it("rejects siteId mismatch", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "p1", siteId: "OTHER", translations: {} });
    await expect(
      removeTranslation({ pageId: "p1", siteId: "s1", locale: "fr" }),
    ).rejects.toThrow("SITE_MISMATCH");
  });
});
