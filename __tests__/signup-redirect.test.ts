import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("Signup page redirect", () => {
  // app/auth/signup/page.tsx was refactored to a thin redirect stub —
  // it just forwards /signup to /auth?email=... The actual signup form +
  // verify-email redirect logic lives in app/auth/page.tsx. Read there.
  const signupSource = readFileSync(
    path.resolve(__dirname, "../packages/dashboard/app/auth/page.tsx"),
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
