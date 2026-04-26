/**
 * LeftPanel tests — verify markup contracts.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  LeftPanel,
  LeftPanelHead,
  LeftPanelTitle,
  LeftPanelSub,
  LeftPanelActions,
  LeftPanelBody,
} from "./LeftPanel";

describe("LeftPanel — root + siblings", () => {
  it("LeftPanel applies bd-left-panel class", () => {
    render(<LeftPanel data-testid="lp">x</LeftPanel>);
    expect(screen.getByTestId("lp")).toHaveClass("bd-left-panel");
  });

  it("LeftPanel merges caller className", () => {
    render(<LeftPanel data-testid="lp" className="extra">x</LeftPanel>);
    expect(screen.getByTestId("lp")).toHaveClass("bd-left-panel");
    expect(screen.getByTestId("lp")).toHaveClass("extra");
  });

  it("LeftPanelHead applies bd-left-panel__head class", () => {
    render(<LeftPanelHead data-testid="h">x</LeftPanelHead>);
    expect(screen.getByTestId("h")).toHaveClass("bd-left-panel__head");
  });

  it("LeftPanelTitle renders <h2> with bd-left-panel__title class", () => {
    render(<LeftPanelTitle data-testid="t">Pages</LeftPanelTitle>);
    const t = screen.getByTestId("t");
    expect(t.tagName).toBe("H2");
    expect(t).toHaveClass("bd-left-panel__title");
  });

  it("LeftPanelSub applies bd-left-panel__sub class", () => {
    render(<LeftPanelSub data-testid="s">12</LeftPanelSub>);
    expect(screen.getByTestId("s")).toHaveClass("bd-left-panel__sub");
  });

  it("LeftPanelActions applies bd-left-panel__actions class", () => {
    render(<LeftPanelActions data-testid="a">x</LeftPanelActions>);
    expect(screen.getByTestId("a")).toHaveClass("bd-left-panel__actions");
  });

  it("LeftPanelBody applies bd-left-panel__body class", () => {
    render(<LeftPanelBody data-testid="b">x</LeftPanelBody>);
    expect(screen.getByTestId("b")).toHaveClass("bd-left-panel__body");
  });
});

describe("LeftPanel — composition smoke", () => {
  it("composes all 6 siblings together", () => {
    render(
      <LeftPanel data-testid="lp">
        <LeftPanelHead data-testid="head">
          <div>
            <LeftPanelTitle data-testid="title">Pages</LeftPanelTitle>
            <LeftPanelSub data-testid="sub">12</LeftPanelSub>
          </div>
          <LeftPanelActions data-testid="actions">
            <button>+</button>
          </LeftPanelActions>
        </LeftPanelHead>
        <LeftPanelBody data-testid="body">items</LeftPanelBody>
      </LeftPanel>,
    );
    expect(screen.getByTestId("lp")).toHaveClass("bd-left-panel");
    expect(screen.getByTestId("head")).toHaveClass("bd-left-panel__head");
    expect(screen.getByTestId("title")).toHaveClass("bd-left-panel__title");
    expect(screen.getByTestId("sub")).toHaveClass("bd-left-panel__sub");
    expect(screen.getByTestId("actions")).toHaveClass("bd-left-panel__actions");
    expect(screen.getByTestId("body")).toHaveClass("bd-left-panel__body");
  });
});
