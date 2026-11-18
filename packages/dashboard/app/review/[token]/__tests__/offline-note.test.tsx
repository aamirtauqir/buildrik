/**
 * 2L9 B8-R11 (237:12474): offline, the client page says the comment is kept,
 * and the note waits in its field for the connection.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const commentMutate = vi.fn();

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
            roundNumber: 2,
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
      comment: { useMutation: () => ({ mutate: commentMutate, mutateAsync: vi.fn(), isPending: false, error: null }) },
      resolve: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }) },
      requestNewLink: { useMutation: () => ({ mutate: vi.fn(), isSuccess: false, isPending: false, isError: false }) },
    },
  },
}));

import { ReviewClient } from "../review-client";

afterEach(() => {
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
});

describe("the client page offline (2L9 B8-R11)", () => {
  it("says the comment is kept, and clears the line when the connection is back", () => {
    render(<ReviewClient token="t" />);
    expect(screen.queryByTestId("review-offline")).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByTestId("review-offline").textContent).toBe("You’re offline — your comment is kept.");
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByTestId("review-offline")).toBeNull();
  });

  it("starts offline when the browser already is", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
    render(<ReviewClient token="t" />);
    expect(screen.getByTestId("review-offline")).toBeTruthy();
    expect(commentMutate).not.toHaveBeenCalled();
  });
});
