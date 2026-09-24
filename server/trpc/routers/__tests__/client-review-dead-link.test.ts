/**
 * clientReview.get on a dead link: the reason AND what the page may still name
 * (agency, round) travel in the error cause, so board 4418:121971's header
 * ("Ali's Studio … Round 3") can be drawn for a revoked link.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";

const getMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/server/services/rate-limiter", () => ({ checkRateLimit: vi.fn(() => ({ allowed: true })) }));
vi.mock("@/server/services/client-review.service", () => {
  class ClientReviewError extends Error {
    constructor(public code: string, msg: string, public context?: Record<string, unknown>) {
      super(msg);
    }
  }
  return {
    getReviewByToken: (...a: unknown[]) => getMock(...a),
    identifyReviewer: vi.fn(),
    listClientComments: vi.fn(),
    createClientComment: vi.fn(),
    resolveReviewByToken: vi.fn(),
    ClientReviewError,
  };
});

import { clientReviewRouter } from "@/server/trpc/routers/client-review";
import { ClientReviewError } from "@/server/services/client-review.service";

const caller = () =>
  clientReviewRouter.createCaller({ prisma: {} as never, session: null, headers: new Headers(), bearer: null } as never);
const TOKEN = "t".repeat(64);

describe("clientReview.get — dead link", () => {
  it("a revoked link is FORBIDDEN with reason, agency and round in the cause", async () => {
    getMock.mockRejectedValueOnce(
      new ClientReviewError("REVOKED", "replaced", { agencyName: "Ali's Studio", roundNumber: 3 }),
    );
    const err = await caller().get({ token: TOKEN }).catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "FORBIDDEN" });
    expect((err as { cause?: Record<string, unknown> }).cause).toMatchObject({
      reason: "REVOKED",
      agencyName: "Ali's Studio",
      roundNumber: 3,
    });
  });

  it("an unknown token carries only its reason", async () => {
    getMock.mockRejectedValueOnce(new ClientReviewError("INVALID_TOKEN", "nope"));
    const err = await caller().get({ token: TOKEN }).catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "NOT_FOUND" });
    const cause = (err as { cause?: Record<string, unknown> }).cause ?? {};
    expect(cause.reason).toBe("INVALID_TOKEN");
    expect(cause.agencyName).toBeUndefined();
  });
});
