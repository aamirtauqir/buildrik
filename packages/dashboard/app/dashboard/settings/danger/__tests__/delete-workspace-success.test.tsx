/**
 * Deleting a workspace only SCHEDULES it (30-day grace). The success path used
 * to toast "Workspace deleted", which is false, and left the cached
 * `account.workspace.get` untouched, so the Home deletion banner (fed by that
 * query) appeared only after a full reload.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const { addToast, invalidateWorkspaceGet, state } = vi.hoisted(() => ({
  addToast: vi.fn(),
  invalidateWorkspaceGet: vi.fn(),
  state: { onSuccess: undefined as undefined | ((data: { scheduledAt: Date }) => void) },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { id: "owner-1" } } }) }));
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast }) }));

vi.mock("@lib/trpc/client", () => {
  const query = (data: unknown) => ({ data, isLoading: false, isError: false });
  const mutation = () => ({ mutate: vi.fn(), isPending: false });
  return {
    trpc: {
      useUtils: () => ({
        account: {
          workspace: { get: { invalidate: invalidateWorkspaceGet } },
          dangerZone: { exportData: { fetch: vi.fn() } },
        },
      }),
      account: {
        workspace: {
          get: { useQuery: () => query({ id: "w1", name: "Acme", ownerId: "owner-1" }) },
          transfer: {
            pending: { useQuery: () => query(null) },
            initiate: { useMutation: mutation },
            cancel: { useMutation: mutation },
          },
          delete: {
            useMutation: (opts: { onSuccess?: (data: { scheduledAt: Date }) => void }) => {
              state.onSuccess = opts.onSuccess;
              return { mutate: vi.fn(), isPending: false };
            },
          },
        },
        dangerZone: {
          deletionEligibility: { useQuery: () => query({ isSoleOwner: false, hasActiveSubscription: false }) },
          deleteAccount: { useMutation: mutation },
        },
      },
    },
  };
});

import DangerZonePage from "../page";

beforeEach(() => {
  addToast.mockReset();
  invalidateWorkspaceGet.mockReset();
  state.onSuccess = undefined;
});

describe("Danger zone — scheduling a workspace deletion", () => {
  const scheduledAt = new Date("2026-10-28T12:00:00.000Z");

  it("refreshes account.workspace.get so the Home banner shows without a reload", () => {
    render(<DangerZonePage />);
    state.onSuccess?.({ scheduledAt });
    expect(invalidateWorkspaceGet).toHaveBeenCalled();
  });

  it("says the workspace is scheduled, with the date, not that it is deleted", () => {
    render(<DangerZonePage />);
    state.onSuccess?.({ scheduledAt });
    expect(addToast).toHaveBeenCalledWith(
      "success",
      "Workspace scheduled for deletion",
      `It will be deleted on ${scheduledAt.toLocaleDateString()}. You can cancel from the home page.`,
    );
    expect(addToast).not.toHaveBeenCalledWith("success", "Workspace deleted");
  });
});
