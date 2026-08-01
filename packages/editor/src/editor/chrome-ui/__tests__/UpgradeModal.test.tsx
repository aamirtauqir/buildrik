/**
 * UpgradeModal — contract tests.
 *
 * Moved from `editor/ui/__tests__/molecules.test.tsx` (flowbite big-bang:
 * T6 batch 1, UpgradeModal relocated to chrome-ui/UpgradeModal.tsx — it
 * composes the KEEP-verdict Modal, which stays in editor/ui/ for now).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UpgradeModal } from "../index";

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

  it("supports controlled open state and closes via Maybe Later", () => {
    const onClose = vi.fn();
    render(<UpgradeModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Maybe Later" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
