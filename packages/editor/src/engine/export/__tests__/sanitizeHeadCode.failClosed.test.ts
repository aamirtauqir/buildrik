// @vitest-environment jsdom
/**
 * sanitizeHeadCode — fail-CLOSED contract.
 *
 * A broken sanitizer must NEVER pass raw content through. Separate file from
 * sanitizeHeadCode.test.ts because it mocks the dompurify module (the real
 * suite needs the real DOMPurify) and pokes the module-level singleton via
 * vi.resetModules().
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("dompurify", () => ({
  default: () => ({
    addHook: () => {},
    sanitize: () => {
      throw new Error("sanitizer exploded");
    },
  }),
}));

describe("sanitizeHeadCode — fail closed", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("returns '' (never the raw input) when the sanitizer throws", async () => {
    const { sanitizeHeadCode } = await import("../sanitizeHeadCode");
    const raw = '<script>alert("xss")</script><meta name="x" content="y">';
    expect(sanitizeHeadCode(raw)).toBe("");
  });

  it("logs a console.warn diagnostic on sanitizer failure", async () => {
    const { sanitizeHeadCode } = await import("../sanitizeHeadCode");
    sanitizeHeadCode("<meta name='x' content='y'>");
    expect(warnSpy).toHaveBeenCalledWith(
      "[sanitizeHeadCode] sanitization failed; dropping content",
      expect.any(Error)
    );
  });

  it("returns '' when no DOM global is available (getPurify throws)", async () => {
    // Fresh module (singleton unset) + window stubbed to undefined: getPurify
    // throws before DOMPurify is even constructed; the catch drops content.
    vi.stubGlobal("window", undefined);
    const { sanitizeHeadCode } = await import("../sanitizeHeadCode");
    expect(sanitizeHeadCode("<meta name='x' content='y'>")).toBe("");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("still short-circuits empty input to '' without touching the sanitizer", async () => {
    const { sanitizeHeadCode } = await import("../sanitizeHeadCode");
    expect(sanitizeHeadCode("")).toBe("");
    expect(sanitizeHeadCode("   ")).toBe("");
    expect(sanitizeHeadCode(null)).toBe("");
    expect(sanitizeHeadCode(undefined)).toBe("");
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
