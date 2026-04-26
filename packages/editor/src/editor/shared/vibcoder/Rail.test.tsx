/**
 * Rail tests — verify markup contracts.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Rail, RailButton } from "./Rail";

describe("Rail", () => {
  it("renders <nav> with bd-rail class and default aria-label", () => {
    render(<Rail data-testid="r">x</Rail>);
    const r = screen.getByTestId("r");
    expect(r.tagName).toBe("NAV");
    expect(r).toHaveClass("bd-rail");
    expect(r).toHaveAttribute("aria-label", "Editor rail");
  });

  it("applies bd-rail--horizontal when horizontal prop set", () => {
    render(<Rail horizontal data-testid="r">x</Rail>);
    expect(screen.getByTestId("r")).toHaveClass("bd-rail--horizontal");
  });

  it("omits --horizontal when prop unset", () => {
    render(<Rail data-testid="r">x</Rail>);
    expect(screen.getByTestId("r")).not.toHaveClass("bd-rail--horizontal");
  });

  it("respects caller-provided aria-label", () => {
    render(<Rail aria-label="Custom" data-testid="r">x</Rail>);
    expect(screen.getByTestId("r")).toHaveAttribute("aria-label", "Custom");
  });

  it("merges caller className", () => {
    render(<Rail className="extra" data-testid="r">x</Rail>);
    expect(screen.getByTestId("r")).toHaveClass("bd-rail");
    expect(screen.getByTestId("r")).toHaveClass("extra");
  });
});

describe("RailButton", () => {
  it("applies bd-rail__btn class with type='button'", () => {
    render(<RailButton>x</RailButton>);
    const btn = screen.getByRole("button", { name: "x" });
    expect(btn).toHaveClass("bd-rail__btn");
    expect(btn).toHaveAttribute("type", "button");
  });

  it("sets aria-current='page' when active", () => {
    render(<RailButton active>x</RailButton>);
    expect(screen.getByRole("button", { name: "x" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("omits aria-current when not active", () => {
    render(<RailButton>x</RailButton>);
    expect(screen.getByRole("button", { name: "x" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("Rail — composition smoke", () => {
  it("composes Rail + RailButton", () => {
    render(
      <Rail data-testid="rail">
        <RailButton active>Pages</RailButton>
        <RailButton>Templates</RailButton>
      </Rail>,
    );
    expect(screen.getByTestId("rail")).toHaveClass("bd-rail");
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Pages" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
