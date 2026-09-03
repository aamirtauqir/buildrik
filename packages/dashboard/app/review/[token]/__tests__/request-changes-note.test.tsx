/**
 * The note a client types must survive the button that asks for changes.
 *
 * "Your notes" and "Request changes" were independent controls: typing did
 * nothing until "Add note" was clicked, so typing a reason and then clicking
 * Request changes closed the round to a terminal screen with the text
 * discarded and no way back. On a sign-off product the reason IS the
 * deliverable — a request for changes that does not say what to change is
 * worth nothing to the designer who receives it.
 *
 * Approve had an explicit confirm; the terminal, irreversible path carrying
 * the client's reasoning had none.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const commentMutate = vi.fn();
const resolveMutate = vi.fn();

vi.mock("@lib/trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      clientReview: { comments: { invalidate: vi.fn() }, get: { invalidate: vi.fn() } },
    }),
    clientReview: {
      get: {
        useQuery: () => ({
          isLoading: false,
          error: null,
          data: {
            siteName: "Bella Cucina",
            agencyName: "Studio",
            status: "PENDING",
            sentAt: "2026-09-01T00:00:00.000Z",
            reviewer: { name: "Sam", email: "sam@example.com" },
            snapshotPages: [],
            changeSummary: null,
            editedSinceApproval: false,
          },
        }),
      },
      comments: { useQuery: () => ({ data: [], isLoading: false }) },
      identify: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }) },
      comment: {
        useMutation: () => ({ mutate: commentMutate, mutateAsync: vi.fn(), isPending: false, error: null }),
      },
      resolve: {
        useMutation: () => ({ mutate: resolveMutate, mutateAsync: vi.fn(), isPending: false, error: null }),
      },
    },
  },
}));

import { ReviewClient } from "../review-client";

beforeEach(() => {
  commentMutate.mockReset();
  resolveMutate.mockReset();
});

const typeNote = (text: string) => {
  fireEvent.change(screen.getByPlaceholderText("Anything you'd like changed?"), {
    target: { value: text },
  });
};

describe("Request changes carries the note the client typed", () => {
  it("does not close the round straight from the button", () => {
    render(<ReviewClient token="t" />);
    fireEvent.click(screen.getByText("Request changes"));
    // A confirm, like Approve has — this path is terminal and cannot be reopened.
    expect(resolveMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Request changes to Bella Cucina?")).toBeTruthy();
  });

  it("sends the typed note before closing the round", () => {
    render(<ReviewClient token="t" />);
    typeNote("The hero photo is too dark");
    fireEvent.click(screen.getByText("Request changes"));
    fireEvent.click(screen.getByText("Send and request changes"));

    expect(commentMutate).toHaveBeenCalledWith(
      { token: "t", body: "The hero photo is too dark" },
      expect.anything(),
    );
    /* The round closes only from the note's onSuccess. If the note cannot be
       sent, the round must stay open — otherwise the reason is lost exactly
       when it mattered. */
    expect(resolveMutate).not.toHaveBeenCalled();
    const onSuccess = commentMutate.mock.calls[0][1].onSuccess as () => void;
    onSuccess();
    expect(resolveMutate).toHaveBeenCalledWith(
      { token: "t", status: "CHANGES_REQUESTED" },
      expect.anything(),
    );
  });

  it("says plainly that no note means no reason reaches the designer", () => {
    render(<ReviewClient token="t" />);
    fireEvent.click(screen.getByText("Request changes"));
    expect(screen.getByText(/will not be told what to change/)).toBeTruthy();
  });

  it("still closes the round with no note, once confirmed", () => {
    render(<ReviewClient token="t" />);
    fireEvent.click(screen.getByText("Request changes"));
    fireEvent.click(screen.getByText("Send and request changes"));
    expect(commentMutate).not.toHaveBeenCalled();
    expect(resolveMutate).toHaveBeenCalledWith(
      { token: "t", status: "CHANGES_REQUESTED" },
      expect.anything(),
    );
  });
});
