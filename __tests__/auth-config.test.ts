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
      profile: { email: "oauth@example.com", name: "OAuth User" } as any,
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

  it("sets user.id to DB id when OAuth user already exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "existing-db-id",
      email: "oauth@example.com",
    } as any);

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "provider-id", email: "oauth@example.com", name: "OAuth User" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "google", type: "oauth", providerAccountId: "google-123" } as any,
      profile: { email: "oauth@example.com", name: "OAuth User" } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    // Critical: user.id must be set to our DB id for jwt callback
    expect(userObj.id).toBe("existing-db-id");
  });

  it("allows credentials sign-in without creating user", async () => {
    const signInCallback = authConfig.callbacks!.signIn!;
    const result = await signInCallback({
      user: { id: "user-id", email: "test@example.com" },
      account: { provider: "credentials", type: "credentials" } as any,
      credentials: {} as any,
    } as any);

    expect(result).toBe(true);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});
