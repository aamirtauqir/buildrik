/**
 * siteDetail.locales + settings.update(localeAutoRedirect) — the access gates
 * in front of the Localization read and the "Auto-redirect by browser" write
 * (Clone 3397:32376). The read is any active member; the write is ADMIN and
 * forwards the flag to the settings service; an unknown site is NOT_FOUND.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const assertSiteAccessMock = vi.fn();
const checkSiteRoleMock = vi.fn();
const getLocalesMock = vi.fn();
const updateSiteSettingsMock = vi.fn();

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
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
      super(message ?? code);
      this.name = "PermissionError";
    }
  },
}));
vi.mock("@/server/services/site-detail.service", () => ({
  getSiteOverview: vi.fn(),
  getSettingsOverview: vi.fn(),
  getLocales: (...a: unknown[]) => getLocalesMock(...a),
}));
vi.mock("@/server/services/site-settings.service", () => ({
  getSiteSettings: vi.fn(),
  updateSiteSettings: (...a: unknown[]) => updateSiteSettingsMock(...a),
}));
vi.mock("@/server/services/activity-log.service", () => ({
  recordForSite: vi.fn().mockResolvedValue(undefined),
}));

import { siteDetailRouter } from "@/server/trpc/routers/site-detail";
import { PermissionError } from "@/server/services/permission.service";

const prisma = {};
function caller() {
  return siteDetailRouter.createCaller({ session: { user: { id: "u_1" } }, prisma } as never);
}

beforeEach(() => {
  [assertSiteAccessMock, checkSiteRoleMock, getLocalesMock, updateSiteSettingsMock].forEach((m) => m.mockReset());
});

describe("siteDetail.locales", () => {
  it("returns the service's summary for a member of the site's workspace", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    getLocalesMock.mockResolvedValueOnce({ locales: [], total: 0 });

    await expect(caller().locales({ siteId: "s1" })).resolves.toEqual({ locales: [], total: 0 });
    expect(assertSiteAccessMock).toHaveBeenCalledWith(prisma, "u_1", "s1");
    expect(getLocalesMock).toHaveBeenCalledWith("s1");
  });

  it("is FORBIDDEN for a non-member and never reaches the service", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    await expect(caller().locales({ siteId: "s1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getLocalesMock).not.toHaveBeenCalled();
  });

  it("translates the service's SITE_NOT_FOUND to NOT_FOUND", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    getLocalesMock.mockRejectedValueOnce(new Error("SITE_NOT_FOUND"));
    await expect(caller().locales({ siteId: "gone" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("siteDetail.settings.update — localeAutoRedirect", () => {
  it("forwards the flag to the settings service for an ADMIN", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    updateSiteSettingsMock.mockResolvedValueOnce({ id: "s1", localeAutoRedirect: true });

    await expect(caller().settings.update({ id: "s1", localeAutoRedirect: true })).resolves.toEqual({
      id: "s1",
      localeAutoRedirect: true,
    });
    expect(checkSiteRoleMock).toHaveBeenCalledWith(prisma, "u_1", "s1", "ADMIN");
    expect(updateSiteSettingsMock).toHaveBeenCalledWith("s1", { localeAutoRedirect: true });
  });

  it("rejects a non-boolean before touching access", async () => {
    await expect(caller().settings.update({ id: "s1", localeAutoRedirect: "on" } as never)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(checkSiteRoleMock).not.toHaveBeenCalled();
  });
});
