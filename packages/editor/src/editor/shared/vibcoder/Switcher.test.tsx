import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Switcher } from "./Switcher";

describe("vibcoder Switcher wrapper", () => {
  it("renders <div> with bd-switcher class", () => {
    const { container } = render(<Switcher>x</Switcher>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("bd-switcher");
  });

  it("OMITS modifier class for default threshold (md)", () => {
    const { container } = render(<Switcher>x</Switcher>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).not.toContain("bd-switcher--threshold-md");
  });

  it("emits bd-switcher--threshold-{sm|lg} for non-default thresholds", () => {
    for (const t of ["sm", "lg"] as const) {
      const { container } = render(<Switcher threshold={t}>x</Switcher>);
      expect((container.firstElementChild as HTMLElement).className).toContain(
        `bd-switcher--threshold-${t}`,
      );
    }
  });

  it("explicit threshold='md' still omits modifier (matches base CSS fallback)", () => {
    const { container } = render(<Switcher threshold="md">x</Switcher>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).not.toContain("bd-switcher--threshold-md");
  });

  it("merges caller className", () => {
    const { container } = render(<Switcher className="custom-class">x</Switcher>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-switcher");
    expect(cls).toContain("custom-class");
  });

  it("forwards ref to the bd-switcher element", () => {
    let captured: HTMLDivElement | null = null;
    render(
      <Switcher
        ref={(el) => {
          captured = el;
        }}
      >
        x
      </Switcher>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
    expect(captured!.classList.contains("bd-switcher")).toBe(true);
  });

  it("renders children", () => {
    const { getByText } = render(
      <Switcher>
        <span>hello</span>
      </Switcher>,
    );
    expect(getByText("hello")).toBeTruthy();
  });

  it("forwards arbitrary HTML attributes (data-*, aria-*)", () => {
    const { container } = render(
      <Switcher data-testid="my-switcher" aria-label="form row">
        x
      </Switcher>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-testid")).toBe("my-switcher");
    expect(el.getAttribute("aria-label")).toBe("form row");
  });

  it("composes non-default modifier + caller className correctly", () => {
    const { container } = render(
      <Switcher threshold="lg" className="extra">
        x
      </Switcher>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-switcher");
    expect(cls).toContain("bd-switcher--threshold-lg");
    expect(cls).toContain("extra");
  });
});
