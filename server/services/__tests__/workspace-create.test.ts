/**
 * W1 — create additional workspace, plan-gated. Free users get exactly one
 * workspace; a second requires a paid plan on a workspace they own (multi-workspace
 * is the Pro/agency feature, and it closes the per-workspace free site-cap bypass).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const memberFindMany = vi.fn();
const wsFindUnique = vi.fn();
const wsCreate = vi.fn();
const memberCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: {
      findMany: (...a: unknown[]) => memberFindMany(...a),
      create: (...a: unknown[]) => memberCreate(...a),
    },
    workspace: {
      findUnique: (...a: unknown[]) => wsFindUnique(...a),
      create: (...a: unknown[]) => wsCreate(...a),
    },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        workspace: { create: (...a: unknown[]) => wsCreate(...a) },
        workspaceMember: { create: (...a: unknown[]) => memberCreate(...a) },
      }),
  },
}));

import { createWorkspace, WorkspaceLimitError } from "@server/services/workspace-settings.service";

beforeEach(() => {
  [memberFindMany, wsFindUnique, wsCreate, memberCreate].forEach((m) => m.mockReset());
  wsFindUnique.mockResolvedValue(null); // slug is unique on first try
  wsCreate.mockResolvedValue({ id: "ws_new" });
  memberCreate.mockResolvedValue({});
});

describe("createWorkspace (W1 plan gate)", () => {
  it("allows the FIRST workspace even on free (owns none yet)", async () => {
    memberFindMany.mockResolvedValueOnce([]);
    const res = await createWorkspace("u1", "Acme");
    expect(res.workspaceId).toBe("ws_new");
    expect(res.slug).toBe("acme");
    expect(wsCreate).toHaveBeenCalledOnce();
  });

  it("BLOCKS a 2nd workspace when all owned workspaces are FREE", async () => {
    memberFindMany.mockResolvedValueOnce([{ workspace: { plan: "FREE" } }]);
    await expect(createWorkspace("u1", "Second")).rejects.toBeInstanceOf(WorkspaceLimitError);
    expect(wsCreate).not.toHaveBeenCalled();
  });

  it("ALLOWS a 2nd workspace when the user owns a paid (PRO/BUSINESS) workspace", async () => {
    memberFindMany.mockResolvedValueOnce([
      { workspace: { plan: "FREE" } },
      { workspace: { plan: "PRO" } },
    ]);
    const res = await createWorkspace("u1", "Brand Two");
    expect(res.workspaceId).toBe("ws_new");
    expect(memberCreate.mock.calls[0][0].data).toMatchObject({ userId: "u1", role: "OWNER" });
  });

  it("dedupes the slug when the base is taken", async () => {
    memberFindMany.mockResolvedValueOnce([]);
    wsFindUnique.mockResolvedValueOnce({ id: "exists" }).mockResolvedValueOnce(null);
    const res = await createWorkspace("u1", "Acme");
    expect(res.slug).toBe("acme-1");
  });
});
