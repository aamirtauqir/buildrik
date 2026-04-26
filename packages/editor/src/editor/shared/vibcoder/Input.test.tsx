import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Input } from "./Input";

describe("vibcoder Input wrapper", () => {
  it("renders base; OMITS bd-input--error by default; no aria-invalid", () => {
    const { container } = render(<Input />);
    const el = container.querySelector("input")!;
    expect(el.className).toContain("bd-input");
    expect(el.className).not.toContain("bd-input--error");
    expect(el.hasAttribute("aria-invalid")).toBe(false);
  });

  it("emits bd-input--error + aria-invalid when error", () => {
    const { container } = render(<Input error />);
    const el = container.querySelector("input")!;
    expect(el.className).toContain("bd-input--error");
    expect(el.getAttribute("aria-invalid")).toBe("true");
  });

  it("merges caller className", () => {
    const { container } = render(<Input className="extra" />);
    expect(container.querySelector("input")!.className).toContain("extra");
  });

  it("forwards native attrs (type, name, placeholder, value)", () => {
    const { container } = render(
      <Input type="email" name="email" placeholder="you@example.com" defaultValue="a@b.co" />
    );
    const el = container.querySelector("input")!;
    expect(el.type).toBe("email");
    expect(el.name).toBe("email");
    expect(el.placeholder).toBe("you@example.com");
    expect(el.value).toBe("a@b.co");
  });

  it("forwards onChange", () => {
    let captured = "";
    const { container } = render(
      <Input onChange={(e) => { captured = e.target.value; }} />
    );
    const el = container.querySelector("input")!;
    fireEvent.change(el, { target: { value: "typed" } });
    expect(captured).toBe("typed");
  });
});
