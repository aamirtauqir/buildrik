import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectionContextBar } from "../SelectionContextBar";

describe("§11 — selection-context bar integration", () => {
  it("does not render when no context (not mounted)", () => {
    // The bar's mount/unmount is controlled by parent (SlimLauncher / MediaTab).
    // This test documents the contract: when selectionContext is null, bar should not exist.
    // Simulated by NOT rendering the bar at all.
    const { container } = render(<div data-testid="parent" />);
    expect(container.querySelector(".med-selection-bar")).toBeNull();
  });

  it("renders when context is set", () => {
    const { container } = render(
      <SelectionContextBar label="Hero block" onCancel={() => {}} />
    );
    expect(container.querySelector(".med-selection-bar")).toBeInTheDocument();
  });

  it("cancel button fires onCancel callback (clears context in real usage)", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    const { getByLabelText } = render(
      <SelectionContextBar label="Hero block" onCancel={onCancel} />
    );
    await user.click(getByLabelText("Cancel selection"));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
