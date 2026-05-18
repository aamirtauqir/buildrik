/**
 * Regression for P0-8 (iter 10, 2026-05-19): editor auto-save default-sends
 * customCode.headScripts="" and bodyScripts="" on every tick. Old gate
 * triggered on `headCode !== undefined` and threw CUSTOM_CODE_NOT_AVAILABLE
 * for any Free-tier save, blocking ALL edits behind a paywall. Fix: gate on
 * non-empty content only.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
    slugHistory: { create: vi.fn(() => Promise.resolve()) },
  },
}));

vi.mock("@buildrik/shared/schemas/sites", () => ({}));

import { updateSiteSettings } from "@server/services/site-settings.service";

describe("updateSiteSettings — customCode gate", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
    updateMock.mockResolvedValue({ id: "site-1" });
  });

  it("allows Free-tier save when headCode and bodyCode are empty strings", async () => {
    await expect(
      updateSiteSettings("site-1", { headCode: "", bodyCode: "" }),
    ).resolves.toBeTruthy();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("throws CUSTOM_CODE_NOT_AVAILABLE on Free tier when headCode has content", async () => {
    findUniqueMock.mockResolvedValueOnce({ slug: "x", workspace: { plan: "FREE" } });
    await expect(
      updateSiteSettings("site-1", { headCode: "<script>alert(1)</script>" }),
    ).rejects.toThrow("CUSTOM_CODE_NOT_AVAILABLE");
  });

  it("allows Pro tier when headCode has content", async () => {
    findUniqueMock.mockResolvedValueOnce({ slug: "x", workspace: { plan: "PRO" } });
    await expect(
      updateSiteSettings("site-1", { headCode: "<script>analytics()</script>" }),
    ).resolves.toBeTruthy();
  });

  it("allows Free-tier user to clear previously-set custom code (empty string)", async () => {
    await expect(
      updateSiteSettings("site-1", { headCode: "", bodyCode: "" }),
    ).resolves.toBeTruthy();
  });
});
