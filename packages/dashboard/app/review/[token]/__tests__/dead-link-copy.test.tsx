/**
 * Which dead-link screen a client actually sees.
 *
 * The page has four: expired, superseded, malformed, already-answered. Only two
 * could ever render. The copy map is keyed by the tRPC `data.code`, but the
 * router maps EXPIRED and REVOKED to a single FORBIDDEN — deliberately, so the
 * page could "render the expired screen rather than a 404", which is precisely
 * what the key lookup then made impossible. Both fell through to the malformed
 * copy: "It may have been copied incompletely. Try clicking the link in your
 * email again rather than pasting it." Clicking it again reproduces it forever,
 * and the action that would work — ask for a new link, or look for the newer
 * email — is never shown.
 *
 * The reason travelled as `cause: e.code`, a bare string, which the global
 * errorFormatter spreads with Object.entries — so it reached the client as
 * {0:"E",1:"X",2:"P"...}. It is an object now, and the page reads it.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const reviewQuery = vi.fn();

vi.mock("@lib/trpc/client", () => ({
  trpc: {
    useUtils: () => ({ clientReview: { comments: { invalidate: vi.fn() } } }),
    clientReview: {
      get: { useQuery: () => reviewQuery() },
      comments: { useQuery: () => ({ data: [], isLoading: false }) },
      identify: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }) },
      comment: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }) },
      resolve: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }) },
    },
  },
}));

import { ReviewClient } from "../review-client";

/** How a dead link arrives at the page after the router and errorFormatter. */
const deadLink = (code: string, reason?: string) => {
  reviewQuery.mockReturnValue({
    isLoading: false,
    data: undefined,
    error: { message: "…", data: { code, ...(reason ? { cause: { reason } } : {}) } },
  });
};

describe("dead-link screens", () => {
  it("tells an expired link it expired, not that it was mistyped", () => {
    deadLink("FORBIDDEN", "EXPIRED");
    render(<ReviewClient token="t" />);
    expect(screen.getByText("This link has expired")).toBeTruthy();
  });

  it("tells a superseded link a newer one replaced it", () => {
    deadLink("FORBIDDEN", "REVOKED");
    render(<ReviewClient token="t" />);
    expect(screen.getByText("There's a newer version")).toBeTruthy();
  });

  it("still says mistyped for a token that resolves to nothing", () => {
    deadLink("NOT_FOUND", "INVALID_TOKEN");
    render(<ReviewClient token="t" />);
    expect(screen.getByText("This link doesn't work")).toBeTruthy();
  });

  it("still closes the round when it has already been answered", () => {
    deadLink("CONFLICT", "ALREADY_RESOLVED");
    render(<ReviewClient token="t" />);
    expect(screen.getByText("You've already answered this")).toBeTruthy();
  });

  it("falls back to the malformed copy when no reason survives the wire", () => {
    deadLink("FORBIDDEN");
    render(<ReviewClient token="t" />);
    expect(screen.getByText("This link doesn't work")).toBeTruthy();
  });
});
