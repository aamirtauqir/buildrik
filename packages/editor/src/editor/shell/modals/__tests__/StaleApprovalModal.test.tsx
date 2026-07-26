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

import { ToastProvider } from "@/editor/ui";
import { StaleApprovalModal } from "../StaleApprovalModal";

const composer = {} as never;

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
    expect(await screen.findByText(/Publish work Sara hasn’t seen\?/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Home")).toBeInTheDocument());
    expect(screen.getByText("edited")).toBeInTheDocument();
    expect(screen.getByText("added")).toBeInTheDocument();
    expect(screen.queryByText(/menu/i)).toBeNull();
    expect(screen.getByText(/2 things changed after that/)).toBeInTheDocument();
  });

  it("re-sends a fresh round to the same client and closes", async () => {
    const onClose = vi.fn();
    mount({ onClose });
    await screen.findByText(/2 things changed/);
    fireEvent.click(screen.getByRole("button", { name: "Re-send for approval" }));
    await waitFor(() => expect(submitForReview).toHaveBeenCalledTimes(1));
    const [, changeSummary, email] = submitForReview.mock.calls[0];
    expect(changeSummary).toBe("Re-send after 2 changes");
    expect(email).toBe("sara@client.example");
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
