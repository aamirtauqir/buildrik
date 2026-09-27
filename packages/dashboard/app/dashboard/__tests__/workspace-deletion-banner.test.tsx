/**
 * SA-04: cancelling a scheduled workspace deletion is owner-only on the server,
 * so the Home banner offers the Cancel button to the owner alone and surfaces a
 * server refusal as a toast instead of failing silently.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { addToast, cancelMutate, state } = vi.hoisted(() => ({
  addToast: vi.fn(),
  cancelMutate: vi.fn(),
  state: { ownerId: "owner-1", onError: undefined as undefined | ((err: { message: string }) => void) },
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "user-1", name: "Sam" } } }),
}));
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast }) }));
vi.mock("@/components/dashboard/quick-actions", () => ({ QuickActions: () => null }));
vi.mock("@/components/dashboard/activity-feed", () => ({ ActivityFeed: () => null }));
vi.mock("@/components/dashboard/needs-attention", () => ({ NeedsAttention: () => null }));
vi.mock("@/components/onboarding/dashboard-checklist", () => ({ DashboardChecklist: () => null }));

vi.mock("@lib/trpc/client", () => {
  const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });
  const mutation = () => ({ mutate: vi.fn(), isPending: false });
  return {
    trpc: {
      dashboard: {
        stats: { useQuery: () => query({ totalSites: 1, publishedSites: 1, draftSites: 0, archivedSites: 0, memberRole: "ADMIN" }) },
        activity: { useQuery: () => query({ items: [] }) },
      },
      account: {
        workspace: {
          get: { useQuery: () => query({ id: "w1", ownerId: state.ownerId, deletionScheduledAt: "2026-10-27T00:00:00.000Z" }) },
          cancelDelete: {
            useMutation: (opts: { onError?: (err: { message: string }) => void }) => {
              state.onError = opts.onError;
              return { mutate: cancelMutate, isPending: false };
            },
          },
        },
        dangerZone: {
          pendingDeletion: { useQuery: () => query(null) },
          cancelAccountDeletion: { useMutation: mutation },
        },
      },
      billing: { overview: { useQuery: () => query({ status: "ACTIVE" }) } },
      onboarding: {
        getState: { useQuery: () => query({ completed: true, dismissed: true }) },
        dismiss: { useMutation: mutation },
      },
    },
  };
});

import DashboardPage from "../page";

beforeEach(() => {
  addToast.mockReset();
  cancelMutate.mockReset();
  state.onError = undefined;
});

describe("Home — workspace deletion banner", () => {
  it("owner sees Cancel Deletion", () => {
    state.ownerId = "user-1";
    render(<DashboardPage />);
    expect(screen.getByText(/scheduled for deletion/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel Deletion" }));
    expect(cancelMutate).toHaveBeenCalled();
    expect(screen.queryByText("Only the owner can cancel it.")).not.toBeInTheDocument();
  });

  it("non-owner sees the banner but no Cancel button", () => {
    state.ownerId = "owner-1";
    render(<DashboardPage />);
    expect(screen.getByText(/scheduled for deletion/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Deletion" })).not.toBeInTheDocument();
    expect(screen.getByText("Only the owner can cancel it.")).toBeInTheDocument();
  });

  it("a refused cancel shows the server message as an error toast", () => {
    state.ownerId = "user-1";
    render(<DashboardPage />);
    state.onError?.({ message: "Only the owner can cancel the deletion." });
    expect(addToast).toHaveBeenCalledWith("error", "Could not cancel the deletion", "Only the owner can cancel the deletion.");
  });
});
