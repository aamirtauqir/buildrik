import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

// Mock next/headers cookies — default: no buildrik_link_token present (normal login flow)
const mockCookieStore = {
  get: vi.fn().mockReturnValue(undefined),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Transaction-client mock (used inside $transaction callback)
const txAccountUpsert = vi.fn();
const txUserCreate = vi.fn();
const txClient = {
  user: { create: txUserCreate },
  account: { upsert: txAccountUpsert },
  workspace: { create: vi.fn() },
  workspaceMember: { create: vi.fn() },
};

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    verificationToken: {
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
  },
}));

// Mock audit service
vi.mock("@/server/services/audit.service", () => ({
  logAuditEvent: vi.fn(),
}));

// Mock createWorkspaceForUser (called inside transaction in signIn callback)
vi.mock("@/server/services/auth.service", () => ({
  createWorkspaceForUser: vi.fn().mockResolvedValue({ workspaceId: "ws-123" }),
}));

import { authConfig } from "@/server/auth.config";
import { prisma } from "@/lib/prisma";

const mockPrisma = vi.mocked(prisma);

// Convenience: build the signIn args
function makeSignInArgs(overrides: {
  userId?: string;
  email?: string;
  provider?: string;
  providerAccountId?: string;
  emailVerified?: boolean | undefined;
} = {}) {
  const {
    userId = "provider-id",
    email = "oauth@example.com",
    provider = "google",
    providerAccountId = "google-123",
    emailVerified,
  } = overrides;
  return {
    user: { id: userId, email, name: "OAuth User" } as any,
    account: { provider, type: "oauth", providerAccountId } as any,
    profile: emailVerified !== undefined ? { email_verified: emailVerified } : {} as any,
    credentials: undefined as any,
  } as any;
}

describe("OAuth signIn callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing Account record (falls through to email lookup)
    mockPrisma.account.findFirst.mockResolvedValue(null);
    // Default: upsert resolves cleanly
    mockPrisma.account.upsert.mockResolvedValue({} as any);
    txAccountUpsert.mockResolvedValue({});
    // Default: no link_token cookie present (normal login, not linking flow)
    mockCookieStore.get.mockReturnValue(undefined);
    mockCookieStore.delete.mockReset();
  });

  it("should have a signIn callback defined", () => {
    expect(authConfig.callbacks?.signIn).toBeDefined();
  });

  it("credentials provider is absent from authConfig.providers", () => {
    expect(authConfig.providers.some(p => (p as { id?: string }).id === "credentials")).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // email_verified guard
  // ---------------------------------------------------------------------------

  it("rejects sign-in when email_verified is explicitly false", async () => {
    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback(makeSignInArgs({ emailVerified: false }));
    expect(result).toBe(false);
    expect(mockPrisma.account.findFirst).not.toHaveBeenCalled();
  });

  it("proceeds normally when email_verified is undefined (GitHub omits it)", async () => {
    // GitHub: profile has no email_verified field at all
    mockPrisma.account.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // email lookup → new user
      .mockResolvedValueOnce({ twoFactorEnabled: false }); // 2FA check
    txUserCreate.mockResolvedValue({
      id: "new-id",
      email: "github@example.com",
      fullName: "GitHub User",
    });

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "temp", email: "github@example.com", name: "GitHub User" } as any,
      account: { provider: "github", type: "oauth", providerAccountId: "gh-999" } as any,
      profile: {} as any, // no email_verified field
      credentials: undefined as any,
    } as any);

    expect(typeof result).toBe("string");
    expect(result as string).toMatch(/^\/auth\/oauth-redirect\?token=/);
  });

  // ---------------------------------------------------------------------------
  // Account-first path
  // ---------------------------------------------------------------------------

  it("uses account.userId when Account record found (Account-first)", async () => {
    mockPrisma.account.findFirst.mockResolvedValue({
      userId: "db-user-from-account",
      provider: "google",
      providerAccountId: "google-123",
    } as any);
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ emailVerified: new Date("2025-01-01") }) // accountUser fetch
      .mockResolvedValueOnce({ twoFactorEnabled: false }); // 2FA check
    mockPrisma.user.update.mockResolvedValue({} as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "provider-id", email: "oauth@example.com", name: "OAuth User" } as any;
    await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "google-123" } as any,
      profile: {} as any,
      credentials: undefined as any,
    } as any);

    // Must use the DB userId from Account, not the provider ID
    expect(userObj.id).toBe("db-user-from-account");
    // Must NOT fall through to email lookup
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ email: expect.anything() }) })
    );
  });

  it("stamps emailVerified on Account-first path when user.emailVerified is null", async () => {
    mockPrisma.account.findFirst.mockResolvedValue({
      userId: "db-user-id",
      provider: "google",
      providerAccountId: "google-123",
    } as any);
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ emailVerified: null }) // accountUser fetch — unverified
      .mockResolvedValueOnce({ twoFactorEnabled: false }); // 2FA check
    mockPrisma.user.update.mockResolvedValue({} as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    await signInCallback({
      user: { id: "p", email: "oauth@example.com", name: "User" } as any,
      account: { provider: "google", type: "oauth", providerAccountId: "google-123" } as any,
      profile: {} as any,
      credentials: undefined as any,
    } as any);

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ emailVerified: expect.any(Date) }),
      })
    );
  });

  it("returns false on P2002 in Account-first path", async () => {
    mockPrisma.account.findFirst.mockResolvedValue({
      userId: "db-user-id",
      provider: "google",
      providerAccountId: "google-123",
    } as any);
    mockPrisma.user.findUnique.mockResolvedValueOnce({ emailVerified: new Date() });
    mockPrisma.user.update.mockResolvedValue({} as any);
    const p2002 = Object.assign(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "5.0.0",
      }),
      { code: "P2002" }
    );
    mockPrisma.account.upsert.mockRejectedValueOnce(p2002);

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "p", email: "oauth@example.com", name: "User" } as any,
      account: { provider: "google", type: "oauth", providerAccountId: "google-123" } as any,
      profile: {} as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // New user path (email fallback → create)
  // ---------------------------------------------------------------------------

  it("creates a new user and calls tx.account.upsert inside transaction", async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // email lookup → new user
      .mockResolvedValueOnce({ twoFactorEnabled: false }); // 2FA check
    txUserCreate.mockResolvedValue({
      id: "new-db-user-id",
      email: "oauth@example.com",
      fullName: "OAuth User",
    });

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp-provider-id", email: "oauth@example.com", name: "OAuth User" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "google-123" } as any,
      profile: {} as any,
      credentials: undefined as any,
    } as any);

    expect(typeof result).toBe("string");
    expect(result as string).toMatch(/^\/auth\/oauth-redirect\?token=/);
    expect(txUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "oauth@example.com",
          provider: "google",
          emailVerified: expect.any(Date),
        }),
      })
    );
    // Account upsert must run inside the transaction
    expect(txAccountUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          provider: "google",
          providerAccountId: "google-123",
        }),
      })
    );
    expect(userObj.id).toBe("new-db-user-id");
  });

  // ---------------------------------------------------------------------------
  // Existing user path (email fallback → update)
  // ---------------------------------------------------------------------------

  it("calls account.upsert on existing-user email-fallback path", async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: "existing-db-id", email: "oauth@example.com", emailVerified: new Date() } as any)
      .mockResolvedValueOnce({ twoFactorEnabled: false });
    mockPrisma.user.update.mockResolvedValue({} as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "provider-id", email: "oauth@example.com", name: "OAuth User" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "google-123" } as any,
      profile: {} as any,
      credentials: undefined as any,
    } as any);

    expect(typeof result).toBe("string");
    expect(result as string).toMatch(/^\/auth\/oauth-redirect\?token=/);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(userObj.id).toBe("existing-db-id");
    expect(mockPrisma.account.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: "existing-db-id",
          provider: "google",
          providerAccountId: "google-123",
        }),
        update: {},
      })
    );
  });

  it("stamps emailVerified on existing-user path when emailVerified is null", async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: "existing-id", email: "oauth@example.com", emailVerified: null } as any)
      .mockResolvedValueOnce({ twoFactorEnabled: false });
    mockPrisma.user.update.mockResolvedValue({} as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    await signInCallback(makeSignInArgs());

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ emailVerified: expect.any(Date) }),
      })
    );
  });

  it("returns false on P2002 in existing-user email-fallback path", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "existing-id",
      email: "oauth@example.com",
      emailVerified: new Date(),
    } as any);
    mockPrisma.user.update.mockResolvedValue({} as any);
    const p2002 = Object.assign(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "5.0.0",
      }),
      { code: "P2002" }
    );
    mockPrisma.account.upsert.mockRejectedValueOnce(p2002);

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback(makeSignInArgs());
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Phase 2b: link_token flow
// ---------------------------------------------------------------------------

import { validateToken, invalidateToken } from "@/server/services/token.service";

vi.mock("@/server/services/token.service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/server/services/token.service")>();
  return {
    ...original,
    generateToken: vi.fn().mockResolvedValue("mocked-token"),
    validateToken: vi.fn(),
    invalidateToken: vi.fn(),
  };
});

const mockValidateToken = vi.mocked(validateToken);
const mockInvalidateToken = vi.mocked(invalidateToken);

describe("Phase 2b: link_token linking flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.get.mockReturnValue(undefined);
    mockCookieStore.delete.mockReset();
    mockPrisma.account.upsert.mockResolvedValue({} as any);
    mockInvalidateToken.mockResolvedValue(undefined);
  });

  function withLinkToken(token: string) {
    mockCookieStore.get.mockImplementation((name: string) =>
      name === "buildrik_link_token" ? { value: token } : undefined
    );
  }

  it("links account when link_token is valid and emails match", async () => {
    withLinkToken("valid-link-token");
    mockValidateToken.mockResolvedValue("owner-user-id");
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "owner-user-id",
      email: "oauth@example.com",
    } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback(makeSignInArgs({ email: "oauth@example.com" }));

    expect(result).toBe("/dashboard/settings/account?linked=google");
    expect(mockPrisma.account.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: "owner-user-id",
          provider: "google",
        }),
      })
    );
    expect(mockInvalidateToken).toHaveBeenCalledWith("valid-link-token");
    expect(mockCookieStore.delete).toHaveBeenCalledWith("buildrik_link_token");
  });

  it("redirects to error when link_token is invalid or expired", async () => {
    withLinkToken("bad-token");
    mockValidateToken.mockResolvedValue(null);

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback(makeSignInArgs());

    expect(result).toBe("/dashboard/settings/account?link_error=invalid_token");
    expect(mockPrisma.account.upsert).not.toHaveBeenCalled();
  });

  it("redirects to error when provider email mismatches Buildrik account", async () => {
    withLinkToken("valid-token");
    mockValidateToken.mockResolvedValue("owner-user-id");
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "owner-user-id",
      email: "different@example.com", // different from OAuth email
    } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback(makeSignInArgs({ email: "oauth@example.com" }));

    expect(result).toBe("/dashboard/settings/account?link_error=email_mismatch");
    expect(mockPrisma.account.upsert).not.toHaveBeenCalled();
  });

  it("redirects to error when email_verified is false in link flow", async () => {
    withLinkToken("valid-token");

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback(makeSignInArgs({ emailVerified: false }));

    expect(result).toBe("/dashboard/settings/account?link_error=email_not_verified");
    expect(mockValidateToken).not.toHaveBeenCalled();
  });

  it("redirects to already_linked error on P2002 in link flow", async () => {
    withLinkToken("valid-token");
    mockValidateToken.mockResolvedValue("owner-user-id");
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "owner-user-id",
      email: "oauth@example.com",
    } as any);
    const p2002 = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "5.0.0",
    });
    mockPrisma.account.upsert.mockRejectedValueOnce(p2002);

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback(makeSignInArgs({ email: "oauth@example.com" }));

    expect(result).toBe("/dashboard/settings/account?link_error=already_linked");
  });

  it("does NOT create a session when link_token is present (fail-closed)", async () => {
    withLinkToken("valid-token");
    mockValidateToken.mockResolvedValue("owner-user-id");
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "owner-user-id",
      email: "oauth@example.com",
    } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback(makeSignInArgs({ email: "oauth@example.com" }));

    // Result must be a settings redirect, never a session_grant redirect
    expect(result).not.toMatch(/oauth-redirect/);
    expect(result).not.toMatch(/auth\/2fa/);
    expect(typeof result).toBe("string");
    expect(result as string).toContain("/dashboard/settings/account");
  });
});
