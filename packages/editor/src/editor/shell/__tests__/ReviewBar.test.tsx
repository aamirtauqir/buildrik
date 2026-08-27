/**
 * ReviewBar — board 200:213 (Shell state 8 · Review active).
 *
 * The board gives an open round its own row under the topbar: the open-comment
 * count, a way through those comments, Compare and Re-send. None of it existed
 * — the only review chrome in the shell was the topbar pill, which says a
 * review exists and nothing about working through it.
 *
 * `ReviewRequest.status` is `PENDING | APPROVED | CHANGES_REQUESTED`
 * (prisma/schema.prisma:513). The pill's "opened-not-acted" is derived from
 * `openedAt` and is NOT a round status — a bar that keyed off "OPENED" would
 * have rendered for nobody.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

const fetchCurrentRound = vi.fn();
const fetchReviewComments = vi.fn();

vi.mock("@/services/ReviewService", () => ({
  fetchCurrentRound: (...a: unknown[]) => fetchCurrentRound(...a),
  fetchReviewComments: (...a: unknown[]) => fetchReviewComments(...a),
}));

import { ReviewBar } from "../ReviewBar";

const round = (over: Record<string, unknown> = {}) => ({
  id: "r1",
  status: "PENDING",
  invitedEmail: "client@example.test",
  reviewerName: "Ayesha",
  revoked: false,
  resolvedAt: null,
  createdAt: new Date(),
  revision: "rev1",
  roundNumber: 1,
  totalRounds: 1,
  openCommentCount: 3,
  ...over,
});

const comment = (over: Record<string, unknown> = {}) => ({
  id: "c1",
  body: "Hero copy needs work",
  pageId: "page-1",
  x: null,
  y: null,
  targetSelector: "el-1",
  status: "OPEN",
  authorKind: "client",
  authorName: "Ayesha",
  createdAt: new Date(),
  ...over,
});

function makeComposer() {
  const el = { id: "el-1" };
  return {
    calls: [] as string[],
    elements: {
      getActivePage: () => ({ id: "page-9" }),
      setActivePage: vi.fn(),
      getElement: (id: string) => (id === "el-1" ? el : null),
    },
    selection: { select: vi.fn() },
    on: vi.fn(),
    off: vi.fn(),
    el,
  };
}

beforeEach(() => {
  fetchCurrentRound.mockReset();
  fetchReviewComments.mockReset();
});
afterEach(cleanup);

const mount = (composer: unknown = makeComposer(), props: Record<string, unknown> = {}) =>
  render(<ReviewBar composer={composer as never} onCompare={vi.fn()} {...props} />);

describe("ReviewBar — when the board's row exists", () => {
  it("shows the count, the walk, Compare and Re-send", async () => {
    fetchCurrentRound.mockResolvedValue(round());
    fetchReviewComments.mockResolvedValue([comment()]);
    mount(makeComposer(), { onResend: vi.fn() });

    expect(await screen.findByText("3 open")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next ›" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Compare" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Re-send" })).toBeTruthy();
  });

  it("asks only for the OPEN comments — the walk is of what is unresolved", async () => {
    fetchCurrentRound.mockResolvedValue(round());
    fetchReviewComments.mockResolvedValue([comment()]);
    mount();
    await waitFor(() => expect(fetchReviewComments).toHaveBeenCalledWith("OPEN"));
  });
});

describe("ReviewBar — when it must not exist", () => {
  const hidden = async () => {
    mount();
    await waitFor(() => expect(fetchCurrentRound).toHaveBeenCalled());
    expect(screen.queryByTestId("review-bar")).toBeNull();
  };

  it("hides with no round at all", async () => {
    fetchCurrentRound.mockResolvedValue(null);
    await hidden();
  });

  it("hides once the round is APPROVED — that round is finished", async () => {
    fetchCurrentRound.mockResolvedValue(round({ status: "APPROVED" }));
    await hidden();
  });

  it("hides on a revoked round", async () => {
    fetchCurrentRound.mockResolvedValue(round({ revoked: true }));
    await hidden();
  });

  it("hides rather than shouting when the fetch fails — the panel owns errors", async () => {
    fetchCurrentRound.mockRejectedValue(new Error("offline"));
    await hidden();
  });

  it("shows for CHANGES_REQUESTED, which is still work in flight", async () => {
    fetchCurrentRound.mockResolvedValue(round({ status: "CHANGES_REQUESTED" }));
    fetchReviewComments.mockResolvedValue([comment()]);
    mount();
    expect(await screen.findByTestId("review-bar")).toBeTruthy();
  });
});

describe("ReviewBar — Next walks the comments", () => {
  it("switches page and selects the anchor", async () => {
    const composer = makeComposer();
    fetchCurrentRound.mockResolvedValue(round());
    fetchReviewComments.mockResolvedValue([comment()]);
    mount(composer);

    fireEvent.click(await screen.findByRole("button", { name: "Next ›" }));
    expect(composer.elements.setActivePage).toHaveBeenCalledWith("page-1");
    expect(composer.selection.select).toHaveBeenCalledWith(composer.el);
  });

  it("is disabled when there is nothing to walk", async () => {
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount();
    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Next ›" }) as HTMLButtonElement).disabled).toBe(true),
    );
  });

  it("moves nothing for a comment whose anchor was deleted", async () => {
    const composer = makeComposer();
    fetchCurrentRound.mockResolvedValue(round());
    fetchReviewComments.mockResolvedValue([comment({ targetSelector: "gone", pageId: null })]);
    mount(composer);

    fireEvent.click(await screen.findByRole("button", { name: "Next ›" }));
    expect(composer.selection.select).not.toHaveBeenCalled();
    expect(composer.elements.setActivePage).not.toHaveBeenCalled();
  });
});

describe("ReviewBar — Re-send", () => {
  it("says so while it runs and reloads after", async () => {
    let release: () => void = () => {};
    const onResend = vi.fn(() => new Promise<void>((r) => { release = r; }));
    fetchCurrentRound.mockResolvedValue(round());
    fetchReviewComments.mockResolvedValue([comment()]);
    mount(makeComposer(), { onResend });

    fireEvent.click(await screen.findByRole("button", { name: "Re-send" }));
    expect(await screen.findByRole("button", { name: "Re-sending…" })).toBeTruthy();
    release();
    await waitFor(() => expect(fetchCurrentRound).toHaveBeenCalledTimes(2));
  });

  it("shows no Re-send when the shell supplies none", async () => {
    fetchCurrentRound.mockResolvedValue(round());
    fetchReviewComments.mockResolvedValue([comment()]);
    mount();
    await screen.findByTestId("review-bar");
    expect(screen.queryByRole("button", { name: "Re-send" })).toBeNull();
  });
});

describe("ReviewBar — a zero is not a status", () => {
  /* The bar only renders while a round is live, so "0 open" meant "your client
     has not replied yet" and printed a number that says none of that. */
  it("with nothing open on a pending round it names the wait", async () => {
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount();
    expect(await screen.findByText("Sent — waiting on your client")).toBeTruthy();
    expect(screen.queryByText("0 open")).toBeNull();
  });

  it("with nothing open after changes were requested it says which", async () => {
    fetchCurrentRound.mockResolvedValue(
      round({ status: "CHANGES_REQUESTED", openCommentCount: 0 }),
    );
    fetchReviewComments.mockResolvedValue([]);
    mount();
    expect(await screen.findByText("Changes requested — nothing left open")).toBeTruthy();
  });

  it("the count comes back the moment there is one", async () => {
    fetchCurrentRound.mockResolvedValue(round());
    fetchReviewComments.mockResolvedValue([comment()]);
    mount();
    expect(await screen.findByText("3 open")).toBeTruthy();
  });

  it("a disabled walk carries its reason", async () => {
    // "Disabled without a reason is a bug, not a state" — wireframes §5.8.
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount();
    const next = await screen.findByRole("button", { name: "Next ›" });
    expect(next).toBeDisabled();
    expect(next.getAttribute("title")).toBe("No open comments to step through");
  });
});

