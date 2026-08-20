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

/* The published-site password is Pro-only, and the only thing enforcing that
   was the dashboard's own <ProGate> — a disabled toggle. Verified live from a
   FREE workspace before the fix: posting `publishedPassword` to
   siteDetail.settings.update returned 200 and the site came back with one set.
   Clearing a password (null) stays free: nobody should be locked out of
   removing a gate they can no longer manage. */
describe("updateSiteSettings — published-site password gate", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
    updateMock.mockResolvedValue({ id: "s1" });
  });

  it("refuses to set one on FREE", async () => {
    findUniqueMock.mockResolvedValue({ slug: "s", deletedAt: null, workspace: { plan: "FREE" } });
    await expect(updateSiteSettings("s1", { publishedPassword: "hunter2" })).rejects.toThrow(
      "SITE_PASSWORD_NOT_AVAILABLE",
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("allows it on PRO — the gate is the plan, not the field", async () => {
    findUniqueMock.mockResolvedValue({ slug: "s", deletedAt: null, workspace: { plan: "PRO" } });
    /* Hashing the password needs ENCRYPTION_KEY, which this suite doesn't set;
       what matters here is that the PLAN check lets it through rather than
       throwing SITE_PASSWORD_NOT_AVAILABLE. */
    await expect(updateSiteSettings("s1", { publishedPassword: "hunter2" })).rejects.toThrow(
      /ENCRYPTION_KEY/,
    );
  });

  it("lets a FREE workspace clear one", async () => {
    findUniqueMock.mockResolvedValue({ slug: "s", deletedAt: null, workspace: { plan: "FREE" } });
    await updateSiteSettings("s1", { publishedPassword: null });
    expect(updateMock).toHaveBeenCalled();
  });
});
