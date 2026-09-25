/**
 * S-6 (P0-6) — roleOverride is a CAP, never an upgrade (PD-6). A member
 * demoted at the workspace level loses access on every site immediately,
 * even when a stale per-site SitePermission row still carries a
 * higher-ranked roleOverride from before the demotion.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { checkSiteRole, PermissionError } from "@/server/services/permission.service";
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

describe("getEffectiveSiteRole — roleOverride cap (S-6 / PD-6)", () => {
  it("VIEWER member + EDITOR override on the site → checkSiteRole(EDITOR) is FORBIDDEN", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    const site = await createTestSite({ workspaceId: workspace.id, createdBy: owner.id });

    const demotedUser = await createTestUser();
    const member = await createTestWorkspaceMember({
      userId: demotedUser.id,
      workspaceId: workspace.id,
      role: "VIEWER",
    });
    await createTestSitePermission({
      memberId: member.id,
      siteId: site.id,
      grantedBy: owner.id,
      roleOverride: "EDITOR",
    });

    await expect(checkSiteRole(prisma, demotedUser.id, site.id, "EDITOR")).rejects.toBeInstanceOf(
      PermissionError,
    );
  });

  it("EDITOR member + VIEWER override on the site → effective role is VIEWER (checkSiteRole(EDITOR) FORBIDDEN)", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    const site = await createTestSite({ workspaceId: workspace.id, createdBy: owner.id });

    const scopedUser = await createTestUser();
    const member = await createTestWorkspaceMember({
      userId: scopedUser.id,
      workspaceId: workspace.id,
      role: "EDITOR",
    });
    await createTestSitePermission({
      memberId: member.id,
      siteId: site.id,
      grantedBy: owner.id,
      roleOverride: "VIEWER",
    });

    await expect(checkSiteRole(prisma, scopedUser.id, site.id, "EDITOR")).rejects.toBeInstanceOf(
      PermissionError,
    );
  });
});
