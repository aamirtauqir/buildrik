/**
 * Unit P — AI hardening. reserveQuota closes the concurrent check-then-act
 * bypass via a conditional atomic increment; resolveModelForUser makes model
 * choice server-authoritative (client hint gated by plan tier).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { aIUsage, workspaceMemberFindFirst } = vi.hoisted(() => ({
  aIUsage: {
    updateMany: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
  workspaceMemberFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aIUsage,
    workspaceMember: {
      findFirst: (...args: unknown[]) => workspaceMemberFindFirst(...args),
    },
  },
}));

import {
  reserveQuota,
  releaseQuota,
  resolveModelForUser,
} from "@server/services/quota.service";

function asPlan(plan: string | null) {
  workspaceMemberFindFirst.mockResolvedValueOnce(
    plan ? { workspace: { plan } } : null,
  );
}

beforeEach(() => {
  aIUsage.updateMany.mockReset();
  aIUsage.create.mockReset();
  aIUsage.upsert.mockReset();
  aIUsage.findUnique.mockReset();
  workspaceMemberFindFirst.mockReset();
});

describe("reserveQuota", () => {
  it("reserves when an existing row is under the limit (atomic increment hits)", async () => {
    asPlan("FREE"); // limit 10
    aIUsage.updateMany.mockResolvedValueOnce({ count: 1 });
    const r = await reserveQuota("u1", "gpt-4o-mini");
    expect(r.ok).toBe(true);
    // Conditional guard: only increments a row already under the limit.
    const where = aIUsage.updateMany.mock.calls[0][0].where;
    expect(where.count).toEqual({ lt: 10 });
    expect(aIUsage.create).not.toHaveBeenCalled();
  });

  it("creates the row on the first call of the day", async () => {
    asPlan("FREE");
    aIUsage.updateMany.mockResolvedValueOnce({ count: 0 });
    aIUsage.create.mockResolvedValueOnce({ count: 1 });
    const r = await reserveQuota("u1", "gpt-4o-mini");
    expect(r.ok).toBe(true);
    expect(aIUsage.create).toHaveBeenCalledOnce();
  });

  it("rejects when the row exists and is at/over the limit (create hits unique violation)", async () => {
    asPlan("FREE");
    aIUsage.updateMany.mockResolvedValueOnce({ count: 0 }); // guard did not match
    aIUsage.create.mockRejectedValueOnce({ code: "P2002" }); // row already exists
    aIUsage.findUnique.mockResolvedValueOnce({ count: 10 });
    const r = await reserveQuota("u1", "gpt-4o-mini");
    expect(r.ok).toBe(false);
    expect(r.used).toBe(10);
    expect(r.limit).toBe(10);
  });

  it("never rejects an UNLIMITED (BUSINESS) plan", async () => {
    asPlan("BUSINESS"); // aiPromptsPerDay -1
    aIUsage.upsert.mockResolvedValueOnce({ count: 1 });
    const r = await reserveQuota("u1", "gpt-4o-mini");
    expect(r.ok).toBe(true);
    expect(aIUsage.upsert).toHaveBeenCalledOnce();
    expect(aIUsage.updateMany).not.toHaveBeenCalled();
  });

  it("propagates non-unique DB errors (no swallow)", async () => {
    asPlan("FREE");
    aIUsage.updateMany.mockResolvedValueOnce({ count: 0 });
    aIUsage.create.mockRejectedValueOnce(new Error("DB down"));
    await expect(reserveQuota("u1", "gpt-4o-mini")).rejects.toThrow(
      "DB down",
    );
  });
});

describe("releaseQuota", () => {
  it("decrements only a positive count (floored at zero)", async () => {
    aIUsage.updateMany.mockResolvedValueOnce({ count: 1 });
    await releaseQuota("u1");
    const arg = aIUsage.updateMany.mock.calls[0][0];
    expect(arg.where.count).toEqual({ gt: 0 });
    expect(arg.data.count).toEqual({ decrement: 1 });
  });
});

describe("resolveModelForUser (server-authoritative)", () => {
  it("ignores a hint the tier does not allow, falling back to the tier default", async () => {
    asPlan("FREE");
    // `gpt-4o` is not in any tier's allow-list. A client asking for it (or for a
    // retired Claude id) must not get it.
    await expect(resolveModelForUser("u1", "gpt-4o")).resolves.toBe("gpt-4o-mini");
  });

  it("honours an allowed hint", async () => {
    asPlan("FREE");
    await expect(resolveModelForUser("u1", "gpt-4o-mini")).resolves.toBe(
      "gpt-4o-mini",
    );
  });

  it("defaults when no hint is given", async () => {
    asPlan("PRO");
    await expect(resolveModelForUser("u1", undefined)).resolves.toBe(
      "gpt-4o-mini",
    );
  });

  // The tier ladder is deliberately flat today: FREE/PRO/BUSINESS all run the
  // same model. It used to be haiku/sonnet/opus, which never worked (no Anthropic
  // key has ever existed). This pins the flat state so a reintroduced ladder is a
  // conscious change with a test to update, not a silent drift back to fiction.
  it("resolves the same model for every tier while the ladder is flat", async () => {
    for (const plan of ["FREE", "PRO", "BUSINESS"] as const) {
      asPlan(plan);
      await expect(resolveModelForUser("u1", undefined)).resolves.toBe("gpt-4o-mini");
    }
  });

  it("forces 'ollama' when OLLAMA_BASE_URL is set, bypassing tier and hint", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    try {
      await expect(resolveModelForUser("u1", "gpt-4o-mini")).resolves.toBe(
        "ollama",
      );
    } finally {
      delete process.env.OLLAMA_BASE_URL;
    }
  });
});
