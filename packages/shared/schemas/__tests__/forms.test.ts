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

  /* L3-028: a thank-you page on the site itself is a path — the published
     host is not known before publish. Resolved against the visitor's page at
     submit time. A protocol-relative or backslash path is another host. */
  it("accepts a site path like /thanks", () => {
    const result = updateFormBlockSchema.safeParse({ ...base, successAction: "REDIRECT", redirectUrl: "/thanks" });
    expect(result.success).toBe(true);
  });

  it.each(["//evil.example/x", "/\\evil.example", "thanks", "/ thanks"])("refuses %s", (redirectUrl) => {
    const result = updateFormBlockSchema.safeParse({ ...base, successAction: "REDIRECT", redirectUrl });
    expect(result.success).toBe(false);
  });

  it("says what to type, in words", () => {
    const result = updateFormBlockSchema.safeParse({ ...base, redirectUrl: "thanks" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Use a page path like /thanks, or a full address starting with https://");
    }
  });

  it("names a bad notify email in words", () => {
    const result = updateFormBlockSchema.safeParse({ ...base, notifyEmail: "nope" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Enter an email address like you@company.com");
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
