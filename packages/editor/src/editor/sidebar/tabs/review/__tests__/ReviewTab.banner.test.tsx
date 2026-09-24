/**
 * ReviewTab — the round banner (C2 · board B3-05 7571:191619).
 *
 * The retired ReviewBar (board 200:213) drew a strip under the topbar: the
 * open count, a walk through the comments, Compare and Re-send. Owner
 * decision D3 folded it into the topbar chip and this panel. The bar's
 * asserts (`ReviewBar.test.tsx`, 8 of them) are ported here against the
 * banner — the walk itself is `locate.test.ts` — so none of what the bar
 * protected went with the file.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchCurrentRound = vi.fn();
const fetchReviewComments = vi.fn();

vi.mock("../../../../../services/ReviewService", () => ({
  fetchRounds: vi.fn(() => Promise.resolve([])),
  fetchCurrentRound: (...a: unknown[]) => fetchCurrentRound(...a),
  fetchReviewComments: (...a: unknown[]) => fetchReviewComments(...a),
  postReply: vi.fn(),
  resolveReviewComment: vi.fn(),
  revokeReview: vi.fn(),
  fetchApprovedSnapshot: vi.fn(),
  currentSiteId: () => "site_test",
}));

import { ReviewTab } from "../ReviewTab";
import { ToastProvider } from "@/editor/chrome-ui";

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
    elements: {
      getActivePage: () => ({ id: "page-9" }),
      setActivePage: vi.fn(),
      getElement: (id: string) => (id === "el-1" ? el : null),
      getAllPages: () => [{ id: "page-1", name: "Home" }],
    },
    selection: { select: vi.fn() },
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    el,
  };
}

beforeEach(() => {
  fetchCurrentRound.mockReset();
  fetchReviewComments.mockReset();
});
afterEach(cleanup);

const mount = (composer: unknown = makeComposer(), props: Record<string, unknown> = {}) =>
  render(
    <ToastProvider>
      <ReviewTab composer={composer as never} onResend={vi.fn(() => Promise.resolve())} {...props} />
    </ToastProvider>,
  );

describe("the banner — when the board's band exists", () => {
  it("shows the count and the walk; Re-send is the panel's own", async () => {
    fetchCurrentRound.mockResolvedValue(round());
    fetchReviewComments.mockResolvedValue([comment(), comment({ id: "c2" }), comment({ id: "c3" })]);
    mount();
    expect(await screen.findByTestId("review-banner")).toBeTruthy();
    expect(screen.getByTestId("review-banner-line").textContent).toBe("3 open");
    expect(screen.getByRole("button", { name: "Next ›" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Re-send for review" })).toBeTruthy();
  });

  it("walks only the OPEN comments — resolved ones are not stepped through", async () => {
    const composer = makeComposer();
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 1 }));
    fetchReviewComments.mockResolvedValue([
      comment({ id: "r1", status: "RESOLVED", targetSelector: "resolved-el" }),
      comment({ id: "o1" }),
    ]);
    mount(composer);
    fireEvent.click(await screen.findByRole("button", { name: "Next ›" }));
    fireEvent.click(screen.getByRole("button", { name: "Next ›" }));
    // Two steps over one open comment: both land on it, never on the resolved one.
    expect(composer.selection.select).toHaveBeenCalledTimes(2);
    expect(composer.selection.select).toHaveBeenCalledWith(composer.el);
  });

  it("is warning-tinted when changes were requested, neutral while merely out", async () => {
    fetchCurrentRound.mockResolvedValue(round({ status: "CHANGES_REQUESTED" }));
    fetchReviewComments.mockResolvedValue([comment()]);
    mount();
    expect((await screen.findByTestId("review-banner")).getAttribute("data-tone")).toBe("warning");
    cleanup();
    fetchCurrentRound.mockResolvedValue(round());
    mount();
    expect((await screen.findByTestId("review-banner")).getAttribute("data-tone")).toBe("neutral");
  });
});

describe("the banner — when it must not exist", () => {
  const hidden = async () => {
    mount();
    await waitFor(() => expect(fetchCurrentRound).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByLabelText("Loading review")).toBeNull());
    expect(screen.queryByTestId("review-banner")).toBeNull();
  };

  it("hides with no round at all", async () => {
    fetchCurrentRound.mockResolvedValue(null);
    fetchReviewComments.mockResolvedValue([]);
    await hidden();
  });

  it("hides once the round is APPROVED — that round is finished", async () => {
    fetchCurrentRound.mockResolvedValue(round({ status: "APPROVED" }));
    fetchReviewComments.mockResolvedValue([comment()]);
    await hidden();
  });

  it("hides on a revoked round", async () => {
    fetchCurrentRound.mockResolvedValue(round({ revoked: true }));
    fetchReviewComments.mockResolvedValue([comment()]);
    await hidden();
  });

  it("hides when the fetch fails — the panel's own error state speaks", async () => {
    fetchCurrentRound.mockRejectedValue(new Error("offline"));
    fetchReviewComments.mockRejectedValue(new Error("offline"));
    await hidden();
  });

  it("shows for CHANGES_REQUESTED, which is still work in flight", async () => {
    fetchCurrentRound.mockResolvedValue(round({ status: "CHANGES_REQUESTED" }));
    fetchReviewComments.mockResolvedValue([comment()]);
    mount();
    expect(await screen.findByTestId("review-banner")).toBeTruthy();
  });
});

describe("the banner — Next walks the comments (the helper is locate.test.ts)", () => {
  it("switches page and selects the anchor", async () => {
    const composer = makeComposer();
    fetchCurrentRound.mockResolvedValue(round());
    fetchReviewComments.mockResolvedValue([comment()]);
    mount(composer);
    fireEvent.click(await screen.findByRole("button", { name: "Next ›" }));
    expect(composer.elements.setActivePage).toHaveBeenCalledWith("page-1");
    expect(composer.selection.select).toHaveBeenCalledWith(composer.el);
  });

  it("is disabled with its reason when there is nothing to walk", async () => {
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount();
    const next = await screen.findByRole("button", { name: "Next ›" });
    expect(next).toBeDisabled();
    // "Disabled without a reason is a bug, not a state" — wireframes §5.8.
    expect(next.getAttribute("title")).toBe("No open comments to step through");
  });
});

describe("the banner — a zero is not a status", () => {
  it("with nothing open on a pending round it names the wait", async () => {
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount();
    expect((await screen.findByTestId("review-banner-line")).textContent).toBe("Sent — waiting on your client");
    expect(screen.queryByText("0 open")).toBeNull();
  });

  it("with nothing open after changes were requested it says which", async () => {
    fetchCurrentRound.mockResolvedValue(round({ status: "CHANGES_REQUESTED", openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount();
    expect((await screen.findByTestId("review-banner-line")).textContent).toBe("Changes requested — nothing left open");
  });

  it("names the reviewer and the count once changes were requested with comments open", async () => {
    fetchCurrentRound.mockResolvedValue(round({ status: "CHANGES_REQUESTED" }));
    fetchReviewComments.mockResolvedValue([comment(), comment({ id: "c2" })]);
    mount();
    expect((await screen.findByTestId("review-banner-line")).textContent).toBe("Ayesha asked for changes · 2 open");
  });
});

describe("Re-send from the panel carries the round's client forward", () => {
  /* `submitReview` mints a review token only when it is given an email, so a
     re-send that passes nothing produces a round the client can never open —
     while the button says it re-sent. */
  it("passes the round's invited email", async () => {
    const onResend = vi.fn().mockResolvedValue(undefined);
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount(makeComposer(), { onResend });
    fireEvent.click(await screen.findByRole("button", { name: "Re-send for review" }));
    fireEvent.click(await screen.findByRole("button", { name: "Send new review" }));
    await waitFor(() => expect(onResend).toHaveBeenCalledWith("client@example.test"));
  });

  it("passes undefined for an internal round, which stays internal", async () => {
    const onResend = vi.fn().mockResolvedValue(undefined);
    fetchCurrentRound.mockResolvedValue(round({ invitedEmail: null, openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount(makeComposer(), { onResend });
    fireEvent.click(await screen.findByRole("button", { name: "Re-send for review" }));
    fireEvent.click(await screen.findByRole("button", { name: "Send new review" }));
    await waitFor(() => expect(onResend).toHaveBeenCalledWith(undefined));
  });

  it("reloads the round after the re-send lands", async () => {
    let release: () => void = () => {};
    const onResend = vi.fn(() => new Promise<void>((r) => { release = r; }));
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount(makeComposer(), { onResend });
    fireEvent.click(await screen.findByRole("button", { name: "Re-send for review" }));
    fireEvent.click(await screen.findByRole("button", { name: "Send new review" }));
    expect(await screen.findByRole("button", { name: /Sending round 2…/ })).toBeTruthy();
    release();
    await waitFor(() => expect(fetchCurrentRound).toHaveBeenCalledTimes(2));
  });
});
