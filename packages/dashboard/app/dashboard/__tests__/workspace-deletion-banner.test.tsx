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
  state: {
    ownerId: "owner-1",
    deletionScheduledAt: "2099-10-27T00:00:00.000Z",
    onError: undefined as undefined | ((err: { message: string }) => void),
  },
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
          get: { useQuery: () => query({ id: "w1", ownerId: state.ownerId, deletionScheduledAt: state.deletionScheduledAt }) },
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
  state.deletionScheduledAt = "2099-10-27T00:00:00.000Z";
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

  /* SA-04 (RT8): past the date, the job keeps the workspace until every
     published site is confirmed offline — a past date would read as a bug. */
  it("past the date, says deletion is in progress instead of showing a past date", () => {
    state.ownerId = "user-1";
    state.deletionScheduledAt = "2026-01-01T00:00:00.000Z";
    render(<DashboardPage />);
    expect(screen.getByText("Deletion in progress. Some published sites are still being taken offline.")).toBeInTheDocument();
    expect(screen.queryByText(/scheduled for deletion on/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Deletion" })).toBeInTheDocument();
  });

  it("past the date, a non-owner still gets no Cancel button", () => {
    state.ownerId = "owner-1";
    state.deletionScheduledAt = "2026-01-01T00:00:00.000Z";
    render(<DashboardPage />);
    expect(screen.getByText("Deletion in progress. Some published sites are still being taken offline.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Deletion" })).not.toBeInTheDocument();
  });
});
