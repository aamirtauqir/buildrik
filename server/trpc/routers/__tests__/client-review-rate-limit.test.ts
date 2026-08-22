/**
 * The public client-review surface must be throttled.
 *
 * All five `clientReview` procedures were `publicProcedure` with no rate limit,
 * and `createRateLimitedProcedure` had exactly two callers, both in auth.ts. Two
 * of the five are the reason that matters:
 *
 *  - `identify` checks the visitor's email against the address the link was
 *    sent to (`client-review.service.ts` NOT_INVITED). Unthrottled, anyone
 *    holding a review link can grind through addresses until one is accepted,
 *    and the accepted one is then the identity that signs the approval.
 *  - `resolve` IS the approval signature — the transition the whole feature
 *    exists to produce.
 *
 * `comment` is a public write on someone else's site and is throttled too, at a
 * looser limit, because a real reviewer leaves several comments in a sitting.
 * The two reads stay open: the token is 32 random bytes, so there is no cheap
 * guess to throttle, and throttling them would break a reviewer who refreshes.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkRateLimitMock = vi.fn();
const identifyMock = vi.fn();
const resolveMock = vi.fn();
const commentMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/server/services/rate-limiter", () => ({
  checkRateLimit: (...a: unknown[]) => checkRateLimitMock(...a),
}));
vi.mock("@/server/services/client-review.service", () => ({
  getReviewByToken: vi.fn(),
  identifyReviewer: (...a: unknown[]) => identifyMock(...a),
  listClientComments: vi.fn(),
  createClientComment: (...a: unknown[]) => commentMock(...a),
  resolveReviewByToken: (...a: unknown[]) => resolveMock(...a),
  ClientReviewError: class ClientReviewError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  },
}));

import { clientReviewRouter } from "@/server/trpc/routers/client-review";

const TOKEN = "t".repeat(64);

/** A caller with an IP, the way the throttle keys itself. */
function caller(ip = "203.0.113.9") {
  return clientReviewRouter.createCaller({
    prisma: {} as never,
    session: null,
    headers: new Headers({ "x-forwarded-for": ip }),
    bearer: null,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  checkRateLimitMock.mockResolvedValue({ allowed: true, resetAt: Date.now() + 1000 });
  identifyMock.mockResolvedValue({ ok: true });
  resolveMock.mockResolvedValue({ ok: true });
  commentMock.mockResolvedValue({ ok: true });
});

describe("clientReview public surface is throttled", () => {
  it("consults the throttle before identifying a reviewer", async () => {
    await caller().identify({ token: TOKEN, name: "Dana", email: "dana@example.com" });
    expect(checkRateLimitMock).toHaveBeenCalled();
  });

  it("refuses to identify once the throttle says no, and never reaches the service", async () => {
    checkRateLimitMock.mockResolvedValue({ allowed: false, resetAt: Date.now() + 60_000 });
    await expect(
      caller().identify({ token: TOKEN, name: "Dana", email: "dana@example.com" })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(identifyMock).not.toHaveBeenCalled();
  });

  it("refuses to record an approval once the throttle says no", async () => {
    checkRateLimitMock.mockResolvedValue({ allowed: false, resetAt: Date.now() + 60_000 });
    await expect(
      caller().resolve({ token: TOKEN, status: "APPROVED" })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it("throttles comments too", async () => {
    checkRateLimitMock.mockResolvedValue({ allowed: false, resetAt: Date.now() + 60_000 });
    await expect(
      caller().comment({ token: TOKEN, body: "looks good", x: 0, y: 0 })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(commentMock).not.toHaveBeenCalled();
  });
});
