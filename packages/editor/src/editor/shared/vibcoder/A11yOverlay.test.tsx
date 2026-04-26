/**
 * A11yOverlay tests — verify markup contracts.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  A11yOverlay,
  A11yOverlayTile,
  A11yOverlaySwatch,
  A11yOverlayRatio,
  A11yOverlayHit,
} from "./A11yOverlay";

describe("A11yOverlay — siblings", () => {
  it("A11yOverlay applies bd-a11y class", () => {
    render(<A11yOverlay data-testid="a">x</A11yOverlay>);
    expect(screen.getByTestId("a")).toHaveClass("bd-a11y");
  });

  it("A11yOverlay merges caller className", () => {
    render(<A11yOverlay data-testid="a" className="extra">x</A11yOverlay>);
    expect(screen.getByTestId("a")).toHaveClass("bd-a11y");
    expect(screen.getByTestId("a")).toHaveClass("extra");
  });

  it("A11yOverlayTile applies bd-a11y__tile", () => {
    render(<A11yOverlayTile data-testid="t">x</A11yOverlayTile>);
    expect(screen.getByTestId("t")).toHaveClass("bd-a11y__tile");
  });

  it("A11yOverlaySwatch applies bd-a11y__swatch", () => {
    render(<A11yOverlaySwatch data-testid="s">x</A11yOverlaySwatch>);
    expect(screen.getByTestId("s")).toHaveClass("bd-a11y__swatch");
  });

  it("A11yOverlaySwatch applies --warn modifier when tone='warn'", () => {
    render(<A11yOverlaySwatch tone="warn" data-testid="s">x</A11yOverlaySwatch>);
    expect(screen.getByTestId("s")).toHaveClass("bd-a11y__swatch--warn");
  });

  it("A11yOverlaySwatch applies --fail modifier when tone='fail'", () => {
    render(<A11yOverlaySwatch tone="fail" data-testid="s">x</A11yOverlaySwatch>);
    expect(screen.getByTestId("s")).toHaveClass("bd-a11y__swatch--fail");
  });

  it("A11yOverlaySwatch omits tone modifier when tone unset", () => {
    render(<A11yOverlaySwatch data-testid="s">x</A11yOverlaySwatch>);
    const s = screen.getByTestId("s");
    expect(s).not.toHaveClass("bd-a11y__swatch--warn");
    expect(s).not.toHaveClass("bd-a11y__swatch--fail");
  });

  it("A11yOverlayRatio applies bd-a11y__ratio on a span", () => {
    render(<A11yOverlayRatio data-testid="r">7.4</A11yOverlayRatio>);
    const r = screen.getByTestId("r");
    expect(r.tagName).toBe("SPAN");
    expect(r).toHaveClass("bd-a11y__ratio");
  });

  it("A11yOverlayHit applies bd-a11y__hit", () => {
    render(<A11yOverlayHit data-testid="h">x</A11yOverlayHit>);
    expect(screen.getByTestId("h")).toHaveClass("bd-a11y__hit");
  });

  it("A11yOverlayHit applies --fail modifier when kind='fail'", () => {
    render(<A11yOverlayHit kind="fail" data-testid="h">x</A11yOverlayHit>);
    expect(screen.getByTestId("h")).toHaveClass("bd-a11y__hit--fail");
  });
});

describe("A11yOverlay — composition smoke", () => {
  it("composes 5 siblings together", () => {
    render(
      <A11yOverlay data-testid="a">
        <A11yOverlayTile data-testid="tile">
          <h4>Contrast</h4>
          <A11yOverlaySwatch tone="warn" data-testid="sw">
            <span>aA</span>
            <A11yOverlayRatio data-testid="r">3.2</A11yOverlayRatio>
          </A11yOverlaySwatch>
        </A11yOverlayTile>
        <A11yOverlayTile>
          <A11yOverlayHit kind="fail" data-testid="hit">
            !
          </A11yOverlayHit>
        </A11yOverlayTile>
      </A11yOverlay>,
    );
    expect(screen.getByTestId("a")).toHaveClass("bd-a11y");
    expect(screen.getByTestId("tile")).toHaveClass("bd-a11y__tile");
    expect(screen.getByTestId("sw")).toHaveClass("bd-a11y__swatch--warn");
    expect(screen.getByTestId("r")).toHaveClass("bd-a11y__ratio");
    expect(screen.getByTestId("hit")).toHaveClass("bd-a11y__hit--fail");
  });
});
