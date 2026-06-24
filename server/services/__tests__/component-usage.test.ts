/**
 * C1 (component browser usage) + C3 (blast-radius). A component master shared
 * across an agency's sites is one SiteComponent row per site (unique
 * [siteId, componentId]), so per-componentId row count == site count. Both
 * queries are workspace-scoped (the where filters through site.workspaceId).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { siteComponent: { findMany: (...a: unknown[]) => findMany(...a) } },
}));

import { listWorkspaceComponents, getComponentUsage } from "@server/services/site-component.service";

beforeEach(() => findMany.mockReset());

describe("listWorkspaceComponents (C1)", () => {
  it("dedupes by componentId and counts sites carrying each master", async () => {
    findMany.mockResolvedValueOnce([
      { componentId: "card", name: "Card", updatedAt: new Date("2026-06-20") },
      { componentId: "card", name: "Card v2", updatedAt: new Date("2026-06-22") },
      { componentId: "hero", name: "Hero", updatedAt: new Date("2026-06-21") },
    ]);
    const res = await listWorkspaceComponents("w1");
    // card on 2 sites (newest name wins), hero on 1; sorted newest-first
    expect(res).toEqual([
      { componentId: "card", name: "Card v2", siteCount: 2, updatedAt: new Date("2026-06-22") },
      { componentId: "hero", name: "Hero", siteCount: 1, updatedAt: new Date("2026-06-21") },
    ]);
    // workspace-scoped filter through the site relation
    expect(findMany.mock.calls[0][0].where).toEqual({ site: { workspaceId: "w1", deletedAt: null } });
  });

  it("returns [] when the workspace has no components", async () => {
    findMany.mockResolvedValueOnce([]);
    expect(await listWorkspaceComponents("w1")).toEqual([]);
  });
});

describe("getComponentUsage (C1 jump-to / C3 blast-radius)", () => {
  it("returns the sites carrying a master with a count", async () => {
    findMany.mockResolvedValueOnce([
      { siteId: "s1", updatedAt: new Date("2026-06-22"), site: { name: "bloomcafe.com" } },
      { siteId: "s2", updatedAt: new Date("2026-06-21"), site: { name: "cobalt.io" } },
    ]);
    const res = await getComponentUsage("w1", "card");
    expect(res.componentId).toBe("card");
    expect(res.siteCount).toBe(2);
    expect(res.sites).toEqual([
      { siteId: "s1", siteName: "bloomcafe.com", updatedAt: new Date("2026-06-22") },
      { siteId: "s2", siteName: "cobalt.io", updatedAt: new Date("2026-06-21") },
    ]);
    expect(findMany.mock.calls[0][0].where).toEqual({
      componentId: "card",
      site: { workspaceId: "w1", deletedAt: null },
    });
  });

  it("reports zero usage for an unused master", async () => {
    findMany.mockResolvedValueOnce([]);
    const res = await getComponentUsage("w1", "ghost");
    expect(res.siteCount).toBe(0);
    expect(res.sites).toEqual([]);
  });
});
