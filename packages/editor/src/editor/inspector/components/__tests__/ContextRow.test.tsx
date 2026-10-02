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

  it("board 27: a picked state's count sits on its own line — '1 :hover override · Reset'", () => {
    const p = props({ state: "hover", stateOverrideCount: 1 });
    render(<ContextRow {...p} />);
    expect(screen.getByTestId("inspector-state-chip")).toHaveTextContent("State: :hover");
    /* Board 27 fills a picked state's chip with the accent-subtle tint (#E1EFFE). */
    expect(screen.getByTestId("inspector-state-chip").className).toContain("--bk-accent-subtle");
    const line = screen.getByTestId("inspector-state-overrides");
    expect(line.textContent?.replace(/\s+/g, " ").trim()).toBe("1 :hover override · Reset");
    /* Its own line: not in the chip row. Boards 27 / 28: chips 28 tall
       (py 2 around the 24px chip), the note row 8 · 16. */
    expect(screen.getByTestId("inspector-context-chips").contains(line)).toBe(false);
    expect(screen.getByTestId("inspector-context-chips").className).toContain("tw:py-0.5");
    expect(line.className).toContain("tw:px-4");
    expect(line.className).toContain("tw:py-2");
    fireEvent.click(screen.getByTestId("inspector-state-reset"));
    expect(p.onResetState).toHaveBeenCalled();
  });

  it("board 28: the breakpoint is a chip 'Tablet · 1 override' beside State, and a separate 'Tablet · Revert' line", () => {
    const p = props({ breakpointName: "Tablet", breakpointOverrideCount: 1 });
    render(<ContextRow {...p} />);
    const chips = screen.getByTestId("inspector-context-chips");
    const chip = screen.getByTestId("inspector-bp-chip");
    expect(chips.contains(chip)).toBe(true);
    expect(chip.textContent?.trim()).toBe("Tablet · 1 override");
    const line = screen.getByTestId("inspector-bp-line");
    expect(chips.contains(line)).toBe(false);
    expect(line.textContent?.replace(/\s+/g, " ").trim()).toBe("Tablet · Revert");
    fireEvent.click(screen.getByTestId("inspector-bp-revert"));
    expect(p.onRevertBreakpoint).toHaveBeenCalled();
  });

  it("off Desktop with nothing overridden: the chip says the breakpoint, no Revert line", () => {
    render(<ContextRow {...props({ breakpointName: "Tablet" })} />);
    expect(screen.getByTestId("inspector-bp-chip").textContent?.trim()).toBe("Tablet");
    expect(screen.queryByTestId("inspector-bp-line")).toBeNull();
  });
});
