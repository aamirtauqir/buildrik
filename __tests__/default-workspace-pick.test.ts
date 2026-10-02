/**
 * Stale active workspace, server half. When the session's workspace is no
 * longer an ACTIVE membership, both server resolvers fall back to "some other
 * membership". They used an unordered `findFirst`, so which workspace the
 * server acted on was whatever Postgres returned first, while login and the jwt
 * repair pick lastActiveAt desc, joinedAt asc. Every fallback must pass that
 * same order so client and server can never land on different workspaces.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { getWorkspaceSettings, globalMemberFindFirst } = vi.hoisted(() => ({
  getWorkspaceSettings: vi.fn(),
  globalMemberFindFirst: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/prisma", () => ({
  prisma: { workspaceMember: { findFirst: (...a: unknown[]) => globalMemberFindFirst(...a) } },
}));
vi.mock("@/server/services/dashboard.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/dashboard.service")>()),
  getDashboardStats: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/server/services/workspace-settings.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/workspace-settings.service")>()),
  getWorkspaceSettings,
}));

import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { accountRouter } from "@server/trpc/routers/account";
import { dashboardRouter } from "@server/trpc/routers/dashboard";
import { requireWorkspace } from "@/server/trpc/require-workspace";

const CANONICAL_ORDER = [{ lastActiveAt: { sort: "desc", nulls: "last" } }, { joinedAt: "asc" }, { id: "asc" }];

beforeEach(() => {
  getWorkspaceSettings.mockReset().mockResolvedValue({ id: "ws-canonical" });
  globalMemberFindFirst.mockReset();
});

describe("resolveWorkspaceId — fallback uses the canonical order", () => {
  it("a stale session workspace falls back to the canonical pick", async () => {
    const findFirst = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ workspaceId: "ws-canonical" });

    const id = await resolveWorkspaceId({
      prisma: { workspaceMember: { findFirst } },
      session: { user: { id: "u1", workspaceId: "ws-deleted" } },
    });

    expect(id).toBe("ws-canonical");
    expect(findFirst).toHaveBeenLastCalledWith({
      where: { userId: "u1", status: "ACTIVE" },
      orderBy: CANONICAL_ORDER,
      select: { workspaceId: true },
    });
  });

  it("no session workspace at all also takes the canonical pick", async () => {
    const findFirst = vi.fn().mockResolvedValue({ workspaceId: "ws-canonical" });

    await resolveWorkspaceId({
      prisma: { workspaceMember: { findFirst } },
      session: { user: { id: "u1", workspaceId: null } },
    });

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ orderBy: CANONICAL_ORDER }));
  });
});

describe("account getWorkspaceCtx — fallback uses the canonical order", () => {
  function ctxWith(findFirst: ReturnType<typeof vi.fn>, workspaceId: string | null) {
    return { session: { user: { id: "u1", workspaceId } }, prisma: { workspaceMember: { findFirst } } } as never;
  }

  it("a stale session workspace falls back to the canonical pick", async () => {
    const findFirst = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ workspaceId: "ws-canonical", workspace: { plan: "FREE" } });

    await accountRouter.createCaller(ctxWith(findFirst, "ws-deleted")).workspace.get();

    expect(findFirst).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { userId: "u1", status: "ACTIVE" },
      orderBy: CANONICAL_ORDER,
    }));
    expect(getWorkspaceSettings).toHaveBeenCalledWith("ws-canonical");
  });

  it("no session workspace at all also takes the canonical pick", async () => {
    const findFirst = vi.fn().mockResolvedValue({ workspaceId: "ws-canonical", workspace: { plan: "FREE" } });

    await accountRouter.createCaller(ctxWith(findFirst, null)).workspace.get();

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "u1", status: "ACTIVE" },
      orderBy: CANONICAL_ORDER,
    }));
  });
});

describe("requireWorkspace — fallback uses the canonical order", () => {
  it("a stale session workspace falls back to the canonical pick", async () => {
    globalMemberFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ workspaceId: "ws-canonical" });

    const id = await requireWorkspace({ session: { user: { id: "u1", workspaceId: "ws-deleted" } } });

    expect(id).toBe("ws-canonical");
    expect(globalMemberFindFirst).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { userId: "u1", status: "ACTIVE" },
      orderBy: CANONICAL_ORDER,
    }));
  });

  it("no session workspace at all also takes the canonical pick", async () => {
    globalMemberFindFirst.mockResolvedValue({ workspaceId: "ws-canonical" });

    await requireWorkspace({ session: { user: { id: "u1", workspaceId: null } } });

    expect(globalMemberFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "u1", status: "ACTIVE" },
      orderBy: CANONICAL_ORDER,
    }));
  });
});

describe("dashboard getWorkspaceMember — fallback uses the canonical order", () => {
  function ctxWith(findFirst: ReturnType<typeof vi.fn>, workspaceId: string | null) {
    return { session: { user: { id: "u1", workspaceId } }, prisma: { workspaceMember: { findFirst } } } as never;
  }

  it("a stale session workspace falls back to the canonical pick", async () => {
    const findFirst = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ workspaceId: "ws-canonical", role: "OWNER" });

    await dashboardRouter.createCaller(ctxWith(findFirst, "ws-deleted")).stats();

    expect(findFirst).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { userId: "u1", status: "ACTIVE" },
      orderBy: CANONICAL_ORDER,
    }));
  });

  it("no session workspace at all also takes the canonical pick", async () => {
    const findFirst = vi.fn().mockResolvedValue({ workspaceId: "ws-canonical", role: "OWNER" });

    await dashboardRouter.createCaller(ctxWith(findFirst, null)).stats();

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "u1", status: "ACTIVE" },
      orderBy: CANONICAL_ORDER,
    }));
  });
});
