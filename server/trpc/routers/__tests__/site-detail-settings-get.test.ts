/**
 * siteDetail.settings.get — the access gate in front of the Settings ›
 * General read. Same rule as every other siteDetail read: a non-member is
 * FORBIDDEN and an unknown/soft-deleted site is NOT_FOUND, in both cases
 * before the service is reached / without an unhandled exception.
 *
 * Regression: this endpoint used to call `getSiteSettings` outside a
 * try/catch, so its `Error("SITE_NOT_FOUND")` (thrown for a soft-deleted
 * site) reached the client as an unhandled 500 instead of the NOT_FOUND
 * every sibling endpoint (`overview`, `locales`) already translates it to —
 * reproduced live against a soft-deleted fixture site (Settings › General
 * showed "Couldn't load your site settings", not "Site not found").
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const assertSiteAccessMock = vi.fn();
const getSiteSettingsMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/permission.service", () => ({
  assertSiteAccess: (...a: unknown[]) => assertSiteAccessMock(...a),
  checkSiteRole: vi.fn(),
  PermissionError: class PermissionError extends Error {
    constructor(
      public code: "NOT_FOUND" | "FORBIDDEN",
      message?: string,
    ) {
      super(message ?? code);
      this.name = "PermissionError";
    }
  },
}));
vi.mock("@/server/services/site-detail.service", () => ({
  getSiteOverview: vi.fn(),
  getSettingsOverview: vi.fn(),
  getLocales: vi.fn(),
  getRedirectSuggestions: vi.fn(),
}));
vi.mock("@/server/services/site-settings.service", () => ({
  getSiteSettings: (...a: unknown[]) => getSiteSettingsMock(...a),
  updateSiteSettings: vi.fn(),
}));

import { siteDetailRouter } from "@/server/trpc/routers/site-detail";
import { PermissionError } from "@/server/services/permission.service";

const prisma = {};
function caller() {
  return siteDetailRouter.createCaller({ session: { user: { id: "u_1" } }, prisma } as never);
}

beforeEach(() => {
  assertSiteAccessMock.mockReset();
  getSiteSettingsMock.mockReset();
});

describe("siteDetail.settings.get", () => {
  it("returns the service's settings for a member of the site's workspace", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    getSiteSettingsMock.mockResolvedValueOnce({ id: "s1", name: "Site" });

    await expect(caller().settings.get({ siteId: "s1" })).resolves.toEqual({ id: "s1", name: "Site" });
    expect(assertSiteAccessMock).toHaveBeenCalledWith(prisma, "u_1", "s1");
    expect(getSiteSettingsMock).toHaveBeenCalledWith("s1");
  });

  it("is FORBIDDEN for a non-member and never reaches the service", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    await expect(caller().settings.get({ siteId: "s1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getSiteSettingsMock).not.toHaveBeenCalled();
  });

  it("translates the service's SITE_NOT_FOUND (soft-deleted site) to NOT_FOUND, not an unhandled 500", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    getSiteSettingsMock.mockRejectedValueOnce(new Error("SITE_NOT_FOUND"));
    await expect(caller().settings.get({ siteId: "gone" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
