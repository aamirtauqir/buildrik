import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Switch } from "./Switch";

describe("vibcoder Switch wrapper", () => {
  it("renders <button role=switch> with track + thumb children", () => {
    const { container } = render(<Switch checked={false} />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("role")).toBe("switch");
    expect(btn.type).toBe("button");
    expect(btn.className).toBe("bd-switch");
    expect(container.querySelector(".bd-switch__track")).toBeTruthy();
    expect(container.querySelector(".bd-switch__thumb")).toBeTruthy();
  });

  it("aria-checked tracks `checked` prop (drives CSS off-state)", () => {
    const off = render(<Switch checked={false} />).container.querySelector("button")!;
    const on = render(<Switch checked />).container.querySelector("button")!;
    expect(off.getAttribute("aria-checked")).toBe("false");
    expect(on.getAttribute("aria-checked")).toBe("true");
  });

  it("does NOT emit bd-switch--off (aria-checked drives state)", () => {
    const { container } = render(<Switch checked={false} />);
    expect(container.querySelector("button")!.className).not.toContain("bd-switch--off");
  });

  it("calls onCheckedChange with toggled value on click", () => {
    let next: boolean | null = null;
    const { container } = render(
      <Switch checked={false} onCheckedChange={(v) => { next = v; }} />
    );
    fireEvent.click(container.querySelector("button")!);
    expect(next).toBe(true);
  });

  it("does NOT call onCheckedChange when disabled", () => {
    let next: boolean | null = null;
    const { container } = render(
      <Switch checked={false} disabled onCheckedChange={(v) => { next = v; }} />
    );
    const btn = container.querySelector("button")!;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(btn);
    expect(next).toBeNull();
  });

  it("merges caller className", () => {
    const { container } = render(<Switch checked={false} className="extra" />);
    expect(container.querySelector("button")!.className).toContain("extra");
  });

  it("preserves caller onClick alongside onCheckedChange", () => {
    let clicked = false;
    let next: boolean | null = null;
    const { container } = render(
      <Switch
        checked={false}
        onClick={() => { clicked = true; }}
        onCheckedChange={(v) => { next = v; }}
      />
    );
    fireEvent.click(container.querySelector("button")!);
    expect(clicked).toBe(true);
    expect(next).toBe(true);
  });
});
