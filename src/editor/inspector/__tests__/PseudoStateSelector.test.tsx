import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PseudoStateSelector } from "../components/PseudoStateSelector";

describe("PseudoStateSelector — renders all states", () => {
  it("shows 5 state buttons", () => {
    render(<PseudoStateSelector currentPseudoState="normal" onChange={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("each button has aria-label", () => {
    render(<PseudoStateSelector currentPseudoState="normal" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /default state/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hover state/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /focus state/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /active state/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disabled state/i })).toBeInTheDocument();
  });

  it("calls onChange when a state button is clicked", () => {
    const onChange = vi.fn();
    render(<PseudoStateSelector currentPseudoState="normal" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /hover state/i }));
    expect(onChange).toHaveBeenCalledWith("hover");
  });
});

describe("PseudoStateSelector — dot indicator", () => {
  it("shows dot on hover button when hover has overrides", () => {
    render(
      <PseudoStateSelector
        currentPseudoState="normal"
        onChange={vi.fn()}
        statesWithOverrides={new Set(["hover"])}
      />
    );
    expect(screen.getByTestId("override-dot-hover")).toBeInTheDocument();
  });

  it("does not show dot when no overrides", () => {
    render(<PseudoStateSelector currentPseudoState="normal" onChange={vi.fn()} />);
    expect(screen.queryByTestId("override-dot-hover")).not.toBeInTheDocument();
  });
});
