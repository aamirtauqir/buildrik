/**
 * Brand Part 1b, Task 10 (spec §4, test 21): a workspace theme push keeps the
 * site's own tokens that elements still use, reports them, and refuses (writes
 * nothing) when the merged set would not validate.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { pushSharedTheme, previewSharedThemePush } from "@/server/services/theme.service";
import { createTestUser, createTestWorkspace, createTestSite, createTestPage, truncateTables } from "./helpers";

const tok = (id: string, value: string) => ({
  id, name: id, kind: "color", layer: "semantic", modes: { light: { value } },
  category: "colors", cssVar: `--buildrick-design-${id}`, type: "color",
});

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
  vi.stubEnv("BRAND_TOKENS_V2", "on");
});
afterEach(() => vi.unstubAllEnvs());

async function setup(siteTokens: unknown[], pageStyles: Record<string, string>) {
  const user = await createTestUser();
  const ws = await createTestWorkspace({ ownerId: user.id });
  await prisma.workspace.update({
    where: { id: ws.id },
    data: { sharedTheme: { designTokens: [tok("color-primary", "#1A56DB")] }, sharedThemeUpdatedAt: new Date() },
  });
  const site = await createTestSite({
    workspaceId: ws.id,
    createdBy: user.id,
    projectSettings: { designTokens: siteTokens, designTokensSchemaVersion: 6 },
  });
  await createTestPage({ siteId: site.id, blocks: [{ id: "h", type: "heading", styles: pageStyles, children: [] }] });
  return { ws, site };
}

const tokenIds = async (siteId: string) => {
  const after = await prisma.site.findUniqueOrThrow({ where: { id: siteId } });
  return (after.projectSettings as { designTokens: Array<{ id: string }> }).designTokens.map((x) => x.id);
};

describe("pushSharedTheme keeps in-use site tokens (test 21)", () => {
  it("keeps a site token an element uses and reports it", async () => {
    const { ws, site } = await setup([tok("color-brand-x", "#0E7490")], { color: "var(--buildrick-design-color-brand-x)" });
    const [res] = await pushSharedTheme(ws.id);
    expect(res.status).toBe("pushed");
    expect(res.kept).toEqual(["color-brand-x"]);
    expect(await tokenIds(site.id)).toEqual(["color-primary", "color-brand-x"]);
  });

  it("drops an unused site-only token, as before", async () => {
    const { ws, site } = await setup([tok("color-unused", "#000000")], { color: "#111111" });
    const [res] = await pushSharedTheme(ws.id);
    expect(res.kept).toBeUndefined();
    expect(await tokenIds(site.id)).toEqual(["color-primary"]);
  });

  it("reports failed and writes nothing when the merge does not validate", async () => {
    const broken = { ...tok("color-brand-x", "#0E7490"), modes: { light: { alias: "custom-missing" } } };
    const { ws, site } = await setup([broken], { color: "var(--buildrick-design-color-brand-x)" });
    const before = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    const [res] = await pushSharedTheme(ws.id);
    expect(res.status).toBe("failed");
    const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(after.projectSettings).toEqual(before.projectSettings);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId: site.id } })).toBe(0);
  });

  it("preview says the site changes only by what the push really writes", async () => {
    const { ws } = await setup([tok("color-primary", "#1A56DB"), tok("color-brand-x", "#0E7490")], {
      color: "var(--buildrick-design-color-brand-x)",
    });
    const [p] = await previewSharedThemePush(ws.id);
    expect(p.willChange).toBe(false);
  });
});
