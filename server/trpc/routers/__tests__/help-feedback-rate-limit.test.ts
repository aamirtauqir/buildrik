/**
 * help.feedback is public and writes a row per call, so it is rate limited
 * per IP (REA audit 2026-10-20 §9.3).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkRateLimitMock = vi.fn();
const submitFeedbackMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/rate-limiter", () => ({ checkRateLimit: (...a: unknown[]) => checkRateLimitMock(...a) }));
vi.mock("@/server/services/help.service", () => ({
  listCategories: vi.fn(),
  searchArticles: vi.fn(),
  listArticlesByCategory: vi.fn(),
  getArticle: vi.fn(),
  submitFeedback: (...a: unknown[]) => submitFeedbackMock(...a),
  createTicket: vi.fn(),
}));

import { helpRouter } from "@/server/trpc/routers/help";

const caller = () =>
  helpRouter.createCaller({ session: null, prisma: {}, headers: new Headers({ "x-forwarded-for": "203.0.113.7" }) } as never);

beforeEach(() => {
  checkRateLimitMock.mockReset();
  submitFeedbackMock.mockReset();
});

describe("help.feedback rate limit", () => {
  it("records the vote while under the limit, keyed per IP and path", async () => {
    checkRateLimitMock.mockResolvedValue({ allowed: true, resetAt: Date.now() });
    await expect(caller().feedback({ articleId: "a1", helpful: true })).resolves.toEqual({ ok: true });
    expect(submitFeedbackMock).toHaveBeenCalledWith("a1", true);
    expect(checkRateLimitMock).toHaveBeenCalledWith(expect.stringMatching(/:feedback$/), 30, 15 * 60 * 1000);
  });

  it("refuses with TOO_MANY_REQUESTS and writes nothing once over the limit", async () => {
    checkRateLimitMock.mockResolvedValue({ allowed: false, resetAt: Date.now() + 60_000 });
    await expect(caller().feedback({ articleId: "a1", helpful: false })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(submitFeedbackMock).not.toHaveBeenCalled();
  });
});
