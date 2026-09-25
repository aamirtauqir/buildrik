/**
 * C-2 — route test for the ai-job-cleanup cron: 401 without the bearer, and
 * the selection query (stale, non-terminal jobs past a 1-hour cutoff) with
 * Prisma mocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aIGenerationJob: { updateMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/cron/ai-job-cleanup/route";

const mockPrisma = prisma as unknown as {
  aIGenerationJob: { updateMany: ReturnType<typeof vi.fn> };
};

function makeReq(authHeader?: string): NextRequest {
  return new Request("http://localhost/api/cron/ai-job-cleanup", {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
});

describe("ai-job-cleanup cron", () => {
  it("returns 401 without the bearer", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 with the wrong bearer", async () => {
    const res = await GET(makeReq("Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("fails every non-terminal job older than 1 hour", async () => {
    mockPrisma.aIGenerationJob.updateMany.mockResolvedValue({ count: 3 });
    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, cleaned: 3 });

    const call = mockPrisma.aIGenerationJob.updateMany.mock.calls[0][0];
    expect(call.where.createdAt.lt).toBeInstanceOf(Date);
    expect(call.where.createdAt.lt.getTime()).toBeLessThanOrEqual(Date.now() - 60 * 60 * 1000 + 1000);
    expect(call.where.status.in).toEqual(
      expect.arrayContaining(["QUEUED", "GENERATING_STRUCTURE", "GENERATING_CONTENT", "GENERATING_STYLES", "BUILDING"]),
    );
    expect(call.data).toEqual({ status: "FAILED", error: "Timed out — cleaned by cron" });
  });

  it("nothing stale → { ok: true, cleaned: 0 }", async () => {
    mockPrisma.aIGenerationJob.updateMany.mockResolvedValue({ count: 0 });
    const res = await GET(makeReq("Bearer test-secret"));
    await expect(res.json()).resolves.toEqual({ ok: true, cleaned: 0 });
  });
});
