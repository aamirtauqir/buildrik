/**
 * sites router — Settings Phase B.
 *
 * BE-5 (PD-4): `rename` is ADMIN — an EDITOR is refused before the write.
 * BE-6 (PD-6, Q-B8): `restore` is OWNER (the delete's gate), records
 * `site.restored` with the forms it switched back on, and maps the service's
 * refusals; `listDeleted` lists the caller's workspace through its site scope;
 * a delete records the forms it switched off on its `site.deleted` entry.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  checkSiteRole: vi.fn(),
  siteScopeWhere: vi.fn(),
  renameSite: vi.fn(),
  restoreSite: vi.fn(),
  listDeletedSites: vi.fn(),
  deleteSite: vi.fn(),
  recordForSite: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/permission.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/permission.service")>()),
  checkSiteRole: m.checkSiteRole,
  siteScopeWhere: m.siteScopeWhere,
}));
vi.mock("@/server/trpc/workspace-ctx", () => ({ resolveWorkspaceId: vi.fn().mockResolvedValue("ws_1") }));
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite: m.recordForSite, record: vi.fn() }));
vi.mock("@/server/services/sites.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/sites.service")>()),
  renameSite: m.renameSite,
  restoreSite: m.restoreSite,
  listDeletedSites: m.listDeletedSites,
  deleteSite: m.deleteSite,
}));

import { sitesRouter } from "@/server/trpc/routers/sites";
import { PermissionError } from "@/server/services/permission.service";

const caller = () => sitesRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);

/** A member whose role is exactly `role`: checkSiteRole refuses anything above it. */
function actAs(role: "EDITOR" | "ADMIN" | "OWNER") {
  const rank = { EDITOR: 1, ADMIN: 2, OWNER: 3 } as const;
  m.checkSiteRole.mockImplementation(async (_db: unknown, _u: string, _s: string, min: keyof typeof rank) => {
    if (rank[min] > rank[role]) throw new PermissionError("FORBIDDEN", "Insufficient permissions");
  });
}

beforeEach(() => {
  Object.values(m).forEach((fn) => fn.mockReset());
  m.renameSite.mockResolvedValue({ id: "s1", name: "New" });
  m.restoreSite.mockResolvedValue({ site: { id: "s1" }, reactivatedFormBlockIds: ["f1"], reactivatedForms: 1 });
  m.deleteSite.mockResolvedValue({ success: true, deactivatedFormBlockIds: ["f1", "f2"] });
});

describe("sites.rename — ADMIN (BE-5, PD-4)", () => {
  it("an EDITOR is FORBIDDEN and nothing is written", async () => {
    actAs("EDITOR");
    await expect(caller().rename({ id: "s1", name: "New name" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(m.renameSite).not.toHaveBeenCalled();
  });

  it("an ADMIN renames", async () => {
    actAs("ADMIN");
    await caller().rename({ id: "s1", name: "New name" });
    expect(m.checkSiteRole).toHaveBeenCalledWith({}, "u_1", "s1", "ADMIN");
    expect(m.renameSite).toHaveBeenCalledWith("s1", "New name");
  });
});

describe("sites.delete records what restore needs (BE-6)", () => {
  it("puts the switched-off form ids on the site.deleted entry", async () => {
    actAs("OWNER");
    await caller().delete({ id: "s1", confirmName: "A" });
    expect(m.recordForSite).toHaveBeenCalledWith(
      expect.objectContaining({ action: "site.deleted", siteId: "s1", metadata: { formBlockIds: ["f1", "f2"] } }),
    );
  });
});

describe("sites.restore — OWNER (BE-6, Q-B8)", () => {
  it("an ADMIN is FORBIDDEN", async () => {
    actAs("ADMIN");
    await expect(caller().restore({ id: "s1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(m.restoreSite).not.toHaveBeenCalled();
  });

  it("an OWNER restores, and the restore is logged with the forms it switched on", async () => {
    actAs("OWNER");
    const result = await caller().restore({ id: "s1" });
    expect(m.restoreSite).toHaveBeenCalledWith("s1", "u_1");
    expect(result.reactivatedForms).toBe(1);
    expect(m.recordForSite).toHaveBeenCalledWith(
      expect.objectContaining({ action: "site.restored", siteId: "s1", metadata: { formBlockIds: ["f1"] } }),
    );
  });

  it.each([
    ["SITE_NOT_FOUND", "NOT_FOUND"],
    ["SITE_NOT_DELETED", "BAD_REQUEST"],
    ["RESTORE_WINDOW_PASSED", "PRECONDITION_FAILED"],
    ["SITE_LIMIT", "FORBIDDEN"],
  ])("maps %s to %s and logs nothing", async (thrown, code) => {
    actAs("OWNER");
    m.restoreSite.mockRejectedValue(new Error(thrown));
    await expect(caller().restore({ id: "s1" })).rejects.toMatchObject({ code });
    expect(m.recordForSite).not.toHaveBeenCalled();
  });
});

describe("sites.listDeleted (BE-6)", () => {
  it("lists the caller's workspace through the caller's site scope", async () => {
    m.siteScopeWhere.mockResolvedValue({ id: { in: ["s1"] } });
    m.listDeletedSites.mockResolvedValue([{ id: "s1" }]);
    await expect(caller().listDeleted()).resolves.toEqual([{ id: "s1" }]);
    expect(m.siteScopeWhere).toHaveBeenCalledWith({}, "u_1", "ws_1");
    expect(m.listDeletedSites).toHaveBeenCalledWith("ws_1", { id: { in: ["s1"] } });
  });
});
