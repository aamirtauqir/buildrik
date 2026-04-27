/**
 * Phase 4 contract tests — verify SliderInput adapter shim → vibcoder Slider.
 * @license BSD-3-Clause
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { SliderInput } from "../SliderInput";

describe("SliderInput adapter shim (vibcoder Slider)", () => {
  it("renders vibcoder bd-slider with track + range input", () => {
    const { container } = render(<SliderInput value={50} onChange={() => undefined} />);
    expect(container.querySelector(".bd-slider")).not.toBeNull();
    expect(container.querySelector(".bd-slider__track")).not.toBeNull();
    const input = container.querySelector('input[type="range"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(Number(input?.value)).toBe(50);
  });

  it("forwards min / max / step to range input", () => {
    const { container } = render(
      <SliderInput value={5} onChange={() => undefined} min={0} max={10} step={1} />,
    );
    const input = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(input.min).toBe("0");
    expect(input.max).toBe("10");
    expect(input.step).toBe("1");
  });

  it("renders label + unit in the head row", () => {
    const { container } = render(
      <SliderInput value={42} onChange={() => undefined} label="Opacity" unit="%" />,
    );
    expect(container.querySelector(".bd-slider__head")).not.toBeNull();
    expect(container.querySelector(".bd-slider__label")?.textContent).toBe("Opacity");
    expect(container.querySelector(".bd-slider__value")?.textContent).toContain("42");
    expect(container.querySelector(".bd-slider__value-unit")?.textContent).toBe("%");
  });

  it("fires onChange with the new numeric value when the range input changes", () => {
    const onChange = vi.fn();
    const { container } = render(<SliderInput value={0} onChange={onChange} min={0} max={100} />);
    const input = container.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "73" } });
    expect(onChange).toHaveBeenCalledWith(73);
  });

  it("disabled applies pointer-events:none + opacity:0.5 on wrapper and disables the input", () => {
    const { container } = render(<SliderInput value={10} onChange={() => undefined} disabled />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.pointerEvents).toBe("none");
    expect(wrapper.style.opacity).toBe("0.5");
    const input = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it("forwards ref to underlying range <input>", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<SliderInput ref={ref} value={0} onChange={() => undefined} />);
    expect(ref.current?.tagName).toBe("INPUT");
    expect(ref.current?.type).toBe("range");
  });

  it("composes caller-supplied className on the wrapper", () => {
    const { container } = render(
      <SliderInput value={0} onChange={() => undefined} className="my-extra" />,
    );
    expect((container.firstElementChild as HTMLElement).className).toBe("my-extra");
  });
});
