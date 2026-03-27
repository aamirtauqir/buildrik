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
