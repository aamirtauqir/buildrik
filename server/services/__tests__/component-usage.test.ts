/**
 * C1 (component browser usage) + C3 (blast-radius). A component master shared
 * across an agency's sites is one SiteComponent row per site (unique
 * [siteId, componentId]), so per-componentId row count == site count. Both
 * queries are workspace-scoped (the where filters through site.workspaceId).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const memberFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteComponent: { findMany: (...a: unknown[]) => findMany(...a) },
    workspaceMember: { findFirst: (...a: unknown[]) => memberFindFirst(...a) },
    sitePermission: { findMany: vi.fn() },
  },
}));

import { listWorkspaceComponents } from "@server/services/site-component.service";

beforeEach(() => {
  findMany.mockReset();
  memberFindFirst.mockReset();
  // S-9: listWorkspaceComponents now resolves siteScopeWhere(userId, workspaceId)
  // first. An ADMIN is never site-scoped, so this keeps the list unrestricted.
  memberFindFirst.mockResolvedValue({ id: "m1", role: "ADMIN", _count: { sitePermissions: 0 } });
});

describe("listWorkspaceComponents (C1)", () => {
  it("dedupes by componentId and counts sites carrying each master", async () => {
    findMany.mockResolvedValueOnce([
      { componentId: "card", name: "Card", updatedAt: new Date("2026-06-20") },
      { componentId: "card", name: "Card v2", updatedAt: new Date("2026-06-22") },
      { componentId: "hero", name: "Hero", updatedAt: new Date("2026-06-21") },
    ]);
    const res = await listWorkspaceComponents("w1", "u1");
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
    expect(await listWorkspaceComponents("w1", "u1")).toEqual([]);
  });
});
