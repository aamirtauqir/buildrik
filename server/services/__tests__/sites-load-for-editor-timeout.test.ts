/**
 * The editor load is one REPEATABLE READ transaction. Prisma's interactive
 * defaults (2s to start, 5s to run) failed a large site or a busy pool with
 * P2028, and the editor could not open the site at all.
 */
import { describe, it, expect, vi } from "vitest";

const txn = vi.fn(async (..._a: unknown[]) => null);
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: (...a: unknown[]) => txn(...a) } }));

import { loadSiteForEditor } from "@/server/services/sites.service";

describe("loadSiteForEditor", () => {
  it("runs with ceilings sized for a whole site's pages", async () => {
    await loadSiteForEditor("s1", "u1");
    expect(txn.mock.calls[0][1]).toMatchObject({ isolationLevel: "RepeatableRead", maxWait: 10_000, timeout: 30_000 });
  });
});
