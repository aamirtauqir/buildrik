import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const fpSource = readFileSync(
  path.resolve(__dirname, "../app/auth/forgot-password/page.tsx"),
  "utf-8"
);

describe("Forgot password redirect", () => {
  it("passes email parameter to check-inbox redirect URL", () => {
    const hasEmailInRedirect = fpSource.includes("check-inbox?")
      && (fpSource.includes("email=") || fpSource.includes("email=${"));

    expect(hasEmailInRedirect).toBe(true);
  });

  it("does NOT redirect to check-inbox without email param", () => {
    // Should not have a plain redirect without email
    const plainRedirect = /router\.push\(["']\/auth\/check-inbox\?type=reset["']\)/.test(fpSource);
    expect(plainRedirect).toBe(false);
  });
});
