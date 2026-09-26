/**
 * I1: a REDIRECT save that omits the URL in the same call used to fail the
 * schema silently (the client showed it as saved anyway — optimistic UI with
 * no revert). These tests parse the REAL payload shapes through the actual
 * schema so a future regression fails here, not just in the UI.
 */
import { describe, it, expect } from "vitest";
import { updateFormBlockSchema } from "../forms";

const base = { siteId: "s1", blockId: "b1" };

describe("updateFormBlockSchema", () => {
  it("accepts a partial update that doesn't touch successAction/redirectUrl", () => {
    expect(updateFormBlockSchema.safeParse({ ...base, spamProtection: false }).success).toBe(true);
  });

  it("refuses successAction: REDIRECT with no redirectUrl in the same payload", () => {
    const result = updateFormBlockSchema.safeParse({ ...base, successAction: "REDIRECT" });
    expect(result.success).toBe(false);
  });

  it("accepts successAction: REDIRECT bundled with a redirectUrl — the fix for I1", () => {
    const result = updateFormBlockSchema.safeParse({
      ...base,
      successAction: "REDIRECT",
      redirectUrl: "https://example.com/thanks",
    });
    expect(result.success).toBe(true);
  });

  it("refuses a relative redirectUrl (NextResponse.redirect needs an absolute URL)", () => {
    const result = updateFormBlockSchema.safeParse({
      ...base,
      successAction: "REDIRECT",
      redirectUrl: "/thanks",
    });
    expect(result.success).toBe(false);
  });

  it("refuses a javascript: redirectUrl", () => {
    const result = updateFormBlockSchema.safeParse({
      ...base,
      successAction: "REDIRECT",
      redirectUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("accepts switching back to MESSAGE with no redirectUrl", () => {
    expect(updateFormBlockSchema.safeParse({ ...base, successAction: "MESSAGE" }).success).toBe(true);
  });
});
