/**
 * ContextRow — "State: Base ▾" and its menu (board 32), the picked state's
 * override count + Reset (board 27), the breakpoint chip + Revert (board 28).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContextRow, type ContextRowProps } from "../ContextRow";

const props = (over: Partial<ContextRowProps> = {}): ContextRowProps => ({
  state: "normal",
  onStateChange: vi.fn(),
  statesWithOverrides: new Set(),
  stateOverrideCount: 0,
  onResetState: vi.fn(),
  breakpointName: null,
  breakpointOverrideCount: 0,
  onRevertBreakpoint: vi.fn(),
  ...over,
});

describe("ContextRow", () => {
  it("reads 'State: Base' on Desktop, with no breakpoint chip", () => {
    render(<ContextRow {...props()} />);
    expect(screen.getByTestId("inspector-state-chip")).toHaveTextContent("State: Base");
    expect(screen.queryByTestId("inspector-bp-chip")).toBeNull();
  });

  it("opens 'Edit styles for': Base, :hover, :focus, :active, :disabled", () => {
    const p = props({ statesWithOverrides: new Set(["hover"]) });
    render(<ContextRow {...p} />);
    fireEvent.click(screen.getByTestId("inspector-state-chip"));
    expect(screen.getByText("Edit styles for")).toBeInTheDocument();
    const items = screen.getAllByRole("menuitemradio").map((i) => i.textContent?.replace("✓", "").trim());
    expect(items).toEqual(["Base", ":hover", ":focus", ":active", ":disabled"]);
    expect(screen.getByLabelText("has overrides")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("inspector-state-opt-hover"));
    expect(p.onStateChange).toHaveBeenCalledWith("hover");
  });

  it("a picked state says how many overrides it carries and resets them", () => {
    const p = props({ state: "hover", stateOverrideCount: 1 });
    render(<ContextRow {...p} />);
    expect(screen.getByTestId("inspector-state-chip")).toHaveTextContent("State: :hover");
    expect(screen.getByTestId("inspector-state-overrides")).toHaveTextContent("1 :hover override");
    fireEvent.click(screen.getByTestId("inspector-state-reset"));
    expect(p.onResetState).toHaveBeenCalled();
  });

  it("off Desktop: 'Tablet · 1 override' and Revert", () => {
    const p = props({ breakpointName: "Tablet", breakpointOverrideCount: 1 });
    render(<ContextRow {...p} />);
    expect(screen.getByTestId("inspector-bp-chip")).toHaveTextContent("Tablet · 1 override");
    fireEvent.click(screen.getByTestId("inspector-bp-revert"));
    expect(p.onRevertBreakpoint).toHaveBeenCalled();
  });
});
