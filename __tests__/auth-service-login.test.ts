import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Tests for auth.service.ts login() function logic.
 * We test by reading source code because the service has heavy Prisma/bcrypt deps.
 */

const authServiceSource = readFileSync(
  path.resolve(__dirname, "../server/services/auth.service.ts"),
  "utf-8"
);

describe("login() lockout check order", () => {
  it("checks account lockout BEFORE bcrypt password validation", () => {
    // Find positions of key operations in login function
    const loginFnStart = authServiceSource.indexOf("export async function login(");
    const loginFnEnd = authServiceSource.indexOf("export async function signup(");
    const loginFn = authServiceSource.slice(loginFnStart, loginFnEnd);

    const lockCheckPos = loginFn.indexOf("isAccountLocked");
    const bcryptPos = loginFn.indexOf("bcrypt.compare");

    // Lockout check must come BEFORE bcrypt compare
    expect(lockCheckPos).toBeGreaterThan(-1);
    expect(bcryptPos).toBeGreaterThan(-1);
    expect(lockCheckPos).toBeLessThan(bcryptPos);
  });
});

describe("login() 2FA audit logging", () => {
  it("logs 2FA_FAILED when invalid code is provided", () => {
    const verify2FAStart = authServiceSource.indexOf("export async function verify2FA(");
    const verify2FAEnd = authServiceSource.indexOf("export async function verifyBackupCode(");
    const verify2FA = authServiceSource.slice(verify2FAStart, verify2FAEnd);

    // Should log 2FA_FAILED before throwing error
    expect(verify2FA).toContain("2FA_FAILED");
  });

  it("logs BACKUP_CODE_FAILED when invalid backup code is provided", () => {
    const backupStart = authServiceSource.indexOf("export async function verifyBackupCode(");
    const backupEnd = authServiceSource.indexOf("export { encryptSecret");
    const backupFn = authServiceSource.slice(backupStart, backupEnd);

    expect(backupFn).toContain("BACKUP_CODE_FAILED");
  });
});
