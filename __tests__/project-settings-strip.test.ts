/**
 * SA-01 — the Site columns are the one source of truth for the settings they
 * back. `saveProjectData` stores `projectSettings` without them, so the JSON
 * copy the editor used to save verbatim can no longer drift from the column.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const siteUpdate = vi.fn();
vi.mock("@/lib/prisma", () => {
  const tx = {
    page: { findMany: vi.fn(async () => []), findFirst: vi.fn(async () => null), deleteMany: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    formBlock: { deleteMany: vi.fn() },
    site: { updateMany: (...a: unknown[]) => siteUpdate(...a) },
  };
  return {
    prisma: {
      site: { findUnique: vi.fn(async () => ({ id: "s_1", deletedAt: null })) },
      $transaction: async (fn: (t: unknown) => unknown) => fn(tx),
    },
  };
});

import { saveProjectData } from "@/server/services/sites.service";
import { stripColumnBackedSettings } from "@/server/services/site-settings.service";
import { SITE_COLUMN_FIELDS } from "@buildrik/shared/schemas/site-column-fields";

describe("stripColumnBackedSettings", () => {
  it("drops column-backed keys, keeps the rest", () => {
    const out = stripColumnBackedSettings({
      seo: { metaTitle: "T", favicon: "f", twitterHandle: "@a" },
      customCode: { headScripts: "<script src=x>", bodyScripts: "b", globalCss: ".a{}" },
      publishing: { publishedPassword: "p", provider: "vercel" },
      analytics: { ga: { enabled: true, id: "G-ABCDEFGHIJ" } },
    });
    expect(out).toEqual({
      seo: { twitterHandle: "@a" },
      customCode: { globalCss: ".a{}" },
      publishing: { provider: "vercel" },
      analytics: { ga: { enabled: true, id: "G-ABCDEFGHIJ" } },
    });
  });

  it("passes non-objects through", () => {
    expect(stripColumnBackedSettings(undefined)).toBeUndefined();
    expect(stripColumnBackedSettings(null)).toBeNull();
    expect(stripColumnBackedSettings("x")).toBe("x");
  });

  it("drops every field of the shared list, and only those", () => {
    const settings: Record<string, Record<string, unknown>> = {};
    for (const field of SITE_COLUMN_FIELDS) {
      const [section, key] = field.split(".");
      settings[section] = { ...settings[section], [key]: "v", kept: 1 };
    }
    expect(stripColumnBackedSettings(settings)).toEqual({
      seo: { kept: 1 },
      customCode: { kept: 1 },
      publishing: { kept: 1 },
    });
  });

  it("returns a copy — the caller's object is left as it was", () => {
    const input = { seo: { metaTitle: "T", twitterHandle: "@a" } };
    stripColumnBackedSettings(input);
    expect(input).toEqual({ seo: { metaTitle: "T", twitterHandle: "@a" } });
  });

  it("leaves a section that is not an object alone", () => {
    expect(stripColumnBackedSettings({ seo: null, customCode: "raw" })).toEqual({ seo: null, customCode: "raw" });
  });
});

describe("saveProjectData — SA-01", () => {
  beforeEach(() => {
    siteUpdate.mockReset().mockResolvedValue({ count: 1 });
  });

  it("stores projectSettings without the column-backed keys", async () => {
    await saveProjectData({
      siteId: "s_1",
      pages: [{ id: "p_1", blocks: [] }],
      settings: {
        seo: { metaTitle: "JSON copy", robotsTxt: "User-agent: *", twitterHandle: "@a" },
        customCode: { headScripts: "<script>h()</script>", bodyScripts: "", globalCss: ".a{}" },
        publishing: { publishedPassword: "plain", provider: "vercel" },
      },
    } as never);
    expect(siteUpdate.mock.calls[0][0].data.projectSettings).toEqual({
      seo: { twitterHandle: "@a" },
      customCode: { globalCss: ".a{}" },
      publishing: { provider: "vercel" },
    });
  });
});
