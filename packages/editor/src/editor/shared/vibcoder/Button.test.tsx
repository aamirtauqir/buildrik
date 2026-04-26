import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "./Button";

describe("vibcoder Button wrapper", () => {
  it("renders base + default variant; OMITS bd-btn--md (md is base default)", () => {
    const { container } = render(<Button>Click</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("bd-btn");
    expect(btn.className).toContain("bd-btn--primary");
    expect(btn.className).not.toContain("bd-btn--md");
  });

  it("emits explicit size class for sm + lg", () => {
    const sm = render(<Button size="sm">x</Button>).container.querySelector("button")!;
    const lg = render(<Button size="lg">x</Button>).container.querySelector("button")!;
    expect(sm.className).toContain("bd-btn--sm");
    expect(lg.className).toContain("bd-btn--lg");
  });

  it("supports all 5 variants", () => {
    for (const v of ["primary", "secondary", "ghost", "danger", "publish"] as const) {
      const { container } = render(<Button variant={v}>x</Button>);
      expect(container.querySelector("button")!.className).toContain(`bd-btn--${v}`);
    }
  });

  it("emits busy state class + aria-busy when busy", () => {
    const { container } = render(<Button busy>x</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("bd-btn--busy");
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  it("omits busy state by default (no aria-busy attr)", () => {
    const { container } = render(<Button>x</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).not.toContain("bd-btn--busy");
    expect(btn.hasAttribute("aria-busy")).toBe(false);
  });

  it("merges caller className", () => {
    const { container } = render(<Button className="extra">x</Button>);
    expect(container.querySelector("button")!.className).toContain("extra");
  });

  it("forwards type + onClick", () => {
    let clicked = false;
    const { container } = render(
      <Button type="submit" onClick={() => { clicked = true; }}>x</Button>
    );
    const btn = container.querySelector("button")!;
    expect(btn.type).toBe("submit");
    btn.click();
    expect(clicked).toBe(true);
  });
});
