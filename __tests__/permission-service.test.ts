import { describe, it, expect, vi } from "vitest";
import { assertSiteAccess, checkSiteRole, PermissionError } from "@/server/services/permission.service";
import type { PrismaClient } from "@prisma/client";

/**
 * makeDb models the three reads the permission layer now does:
 *  - site.findUnique          → the site (for its workspaceId)
 *  - workspaceMember.findFirst → the ACTIVE member ({ id, role, _count.sitePermissions })
 *  - sitePermission.findUnique → THIS site's permission row (roleOverride) or null
 *
 * `siteCount` is how many SitePermission rows the member has in total (0 = the
 * "all sites" default; >0 = scoped to specific sites). `thisSiteRow` is the row
 * for the requested site (null = the member has no grant for it).
 */
function makeDb(
  site: { workspaceId: string } | null,
  member: { id?: string; role: string; siteCount: number } | null,
  thisSiteRow: { roleOverride: string } | null = null,
) {
  return {
    site: { findUnique: vi.fn().mockResolvedValue(site) },
    workspaceMember: {
      findFirst: vi.fn().mockResolvedValue(
        member ? { id: member.id ?? "m1", role: member.role, _count: { sitePermissions: member.siteCount } } : null,
      ),
    },
    sitePermission: { findUnique: vi.fn().mockResolvedValue(thisSiteRow) },
  } as unknown as PrismaClient;
}

describe("checkSiteRole", () => {
  it("VIEWER attempting EDITOR operation throws FORBIDDEN", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "VIEWER", siteCount: 0 });
    await expect(checkSiteRole(db, "u1", "s1", "EDITOR")).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
  });

  it("EDITOR with minRole=ADMIN throws FORBIDDEN", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "EDITOR", siteCount: 0 });
    await expect(checkSiteRole(db, "u1", "s1", "ADMIN")).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
  });

  it("ADMIN with minRole=ADMIN resolves", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "ADMIN", siteCount: 0 });
    await expect(checkSiteRole(db, "u1", "s1", "ADMIN")).resolves.toBeUndefined();
  });

  it("OWNER with any minRole resolves", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "OWNER", siteCount: 0 });
    await expect(checkSiteRole(db, "u1", "s1", "OWNER")).resolves.toBeUndefined();
  });

  it("roleOverride downgrades access: workspace ADMIN + VIEWER override throws FORBIDDEN for ADMIN", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "ADMIN", siteCount: 1 }, { roleOverride: "VIEWER" });
    await expect(checkSiteRole(db, "u1", "s1", "ADMIN")).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
  });

  it("roleOverride upgrades access: workspace VIEWER + EDITOR override resolves for EDITOR", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "VIEWER", siteCount: 1 }, { roleOverride: "EDITOR" });
    await expect(checkSiteRole(db, "u1", "s1", "EDITOR")).resolves.toBeUndefined();
  });

  // ─── Per-site scoping (was never enforced — CR1) ─────────────────────────
  it("SCOPED member with NO grant for this site throws FORBIDDEN even if their role would allow it", async () => {
    // Member is EDITOR and has 2 site grants, but none for the requested site.
    const db = makeDb({ workspaceId: "ws1" }, { role: "EDITOR", siteCount: 2 }, null);
    await expect(checkSiteRole(db, "u1", "s-other", "EDITOR")).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
  });

  it("UNSCOPED member (no site grants) keeps full role-based access to any site", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "EDITOR", siteCount: 0 }, null);
    await expect(checkSiteRole(db, "u1", "s1", "EDITOR")).resolves.toBeUndefined();
  });

  it("ADMIN is never site-scoped: reaches a site they have no grant for", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "ADMIN", siteCount: 3 }, null);
    await expect(checkSiteRole(db, "u1", "s-other", "EDITOR")).resolves.toBeUndefined();
  });

  it("site not found throws NOT_FOUND", async () => {
    const db = makeDb(null, null);
    await expect(checkSiteRole(db, "u1", "s1", "EDITOR")).rejects.toMatchObject({
      name: "PermissionError",
      code: "NOT_FOUND",
    });
  });

  it("user not a workspace member throws FORBIDDEN", async () => {
    const db = makeDb({ workspaceId: "ws1" }, null);
    await expect(checkSiteRole(db, "u1", "s1", "EDITOR")).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
  });

  it("throws FORBIDDEN for a SUSPENDED member", async () => {
    // The ACTIVE filter causes findFirst to return null for suspended members
    const db = makeDb({ workspaceId: "ws1" }, null);
    await expect(checkSiteRole(db, "u1", "s1", "EDITOR")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("multi-workspace isolation: ADMIN in workspace-A cannot access site in workspace-B", async () => {
    const db = makeDb({ workspaceId: "ws-B" }, null);
    await expect(checkSiteRole(db, "u1", "s1", "ADMIN")).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
    expect(
      (db.workspaceMember.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0].where.workspaceId,
    ).toBe("ws-B");
  });

  // ─── Bearer-token cross-workspace guard (codex P1-H2) ────────────────────
  it("bearer-auth: token from workspace-A cannot access site in workspace-B even when user belongs to both", async () => {
    const db = makeDb({ workspaceId: "ws-B" }, { role: "OWNER", siteCount: 0 });
    await expect(
      checkSiteRole(db, "u1", "s1", "EDITOR", { workspaceId: "ws-A" }),
    ).rejects.toMatchObject({ name: "PermissionError", code: "FORBIDDEN" });
    // Reject before workspace-member lookup — workspaceMember.findFirst should not run.
    expect((db.workspaceMember.findFirst as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it("bearer-auth: token whose workspaceId matches the site's workspaceId proceeds to member check", async () => {
    const db = makeDb({ workspaceId: "ws-A" }, { role: "EDITOR", siteCount: 0 });
    await expect(
      checkSiteRole(db, "u1", "s1", "EDITOR", { workspaceId: "ws-A" }),
    ).resolves.toBeUndefined();
  });
});

describe("assertSiteAccess", () => {
  it("rejects when bearer.workspaceId does not match the site's workspaceId", async () => {
    const db = {
      site: { findUnique: vi.fn().mockResolvedValue({ workspaceId: "ws-B" }) },
      workspaceMember: { findFirst: vi.fn() },
      sitePermission: { findUnique: vi.fn() },
    } as unknown as PrismaClient;
    await expect(
      assertSiteAccess(db, "u1", "s1", { workspaceId: "ws-A" }),
    ).rejects.toBeInstanceOf(PermissionError);
    expect((db.workspaceMember.findFirst as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it("permits when bearer is absent (cookie session) and an UNSCOPED ACTIVE member exists", async () => {
    const db = makeDb({ workspaceId: "ws-A" }, { role: "EDITOR", siteCount: 0 });
    await expect(assertSiteAccess(db, "u1", "s1")).resolves.toBeUndefined();
  });

  it("permits when bearer.workspaceId matches and an ACTIVE member exists", async () => {
    const db = makeDb({ workspaceId: "ws-A" }, { role: "EDITOR", siteCount: 0 });
    await expect(assertSiteAccess(db, "u1", "s1", { workspaceId: "ws-A" })).resolves.toBeUndefined();
  });

  it("rejects a SCOPED member reaching a site outside their grant (CR1)", async () => {
    const db = makeDb({ workspaceId: "ws-A" }, { role: "EDITOR", siteCount: 1 }, null);
    await expect(assertSiteAccess(db, "u1", "s-other")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permits a SCOPED member reaching a site they were granted", async () => {
    const db = makeDb({ workspaceId: "ws-A" }, { role: "EDITOR", siteCount: 1 }, { roleOverride: "EDITOR" });
    await expect(assertSiteAccess(db, "u1", "s1")).resolves.toBeUndefined();
  });
});
