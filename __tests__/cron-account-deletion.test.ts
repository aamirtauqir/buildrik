import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accountDeletionReq: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    workspace: {
      deleteMany: vi.fn(),
    },
    workspaceMember: {
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/cron/account-deletion/route";

const mockPrisma = prisma as typeof prisma & {
  accountDeletionReq: {
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  workspace: { deleteMany: ReturnType<typeof vi.fn> };
  workspaceMember: { deleteMany: ReturnType<typeof vi.fn> };
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

  it("happy path: processes pending request, deletes workspace then members then user", async () => {
    const req = { id: "req1", userId: "user1" };
    mockPrisma.accountDeletionReq.findMany.mockResolvedValue([req]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user1" });
    mockPrisma.workspace.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.workspaceMember.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.user.delete.mockResolvedValue({ id: "user1" });
    mockPrisma.accountDeletionReq.update.mockResolvedValue({});

    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, deleted: 1 });

    expect(mockPrisma.workspace.deleteMany).toHaveBeenCalledWith({ where: { ownerId: "user1" } });
    expect(mockPrisma.workspaceMember.deleteMany).toHaveBeenCalledWith({ where: { userId: "user1" } });
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: "user1" } });
    expect(mockPrisma.accountDeletionReq.update).toHaveBeenCalledWith({
      where: { id: "req1" },
      data: { processedAt: expect.any(Date) },
    });
  });

  it("deletion order: workspace.deleteMany is called before user.delete", async () => {
    const req = { id: "req1", userId: "user1" };
    mockPrisma.accountDeletionReq.findMany.mockResolvedValue([req]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user1" });
    mockPrisma.workspace.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.workspaceMember.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.user.delete.mockResolvedValue({ id: "user1" });
    mockPrisma.accountDeletionReq.update.mockResolvedValue({});

    await GET(makeReq("Bearer test-secret"));

    const workspaceDeleteOrder = mockPrisma.workspace.deleteMany.mock.invocationCallOrder[0];
    const userDeleteOrder = mockPrisma.user.delete.mock.invocationCallOrder[0];
    expect(workspaceDeleteOrder).toBeLessThan(userDeleteOrder);
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

    expect(mockPrisma.workspace.deleteMany).not.toHaveBeenCalled();
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
