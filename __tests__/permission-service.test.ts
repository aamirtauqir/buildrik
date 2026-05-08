import { describe, it, expect, vi } from "vitest";
import { assertSiteAccess, checkSiteRole, PermissionError } from "@/server/services/permission.service";
import type { PrismaClient } from "@prisma/client";

function makeDb(
  site: { workspaceId: string } | null,
  member: { role: string; sitePermissions: { roleOverride: string }[] } | null
) {
  return {
    site: {
      findUnique: vi.fn().mockResolvedValue(site),
    },
    workspaceMember: {
      findFirst: vi.fn().mockResolvedValue(member),
    },
  } as unknown as PrismaClient;
}

describe("checkSiteRole", () => {
  it("VIEWER attempting EDITOR operation throws FORBIDDEN", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "VIEWER", sitePermissions: [] });
    await expect(checkSiteRole(db, "u1", "s1", "EDITOR")).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
  });

  it("EDITOR with minRole=ADMIN throws FORBIDDEN", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "EDITOR", sitePermissions: [] });
    await expect(checkSiteRole(db, "u1", "s1", "ADMIN")).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
  });

  it("ADMIN with minRole=ADMIN resolves", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "ADMIN", sitePermissions: [] });
    await expect(checkSiteRole(db, "u1", "s1", "ADMIN")).resolves.toBeUndefined();
  });

  it("OWNER with any minRole resolves", async () => {
    const db = makeDb({ workspaceId: "ws1" }, { role: "OWNER", sitePermissions: [] });
    await expect(checkSiteRole(db, "u1", "s1", "OWNER")).resolves.toBeUndefined();
  });

  it("roleOverride downgrades access: workspace ADMIN + VIEWER override throws FORBIDDEN for ADMIN", async () => {
    const db = makeDb(
      { workspaceId: "ws1" },
      { role: "ADMIN", sitePermissions: [{ roleOverride: "VIEWER" }] }
    );
    await expect(checkSiteRole(db, "u1", "s1", "ADMIN")).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
  });

  it("roleOverride upgrades access: workspace VIEWER + EDITOR override resolves for EDITOR", async () => {
    const db = makeDb(
      { workspaceId: "ws1" },
      { role: "VIEWER", sitePermissions: [{ roleOverride: "EDITOR" }] }
    );
    await expect(checkSiteRole(db, "u1", "s1", "EDITOR")).resolves.toBeUndefined();
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
    const db = {
      site: { findUnique: vi.fn().mockResolvedValue({ workspaceId: "ws1" }) },
      workspaceMember: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaClient;
    await expect(checkSiteRole(db, "u1", "s1", "EDITOR")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("multi-workspace isolation: ADMIN in workspace-A cannot access site in workspace-B", async () => {
    const db = {
      site: {
        findUnique: vi.fn().mockResolvedValue({ workspaceId: "ws-B" }),
      },
      workspaceMember: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaClient;
    await expect(checkSiteRole(db, "u1", "s1", "ADMIN")).rejects.toMatchObject({
      name: "PermissionError",
      code: "FORBIDDEN",
    });
    expect(
      (db.workspaceMember.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0].where.workspaceId
    ).toBe("ws-B");
  });

  // ─── Bearer-token cross-workspace guard (codex P1-H2) ────────────────────
  it("bearer-auth: token from workspace-A cannot access site in workspace-B even when user belongs to both", async () => {
    const db = {
      site: { findUnique: vi.fn().mockResolvedValue({ workspaceId: "ws-B" }) },
      workspaceMember: { findFirst: vi.fn().mockResolvedValue({ role: "OWNER", sitePermissions: [] }) },
    } as unknown as PrismaClient;
    await expect(
      checkSiteRole(db, "u1", "s1", "EDITOR", { workspaceId: "ws-A" }),
    ).rejects.toMatchObject({ name: "PermissionError", code: "FORBIDDEN" });
    // Reject before workspace-member lookup — workspaceMember.findFirst should not run.
    expect((db.workspaceMember.findFirst as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it("bearer-auth: token whose workspaceId matches the site's workspaceId proceeds to member check", async () => {
    const db = {
      site: { findUnique: vi.fn().mockResolvedValue({ workspaceId: "ws-A" }) },
      workspaceMember: {
        findFirst: vi.fn().mockResolvedValue({ role: "EDITOR", sitePermissions: [] }),
      },
    } as unknown as PrismaClient;
    await expect(
      checkSiteRole(db, "u1", "s1", "EDITOR", { workspaceId: "ws-A" }),
    ).resolves.toBeUndefined();
  });
});

describe("assertSiteAccess (bearer cross-check)", () => {
  it("rejects when bearer.workspaceId does not match the site's workspaceId", async () => {
    const db = {
      site: { findUnique: vi.fn().mockResolvedValue({ workspaceId: "ws-B" }) },
      workspaceMember: { findFirst: vi.fn() },
    } as unknown as PrismaClient;
    await expect(
      assertSiteAccess(db, "u1", "s1", { workspaceId: "ws-A" }),
    ).rejects.toBeInstanceOf(PermissionError);
    expect((db.workspaceMember.findFirst as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it("permits when bearer is absent (cookie session) and ACTIVE member exists", async () => {
    const db = {
      site: { findUnique: vi.fn().mockResolvedValue({ workspaceId: "ws-A" }) },
      workspaceMember: { findFirst: vi.fn().mockResolvedValue({ id: "m1" }) },
    } as unknown as PrismaClient;
    await expect(assertSiteAccess(db, "u1", "s1")).resolves.toBeUndefined();
  });

  it("permits when bearer.workspaceId matches and ACTIVE member exists", async () => {
    const db = {
      site: { findUnique: vi.fn().mockResolvedValue({ workspaceId: "ws-A" }) },
      workspaceMember: { findFirst: vi.fn().mockResolvedValue({ id: "m1" }) },
    } as unknown as PrismaClient;
    await expect(
      assertSiteAccess(db, "u1", "s1", { workspaceId: "ws-A" }),
    ).resolves.toBeUndefined();
  });
});
