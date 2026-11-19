/**
 * L4-007 (owner, 2026-10-10): automatic paid alt text is a workspace opt-in,
 * OFF by default. The toggle says what it costs before anyone turns it on,
 * says the on-demand Generate keeps working, and flips the `auto_alt_text`
 * workspace flag through `features.set` (ADMIN-gated server-side).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const setMutate = vi.fn();
let listState: { data?: Record<string, boolean>; isError: boolean; isFetching: boolean };

vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock("@lib/trpc/client", () => ({
  trpc: {
    features: {
      list: { useQuery: () => ({ ...listState, refetch: vi.fn() }) },
      set: { useMutation: () => ({ mutate: setMutate, isPending: false }) },
    },
  },
}));

import { AutoAltTextToggle } from "../auto-alt-text-toggle";

describe("AutoAltTextToggle (L4-007)", () => {
  beforeEach(() => {
    setMutate.mockClear();
    listState = { data: { agency_layer: false, client_mode: false, auto_alt_text: false }, isError: false, isFetching: false };
  });

  it("is off by default and explains the credit cost and the on-demand path", () => {
    render(<AutoAltTextToggle />);
    const toggle = screen.getByRole("switch", { name: "Automatic alt text" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/uses 1 AI credit/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate in the media library works either way/i)).toBeInTheDocument();
    expect(screen.getByText(/never replaces alt text someone typed/i)).toBeInTheDocument();
  });

  it("turning it on sets the workspace's auto_alt_text flag", async () => {
    render(<AutoAltTextToggle />);
    await userEvent.setup().click(screen.getByRole("switch", { name: "Automatic alt text" }));
    expect(setMutate).toHaveBeenCalledWith({ key: "auto_alt_text", enabled: true });
  });

  it("an unreadable flag is not a clickable Off", () => {
    listState = { data: undefined, isError: true, isFetching: false };
    render(<AutoAltTextToggle />);
    expect(screen.getByRole("switch", { name: "Automatic alt text" })).toBeDisabled();
  });
});
