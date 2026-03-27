import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const routerSource = readFileSync(
  path.resolve(__dirname, "../server/trpc/routers/auth.ts"),
  "utf-8"
);

describe("Router validation SSOT", () => {
  it("verify2FA uses otpSchema instead of inline validation", () => {
    // Find the verify2FA input definition
    const verify2FASection = routerSource.slice(
      routerSource.indexOf("verify2FA:"),
      routerSource.indexOf("verifyBackupCode:")
    );

    // Should NOT have inline regex for OTP
    const hasInlineOTPRegex = /z\.string\(\)\.length\(6\)\.regex/.test(verify2FASection);
    expect(hasInlineOTPRegex).toBe(false);

    // Should use otpSchema (or a combined schema that includes it)
    expect(verify2FASection).toContain("otpSchema");
  });

  it("verifyBackupCode uses backupCodeSchema instead of inline validation", () => {
    const backupSection = routerSource.slice(
      routerSource.indexOf("verifyBackupCode:"),
      routerSource.indexOf("logout:")
    );

    // Should NOT have inline regex for backup code
    const hasInlineBackupRegex = /z\.string\(\)\.regex\(\/\^\[A-Z0-9\]/.test(backupSection);
    expect(hasInlineBackupRegex).toBe(false);

    // Should use backupCodeSchema
    expect(backupSection).toContain("backupCodeSchema");
  });
});
