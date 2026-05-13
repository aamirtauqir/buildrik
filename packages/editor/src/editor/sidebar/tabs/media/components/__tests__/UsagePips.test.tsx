import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { UsagePips } from "../UsagePips";

describe("UsagePips", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<UsagePips count={0} />);
    expect(container.querySelector(".med-usage-pips")).toBeNull();
  });

  it("renders N dots for count 1-3", () => {
    const { container, rerender } = render(<UsagePips count={1} />);
    expect(container.querySelectorAll(".med-usage-pip")).toHaveLength(1);
    rerender(<UsagePips count={2} />);
    expect(container.querySelectorAll(".med-usage-pip")).toHaveLength(2);
    rerender(<UsagePips count={3} />);
    expect(container.querySelectorAll(".med-usage-pip")).toHaveLength(3);
  });

  it("caps at 3 dots and adds overflow indicator for count > 3", () => {
    const { container } = render(<UsagePips count={5} />);
    expect(container.querySelectorAll(".med-usage-pip")).toHaveLength(3);
    expect(container.querySelector(".med-usage-pip--overflow")).toBeInTheDocument();
  });

  it("has aria-label describing usage", () => {
    const { container } = render(<UsagePips count={2} />);
    const root = container.querySelector(".med-usage-pips");
    expect(root?.getAttribute("aria-label")).toBe("Used on 2 pages");
  });

  it("aria-label uses singular for count 1", () => {
    const { container } = render(<UsagePips count={1} />);
    const root = container.querySelector(".med-usage-pips");
    expect(root?.getAttribute("aria-label")).toBe("Used on 1 page");
  });
});
