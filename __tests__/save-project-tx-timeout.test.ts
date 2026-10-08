/**
 * The project save runs one interactive transaction: the CAS claim, the page
 * deletes and one upsert per page with its whole element tree. Under load that
 * outran Prisma's 5 s default (live 2026-10-08, a 6.6 s save on a loaded
 * machine): P2028 "commit cannot be executed on an expired transaction" came
 * back as a raw 500, and whether the commit had landed was never asked — the
 * next save then met a 409.
 *
 * Now: an explicit budget sized for a full snapshot, and a timed-out save asks
 * the row whether its own stamp landed before calling it failed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const siteFindUnique = vi.fn();
const txOptions: unknown[] = [];
let stamp: Date | null = null;
let failWith: unknown = null;

vi.mock("@/lib/prisma", () => {
  const tx = {
    page: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
      deleteMany: vi.fn(),
      upsert: vi.fn(async () => ({})),
      update: vi.fn(),
    },
    formBlock: { deleteMany: vi.fn() },
    site: {
      updateMany: vi.fn(async (a: { data: { lastEditedAt: Date } }) => {
        stamp = a.data.lastEditedAt;
        return { count: 1 };
      }),
    },
  };
  return {
    prisma: {
      site: { findUnique: (...a: unknown[]) => siteFindUnique(...a) },
      $transaction: async (fn: (t: unknown) => unknown, opts?: unknown) => {
        txOptions.push(opts);
        await fn(tx);
        if (failWith) throw failWith;
      },
    },
  };
});
vi.mock("@/server/services/sanitize.service", () => ({ sanitizeBlocks: vi.fn() }));

import { saveProjectData } from "@/server/services/sites.service";

const p2028 = () =>
  new Prisma.PrismaClientKnownRequestError(
    "Transaction already closed: A commit cannot be executed on an expired transaction.",
    { code: "P2028", clientVersion: "5" },
  );
const save = () =>
  saveProjectData({ siteId: "s_1", pages: [{ id: "p_1", name: "Home", slug: "home", blocks: [], position: 0 }] } as never);

beforeEach(() => {
  vi.clearAllMocks();
  txOptions.length = 0;
  stamp = null;
  failWith = null;
  siteFindUnique.mockResolvedValue({ id: "s_1", deletedAt: null, lastEditedAt: new Date(0) });
});

describe("saveProjectData transaction budget", () => {
  it("gives the transaction more than Prisma's 5 s default", async () => {
    await save();
    const opts = txOptions[0] as { timeout?: number; maxWait?: number };
    expect(opts?.timeout).toBeGreaterThanOrEqual(15_000);
  });

  it("a timed-out commit that did land is a saved save", async () => {
    failWith = p2028();
    siteFindUnique
      .mockResolvedValueOnce({ id: "s_1", deletedAt: null, lastEditedAt: new Date(0) })
      .mockImplementationOnce(async () => ({ lastEditedAt: stamp }));
    await expect(save()).resolves.toMatchObject({ success: true });
  });

  it("a timed-out commit that did not land says so, retryably", async () => {
    failWith = p2028();
    siteFindUnique
      .mockResolvedValueOnce({ id: "s_1", deletedAt: null, lastEditedAt: new Date(0) })
      .mockResolvedValueOnce({ lastEditedAt: new Date(0) });
    await expect(save()).rejects.toThrow("SAVE_TIMEOUT");
  });
});
