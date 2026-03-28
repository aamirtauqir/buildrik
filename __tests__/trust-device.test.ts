import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { signTrustDevice, verifyTrustDevice, parseTrustDeviceCookie, TRUST_DEVICE_COOKIE } from "@/server/services/trust-device.service";

// Ensure NEXTAUTH_SECRET is set for signing tests
beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-at-least-32-chars-long!!";
});
afterEach(() => {
  delete process.env.NEXTAUTH_SECRET;
});

// --- Source files for structural tests ---
const createSessionSrc = readFileSync(
  path.resolve(__dirname, "../app/api/auth/create-session/route.ts"),
  "utf-8"
);
const twoFASrc = readFileSync(
  path.resolve(__dirname, "../app/auth/2fa/page.tsx"),
  "utf-8"
);
const backupSrc = readFileSync(
  path.resolve(__dirname, "../app/auth/2fa/backup/page.tsx"),
  "utf-8"
);
const authRouterSrc = readFileSync(
  path.resolve(__dirname, "../server/trpc/routers/auth.ts"),
  "utf-8"
);
const accountServiceSrc = readFileSync(
  path.resolve(__dirname, "../server/services/account.service.ts"),
  "utf-8"
);

// ============================================================
// signTrustDevice / verifyTrustDevice unit tests
// ============================================================

describe("trust-device: signTrustDevice produces a verifiable token", () => {
  it("valid cookie verifies for the same userId", () => {
    const cookie = signTrustDevice("user-123");
    expect(verifyTrustDevice("user-123", cookie, null)).toBe(true);
  });

  it("rejects a cookie signed for a different userId", () => {
    const cookie = signTrustDevice("user-123");
    expect(verifyTrustDevice("user-999", cookie, null)).toBe(false);
  });

  it("rejects a tampered cookie value", () => {
    const cookie = signTrustDevice("user-123");
    const tampered = cookie.slice(0, -4) + "beef";
    expect(verifyTrustDevice("user-123", tampered, null)).toBe(false);
  });

  it("rejects null/undefined cookie", () => {
    expect(verifyTrustDevice("user-123", null, null)).toBe(false);
    expect(verifyTrustDevice("user-123", undefined, null)).toBe(false);
  });

  it("rejects a cookie issued before passwordChangedAt (auto-revoke on password change)", () => {
    const cookie = signTrustDevice("user-123");
    // passwordChangedAt = 1 second in the future from now
    const futureChange = new Date(Date.now() + 1000);
    expect(verifyTrustDevice("user-123", cookie, futureChange)).toBe(false);
  });

  it("accepts a cookie issued after passwordChangedAt", () => {
    const pastChange = new Date(Date.now() - 60 * 1000);
    const cookie = signTrustDevice("user-123");
    expect(verifyTrustDevice("user-123", cookie, pastChange)).toBe(true);
  });
});

describe("parseTrustDeviceCookie", () => {
  it("extracts the cookie value from a raw Cookie header", () => {
    const cookieValue = "user-1.1234567890.abc123";
    const header = `other=foo; ${TRUST_DEVICE_COOKIE}=${cookieValue}; another=bar`;
    expect(parseTrustDeviceCookie(header)).toBe(cookieValue);
  });

  it("returns null when the cookie is not present", () => {
    expect(parseTrustDeviceCookie("other=foo; another=bar")).toBeNull();
    expect(parseTrustDeviceCookie(null)).toBeNull();
    expect(parseTrustDeviceCookie(undefined)).toBeNull();
  });
});

// ============================================================
// Source analysis: create-session sets trust cookie
// ============================================================

describe("create-session: sets trust device cookie when trustDevice=true", () => {
  it("imports signTrustDevice and TRUST_DEVICE_COOKIE", () => {
    expect(createSessionSrc).toContain("signTrustDevice");
    expect(createSessionSrc).toContain("TRUST_DEVICE_COOKIE");
  });

  it("trustDevice field is in the Zod schema", () => {
    expect(createSessionSrc).toContain("trustDevice");
  });

  it("sets TRUST_DEVICE_COOKIE cookie with SameSite=strict and 30-day maxAge", () => {
    expect(createSessionSrc).toContain('sameSite: "strict"');
    expect(createSessionSrc).toContain("30 * 24 * 60 * 60");
  });
});

// ============================================================
// Source analysis: 2FA page auto-checks trust on mount
// ============================================================

describe("2FA page: checkTrustDevice mutation on mount", () => {
  it("imports checkTrustDevice via trpc.auth.checkTrustDevice", () => {
    expect(twoFASrc).toContain("checkTrustDevice");
  });

  it("calls checkTrustMutation on mount when token is present", () => {
    expect(twoFASrc).toContain("checkTrustMutation.mutate");
  });

  it("shows a loading spinner while checking trust", () => {
    expect(twoFASrc).toContain("checkingTrust");
    expect(twoFASrc).toContain("animate-spin");
  });

  it("renders the Trust this device checkbox", () => {
    expect(twoFASrc).toContain("Trust this device for 30 days");
    expect(twoFASrc).toContain("trustDevice");
  });

  it("passes trustDevice to createClientSession", () => {
    expect(twoFASrc).toContain("createClientSession(data.sessionToken, rememberMe, trustDevice)");
  });
});

// ============================================================
// Source analysis: backup page also passes trustDevice
// ============================================================

describe("backup code page: passes trustDevice to createClientSession", () => {
  it("renders the Trust this device checkbox", () => {
    expect(backupSrc).toContain("Trust this device for 30 days");
    expect(backupSrc).toContain("trustDevice");
  });

  it("passes trustDevice to createClientSession", () => {
    expect(backupSrc).toContain("createClientSession(data.sessionToken, rememberMe, trustDevice)");
  });
});

// ============================================================
// Source analysis: auth router checkTrustDevice mutation
// ============================================================

describe("auth router: checkTrustDevice mutation structure", () => {
  it("mutation is defined with strictRateLimit", () => {
    expect(authRouterSrc).toContain("checkTrustDevice: strictRateLimit");
  });

  it("reads the cookie from ctx.headers", () => {
    expect(authRouterSrc).toContain('ctx.headers?.get("cookie")');
    expect(authRouterSrc).toContain("parseTrustDeviceCookie");
  });

  it("validates trust and returns sessionToken if trusted", () => {
    const checkStart = authRouterSrc.indexOf("checkTrustDevice:");
    const checkSection = authRouterSrc.slice(checkStart, checkStart + 1200);
    expect(checkSection).toContain("verifyTrustDevice");
    expect(checkSection).toContain("sessionToken");
    expect(checkSection).toContain("trusted: true");
    expect(checkSection).toContain("trusted: false");
  });

  it("invalidates the 2fa_temp token when device is trusted (prevents replay)", () => {
    const checkStart = authRouterSrc.indexOf("checkTrustDevice:");
    const checkSection = authRouterSrc.slice(checkStart, checkStart + 1200);
    expect(checkSection).toContain("invalidateToken");
  });
});

// ============================================================
// Source analysis: changePassword stamps passwordChangedAt
// ============================================================

describe("changePassword: stamps passwordChangedAt for auto-revocation", () => {
  it("sets passwordChangedAt: new Date() in the prisma update", () => {
    const changePassStart = accountServiceSrc.indexOf("export async function changePassword(");
    const changePassSection = accountServiceSrc.slice(changePassStart, changePassStart + 600);
    expect(changePassSection).toContain("passwordChangedAt: new Date()");
  });
});
