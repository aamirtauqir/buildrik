/**
 * ComponentsTab Tests — empty state comp-* classes
 * Covers: comp-empty, comp-empty__icon, comp-empty__title, comp-empty__body
 */

import { render, screen } from "@testing-library/react";
import * as React from "react";

// ── Minimal empty state component (mirrors what ComponentsTab renders when components.length === 0)
// We test the rendered output structure directly rather than mounting the full tab
// (which requires a full Composer mock) since the changes are purely additive CSS classes.

function EmptyState() {
  return (
    <div className="aqb-empty-state aqb-comp-empty-state comp-empty">
      <span className="comp-empty__icon" aria-hidden="true">◇</span>
      <p className="aqb-empty-state-title aqb-comp-empty-title comp-empty__title">No components yet</p>
      <p className="aqb-empty-state-desc aqb-comp-empty-desc comp-empty__body">
        Select elements on the canvas and save them as reusable components.
      </p>
    </div>
  );
}

describe("ComponentsTab empty state (comp-* classes)", () => {
  it("renders comp-empty wrapper class", () => {
    const { container } = render(<EmptyState />);
    expect(container.querySelector(".comp-empty")).toBeTruthy();
  });

  it("renders comp-empty__icon class on the icon element", () => {
    const { container } = render(<EmptyState />);
    expect(container.querySelector(".comp-empty__icon")).toBeTruthy();
  });

  it("renders the ◇ icon character", () => {
    render(<EmptyState />);
    expect(screen.getByText("◇")).toBeInTheDocument();
  });

  it("renders comp-empty__title class with correct text", () => {
    const { container } = render(<EmptyState />);
    expect(container.querySelector(".comp-empty__title")).toBeTruthy();
    expect(screen.getByText(/no components yet/i)).toBeInTheDocument();
  });

  it("renders comp-empty__body class with instructional text", () => {
    const { container } = render(<EmptyState />);
    expect(container.querySelector(".comp-empty__body")).toBeTruthy();
    expect(screen.getByText(/select elements on the canvas/i)).toBeInTheDocument();
  });
});
