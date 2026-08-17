/**
 * UpgradeModal — contract tests (board 1175:4804).
 *
 * The first test here passed for months while the modal was unreachable: it
 * hand-dispatched `upgrade-modal-open`, and nothing in `src/` ever did. A
 * test that fires the event itself proves the listener works, not that the
 * feature has a door. `openUpgrade` is now that door, and the templates tab
 * calls it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { UpgradeModal, openUpgrade } from "../index";

afterEach(cleanup);

describe("UpgradeModal", () => {
  it("stays closed until the upgrade-modal-open event arrives, then names the feature", () => {
    render(<UpgradeModal />);
    expect(screen.queryByText("Upgrade Your Plan")).toBeNull();
    fireEvent(
      window,
      new CustomEvent("upgrade-modal-open", { detail: { feature: "Export", requiredPlan: "Business" } }),
    );
    expect(screen.getByText("Upgrade Your Plan")).toBeTruthy();
    expect(screen.getByText("Export requires the Business plan.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upgrade to Business" })).toBeTruthy();
  });

  it("opens through openUpgrade — the dispatcher call sites use", () => {
    render(<UpgradeModal />);
    expect(screen.queryByText("Upgrade Your Plan")).toBeNull();
    act(() => openUpgrade({ feature: "Restaurant" }));
    expect(screen.getByText("Restaurant requires the Pro plan.")).toBeTruthy();
  });

  it("defaults to Pro when the caller names no plan", () => {
    render(<UpgradeModal />);
    act(() => openUpgrade({ feature: "Stock library" }));
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeTruthy();
  });

  it("does not sell a benefit Free already has", () => {
    // `PLAN_LIMITS` has no export limit at all, so "Unlimited exports" is not
    // a Pro delta. `customDomains` is (0 → 3).
    render(<UpgradeModal isOpen onClose={vi.fn()} />);
    expect(screen.queryByText("Unlimited exports")).toBeNull();
    expect(screen.getByText("Custom domain")).toBeTruthy();
  });

  it("supports controlled open state and closes via Maybe Later", () => {
    const onClose = vi.fn();
    render(<UpgradeModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Maybe Later" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
