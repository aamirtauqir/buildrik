/**
 * The queue must say which rows the caller submitted.
 *
 * `resolveReview` refuses a self-resolve by design — "the whole point of the
 * gate is a second pair of eyes" (`review.service.ts:348`). The dashboard queue
 * rendered Approve and Request-changes on every PENDING row regardless, so on
 * your own submission both buttons throw BAD_REQUEST and there is no third
 * option. On a one-seat workspace that is the whole exit: nobody else exists to
 * resolve it, and `editsRequireApproval` keeps publish blocked meanwhile.
 *
 * The row now carries `isOwnSubmission` so the queue can offer Withdraw
 * instead, and `revision` so that withdraw is the race-safe `revoke` the
 * service already implements.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const listMock = vi.fn();
const isFeatureEnabledMock = vi.fn();
const checkWorkspaceRoleMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/server/trpc/workspace-ctx", () => ({
  resolveWorkspaceId: vi.fn().mockResolvedValue("ws_1"),
}));
vi.mock("@/server/services/feature-flag.service", () => ({
  isFeatureEnabled: (...a: unknown[]) => isFeatureEnabledMock(...a),
}));
vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: vi.fn(),
  checkWorkspaceRole: (...a: unknown[]) => checkWorkspaceRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  },
}));
vi.mock("@/server/services/review.service", () => ({
  submitReview: vi.fn(),
  listReviews: (...a: unknown[]) => listMock(...a),
  resolveReview: vi.fn(),
  getReviewStatus: vi.fn(),
  getCurrentRound: vi.fn(),
  getApprovedSnapshot: vi.fn(),
  revokeReviewRound: vi.fn(),
  ReviewError: class ReviewError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  },
}));
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite: vi.fn() }));

import { reviewsRouter } from "@/server/trpc/routers/reviews";

const caller = (userId: string) =>
  reviewsRouter.createCaller({
    prisma: {} as never,
    session: { user: { id: userId } },
    headers: new Headers(),
    bearer: null,
  } as never);

beforeEach(() => {
  vi.clearAllMocks();
  isFeatureEnabledMock.mockResolvedValue(true);
  checkWorkspaceRoleMock.mockResolvedValue(undefined);
  listMock.mockResolvedValue({
    items: [
      { id: "r-mine", siteId: "s1", siteName: "Acme", requestedById: "user-me", status: "PENDING", note: null, changeSummary: null, resolvedById: null, resolvedAt: null, createdAt: new Date(), revision: "2026-08-22T00:00:00.000Z" },
      { id: "r-theirs", siteId: "s1", siteName: "Acme", requestedById: "user-other", status: "PENDING", note: null, changeSummary: null, resolvedById: null, resolvedAt: null, createdAt: new Date(), revision: "2026-08-22T00:00:00.000Z" },
    ],
    nextCursor: null,
  });
});

describe("reviews.list", () => {
  it("marks the caller's own submissions, because they cannot resolve them", async () => {
    const res = await caller("user-me").list({});
    expect(res.items.find((i) => i.id === "r-mine")?.isOwnSubmission).toBe(true);
    expect(res.items.find((i) => i.id === "r-theirs")?.isOwnSubmission).toBe(false);
  });

  it("carries the revision, so withdrawing is the race-safe revoke", async () => {
    const res = await caller("user-me").list({});
    expect(res.items[0].revision).toBe("2026-08-22T00:00:00.000Z");
  });
});
