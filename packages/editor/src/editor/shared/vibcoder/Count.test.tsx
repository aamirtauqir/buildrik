import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Count } from "./Count";

describe("vibcoder Count wrapper", () => {
  it("renders base; OMITS bd-count--neutral and bd-count--md (both virtual defaults)", () => {
    const { container } = render(<Count>3</Count>);
    const c = container.querySelector("span")!;
    expect(c.className).toContain("bd-count");
    expect(c.className).not.toContain("bd-count--neutral");
    expect(c.className).not.toContain("bd-count--md");
  });

  it("emits explicit class for non-default sizes", () => {
    for (const s of ["xs", "sm", "lg"] as const) {
      const { container } = render(<Count size={s}>1</Count>);
      expect(container.querySelector("span")!.className).toContain(`bd-count--${s}`);
    }
  });

  it("emits explicit class for non-neutral variants", () => {
    for (const v of ["accent", "success", "warning", "error", "ink"] as const) {
      const { container } = render(<Count variant={v}>1</Count>);
      expect(container.querySelector("span")!.className).toContain(`bd-count--${v}`);
    }
  });

  it("emits bd-count--dot modifier when dot prop is true", () => {
    const { container } = render(<Count dot />);
    expect(container.querySelector("span")!.className).toContain("bd-count--dot");
  });

  it("emits bd-count--inline modifier when inline prop is true", () => {
    const { container } = render(<Count inline>9</Count>);
    expect(container.querySelector("span")!.className).toContain("bd-count--inline");
  });

  it("composes dot + xs (status indicator at xs scale)", () => {
    const { container } = render(<Count dot size="xs" />);
    const cls = container.querySelector("span")!.className;
    expect(cls).toContain("bd-count--dot");
    expect(cls).toContain("bd-count--xs");
  });

  it("merges caller className", () => {
    const { container } = render(<Count className="extra">x</Count>);
    expect(container.querySelector("span")!.className).toContain("extra");
  });
});
