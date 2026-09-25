/**
 * S-9 — a member scoped to specific sites (has SitePermission rows) must see
 * only those sites in every workspace-wide LIST/aggregate: listSites,
 * getDashboardStats, getRecentSites, domains.listForWorkspace,
 * siteComponents.workspaceList. All five now go through the same
 * `siteScopeWhere` helper as `resolveSiteScope`.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { listSites } from "@/server/services/sites.service";
import { getDashboardStats, getRecentSites } from "@/server/services/dashboard.service";
import { listWorkspaceDomains } from "@/server/services/domain.service";
import { listWorkspaceComponents } from "@/server/services/site-component.service";
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

async function seedScopedMember() {
  const owner = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: owner.id });

  const scopedUser = await createTestUser();
  const member = await createTestWorkspaceMember({
    userId: scopedUser.id,
    workspaceId: workspace.id,
    role: "EDITOR",
  });

  const s1 = await createTestSite({ workspaceId: workspace.id, createdBy: owner.id, name: "S1" });
  const s2 = await createTestSite({ workspaceId: workspace.id, createdBy: owner.id, name: "S2" });
  await createTestSitePermission({ memberId: member.id, siteId: s1.id, grantedBy: owner.id, roleOverride: "EDITOR" });

  await prisma.domain.create({
    data: { siteId: s1.id, domain: `s1-${s1.id}.example.com`, status: "ACTIVE", sslStatus: "ACTIVE", isPrimary: true },
  });
  await prisma.domain.create({
    data: { siteId: s2.id, domain: `s2-${s2.id}.example.com`, status: "ACTIVE", sslStatus: "ACTIVE", isPrimary: true },
  });
  await prisma.siteComponent.create({
    data: { siteId: s1.id, componentId: "hero", name: "Hero S1", payload: {} },
  });
  await prisma.siteComponent.create({
    data: { siteId: s2.id, componentId: "hero", name: "Hero S2", payload: {} },
  });

  return { workspace, scopedUser, s1, s2 };
}

describe("S-9 site-scoped workspace lists", () => {
  it("listSites returns only the granted site", async () => {
    const { workspace, scopedUser, s1 } = await seedScopedMember();
    const result = await listSites(workspace.id, scopedUser.id, { page: 1, perPage: 20, sort: "lastEdited" });
    expect(result.data.map((s) => s.id)).toEqual([s1.id]);
  });

  it("getDashboardStats.totalSites counts only the granted site", async () => {
    const { workspace, scopedUser } = await seedScopedMember();
    const stats = await getDashboardStats(workspace.id, scopedUser.id, "EDITOR");
    expect(stats.totalSites).toBe(1);
  });

  it("getRecentSites returns only the granted site", async () => {
    const { workspace, scopedUser, s1 } = await seedScopedMember();
    const sites = await getRecentSites(workspace.id, scopedUser.id);
    expect(sites.map((s) => s.id)).toEqual([s1.id]);
  });

  it("listWorkspaceDomains returns only the granted site's domain", async () => {
    const { workspace, scopedUser, s1 } = await seedScopedMember();
    const domains = await listWorkspaceDomains(workspace.id, scopedUser.id);
    expect(domains.map((d) => d.siteId)).toEqual([s1.id]);
  });

  it("listWorkspaceComponents counts only the granted site", async () => {
    const { workspace, scopedUser } = await seedScopedMember();
    const components = await listWorkspaceComponents(workspace.id, scopedUser.id);
    expect(components).toEqual([
      expect.objectContaining({ componentId: "hero", siteCount: 1 }),
    ]);
  });

  it("an unscoped ADMIN still sees both sites in listSites", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    await createTestWorkspaceMember({ userId: owner.id, workspaceId: workspace.id, role: "OWNER" });
    const s1 = await createTestSite({ workspaceId: workspace.id, createdBy: owner.id });
    const s2 = await createTestSite({ workspaceId: workspace.id, createdBy: owner.id });

    const result = await listSites(workspace.id, owner.id, { page: 1, perPage: 20, sort: "lastEdited" });
    expect(result.data.map((s) => s.id).sort()).toEqual([s1.id, s2.id].sort());
  });

  // IMPORTANT 10 (controller, fix round 1): the ADMIN case above proves the
  // "manages the whole workspace" exemption; this proves the OTHER unscoped
  // case — a non-admin member with zero SitePermission rows is on the "all
  // sites" default and must also see everything, not just admins.
  it("an unscoped non-admin (EDITOR, 0 SitePermission rows) also sees both sites in listSites", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    const unscopedUser = await createTestUser();
    await createTestWorkspaceMember({ userId: unscopedUser.id, workspaceId: workspace.id, role: "EDITOR" });
    const s1 = await createTestSite({ workspaceId: workspace.id, createdBy: owner.id });
    const s2 = await createTestSite({ workspaceId: workspace.id, createdBy: owner.id });

    const result = await listSites(workspace.id, unscopedUser.id, { page: 1, perPage: 20, sort: "lastEdited" });
    expect(result.data.map((s) => s.id).sort()).toEqual([s1.id, s2.id].sort());
  });
});
