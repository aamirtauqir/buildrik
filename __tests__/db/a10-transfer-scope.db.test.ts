/**
 * A-10 — transferSite must never NEWLY scope a previously-unscoped member.
 * An unscoped ("all sites") EDITOR who transfers one site away must keep
 * full access to every other site in the workspace, not get pinned to the
 * transferred site via a fresh SitePermission row.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { transferSite } from "@/server/services/sites.service";
import { checkSiteRole } from "@/server/services/permission.service";
import {
  createTestUser,
  createTestWorkspace,
  createTestWorkspaceMember,
  createTestSite,
  createTestSitePermission,
  truncateTables,
} from "./helpers";

beforeEach(async () => {
  await truncateTables("sitePermission", "site", "workspaceMember", "workspace", "user");
});

describe("transferSite scope preservation (A-10)", () => {
  it("an unscoped EDITOR who transfers site X keeps full access to site Y (no new SitePermission row)", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });

    const creator = await createTestUser();
    const creatorMember = await createTestWorkspaceMember({
      userId: creator.id,
      workspaceId: workspace.id,
      role: "EDITOR",
    });
    const siteX = await createTestSite({ workspaceId: workspace.id, createdBy: creator.id });
    const siteY = await createTestSite({ workspaceId: workspace.id, createdBy: creator.id });

    const newOwner = await createTestUser();
    await createTestWorkspaceMember({ userId: newOwner.id, workspaceId: workspace.id, role: "EDITOR" });

    await transferSite(siteX.id, newOwner.id, creator.id);

    const rowCount = await prisma.sitePermission.count({ where: { memberId: creatorMember.id } });
    expect(rowCount).toBe(0);

    // Still reaches site Y with full EDITOR access — never scoped.
    await expect(checkSiteRole(prisma, creator.id, siteY.id, "EDITOR")).resolves.toBeUndefined();
  });

  it("a SCOPED creator keeps a SitePermission row after transfer, without a forced EDITOR override", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });

    const creator = await createTestUser();
    const creatorMember = await createTestWorkspaceMember({
      userId: creator.id,
      workspaceId: workspace.id,
      role: "EDITOR",
    });
    const siteX = await createTestSite({ workspaceId: workspace.id, createdBy: creator.id });
    // Mark the creator as already scoped, with a VIEWER override on X.
    await createTestSitePermission({
      memberId: creatorMember.id,
      siteId: siteX.id,
      grantedBy: owner.id,
      roleOverride: "VIEWER",
    });

    const newOwner = await createTestUser();
    await createTestWorkspaceMember({ userId: newOwner.id, workspaceId: workspace.id, role: "EDITOR" });

    await transferSite(siteX.id, newOwner.id, creator.id);

    const row = await prisma.sitePermission.findUnique({
      where: { memberId_siteId: { memberId: creatorMember.id, siteId: siteX.id } },
    });
    expect(row).not.toBeNull();
    // Existing override untouched by the transfer (was VIEWER, stays VIEWER).
    expect(row!.roleOverride).toBe("VIEWER");
  });
});
