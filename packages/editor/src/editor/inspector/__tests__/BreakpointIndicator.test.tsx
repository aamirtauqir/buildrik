import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BreakpointIndicator } from "../components/BreakpointIndicator";

describe("BreakpointIndicator", () => {
  it("renders nothing for desktop", () => {
    const { container } = render(<BreakpointIndicator currentBreakpoint="desktop" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders for tablet", () => {
    render(<BreakpointIndicator currentBreakpoint="tablet" />);
    expect(screen.getByText(/tablet/i)).toBeInTheDocument();
  });

  it("renders for mobile", () => {
    render(<BreakpointIndicator currentBreakpoint="mobile" />);
    expect(screen.getByText(/mobile/i)).toBeInTheDocument();
  });

  it("does NOT render emoji", () => {
    const { container } = render(<BreakpointIndicator currentBreakpoint="tablet" />);
    // No emoji characters in text content
    expect(container.textContent).not.toMatch(/📱|📲/);
  });

  it("renders SVG icon", () => {
    const { container } = render(<BreakpointIndicator currentBreakpoint="tablet" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
