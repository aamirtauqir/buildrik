/**
 * ReviewTab — the panel's own 13 boards.
 *
 * Rewritten with the rebuild. The previous suite asserted a "Show resolved"
 * toggle, an overflow menu holding Revoke, and a bare "Re-send" button: that
 * was the pre-board panel, and a test protecting removed design is how
 * "No pages yet" survived for months (PageList.test.tsx:55).
 *
 * What it protects now: the frame every board shares (the status line, the
 * ⋯ menu's Compare rounds / Round history, one primary button whose label is
 * the state), the bodies that differ per board, and the behaviours the boards
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
const reattachReviewComment = vi.fn();

vi.mock("../../../../../services/ReviewService", () => ({
  fetchRounds: vi.fn(() => Promise.resolve([])),
  fetchCurrentRound: (...a: unknown[]) => fetchCurrentRound(...a),
  fetchReviewComments: (...a: unknown[]) => fetchReviewComments(...a),
  postReply: (...a: unknown[]) => postReply(...a),
  resolveReviewComment: (...a: unknown[]) => resolveReviewComment(...a),
  revokeReview: (...a: unknown[]) => revokeReview(...a),
  reattachReviewComment: (...a: unknown[]) => reattachReviewComment(...a),
  fetchApprovedSnapshot: vi.fn(),
  /* RoleService reads currentSiteId, and the panel now asks for the role
     so a VIEWER gets the send control disabled with its reason — the
     gating that did not travel with the control when it moved here. */
  currentSiteId: () => "site_test",
}));

import { fetchRounds } from "../../../../../services/ReviewService";
import { ReviewTab } from "../ReviewTab";
import { ToastProvider } from "@/editor/chrome-ui";

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
  return render(
    <ToastProvider>
      <ReviewTab onResend={vi.fn(() => Promise.resolve())} {...props} />
    </ToastProvider>,
  );
}

/* Locate › polls for the anchor for up to 5s (review/locate.ts). Real
   timers let that poll outlive the file and throw `document is not defined`
   after jsdom is torn down, which failed CI with every test green. Fake
   timers that still advance keep waitFor working; afterEach drops the rest. */
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  [fetchCurrentRound, fetchReviewComments, postReply, resolveReviewComment, revokeReview].forEach((m) => m.mockReset());
  fetchCurrentRound.mockResolvedValue(ROUND);
  fetchReviewComments.mockResolvedValue(COMMENTS);
  postReply.mockResolvedValue(undefined);
  resolveReviewComment.mockResolvedValue(undefined);
  revokeReview.mockResolvedValue({ revoked: true });
});
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("the frame every board shares (board 4418:115784)", () => {
  it("is one status line — counts and who it waits on; no progress bar, no round strip, no Compare button", async () => {
    renderTab();
    expect(await screen.findByTestId("review-status-line")).toHaveTextContent("2 open · 1 resolved · Awaiting Sara Khan");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText(/Round 2 of 3/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Compare with approved" })).toBeNull();
    expect(screen.queryByRole("button", { name: /previous round|next round/i })).not.toBeInTheDocument();
  });

  it("the panel ⋯ holds Compare rounds and Round history ›, as board 7071:79114 draws", async () => {
    const emit = vi.fn();
    renderTab({ composer: { on: vi.fn(), off: vi.fn(), emit, elements: { getAllPages: () => [] } } });
    fireEvent.click(await screen.findByTestId("review-round-menu"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Compare rounds" }));
    expect(emit).toHaveBeenCalledWith("ui:compare-open", expect.objectContaining({ left: { kind: "approved" }, right: { kind: "current" } }));
    fireEvent.click(screen.getByTestId("review-round-menu"));
    expect(await screen.findByRole("menuitem", { name: "Round history ›" })).toBeInTheDocument();
  });

  it("Send is the blue primary even while disabled", async () => {
    renderTab();
    const send = await screen.findByRole("button", { name: "Send" });
    expect(send.className).toContain("tw:disabled:bg-[var(--bk-accent)]");
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
       door that has since been shut: view mode is a view now and carries no
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

  it("board 4418:116688 — everything resolved points at the approval above", async () => {
    fetchReviewComments.mockResolvedValue([{ ...COMMENTS[2] }]);
    renderTab();
    expect(await screen.findByText("Everything is resolved.")).toBeInTheDocument();
    expect(screen.getByText("All comments are resolved. Client approval is shown above.")).toBeInTheDocument();
  });

  it("board 158:162 — a revoked link keeps the comments and offers a new link", async () => {
    fetchCurrentRound.mockResolvedValue({ ...ROUND, revoked: true });
    renderTab();
    expect(await screen.findByText("This review link was revoked.")).toBeInTheDocument();
    expect(screen.getByTestId("review-status-line").textContent).toMatch(/· Round \d+$/);
    // Board 4418:116040 draws no footer primary: the new link is a ⋯ row.
    fireEvent.click(screen.getByTestId("review-round-menu"));
    expect(await screen.findByRole("menuitem", { name: "Send a new link" })).toBeInTheDocument();
    // Revoking twice is not a thing.
    expect(screen.queryByRole("menuitem", { name: "Revoke link" })).not.toBeInTheDocument();
    // …and its rows carry no Resolve / Copy link line.
    expect(screen.queryByRole("button", { name: /^Resolve$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy link" })).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByTestId("review-round-menu"));
    expect(await screen.findByRole("menuitem", { name: "Send for review again" })).toBeInTheDocument();
  });

  it("asks to withdraw, not to revoke a link, when there is no client link", async () => {
    fetchCurrentRound.mockResolvedValue({ ...ROUND, invitedEmail: null, reviewerName: null });
    renderTab();
    fireEvent.click(await screen.findByTestId("review-round-menu"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Withdraw request" }));
    expect(await screen.findByText("Withdraw this review request?")).toBeInTheDocument();
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
  it("posts a team-only page comment then reloads the thread", async () => {
    renderTab();
    await screen.findByText(/hero photo is too dark/);
    fireEvent.change(screen.getByPlaceholderText(/^Comment on /), { target: { value: "fixed the contrast" } });
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

  /* Board 4418:120052 (G1-058): the re-send asks in a modal, which names
     who gets the new link and what round it starts. */
  it("re-sending asks in a modal first, then sends", async () => {
    const onResend = vi.fn(() => Promise.resolve());
    renderTab({ onResend });
    await screen.findByText(/hero photo is too dark/);
    fireEvent.click(screen.getByTestId("review-round-menu"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Re-send review link" }));
    expect(await screen.findByText(/^Send a new review to /)).toBeInTheDocument();
    expect(screen.getByText(/the previous link stops working/)).toBeInTheDocument();
    expect(screen.getByText("Sending starts the next review round.")).toBeInTheDocument();
    expect(onResend).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Send new review" }));
    await waitFor(() => expect(onResend).toHaveBeenCalled());
  });

  /* Board 158:57 — while it is in flight the panel says which round is being
     sent, and the re-send cannot be pressed again. */
  it("names the round it is sending while the re-send is in flight", async () => {
    fetchReviewComments.mockResolvedValue([COMMENTS[2]]);
    let release!: () => void;
    const onResend = vi.fn(() => new Promise<void>((r) => (release = r)));
    renderTab({ onResend });
    await screen.findByText("Everything is resolved.");
    fireEvent.click(screen.getByTestId("review-round-menu"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Re-send review link" }));
    fireEvent.click(await screen.findByRole("button", { name: "Send new review" }));

    expect(await screen.findByText("Sending round 3…")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("review-round-menu"));
    expect(await screen.findByTestId("review-menu-resend")).toBeDisabled();
    release();
    await waitFor(() => expect(screen.queryByText("Sending round 3…")).not.toBeInTheDocument());
  });

  it("a clean round asks too — the re-send still kills the current link", async () => {
    fetchReviewComments.mockResolvedValue([COMMENTS[2]]);
    const onResend = vi.fn(() => Promise.resolve());
    renderTab({ onResend });
    await screen.findByText("Everything is resolved.");
    fireEvent.click(screen.getByTestId("review-round-menu"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Re-send review link" }));
    expect(await screen.findByRole("button", { name: "Send new review" })).toBeInTheDocument();
    expect(onResend).not.toHaveBeenCalled();
  });

  /* Board 7071:79114 + 6879:67202 (G1-059): revoke lives in the panel's ⋯
     menu and asks in a modal, carrying the revision so a re-send that landed
     first cannot be revoked by a stale click. */
  it("revoke is a ⋯ menu row with a modal, and passes the revision", async () => {
    renderTab();
    await screen.findByText(/hero photo is too dark/);
    expect(screen.queryByRole("button", { name: "Revoke link" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("review-round-menu"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Revoke link" }));
    expect(await screen.findByText("Revoke this review link?")).toBeInTheDocument();
    expect(screen.getByText("Revoking does not change the approval lock or any comment.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revoke link" }));
    await waitFor(() => expect(revokeReview).toHaveBeenCalledWith("r1", "2026-07-21T09:00:00.000Z"));
  });

  it("the ⋯ menu's Re-send opens the same modal", async () => {
    renderTab();
    await screen.findByText(/hero photo is too dark/);
    fireEvent.click(screen.getByTestId("review-round-menu"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Re-send review link" }));
    expect(await screen.findByRole("button", { name: "Send new review" })).toBeInTheDocument();
  });

  it("the composer is the board's page comment, and still says it is team-only (G1-056)", async () => {
    renderTab({ composer: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), elements: { getAllPages: () => [{ id: "page-home", name: "Home" }] } } });
    await screen.findByText(/hero photo is too dark/);
    expect(screen.getByPlaceholderText("Comment on Home…")).toBeInTheDocument();
    expect(screen.getByTestId("review-composer-meta").textContent).toBe("Page comment · Home · team only");
  });

  /* The harness supplies onResend by default, which is exactly why nothing
     here ever caught that the SHELL did not. */
  it("offers no re-send row when no re-send path was supplied", async () => {
    fetchReviewComments.mockResolvedValue([]);
    renderTab({ onResend: undefined });
    fireEvent.click(await screen.findByTestId("review-round-menu"));
    await screen.findByRole("menuitem", { name: "Compare rounds" });
    expect(screen.queryByTestId("review-menu-resend")).not.toBeInTheDocument();
  });

  it("offers the re-send row once a path is supplied", async () => {
    fetchReviewComments.mockResolvedValue([]);
    renderTab();
    fireEvent.click(await screen.findByTestId("review-round-menu"));
    expect(await screen.findByRole("menuitem", { name: "Re-send review link" })).toBeEnabled();
  });

  /* Boards 4418:117140–118407: a comment resolved here stays in its page
     group under a RESOLVED band; the older ones fold under "Earlier resolved". */
  it("a comment resolved in the panel stays in place under a Resolved band", async () => {
    fetchReviewComments.mockResolvedValue([COMMENTS[0], COMMENTS[2]]);
    renderTab();
    const row = (await screen.findByText(/hero photo is too dark/)).closest("[data-comment-row]") as HTMLElement;
    fetchReviewComments.mockResolvedValue([{ ...COMMENTS[0], status: "RESOLVED" }, COMMENTS[2]]);
    fireEvent.click(within(row).getByRole("button", { name: /^resolve$/i }));
    await waitFor(() => expect(screen.getByText(/^Resolved · /)).toBeInTheDocument());
    expect(screen.getByText(/hero photo is too dark/)).toBeInTheDocument();
    expect(screen.getByTestId("review-resolved-band").textContent).toBe("Earlier resolved");
  });

  it("board 4418:116264 — a failed resolve names the comment and retries in place", async () => {
    resolveReviewComment.mockRejectedValueOnce(new Error("boom"));
    renderTab();
    const row = (await screen.findByText(/hero photo is too dark/)).closest("[data-comment-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /^resolve$/i }));
    expect(await screen.findByText("Could not update this comment. It is still open.")).toBeInTheDocument();
    expect(screen.getByTestId("review-resolve-failed").textContent).toMatch(/hero photo is too dark.*is still open\./);
    fireEvent.click(screen.getByRole("button", { name: "Retry resolve" }));
    await waitFor(() => expect(screen.queryByTestId("review-resolve-failed")).not.toBeInTheDocument());
  });
});


describe("ReviewTab — board 157:2 fills the DETACHED band", () => {
  /* The band is the one row in the list whose comment lost its anchor. The
     board fills it — measured off the frame at #FCFCEA on `var(--bk-yellow-800)`, against
     `var(--bk-gray-100)` for the OPEN and RESOLVED bands beside it. It shipped grey with
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

  it("board 4418:118661 — a comment re-attached here gets a band naming its element", async () => {
    reattachReviewComment.mockResolvedValue(undefined);
    const hours = {
      getId: () => "el-hours",
      getType: () => "text",
      getContent: () => "Open 5pm",
      getCustomData: (k: string) => (k === "layerName" ? "Hours" : null),
      getChildren: () => [],
    };
    const root = { getId: () => "root", getType: () => "container", getContent: () => "", getCustomData: () => null, getChildren: () => [hours] };
    const composer = {
      ...makeComposer(["c1"]),
      elements: {
        getAllPages: () => [{ id: "page-home", name: "Home" }],
        getActivePage: () => ({ id: "page-home", root: { id: "root" } }),
        setActivePage: vi.fn(),
        getElement: (id: string) => (id === "root" ? root : id === "el-hours" ? hours : null),
      },
    };
    renderTab({ composer });
    fireEvent.click(await screen.findByRole("button", { name: "Reattach comment" }));
    fireEvent.click(await screen.findByRole("radio", { name: /Hours/ }));
    fireEvent.click(screen.getByTestId("reattach-submit"));
    await waitFor(() => expect(reattachReviewComment).toHaveBeenCalled());
    expect(await screen.findByText("Open · Home / Hours")).toBeInTheDocument();
  });

  it("leaves the other bands neutral", async () => {
    const composer = makeComposer([]);
    renderTab({ composer });

    const open = await screen.findByText(/^Open · /i);
    const band = open.closest("div") as HTMLElement;
    expect(band.style.background).toBe("");
  });
});

describe("the round history modal (board 4418:172775)", () => {
  it("opens from the ⋯ menu, newest first, and compares the approved baseline with the current round", async () => {
    vi.mocked(fetchRounds).mockResolvedValueOnce([
      { id: "rr-1", roundNumber: 1, status: "APPROVED", reviewerName: "Sara Khan", revoked: false, resolvedAt: "2026-08-10T10:00:00Z", createdAt: "2026-08-08T10:00:00Z" },
      { id: "rr-old", roundNumber: 2, status: "APPROVED", reviewerName: "Sara Khan", revoked: false, resolvedAt: "2026-08-20T10:00:00Z", createdAt: "2026-08-18T10:00:00Z" },
      { id: "r1", roundNumber: 3, status: "PENDING", reviewerName: null, revoked: false, resolvedAt: null, createdAt: "2026-08-25T10:00:00Z" },
    ]);
    renderTab();
    fireEvent.click(await screen.findByTestId("review-round-menu"));
    fireEvent.click(await screen.findByTestId("review-menu-round-history"));
    expect(await screen.findByText("Review round history")).toBeInTheDocument();
    expect(await screen.findByTestId("review-round-3")).toHaveTextContent("Round 3 · Current · Awaiting approval");
    expect(screen.getByTestId("review-round-2")).toHaveTextContent(/Round 2 · Approved baseline.*approved \d+d ago/);
    expect(screen.getByTestId("review-round-1")).toHaveTextContent(/Initial snapshot.*nothing to compare this against/);
    expect(screen.getByRole("button", { name: "Return to current review" })).toBeInTheDocument();
  });

  it("a failed history read says so and offers a retry — it does not impersonate 'no history'", async () => {
    vi.mocked(fetchRounds).mockRejectedValueOnce(new Error("net"));
    renderTab();
    fireEvent.click(await screen.findByTestId("review-round-menu"));
    fireEvent.click(await screen.findByTestId("review-menu-round-history"));
    expect(await screen.findByText(/Couldn't load the history/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("B3 — per-row Locate › (G1-030) and Copy link (G1-031), laid out as board 4418:115784", () => {
  /* Locate › goes through `locateComment` (page first, then select); Copy
     link writes window.location.href to the clipboard. */

  function makeComposer() {
    const handlers: Record<string, ((p: unknown) => void)[]> = {};
    const activePage = { id: "page-home", name: "Home" };
    const target = { id: "el-hero", type: "image", name: "Hero" };
    return {
      on: (evt: string, fn: (p: unknown) => void) => {
        (handlers[evt] ||= []).push(fn);
      },
      off: () => {},
      emit: vi.fn(),
      selection: { select: vi.fn() },
      elements: {
        getAllPages: () => [{ id: "page-home", name: "Home" }, { id: "page-menu", name: "Menu" }],
        getActivePage: () => activePage,
        setActivePage: vi.fn((id: string) => {
          activePage.id = id;
        }),
        getElement: vi.fn((sel: string) => (sel === "el-hero" ? target : null)),
      },
    };
  }

  beforeEach(() => {
    Object.assign(window, { location: { ...window.location, href: "http://localhost:5051/?siteId=abc" } });
  });

  it("an anchored row: Locate › trailing, Resolve and Copy link under it, no per-row ⋯", async () => {
    fetchReviewComments.mockResolvedValue([
      { ...COMMENTS[0], targetSelector: `[data-buildrick-id="el-hero"]`, pageId: "page-home" },
    ]);
    renderTab();
    const row = (await screen.findByText(/hero photo is too dark/)).closest("[data-comment-row]") as HTMLElement;
    expect(within(row).getByRole("button", { name: "Locate ›" })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Resolve" })).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "More actions" })).toBeNull();
  });

  it("boards 4418:172804–173326 — Locate › tops the column with a Comment located block", async () => {
    fetchReviewComments.mockResolvedValue([
      { ...COMMENTS[0], targetSelector: `[data-buildrick-id="el-hero"]`, pageId: "page-home" },
    ]);
    const onClose = vi.fn();
    renderTab({ composer: makeComposer(), onClose });
    fireEvent.click(await screen.findByRole("button", { name: "Locate ›" }));
    const block = await screen.findByTestId("review-located");
    expect(block).toHaveTextContent("Home · Comment located");
    expect(block).toHaveTextContent("Sara Khan: “hero photo is too dark”");
    fireEvent.click(within(block).getByTestId("review-located-edit"));
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(within(block).getByRole("button", { name: "Back to all comments" }));
    expect(screen.queryByTestId("review-located")).not.toBeInTheDocument();
  });

  it("Locate › switches page when the comment lives on another one, then selects its element", async () => {
    fetchReviewComments.mockResolvedValue([
      { ...COMMENTS[0], targetSelector: `[data-buildrick-id="el-hero"]`, pageId: "page-menu" },
    ]);
    const composer = makeComposer();
    const order: string[] = [];
    composer.elements.setActivePage.mockImplementation(() => order.push("page"));
    composer.selection.select.mockImplementation(() => order.push("select"));
    renderTab({ composer });
    const row = (await screen.findByText(/hero photo is too dark/)).closest("[data-comment-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Locate ›" }));
    expect(composer.elements.setActivePage).toHaveBeenCalledWith("page-menu");
    expect(composer.selection.select).toHaveBeenCalledWith({ id: "el-hero", type: "image", name: "Hero" });
    expect(order).toEqual(["page", "select"]);
  });

  it("Locate › on an anchor deleted since load moves the row to Detached and says why (#27)", async () => {
    fetchReviewComments.mockResolvedValue([
      { ...COMMENTS[0], targetSelector: `[data-buildrick-id="el-gone"]`, pageId: "page-home" },
    ]);
    const composer = makeComposer();
    renderTab({ composer });
    const row = (await screen.findByText(/hero photo is too dark/)).closest("[data-comment-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Locate ›" }));
    expect(composer.selection.select).not.toHaveBeenCalled();
    expect(await screen.findByText(/lost its anchor/i)).toBeInTheDocument();
    const moved = (await screen.findByTestId("review-detached-band")).parentElement as HTMLElement;
    expect(within(moved).getByText(/hero photo is too dark/)).toBeInTheDocument();
    expect(within(moved).queryByRole("button", { name: "Locate ›" })).toBeNull();
  });

  it("clicking the comment body locates it too; its buttons stay its buttons", async () => {
    fetchReviewComments.mockResolvedValue([
      { ...COMMENTS[0], targetSelector: `[data-buildrick-id="el-hero"]`, pageId: "page-home" },
    ]);
    const composer = makeComposer();
    renderTab({ composer });
    const body = await screen.findByText(/hero photo is too dark/);
    fireEvent.click(body);
    expect(composer.selection.select).toHaveBeenCalledTimes(1);
    const row = body.closest("[data-comment-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Resolve" }));
    expect(composer.selection.select).toHaveBeenCalledTimes(1);
  });

  it("an unanchored comment has no Locate ›", async () => {
    fetchReviewComments.mockResolvedValue([COMMENTS[0]]); // targetSelector: null
    renderTab({ composer: makeComposer() });
    const row = (await screen.findByText(/hero photo is too dark/)).closest("[data-comment-row]") as HTMLElement;
    expect(within(row).queryByRole("button", { name: "Locate ›" })).toBeNull();
  });

  it("Copy link writes the comment's ?el=&page= deep link to the clipboard", async () => {
    fetchReviewComments.mockResolvedValue([
      { ...COMMENTS[0], targetSelector: `[data-buildrick-id="el-hero"]`, pageId: "page-home" },
    ]);
    const writeText = vi.fn((_text: string) => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    renderTab();
    const row = (await screen.findByText(/hero photo is too dark/)).closest("[data-comment-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const url = new URL(writeText.mock.calls[0][0]);
    expect(url.searchParams.get("el")).toBe("el-hero");
    expect(url.searchParams.get("page")).toBe("page-home");
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });

  it("Copy link falls back to the address-bar notice when the clipboard throws", async () => {
    fetchReviewComments.mockResolvedValue([
      { ...COMMENTS[0], targetSelector: `[data-buildrick-id="el-hero"]`, pageId: "page-home" },
    ]);
    Object.assign(navigator, { clipboard: { writeText: vi.fn(() => Promise.reject(new Error("denied"))) } });
    renderTab();
    const row = (await screen.findByText(/hero photo is too dark/)).closest("[data-comment-row]") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Copy link" }));
    expect(await screen.findByText(/Couldn't copy the link/i)).toBeInTheDocument();
  });
});

describe("ReviewTab — opened from the Activity panel", () => {
  it("draws ‹ Activity, which goes back to the Activity panel", async () => {
    const emit = vi.fn();
    renderTab({ fromActivity: true, composer: { on: vi.fn(), off: vi.fn(), emit, elements: { getAllPages: () => [] } } });
    /* Past the loading state: its header is replaced once the round lands, and
       a click on the replaced node reaches nothing. */
    await screen.findByTestId("review-status-line");
    fireEvent.click(screen.getByRole("button", { name: "‹ Activity" }));
    expect(emit).toHaveBeenCalledWith("panel:open", { panel: "activity" });
  });

  it("no back row when opened any other way", async () => {
    renderTab();
    await screen.findByTestId("review-status-line");
    expect(screen.queryByTestId("back-to-activity")).toBeNull();
  });
});
