// @vitest-environment jsdom
/**
 * G2-129 — the counter draws only from the ai.quota read: normal, at the
 * limit, unlimited (limit -1 → no count), and nothing when the read fails.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/* A plain function, not vi.fn: vitest records a vi.fn's settled results with
   an un-caught .then, so a rejecting vi.fn reports an unhandled error even when
   the code under test catches it. */
let answer: () => Promise<unknown> = () => Promise.resolve(null);
vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({ ai: { quota: { query: () => answer() } } }),
}));

import { fetchAiQuota, quotaLeftLabel } from "../hooks/useAiQuota";

const resetsAt = new Date("2026-09-26T00:00:00Z");
beforeEach(() => { answer = () => Promise.resolve(null); });

describe("ai.quota → counter", () => {
  it("normal: 3 of 10 used → 7 left today / 7 generations left today", async () => {
    answer = () => Promise.resolve({ used: 3, limit: 10, resetsAt });
    const q = (await fetchAiQuota())!;
    expect(quotaLeftLabel(q)).toBe("7 left today");
    expect(quotaLeftLabel(q, "generations")).toBe("7 generations left today");
  });

  it("at the limit: 0 left today (never negative)", () => {
    expect(quotaLeftLabel({ used: 10, limit: 10, resetsAt })).toBe("0 left today");
    expect(quotaLeftLabel({ used: 12, limit: 10, resetsAt })).toBe("0 left today");
  });

  it("unlimited (limit -1): no count", () => {
    expect(quotaLeftLabel({ used: 40, limit: -1, resetsAt })).toBeNull();
  });

  it("a failing read is null — nothing drawn", async () => {
    answer = () => Promise.reject(new Error("NOT_FOUND"));
    expect(await fetchAiQuota()).toBeNull();
  });
});
