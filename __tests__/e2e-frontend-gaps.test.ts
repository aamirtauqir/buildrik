import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

function readPage(pagePath: string): string {
  return readFileSync(path.resolve(__dirname, "..", pagePath), "utf-8");
}

describe("F1: expired-link buttons must be wired (no console.log stubs)", () => {
  const src = readPage("packages/dashboard/app/auth/error/expired-link/page.tsx");

  it("does NOT have console.log stubs in buttons", () => {
    expect(src).not.toContain('console.log("Resend verification');
    expect(src).not.toContain('console.log("Request new magic');
  });

  it("VerifyVariant redirects to signup or triggers resend", () => {
    // Should navigate user somewhere useful, not console.log
    expect(src).toMatch(/window\.location\.href|router\.push|href=.*\/auth\//);
  });
});

describe("F2: magic-link page has error handling", () => {
  const src = readPage("packages/dashboard/app/auth/magic-link/page.tsx");

  it("has onError handler on mutation", () => {
    expect(src).toContain("onError");
  });

  it("has error state and displays it", () => {
    expect(src).toContain("setError");
  });
});

describe("F3: forgot-password page has error handling", () => {
  const src = readPage("packages/dashboard/app/auth/forgot-password/page.tsx");

  it("has onError handler on mutation", () => {
    expect(src).toContain("onError");
  });

  it("has error state and displays it", () => {
    expect(src).toContain("setError");
  });
});

describe("F4: invite page has error handling", () => {
  const src = readPage("packages/dashboard/app/auth/invite/page.tsx");

  it("has onError handler for acceptInvite", () => {
    // Both mutations should have error handling
    const acceptSection = src.slice(src.indexOf("acceptInvite"), src.indexOf("declineInvite"));
    expect(acceptSection).toContain("onError");
  });

  it("has error state variable", () => {
    expect(src).toContain("setError");
  });
});

describe("F5: 2FA and backup pages handle create-session failure", () => {
  const twoFASrc = readPage("packages/dashboard/app/auth/2fa/page.tsx");
  const backupSrc = readPage("packages/dashboard/app/auth/2fa/backup/page.tsx");

  it("2FA page handles !res.ok from create-session", () => {
    // Should have else clause after res.ok check
    const onSuccessSection = twoFASrc.slice(
      twoFASrc.indexOf("onSuccess:"),
      twoFASrc.indexOf("onError:")
    );
    expect(onSuccessSection).toContain("setError");
  });

  it("backup page handles !res.ok from create-session", () => {
    const onSuccessSection = backupSrc.slice(
      backupSrc.indexOf("onSuccess:"),
      backupSrc.indexOf("onError:")
    );
    expect(onSuccessSection).toContain("setError");
  });
});

describe("F6: check-inbox handles verification resend (not just reset)", () => {
  const src = readPage("packages/dashboard/app/auth/check-inbox/page.tsx");

  it("uses resendVerification mutation for verify type", () => {
    expect(src).toContain("resendVerification");
  });

  it("resend onResend handles both reset and verify types", () => {
    // Should not only check type === "reset"
    expect(src).toContain('type === "verify"');
  });
});
