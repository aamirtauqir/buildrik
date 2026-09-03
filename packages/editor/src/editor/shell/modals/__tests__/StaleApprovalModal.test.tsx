/**
 * StaleApprovalModal tests — S5.6 approved-but-edited-since (board 131:201):
 * itemized page diff, re-send round, publish-anyway pass-through.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";

const submitForReview = vi.fn().mockResolvedValue(undefined);
const round = {
  id: "r1",
  status: "APPROVED",
  invitedEmail: "sara@client.example",
  reviewerName: "Sara",
  revoked: false,
  resolvedAt: "2026-07-18T10:00:00.000Z",
  createdAt: "2026-07-16T10:00:00.000Z",
  revision: "1",
  roundNumber: 3,
  totalRounds: 3,
  openCommentCount: 0,
};

vi.mock("@/services/ReviewService", () => ({
  fetchCurrentRound: vi.fn(() => Promise.resolve(round)),
  fetchApprovedSnapshot: vi.fn(() =>
    Promise.resolve([
      { path: "index.html", html: "<h1>old hero</h1>" },
      { path: "menu.html", html: "<p>menu</p>" },
    ]),
  ),
  submitForReview: (...a: unknown[]) => submitForReview(...a),
}));

vi.mock("../../exportPublishPages", () => ({
  exportPublishPages: vi.fn(() =>
    Promise.resolve([
      { path: "index.html", html: "<h1>new hero</h1>" }, // edited
      { path: "menu.html", html: "<p>menu</p>" }, // unchanged
      { path: "contact.html", html: "<p>new</p>" }, // added
    ]),
  ),
}));

import { ToastProvider } from "@/editor/chrome-ui";
import { StaleApprovalModal } from "../StaleApprovalModal";

/* emit is real: a successful re-send announces REVIEW_SENT for the
   onboarding checklist's send-review / connect-client wires. */
const composerEmit = vi.fn();
const composer = { emit: composerEmit } as never;

function mount(over: Partial<React.ComponentProps<typeof StaleApprovalModal>> = {}) {
  return render(
    <ToastProvider>
      <StaleApprovalModal
        isOpen
        composer={composer}
        onPublishAnyway={vi.fn()}
        onClose={vi.fn()}
        {...over}
      />
    </ToastProvider>,
  );
}

beforeEach(() => submitForReview.mockClear());
afterEach(() => cleanup());

describe("StaleApprovalModal", () => {
  it("names the reviewer and itemizes the changed pages (edited + added, not unchanged)", async () => {
    mount();
    expect(await screen.findByText(/The approval is older than your latest edits/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Home")).toBeInTheDocument());
    expect(screen.getByText("edited")).toBeInTheDocument();
    expect(screen.getByText("added")).toBeInTheDocument();
    expect(screen.queryByText(/menu/i)).toBeNull();
    /* Board 1168:4713 phrases it as a consequence, not a count in isolation:
       "since then, N things changed. Publishing now would go live with work
       the client hasn't seen." */
    expect(screen.getByText(/since then, 2 things changed/)).toBeInTheDocument();
    expect(screen.getByText(/would go live with work the client/)).toBeInTheDocument();
    expect(screen.getByText("Changed since approval")).toBeInTheDocument();
  });

  /* Board 131:201 closes with the reassurance (131:410), and it is true of the
     code: `publish-approval.ts:97` blocks only while `acknowledgeStale` is
     false, so acknowledging ships on top of the sign-off rather than voiding
     it. Without the line the user has to guess whether the amber button also
     throws away the approval they already have. */
  it("says the approval survives the acknowledged publish, and whose it is", async () => {
    mount();
    expect(
      await screen.findByText(/approval still stands — publishing now just ships these changes on top of it/),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Sara’s approval still stands/)).toBeInTheDocument();
  });

  it("re-sends a fresh round to the same client and closes", async () => {
    const onClose = vi.fn();
    mount({ onClose });
    await screen.findByText(/2 things changed/);
    fireEvent.click(screen.getByRole("button", { name: "Request fresh review" }));
    await waitFor(() => expect(submitForReview).toHaveBeenCalledTimes(1));
    const [, changeSummary, email] = submitForReview.mock.calls[0];
    expect(changeSummary).toBe("Re-send after 2 changes");
    expect(email).toBe("sara@client.example");
    expect(composerEmit).toHaveBeenCalledWith("review:sent", {
      invitedEmail: "sara@client.example",
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("'Publish anyway' invokes the acknowledged publish path", async () => {
    const onPublishAnyway = vi.fn();
    mount({ onPublishAnyway });
    await screen.findByText(/2 things changed/);
    fireEvent.click(screen.getByRole("button", { name: "Publish anyway" }));
    expect(onPublishAnyway).toHaveBeenCalledTimes(1);
  });
});
