/**
 * Workspace rename (workspace.update) — duplicate-name guard. Renaming had no
 * uniqueness check at all (only createWorkspace did), so the M2 onboarding
 * "name exists" state had no server signal to key off. Mirrors the createWorkspace
 * guard: scoped per-user, excluding the workspace being renamed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const memberFindFirst = vi.fn();
const wsUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: {
      findFirst: (...a: unknown[]) => memberFindFirst(...a),
    },
    workspace: {
      update: (...a: unknown[]) => wsUpdate(...a),
    },
  },
}));

import { updateWorkspaceSettings, WorkspaceNameTakenError } from "@server/services/workspace-settings.service";

beforeEach(() => {
  [memberFindFirst, wsUpdate].forEach((m) => m.mockReset());
  memberFindFirst.mockResolvedValue(null); // no clash by default
  wsUpdate.mockResolvedValue({ id: "ws_1", name: "Acme" });
});

describe("updateWorkspaceSettings (duplicate-name guard)", () => {
  it("rejects renaming to a name this user already has on ANOTHER workspace", async () => {
    memberFindFirst.mockResolvedValueOnce({ id: "wm_2" }); // clash on a different workspace
    await expect(updateWorkspaceSettings("ws_1", { name: "Acme" }, "u1")).rejects.toBeInstanceOf(
      WorkspaceNameTakenError,
    );
    expect(wsUpdate).not.toHaveBeenCalled();
    expect(memberFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "u1", workspaceId: { not: "ws_1" } }),
      }),
    );
  });

  it("allows renaming to the SAME name on the workspace itself (excluded from the clash check)", async () => {
    memberFindFirst.mockResolvedValueOnce(null); // the only match would be ws_1 itself, which is excluded
    const res = await updateWorkspaceSettings("ws_1", { name: "Acme" }, "u1");
    expect(res).toEqual({ id: "ws_1", name: "Acme" });
    expect(wsUpdate).toHaveBeenCalledOnce();
  });

  it("allows the same name for a DIFFERENT user (the guard is per-user)", async () => {
    memberFindFirst.mockResolvedValueOnce(null);
    const res = await updateWorkspaceSettings("ws_2", { name: "Acme" }, "u2");
    expect(res).toEqual({ id: "ws_1", name: "Acme" });
  });

  it("skips the clash check entirely when name isn't part of the patch", async () => {
    const res = await updateWorkspaceSettings("ws_1", { timezone: "UTC" }, "u1");
    expect(memberFindFirst).not.toHaveBeenCalled();
    expect(res).toEqual({ id: "ws_1", name: "Acme" });
  });
});
