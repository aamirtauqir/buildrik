/**
 * media.generateAltText — rate limit and error translation (audit F-01/F-02).
 *
 * A provider failure used to be re-thrown raw: tRPC wrapped it as
 * INTERNAL_SERVER_ERROR with the provider's own message (an OpenAI 401 names
 * the masked key suffix) and the error object as `cause`. Each domain failure
 * now maps to its own code with the service's fixed message.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { applyAltTextToAsset, checkRateLimit } = vi.hoisted(() => ({
  applyAltTextToAsset: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/server/services/rate-limiter", () => ({ checkRateLimit }));
vi.mock("@/server/services/alt-text.service", async () => {
  class AltTextError extends Error {
    constructor(
      public readonly code: string,
      message: string,
    ) {
      super(message);
    }
  }
  return { applyAltTextToAsset, AltTextError };
});

import { mediaRouter } from "@/server/trpc/routers/media";
import { AltTextError } from "@/server/services/alt-text.service";

const caller = () =>
  mediaRouter.createCaller({
    session: { user: { id: "u_1", workspaceId: "ws_1" } },
    bearer: null,
    prisma: {} as never,
  } as never);

async function rejectionOf(fire: () => Promise<unknown>): Promise<{ code?: string; message: string; cause?: unknown }> {
  try {
    await fire();
  } catch (e) {
    return e as { code?: string; message: string; cause?: unknown };
  }
  throw new Error("expected the call to reject, but it resolved");
}

beforeEach(() => {
  applyAltTextToAsset.mockReset();
  checkRateLimit.mockReset();
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
});

describe("media.generateAltText", () => {
  it("is rate-limited per user and refuses before any provider work", async () => {
    checkRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const err = await rejectionOf(() => caller().generateAltText({ assetId: "a1" }));

    expect(err.code).toBe("TOO_MANY_REQUESTS");
    expect(checkRateLimit).toHaveBeenCalledWith(expect.stringContaining("u_1"), expect.any(Number), expect.any(Number));
    expect(applyAltTextToAsset).not.toHaveBeenCalled();
  });

  it("maps QUOTA_EXCEEDED to TOO_MANY_REQUESTS", async () => {
    applyAltTextToAsset.mockRejectedValueOnce(new AltTextError("QUOTA_EXCEEDED", "Daily AI limit reached (10)."));
    const err = await rejectionOf(() => caller().generateAltText({ assetId: "a1" }));
    expect(err.code).toBe("TOO_MANY_REQUESTS");
    expect(err.message).toBe("Daily AI limit reached (10).");
  });

  it("maps NOT_CONFIGURED to PRECONDITION_FAILED", async () => {
    applyAltTextToAsset.mockRejectedValueOnce(new AltTextError("NOT_CONFIGURED", "not configured"));
    const err = await rejectionOf(() => caller().generateAltText({ assetId: "a1" }));
    expect(err.code).toBe("PRECONDITION_FAILED");
  });

  it("maps PROVIDER_FAILED to INTERNAL_SERVER_ERROR with the fixed message and no cause", async () => {
    applyAltTextToAsset.mockRejectedValueOnce(new AltTextError("PROVIDER_FAILED", "Alt text generation failed. Try again."));
    const err = await rejectionOf(() => caller().generateAltText({ assetId: "a1" }));
    expect(err.code).toBe("INTERNAL_SERVER_ERROR");
    expect(err.message).toBe("Alt text generation failed. Try again.");
    expect(err.cause).toBeUndefined();
  });
});
