/**
 * Phase B §25: Transfer ownership moved from Workspace & branding to the
 * Danger zone. B-8 still holds there: the field is reachable by its label,
 * which keeps its body / text-primary look.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { id: "owner-1" } } }) }));
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock("@lib/trpc/client", async () =>
  (await import("@/components/__test-utils__/trpc-stub")).trpcStub({
    "account.workspace.get.useQuery": { data: { id: "w1", name: "Acme", ownerId: "owner-1" }, isLoading: false, isError: false },
    "account.workspace.transfer.pending.useQuery": { data: null, isLoading: false },
    "account.dangerZone.deletionEligibility.useQuery": { data: { isSoleOwner: false, hasActiveSubscription: false }, isLoading: false },
  }),
);

import DangerZonePage from "../page";

describe("Danger zone — Transfer ownership", () => {
  it("New owner's email is reachable via getByLabelText", () => {
    render(<DangerZonePage />);
    expect(screen.getByText("Transfer ownership")).toBeInTheDocument();
    const input = screen.getByLabelText("New owner's email");
    expect(input).toHaveAttribute("type", "email");
    const label = document.querySelector(`label[for="${input.id}"]`) as HTMLElement;
    expect(label.className).toBe("block text-body font-medium mb-1");
    expect(label.style.color).toBe("var(--color-text-primary)");
  });
});
