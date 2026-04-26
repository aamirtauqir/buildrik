/**
 * Footer tests — verify markup contracts.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer, FooterGroup, FooterChip, FooterDot } from "./Footer";

describe("Footer", () => {
  it("renders <footer> with bd-footer class and role='contentinfo'", () => {
    render(<Footer data-testid="f">x</Footer>);
    const f = screen.getByTestId("f");
    expect(f.tagName).toBe("FOOTER");
    expect(f).toHaveClass("bd-footer");
    expect(f).toHaveAttribute("role", "contentinfo");
  });

  it("merges caller className", () => {
    render(<Footer data-testid="f" className="extra">x</Footer>);
    expect(screen.getByTestId("f")).toHaveClass("bd-footer");
    expect(screen.getByTestId("f")).toHaveClass("extra");
  });
});

describe("FooterGroup", () => {
  it("applies bd-footer__group class", () => {
    render(<FooterGroup data-testid="g">x</FooterGroup>);
    expect(screen.getByTestId("g")).toHaveClass("bd-footer__group");
  });
});

describe("FooterChip", () => {
  it("applies bd-footer__chip class on a span", () => {
    render(<FooterChip data-testid="c">100%</FooterChip>);
    const c = screen.getByTestId("c");
    expect(c.tagName).toBe("SPAN");
    expect(c).toHaveClass("bd-footer__chip");
  });
});

describe("FooterDot", () => {
  it("applies bd-footer__dot class on a span with aria-hidden", () => {
    render(<FooterDot data-testid="dot" />);
    const dot = screen.getByTestId("dot");
    expect(dot.tagName).toBe("SPAN");
    expect(dot).toHaveClass("bd-footer__dot");
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Footer — composition smoke", () => {
  it("renders all 4 siblings together", () => {
    render(
      <Footer data-testid="f">
        <FooterGroup data-testid="left">
          <FooterChip data-testid="chip-zoom">100%</FooterChip>
          <FooterChip>
            <FooterDot data-testid="dot" />
            Saved
          </FooterChip>
        </FooterGroup>
        <FooterGroup data-testid="right">
          <FooterChip>Desktop</FooterChip>
        </FooterGroup>
      </Footer>,
    );
    expect(screen.getByTestId("f")).toHaveClass("bd-footer");
    expect(screen.getByTestId("left")).toHaveClass("bd-footer__group");
    expect(screen.getByTestId("right")).toHaveClass("bd-footer__group");
    expect(screen.getByTestId("chip-zoom")).toHaveClass("bd-footer__chip");
    expect(screen.getByTestId("dot")).toHaveClass("bd-footer__dot");
  });
});
