import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const twoFASource = readFileSync(
  path.resolve(__dirname, "../packages/dashboard/app/auth/2fa/page.tsx"),
  "utf-8"
);

const backupSource = readFileSync(
  path.resolve(__dirname, "../packages/dashboard/app/auth/2fa/backup/page.tsx"),
  "utf-8"
);

describe("2FA error display", () => {
  it("2FA page has onError handler for verify2FA mutation", () => {
    expect(twoFASource).toContain("onError");
  });

  it("2FA page displays error to user (has error state)", () => {
    // Should have error state variable
    expect(twoFASource).toContain("setError");
    // Should display error via FormBanner or similar
    expect(twoFASource).toMatch(/FormBanner|error.*&&/);
  });
});

describe("Backup code error display", () => {
  it("Backup code page has onError handler for verifyBackupCode mutation", () => {
    expect(backupSource).toContain("onError");
  });

  it("Backup code page displays error to user (has error state)", () => {
    expect(backupSource).toContain("setError");
    expect(backupSource).toMatch(/FormBanner|error.*&&/);
  });
});
