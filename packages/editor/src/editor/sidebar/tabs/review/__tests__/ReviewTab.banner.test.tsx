/**
 * ReviewTab — the round card (2L9 B8-R01 237:8258; was the C2 round banner,
 * board B3-05 7571:191619) and the walk at the end of its filter row.
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

vi.mock("@/services/ReviewService", () => ({
  fetchRounds: vi.fn(() => Promise.resolve([])),
  fetchCurrentRound: (...a: unknown[]) => fetchCurrentRound(...a),
  fetchReviewComments: (...a: unknown[]) => fetchReviewComments(...a),
  postReply: vi.fn(),
  resolveReviewComment: vi.fn(),
  revokeReview: vi.fn(),
  fetchApprovedSnapshot: vi.fn(),
}));
// A-22: RoleService (which ReviewTab asks for the role) now resolves the
// site id through BuildrikSyncProvider.getSiteIdFromUrl (currentSiteId was
// a duplicate, deleted).
vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: () => "site_test",
}));
// locateComment polls getDOMElement for up to 5 s until the anchor renders.
// No canvas mounts here, so the poll outlived the test and threw "document is
// not defined" after jsdom was torn down — 2 unhandled errors that failed a
// fully green run (Dashboard tests, de87e3a32). Scrolling is locate.test.ts's
// subject; here the anchor is simply on screen.
vi.mock("@/engine/canvas/resize/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/engine/canvas/resize/utils")>()),
  getDOMElement: () => ({ scrollIntoView: () => {} }),
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

/** The re-send lives in the panel ⋯ menu (4418 Review boards draw no footer primary). */
async function openResend(name: string | RegExp = "Re-send review link") {
  fireEvent.click(await screen.findByTestId("review-round-menu"));
  fireEvent.click(await screen.findByRole("menuitem", { name }));
}

describe("the banner — when the board's band exists", () => {
  it("shows the count and the walk; Re-send is the panel's own", async () => {
    fetchCurrentRound.mockResolvedValue(round());
    fetchReviewComments.mockResolvedValue([comment(), comment({ id: "c2" }), comment({ id: "c3" })]);
    mount();
    expect(await screen.findByTestId("review-banner")).toBeTruthy();
    expect(screen.getByTestId("review-banner-line").textContent).toBe("◐ Awaiting · Ayesha (client@example.test)");
    expect(screen.getByTestId("review-banner-sent").textContent).toMatch(/^Sent \d{1,2} \w{3}|^Sent \w{3} \d{1,2}/);
    expect(screen.getByTestId("review-status-line").textContent).toBe("3 open · 0 resolved");
    expect(screen.getByRole("button", { name: "Next ›" })).toBeTruthy();
    /* No 4418 Review board draws a footer primary: the re-send is the
       panel ⋯ menu's row. */
    await openResend();
    expect(await screen.findByRole("button", { name: "Send new review" })).toBeTruthy();
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

describe("the round card — follows the round", () => {
  it("is absent with no round at all, and when the fetch fails", async () => {
    fetchCurrentRound.mockResolvedValue(null);
    fetchReviewComments.mockResolvedValue([]);
    mount();
    await waitFor(() => expect(fetchCurrentRound).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByLabelText("Loading review")).toBeNull());
    expect(screen.queryByTestId("review-banner")).toBeNull();
    cleanup();
    fetchCurrentRound.mockRejectedValue(new Error("offline"));
    fetchReviewComments.mockRejectedValue(new Error("offline"));
    mount();
    await waitFor(() => expect(screen.queryByLabelText("Loading review")).toBeNull());
    expect(screen.queryByTestId("review-banner")).toBeNull();
  });

  it("says an APPROVED round is approved, and a revoked link is revoked", async () => {
    fetchCurrentRound.mockResolvedValue(round({ status: "APPROVED" }));
    fetchReviewComments.mockResolvedValue([comment()]);
    mount();
    expect((await screen.findByTestId("review-banner-line")).textContent).toBe("◐ Approved · Ayesha (client@example.test)");
    cleanup();
    fetchCurrentRound.mockResolvedValue(round({ revoked: true }));
    mount();
    expect((await screen.findByTestId("review-banner-line")).textContent).toBe("◐ Link revoked · Ayesha (client@example.test)");
  });

  it("offers the client's link when the round still has one", async () => {
    fetchCurrentRound.mockResolvedValue(round({ token: "tok" }));
    fetchReviewComments.mockResolvedValue([]);
    mount();
    expect(await screen.findByTestId("review-copy-client-link")).toHaveTextContent("Copy link ⧉");
    cleanup();
    fetchCurrentRound.mockResolvedValue(round({ token: null }));
    mount();
    await screen.findByTestId("review-banner");
    expect(screen.queryByTestId("review-copy-client-link")).toBeNull();
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

describe("the round card — the link's facts (2L9 B8-R01 / R02)", () => {
  it("says when the reviewer opened it and how long the link works", async () => {
    fetchCurrentRound.mockResolvedValue(
      round({
        reviewerLastSeenAt: new Date(Date.now() - 2 * 3_600_000),
        expiresAt: new Date("2027-01-13T12:00:00Z"),
        linkExpired: false,
      }),
    );
    fetchReviewComments.mockResolvedValue([]);
    mount();
    expect((await screen.findByTestId("review-banner-line")).textContent).toBe("◐ Opened · Ayesha (client@example.test) · 2h ago");
    expect(screen.getByTestId("review-banner-sent").textContent).toMatch(/· link works until /);
  });

  it("an expired link says so and offers Re-send, which asks first", async () => {
    fetchCurrentRound.mockResolvedValue(round({ expiresAt: new Date("2026-01-01T12:00:00Z"), linkExpired: true }));
    fetchReviewComments.mockResolvedValue([]);
    mount();
    expect((await screen.findByTestId("review-banner-line")).textContent).toBe("◌ Link expired · Ayesha can no longer open it");
    expect(screen.getByTestId("review-banner-sent").textContent).toMatch(/· expired /);
    fireEvent.click(screen.getByTestId("review-card-resend"));
    expect(await screen.findByRole("button", { name: "Send new review" })).toBeTruthy();
  });
});

describe("the round card — a zero is not a status", () => {
  it("with nothing open on a pending round it names the wait, not a count", async () => {
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount();
    expect((await screen.findByTestId("review-banner-line")).textContent).toBe("◐ Awaiting · Ayesha (client@example.test)");
  });

  /* L5-034: a round sent with a blank client email ("keep this internal")
     has no client. */
  it("an internal round (no client invited) speaks no client language", async () => {
    fetchCurrentRound.mockResolvedValue(round({ invitedEmail: null, reviewerName: null, openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([comment({ status: "RESOLVED", authorKind: "internal", authorName: null })]);
    mount();
    expect((await screen.findByTestId("review-banner-line")).textContent).toBe("◐ Internal round — no client invited");
    expect(screen.getByTestId("review-status-line").textContent).toBe("0 open · 1 resolved");
    expect(screen.getByText("All comments are resolved.")).toBeTruthy();
    expect(screen.queryByText(/waiting on your client|Client approval/)).toBeNull();
  });

  it("names a changes-requested round, and offers the next round at the foot (B8-R05)", async () => {
    fetchCurrentRound.mockResolvedValue(round({ status: "CHANGES_REQUESTED" }));
    fetchReviewComments.mockResolvedValue([comment(), comment({ id: "c2", status: "RESOLVED" })]);
    mount();
    expect((await screen.findByTestId("review-banner-line")).textContent).toBe("◐ Changes requested · Ayesha (client@example.test)");
    const foot = screen.getByTestId("review-next-round");
    expect(foot).toHaveTextContent("Send Round 2 to Ayesha");
    expect(foot).toHaveTextContent("1 of 2 resolved");
    fireEvent.click(screen.getByRole("button", { name: "Send Round 2 to Ayesha" }));
    expect(await screen.findByRole("button", { name: "Send new review" })).toBeTruthy();
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
    await openResend();
    fireEvent.click(await screen.findByRole("button", { name: "Send new review" }));
    await waitFor(() => expect(onResend).toHaveBeenCalledWith("client@example.test", { preview: true }));
  });

  it("passes undefined for an internal round, which stays internal", async () => {
    const onResend = vi.fn().mockResolvedValue(undefined);
    fetchCurrentRound.mockResolvedValue(round({ invitedEmail: null, openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount(makeComposer(), { onResend });
    await openResend();
    fireEvent.click(await screen.findByRole("button", { name: "Send new review" }));
    await waitFor(() => expect(onResend).toHaveBeenCalledWith(undefined, { preview: true }));
  });

  it("reloads the round after the re-send lands", async () => {
    let release: () => void = () => {};
    const onResend = vi.fn(() => new Promise<void>((r) => { release = r; }));
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount(makeComposer(), { onResend });
    await openResend();
    fireEvent.click(await screen.findByRole("button", { name: "Send new review" }));
    expect(await screen.findByText(/Sending round 2…/)).toBeTruthy();
    release();
    await waitFor(() => expect(fetchCurrentRound).toHaveBeenCalledTimes(2));
  });
});

describe("Re-send — Play F5.04: a failed preview sends nothing and asks", () => {
  it("offers Send without preview, which re-sends with preview off", async () => {
    const { ReviewPreviewError } = await import("@/editor/shell/reviewSend");
    const onResend = vi
      .fn()
      .mockRejectedValueOnce(new ReviewPreviewError(new Error("render")))
      .mockResolvedValueOnce(undefined);
    fetchCurrentRound.mockResolvedValue(round({ openCommentCount: 0 }));
    fetchReviewComments.mockResolvedValue([]);
    mount(makeComposer(), { onResend });
    await openResend();
    fireEvent.click(await screen.findByRole("button", { name: "Send new review" }));
    expect(await screen.findByText("We couldn’t render a preview")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Send without preview" }));
    await waitFor(() => expect(onResend).toHaveBeenLastCalledWith("client@example.test", { preview: false }));
    await waitFor(() => expect(screen.queryByText("We couldn’t render a preview")).toBeNull());
  });
});
