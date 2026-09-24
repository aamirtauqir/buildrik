/**
 * Client sign-off, Figma family "Client sign-off" (4418:121903 and siblings):
 * the header names the agency, the site, the page and the round; A has no notes
 * column and approves "Round N"; C/D are message cards; a revoked link still
 * names its agency and round.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

const reviewQuery = vi.fn();

vi.mock("@lib/trpc/client", () => ({
  trpc: {
    useUtils: () => ({ clientReview: { comments: { invalidate: vi.fn() }, get: { invalidate: vi.fn() } } }),
    clientReview: {
      get: { useQuery: () => reviewQuery() },
      comments: { useQuery: () => ({ data: [{ id: "c1", body: "Logo bigger please", createdAt: "2026-09-20" }] }) },
      identify: { useMutation: () => ({ mutate: vi.fn() }) },
      comment: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
      resolve: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
    },
  },
}));

import { ReviewClient } from "../review-client";

const page = (h: string) => `<html><body><h1>${h}</h1></body></html>`;
const data = (over: Record<string, unknown> = {}) => ({
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  data: {
    siteName: "Bella Cucina",
    agencyName: "Ali's Studio",
    roundNumber: 3,
    status: "PENDING",
    sentAt: "2026-09-20T00:00:00.000Z",
    reviewer: { name: "Sara", email: "sara@x.test" },
    snapshotPages: [
      { path: "index.html", html: page("Home") },
      { path: "menu.html", html: page("Menu") },
    ],
    changeSummary: "Home, Menu and Contact.",
    editedSinceApproval: false,
    ...over,
  },
});

beforeEach(() => reviewQuery.mockReset());

describe("A · viewing (4418:121903)", () => {
  it("header: agency · site · page · Review snapshot · Review round N", () => {
    reviewQuery.mockReturnValue(data());
    render(<ReviewClient token="t" />);
    const header = screen.getByRole("banner");
    expect(header.textContent).toContain("Ali's Studio");
    expect(header.textContent).toContain("Bella Cucina · Home · Review snapshot");
    expect(header.textContent).toContain("Review round 3");
  });

  it("approves Round N and has no notes column", () => {
    reviewQuery.mockReturnValue(data());
    render(<ReviewClient token="t" />);
    expect(screen.getByRole("button", { name: "Approve Round 3" })).toBeTruthy();
    expect(screen.queryByText("Approve this design")).toBeNull();
    expect(screen.queryByText("Your notes")).toBeNull();
    expect(screen.getByRole("contentinfo").textContent).toContain("Sara · Approve Round 3: Home, Menu and Contact.");
  });

  it("switches snapshot pages from the page crumb (173613)", () => {
    reviewQuery.mockReturnValue(data());
    render(<ReviewClient token="t" />);
    fireEvent.click(screen.getByRole("button", { name: /Change page/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Menu" }));
    expect(screen.getByRole("banner").textContent).toContain("Bella Cucina · Menu · Review snapshot");
    expect(screen.getByTitle("Site preview").getAttribute("srcdoc")).toContain("<h1>Menu</h1>");
  });

  it("keeps the approval behind a confirm", () => {
    reviewQuery.mockReturnValue(data());
    render(<ReviewClient token="t" />);
    fireEvent.click(screen.getByRole("button", { name: "Approve Round 3" }));
    expect(screen.getByText("Approve Bella Cucina?")).toBeTruthy();
  });
});

describe("B · commenting (4418:121999)", () => {
  it("Request changes opens the notes beside the snapshot, signed crumb", () => {
    reviewQuery.mockReturnValue(data());
    render(<ReviewClient token="t" />);
    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));
    expect(screen.getByText("Your notes")).toBeTruthy();
    expect(screen.getByText("Logo bigger please")).toBeTruthy();
    expect(screen.getByRole("banner").textContent).toContain("Signed as Sara");
    fireEvent.click(screen.getByRole("button", { name: "Back to design" }));
    expect(screen.queryByText("Your notes")).toBeNull();
  });
});

describe("C · D — closed rounds", () => {
  it("C: You asked for changes · View the design · Add another note", () => {
    reviewQuery.mockReturnValue(data({ status: "CHANGES_REQUESTED" }));
    render(<ReviewClient token="t" />);
    expect(screen.getByRole("heading", { name: "You asked for changes" })).toBeTruthy();
    expect(screen.getByRole("banner").textContent).toContain("Review round 3");
    fireEvent.click(screen.getByRole("button", { name: "Add another note" }));
    expect(screen.getByText("Your notes")).toBeTruthy();
    // The round is closed — nothing left to send, only a way back.
    expect(screen.queryByText("Send change request")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "You asked for changes" })).toBeTruthy();
  });

  it("D: You approved this · View what you approved shows the snapshot, no verdict buttons", () => {
    reviewQuery.mockReturnValue(data({ status: "APPROVED" }));
    render(<ReviewClient token="t" />);
    expect(screen.getByRole("banner").textContent).toContain("Round 3");
    fireEvent.click(screen.getByRole("button", { name: "View what you approved" }));
    expect(screen.getByTitle("Site preview")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Approve Round/ })).toBeNull();
    expect(within(screen.getByRole("contentinfo")).getByRole("button", { name: "Back" })).toBeTruthy();
  });
});

describe("F · revoked (4418:121971)", () => {
  it("names the agency and round, and offers Try this link again", () => {
    const refetch = vi.fn();
    reviewQuery.mockReturnValue({
      isLoading: false,
      data: undefined,
      refetch,
      error: { data: { code: "FORBIDDEN", cause: { reason: "REVOKED", agencyName: "Ali's Studio", roundNumber: 3 } } },
    });
    render(<ReviewClient token="t" />);
    const header = screen.getByRole("banner");
    expect(header.textContent).toContain("Ali's Studio");
    expect(header.textContent).toContain("Round 3");
    expect(screen.getByText(/Ask Ali's Studio for a new one/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try this link again" }));
    expect(refetch).toHaveBeenCalled();
  });
});
