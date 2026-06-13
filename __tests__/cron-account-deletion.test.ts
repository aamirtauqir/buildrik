import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn(prisma);
    }),
    accountDeletionReq: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    workspace: {
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/cron/account-deletion/route";

const mockPrisma = prisma as typeof prisma & {
  $transaction: ReturnType<typeof vi.fn>;
  accountDeletionReq: {
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  workspace: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  workspaceMember: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> };
};

function makeReq(authHeader?: string): NextRequest {
  return new Request("http://localhost/api/cron/account-deletion", {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
});

describe("account-deletion cron", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await GET(makeReq("Bearer wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("happy path: solo workspace is deleted, then members, then user", async () => {
    const req = { id: "req1", userId: "user1" };
    mockPrisma.accountDeletionReq.findMany.mockResolvedValue([req]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user1" });
    mockPrisma.workspace.findMany.mockResolvedValue([{ id: "ws1" }]);
    mockPrisma.workspaceMember.findFirst.mockResolvedValue(null); // no co-members → solo
    mockPrisma.workspace.delete.mockResolvedValue({ id: "ws1" });
    mockPrisma.workspaceMember.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.user.delete.mockResolvedValue({ id: "user1" });
    mockPrisma.accountDeletionReq.update.mockResolvedValue({});

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, deleted: 1 });

    expect(mockPrisma.workspace.delete).toHaveBeenCalledWith({ where: { id: "ws1" } });
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: "user1" } });
    const wsDeleteOrder = mockPrisma.workspace.delete.mock.invocationCallOrder[0];
    const userDeleteOrder = mockPrisma.user.delete.mock.invocationCallOrder[0];
    expect(wsDeleteOrder).toBeLessThan(userDeleteOrder);
  });

  it("SAFETY: a shared workspace is TRANSFERRED to a co-member, not deleted", async () => {
    const req = { id: "req1", userId: "owner1" };
    mockPrisma.accountDeletionReq.findMany.mockResolvedValue([req]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "owner1" });
    mockPrisma.workspace.findMany.mockResolvedValue([{ id: "ws1" }]);
    mockPrisma.workspaceMember.findFirst.mockResolvedValue({ id: "m2", userId: "member2" });
    mockPrisma.workspaceMember.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.user.delete.mockResolvedValue({ id: "owner1" });
    mockPrisma.accountDeletionReq.update.mockResolvedValue({});

    await GET(makeReq("Bearer test-secret"));

    // ownership transferred, heir promoted to OWNER, workspace NOT deleted
    expect(mockPrisma.workspace.update).toHaveBeenCalledWith({ where: { id: "ws1" }, data: { ownerId: "member2" } });
    expect(mockPrisma.workspaceMember.update).toHaveBeenCalledWith({ where: { id: "m2" }, data: { role: "OWNER" } });
    expect(mockPrisma.workspace.delete).not.toHaveBeenCalled();
  });

  it("user already deleted: marks processedAt without attempting deletion", async () => {
    const req = { id: "req1", userId: "user-gone" };
    mockPrisma.accountDeletionReq.findMany.mockResolvedValue([req]);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.accountDeletionReq.update.mockResolvedValue({});

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, deleted: 0 });

    expect(mockPrisma.workspace.delete).not.toHaveBeenCalled();
    expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    expect(mockPrisma.accountDeletionReq.update).toHaveBeenCalledWith({
      where: { id: "req1" },
      data: { processedAt: expect.any(Date) },
    });
  });

  it("no pending requests: returns { ok: true, deleted: 0 }", async () => {
    mockPrisma.accountDeletionReq.findMany.mockResolvedValue([]);

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, deleted: 0 });

    expect(mockPrisma.user.delete).not.toHaveBeenCalled();
  });

  it("cancelled requests are skipped (cancelledAt not null filtered in query)", async () => {
    // The route filters out cancelledAt: { not: null } at query level.
    // Simulate: findMany returns empty because cancelled ones are excluded.
    mockPrisma.accountDeletionReq.findMany.mockResolvedValue([]);

    const res = await GET(makeReq("Bearer test-secret"));
    const body = await res.json();
    expect(body).toEqual({ ok: true, deleted: 0 });

    // Verify the query filters out cancelled requests
    const call = mockPrisma.accountDeletionReq.findMany.mock.calls[0][0];
    expect(call.where.cancelledAt).toBeNull();
  });

  it("future scheduledAt requests are skipped (not yet due, filtered in query)", async () => {
    // The route filters scheduledAt: { lte: now }, future requests are excluded.
    mockPrisma.accountDeletionReq.findMany.mockResolvedValue([]);

    const res = await GET(makeReq("Bearer test-secret"));
    const body = await res.json();
    expect(body).toEqual({ ok: true, deleted: 0 });

    // Verify the query uses lte with a current date
    const call = mockPrisma.accountDeletionReq.findMany.mock.calls[0][0];
    expect(call.where.scheduledAt.lte).toBeInstanceOf(Date);
    expect(call.where.scheduledAt.lte.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
