import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransitionCallout } from "../TransitionCallout";

describe("TransitionCallout", () => {
  it("renders the notice text", () => {
    render(<TransitionCallout />);
    expect(screen.getByText(/Quick Picks removed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/browse and drag elements directly from categories below/i)
    ).toBeInTheDocument();
  });

  it("has role='status' for screen readers", () => {
    render(<TransitionCallout />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("uses .bld-change-callout class for styling scope", () => {
    const { container } = render(<TransitionCallout />);
    expect(container.querySelector(".bld-change-callout")).not.toBeNull();
  });
});
