import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collabOperation: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  appendCollabOp,
  getCollabOpsSince,
  latestCollabSeq,
  oldestCollabSeq,
  hasResyncGap,
} from "@server/services/collab.service";

const p = prisma as unknown as {
  collabOperation: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
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

  // op-log hazard fix (deterministic prune + resync-gap)

  it("prune fires deterministically when seq hits the cadence (seq % 50 === 0)", async () => {
    p.collabOperation.create.mockResolvedValue({ id: "o1", seq: 100 });
    await appendCollabOp("site-1", "u1", "c", {});
    expect(p.collabOperation.deleteMany).toHaveBeenCalledOnce();
    const where = p.collabOperation.deleteMany.mock.calls[0][0].where;
    expect(where.siteId).toBe("site-1");
    expect(where.createdAt.lt).toBeInstanceOf(Date);
  });

  it("prune does NOT fire on off-cadence appends (no Math.random gamble)", async () => {
    p.collabOperation.create.mockResolvedValue({ id: "o1", seq: 7 });
    await appendCollabOp("site-1", "u1", "c", {});
    expect(p.collabOperation.deleteMany).not.toHaveBeenCalled();
  });

  it("oldestCollabSeq returns the oldest retained seq, 0 when empty", async () => {
    p.collabOperation.findFirst.mockResolvedValueOnce({ seq: 5 });
    expect(await oldestCollabSeq("site-1")).toBe(5);
    p.collabOperation.findFirst.mockResolvedValueOnce(null);
    expect(await oldestCollabSeq("site-1")).toBe(0);
  });

  it("hasResyncGap: fresh client (since=0) never gaps, no query", async () => {
    expect(await hasResyncGap("site-1", 0)).toBe(false);
    expect(p.collabOperation.findFirst).not.toHaveBeenCalled();
  });

  it("hasResyncGap: TRUE when last-seen op was pruned (sinceSeq < oldest retained)", async () => {
    p.collabOperation.findFirst.mockResolvedValueOnce({ seq: 5 }); // oldest retained
    expect(await hasResyncGap("site-1", 3)).toBe(true);
  });

  it("hasResyncGap: FALSE when checkpoint still retained (sinceSeq >= oldest)", async () => {
    p.collabOperation.findFirst.mockResolvedValueOnce({ seq: 5 });
    expect(await hasResyncGap("site-1", 5)).toBe(false);
    p.collabOperation.findFirst.mockResolvedValueOnce({ seq: 5 });
    expect(await hasResyncGap("site-1", 10)).toBe(false);
  });
});
