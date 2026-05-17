import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Radio, RadioGroup } from "./Radio";

describe("vibcoder Radio wrapper", () => {
  it("renders label > input composite; OMITS bd-radio--md (md is base default)", () => {
    const { container } = render(<Radio />);
    const label = container.firstElementChild!;
    expect(label.tagName).toBe("LABEL");
    expect(label.className).toContain("bd-radio");
    expect(label.className).not.toContain("bd-radio--md");
    const input = container.querySelector("input")!;
    expect(input.type).toBe("radio");
    expect(input.className).toBe("bd-radio__input");
  });

  it("emits explicit size class for sm and lg on the LABEL (not input)", () => {
    const sm = render(<Radio size="sm" />).container.firstElementChild!;
    const lg = render(<Radio size="lg" />).container.firstElementChild!;
    expect(sm.className).toContain("bd-radio--sm");
    expect(lg.className).toContain("bd-radio--lg");
  });

  it("emits bd-radio--error + aria-invalid on input when error", () => {
    const { container } = render(<Radio error />);
    const label = container.firstElementChild!;
    const input = container.querySelector("input")!;
    expect(label.className).toContain("bd-radio--error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("renders bd-radio__label span when label prop is provided", () => {
    const { container } = render(<Radio label="Option A" />);
    const span = container.querySelector(".bd-radio__label")!;
    expect(span).toBeTruthy();
    expect(span.textContent).toBe("Option A");
  });

  it("omits bd-radio__label span when no label prop", () => {
    const { container } = render(<Radio />);
    expect(container.querySelector(".bd-radio__label")).toBeNull();
  });

  it("forwards native attrs (name, value) + fires onChange on click when unchecked", () => {
    let received = "";
    const { container } = render(
      <Radio
        name="kind"
        value="alpha"
        onChange={(e) => { received = e.target.value; }}
      />
    );
    const input = container.querySelector("input")!;
    expect(input.checked).toBe(false);
    expect(input.name).toBe("kind");
    expect(input.value).toBe("alpha");
    // Native radio fires change exactly once: when transitioning false → true.
    fireEvent.click(input);
    expect(received).toBe("alpha");
  });

  it("merges caller className onto LABEL", () => {
    const { container } = render(<Radio className="extra" />);
    expect(container.firstElementChild!.className).toContain("extra");
  });
});

describe("vibcoder RadioGroup wrapper", () => {
  it("renders role=radiogroup with bd-radio-group class and aria-label", () => {
    const { container } = render(
      <RadioGroup name="favColor" aria-label="Favorite color">
        <Radio value="red" />
        <Radio value="blue" />
      </RadioGroup>
    );
    const group = container.firstElementChild!;
    expect(group.getAttribute("role")).toBe("radiogroup");
    expect(group.className).toContain("bd-radio-group");
    expect(group.getAttribute("aria-label")).toBe("Favorite color");
  });

  it("threads name= to every Radio child that doesn't already set name", () => {
    const { container } = render(
      <RadioGroup name="shared">
        <Radio value="a" />
        <Radio value="b" />
      </RadioGroup>
    );
    const inputs = container.querySelectorAll("input");
    expect(inputs).toHaveLength(2);
    inputs.forEach((i) => expect(i.name).toBe("shared"));
  });

  it("does NOT override an explicit name set by a child", () => {
    const { container } = render(
      <RadioGroup name="parent">
        <Radio value="a" name="own-name" />
      </RadioGroup>
    );
    expect(container.querySelector("input")!.name).toBe("own-name");
  });

  it("passes non-Radio children through untouched", () => {
    const { container } = render(
      <RadioGroup name="x">
        <div data-testid="heading">Pick one</div>
        <Radio value="a" />
      </RadioGroup>
    );
    expect(container.querySelector("[data-testid=heading]")).toBeTruthy();
    expect(container.querySelector("input")!.name).toBe("x");
  });

  it("emits bd-radio-group--horizontal class when orientation=horizontal", () => {
    const { container } = render(
      <RadioGroup name="x" orientation="horizontal">
        <Radio value="a" />
      </RadioGroup>
    );
    expect(container.firstElementChild!.className).toContain("bd-radio-group--horizontal");
  });
});
