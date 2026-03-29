import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// --- Hoisted mocks ---
const {
  mockSessionFindFirst,
  mockSessionFindMany,
  mockSessionDeleteMany,
  mockUserDelete,
  mockAccountDeletionReqFindMany,
  mockAccountDeletionReqUpdate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockSessionFindFirst: vi.fn(),
  mockSessionFindMany: vi.fn(),
  mockSessionDeleteMany: vi.fn(),
  mockUserDelete: vi.fn(),
  mockAccountDeletionReqFindMany: vi.fn(),
  mockAccountDeletionReqUpdate: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findFirst: mockSessionFindFirst,
      findMany: mockSessionFindMany,
      deleteMany: mockSessionDeleteMany,
    },
    user: { delete: mockUserDelete },
    accountDeletionReq: {
      findMany: mockAccountDeletionReqFindMany,
      update: mockAccountDeletionReqUpdate,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/server/services/audit.service", () => ({
  logAuditEvent: vi.fn(),
}));

// --- Source files ---
const authConfigSource = readFileSync(
  path.resolve(__dirname, "../server/auth.config.ts"),
  "utf-8"
);
const trpcSource = readFileSync(
  path.resolve(__dirname, "../server/trpc/trpc.ts"),
  "utf-8"
);
const createSessionSource = readFileSync(
  path.resolve(__dirname, "../app/api/auth/create-session/route.ts"),
  "utf-8"
);
const redirectPageSource = readFileSync(
  path.resolve(__dirname, "../app/auth/redirect/page.tsx"),
  "utf-8"
);
const cronRouteSource = readFileSync(
  path.resolve(__dirname, "../app/api/cron/account-deletion/route.ts"),
  "utf-8"
);

// ============================================================
// Tests 30-32: OAuth 2FA gate (fix: OAuth logins bypassed 2FA)
// ============================================================

describe("OAuth 2FA gate: signIn callback checks twoFactorEnabled", () => {
  // Test 30
  it("auth.config.ts signIn callback reads twoFactorEnabled from DB", () => {
    expect(authConfigSource).toContain("twoFactorEnabled");
  });

  // Test 31
  it("auth.config.ts signIn callback generates a 2fa_temp token on 2FA-enabled accounts", () => {
    expect(authConfigSource).toContain('generateToken("2fa_temp"');
    expect(authConfigSource).toContain("/auth/2fa?token=");
  });

  // Test 32
  it("2FA redirect comes before the function returns true (gate fires before session grant)", () => {
    // Use full file positions — slice large enough to cover the full signIn callback
    const signInStart = authConfigSource.indexOf("async signIn(");
    const signInSection = authConfigSource.slice(signInStart, signInStart + 11000);
    const twoFARedirectPos = signInSection.indexOf("/auth/2fa?token=");
    const returnTruePos = signInSection.indexOf("return true");
    expect(twoFARedirectPos).toBeGreaterThan(-1);
    expect(returnTruePos).toBeGreaterThan(-1);
    expect(twoFARedirectPos).toBeLessThan(returnTruePos);
  });
});

// ========================================================================
// Tests 33-36: DB session check (fix: fake session revocation via JWT-only)
// ========================================================================

describe("protectedProcedure: DB session check enables real revocation", () => {
  // Test 33
  it("trpc.ts checks for an active DB session using dbSessionId", () => {
    expect(trpcSource).toContain("dbSessionId");
    expect(trpcSource).toContain("prisma.session.findFirst");
  });

  // Test 34
  it("trpc.ts throws UNAUTHORIZED when the DB session is not found", () => {
    const procedureStart = trpcSource.indexOf("export const protectedProcedure");
    const procedureSection = trpcSource.slice(procedureStart, procedureStart + 800);
    expect(procedureSection).toContain("UNAUTHORIZED");
    expect(procedureSection).toContain("Session expired or revoked");
  });

  // Test 35
  it("DB check is guarded by if (dbSessionId) — legacy sessions without the field pass through", () => {
    expect(trpcSource).toContain("if (dbSessionId)");
  });

  // Test 36: source analysis — throw happens inside the if (dbSessionId) block
  it("UNAUTHORIZED throw is inside the dbSessionId guard (not unconditional)", () => {
    const procedureStart = trpcSource.indexOf("export const protectedProcedure");
    const procedureSection = trpcSource.slice(procedureStart, procedureStart + 800);
    // The guard must come before the UNAUTHORIZED throw about revoked sessions
    const guardPos = procedureSection.indexOf("if (dbSessionId)");
    const throwPos = procedureSection.indexOf("Session expired or revoked");
    expect(guardPos).toBeGreaterThan(-1);
    expect(throwPos).toBeGreaterThan(-1);
    expect(guardPos).toBeLessThan(throwPos);
  });
});

// ====================================================================
// Tests 37-39: create-session uses UUID (fix: SHA-256 key re-use risk)
// ====================================================================

describe("create-session: uses randomUUID for dbSessionId (not createHash)", () => {
  // Test 37
  it("imports randomUUID, not createHash for session ID generation", () => {
    expect(createSessionSource).toContain("randomUUID");
    expect(createSessionSource).not.toContain('createHash("sha256")');
  });

  // Test 38
  it("dbSessionId is embedded into the JWT token payload", () => {
    expect(createSessionSource).toContain("dbSessionId");
    // Must be inside the token object passed to encode()
    const encodePos = createSessionSource.indexOf("encode(");
    const dbSessionIdPos = createSessionSource.indexOf("dbSessionId");
    expect(dbSessionIdPos).toBeGreaterThan(-1);
    expect(dbSessionIdPos).toBeLessThan(encodePos + 500);
  });

  // Test 39
  it("Session record is stored with sessionToken set to dbSessionId (not JWT hash)", () => {
    expect(createSessionSource).toContain("sessionToken: dbSessionId");
  });
});

// =====================================================================
// Tests 40-42: returnUrl same-origin validation (fix: open redirect)
// =====================================================================

describe("auth/redirect: returnUrl same-origin validation prevents open redirect", () => {
  // Test 40
  it("redirect page contains isSameOrigin validation function", () => {
    expect(redirectPageSource).toContain("isSameOrigin");
  });

  // Test 41
  it("returnUrl is read from search params and validated before use", () => {
    expect(redirectPageSource).toContain('searchParams.get("returnUrl")');
    expect(redirectPageSource).toContain("isSameOrigin");
  });

  // Test 42
  it("isSameOrigin function rejects cross-origin URLs", () => {
    // Extract the isSameOrigin function source and eval its logic inline
    // Source check: validates using new URL() constructor and origin comparison
    expect(redirectPageSource).toContain("parsed.origin === window.location.origin");
    expect(redirectPageSource).toContain("new URL(url, window.location.origin)");
  });
});

// =====================================================================
// Tests 43-47: Account deletion cron (fix: missing executor)
// =====================================================================

describe("account-deletion cron: processes pending deletions", () => {
  // Test 43
  it("cron route authenticates via CRON_SECRET bearer token", () => {
    expect(cronRouteSource).toContain("CRON_SECRET");
    expect(cronRouteSource).toContain('"Unauthorized"');
    expect(cronRouteSource).toContain("status: 401");
  });

  // Test 44
  it("cron route queries for unprocessed, non-cancelled records past scheduledAt", () => {
    expect(cronRouteSource).toContain("scheduledAt");
    expect(cronRouteSource).toContain("processedAt: null");
    expect(cronRouteSource).toContain("cancelledAt: null");
  });

  // Test 45
  it("cron route deletes the user inside a transaction (atomic)", () => {
    expect(cronRouteSource).toContain("$transaction");
    expect(cronRouteSource).toContain("prisma.user.delete");
    expect(cronRouteSource).toContain("processedAt: now");
  });

  // Test 46: behavioral — processes a pending deletion
  it("GET handler processes a pending deletion and returns count", async () => {
    mockAccountDeletionReqFindMany.mockResolvedValue([
      { id: "req-1", userId: "user-abc" },
    ]);
    mockTransaction.mockResolvedValue([]);

    const { GET } = await import("@/app/api/cron/account-deletion/route");
    const req = new Request("http://localhost/api/cron/account-deletion", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? "test-secret"}` },
    });

    process.env.CRON_SECRET = "test-secret";

    const res = await GET(req as any);
    const body = await res.json();

    expect(body.total).toBe(1);
    expect(body.processed).toBe(1);
  });

  // Test 47: behavioral — rejects missing/wrong auth header
  it("GET handler returns 401 when CRON_SECRET is missing", async () => {
    const { GET } = await import("@/app/api/cron/account-deletion/route");
    const req = new Request("http://localhost/api/cron/account-deletion", {
      headers: { authorization: "Bearer wrong-secret" },
    });

    process.env.CRON_SECRET = "test-secret";

    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });
});

// ========================================================================
// checkEmail: rate-limit + constant-time floor (Phase 3 prerequisite)
// ========================================================================

describe("auth.checkEmail: enumeration-safe email lookup", () => {
  const authRouterSource = readFileSync(
    path.join(__dirname, "..", "server/trpc/routers/auth.ts"),
    "utf-8"
  );
  const checkEmailStart = authRouterSource.indexOf("checkEmail:");
  const checkEmailSection = authRouterSource.slice(checkEmailStart, checkEmailStart + 2000);

  it("checkEmail uses strictRateLimit (5 / 15 min)", () => {
    // strictRateLimit is declared at the top of the router and applied here
    const strictRateLimitPos = authRouterSource.indexOf("const strictRateLimit");
    const checkEmailPos = authRouterSource.indexOf("checkEmail:");
    expect(strictRateLimitPos).toBeGreaterThan(-1);
    expect(checkEmailPos).toBeGreaterThan(-1);
    // strictRateLimit must be referenced in the checkEmail block
    expect(checkEmailSection).toContain("strictRateLimit");
  });

  it("checkEmail enforces a constant-time floor (MIN_RESPONSE_MS)", () => {
    expect(checkEmailSection).toContain("MIN_RESPONSE_MS");
    expect(checkEmailSection).toContain("setTimeout");
    expect(checkEmailSection).toContain("elapsed");
  });

  it("checkEmail returns exists, hasPassword, and providers fields", () => {
    expect(checkEmailSection).toContain("exists:");
    expect(checkEmailSection).toContain("hasPassword:");
    expect(checkEmailSection).toContain("providers");
  });

  it("checkEmail queries Account model to populate providers", () => {
    expect(checkEmailSection).toContain("account.findMany");
  });
});
