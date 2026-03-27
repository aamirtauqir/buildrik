import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      deleteMany: vi.fn(),
    },
  },
}));

// Mock token service
vi.mock("@/server/services/token.service", () => ({
  validateToken: vi.fn(),
  invalidateToken: vi.fn(),
}));

// Mock audit service
vi.mock("@/server/services/audit.service", () => ({
  logAuditEvent: vi.fn(),
}));

// Mock next-auth/jwt
vi.mock("next-auth/jwt", () => ({
  decode: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { decode } from "next-auth/jwt";
import { POST } from "@/app/api/auth/logout/route";

const mockPrisma = vi.mocked(prisma);
const mockDecode = vi.mocked(decode);

function createMockRequest(): any {
  const req = new Request("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: {
      cookie: "next-auth.session-token=test-jwt-token",
    },
  });
  // Simulate NextRequest.cookies API
  (req as any).cookies = {
    get: (name: string) => name === "next-auth.session-token" ? { value: "test-jwt-token" } : undefined,
  };
  return req;
}

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test-secret-for-jwt-decoding-1234567890";
  });

  it("deletes user sessions from DB when valid JWT is present", async () => {
    mockDecode.mockResolvedValue({
      userId: "user-123",
      email: "test@example.com",
      sub: "user-123",
    } as any);

    mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 });

    const response = await POST(createMockRequest() as any);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-123" },
    });
  });

  it("still clears cookie even when no valid session exists", async () => {
    mockDecode.mockResolvedValue(null);

    const response = await POST(createMockRequest() as any);
    const body = await response.json();

    expect(body.success).toBe(true);
    // Cookie should still be cleared
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("next-auth.session-token=");
    expect(setCookie).toContain("Max-Age=0");
  });
});
