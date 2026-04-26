import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Slider } from "./Slider";

describe("vibcoder Slider wrapper", () => {
  it("renders bd-slider composite with track + fill + thumb + native input", () => {
    const { container } = render(<Slider value={50} onChange={() => {}} />);
    expect(container.querySelector(".bd-slider")).toBeTruthy();
    expect(container.querySelector(".bd-slider__track")).toBeTruthy();
    expect(container.querySelector(".bd-slider__fill")).toBeTruthy();
    expect(container.querySelector(".bd-slider__thumb")).toBeTruthy();
    expect(container.querySelector("input[type=range]")).toBeTruthy();
  });

  it("OMITS the head row when label is undefined", () => {
    const { container } = render(<Slider value={50} onChange={() => {}} />);
    expect(container.querySelector(".bd-slider__head")).toBeNull();
  });

  it("renders the head row with label + value when label is set", () => {
    const { container } = render(
      <Slider value={86} label="Opacity" unit="%" onChange={() => {}} />
    );
    const head = container.querySelector(".bd-slider__head")!;
    expect(head).toBeTruthy();
    expect(head.querySelector(".bd-slider__label")!.textContent).toBe("Opacity");
    const valueEl = head.querySelector(".bd-slider__value")!;
    expect(valueEl.textContent).toBe("86%");
    expect(valueEl.querySelector(".bd-slider__value-unit")!.textContent).toBe("%");
  });

  it("OMITS the unit span when unit is undefined", () => {
    const { container } = render(
      <Slider value={50} label="Plain" onChange={() => {}} />
    );
    expect(container.querySelector(".bd-slider__value-unit")).toBeNull();
  });

  it("computes fill width + thumb left as percent of (value - min) / (max - min)", () => {
    const { container } = render(
      <Slider value={25} min={0} max={100} onChange={() => {}} />
    );
    const fill = container.querySelector(".bd-slider__fill")! as HTMLDivElement;
    const thumb = container.querySelector(".bd-slider__thumb")! as HTMLDivElement;
    expect(fill.style.width).toBe("25%");
    expect(thumb.style.left).toBe("25%");
  });

  it("handles non-zero min correctly (value=15 in [10,20] = 50%)", () => {
    const { container } = render(
      <Slider value={15} min={10} max={20} onChange={() => {}} />
    );
    const fill = container.querySelector(".bd-slider__fill")! as HTMLDivElement;
    expect(fill.style.width).toBe("50%");
  });

  it("guards divide-by-zero when min === max (renders 0%)", () => {
    const { container } = render(
      <Slider value={5} min={5} max={5} onChange={() => {}} />
    );
    const fill = container.querySelector(".bd-slider__fill")! as HTMLDivElement;
    expect(fill.style.width).toBe("0%");
  });

  it("forwards min/max/step to native input", () => {
    const { container } = render(
      <Slider value={5} min={0} max={10} step={0.5} onChange={() => {}} />
    );
    const input = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(input.min).toBe("0");
    expect(input.max).toBe("10");
    expect(input.step).toBe("0.5");
    expect(input.value).toBe("5");
  });

  it("calls onChange with numeric value when input changes", () => {
    let next: number | null = null;
    const { container } = render(
      <Slider value={50} onChange={(v) => { next = v; }} />
    );
    const input = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "75" } });
    expect(next).toBe(75);
  });

  it("merges caller className on the outer wrapper", () => {
    const { container } = render(
      <Slider value={50} onChange={() => {}} className="extra" />
    );
    expect(container.querySelector(".bd-slider")!.className).toContain("extra");
  });
});
