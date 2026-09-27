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

function makeCtx(userId: string, ownerId: string) {
  return {
    session: { user: { id: userId } },
    prisma: {
      workspaceMember: {
        findFirst: vi.fn().mockResolvedValue({ workspaceId: "w1", role: "ADMIN", workspace: { plan: "PRO" } }),
      },
      workspace: { findUnique: vi.fn().mockResolvedValue({ id: "w1", ownerId, name: "Acme" }) },
    },
  } as never;
}

beforeEach(() => {
  cancelWorkspaceDeletion.mockReset().mockResolvedValue({ id: "w1", deletionScheduledAt: null });
});

describe("account.workspace.cancelDelete — owner only", () => {
  it("rejects an admin who is not the owner with FORBIDDEN", async () => {
    const caller = accountRouter.createCaller(makeCtx("admin-1", "owner-1"));
    const err = await caller.workspace.cancelDelete().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TRPCError);
    expect((err as TRPCError).code).toBe("FORBIDDEN");
    expect((err as TRPCError).message).toBe("Only the owner can cancel the deletion.");
    expect(cancelWorkspaceDeletion).not.toHaveBeenCalled();
  });

  it("lets the owner cancel", async () => {
    const caller = accountRouter.createCaller(makeCtx("owner-1", "owner-1"));
    await caller.workspace.cancelDelete();
    expect(cancelWorkspaceDeletion).toHaveBeenCalledWith("w1");
  });
});
