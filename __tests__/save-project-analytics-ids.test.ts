/**
 * I-1c: `settings` (Site.projectSettings) is `z.unknown()` at the save
 * boundary, and its analytics ids reach every published page's inline
 * scripts. The write boundary refuses only injection-shaped ids
 * (`ANALYTICS_ID_SAFE`, one rule for all providers) and empties them
 * leniently: the save and everything else lands. It does NOT apply the
 * editor's strict per-provider formats — ids saved under the looser rules the
 * screen had before 2026-09-14 (GTM-XXXX, 6-15 char Clarity) must survive a
 * save with their verifiedAt. Output escaping (AnalyticsInjector) covers the rest.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const siteFindUnique = vi.fn();
const siteUpdate = vi.fn();

vi.mock("@/lib/prisma", () => {
  const tx = {
    page: { findMany: vi.fn(async () => []), findFirst: vi.fn(async () => null), deleteMany: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    formBlock: { deleteMany: vi.fn() },
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

const BREAKOUT = "x');alert(1)//</script>";

async function storedSettings(settings: unknown) {
  const result = await saveProjectData({ siteId: "s_1", pages: [{ id: "p_1", blocks: [] }], settings } as never);
  expect(result.success).toBe(true);
  return siteUpdate.mock.calls[0][0].data.projectSettings as Record<string, unknown>;
}

describe("saveProjectData — analytics ids (I-1c)", () => {
  it("keeps ids of the documented shapes untouched", async () => {
    const analytics = {
      googleAnalytics: { enabled: true, measurementId: "G-ABCD123456", verifiedAt: "2026-09-01T00:00:00.000Z" },
      googleTagManager: { enabled: true, containerId: "GTM-ABC1234" },
      facebookPixel: { enabled: true, pixelId: "1234567890123456" },
      microsoftClarity: { enabled: false, projectId: "abcdefghij" },
    };
    const stored = await storedSettings({ analytics, seo: { titleTemplate: "%s" } });
    expect(stored.analytics).toEqual(analytics);
    expect(stored.seo).toEqual({ titleTemplate: "%s" });
  });

  it("drops a malformed id (and its verifiedAt) but stores the rest of the settings", async () => {
    const stored = await storedSettings({
      analytics: {
        googleAnalytics: { enabled: true, measurementId: BREAKOUT, verifiedAt: "2026-09-01T00:00:00.000Z" },
        googleTagManager: { enabled: true, containerId: BREAKOUT },
        facebookPixel: { enabled: true, pixelId: BREAKOUT },
        microsoftClarity: { enabled: true, projectId: BREAKOUT },
        googleAds: { enabled: false, conversionId: "AW-123" },
      },
      seo: { titleTemplate: "%s" },
    });
    expect(stored.analytics).toEqual({
      googleAnalytics: { enabled: true, measurementId: "" },
      googleTagManager: { enabled: true, containerId: "" },
      facebookPixel: { enabled: true, pixelId: "" },
      microsoftClarity: { enabled: true, projectId: "" },
      googleAds: { enabled: false, conversionId: "AW-123" },
    });
    expect(stored.seo).toEqual({ titleTemplate: "%s" });
  });

  it("keeps ids saved under the pre-2026-09-14 looser client rules, with verifiedAt", async () => {
    const analytics = {
      googleTagManager: { enabled: true, containerId: "GTM-ABCD", verifiedAt: "2026-09-01T00:00:00.000Z" },
      microsoftClarity: { enabled: true, projectId: "abc123", verifiedAt: "2026-09-01T00:00:00.000Z" },
      googleAnalytics: { enabled: true, measurementId: "G-ABCD1234", verifiedAt: "2026-09-01T00:00:00.000Z" },
    };
    expect((await storedSettings({ analytics })).analytics).toEqual(analytics);
    siteUpdate.mockClear();
    const longGtm = { googleTagManager: { enabled: true, containerId: "GTM-ABCDEFGHIJ", verifiedAt: "2026-09-01T00:00:00.000Z" } };
    expect((await storedSettings({ analytics: longGtm })).analytics).toEqual(longGtm);
  });

  it("empties the classic breakout payload", async () => {
    const stored = await storedSettings({
      analytics: { googleAnalytics: { enabled: true, measurementId: "x');alert(1)//", verifiedAt: "2026-09-01T00:00:00.000Z" } },
    });
    expect(stored.analytics).toEqual({ googleAnalytics: { enabled: true, measurementId: "" } });
  });

  it("drops a non-string id too", async () => {
    const stored = await storedSettings({ analytics: { googleAnalytics: { enabled: true, measurementId: { evil: 1 } } } });
    expect(stored.analytics).toEqual({ googleAnalytics: { enabled: true, measurementId: "" } });
  });
});
