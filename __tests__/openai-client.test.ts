/**
 * getOpenAI() — request bounds (audit F-08).
 *
 * The SDK defaults are a 10-minute timeout and 2 retries, so one hung call
 * could hold a mutation, a subscription or the onboarding worker for ~30 min.
 */
import { describe, it, expect, vi } from "vitest";

const ctorArgs = vi.fn();
vi.mock("openai", () => ({
  default: class MockOpenAI {
    constructor(opts: unknown) {
      ctorArgs(opts);
    }
  },
}));

describe("getOpenAI", () => {
  it("constructs lazily, once, with a bounded timeout and at most one retry", async () => {
    const { getOpenAI } = await import("@/server/services/openai.client");
    expect(ctorArgs).not.toHaveBeenCalled();

    const a = getOpenAI();
    const b = getOpenAI();

    expect(a).toBe(b);
    expect(ctorArgs).toHaveBeenCalledTimes(1);
    const opts = ctorArgs.mock.calls[0][0] as { timeout?: number; maxRetries?: number };
    expect(opts.timeout).toBeGreaterThan(0);
    expect(opts.timeout).toBeLessThanOrEqual(120_000);
    expect(opts.maxRetries).toBeLessThanOrEqual(1);
  });
});
