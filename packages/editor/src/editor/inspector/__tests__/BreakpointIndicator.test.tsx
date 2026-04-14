import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BreakpointIndicator } from "../components/BreakpointIndicator";

describe("BreakpointIndicator", () => {
  it("renders current breakpoint label for desktop", () => {
    render(<BreakpointIndicator currentBreakpoint="desktop" />);
    expect(screen.getByText("Desktop")).toBeInTheDocument();
  });

  it("renders current breakpoint label for tablet", () => {
    render(<BreakpointIndicator currentBreakpoint="tablet" />);
    expect(screen.getByText("Tablet")).toBeInTheDocument();
  });

  it("renders current breakpoint label for mobile", () => {
    render(<BreakpointIndicator currentBreakpoint="mobile" />);
    expect(screen.getByText("Mobile")).toBeInTheDocument();
  });

  it("renders SVG icon", () => {
    const { container } = render(<BreakpointIndicator currentBreakpoint="tablet" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("does NOT render emoji", () => {
    const { container } = render(<BreakpointIndicator currentBreakpoint="tablet" />);
    expect(container.textContent).not.toMatch(/📱|📲/);
  });

  it("clicking opens the dropdown menu when onBreakpointChange is provided", () => {
    const onChange = vi.fn();
    render(<BreakpointIndicator currentBreakpoint="desktop" onBreakpointChange={onChange} />);
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /current breakpoint/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("shows all three breakpoint options in the dropdown", () => {
    const onChange = vi.fn();
    render(<BreakpointIndicator currentBreakpoint="desktop" onBreakpointChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /current breakpoint/i }));
    expect(screen.getByRole("option", { name: /desktop/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /tablet/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /mobile/i })).toBeInTheDocument();
  });

  it("selecting a different breakpoint calls onBreakpointChange with that breakpoint", () => {
    const onChange = vi.fn();
    render(<BreakpointIndicator currentBreakpoint="desktop" onBreakpointChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /current breakpoint/i }));
    fireEvent.click(screen.getByRole("option", { name: /tablet/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("tablet");
  });

  it("selecting the current breakpoint does not call onBreakpointChange", () => {
    const onChange = vi.fn();
    render(<BreakpointIndicator currentBreakpoint="tablet" onBreakpointChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /current breakpoint/i }));
    fireEvent.click(screen.getByRole("option", { name: /tablet/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("menu closes after selecting a breakpoint", () => {
    const onChange = vi.fn();
    render(<BreakpointIndicator currentBreakpoint="desktop" onBreakpointChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /current breakpoint/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /mobile/i }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("does not show dropdown trigger chevron when onBreakpointChange is not provided", () => {
    const { container } = render(<BreakpointIndicator currentBreakpoint="desktop" />);
    // Without callback, no chevron icon should be rendered (only chip + BP icon)
    const svgs = container.querySelectorAll("svg");
    // Only the breakpoint icon SVG, no chevron
    expect(svgs.length).toBe(1);
  });

  it("shows override dot when hasOverride is true", () => {
    render(
      <BreakpointIndicator currentBreakpoint="tablet" hasOverride={true} onBreakpointChange={vi.fn()} />
    );
    expect(screen.getByTestId("breakpoint-override-dot")).toBeInTheDocument();
  });

  it("does not show override dot when hasOverride is false", () => {
    render(
      <BreakpointIndicator currentBreakpoint="tablet" hasOverride={false} onBreakpointChange={vi.fn()} />
    );
    expect(screen.queryByTestId("breakpoint-override-dot")).toBeNull();
  });
});
