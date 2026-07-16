import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * forgotPassword branches on whether the account has a password.
 *
 * A social account has none, so a "reset your password" email would be a lie and
 * would loop the user on a login screen that only ever says "Incorrect email or
 * password" (that screen can't say more without leaking how any address signs
 * in). The branch sends a different email — reaching only the mailbox owner —
 * that names the provider and still offers a real "set a password" link.
 */

const userFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: (...a: unknown[]) => userFindUnique(...a) } },
}));

const generateToken = vi.fn();
vi.mock("@server/services/token.service", () => ({
  generateToken: (...a: unknown[]) => generateToken(...a),
  validateToken: vi.fn(),
  invalidateToken: vi.fn(),
}));

const sendPasswordResetEmail = vi.fn();
const sendOAuthOnlyLoginEmail = vi.fn();
vi.mock("@server/services/email.service", () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: (...a: unknown[]) => sendPasswordResetEmail(...a),
  sendOAuthOnlyLoginEmail: (...a: unknown[]) => sendOAuthOnlyLoginEmail(...a),
  sendMagicLinkEmail: vi.fn(),
}));

const logAuditEvent = vi.fn();
vi.mock("@server/services/audit.service", () => ({
  logAuditEvent: (...a: unknown[]) => logAuditEvent(...a),
}));

import { forgotPassword } from "@server/services/auth.service";

beforeEach(() => {
  vi.clearAllMocks();
  generateToken.mockResolvedValue("tok_123");
});

describe("forgotPassword", () => {
  it("stays silent for an unknown email (no enumeration)", async () => {
    userFindUnique.mockResolvedValue(null);
    await forgotPassword("nobody@example.com");
    expect(generateToken).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(sendOAuthOnlyLoginEmail).not.toHaveBeenCalled();
  });

  it("sends the reset email for a password account", async () => {
    userFindUnique.mockResolvedValue({
      id: "u1",
      passwordHash: "$2b$10$hash",
      accounts: [],
    });
    await forgotPassword("has-password@example.com");
    expect(sendPasswordResetEmail).toHaveBeenCalledWith("has-password@example.com", "tok_123");
    expect(sendOAuthOnlyLoginEmail).not.toHaveBeenCalled();
    expect(logAuditEvent).toHaveBeenCalledWith("PASSWORD_RESET_REQUESTED", "success", {
      email: "has-password@example.com",
    });
  });

  it("sends the provider email, with the linked providers, for a social account", async () => {
    userFindUnique.mockResolvedValue({
      id: "u2",
      passwordHash: null,
      accounts: [{ provider: "google" }, { provider: "github" }],
    });
    await forgotPassword("oauth@example.com");

    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(sendOAuthOnlyLoginEmail).toHaveBeenCalledWith(
      "oauth@example.com",
      ["google", "github"],
      "tok_123",
    );
    expect(logAuditEvent).toHaveBeenCalledWith("PASSWORD_RESET_OAUTH_ONLY", "success", {
      email: "oauth@example.com",
    });
  });

  it("still mints a token for the social account, so 'set a password' works", async () => {
    userFindUnique.mockResolvedValue({ id: "u3", passwordHash: null, accounts: [{ provider: "google" }] });
    await forgotPassword("oauth@example.com");
    expect(generateToken).toHaveBeenCalledWith("password_reset", "u3", 60);
  });
});
