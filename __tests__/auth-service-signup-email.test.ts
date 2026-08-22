/**
 * What happens when the verification email does not go out.
 *
 * signup() swallowed the send failure in an empty catch: the account was
 * created, the router answered "Verification email sent", and the page told the
 * user to check an inbox nothing was ever sent to. The resend button behind it
 * swallowed the same way. Nobody saw an error — not the user, not an operator,
 * because there was no log line either.
 *
 * This is not hypothetical here. Production SMTP has broken before in exactly
 * this repo: a `$` in SMTP_PASS was eaten by the cPanel shell and every send
 * 535'd while dev worked fine. `SMTP_PASS_B64` exists because of it. Under that
 * failure, every signup dead-ends invisibly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendVerificationEmail = vi.fn();
const logAuditEvent = vi.fn();
const userFindUnique = vi.fn();
const userCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
    },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        user: { create: (...a: unknown[]) => userCreate(...a) },
        // createWorkspaceForUser lives in this same service, so the whole
        // workspace/member/onboarding chain runs for real against the tx.
        workspace: {
          deleteMany: vi.fn(),
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "ws_1" }),
        },
        workspaceMember: { create: vi.fn() },
        onboardingState: { create: vi.fn() },
        verificationToken: { deleteMany: vi.fn() },
      }),
  },
}));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }));
vi.mock("@/server/services/token.service", () => ({
  generateToken: vi.fn().mockResolvedValue("tok"),
  validateToken: vi.fn(),
  invalidateToken: vi.fn(),
}));
vi.mock("@/server/services/rate-limit.service", () => ({
  isAccountLocked: vi.fn(), incrementFailedAttempts: vi.fn(), resetFailedAttempts: vi.fn(),
}));
vi.mock("@/server/services/email.service", () => ({
  sendVerificationEmail: (...a: unknown[]) => sendVerificationEmail(...a),
  sendPasswordResetEmail: vi.fn(), sendOAuthOnlyLoginEmail: vi.fn(), sendMagicLinkEmail: vi.fn(),
}));
vi.mock("@/server/services/audit.service", () => ({
  logAuditEvent: (...a: unknown[]) => logAuditEvent(...a),
}));

import { signup } from "@/server/services/auth.service";

beforeEach(() => {
  vi.clearAllMocks();
  userFindUnique.mockResolvedValue(null);
  userCreate.mockResolvedValue({ id: "u_1", email: "a@b.com" });
  sendVerificationEmail.mockResolvedValue(undefined);
});

describe("signup() when the verification email fails", () => {
  it("says the mail went out when it did", async () => {
    const r = await signup("A", "a@b.com", "pw");
    expect(r.verificationEmailSent).toBe(true);
  });

  it("does not claim the mail went out when the send threw", async () => {
    sendVerificationEmail.mockRejectedValue(new Error("535 auth failure"));
    const r = await signup("A", "a@b.com", "pw");
    expect(r.verificationEmailSent).toBe(false);
  });

  it("leaves an operator a trace instead of an empty catch", async () => {
    sendVerificationEmail.mockRejectedValue(new Error("535 auth failure"));
    await signup("A", "a@b.com", "pw");
    expect(logAuditEvent).toHaveBeenCalledWith(
      "VERIFICATION_EMAIL_FAILED",
      "failure",
      expect.objectContaining({ email: "a@b.com" }),
    );
  });

  it("still creates the account — the user exists and can resend", async () => {
    sendVerificationEmail.mockRejectedValue(new Error("535 auth failure"));
    const r = await signup("A", "a@b.com", "pw");
    expect(r.user.id).toBe("u_1");
  });
});
