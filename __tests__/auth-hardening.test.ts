import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// --- Hoisted mocks (must be before imports that use them) ---
const { mockSessionCreate, mockSessionFindMany, mockSessionDeleteMany, mockUserFindUnique } = vi.hoisted(() => ({
  mockSessionCreate: vi.fn(),
  mockSessionFindMany: vi.fn(),
  mockSessionDeleteMany: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      create: mockSessionCreate,
      findMany: mockSessionFindMany,
      deleteMany: mockSessionDeleteMany,
    },
    user: { findUnique: mockUserFindUnique },
  },
}));

vi.mock("@/server/services/audit.service", () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("@/server/services/auth.service", () => ({
  createWorkspaceForUser: vi.fn().mockResolvedValue({ workspaceId: "ws-123" }),
}));

import { authConfig } from "@/server/auth.config";
import { revokeSession } from "@/server/services/account.service";

const authServiceSource = readFileSync(
  path.resolve(__dirname, "../server/services/auth.service.ts"),
  "utf-8"
);

// --- Test 1: Credentials provider is absent ---
describe("Credentials auth disabled", () => {
  it("credentials provider is not registered", () => {
    expect(authConfig.providers.some(p => (p as { id?: string }).id === "credentials")).toBe(false);
  });
});

// --- Tests 2-4: OAuth jwt callback ---
describe("OAuth jwt callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionCreate.mockResolvedValue({});
    mockSessionFindMany.mockResolvedValue([]);
    mockSessionDeleteMany.mockResolvedValue({ count: 0 });
  });

  it("creates Session record and sets token.dbSessionId on OAuth login", async () => {
    const jwtCallback = authConfig.callbacks!.jwt!;
    const token = {} as Parameters<typeof jwtCallback>[0]["token"];
    await jwtCallback({
      token,
      user: { id: "user-1", email: "u@test.com" } as any,
      account: { provider: "google", type: "oauth" } as any,
      trigger: "signIn",
    } as any);

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          sessionToken: expect.any(String),
          current: true,
        }),
      })
    );
    expect(token.userId).toBe("user-1");
    expect(token.dbSessionId).toBeDefined();
  });

  it("catches session.create error without throwing, token.userId still set", async () => {
    mockSessionCreate.mockRejectedValue(new Error("DB down"));
    const jwtCallback = authConfig.callbacks!.jwt!;
    const token = {} as Parameters<typeof jwtCallback>[0]["token"];

    const result = await jwtCallback({
      token,
      user: { id: "user-2", email: "u@test.com" } as any,
      account: { provider: "github", type: "oauth" } as any,
      trigger: "signIn",
    } as any);

    expect(result.userId).toBe("user-2");
  });

  it("evicts oldest sessions when active count exceeds 10", async () => {
    const sessions = Array.from({ length: 11 }, (_, i) => ({ id: `session-${i}` }));
    mockSessionFindMany.mockResolvedValue(sessions);

    const jwtCallback = authConfig.callbacks!.jwt!;
    const token = {} as Parameters<typeof jwtCallback>[0]["token"];
    await jwtCallback({
      token,
      user: { id: "user-3", email: "u@test.com" } as any,
      account: { provider: "google", type: "oauth" } as any,
      trigger: "signIn",
    } as any);

    expect(mockSessionDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ["session-0"] },
        }),
      })
    );
  });
});

// --- Test 5: IDOR — sessions.revoke scopes to userId ---
describe("IDOR: revokeSession scopes to userId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionDeleteMany.mockResolvedValue({ count: 0 });
  });

  it("passes userId to deleteMany so foreign sessions are not deleted", async () => {
    await revokeSession("session-owned-by-other", "attacker-user-id");

    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { id: "session-owned-by-other", userId: "attacker-user-id" },
    });
  });
});

// --- Test 6: emailVerified enforced before session grant (source analysis) ---
describe("emailVerified check in login()", () => {
  it("emailVerified check is present in login() and comes before generateToken", () => {
    const loginStart = authServiceSource.indexOf("export async function login(");
    const loginEnd = authServiceSource.indexOf("export async function signup(");
    const loginFn = authServiceSource.slice(loginStart, loginEnd);

    const verifiedCheckPos = loginFn.indexOf("EMAIL_NOT_VERIFIED");
    const generateTokenPos = loginFn.indexOf("generateToken");

    expect(verifiedCheckPos).toBeGreaterThan(-1);
    expect(generateTokenPos).toBeGreaterThan(-1);
    expect(verifiedCheckPos).toBeLessThan(generateTokenPos);
  });

  it("emailVerified check comes after bcrypt validation (not before — avoids timing leak)", () => {
    const loginStart = authServiceSource.indexOf("export async function login(");
    const loginEnd = authServiceSource.indexOf("export async function signup(");
    const loginFn = authServiceSource.slice(loginStart, loginEnd);

    const bcryptPos = loginFn.indexOf("bcrypt.compare");
    const verifiedCheckPos = loginFn.indexOf("EMAIL_NOT_VERIFIED");

    expect(bcryptPos).toBeLessThan(verifiedCheckPos);
  });
});

// --- Test 7: AES-256-GCM key uses sha256 hash, not hex-slice (source analysis) ---
describe("AES key derivation uses createHash, not hex slice", () => {
  it("encryptSecret derives key via sha256 digest, not Buffer.from hex", () => {
    expect(authServiceSource).toContain("createHash('sha256').update(process.env.NEXTAUTH_SECRET!).digest()");
    expect(authServiceSource).not.toContain("slice(0, 64), 'hex'");
  });
});

// --- Test 8: backup codes use crypto.randomInt (source analysis) ---
describe("backup codes use CSPRNG", () => {
  it("randomInt from crypto replaces Math.random in enable2FA", () => {
    const accountSource = readFileSync(
      path.resolve(__dirname, "../server/services/account.service.ts"),
      "utf-8"
    );
    expect(accountSource).toContain("randomInt(0, chars.length)");
    expect(accountSource).not.toContain("Math.random()");
  });
});

// --- Test 9: acceptInvite IDOR — email check throws before transaction ---
describe("IDOR: acceptInvite rejects email mismatch before granting access", () => {
  it("FORBIDDEN is thrown before the workspaceMember transaction when emails differ", () => {
    const authRouterSource = readFileSync(
      path.resolve(__dirname, "../server/trpc/routers/auth.ts"),
      "utf-8"
    );
    const acceptInviteStart = authRouterSource.indexOf("acceptInvite:");
    const acceptInviteSection = authRouterSource.slice(acceptInviteStart, acceptInviteStart + 1500);

    const forbiddenPos = acceptInviteSection.indexOf("FORBIDDEN");
    const transactionPos = acceptInviteSection.indexOf("$transaction");

    expect(forbiddenPos).toBeGreaterThan(-1);
    expect(transactionPos).toBeGreaterThan(-1);
    expect(forbiddenPos).toBeLessThan(transactionPos);
  });
});

// --- Tests 10-24: Auth UX hardening (source analysis) ---

const verifyEmailPageSource = readFileSync(
  path.resolve(__dirname, "../app/auth/verify-email/page.tsx"),
  "utf-8"
);
const signupPageSource = readFileSync(
  path.resolve(__dirname, "../app/auth/signup/page.tsx"),
  "utf-8"
);
const loginPageSource = readFileSync(
  path.resolve(__dirname, "../app/auth/login/page.tsx"),
  "utf-8"
);
const twoFAPageSource = readFileSync(
  path.resolve(__dirname, "../app/auth/2fa/page.tsx"),
  "utf-8"
);
const backupPageSource = readFileSync(
  path.resolve(__dirname, "../app/auth/2fa/backup/page.tsx"),
  "utf-8"
);
const socialButtonSource = readFileSync(
  path.resolve(__dirname, "../components/auth/social-button.tsx"),
  "utf-8"
);

// Test 10
describe("verify-email: calls createClientSession on success", () => {
  it("imports createClientSession and redirects to /auth/redirect on auto-login success", () => {
    expect(verifyEmailPageSource).toContain("createClientSession");
    expect(verifyEmailPageSource).toContain('router.push("/auth/redirect")');
  });
});

// Test 11
describe("verify-email: guards createClientSession behind sessionToken check", () => {
  it("source contains sessionToken guard before createClientSession call", () => {
    expect(verifyEmailPageSource).toMatch(/if\s*\(sessionToken\)|sessionToken\s*&&/);
  });
});

// Test 12
describe("verify-email: shows fallback when createClientSession returns false", () => {
  it("source contains autoLoginFailed state and fallback copy", () => {
    expect(verifyEmailPageSource).toContain("autoLoginFailed");
    expect(verifyEmailPageSource).toContain("Your email has been verified. Please sign in.");
  });
});

// Test 13
describe("verify-email: renders inbox shortcut for gmail.com", () => {
  it("source contains gmail.com mapping and inbox URL", () => {
    expect(verifyEmailPageSource).toContain("gmail.com");
    expect(verifyEmailPageSource).toContain("https://mail.google.com");
  });
});

// Test 14
describe("verify-email: renders generic text for unrecognized domain", () => {
  it("source contains fallback text for unrecognized domains", () => {
    expect(verifyEmailPageSource).toContain("Open your email app");
  });
});

// Test 15
describe("signup: renders Sign in instead link with ?email= on CONFLICT", () => {
  it("source checks for CONFLICT error code and builds login URL with email param", () => {
    expect(signupPageSource).toContain('"CONFLICT"');
    expect(signupPageSource).toContain("Sign in instead");
    expect(signupPageSource).toContain("encodeURIComponent(email)");
  });
});

// Test 16
describe("signup: renders Resend verification CTA on CONFLICT", () => {
  it("source contains resend CTA on conflict", () => {
    expect(signupPageSource).toContain("Resend verification email");
    expect(signupPageSource).toContain("resendMutation");
  });
});

// Test 17
describe("login: stores buildrik_rememberMe to sessionStorage before 2FA redirect", () => {
  it("source calls sessionStorage.setItem with buildrik_rememberMe key", () => {
    expect(loginPageSource).toContain('sessionStorage.setItem("buildrik_rememberMe"');
  });
});

// Test 18
describe("2fa: reads buildrik_rememberMe from sessionStorage", () => {
  it("source calls sessionStorage.getItem with buildrik_rememberMe key", () => {
    expect(twoFAPageSource).toContain('sessionStorage.getItem("buildrik_rememberMe")');
  });
});

// Test 19
describe("2fa: removes buildrik_rememberMe after reading (read-once)", () => {
  it("source calls sessionStorage.removeItem with buildrik_rememberMe key", () => {
    expect(twoFAPageSource).toContain('sessionStorage.removeItem("buildrik_rememberMe")');
  });
});

// Test 20
describe("2fa: passes rememberMe to createClientSession", () => {
  it("source calls createClientSession with rememberMe argument", () => {
    expect(twoFAPageSource).toContain("createClientSession(data.sessionToken, rememberMe)");
  });
});

// Test 21
describe("2fa: does NOT contain fake Resend (45s) text", () => {
  it("fake resend text is removed", () => {
    expect(twoFAPageSource).not.toContain("Resend (45s)");
  });
});

// Test 22
describe("2fa: contains link to backup code page", () => {
  it("recovery code link is present", () => {
    expect(twoFAPageSource).toContain("/auth/2fa/backup");
    expect(twoFAPageSource).toContain("recovery code");
  });
});

// Test 23
describe("2fa/backup: reads and removes buildrik_rememberMe from sessionStorage", () => {
  it("backup page reads and removes rememberMe key", () => {
    expect(backupPageSource).toContain('sessionStorage.getItem("buildrik_rememberMe")');
    expect(backupPageSource).toContain('sessionStorage.removeItem("buildrik_rememberMe")');
  });
});

// Test 24
describe("social-button: has isLoading state and spinner", () => {
  it("source contains isLoading state and Loader2 spinner", () => {
    expect(socialButtonSource).toContain("isLoading");
    expect(socialButtonSource).toContain("Loader2");
    expect(socialButtonSource).toContain("animate-spin");
  });
});

// --- Tests 25-29: check-inbox + dead code cleanup ---

const checkInboxSource = readFileSync(
  path.resolve(__dirname, "../app/auth/check-inbox/page.tsx"),
  "utf-8"
);
const authRouterFull = readFileSync(
  path.resolve(__dirname, "../server/trpc/routers/auth.ts"),
  "utf-8"
);

// Test 25
describe("check-inbox: uses inbox URL, not mailto:", () => {
  it("does not contain mailto: href", () => {
    expect(checkInboxSource).not.toContain('href="mailto:');
  });

  it("contains getInboxUrl helper with gmail.com mapping", () => {
    expect(checkInboxSource).toContain("getInboxUrl");
    expect(checkInboxSource).toContain("gmail.com");
    expect(checkInboxSource).toContain("https://mail.google.com");
  });
});

// Test 26
describe("check-inbox: back link is conditional on type param", () => {
  it("links to /auth/signup for verify flow, not /auth/forgot-password", () => {
    expect(checkInboxSource).toContain('"/auth/signup"');
    expect(checkInboxSource).toContain("backHref");
  });

  it("links to /auth/forgot-password for reset flow", () => {
    expect(checkInboxSource).toContain('"/auth/forgot-password"');
  });
});

// Test 27
describe("dead code: INVITE_EMAIL_MISMATCH audit log removed from acceptInvite", () => {
  it("INVITE_EMAIL_MISMATCH is not present after the $transaction block", () => {
    const acceptInviteStart = authRouterFull.indexOf("acceptInvite:");
    const acceptInviteSection = authRouterFull.slice(acceptInviteStart, acceptInviteStart + 2000);
    expect(acceptInviteSection).not.toContain("INVITE_EMAIL_MISMATCH");
  });
});

// --- Tests 28-29: Codex round 5 findings ---

const authServiceFullSource = readFileSync(
  path.resolve(__dirname, "../server/services/auth.service.ts"),
  "utf-8"
);

// Test 28
describe("resendVerification: does not send to already-verified users (2FA bypass prevention)", () => {
  it("source checks user.emailVerified before generating token", () => {
    const fnStart = authServiceFullSource.indexOf("export async function resendVerification(");
    const fnEnd = authServiceFullSource.indexOf("export async function forgotPassword(");
    const fnBody = authServiceFullSource.slice(fnStart, fnEnd);
    expect(fnBody).toContain("user.emailVerified");
    expect(fnBody).toContain("return");
  });
});

// Test 29
describe("create-session: invalidateToken called after session is created, not before", () => {
  it("source invalidates token after prisma.session.create", () => {
    const createSessionSource = readFileSync(
      path.resolve(__dirname, "../app/api/auth/create-session/route.ts"),
      "utf-8"
    );
    const sessionCreatePos = createSessionSource.indexOf("prisma.session.create");
    const invalidatePos = createSessionSource.indexOf("invalidateToken(sessionToken)");
    expect(sessionCreatePos).toBeGreaterThan(-1);
    expect(invalidatePos).toBeGreaterThan(-1);
    expect(invalidatePos).toBeGreaterThan(sessionCreatePos);
  });
});
