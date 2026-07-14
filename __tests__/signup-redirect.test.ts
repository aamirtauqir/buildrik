import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("Signup page redirect", () => {
  // This used to read app/auth/page.tsx, because signup was once a thin stub that
  // forwarded to it. Signup is a real two-phase page again (email capture → name +
  // password), and it owns the verify-email redirect. Reading the login page meant
  // this asserted against a file that never had the redirect, so it has been red
  // since the rebuild.
  const signupSource = readFileSync(
    path.resolve(__dirname, "../packages/dashboard/app/auth/signup/page.tsx"),
    "utf-8"
  );

  it("passes email parameter to verify-email redirect URL", () => {
    // The signup page should redirect to /auth/verify-email with email query param
    // so the verify-email page can display which email to check
    const hasEmailInRedirect = signupSource.includes("verify-email?email=")
      || signupSource.includes("verify-email?email=${")
      || signupSource.includes("`/auth/verify-email?email=");

    expect(hasEmailInRedirect).toBe(true);
  });

  it("does NOT redirect to /auth/verify-email without email param", () => {
    // There should be no plain redirect to /auth/verify-email without params
    const plainRedirect = /router\.push\(["'`]\/auth\/verify-email["'`]\)/.test(signupSource);
    expect(plainRedirect).toBe(false);
  });
});
