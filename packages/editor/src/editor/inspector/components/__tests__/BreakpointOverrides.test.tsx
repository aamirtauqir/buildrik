/**
 * BreakpointOverrides — board 160:208.
 *
 * Reaching this state in the editor means writing a tablet-only value by hand,
 * so it is pinned here: what the row says, what the base was, and that the
 * revert actually removes the override rather than writing the base value back
 * as a second override.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BreakpointOverrides } from "../BreakpointOverrides";

function makeComposer(
  overrides: Record<string, string>,
  base: Record<string, string> = {}
) {
  const removeBreakpointStyleProperty = vi.fn();
  const composer = {
    on: vi.fn(),
    off: vi.fn(),
    styles: {
      getBreakpointStyle: () => overrides,
      removeBreakpointStyleProperty,
    },
    elements: { getElement: () => ({ getStyles: () => base }) },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  } as never;
  return { composer, removeBreakpointStyleProperty };
}

afterEach(cleanup);

describe("breakpoint overrides", () => {
  it("names the property, the breakpoint and the base value", () => {
    const { composer } = makeComposer({ padding: "24px" }, { padding: "16px" });
    render(
      <BreakpointOverrides
        composer={composer}
        elementId="el-1"
        breakpoint="tablet"
      />
    );
    expect(screen.getByText("Padding")).toBeInTheDocument();
    expect(screen.getByText("24px")).toBeInTheDocument();
    expect(screen.getByText("Overridden on Tablet — Base is 16px")).toBeInTheDocument();
  });

  it("says so when the base never set the property at all", () => {
    const { composer } = makeComposer({ "font-size": "18px" });
    render(
      <BreakpointOverrides
        composer={composer}
        elementId="el-1"
        breakpoint="mobile"
      />
    );
    expect(screen.getByText(/Base is not set/)).toBeInTheDocument();
  });

  it("reverting removes the override instead of writing the base back over it", () => {
    const { composer, removeBreakpointStyleProperty } = makeComposer(
      { padding: "24px" },
      { padding: "16px" }
    );
    render(
      <BreakpointOverrides
        composer={composer}
        elementId="el-1"
        breakpoint="tablet"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Revert padding to base" }));
    expect(removeBreakpointStyleProperty).toHaveBeenCalledWith("el-1", "tablet", "padding");
  });

  it("shows nothing on the base breakpoint, whatever the element carries", () => {
    const { composer } = makeComposer({ padding: "24px" });
    const { container } = render(
      <BreakpointOverrides
        composer={composer}
        elementId="el-1"
        breakpoint="desktop"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
