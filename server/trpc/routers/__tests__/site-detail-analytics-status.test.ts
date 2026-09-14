/**
 * siteDetail.analyticsStatus — the access gate in front of the Analytics
 * status read (Clone 3397:32295). Top-level because `siteDetail.analytics`
 * is already a leaf procedure. Same rule as `settingsOverview`: any active
 * member of the site's workspace may read it; a non-member is FORBIDDEN, an
 * unknown site NOT_FOUND, and the service is never reached in either case.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const assertSiteAccessMock = vi.fn();
const getAnalyticsStatusMock = vi.fn();

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
vi.mock("@/server/services/analytics.service", () => ({
  getSiteAnalytics: vi.fn(),
  getAnalyticsStatus: (...a: unknown[]) => getAnalyticsStatusMock(...a),
}));

import { siteDetailRouter } from "@/server/trpc/routers/site-detail";
import { PermissionError } from "@/server/services/permission.service";

const prisma = {};
function caller() {
  return siteDetailRouter.createCaller({ session: { user: { id: "u_1" } }, prisma } as never);
}

beforeEach(() => {
  assertSiteAccessMock.mockReset();
  getAnalyticsStatusMock.mockReset();
});

describe("siteDetail.analyticsStatus", () => {
  it("returns the service's status for a member of the site's workspace", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    getAnalyticsStatusMock.mockResolvedValueOnce({ lastEventAt: "2026-09-14T11:38:00.000Z", events24h: 40 });

    await expect(caller().analyticsStatus({ siteId: "s1" })).resolves.toEqual({
      lastEventAt: "2026-09-14T11:38:00.000Z",
      events24h: 40,
    });
    expect(assertSiteAccessMock).toHaveBeenCalledWith(prisma, "u_1", "s1");
    expect(getAnalyticsStatusMock).toHaveBeenCalledWith("s1");
  });

  it("is FORBIDDEN for a non-member and never reaches the service", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    await expect(caller().analyticsStatus({ siteId: "s1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getAnalyticsStatusMock).not.toHaveBeenCalled();
  });

  it("is NOT_FOUND for an unknown site", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("NOT_FOUND"));
    await expect(caller().analyticsStatus({ siteId: "missing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(getAnalyticsStatusMock).not.toHaveBeenCalled();
  });
});
