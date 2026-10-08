import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { createBrandRestorePoint, getBrandRestorePoint, listBrandRestorePoints, ThemeError } from "@/server/services/theme.service";
import { migrateTokensToV6 } from "@buildrik/shared/tokens";
import v5seed from "@buildrik/shared/tokens/__tests__/__fixtures__/seed-only.json";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

const v6 = migrateTokensToV6(v5seed);

beforeEach(async () => { await truncateTables("site", "workspace", "user"); });

async function site() {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  return createTestSite({ workspaceId: workspace.id, createdBy: user.id, projectSettings: { designTokens: v6, designTokensSchemaVersion: 6, darkMode: "off" } });
}

describe("Brand restore points (spec §8, tests 13, 17)", () => {
  it("stores tokens + Dark mode, reads them back, and moves neither lastEditedAt nor dsSchemaVersion", async () => {
    const s = await site();
    const { id } = await createBrandRestorePoint({ siteId: s.id, reason: "dark-auto", designTokens: v6, darkMode: "off" });
    const after = await prisma.site.findUniqueOrThrow({ where: { id: s.id } });
    expect(after.lastEditedAt.getTime()).toBe(s.lastEditedAt.getTime());
    expect(after.dsSchemaVersion).toBe(s.dsSchemaVersion);
    const point = await getBrandRestorePoint(s.id, id);
    expect(point).toMatchObject({ reason: "dark-auto", tokensSchemaVersion: 6, darkMode: "off" });
    expect(point.designTokens).toEqual(v6);
  });

  it("refuses an invalid token set and writes nothing", async () => {
    const s = await site();
    await expect(createBrandRestorePoint({ siteId: s.id, reason: "generator", designTokens: [{ id: "x" }], darkMode: "off" }))
      .rejects.toBeInstanceOf(ThemeError);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id } })).toBe(0);
  });

  it("caps at 10 (migration rows exempt) — the 11th prunes the oldest", async () => {
    const s = await site();
    await prisma.siteThemeSnapshot.create({ data: { siteId: s.id, workspaceId: s.workspaceId, reason: "migration", prevStyles: { designTokens: [] }, prevDsSchemaVersion: 0, tokensSchemaVersion: 5, createdAt: new Date(1) } });
    for (let i = 0; i < 11; i++) await createBrandRestorePoint({ siteId: s.id, reason: "generator", designTokens: v6, darkMode: "off" });
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id, reason: { not: "migration" } } })).toBe(10);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: s.id, reason: "migration" } })).toBe(1);
    expect((await listBrandRestorePoints(s.id)).length).toBe(11);
  });

  it("reading another site's point, a legacy row or a deleted site's point is NOT_FOUND", async () => {
    const a = await site();
    const b = await site();
    const { id } = await createBrandRestorePoint({ siteId: a.id, reason: "logo", designTokens: v6, darkMode: "off" });
    await expect(getBrandRestorePoint(b.id, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const legacy = await prisma.siteThemeSnapshot.create({ data: { siteId: a.id, workspaceId: a.workspaceId, prevStyles: [{ selector: "x" }], prevDsSchemaVersion: 0 } });
    await expect(getBrandRestorePoint(a.id, legacy.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await prisma.site.update({ where: { id: a.id }, data: { deletedAt: new Date() } });
    await expect(getBrandRestorePoint(a.id, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
