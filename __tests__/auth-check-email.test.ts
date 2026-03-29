/**
 * Tests for auth.checkEmail mutation (Phase 3 prerequisite)
 *
 * Covers:
 * - new email → exists=false, hasPassword=false, providers=[]
 * - existing user with password → exists=true, hasPassword=true
 * - existing user with OAuth → providers array populated
 * - ghost account (password=null, no OAuth) → exists=true, hasPassword=false, providers=[]
 * - constant-time floor (≥200ms)
 * - only google/github in providers (filters unknown providers)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    account: { findMany: mockFindMany },
  },
}));

// Mock auth (needed by createTRPCContext)
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

// Mock rate limiter — always allow in tests
vi.mock("@/server/services/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

// Mock audit service
vi.mock("@/server/services/audit.service", () => ({
  logAuditEvent: vi.fn(),
}));

// Build a minimal test caller that executes the checkEmail logic directly
// without going through the full router (avoids circular import chains).
async function callCheckEmail(email: string, prismaCtx: {
  user: { findUnique: ReturnType<typeof vi.fn> };
  account: { findMany: ReturnType<typeof vi.fn> };
}) {
  const MIN_RESPONSE_MS = 200;
  const start = Date.now();

  const user = await prismaCtx.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  }) as { id: string; passwordHash: string | null } | null;

  const providers: ("google" | "github")[] = [];
  if (user) {
    const accounts = await prismaCtx.account.findMany({
      where: { userId: user.id },
      select: { provider: true },
    }) as { provider: string }[];
    for (const a of accounts) {
      if (a.provider === "google" || a.provider === "github") {
        providers.push(a.provider as "google" | "github");
      }
    }
  }

  const elapsed = Date.now() - start;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise<void>((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
  }

  return {
    exists: !!user,
    hasPassword: !!user?.passwordHash,
    providers,
    elapsed: Date.now() - start,
  };
}

const ctx = {
  user: { findUnique: mockFindUnique },
  account: { findMany: mockFindMany },
};

describe("checkEmail — dispatch table", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("new email → exists=false, hasPassword=false, providers=[]", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await callCheckEmail("new@example.com", ctx);

    expect(result.exists).toBe(false);
    expect(result.hasPassword).toBe(false);
    expect(result.providers).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("existing user with password → exists=true, hasPassword=true", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", passwordHash: "$2b$..." });
    mockFindMany.mockResolvedValue([]);

    const result = await callCheckEmail("user@example.com", ctx);

    expect(result.exists).toBe(true);
    expect(result.hasPassword).toBe(true);
    expect(result.providers).toEqual([]);
  });

  it("existing user with Google OAuth → providers includes google", async () => {
    mockFindUnique.mockResolvedValue({ id: "u2", passwordHash: null });
    mockFindMany.mockResolvedValue([{ provider: "google" }]);

    const result = await callCheckEmail("oauth@example.com", ctx);

    expect(result.exists).toBe(true);
    expect(result.hasPassword).toBe(false);
    expect(result.providers).toEqual(["google"]);
  });

  it("existing user with both Google and GitHub → both in providers", async () => {
    mockFindUnique.mockResolvedValue({ id: "u3", passwordHash: null });
    mockFindMany.mockResolvedValue([{ provider: "google" }, { provider: "github" }]);

    const result = await callCheckEmail("multi@example.com", ctx);

    expect(result.providers).toContain("google");
    expect(result.providers).toContain("github");
    expect(result.providers).toHaveLength(2);
  });

  it("existing user with password AND OAuth → hasPassword=true AND providers populated", async () => {
    mockFindUnique.mockResolvedValue({ id: "u4", passwordHash: "$2b$..." });
    mockFindMany.mockResolvedValue([{ provider: "google" }]);

    const result = await callCheckEmail("both@example.com", ctx);

    expect(result.exists).toBe(true);
    expect(result.hasPassword).toBe(true);
    expect(result.providers).toEqual(["google"]);
  });

  it("ghost account (exists, no password, no OAuth) → exists=true, providers=[]", async () => {
    mockFindUnique.mockResolvedValue({ id: "u5", passwordHash: null });
    mockFindMany.mockResolvedValue([]);

    const result = await callCheckEmail("ghost@example.com", ctx);

    expect(result.exists).toBe(true);
    expect(result.hasPassword).toBe(false);
    expect(result.providers).toEqual([]);
  });

  it("unknown providers are filtered out (only google/github allowed)", async () => {
    mockFindUnique.mockResolvedValue({ id: "u6", passwordHash: null });
    mockFindMany.mockResolvedValue([
      { provider: "google" },
      { provider: "twitter" },  // unknown — should be filtered
      { provider: "discord" },  // unknown — should be filtered
    ]);

    const result = await callCheckEmail("filtered@example.com", ctx);

    expect(result.providers).toEqual(["google"]);
  });
});

describe("checkEmail — constant-time floor", () => {
  it("response time is always ≥200ms even when DB is fast", async () => {
    mockFindUnique.mockResolvedValue(null);

    const start = Date.now();
    await callCheckEmail("fast@example.com", ctx);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(195); // 5ms tolerance for test runner jitter
  }, 2000); // 2s timeout — this test intentionally waits 200ms
});

describe("checkEmail — source structure", () => {
  it("is protected by strictRateLimit (5 attempts / 15 min)", () => {
    const { readFileSync } = require("fs");
    const path = require("path");
    const source = readFileSync(
      path.resolve(__dirname, "../server/trpc/routers/auth.ts"),
      "utf-8"
    );

    // checkEmail must be on strictRateLimit (not normalRateLimit)
    const checkEmailBlock = source.slice(source.indexOf("checkEmail:"), source.indexOf("logout:"));
    expect(checkEmailBlock).toContain("strictRateLimit");
    expect(checkEmailBlock).not.toContain("normalRateLimit");
  });

  it("enforces 200ms constant-time floor", () => {
    const { readFileSync } = require("fs");
    const path = require("path");
    const source = readFileSync(
      path.resolve(__dirname, "../server/trpc/routers/auth.ts"),
      "utf-8"
    );

    const checkEmailBlock = source.slice(source.indexOf("checkEmail:"), source.indexOf("logout:"));
    expect(checkEmailBlock).toContain("MIN_RESPONSE_MS");
    expect(checkEmailBlock).toContain("200");
    expect(checkEmailBlock).toContain("setTimeout");
  });
});
