import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { NumericStepper } from "./NumericStepper";

describe("vibcoder NumericStepper wrapper", () => {
  const noop = () => {};

  it("renders bd-stepper composite with two buttons + input", () => {
    const { container } = render(<NumericStepper value={5} onChange={noop} />);
    const stepper = container.querySelector(".bd-stepper")!;
    expect(stepper).toBeTruthy();
    expect(container.querySelectorAll(".bd-stepper__btn").length).toBe(2);
    const input = container.querySelector(".bd-stepper__input") as HTMLInputElement;
    expect(input.value).toBe("5");
  });

  it("decrement button calls onChange(value - step)", () => {
    const onChange = vi.fn();
    const { container } = render(<NumericStepper value={5} step={2} onChange={onChange} />);
    const dec = container.querySelectorAll(".bd-stepper__btn")[0] as HTMLButtonElement;
    fireEvent.click(dec);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("increment button calls onChange(value + step)", () => {
    const onChange = vi.fn();
    const { container } = render(<NumericStepper value={5} step={2} onChange={onChange} />);
    const inc = container.querySelectorAll(".bd-stepper__btn")[1] as HTMLButtonElement;
    fireEvent.click(inc);
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("clamps to min", () => {
    const onChange = vi.fn();
    const { container } = render(
      <NumericStepper value={1} min={1} onChange={onChange} />,
    );
    const dec = container.querySelectorAll(".bd-stepper__btn")[0] as HTMLButtonElement;
    fireEvent.click(dec);
    expect(onChange).not.toHaveBeenCalled();
    expect(dec.disabled).toBe(true);
  });

  it("clamps to max", () => {
    const onChange = vi.fn();
    const { container } = render(
      <NumericStepper value={10} max={10} onChange={onChange} />,
    );
    const inc = container.querySelectorAll(".bd-stepper__btn")[1] as HTMLButtonElement;
    fireEvent.click(inc);
    expect(onChange).not.toHaveBeenCalled();
    expect(inc.disabled).toBe(true);
  });

  it("ArrowUp on input calls onChange(value + step)", () => {
    const onChange = vi.fn();
    const { container } = render(<NumericStepper value={5} step={1} onChange={onChange} />);
    const input = container.querySelector(".bd-stepper__input")!;
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it("Shift+ArrowUp uses 10× step multiplier", () => {
    const onChange = vi.fn();
    const { container } = render(<NumericStepper value={0} step={1} onChange={onChange} />);
    const input = container.querySelector(".bd-stepper__input")!;
    fireEvent.keyDown(input, { key: "ArrowUp", shiftKey: true });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("typing into input calls onChange with parsed number", () => {
    const onChange = vi.fn();
    const { container } = render(<NumericStepper value={0} onChange={onChange} />);
    const input = container.querySelector(".bd-stepper__input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "42" } });
    expect(onChange).toHaveBeenCalledWith(42);
  });

  it("renders unit cell when unit prop set", () => {
    const { container } = render(<NumericStepper value={5} unit="px" onChange={noop} />);
    const unit = container.querySelector(".bd-stepper__unit");
    expect(unit?.textContent).toBe("px");
  });

  it("error prop adds bd-stepper--error + aria-invalid", () => {
    const { container } = render(<NumericStepper value={5} error onChange={noop} />);
    const stepper = container.querySelector(".bd-stepper")!;
    const input = container.querySelector(".bd-stepper__input")!;
    expect(stepper.className).toContain("bd-stepper--error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("disabled blocks all interaction", () => {
    const onChange = vi.fn();
    const { container } = render(
      <NumericStepper value={5} disabled onChange={onChange} />,
    );
    const buttons = container.querySelectorAll(".bd-stepper__btn") as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwardRef targets the input element", () => {
    let ref: HTMLInputElement | null = null;
    render(
      <NumericStepper
        value={5}
        onChange={noop}
        ref={(el) => {
          ref = el;
        }}
      />,
    );
    expect(ref).toBeInstanceOf(HTMLInputElement);
  });
});
