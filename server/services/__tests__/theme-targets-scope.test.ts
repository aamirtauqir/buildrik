/**
 * BK-08: listThemeTargets applies the member's site scope — a member scoped to
 * one site was handed the name and lock state of every site in the workspace.
 */
import { describe, it, expect, vi } from "vitest";

const siteFindMany = vi.fn(async (..._a: unknown[]) => [{ id: "s1", name: "Mine", clientId: null, themeLocked: false, dsSchemaVersion: 6 }]);
const scopeMock = vi.fn(async (..._a: unknown[]) => ({ id: { in: ["s1"] } }));

vi.mock("@/lib/prisma", () => ({ prisma: { site: { findMany: (...a: unknown[]) => siteFindMany(...a) } } }));
vi.mock("@/server/services/permission.service", async (orig) => ({
  ...(await orig<typeof import("@/server/services/permission.service")>()),
  siteScopeWhere: (...a: unknown[]) => scopeMock(...a),
}));

import { listThemeTargets } from "@/server/services/theme.service";

describe("listThemeTargets — site scope", () => {
  it("merges the member's scope into the query", async () => {
    await expect(listThemeTargets("ws_1", "u_1")).resolves.toHaveLength(1);
    expect(scopeMock).toHaveBeenCalledWith(expect.anything(), "u_1", "ws_1");
    expect(siteFindMany.mock.calls[0][0]).toMatchObject({ where: { workspaceId: "ws_1", deletedAt: null, id: { in: ["s1"] } } });
  });
});
