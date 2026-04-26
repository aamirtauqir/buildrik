/**
 * Topbar tests — verify markup contracts for layout-only organism.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Topbar,
  TopbarGroup,
  TopbarBrand,
  TopbarStatus,
  TopbarStatusDot,
} from "./Topbar";

describe("Topbar", () => {
  it("applies bd-topbar class and role='banner' on a <header>", () => {
    render(<Topbar data-testid="tb">x</Topbar>);
    const root = screen.getByTestId("tb");
    expect(root.tagName).toBe("HEADER");
    expect(root).toHaveClass("bd-topbar");
    expect(root).toHaveAttribute("role", "banner");
  });

  it("merges caller className", () => {
    render(<Topbar data-testid="tb" className="extra">x</Topbar>);
    const root = screen.getByTestId("tb");
    expect(root).toHaveClass("bd-topbar");
    expect(root).toHaveClass("extra");
  });
});

describe("TopbarGroup", () => {
  it("applies bd-topbar__group class", () => {
    render(<TopbarGroup data-testid="g">x</TopbarGroup>);
    expect(screen.getByTestId("g")).toHaveClass("bd-topbar__group");
  });

  it("applies bd-topbar__group--center modifier when center prop set", () => {
    render(<TopbarGroup center data-testid="g">x</TopbarGroup>);
    expect(screen.getByTestId("g")).toHaveClass("bd-topbar__group--center");
  });

  it("omits --center modifier when center prop unset", () => {
    render(<TopbarGroup data-testid="g">x</TopbarGroup>);
    expect(screen.getByTestId("g")).not.toHaveClass("bd-topbar__group--center");
  });
});

describe("TopbarBrand", () => {
  it("applies bd-topbar__brand class", () => {
    render(<TopbarBrand data-testid="b">Buildrik</TopbarBrand>);
    expect(screen.getByTestId("b")).toHaveClass("bd-topbar__brand");
  });
});

describe("TopbarStatus", () => {
  it("applies bd-topbar__status class", () => {
    render(<TopbarStatus data-testid="s">Live</TopbarStatus>);
    expect(screen.getByTestId("s")).toHaveClass("bd-topbar__status");
  });
});

describe("TopbarStatusDot", () => {
  it("applies bd-topbar__status-dot class on a span with aria-hidden", () => {
    render(<TopbarStatusDot data-testid="dot" />);
    const dot = screen.getByTestId("dot");
    expect(dot.tagName).toBe("SPAN");
    expect(dot).toHaveClass("bd-topbar__status-dot");
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Topbar — composition smoke", () => {
  it("renders all 5 siblings together", () => {
    render(
      <Topbar data-testid="tb">
        <TopbarGroup data-testid="left">
          <TopbarBrand>Buildrik</TopbarBrand>
        </TopbarGroup>
        <TopbarGroup center data-testid="center">
          <span>switcher</span>
        </TopbarGroup>
        <TopbarGroup data-testid="right">
          <TopbarStatus data-testid="status">
            <TopbarStatusDot data-testid="dot" />
            Live
          </TopbarStatus>
        </TopbarGroup>
      </Topbar>,
    );
    expect(screen.getByTestId("tb")).toHaveClass("bd-topbar");
    expect(screen.getByTestId("left")).toHaveClass("bd-topbar__group");
    expect(screen.getByTestId("center")).toHaveClass("bd-topbar__group--center");
    expect(screen.getByText("Buildrik")).toHaveClass("bd-topbar__brand");
    expect(screen.getByTestId("status")).toHaveClass("bd-topbar__status");
    expect(screen.getByTestId("dot")).toHaveClass("bd-topbar__status-dot");
  });
});
