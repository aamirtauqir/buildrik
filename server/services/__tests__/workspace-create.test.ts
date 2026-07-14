/**
 * W1 — create additional workspace, plan-gated. Free users get exactly one
 * workspace; a second requires a paid plan on a workspace they own (multi-workspace
 * is the Pro/agency feature, and it closes the per-workspace free site-cap bypass).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const memberFindFirst = vi.fn();
const memberFindMany = vi.fn();
const wsFindUnique = vi.fn();
const wsCreate = vi.fn();
const memberCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: {
      // createWorkspace gained a duplicate-name guard (workspaceMember.findFirst
      // → WorkspaceNameTakenError) that this mock never grew, so every test in
      // this file died on "findFirst is not a function".
      findFirst: (...a: unknown[]) => memberFindFirst(...a),
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

import {
  createWorkspace,
  WorkspaceLimitError,
  WorkspaceNameTakenError,
} from "@server/services/workspace-settings.service";

beforeEach(() => {
  [memberFindFirst, memberFindMany, wsFindUnique, wsCreate, memberCreate].forEach((m) =>
    m.mockReset(),
  );
  memberFindFirst.mockResolvedValue(null); // no same-named workspace for this user
  wsFindUnique.mockResolvedValue(null); // slug is unique on first try
  wsCreate.mockResolvedValue({ id: "ws_new" });
  memberCreate.mockResolvedValue({});
});

describe("createWorkspace (duplicate-name guard)", () => {
  it("rejects a name this user already has, before creating anything", async () => {
    memberFindMany.mockResolvedValueOnce([]);
    memberFindFirst.mockResolvedValueOnce({ id: "wm_1" }); // same name, same user
    await expect(createWorkspace("u1", "Acme")).rejects.toBeInstanceOf(WorkspaceNameTakenError);
    expect(wsCreate).not.toHaveBeenCalled();
  });

  it("allows the same name for a DIFFERENT user (the guard is per-user)", async () => {
    memberFindMany.mockResolvedValueOnce([]);
    memberFindFirst.mockResolvedValueOnce(null); // u2 has no workspace by that name
    const res = await createWorkspace("u2", "Acme");
    expect(res.workspaceId).toBe("ws_new");
  });
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
