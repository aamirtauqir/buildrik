import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "./Icon";

describe("vibcoder Icon wrapper", () => {
  it("renders an <svg> with bd-icon class and a <use> child pointing at the sprite", () => {
    const { container } = render(<Icon name="check" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("class")).toContain("bd-icon");
    const use = svg.querySelector("use")!;
    expect(use.getAttribute("href")).toBe(
      "/src/themes/components/atoms/icons.svg#i-check"
    );
  });

  it("OMITS bd-icon--md when size is unset (16px base = no modifier)", () => {
    const { container } = render(<Icon name="plus" />);
    const cls = container.querySelector("svg")!.getAttribute("class")!;
    expect(cls).toBe("bd-icon");
  });

  it("emits explicit modifier for every size", () => {
    for (const s of ["xs", "sm", "md", "lg", "xl"] as const) {
      const { container } = render(<Icon name="search" size={s} />);
      expect(container.querySelector("svg")!.getAttribute("class")).toContain(
        `bd-icon--${s}`
      );
    }
  });

  it("emits aria-hidden=true by default", () => {
    const { container } = render(<Icon name="info" />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe(
      "true"
    );
  });

  it("allows aria-label override (caller provides accessible text for meaningful icons)", () => {
    const { container } = render(
      <Icon name="trash" aria-label="Delete page" aria-hidden={false} />
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe("Delete page");
    expect(svg.getAttribute("aria-hidden")).toBe("false");
  });

  it("merges caller className", () => {
    const { container } = render(<Icon name="x" className="extra" />);
    expect(container.querySelector("svg")!.getAttribute("class")).toContain(
      "extra"
    );
  });

  it("uses the icon name verbatim in the sprite href fragment", () => {
    const { container } = render(<Icon name="more-horizontal" />);
    expect(container.querySelector("use")!.getAttribute("href")).toBe(
      "/src/themes/components/atoms/icons.svg#i-more-horizontal"
    );
  });
});
