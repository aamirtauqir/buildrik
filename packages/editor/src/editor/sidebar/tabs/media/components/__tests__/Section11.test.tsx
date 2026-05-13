import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SelectionContextBar } from "../SelectionContextBar";

describe("§11 Selection-context bar visual parity", () => {
  it("renders root container with med-selection-bar class", () => {
    const { container } = render(<SelectionContextBar onCancel={() => {}} />);
    const bar = container.querySelector(".med-selection-bar");
    expect(bar).toBeInTheDocument();
  });

  it("includes pulsing dot element", () => {
    const { container } = render(<SelectionContextBar onCancel={() => {}} />);
    expect(container.querySelector(".med-selection-bar__pulse")).toBeInTheDocument();
  });

  it("has separate title + label text rows", () => {
    const { container } = render(<SelectionContextBar label="Hero block" onCancel={() => {}} />);
    expect(container.querySelector(".med-selection-bar__title")?.textContent).toBe("Selecting image for:");
    expect(container.querySelector(".med-selection-bar__label")?.textContent).toBe("Hero block");
  });

  it("pulse dot is decorative (aria-hidden)", () => {
    const { container } = render(<SelectionContextBar onCancel={() => {}} />);
    const pulse = container.querySelector(".med-selection-bar__pulse");
    expect(pulse?.getAttribute("aria-hidden")).toBe("true");
  });

  it("cancel button has aria-label 'Cancel selection'", () => {
    const { container } = render(<SelectionContextBar onCancel={() => {}} />);
    const btn = container.querySelector(".med-selection-bar__cancel");
    expect(btn?.getAttribute("aria-label")).toBe("Cancel selection");
  });
});
