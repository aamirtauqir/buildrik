import { describe, it, expect, vi, beforeEach } from "vitest";

const { cancelWorkspaceDeletion } = vi.hoisted(() => ({ cancelWorkspaceDeletion: vi.fn() }));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/workspace-settings.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/workspace-settings.service")>()),
  cancelWorkspaceDeletion,
}));

import { accountRouter } from "@server/trpc/routers/account";
import { TRPCError } from "@trpc/server";

/* I5: the router no longer reads the workspace itself — the owner check is the
   service's, and ctx.prisma carries only what getWorkspaceCtx needs. */
function makeCtx(userId: string) {
  return {
    session: { user: { id: userId } },
    prisma: {
      workspaceMember: {
        findFirst: vi.fn().mockResolvedValue({ workspaceId: "w1", role: "ADMIN", workspace: { plan: "PRO" } }),
      },
    },
  } as never;
}

beforeEach(() => {
  cancelWorkspaceDeletion.mockReset().mockImplementation(async (_workspaceId: string, userId: string) => {
    if (userId !== "owner-1") throw new Error("NOT_OWNER");
    return { id: "w1", deletionScheduledAt: null };
  });
});

describe("account.workspace.cancelDelete — owner only", () => {
  it("maps the service's NOT_OWNER to FORBIDDEN", async () => {
    const caller = accountRouter.createCaller(makeCtx("admin-1"));
    const err = await caller.workspace.cancelDelete().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("FORBIDDEN");
    expect((err as TRPCError).message).toBe("Only the owner can cancel the deletion.");
    expect(cancelWorkspaceDeletion).toHaveBeenCalledWith("w1", "admin-1");
  });

  it("lets the owner cancel", async () => {
    const caller = accountRouter.createCaller(makeCtx("owner-1"));
    await caller.workspace.cancelDelete();
    expect(cancelWorkspaceDeletion).toHaveBeenCalledWith("w1", "owner-1");
  });
});
