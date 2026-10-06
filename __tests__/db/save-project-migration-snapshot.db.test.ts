/**
 * Brand Part 1 (eng E4): the first save that moves a site's tokens to v6 is
 * CAS-required and writes one `reason: "migration"` snapshot inside the save
 * transaction, so a losing racer rolls its snapshot back with its write.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { saveProjectData } from "@/server/services/sites.service";
import { migrateTokensToV6 } from "@buildrik/shared/tokens";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";
import v5seed from "../../packages/shared/tokens/__tests__/__fixtures__/seed-only.json";

beforeEach(async () => {
  await truncateTables("page", "site", "workspace", "user");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

async function v5Site(designTokens: unknown = v5seed) {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  return createTestSite({
    workspaceId: workspace.id,
    createdBy: user.id,
    projectSettings: { designTokens, designTokensSchemaVersion: 5 } as never,
  });
}

const v6Settings = (extra: Record<string, unknown> = {}) => ({
  designTokens: migrateTokensToV6(v5seed),
  designTokensSchemaVersion: 6,
  ...extra,
});

describe("first migrated save", () => {
  it("writes one migration snapshot in the same transaction and stores v6", async () => {
    const site = await v5Site();
    await saveProjectData({ siteId: site.id, pages: [], settings: v6Settings({ darkMode: "off" }) }, site.lastEditedAt.toISOString());
    const snaps = await prisma.siteThemeSnapshot.findMany({ where: { siteId: site.id, reason: "migration" } });
    expect(snaps).toHaveLength(1);
    expect(snaps[0].tokensSchemaVersion).toBe(5);
    expect(snaps[0].darkMode).toBeNull();
    expect(snaps[0].prevStyles).toEqual({ designTokens: v5seed });
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toMatchObject({ designTokensSchemaVersion: 6, darkMode: "off" });
  });

  it("refuses without expectedLastEditedAt", async () => {
    const site = await v5Site();
    await expect(saveProjectData({ siteId: site.id, pages: [], settings: v6Settings() }))
      .rejects.toMatchObject({ code: "TOKENS_NEED_CAS" });
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: site.id } })).toBe(0);
  });

  it("refuses with SAVE_CONFLICT when the stored lastEditedAt moved", async () => {
    const site = await v5Site();
    await expect(
      saveProjectData({ siteId: site.id, pages: [], settings: v6Settings() }, new Date(site.lastEditedAt.getTime() - 1000).toISOString()),
    ).rejects.toThrow(/SAVE_CONFLICT/);
  });

  it("two racing first saves: one wins, one conflicts, one snapshot", async () => {
    const site = await v5Site();
    const save = () => saveProjectData({ siteId: site.id, pages: [], settings: v6Settings() }, site.lastEditedAt.toISOString());
    const results = await Promise.allSettled([save(), save()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: site.id, reason: "migration" } })).toBe(1);
  });

  it("snapshot write does not change dsSchemaVersion", async () => {
    const site = await v5Site();
    await saveProjectData(
      { siteId: site.id, pages: [], settings: v6Settings(), dsSchemaVersion: site.dsSchemaVersion },
      site.lastEditedAt.toISOString(),
    );
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.dsSchemaVersion).toBe(site.dsSchemaVersion);
  });

  it("an unmigratable v5 payload over a v5 store saves unchanged with the switch on", async () => {
    vi.stubEnv("BRAND_TOKENS_V2", "on");
    const invalid = [{ id: "My Token", name: "Mine", value: "#000", category: "colors", cssVar: "--my token", type: "color" }];
    const site = await v5Site(invalid);
    await saveProjectData(
      { siteId: site.id, pages: [], settings: { designTokens: invalid, designTokensSchemaVersion: 5 } },
      site.lastEditedAt.toISOString(),
    );
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toEqual({ designTokens: invalid, designTokensSchemaVersion: 5 });
    expect(after.lastEditedAt.getTime()).toBeGreaterThan(site.lastEditedAt.getTime());
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: site.id } })).toBe(0);
  });
});
