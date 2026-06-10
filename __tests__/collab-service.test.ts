import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collabOperation: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { appendCollabOp, getCollabOpsSince, latestCollabSeq } from "@server/services/collab.service";

const p = prisma as unknown as {
  collabOperation: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => vi.clearAllMocks());

describe("collab.service", () => {
  it("appendCollabOp stores the op and returns its seq", async () => {
    p.collabOperation.create.mockResolvedValue({ id: "o1", seq: 7 });
    const res = await appendCollabOp("site-1", "u1", "client-a", { type: "replace" });
    expect(res).toEqual({ id: "o1", seq: 7 });
    const arg = p.collabOperation.create.mock.calls[0][0].data;
    expect(arg.siteId).toBe("site-1");
    expect(arg.authorId).toBe("u1");
    expect(arg.clientId).toBe("client-a");
  });

  it("getCollabOpsSince queries ops after the given seq in order", async () => {
    p.collabOperation.findMany.mockResolvedValue([{ seq: 2, op: {} }]);
    await getCollabOpsSince("site-1", 1);
    const arg = p.collabOperation.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ siteId: "site-1", seq: { gt: 1 } });
    expect(arg.orderBy).toEqual({ seq: "asc" });
  });

  it("latestCollabSeq returns 0 when empty", async () => {
    p.collabOperation.findFirst.mockResolvedValue(null);
    expect(await latestCollabSeq("site-1")).toBe(0);
  });

  it("latestCollabSeq returns the head seq", async () => {
    p.collabOperation.findFirst.mockResolvedValue({ seq: 42 });
    expect(await latestCollabSeq("site-1")).toBe(42);
  });
});
