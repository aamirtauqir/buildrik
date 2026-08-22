/**
 * ReviewTab — the panel's own 13 boards.
 *
 * Rewritten with the rebuild. The previous suite asserted a "Show resolved"
 * toggle, an overflow menu holding Revoke, and a bare "Re-send" button: that
 * was the pre-board panel, and a test protecting removed design is how
 * "No pages yet" survived for months (PageList.test.tsx:55).
 *
 * What it protects now: the frame every board shares (progress "N of M", the
 * sent line, the round line, Compare, one primary button whose label is the
 * state), the bodies that differ per board, and the behaviours the boards
 * imply — the re-send confirm REPLACING the primary, the revoke confirm being
 * inline and race-safe, resolve reaching the canvas.
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
  fetchApprovedSnapshot: vi.fn(),
  /* RoleService reads currentSiteId, and the panel now asks for the role
     so a VIEWER gets the send control disabled with its reason — the
     gating that did not travel with the control when it moved here. */
  currentSiteId: () => "site_test",
}));

import { ReviewTab } from "../ReviewTab";

const ROUND = {
  id: "r1",
  status: "PENDING",
  invitedEmail: "sara@client.com",
  reviewerName: "Sara Khan",
  revoked: false,
  resolvedAt: null,
  createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  revision: "2026-07-21T09:00:00.000Z",
  roundNumber: 2,
  totalRounds: 3,
  openCommentCount: 1,
};
const COMMENTS = [
  { id: "c1", body: "hero photo is too dark", pageId: "page-home", x: 0.5, y: 0.2, targetSelector: null, status: "OPEN", authorKind: "client", authorName: "Sara Khan", createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString() },
  { id: "c2", body: "on it, swapping the image", pageId: "page-home", x: null, y: null, targetSelector: null, status: "OPEN", authorKind: "internal", authorName: null, createdAt: new Date(Date.now() - 86_400_000).toISOString() },
  { id: "c3", body: "menu prices wrong", pageId: "page-menu", x: null, y: null, targetSelector: null, status: "RESOLVED", authorKind: "client", authorName: "Sara Khan", createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString() },
];

function renderTab(props = {}) {
  return render(<ReviewTab onResend={vi.fn(() => Promise.resolve())} {...props} />);
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

describe("the frame every board shares", () => {
  it("counts resolved of total, and says who it went to and when", async () => {
    renderTab();
    expect(await screen.findByText("1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Sent 2d ago · Sara Khan")).toBeInTheDocument();
    expect(screen.getByText("Round 2 of 3")).toBeInTheDocument();
  });

  /* The round line is deliberately arrow-less: no endpoint returns an older
     round's comments, and a chevron that cannot move is a dead control. */
  it("has no round pager", async () => {
    renderTab();
    await screen.findByText("Round 2 of 3");
    expect(screen.queryByRole("button", { name: /previous round|next round/i })).not.toBeInTheDocument();
  });
});

describe("load states", () => {
  it("quotes each comment and groups it under its page", async () => {
    renderTab();
    expect(await screen.findByText(/hero photo is too dark/)).toBeInTheDocument();
    expect(screen.getByText(/on it, swapping the image/)).toBeInTheDocument();
    // Board 156:2 marks where the open thread starts.
    expect(screen.getByText(/^Open · /)).toBeInTheDocument();
  });

  /* Board 156:2 labels the group with the page's NAME. Without a composer
     there is nothing to resolve the id against, so the id is the fallback —
     but with one, an id must never reach the screen. */
  it("labels a group with the page name, not the page id", async () => {
    const composer = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      elements: { getAllPages: () => [{ id: "page-home", name: "Home" }] },
    };
    renderTab({ composer });
    expect(await screen.findByText("Open · Home")).toBeInTheDocument();
    expect(screen.queryByText(/page-home/)).not.toBeInTheDocument();
  });

  it("shows a never-sent state when there is no round", async () => {
    fetchCurrentRound.mockResolvedValue(null);
    fetchReviewComments.mockResolvedValue([]);
    renderTab();
    expect(await screen.findByText(/No review yet/i)).toBeInTheDocument();
    /* Rewritten 2026-08-23. This used to assert the instruction "Open client
       view from the Site menu, then use Send for review there", which named a
       door that has since been shut: client view is a view now and carries no
       owner controls. So the panel carries the control itself — a state that
       tells you to go somewhere else is one redirect away from being wrong
       again, which is exactly how this line got written the first time. */
    expect(
      await screen.findByRole("button", { name: /Send for review/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Open client view from the Site menu/i)).toBeNull();
  });

  /* Board 453:3974 — the failure is stated in red and the reassurance under
     it; it is NEVER the empty state (DF5, fake-empty). */
  it("shows the load failure and a Try again, not an empty thread", async () => {
    fetchCurrentRound.mockRejectedValueOnce(new Error("network"));
    fetchReviewComments.mockRejectedValueOnce(new Error("network"));
    renderTab();
    expect(await screen.findByText("Couldn't load this review round.")).toBeInTheDocument();
    expect(screen.getByText(/Your work is safe/)).toBeInTheDocument();
    expect(screen.queryByText(/has not commented yet/i)).not.toBeInTheDocument();

    fetchCurrentRound.mockResolvedValue(ROUND);
    fetchReviewComments.mockResolvedValue(COMMENTS);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText(/hero photo is too dark/)).toBeInTheDocument();
  });

  it("board 157:221 — sent, nothing back yet", async () => {
    fetchReviewComments.mockResolvedValue([]);
    renderTab();
    expect(await screen.findByText("Sara Khan has not commented yet.")).toBeInTheDocument();
    expect(screen.getByText("You will be notified.")).toBeInTheDocument();
  });

  it("board 157:58 — everything resolved names the next round", async () => {
    fetchReviewComments.mockResolvedValue([{ ...COMMENTS[2] }]);
    renderTab();
    expect(await screen.findByText("Everything is resolved.")).toBeInTheDocument();
    expect(screen.getByText("1 of 1 — ready to send round 3.")).toBeInTheDocument();
  });

  it("board 158:162 — a revoked link keeps the comments and offers a new link", async () => {
    fetchCurrentRound.mockResolvedValue({ ...ROUND, revoked: true });
    renderTab();
    expect(await screen.findByText("This review link was revoked.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send a new link" })).toBeInTheDocument();
    // Revoking twice is not a thing.
    expect(screen.queryByRole("button", { name: "Revoke link" })).not.toBeInTheDocument();
  });

  /* Two kinds of round reach this panel and the boards only draw one. A round
     submitted from the dashboard's "Send for Review" carries no clientEmail, so
     `review.service.ts` mints no token — there is no link, and every string
     here named one. That is also the round that can wedge publish, so the copy
     it shows while the user digs their way out has to describe what actually
     happened. */
  it("a round with no client link is withdrawn, not revoked, and names no link", async () => {
    fetchCurrentRound.mockResolvedValue({ ...ROUND, invitedEmail: null, reviewerName: null, revoked: true });
    renderTab();
    expect(await screen.findByText("This review request was withdrawn.")).toBeInTheDocument();
    expect(screen.queryByText(/link was revoked/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send for review again" })).toBeInTheDocument();
  });

  it("asks to withdraw, not to revoke a link, when there is no client link", async () => {
    fetchCurrentRound.mockResolvedValue({ ...ROUND, invitedEmail: null, reviewerName: null });
    renderTab();
    fireEvent.click(await screen.findByRole("button", { name: "Withdraw request" }));
    expect(await screen.findByRole("alertdialog", { name: "Withdraw this review request?" })).toBeInTheDocument();
    expect(screen.queryByText(/lose access/i)).not.toBeInTheDocument();
  });

  it("keeps the client-link wording when there IS a client link", async () => {
    fetchCurrentRound.mockResolvedValue({ ...ROUND, revoked: true });
    renderTab();
    expect(await screen.findByText("This review link was revoked.")).toBeInTheDocument();
  });

  it("resolved comments are collapsed behind a count until asked for", async () => {
    renderTab();
    await screen.findByText(/hero photo is too dark/);
    expect(screen.queryByText(/menu prices wrong/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /resolved/i }));
    expect(await screen.findByText(/menu prices wrong/)).toBeInTheDocument();
  });
});

describe("actions", () => {
  it("posts an internal reply then reloads the thread", async () => {
    renderTab();
    await screen.findByText(/hero photo is too dark/);
    fireEvent.change(screen.getByPlaceholderText(/reply/i), { target: { value: "fixed the contrast" } });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    await waitFor(() => expect(postReply).toHaveBeenCalledWith("fixed the contrast", "page-home"));
    await waitFor(() => expect(fetchReviewComments.mock.calls.length).toBeGreaterThan(1));
  });

  it("resolves a comment", async () => {
    renderTab();
    await screen.findByText(/hero photo is too dark/);
    const row = screen.getByText(/hero photo is too dark/).closest("[data-comment-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /resolve/i }));
    await waitFor(() => expect(resolveReviewComment).toHaveBeenCalledWith("c1", "RESOLVED"));
  });

  /* The canvas draws these same comments as pins and refetches on
     "comments:refresh". Nothing emitted it, so resolving greyed the row here
     and left the pin on the canvas open. */
  it("tells the canvas to refetch its pins after a resolve", async () => {
    const composer = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };
    renderTab({ composer });
    await screen.findByText(/hero photo is too dark/);
    const row = screen.getByText(/hero photo is too dark/).closest("[data-comment-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /resolve/i }));
    await waitFor(() => expect(composer.emit).toHaveBeenCalledWith("comments:refresh", {}));
  });

  /* Board 158:2. Two live re-send affordances at once is how a client's link
     gets invalidated by the wrong click, so the confirm REPLACES the button. */
  it("re-sending with open comments asks first, and the confirm replaces the primary", async () => {
    const onResend = vi.fn(() => Promise.resolve());
    renderTab({ onResend });
    await screen.findByText(/hero photo is too dark/);
    fireEvent.click(screen.getByRole("button", { name: "Re-send for review" }));

    expect(screen.getByText(/2 comments are still open\. Re-send anyway\?/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Re-send for review" })).not.toBeInTheDocument();
    expect(onResend).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Re-send" }));
    await waitFor(() => expect(onResend).toHaveBeenCalled());
  });

  /* Board 158:57 — while it is in flight the button says which round is being
     sent, and cannot be pressed again. */
  it("names the round it is sending while the re-send is in flight", async () => {
    fetchReviewComments.mockResolvedValue([COMMENTS[2]]);
    let release!: () => void;
    const onResend = vi.fn(() => new Promise<void>((r) => (release = r)));
    renderTab({ onResend });
    await screen.findByText("Everything is resolved.");
    fireEvent.click(screen.getByRole("button", { name: "Re-send for review" }));

    const btn = await screen.findByRole("button", { name: "Sending round 3…" });
    expect(btn).toBeDisabled();
    release();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Re-send for review" })).toBeEnabled(),
    );
  });

  it("a clean round re-sends without a confirm", async () => {
    fetchReviewComments.mockResolvedValue([COMMENTS[2]]);
    const onResend = vi.fn(() => Promise.resolve());
    renderTab({ onResend });
    await screen.findByText("Everything is resolved.");
    fireEvent.click(screen.getByRole("button", { name: "Re-send for review" }));
    await waitFor(() => expect(onResend).toHaveBeenCalled());
  });

  /* Board 158:105 — the revoke confirm is an inline panel at the top of the
     panel, not a modal, and it carries the revision so a re-send that landed
     first cannot be revoked by a stale click. */
  it("revoke asks inline and passes the revision", async () => {
    renderTab();
    await screen.findByText(/hero photo is too dark/);
    expect(screen.queryByText("Revoke this review link?")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revoke link" }));
    expect(screen.getByText("Revoke this review link?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(revokeReview).toHaveBeenCalledWith("r1", "2026-07-21T09:00:00.000Z"));
  });

  /* The harness supplies onResend by default, which is exactly why nothing
     here ever caught that the SHELL did not. */
  it("disables the primary when no re-send path was supplied", async () => {
    fetchReviewComments.mockResolvedValue([]);
    renderTab({ onResend: undefined });
    const btn = await screen.findByRole("button", { name: "Re-send for review" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", "Re-send isn't available here");
  });

  it("enables the primary once a path is supplied", async () => {
    fetchReviewComments.mockResolvedValue([]);
    renderTab();
    expect(await screen.findByRole("button", { name: "Re-send for review" })).toBeEnabled();
  });
});


describe("ReviewTab — board 157:2 fills the DETACHED band", () => {
  /* The band is the one row in the list whose comment lost its anchor. The
     board fills it — measured off the frame at #FCFCEA on #723B13, against
     #F3F4F6 for the OPEN and RESOLVED bands beside it. It shipped grey with
     amber words only, which reads as the same band as its neighbours. */
  function makeComposer(orphanIds: string[]) {
    const handlers: Record<string, ((p: unknown) => void)[]> = {};
    return {
      on: (evt: string, fn: (p: unknown) => void) => {
        (handlers[evt] ||= []).push(fn);
      },
      off: () => {},
      emit: (evt: string) => {
        if (evt === "comments:orphans-request") {
          for (const fn of handlers["comments:orphans"] || []) fn({ ids: orphanIds });
        }
      },
    };
  }

  it("gives the band the warning tint, not the neutral one", async () => {
    const composer = makeComposer(["c1"]);
    renderTab({ composer });

    const band = await screen.findByText("Detached");
    const row = band.closest("div[style]") as HTMLElement;
    expect(row.style.background).toContain("--bk-warning-tint");
    expect(row.style.color).toContain("--bk-warning-text");
  });

  it("leaves the other bands neutral", async () => {
    const composer = makeComposer([]);
    renderTab({ composer });

    const open = await screen.findByText(/^Open · /i);
    const band = open.closest("div") as HTMLElement;
    expect(band.style.background).toBe("");
  });
});
