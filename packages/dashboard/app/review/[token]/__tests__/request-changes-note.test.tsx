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
 * 4418:121999), and since 2L9 (GAP-RV 276:30195) a dialog: the note posts
 * first and the round closes only once it lands.
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
      requestNewLink: { useMutation: () => ({ mutate: vi.fn(), isSuccess: false, isPending: false, isError: false }) },
    },
  },
}));

import { ReviewClient } from "../review-client";

beforeEach(() => {
  commentMutate.mockReset();
  resolveMutate.mockReset();
});

const typeNote = (text: string) => {
  fireEvent.change(screen.getByLabelText("Your note"), { target: { value: text } });
};

describe("Request changes carries the note the client typed (2L9 GAP-RV)", () => {
  const openDialog = () => fireEvent.click(screen.getByText("Request changes"));
  const submit = () => fireEvent.click(screen.getByTestId("rc-submit"));

  it("does not close the round straight from the button — it asks first", () => {
    render(<ReviewClient token="t" />);
    openDialog();
    expect(resolveMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Request changes to Round 3?")).toBeTruthy();
  });

  it("posts the note, says so, then marks the round (276:30262 → 30321)", () => {
    render(<ReviewClient token="t" />);
    openDialog();
    typeNote("The hero photo is too dark");
    submit();
    expect(commentMutate).toHaveBeenCalledWith({ token: "t", body: "The hero photo is too dark" }, expect.anything());
    expect(screen.getByText("Posting your note…")).toBeTruthy();
    expect(screen.getByText("Your draft is kept until the comment is confirmed.")).toBeTruthy();
    /* The round closes only from the note's onSuccess. */
    expect(resolveMutate).not.toHaveBeenCalled();
    act(() => (commentMutate.mock.calls[0][1].onSuccess as () => void)());
    expect(resolveMutate).toHaveBeenCalledWith({ token: "t", status: "CHANGES_REQUESTED" }, expect.anything());
    expect(screen.getByText("Requesting changes…")).toBeTruthy();
    expect(screen.getByText("Your note was posted: “The hero photo is too dark”")).toBeTruthy();
    expect(screen.getByText("Waiting to mark Round 3 as Changes requested.")).toBeTruthy();
  });

  it("a note that did not post keeps the draft and the round (276:30499)", () => {
    render(<ReviewClient token="t" />);
    openDialog();
    typeNote("Warmer photo");
    submit();
    act(() => (commentMutate.mock.calls[0][1].onError as () => void)());
    expect(screen.getByText("Your note wasn’t posted")).toBeTruthy();
    expect(screen.getByText("Draft kept. Round 3 is still open.")).toBeTruthy();
    expect(resolveMutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("rc-keep-editing"));
    expect((screen.getByLabelText("Your note") as HTMLTextAreaElement).value).toBe("Warmer photo");
  });

  it("a round that did not close retries the status only (276:30380)", () => {
    render(<ReviewClient token="t" />);
    openDialog();
    typeNote("Warmer photo");
    submit();
    act(() => (commentMutate.mock.calls[0][1].onSuccess as () => void)());
    act(() => (resolveMutate.mock.calls[0][1].onError as () => void)());
    expect(screen.getByText("Your note was posted; the round is still open")).toBeTruthy();
    expect(screen.getByText("Retry only updates the round status. It won’t post your note again.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("rc-retry-status"));
    expect(commentMutate).toHaveBeenCalledTimes(1);
    expect(resolveMutate).toHaveBeenCalledTimes(2);
  });

  it("still closes the round with no note", () => {
    render(<ReviewClient token="t" />);
    openDialog();
    submit();
    expect(commentMutate).not.toHaveBeenCalled();
    expect(resolveMutate).toHaveBeenCalledWith({ token: "t", status: "CHANGES_REQUESTED" }, expect.anything());
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
