/**
 * Phase 4 contract tests — verify Switch adapter shim → vibcoder Switch.
 * @license BSD-3-Clause
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Switch } from "../Switch";

describe("Switch adapter shim (vibcoder Switch)", () => {
  it("renders a button with role=switch + bd-switch class", () => {
    const { container } = render(<Switch checked={false} />);
    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute("role")).toBe("switch");
    expect(btn?.className.split(" ")).toContain("bd-switch");
  });

  it("aria-checked reflects checked prop", () => {
    const off = render(<Switch checked={false} />).container.querySelector("button")!;
    const on = render(<Switch checked />).container.querySelector("button")!;
    expect(off.getAttribute("aria-checked")).toBe("false");
    expect(on.getAttribute("aria-checked")).toBe("true");
  });

  it("fires onCheckedChange with the toggled value on click", () => {
    const onCheckedChange = vi.fn();
    const { container } = render(
      <Switch checked={false} onCheckedChange={onCheckedChange} />,
    );
    (container.querySelector("button") as HTMLButtonElement).click();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does NOT fire onCheckedChange when disabled", () => {
    const onCheckedChange = vi.fn();
    const { container } = render(
      <Switch checked={false} disabled onCheckedChange={onCheckedChange} />,
    );
    (container.querySelector("button") as HTMLButtonElement).click();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("renders track + thumb children", () => {
    const { container } = render(<Switch checked={false} />);
    expect(container.querySelector(".bd-switch__track")).not.toBeNull();
    expect(container.querySelector(".bd-switch__thumb")).not.toBeNull();
  });

  it("forwards ref to the underlying <button>", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch ref={ref} checked={false} />);
    expect(ref.current?.tagName).toBe("BUTTON");
  });
});
