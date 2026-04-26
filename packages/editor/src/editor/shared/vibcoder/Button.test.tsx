import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "./Button";

describe("vibcoder Button wrapper", () => {
  it("renders default variant + size classes", () => {
    const { container } = render(<Button>Click</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("bd-btn");
    expect(btn.className).toContain("bd-btn--primary");
    expect(btn.className).toContain("bd-btn--md");
  });

  it("respects variant + size props", () => {
    const { container } = render(<Button variant="ghost" size="lg">x</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("bd-btn--ghost");
    expect(btn.className).toContain("bd-btn--lg");
  });

  it("supports all 5 variants", () => {
    const variants = ["primary", "secondary", "ghost", "danger", "publish"] as const;
    for (const v of variants) {
      const { container } = render(<Button variant={v}>x</Button>);
      const btn = container.querySelector("button")!;
      expect(btn.className).toContain(`bd-btn--${v}`);
    }
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

  it("applies busy modifier when busy prop is true", () => {
    const { container } = render(<Button busy>x</Button>);
    expect(container.querySelector("button")!.className).toContain("bd-btn--busy");
  });
});
