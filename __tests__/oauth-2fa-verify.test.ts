import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticator } from "otplib";

// A Google/GitHub login into a 2FA account hands the browser the same
// `2fa_temp` ticket a password login does (server/auth.config.ts signIn), and
// finishes through the same auth.verify2FA → session_grant → create-session
// chain. These pin that chain's refusals, which the OAuth gate relies on.

const { mockPrisma, mockValidateToken, mockInvalidateToken, mockGenerateToken, mockCheckRateLimit } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
    verificationToken: { count: vi.fn(), create: vi.fn() },
  },
  mockValidateToken: vi.fn(),
  mockInvalidateToken: vi.fn(),
  mockGenerateToken: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/token.service", () => ({
  validateToken: mockValidateToken,
  invalidateToken: mockInvalidateToken,
  generateToken: mockGenerateToken,
}));
vi.mock("@/server/services/audit.service", () => ({ logAuditEvent: vi.fn() }));
vi.mock("@/server/services/email.service", () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendOAuthOnlyLoginEmail: vi.fn(),
  sendMagicLinkEmail: vi.fn(),
}));
vi.mock("@/server/services/rate-limiter", () => ({ checkRateLimit: mockCheckRateLimit }));

import { verify2FA } from "@/server/services/auth.service";
import { authRouter } from "@server/trpc/routers/auth";

const SECRET = authenticator.generateSecret();
const USER = { id: "oauth-2fa-user", email: "o@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mockValidateToken.mockResolvedValue(USER.id);
  mockPrisma.verificationToken.count.mockResolvedValue(0);
  mockPrisma.user.findUnique.mockResolvedValue({ twoFactorSecret: SECRET });
  mockPrisma.user.findUniqueOrThrow.mockResolvedValue(USER);
  mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 1000 });
  mockGenerateToken.mockResolvedValue("grant-token");
});

describe("verify2FA — the step an OAuth 2FA login stops at", () => {
  it("accepts the current TOTP and spends the ticket", async () => {
    const user = await verify2FA("ticket", authenticator.generate(SECRET));
    expect(user).toEqual(USER);
    expect(mockInvalidateToken).toHaveBeenCalledWith("ticket");
  });

  it("refuses a wrong code, records the failure and keeps no session", async () => {
    const wrong = authenticator.generate(SECRET) === "000000" ? "111111" : "000000";
    await expect(verify2FA("ticket", wrong)).rejects.toMatchObject({ code: "INVALID_2FA_CODE" });
    expect(mockPrisma.verificationToken.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "2fa_attempt" }) }),
    );
    expect(mockPrisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("refuses an expired or already-spent ticket, even with the right code", async () => {
    mockValidateToken.mockResolvedValue(null);
    await expect(verify2FA("ticket", authenticator.generate(SECRET))).rejects.toMatchObject({
      code: "INVALID_2FA_CODE",
    });
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("locks the ticket after 5 failures, even when the 6th code is right", async () => {
    mockPrisma.verificationToken.count.mockResolvedValue(5);
    await expect(verify2FA("ticket", authenticator.generate(SECRET))).rejects.toMatchObject({ code: "2FA_LOCKED" });
    expect(mockInvalidateToken).toHaveBeenCalledWith("ticket");
  });
});

describe("auth.verify2FA router — the same rate limit for every login method", () => {
  const caller = () =>
    authRouter.createCaller({
      prisma: mockPrisma,
      session: null,
      bearer: null,
      headers: new Headers({ "x-forwarded-for": "203.0.113.9" }),
    } as never);
  const ticket = "8f14e45f-ceea-467a-9575-2b1b0f8f0e01";

  it("is keyed per IP + procedure, at 5 per 15 minutes", async () => {
    await caller().verify2FA({ twoFactorToken: ticket, code: authenticator.generate(SECRET) });
    expect(mockCheckRateLimit).toHaveBeenCalledWith("203.0.113.9:verify2FA", 5, 15 * 60 * 1000);
  });

  it("refuses with TOO_MANY_REQUESTS before checking the code once the limit is spent", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 1000 });
    await expect(
      caller().verify2FA({ twoFactorToken: ticket, code: authenticator.generate(SECRET) }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mockValidateToken).not.toHaveBeenCalled();
  });

  it("returns a session grant only after a correct code", async () => {
    const res = await caller().verify2FA({ twoFactorToken: ticket, code: authenticator.generate(SECRET) });
    expect(res).toMatchObject({ success: true, sessionToken: "grant-token" });
    expect(mockGenerateToken).toHaveBeenCalledWith("session_grant", USER.id, 5);
  });
});
