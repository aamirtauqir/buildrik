/**
 * ReviewService P0 additions — the editor Review panel's data + actions.
 * Reads route through the dashboard tRPC client and fail closed (a dead
 * dashboard shows an empty panel, never a crash); writes (reply, resolve,
 * revoke) surface failure so the panel can show a retry.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const currentRoundQuery = vi.fn();
const revokeMutate = vi.fn();
const commentsListQuery = vi.fn();
const commentsCreateMutate = vi.fn();
const commentsResolveMutate = vi.fn();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    reviews: {
      submit: { mutate: vi.fn() },
      currentRound: { query: currentRoundQuery },
      revoke: { mutate: revokeMutate },
    },
    comments: {
      list: { query: commentsListQuery },
      create: { mutate: commentsCreateMutate },
      resolve: { mutate: commentsResolveMutate },
    },
  }),
}));

import {
  fetchReviewComments,
  fetchCurrentRound,
  revokeReview,
  postReply,
  resolveReviewComment,
} from "../ReviewService";

beforeEach(() => {
  [currentRoundQuery, revokeMutate, commentsListQuery, commentsCreateMutate, commentsResolveMutate].forEach(
    (m) => m.mockReset(),
  );
  window.history.pushState({}, "", "/edit/site-123");
});

describe("fetchReviewComments", () => {
  it("labels client vs internal and carries the client name", async () => {
    commentsListQuery.mockResolvedValue([
      { id: "c1", body: "hero too dark", pageId: "home", x: 0.5, y: 0.2, status: "OPEN", createdAt: "2026-07-20", reviewerId: "rv1", authorId: null, reviewer: { name: "Sara Khan" } },
      { id: "c2", body: "on it", pageId: "home", x: null, y: null, status: "OPEN", createdAt: "2026-07-21", reviewerId: null, authorId: "u1", reviewer: null },
    ]);
    const rows = await fetchReviewComments();
    expect(commentsListQuery).toHaveBeenCalledWith({ siteId: "site-123", status: undefined });
    expect(rows[0]).toMatchObject({ id: "c1", authorKind: "client", authorName: "Sara Khan", pageId: "home" });
    expect(rows[1]).toMatchObject({ id: "c2", authorKind: "internal", authorName: null });
  });

  it("passes a status filter through", async () => {
    commentsListQuery.mockResolvedValue([]);
    await fetchReviewComments("OPEN");
    expect(commentsListQuery).toHaveBeenCalledWith({ siteId: "site-123", status: "OPEN" });
  });

  it("propagates the error so the panel shows error≠empty (DF5, not fake-empty)", async () => {
    commentsListQuery.mockRejectedValue(new Error("network"));
    await expect(fetchReviewComments()).rejects.toThrow(/network/);
  });

  it("returns [] when there is no site", async () => {
    window.history.pushState({}, "", "/edit/");
    expect(await fetchReviewComments()).toEqual([]);
    expect(commentsListQuery).not.toHaveBeenCalled();
  });
});

describe("fetchCurrentRound", () => {
  it("returns the current round for the site", async () => {
    const round = { id: "r1", status: "PENDING", revision: "2026-07-21T09:00:00.000Z", openCommentCount: 3 };
    currentRoundQuery.mockResolvedValue(round);
    expect(await fetchCurrentRound()).toEqual(round);
    expect(currentRoundQuery).toHaveBeenCalledWith({ siteId: "site-123" });
  });

  it("returns null for a never-sent site (server null), not an error", async () => {
    currentRoundQuery.mockResolvedValue(null);
    expect(await fetchCurrentRound()).toBeNull();
  });

  it("propagates the error so the panel distinguishes error from never-sent (DF5)", async () => {
    currentRoundQuery.mockRejectedValue(new Error("boom"));
    await expect(fetchCurrentRound()).rejects.toThrow(/boom/);
  });
});

describe("revokeReview", () => {
  it("passes the reviewId + revision and returns the result", async () => {
    revokeMutate.mockResolvedValue({ revoked: true });
    const res = await revokeReview("r1", "2026-07-21T09:00:00.000Z");
    expect(res).toEqual({ revoked: true });
    expect(revokeMutate).toHaveBeenCalledWith({ siteId: "site-123", reviewId: "r1", expectedRevision: "2026-07-21T09:00:00.000Z" });
  });

  it("returns a failure result on error rather than throwing", async () => {
    revokeMutate.mockRejectedValue(new Error("boom"));
    expect(await revokeReview("r1", "rev")).toEqual({ revoked: false, reason: "error" });
  });
});

describe("postReply (surfaces failure for retry)", () => {
  it("creates an internal comment on the site", async () => {
    commentsCreateMutate.mockResolvedValue({ id: "c9" });
    await postReply("looking into it", "home");
    expect(commentsCreateMutate).toHaveBeenCalledWith({ siteId: "site-123", body: "looking into it", pageId: "home" });
  });

  it("propagates the error so the composer can show a retry", async () => {
    commentsCreateMutate.mockRejectedValue(new Error("save failed"));
    await expect(postReply("x")).rejects.toThrow(/save failed/);
  });
});

describe("resolveReviewComment", () => {
  it("resolves a comment", async () => {
    commentsResolveMutate.mockResolvedValue({ id: "c1" });
    await resolveReviewComment("c1", "RESOLVED");
    expect(commentsResolveMutate).toHaveBeenCalledWith({ id: "c1", siteId: "site-123", status: "RESOLVED" });
  });

  it("propagates the error for retry", async () => {
    commentsResolveMutate.mockRejectedValue(new Error("nope"));
    await expect(resolveReviewComment("c1", "OPEN")).rejects.toThrow(/nope/);
  });
});
