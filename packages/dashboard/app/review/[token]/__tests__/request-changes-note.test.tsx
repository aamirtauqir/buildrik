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
 * the client's reasoning had none. Since the Figma parity pass (board
 * 4418:121999) "Request changes" opens the notes beside the snapshot and the
 * round closes only from "Send change request" there — the second step.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const commentMutate = vi.fn();
const resolveMutate = vi.fn();
const commentHookOptions = vi.fn();
const resolveHookOptions = vi.fn();

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
            roundNumber: 3,
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
        useMutation: (opts?: unknown) => {
          commentHookOptions(opts);
          return { mutate: commentMutate, mutateAsync: vi.fn(), isPending: false, error: null };
        },
      },
      resolve: {
        useMutation: (opts?: unknown) => {
          resolveHookOptions(opts);
          return { mutate: resolveMutate, mutateAsync: vi.fn(), isPending: false, error: null };
        },
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
  const openNotes = () => fireEvent.click(screen.getByText("Request changes"));

  it("does not close the round straight from the button — it opens the notes", () => {
    render(<ReviewClient token="t" />);
    openNotes();
    expect(resolveMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Your notes")).toBeTruthy();
    expect(screen.getByText("Send change request")).toBeTruthy();
  });

  it("sends the typed note before closing the round", () => {
    render(<ReviewClient token="t" />);
    openNotes();
    typeNote("The hero photo is too dark");
    fireEvent.click(screen.getByText("Send change request"));

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
    openNotes();
    expect(screen.getByText(/will not be told what to change/)).toBeTruthy();
  });

  it("still closes the round with no note", () => {
    render(<ReviewClient token="t" />);
    openNotes();
    fireEvent.click(screen.getByText("Send change request"));
    expect(commentMutate).not.toHaveBeenCalled();
    expect(resolveMutate).toHaveBeenCalledWith(
      { token: "t", status: "CHANGES_REQUESTED" },
      expect.anything(),
    );
  });

  /* 4418:122170: a request that did not land keeps everything and offers
     "Send again" — the round is still open. */
  it("a failed send says nothing was lost and offers Send again", () => {
    render(<ReviewClient token="t" />);
    openNotes();
    fireEvent.click(screen.getByText("Send change request"));
    const onError = resolveMutate.mock.calls[0][1].onError as () => void;
    act(() => onError());
    expect(screen.getByText("Your change request wasn’t sent.")).toBeTruthy();
    expect(screen.getByText("Send again")).toBeTruthy();
  });
});

/* Board 4418:122170: the red "not sent" box is the whole error UI. The
   provider's DEFAULT mutation onError raises a global "Something went wrong"
   toast; TanStack replaces that default when the hook passes its own onError,
   so both hooks the send path uses must pass one — and it must not toast. */
describe("a failed change request raises no global toast", () => {
  it("comment and resolve replace the provider's default onError", () => {
    render(<ReviewClient token="tok" />);
    for (const spy of [commentHookOptions, resolveHookOptions]) {
      const opts = spy.mock.calls.at(-1)?.[0] as { onError?: (e: unknown) => unknown } | undefined;
      expect(typeof opts?.onError).toBe("function");
    }
  });

  /* The mechanism itself, on a real QueryClient configured like the provider:
     a hook-level onError REPLACES defaultOptions.mutations.onError. If a
     react-query upgrade ever merged them instead, the toast would be back. */
  it("a hook-level onError replaces the provider's default (real QueryClient)", async () => {
    const { QueryClient, MutationObserver } = await import("@tanstack/react-query");
    const providerDefault = vi.fn();
    const client = new QueryClient({ defaultOptions: { mutations: { onError: providerDefault } } });
    const fail = () => Promise.reject(new Error("boom"));

    const handled = new MutationObserver(client, { mutationFn: fail, onError: () => undefined });
    await handled.mutate().catch(() => undefined);
    expect(providerDefault).not.toHaveBeenCalled();

    const unhandled = new MutationObserver(client, { mutationFn: fail });
    await unhandled.mutate().catch(() => undefined);
    expect(providerDefault).toHaveBeenCalledTimes(1);
  });

  it("the replacement handler adds nothing to the page", () => {
    document.body.innerHTML = '<div id="trpc-toast-root"></div>';
    render(<ReviewClient token="tok" />);
    const opts = resolveHookOptions.mock.calls.at(-1)?.[0] as { onError: (e: unknown) => unknown };
    opts.onError(new Error("INTERNAL_SERVER_ERROR"));
    expect(document.getElementById("trpc-toast-root")?.childElementCount ?? 0).toBe(0);
  });
});
