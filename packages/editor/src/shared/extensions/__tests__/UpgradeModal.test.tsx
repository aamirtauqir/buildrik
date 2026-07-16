/**
 * UpgradeModal tests — the window "upgrade-modal-open" event flow (403
 * interceptor path), controlled open state, and the billing redirect.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { UpgradeModal } from "../UpgradeModal";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function dispatchUpgradeEvent(detail?: { feature?: string; requiredPlan?: string }) {
  fireEvent(window, new CustomEvent("upgrade-modal-open", { detail }));
}

describe("UpgradeModal — window event flow", () => {
  it("stays closed until the upgrade-modal-open event arrives", () => {
    render(<UpgradeModal />);
    expect(screen.queryByText("Upgrade Your Plan")).not.toBeInTheDocument();

    dispatchUpgradeEvent({ feature: "Export", requiredPlan: "Enterprise" });
    expect(screen.getByText("Upgrade Your Plan")).toBeInTheDocument();
    expect(screen.getByText("Export requires the Enterprise plan.")).toBeInTheDocument();
    expect(screen.getByLabelText("Enterprise feature")).toBeInTheDocument();
  });

  it("defaults to the Pro plan when the event has no detail", () => {
    render(<UpgradeModal />);
    dispatchUpgradeEvent();
    expect(screen.getByText("This feature requires the Pro plan.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeInTheDocument();
  });

  it("'Maybe Later' closes the event-opened modal", async () => {
    render(<UpgradeModal />);
    dispatchUpgradeEvent();
    fireEvent.click(screen.getByRole("button", { name: "Maybe Later" }));
    await waitFor(() =>
      expect(screen.queryByText("Upgrade Your Plan")).not.toBeInTheDocument()
    );
  });
});

describe("UpgradeModal — controlled mode", () => {
  it("respects the isOpen prop and onClose handler", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<UpgradeModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByText("Upgrade Your Plan")).not.toBeInTheDocument();

    rerender(<UpgradeModal isOpen onClose={onClose} />);
    expect(screen.getByText("Upgrade Your Plan")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Maybe Later" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("UpgradeModal — upgrade action", () => {
  it("opens the dashboard billing page in a new tab and closes", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<UpgradeModal />);
    dispatchUpgradeEvent({ requiredPlan: "Pro" });

    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }));

    expect(open).toHaveBeenCalledTimes(1);
    const [url, target] = open.mock.calls[0];
    expect(String(url)).toMatch(/\/dashboard\/billing$/);
    expect(target).toBe("_blank");
    await waitFor(() =>
      expect(screen.queryByText("Upgrade Your Plan")).not.toBeInTheDocument()
    );
  });

  it("lists the plan benefits", () => {
    render(<UpgradeModal />);
    dispatchUpgradeEvent();
    expect(screen.getByText("Unlimited exports")).toBeInTheDocument();
    expect(screen.getByText("Premium templates")).toBeInTheDocument();
    expect(screen.getByText("AI-powered features")).toBeInTheDocument();
    expect(screen.getByText("Priority support")).toBeInTheDocument();
  });
});
