/**
 * ContextRow — the picked state's override count + Reset (board 27) and the
 * breakpoint's override count + Revert (board 28). The state picker and the
 * breakpoint readout moved to the InspectorHeader "Editing" row (2L9 Task 1.4).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContextRow, type ContextRowProps } from "../ContextRow";

const props = (over: Partial<ContextRowProps> = {}): ContextRowProps => ({
  state: "normal",
  stateOverrideCount: 0,
  onResetState: vi.fn(),
  breakpointName: null,
  breakpointOverrideCount: 0,
  onRevertBreakpoint: vi.fn(),
  ...over,
});

describe("ContextRow", () => {
  it("draws nothing with nothing to reset — no state picker, no breakpoint chip", () => {
    const { container } = render(<ContextRow {...props({ breakpointName: "Tablet" })} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("inspector-state-chip")).toBeNull();
    expect(screen.queryByTestId("inspector-bp-chip")).toBeNull();
  });

  it("board 27: a picked state's count sits on its own line — '1 :hover override · Reset'", () => {
    const p = props({ state: "hover", stateOverrideCount: 1 });
    render(<ContextRow {...p} />);
    const line = screen.getByTestId("inspector-state-overrides");
    expect(line.textContent?.replace(/\s+/g, " ").trim()).toBe("1 :hover override · Reset");
    /* Boards 27 / 28: the note row 8 · 16. */
    expect(line.className).toContain("tw:px-4");
    expect(line.className).toContain("tw:py-2");
    fireEvent.click(screen.getByTestId("inspector-state-reset"));
    expect(p.onResetState).toHaveBeenCalled();
  });

  it("board 28: 'Tablet · 1 override · Revert'", () => {
    const p = props({ breakpointName: "Tablet", breakpointOverrideCount: 1 });
    render(<ContextRow {...p} />);
    const line = screen.getByTestId("inspector-bp-line");
    expect(line.textContent?.replace(/\s+/g, " ").trim()).toBe("Tablet · 1 override · Revert");
    fireEvent.click(screen.getByTestId("inspector-bp-revert"));
    expect(p.onRevertBreakpoint).toHaveBeenCalled();
  });

  it("the Base state never draws a Reset line", () => {
    render(<ContextRow {...props({ state: "normal", stateOverrideCount: 3 })} />);
    expect(screen.queryByTestId("inspector-state-overrides")).toBeNull();
  });
});
