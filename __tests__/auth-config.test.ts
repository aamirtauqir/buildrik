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

describe("OAuth signIn callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have a signIn callback defined", () => {
    expect(authConfig.callbacks?.signIn).toBeDefined();
  });

  it("creates a new user when OAuth user does not exist in DB and sets user.id to DB id", async () => {
    // First findUnique: user lookup (returns null — new user)
    // Second findUnique: twoFactorEnabled check (returns user without 2FA)
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ twoFactorEnabled: false });
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
      profile: { email: "oauth@example.com", name: "OAuth User" } as any,
      credentials: undefined as any,
    } as any);

    // signIn now routes OAuth through /auth/oauth-redirect for consistent session handling
    expect(typeof result).toBe("string");
    expect(result as string).toMatch(/^\/auth\/oauth-redirect\?token=/);
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
    // Critical: user.id must be set to our DB id before session_grant is generated
    expect(userObj.id).toBe("new-db-user-id");
  });

  it("sets user.id to DB id when OAuth user already exists", async () => {
    // First findUnique: user lookup; second: twoFactorEnabled check
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: "existing-db-id", email: "oauth@example.com" } as any)
      .mockResolvedValueOnce({ twoFactorEnabled: false });

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "provider-id", email: "oauth@example.com", name: "OAuth User" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "google-123" } as any,
      profile: { email: "oauth@example.com", name: "OAuth User" } as any,
      credentials: undefined as any,
    } as any);

    expect(typeof result).toBe("string");
    expect(result as string).toMatch(/^\/auth\/oauth-redirect\?token=/);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    // Critical: user.id must be set to our DB id before session_grant is generated
    expect(userObj.id).toBe("existing-db-id");
  });

  it("credentials provider is absent from authConfig.providers", () => {
    expect(authConfig.providers.some(p => (p as { id?: string }).id === "credentials")).toBe(false);
  });
});
