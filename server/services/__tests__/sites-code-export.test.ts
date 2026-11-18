/**
 * assertCodeExportAllowed — the server half of the Publish panel's
 * "Download code (ZIP)" Pro gate. Reads Workspace.plan through
 * getSiteWorkspace, so an unknown plan string counts as FREE.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const siteFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { site: { findUnique: (...a: unknown[]) => siteFindUnique(...a) } } }));

import { assertCodeExportAllowed } from "@/server/services/sites.service";
import { CODE_EXPORT_NOT_IN_PLAN } from "@buildrik/shared/schemas/sites";
import { PLAN_LIMITS } from "@/lib/constants/plan-limits";

function siteOnPlan(plan: string | null) {
  siteFindUnique.mockResolvedValueOnce({ workspaceId: "ws_1", workspace: plan === null ? null : { plan, editsRequireApproval: false } });
}

beforeEach(() => siteFindUnique.mockReset());

describe("assertCodeExportAllowed", () => {
  it("is a Pro feature in PLAN_LIMITS", () => {
    expect(PLAN_LIMITS.FREE.codeExport).toBe(false);
    expect(PLAN_LIMITS.PRO.codeExport).toBe(true);
    expect(PLAN_LIMITS.BUSINESS.codeExport).toBe(true);
  });

  it.each(["PRO", "BUSINESS"])("allows a %s workspace", async (plan) => {
    siteOnPlan(plan);
    await expect(assertCodeExportAllowed("s1")).resolves.toBeUndefined();
    expect(siteFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "s1" } }));
  });

  it("refuses a FREE workspace", async () => {
    siteOnPlan("FREE");
    await expect(assertCodeExportAllowed("s1")).rejects.toThrow(CODE_EXPORT_NOT_IN_PLAN);
  });

  it("refuses an unrecognised plan string (treated as FREE)", async () => {
    siteOnPlan("ENTERPRISE_TYPO");
    await expect(assertCodeExportAllowed("s1")).rejects.toThrow(CODE_EXPORT_NOT_IN_PLAN);
  });

  it("throws SITE_NOT_FOUND for an unknown site", async () => {
    siteFindUnique.mockResolvedValueOnce(null);
    await expect(assertCodeExportAllowed("nope")).rejects.toThrow("SITE_NOT_FOUND");
  });
});
