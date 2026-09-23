/**
 * siteDetail.settingsOverview — the access gate in front of the Overview read.
 * Same rule as `siteDetail.overview`: any active member of the site's
 * workspace may read it; a non-member is FORBIDDEN and an unknown site is
 * NOT_FOUND, and in both cases the service is never reached.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const assertSiteAccessMock = vi.fn();
const getSettingsOverviewMock = vi.fn();

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
    constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
      super(message ?? code);
      this.name = "PermissionError";
    }
  },
}));
vi.mock("@/server/services/site-detail.service", () => ({
  getSiteOverview: vi.fn(),
  getSettingsOverview: (...a: unknown[]) => getSettingsOverviewMock(...a),
}));

import { siteDetailRouter } from "@/server/trpc/routers/site-detail";
import { PermissionError } from "@/server/services/permission.service";

const prisma = {};
function caller() {
  return siteDetailRouter.createCaller({ session: { user: { id: "u_1" } }, prisma } as never);
}

beforeEach(() => {
  assertSiteAccessMock.mockReset();
  getSettingsOverviewMock.mockReset();
});

describe("siteDetail.settingsOverview", () => {
  it("returns the service's overview for a member of the site's workspace", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    getSettingsOverviewMock.mockResolvedValueOnce({ site: { name: "Bella Cucina" } });

    await expect(caller().settingsOverview({ siteId: "s1" })).resolves.toEqual({ site: { name: "Bella Cucina" } });

    expect(assertSiteAccessMock).toHaveBeenCalledWith(prisma, "u_1", "s1");
    expect(getSettingsOverviewMock).toHaveBeenCalledWith("s1");
  });

  it("is FORBIDDEN for a non-member and never reaches the service", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));

    await expect(caller().settingsOverview({ siteId: "s1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getSettingsOverviewMock).not.toHaveBeenCalled();
  });

  it("is NOT_FOUND for an unknown site", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("NOT_FOUND"));

    await expect(caller().settingsOverview({ siteId: "missing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(getSettingsOverviewMock).not.toHaveBeenCalled();
  });

  it("rejects a call without a siteId before touching access", async () => {
    await expect(caller().settingsOverview({} as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(assertSiteAccessMock).not.toHaveBeenCalled();
  });
});
