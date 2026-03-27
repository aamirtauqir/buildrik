import { describe, it, expect, vi } from "vitest";
import { checkSiteRole, PermissionError } from "@/server/services/permission.service";
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
});
