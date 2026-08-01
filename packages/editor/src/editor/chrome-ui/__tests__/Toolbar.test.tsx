/**
 * Toolbar — contract tests.
 *
 * Asserts the API surface (props -> classes, composition), not pixels. Pixel
 * truth lives in Figma and reaches the DOM through generated tokens.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toolbar, ToolbarSpacer } from "../Toolbar";

describe("Toolbar", () => {
  it("renders its children in a wrapping strip", () => {
    render(
      <Toolbar>
        <button type="button">All</button>
        <button type="button">Errors</button>
      </Toolbar>,
    );
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Errors" })).toBeInTheDocument();
  });

  it("wraps rather than overflowing — a six-control strip must not hide a control off-screen", () => {
    const { container } = render(<Toolbar>x</Toolbar>);
    expect(container.firstElementChild?.className).toMatch(/tw:flex-wrap/);
  });

  it("defaults to a bottom border and NEVER carries both border sides at once", () => {
    // Two utilities setting a border-width for the same box have no
    // className-order-to-cascade-order guarantee, so edge variants are
    // mutually exclusive by construction rather than by override.
    const { container } = render(<Toolbar>x</Toolbar>);
    const cls = container.firstElementChild?.className ?? "";
    expect(cls).toMatch(/tw:border-b/);
    expect(cls).not.toMatch(/tw:border-t/);
  });

  it("edge=top swaps the border side instead of adding one", () => {
    const { container } = render(<Toolbar edge="top">x</Toolbar>);
    const cls = container.firstElementChild?.className ?? "";
    expect(cls).toMatch(/tw:border-t/);
    expect(cls).not.toMatch(/tw:border-b/);
  });

  it("passes className through and keeps its own base classes", () => {
    const { container } = render(<Toolbar className="probe">x</Toolbar>);
    const cls = container.firstElementChild?.className ?? "";
    expect(cls).toMatch(/probe/);
    expect(cls).toMatch(/tw:items-center/);
  });

  it("forwards arbitrary div attributes — role/aria-label are how the scope strip is named", () => {
    render(
      <Toolbar role="group" aria-label="Issue scope">
        <button type="button">This page</button>
      </Toolbar>,
    );
    expect(screen.getByRole("group", { name: "Issue scope" })).toBeInTheDocument();
  });

  it("ToolbarSpacer is decorative — it takes the free space and is hidden from assistive tech", () => {
    const { container } = render(
      <Toolbar>
        <span>left</span>
        <ToolbarSpacer />
        <span>right</span>
      </Toolbar>,
    );
    const spacer = container.querySelector('[aria-hidden="true"]');
    expect(spacer).not.toBeNull();
    expect(spacer?.className).toMatch(/tw:flex-1/);
  });
});
