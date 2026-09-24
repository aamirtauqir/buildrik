/**
 * activity.recent — the access gate in front of the site activity read
 * (post-Oct-1 R2). Same rule as `siteDetail.overview`: any active member of
 * the site's workspace; a non-member is FORBIDDEN, an unknown site NOT_FOUND,
 * and in both cases the service is never reached.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const assertSiteAccessMock = vi.fn();
const listSiteActivityMock = vi.fn();

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
  PermissionError: class PermissionError extends Error {
    constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
      super(message ?? code);
      this.name = "PermissionError";
    }
  },
}));
vi.mock("@/server/services/activity-log.service", () => ({
  listSiteActivity: (...a: unknown[]) => listSiteActivityMock(...a),
}));

import { activityRouter } from "@/server/trpc/routers/activity";
import { PermissionError } from "@/server/services/permission.service";

const prisma = {};
const caller = () => activityRouter.createCaller({ session: { user: { id: "u_1" } }, prisma } as never);

beforeEach(() => {
  assertSiteAccessMock.mockReset();
  listSiteActivityMock.mockReset();
});

describe("activity.recent", () => {
  it("returns the site's rows for a member, passing the filter through", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    listSiteActivityMock.mockResolvedValueOnce([{ id: "log:1" }]);

    await expect(caller().recent({ siteId: "s1", filter: "publish" })).resolves.toEqual([{ id: "log:1" }]);
    expect(assertSiteAccessMock).toHaveBeenCalledWith(prisma, "u_1", "s1");
    expect(listSiteActivityMock).toHaveBeenCalledWith("s1", "publish");
  });

  it("defaults the filter to all", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    listSiteActivityMock.mockResolvedValueOnce([]);
    await caller().recent({ siteId: "s1" });
    expect(listSiteActivityMock).toHaveBeenCalledWith("s1", "all");
  });

  it("is FORBIDDEN for a non-member and never reaches the service", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    await expect(caller().recent({ siteId: "s1", filter: "all" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listSiteActivityMock).not.toHaveBeenCalled();
  });

  it("is NOT_FOUND for an unknown site", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("NOT_FOUND"));
    await expect(caller().recent({ siteId: "missing", filter: "all" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(listSiteActivityMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown filter before touching access", async () => {
    await expect(caller().recent({ siteId: "s1", filter: "mine" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(assertSiteAccessMock).not.toHaveBeenCalled();
  });

  it("is UNAUTHORIZED without a session", async () => {
    const anon = activityRouter.createCaller({ session: null, prisma } as never);
    await expect(anon.recent({ siteId: "s1", filter: "all" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
