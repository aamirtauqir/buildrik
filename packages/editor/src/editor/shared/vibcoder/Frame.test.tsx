import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Frame } from "./Frame";

describe("vibcoder Frame wrapper", () => {
  it("renders <div> with bd-frame class", () => {
    const { container } = render(<Frame ratio="1:1">child</Frame>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("bd-frame");
  });

  it('emits bd-frame--1-1 when ratio="1:1"', () => {
    const { container } = render(<Frame ratio="1:1">x</Frame>);
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "bd-frame--1-1",
    );
  });

  it('emits the correct dashed-ratio class for each ratio (":" → "-")', () => {
    const cases = [
      ["16:9", "bd-frame--16-9"],
      ["4:3", "bd-frame--4-3"],
      ["3:2", "bd-frame--3-2"],
    ] as const;
    for (const [ratio, expected] of cases) {
      const { container } = render(<Frame ratio={ratio}>x</Frame>);
      const cls = (container.firstElementChild as HTMLElement).className;
      expect(cls).toContain(expected);
      // Ensure the colon form never leaks into output.
      expect(cls).not.toContain(`bd-frame--${ratio}`);
    }
  });

  it("forwards ref to the bd-frame element", () => {
    let captured: HTMLDivElement | null = null;
    render(
      <Frame
        ratio="16:9"
        ref={(el) => {
          captured = el;
        }}
      >
        x
      </Frame>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
    expect(captured!.classList.contains("bd-frame")).toBe(true);
  });

  it("merges caller className", () => {
    const { container } = render(
      <Frame ratio="1:1" className="custom-class">
        x
      </Frame>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-frame");
    expect(cls).toContain("custom-class");
  });

  it("composes ratio + caller className correctly", () => {
    const { container } = render(
      <Frame ratio="16:9" className="extra">
        x
      </Frame>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-frame");
    expect(cls).toContain("bd-frame--16-9");
    expect(cls).toContain("extra");
  });

  it("renders children (img/div as media slot)", () => {
    const { getByAltText, getByText } = render(
      <Frame ratio="4:3">
        <img alt="hero" src="data:image/svg+xml;utf8," />
        <div>caption</div>
      </Frame>,
    );
    expect(getByAltText("hero")).toBeTruthy();
    expect(getByText("caption")).toBeTruthy();
  });

  it("forwards arbitrary HTML attributes (data-*, aria-*)", () => {
    const { container } = render(
      <Frame ratio="1:1" data-testid="my-frame" aria-label="thumbnail">
        x
      </Frame>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-testid")).toBe("my-frame");
    expect(el.getAttribute("aria-label")).toBe("thumbnail");
  });
});
