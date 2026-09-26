/**
 * siteDetail.sharing.list must reveal the share-link `token` (the bearer
 * credential for the draft) only to someone with EDITOR+ on the site — a
 * VIEWER who can merely see the list must not be able to read it off
 * (S-10).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const assertSiteAccessMock = vi.fn();
const checkSiteRoleMock = vi.fn();
const listShareLinksMock = vi.fn();

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
    code: string;
    constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
  },
}));
vi.mock("@/server/services/share-link.service", () => ({
  listShareLinks: (...a: unknown[]) => listShareLinksMock(...a),
  revokeShareLink: vi.fn(),
  createShareLink: vi.fn(),
}));
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite: vi.fn() }));

import { siteDetailRouter } from "@/server/trpc/routers/site-detail";
import { PermissionError } from "@/server/services/permission.service";

const caller = () => siteDetailRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);

beforeEach(() => {
  [assertSiteAccessMock, checkSiteRoleMock, listShareLinksMock].forEach((m) => m.mockReset());
  listShareLinksMock.mockResolvedValue([]);
});

describe("siteDetail.sharing.list — token reveal gate (S-10)", () => {
  it("calls listShareLinks(siteId, false) for a VIEWER (no EDITOR access)", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    checkSiteRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    await caller().sharing.list({ siteId: "s1" });
    expect(listShareLinksMock).toHaveBeenCalledWith("s1", false);
  });

  it("calls listShareLinks(siteId, true) for an EDITOR", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    await caller().sharing.list({ siteId: "s1" });
    expect(listShareLinksMock).toHaveBeenCalledWith("s1", true);
  });

  it("still FORBIDDEN for a non-member; never reaches listShareLinks", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    await expect(caller().sharing.list({ siteId: "s1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listShareLinksMock).not.toHaveBeenCalled();
  });
});
