/**
 * Brand Part 1 (eng E4): the first save that moves a site's tokens to v6 is
 * CAS-required and writes one `reason: "migration"` snapshot inside the save
 * transaction, so a losing racer rolls its snapshot back with its write.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { duplicateSite, saveProjectData } from "@/server/services/sites.service";
import { migrateTokensToV6 } from "@buildrik/shared/tokens";
import { createTestUser, createTestWorkspace, createTestWorkspaceMember, createTestSite, truncateTables } from "./helpers";
import v5seed from "../../packages/shared/tokens/__tests__/__fixtures__/seed-only.json";

beforeEach(async () => {
  await truncateTables("page", "site", "workspace", "user");
  /* The migration paths below need the switch on; the switch-off cases stub it off themselves. */
  vi.stubEnv("BRAND_TOKENS_V2", "on");
  vi.stubEnv("BRAND_TOKENS_V2_WORKSPACES", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

async function v5Site(designTokens: unknown = v5seed, extra: { tokensMigrationHold?: boolean; dsSchemaVersion?: number } = {}) {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id, plan: "PRO" });
  await createTestWorkspaceMember({ userId: user.id, workspaceId: workspace.id, role: "OWNER" });
  const site = await createTestSite({
    workspaceId: workspace.id,
    createdBy: user.id,
    projectSettings: { designTokens, designTokensSchemaVersion: 5 } as never,
    ...extra,
  });
  return Object.assign(site, { userId: user.id });
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

  it("records the STORED dsSchemaVersion in the snapshot, not the payload's", async () => {
    const site = await v5Site(v5seed, { dsSchemaVersion: 3 });
    await saveProjectData({ siteId: site.id, pages: [], settings: v6Settings(), dsSchemaVersion: 7 }, site.lastEditedAt.toISOString());
    const [snap] = await prisma.siteThemeSnapshot.findMany({ where: { siteId: site.id, reason: "migration" } });
    expect(snap.prevDsSchemaVersion).toBe(3);
  });

  it("writes no snapshot when the store had no tokens", async () => {
    const user = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: user.id });
    const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
    await saveProjectData({ siteId: site.id, pages: [], settings: v6Settings() }, site.lastEditedAt.toISOString());
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: site.id } })).toBe(0);
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toMatchObject({ designTokensSchemaVersion: 6 });
  });

  it("refuses a first migrated save on a held site as a SAVE_CONFLICT (the editor's conflict dialog) and leaves the store alone", async () => {
    const site = await v5Site(v5seed, { tokensMigrationHold: true });
    await expect(saveProjectData({ siteId: site.id, pages: [], settings: v6Settings() }, site.lastEditedAt.toISOString()))
      .rejects.toThrow(`SAVE_CONFLICT:${site.lastEditedAt.toISOString()}`);
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toEqual({ designTokens: v5seed, designTokensSchemaVersion: 5 });
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: site.id } })).toBe(0);
  });

  it("saves a v5 payload unchanged on a held site with the switch on", async () => {
    vi.stubEnv("BRAND_TOKENS_V2", "on");
    const site = await v5Site(v5seed, { tokensMigrationHold: true });
    await saveProjectData({ siteId: site.id, pages: [], settings: { designTokens: v5seed, designTokensSchemaVersion: 5 } }, site.lastEditedAt.toISOString());
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toEqual({ designTokens: v5seed, designTokensSchemaVersion: 5 });
  });
});

describe("kill switch and stale tabs (C1, I1, I4)", () => {
  it("switch off: a v6 save over a site with no stored tokens lands, and the next page save too", async () => {
    vi.stubEnv("BRAND_TOKENS_V2", "");
    const user = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: user.id });
    const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id, projectSettings: { designTokensSchemaVersion: 5 } as never });
    const first = await saveProjectData({ siteId: site.id, pages: [], settings: v6Settings() }, site.lastEditedAt.toISOString());
    await saveProjectData({ siteId: site.id, pages: [], settings: v6Settings({ seo: { author: "Ann" } }) }, first.savedAt.toISOString());
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toMatchObject({ designTokensSchemaVersion: 6, seo: { author: "Ann" } });
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: site.id } })).toBe(0);
  });

  it("switch off: a first migrated save is refused as SAVE_CONFLICT with the stored lastEditedAt", async () => {
    vi.stubEnv("BRAND_TOKENS_V2", "");
    const site = await v5Site();
    await expect(saveProjectData({ siteId: site.id, pages: [], settings: v6Settings() }, site.lastEditedAt.toISOString()))
      .rejects.toThrow(`SAVE_CONFLICT:${site.lastEditedAt.toISOString()}`);
  });

  it("a stale v5 tab over a v6 store gets SAVE_CONFLICT, not a token error", async () => {
    const site = await v5Site();
    const first = await saveProjectData({ siteId: site.id, pages: [], settings: v6Settings() }, site.lastEditedAt.toISOString());
    await expect(
      saveProjectData({ siteId: site.id, pages: [], settings: { designTokens: v5seed, designTokensSchemaVersion: 5 } }, first.savedAt.toISOString()),
    ).rejects.toThrow(`SAVE_CONFLICT:${first.savedAt.toISOString()}`);
  });

  it("an undo payload (designTokens: undefined) over a v6 store keeps the stored tokens (C2)", async () => {
    const site = await v5Site();
    const first = await saveProjectData({ siteId: site.id, pages: [], settings: v6Settings({ darkMode: "auto" }) }, site.lastEditedAt.toISOString());
    await saveProjectData(
      { siteId: site.id, pages: [], settings: { designTokens: undefined, designTokensSchemaVersion: undefined, seo: { author: "Bo" } } },
      first.savedAt.toISOString(),
    );
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toMatchObject({ designTokens: migrateTokensToV6(v5seed), designTokensSchemaVersion: 6, darkMode: "auto" });
  });

  it("BRAND_TOKENS_V2_WORKSPACES migrates a listed workspace's site and refuses another's", async () => {
    vi.stubEnv("BRAND_TOKENS_V2", "");
    const listed = await v5Site();
    const other = await v5Site();
    vi.stubEnv("BRAND_TOKENS_V2_WORKSPACES", listed.workspaceId);
    await saveProjectData({ siteId: listed.id, pages: [], settings: v6Settings() }, listed.lastEditedAt.toISOString());
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: listed.id, reason: "migration" } })).toBe(1);
    await expect(saveProjectData({ siteId: other.id, pages: [], settings: v6Settings() }, other.lastEditedAt.toISOString()))
      .rejects.toThrow(/SAVE_CONFLICT/);
    const otherAfter = await prisma.site.findUniqueOrThrow({ where: { id: other.id } });
    expect(otherAfter.projectSettings).toEqual({ designTokens: v5seed, designTokensSchemaVersion: 5 });
  });
});

describe("schema version is the server's call", () => {
  it("refuses a version above the current schema and keeps the site saveable", async () => {
    const site = await v5Site();
    await expect(saveProjectData({ siteId: site.id, pages: [], settings: v6Settings({ designTokensSchemaVersion: 999 }) }, site.lastEditedAt.toISOString()))
      .rejects.toMatchObject({ code: "TOKENS_INVALID" });
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toMatchObject({ designTokensSchemaVersion: 5 });
  });

  it("stores 6 for a validated payload regardless of extra client fields", async () => {
    const site = await v5Site();
    await saveProjectData({ siteId: site.id, pages: [], settings: v6Settings({ seo: {}, tokensVersion: 42 }) }, site.lastEditedAt.toISOString());
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect((after.projectSettings as { designTokensSchemaVersion: unknown }).designTokensSchemaVersion).toBe(6);
  });
});

describe("a save without designTokens never changes stored token state", () => {
  it("ignores a client-sent version (999) when the tokens key is absent", async () => {
    const site = await v5Site();
    await saveProjectData({ siteId: site.id, pages: [], settings: { designTokensSchemaVersion: 999, darkMode: "auto" } }, site.lastEditedAt.toISOString());
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toEqual({ designTokens: v5seed, designTokensSchemaVersion: 5 });
  });

  it("keeps the stored tokens, version and darkMode on a settings save without the tokens key", async () => {
    const site = await v5Site();
    const first = await saveProjectData({ siteId: site.id, pages: [], settings: v6Settings({ darkMode: "auto" }) }, site.lastEditedAt.toISOString());
    await saveProjectData({ siteId: site.id, pages: [], settings: { seo: { author: "Ann" } } }, first.savedAt.toISOString());
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toMatchObject({
      designTokens: migrateTokensToV6(v5seed),
      designTokensSchemaVersion: 6,
      darkMode: "auto",
      seo: { author: "Ann" },
    });
  });
});

describe("a corrupt stored version", () => {
  it("counts as current: a v6 save over a stored 999 succeeds and stores 6", async () => {
    const user = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: user.id });
    const site = await createTestSite({
      workspaceId: workspace.id,
      createdBy: user.id,
      projectSettings: { designTokens: migrateTokensToV6(v5seed), designTokensSchemaVersion: 999 } as never,
    });
    await saveProjectData({ siteId: site.id, pages: [], settings: v6Settings() }, site.lastEditedAt.toISOString());
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toMatchObject({ designTokensSchemaVersion: 6 });
  });
});

describe("duplicateSite", () => {
  it.each([false, true])("copies a v5 site's tokens and version verbatim (hold=%s), even with the switch on", async (hold) => {
    vi.stubEnv("BRAND_TOKENS_V2", "on");
    const site = await v5Site(v5seed, { tokensMigrationHold: hold });
    const copy = await duplicateSite(site.id, site.workspaceId, site.userId);
    const row = await prisma.site.findUniqueOrThrow({ where: { id: copy.id } });
    expect(row.projectSettings).toEqual({ designTokens: v5seed, designTokensSchemaVersion: 5 });
  });
});
