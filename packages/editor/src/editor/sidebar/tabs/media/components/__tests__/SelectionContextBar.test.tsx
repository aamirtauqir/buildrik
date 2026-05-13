import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectionContextBar } from "../SelectionContextBar";

describe("SelectionContextBar", () => {
  it("renders 'Selecting image for: <label>' when context provided", () => {
    render(<SelectionContextBar label="Hero block" onCancel={() => {}} />);
    expect(screen.getByText(/Selecting image for/)).toBeInTheDocument();
    expect(screen.getByText("Hero block")).toBeInTheDocument();
  });

  it("renders 'Canvas element' fallback when label omitted", () => {
    render(<SelectionContextBar onCancel={() => {}} />);
    expect(screen.getByText("Canvas element")).toBeInTheDocument();
  });

  it("fires onCancel when Cancel button clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<SelectionContextBar label="x" onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("has role status with aria-live polite", () => {
    const { container } = render(<SelectionContextBar onCancel={() => {}} />);
    const bar = container.querySelector(".med-selection-bar");
    expect(bar?.getAttribute("role")).toBe("status");
    expect(bar?.getAttribute("aria-live")).toBe("polite");
  });
});
