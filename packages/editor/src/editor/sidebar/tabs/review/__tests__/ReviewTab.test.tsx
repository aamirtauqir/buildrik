/**
 * ReviewTab (P0) — the editor-side review panel. Verifies the load states
 * (loading → list, never-sent, error+retry that is NOT fake-empty, empty),
 * the thread labels (client vs internal), and the actions: reply, resolve,
 * re-send (primary), and revoke (behind an overflow + confirm, race-safe).
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchCurrentRound = vi.fn();
const fetchReviewComments = vi.fn();
const postReply = vi.fn();
const resolveReviewComment = vi.fn();
const revokeReview = vi.fn();

vi.mock("../../../../../services/ReviewService", () => ({
  fetchCurrentRound: (...a: unknown[]) => fetchCurrentRound(...a),
  fetchReviewComments: (...a: unknown[]) => fetchReviewComments(...a),
  postReply: (...a: unknown[]) => postReply(...a),
  resolveReviewComment: (...a: unknown[]) => resolveReviewComment(...a),
  revokeReview: (...a: unknown[]) => revokeReview(...a),
}));

import { ReviewTab } from "../ReviewTab";

const ROUND = {
  id: "r1",
  status: "PENDING",
  invitedEmail: "sara@client.com",
  reviewerName: "Sara Khan",
  revoked: false,
  resolvedAt: null,
  createdAt: "2026-07-20T10:00:00Z",
  revision: "2026-07-21T09:00:00.000Z",
  roundNumber: 2,
  totalRounds: 2,
  openCommentCount: 1,
};
const COMMENTS = [
  { id: "c1", body: "hero photo is too dark", pageId: "home", x: 0.5, y: 0.2, status: "OPEN", authorKind: "client", authorName: "Sara Khan", createdAt: "2026-07-20T11:00:00Z" },
  { id: "c2", body: "on it, swapping the image", pageId: "home", x: null, y: null, status: "OPEN", authorKind: "internal", authorName: null, createdAt: "2026-07-20T12:00:00Z" },
];

function renderTab(props = {}) {
  return render(
    <ReviewTab onResend={vi.fn(() => Promise.resolve())} {...props} />,
  );
}

beforeEach(() => {
  [fetchCurrentRound, fetchReviewComments, postReply, resolveReviewComment, revokeReview].forEach((m) => m.mockReset());
  fetchCurrentRound.mockResolvedValue(ROUND);
  fetchReviewComments.mockResolvedValue(COMMENTS);
  postReply.mockResolvedValue(undefined);
  resolveReviewComment.mockResolvedValue(undefined);
  revokeReview.mockResolvedValue({ revoked: true });
});
afterEach(cleanup);

describe("load states", () => {
  it("loads the round + thread, labelling client vs internal", async () => {
    renderTab();
    expect(await screen.findByText("hero photo is too dark")).toBeInTheDocument();
    expect(screen.getByText("on it, swapping the image")).toBeInTheDocument();
    // client comment names the client; internal one reads as "You"
    expect(screen.getByText(/Sara Khan/)).toBeInTheDocument();
    expect(screen.getByText(/You/)).toBeInTheDocument();
    // round header
    expect(screen.getByText(/Round 2 of 2/)).toBeInTheDocument();
  });

  it("shows a never-sent state when there is no round", async () => {
    fetchCurrentRound.mockResolvedValue(null);
    fetchReviewComments.mockResolvedValue([]);
    renderTab();
    expect(await screen.findByText(/hasn't been sent for review/i)).toBeInTheDocument();
  });

  it("shows error+retry (NOT fake-empty) when the load fails, and retries", async () => {
    fetchCurrentRound.mockRejectedValueOnce(new Error("network"));
    fetchReviewComments.mockRejectedValueOnce(new Error("network"));
    renderTab();
    expect(await screen.findByText(/couldn't load/i)).toBeInTheDocument();
    // it must NOT render the empty "no feedback" copy on a failed load
    expect(screen.queryByText(/no feedback yet/i)).not.toBeInTheDocument();
    fetchCurrentRound.mockResolvedValue(ROUND);
    fetchReviewComments.mockResolvedValue(COMMENTS);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("hero photo is too dark")).toBeInTheDocument();
  });

  it("shows an empty state when the round exists but has no comments", async () => {
    fetchReviewComments.mockResolvedValue([]);
    renderTab();
    expect(await screen.findByText(/no feedback yet/i)).toBeInTheDocument();
  });
});

describe("actions", () => {
  it("posts an internal reply then reloads the thread", async () => {
    renderTab();
    await screen.findByText("hero photo is too dark");
    fireEvent.change(screen.getByPlaceholderText(/reply/i), { target: { value: "fixed the contrast" } });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    await waitFor(() => expect(postReply).toHaveBeenCalledWith("fixed the contrast", "home"));
    // reloaded (comments fetched again after the reply)
    await waitFor(() => expect(fetchReviewComments.mock.calls.length).toBeGreaterThan(1));
  });

  it("resolves a comment", async () => {
    renderTab();
    await screen.findByText("hero photo is too dark");
    const row = screen.getByText("hero photo is too dark").closest("[data-comment-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /resolve/i }));
    await waitFor(() => expect(resolveReviewComment).toHaveBeenCalledWith("c1", "RESOLVED"));
  });

  it("re-send is the primary action and calls onResend", async () => {
    const onResend = vi.fn(() => Promise.resolve());
    renderTab({ onResend });
    await screen.findByText("hero photo is too dark");
    fireEvent.click(screen.getByRole("button", { name: /re-send/i }));
    await waitFor(() => expect(onResend).toHaveBeenCalled());
  });

  it("revoke is behind an overflow and a confirm, and passes the revision", async () => {
    renderTab();
    await screen.findByText("hero photo is too dark");
    // revoke is NOT directly visible — it lives behind the More overflow
    expect(screen.queryByRole("button", { name: /^revoke/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /more|options/i }));
    fireEvent.click(screen.getByRole("button", { name: /^revoke/i }));
    // confirm dialog
    fireEvent.click(screen.getByRole("button", { name: /revoke link/i }));
    await waitFor(() => expect(revokeReview).toHaveBeenCalledWith("r1", "2026-07-21T09:00:00.000Z"));
  });
});
