/**
 * Brand Part 1a (eng E1, E2, E5, E6): snapshot reasons. Admin rollback only
 * sees theme-push rows, migration rollback restores tokens + version and
 * holds the site, prune never touches migration rows, and the Brand restore
 * list hides legacy projectStyles snapshots.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  rollbackSiteTheme,
  rollbackTokenMigration,
  clearTokenMigrationHold,
  listBrandRestorePoints,
  pruneThemeSnapshots,
} from "@/server/services/theme.service";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
});

async function site(extra: Record<string, unknown> = {}) {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  return createTestSite({ workspaceId: workspace.id, createdBy: user.id, ...extra });
}

async function snap(siteId: string, workspaceId: string, reason: string, prevStyles: unknown, at: number) {
  return prisma.siteThemeSnapshot.create({
    data: { siteId, workspaceId, reason, prevStyles: prevStyles as object, prevDsSchemaVersion: 0, tokensSchemaVersion: 5, createdAt: new Date(at) },
  });
}

describe("SiteThemeSnapshot v6 rules", () => {
  it("admin rollback takes the newest theme-push even when a generator snapshot is newer (E1)", async () => {
    const s = await site();
    const push = await snap(s.id, s.workspaceId, "theme-push", { designTokens: [] }, 1_000);
    await snap(s.id, s.workspaceId, "generator", { designTokens: [] }, 2_000);
    await rollbackSiteTheme(s.workspaceId, s.id);
    expect(await prisma.siteThemeSnapshot.findUnique({ where: { id: push.id } })).toBeNull();
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id, reason: "generator" } })).toBe(1);
  });

  it("migration rollback restores tokens + version verbatim, drops darkMode, sets the hold (E2)", async () => {
    const s = await site({
      projectSettings: { designTokens: [], designTokensSchemaVersion: 6, darkMode: "auto", seo: { metaTitle: "Keep" } },
    });
    const old = [{ id: "color-primary", value: "#123456" }];
    await snap(s.id, s.workspaceId, "migration", { designTokens: old }, 1_000);
    const res = await rollbackTokenMigration(s.id);
    expect(res.restoredVersion).toBe(5);
    const after = await prisma.site.findUniqueOrThrow({ where: { id: s.id } });
    expect(after.projectSettings).toEqual({ designTokens: old, designTokensSchemaVersion: 5, seo: { metaTitle: "Keep" } });
    expect(after.tokensMigrationHold).toBe(true);
    expect(after.dsSchemaVersion).toBe(s.dsSchemaVersion + 1);
    expect(after.lastEditedAt.getTime()).toBeGreaterThan(s.lastEditedAt.getTime());
    await clearTokenMigrationHold(s.id);
    expect((await prisma.site.findUniqueOrThrow({ where: { id: s.id } })).tokensMigrationHold).toBe(false);
  });

  it("migration rollback with no migration snapshot is NOT_FOUND", async () => {
    const s = await site();
    await expect(rollbackTokenMigration(s.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("migration rows survive 15 generator snapshots (E5)", async () => {
    const s = await site();
    await snap(s.id, s.workspaceId, "migration", { designTokens: [] }, 1);
    for (let i = 0; i < 15; i++) await snap(s.id, s.workspaceId, "generator", { designTokens: [] }, 10 + i);
    await pruneThemeSnapshots(s.id);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id, reason: "migration" } })).toBe(1);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id, reason: "generator" } })).toBe(10);
  });

  it("Brand restore list hides legacy projectStyles rows (E6)", async () => {
    const s = await site();
    await snap(s.id, s.workspaceId, "theme-push", [{ selector: ".x", rules: {} }], 1);
    await snap(s.id, s.workspaceId, "generator", { designTokens: [] }, 2);
    const list = await listBrandRestorePoints(s.id);
    expect(list.map((r) => r.reason)).toEqual(["generator"]);
  });
});
