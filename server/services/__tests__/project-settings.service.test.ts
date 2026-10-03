/**
 * Settings Phase B — BE-1 / BE-2: the JSON-only site settings.
 *
 * `updateProjectSettings` is the Settings Save's JSON half: it replaces the
 * patched analytics / redirects blocks, merges `customCode` (the patch carries
 * only `globalCss`), gates non-empty global CSS on Pro like head/body code,
 * leaves `lastEditedAt` (the page save's conflict token) alone, and reports
 * safe-but-legacy analytics ids as a warning. `keepValidJsonOnlySettings` is
 * the same schema at the autosave boundary: a failing key keeps its stored value.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { tx } = vi.hoisted(() => ({
  tx: {
    $executeRaw: vi.fn(),
    site: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx) },
}));

import { keepValidJsonOnlySettings, updateProjectSettings } from "@/server/services/site-settings.service";

const stored = {
  analytics: { googleAnalytics: { enabled: true, measurementId: "G-OLD0000000" } },
  customCode: { globalCss: "body{}", headScripts: "<legacy>" },
  designTokens: [{ name: "--x" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  tx.site.findUnique.mockResolvedValue({ projectSettings: stored, deletedAt: null, workspace: { plan: "PRO" } });
  tx.site.update.mockResolvedValue({});
});

const written = () => tx.site.update.mock.calls[0][0].data as Record<string, unknown>;

describe("updateProjectSettings (BE-2)", () => {
  it("replaces the patched block, keeps every other key, and returns what it stored", async () => {
    const analytics = { googleTagManager: { enabled: true, containerId: "GTM-ABC1234" } };
    const result = await updateProjectSettings("s1", { analytics });

    expect(written()).toEqual({ projectSettings: { ...stored, analytics } });
    expect(written()).not.toHaveProperty("lastEditedAt");
    expect(result).toEqual({ saved: { analytics }, warnings: { legacyAnalyticsIds: [] } });
  });

  it("merges customCode: the patch's globalCss over whatever else the block holds", async () => {
    await updateProjectSettings("s1", { customCode: { globalCss: "h1{color:red}" } });
    expect((written().projectSettings as Record<string, unknown>).customCode).toEqual({
      globalCss: "h1{color:red}",
      headScripts: "<legacy>",
    });
  });

  it("merges seo.author into the stored seo — the old Twitter handle and anything else there stay", async () => {
    tx.site.findUnique.mockResolvedValue({
      projectSettings: { ...stored, seo: { twitterHandle: "@bella", author: "Old" } },
      deletedAt: null,
      workspace: { plan: "FREE" },
    });
    const result = await updateProjectSettings("s1", { seo: { author: "Elena Rossi" } });
    expect((written().projectSettings as Record<string, unknown>).seo).toEqual({ twitterHandle: "@bella", author: "Elena Rossi" });
    expect(result.saved).toEqual({ seo: { twitterHandle: "@bella", author: "Elena Rossi" } });
  });

  it("refuses non-empty global CSS on FREE, and lets FREE clear it", async () => {
    tx.site.findUnique.mockResolvedValue({ projectSettings: stored, deletedAt: null, workspace: { plan: "FREE" } });
    await expect(updateProjectSettings("s1", { customCode: { globalCss: "h1{}" } })).rejects.toThrow("CUSTOM_CODE_NOT_AVAILABLE");
    expect(tx.site.update).not.toHaveBeenCalled();

    await updateProjectSettings("s1", { customCode: { globalCss: "" } });
    expect(tx.site.update).toHaveBeenCalledTimes(1);
  });

  it("warns about a safe id that misses its provider's format — never refuses it", async () => {
    const result = await updateProjectSettings("s1", {
      analytics: { googleTagManager: { enabled: true, containerId: "GTM-AB" }, googleAnalytics: { enabled: true, measurementId: "G-ABCD123456" } },
    });
    expect(result.warnings.legacyAnalyticsIds).toEqual(["googleTagManager"]);
    expect(tx.site.update).toHaveBeenCalledTimes(1);
  });

  it("locks the row before reading it, and refuses a deleted site", async () => {
    await updateProjectSettings("s1", { redirects: { suggestFrom404s: false } });
    expect(tx.$executeRaw).toHaveBeenCalledBefore(tx.site.findUnique);

    tx.site.findUnique.mockResolvedValue({ projectSettings: {}, deletedAt: new Date(), workspace: { plan: "PRO" } });
    await expect(updateProjectSettings("s1", { redirects: { suggestFrom404s: true } })).rejects.toThrow("SITE_NOT_FOUND");
  });
});

describe("keepValidJsonOnlySettings (BE-1 at the autosave boundary)", () => {
  it("stores a valid key in its parsed form (unknown members dropped)", () => {
    const out = keepValidJsonOnlySettings(
      { redirects: { suggestFrom404s: false, junk: 1 }, seo: { twitterHandle: "@a" } },
      {},
    );
    expect(out).toEqual({ redirects: { suggestFrom404s: false }, seo: { twitterHandle: "@a" } });
  });

  it("keeps the stored value of a key that fails its schema", () => {
    const out = keepValidJsonOnlySettings(
      { customCode: { globalCss: "x".repeat(10241) }, redirects: { suggestFrom404s: "yes" } },
      { customCode: { globalCss: "body{}" } },
    );
    expect(out).toEqual({ customCode: { globalCss: "body{}" } });
  });

  it("leaves non-objects and absent keys alone", () => {
    expect(keepValidJsonOnlySettings(null, stored)).toBeNull();
    expect(keepValidJsonOnlySettings({ seo: {} }, stored)).toEqual({ seo: {} });
  });
});
