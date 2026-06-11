/**
 * Single-use confirmation grants. The security property: a grant is consumable
 * exactly once, for the proposing actor, before expiry — no replay.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();
const updateManyMock = vi.fn();
const findUniqueMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    actionConfirmation: {
      create: (...a: unknown[]) => createMock(...a),
      updateMany: (...a: unknown[]) => updateManyMock(...a),
      findUnique: (...a: unknown[]) => findUniqueMock(...a),
    },
  },
}));

import {
  createConfirmation,
  consumeConfirmation,
  hashArgs,
} from "@server/services/action-confirmation.service";

describe("action confirmation grants", () => {
  beforeEach(() => {
    createMock.mockReset();
    updateManyMock.mockReset();
    findUniqueMock.mockReset();
  });

  it("createConfirmation persists actor/site/action + argsHash + an expiry, returns the id", async () => {
    createMock.mockResolvedValueOnce({ id: "grant-1" });
    const token = await createConfirmation({ actorId: "u1", siteId: "s1", actionId: "site.publish", args: {} });
    expect(token).toBe("grant-1");
    const data = createMock.mock.calls[0][0].data;
    expect(data).toMatchObject({ actorId: "u1", siteId: "s1", actionId: "site.publish", argsHash: hashArgs({}) });
    expect(data.expiresAt instanceof Date).toBe(true);
  });

  it("consume succeeds when the atomic update flips exactly one unused row", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 1 });
    findUniqueMock.mockResolvedValueOnce({ siteId: "s1", actionId: "site.publish", argsHash: "x" });
    const r = await consumeConfirmation("grant-1", "u1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.claims.siteId).toBe("s1");
    // the consume must be scoped to the actor + unused + unexpired
    const where = updateManyMock.mock.calls[0][0].where;
    expect(where.actorId).toBe("u1");
    expect(where.usedAt).toBeNull();
    expect(where.expiresAt).toHaveProperty("gt");
  });

  it("REJECTS a replay — second consume flips 0 rows (already used)", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 0 });
    const r = await consumeConfirmation("grant-1", "u1");
    expect(r.ok).toBe(false);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("REJECTS a wrong actor / expired grant (0 rows updated)", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 0 });
    expect((await consumeConfirmation("grant-1", "intruder")).ok).toBe(false);
  });
});
