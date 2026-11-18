/**
 * BK-08: a site's rollback history is that site's — theme.snapshots needs
 * access to the site — and theme.targets lists only the sites the member may
 * open (siteScopeWhere), not every site in the workspace.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const assertSiteAccessMock = vi.fn();
const listSiteThemeSnapshotsMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/trpc/guards", () => ({ requireAgencyLayer: vi.fn(async () => undefined) }));
vi.mock("@/server/trpc/workspace-ctx", () => ({ resolveWorkspaceId: vi.fn(async () => "ws_1") }));
vi.mock("@/server/services/permission.service", () => ({
  assertSiteAccess: (...a: unknown[]) => assertSiteAccessMock(...a),
  checkSiteRole: vi.fn(),
  checkWorkspaceRole: vi.fn(),
  PermissionError: class PermissionError extends Error {
    constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
      super(message ?? code);
      this.name = "PermissionError";
    }
  },
}));
vi.mock("@/server/services/theme.service", () => ({
  listSiteThemeSnapshots: (...a: unknown[]) => listSiteThemeSnapshotsMock(...a),
  ThemeError: class ThemeError extends Error {},
}));

import { themeRouter } from "@/server/trpc/routers/theme";
import { PermissionError } from "@/server/services/permission.service";

const caller = () => themeRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);

beforeEach(() => {
  assertSiteAccessMock.mockReset();
  listSiteThemeSnapshotsMock.mockReset();
});

describe("theme.snapshots — BK-08", () => {
  it("a member without access to the site is refused and the history is never read", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "scoped elsewhere"));
    await expect(caller().snapshots({ siteId: "s2" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(assertSiteAccessMock).toHaveBeenCalledWith(expect.anything(), "u_1", "s2");
    expect(listSiteThemeSnapshotsMock).not.toHaveBeenCalled();
  });

  it("a member with access reads that site's history", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    listSiteThemeSnapshotsMock.mockResolvedValueOnce([{ id: "t1" }]);
    await expect(caller().snapshots({ siteId: "s1" })).resolves.toEqual([{ id: "t1" }]);
    expect(listSiteThemeSnapshotsMock).toHaveBeenCalledWith("ws_1", "s1");
  });
});
