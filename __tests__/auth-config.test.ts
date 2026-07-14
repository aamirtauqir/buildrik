import { describe, it, expect, vi, beforeEach } from "vitest";

// Transaction-client mock (used inside $transaction callback)
const txUserCreate = vi.fn();
const txClient = {
  user: { create: txUserCreate },
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
    $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
  },
}));

// Mock bcryptjs (needed by auth.config.ts credentials provider)
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
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

describe("OAuth signIn callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have a signIn callback defined", () => {
    expect(authConfig.callbacks?.signIn).toBeDefined();
  });

  // The guard that made this file red: signIn refuses any provider email the
  // provider has not verified. Without it, an attacker adds the victim's address
  // as an UNVERIFIED email on their own Google account and signs into the
  // victim's Buildrick account. The fix shipped in 1c8fae40; this is its test.
  it("refuses an unverified Google email instead of linking the account", async () => {
    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp", email: "victim@example.com", name: "Attacker" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "g-1" } as any,
      profile: { email: "victim@example.com", email_verified: false } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/error/social-error?reason=unverified-email");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  // Second untested guard on this path: a public OAuth login into an existing
  // PASSWORD account whose provider isn't linked yet must NOT silently link.
  // Otherwise anyone who controls a Google account with that address absorbs the
  // password account. They get sent to use their password instead.
  it("refuses to absorb a password account via an unlinked provider", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "victim-id",
      email: "victim@example.com",
      passwordHash: "$2b$10$hash",
      accounts: [], // Google was never linked to this account
    } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "temp", email: "victim@example.com" } as any,
      account: { provider: "google", type: "oauth", providerAccountId: "g-3" } as any,
      profile: { email: "victim@example.com", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/oauth-conflict?email=victim%40example.com");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("refuses when Google omits email_verified entirely", async () => {
    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "temp", email: "victim@example.com" } as any,
      account: { provider: "google", type: "oauth", providerAccountId: "g-2" } as any,
      profile: { email: "victim@example.com" } as any, // no email_verified
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/error/social-error?reason=unverified-email");
  });

  it("creates a new user when OAuth user does not exist in DB and sets user.id to DB id", async () => {
    // User not found in DB
    mockPrisma.user.findUnique.mockResolvedValue(null);
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
      // Google asserts email_verified. Without it the signIn callback now
      // refuses the login — see the unverified-email test below.
      profile: { email: "oauth@example.com", name: "OAuth User", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(txUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "oauth@example.com",
          fullName: "OAuth User",
          provider: "google",
          emailVerified: expect.any(Date),
        }),
      })
    );
    // Critical: user.id must be set to our DB id for jwt callback
    expect(userObj.id).toBe("new-db-user-id");
  });

  // The signIn callback reads `existing.accounts` (include: { accounts: … }) to
  // decide whether this provider is already linked. The mock returned a user
  // without it, so this test died on "Cannot read properties of undefined".
  it("sets user.id to DB id when OAuth user already exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "existing-db-id",
      email: "oauth@example.com",
      passwordHash: null,
      accounts: [{ provider: "google" }],
    } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "provider-id", email: "oauth@example.com", name: "OAuth User" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "google-123" } as any,
      // Google asserts email_verified. Without it the signIn callback now
      // refuses the login — see the unverified-email test below.
      profile: { email: "oauth@example.com", name: "OAuth User", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    // Critical: user.id must be set to our DB id for jwt callback
    expect(userObj.id).toBe("existing-db-id");
  });

  // This asserted that a "credentials" account returns true. It cannot: there is
  // no Credentials provider (providers: [Google, GitHub]) — password login goes
  // through trpc.auth.login → /api/auth/create-session and never reaches this
  // callback. What the code actually guarantees is more useful, and is what the
  // email_verified branch falls through to: any provider we have not explicitly
  // decided to trust is refused. Fail closed.
  it("refuses a provider it has no verification rule for", async () => {
    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "user-id", email: "test@example.com" },
      account: { provider: "some-new-provider", type: "oauth" } as any,
      profile: { email: "test@example.com", email_verified: true } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe("/auth/error/social-error?reason=unverified-email");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});
