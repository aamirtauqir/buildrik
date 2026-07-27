import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Checkbox } from "./Checkbox";

describe("vibcoder Checkbox wrapper", () => {
  it("renders label > input composite; OMITS bd-checkbox--md (md is base default)", () => {
    const { container } = render(<Checkbox />);
    const label = container.firstElementChild!;
    expect(label.tagName).toBe("LABEL");
    expect(label.className).toContain("bd-checkbox");
    expect(label.className).not.toContain("bd-checkbox--md");
    const input = container.querySelector("input")!;
    expect(input.type).toBe("checkbox");
    expect(input.className).toBe("bd-checkbox__input");
  });

  it("emits explicit size class for sm and lg on the LABEL (not input)", () => {
    const sm = render(<Checkbox size="sm" />).container.firstElementChild!;
    const lg = render(<Checkbox size="lg" />).container.firstElementChild!;
    expect(sm.className).toContain("bd-checkbox--sm");
    expect(lg.className).toContain("bd-checkbox--lg");
  });

  it("emits bd-checkbox--error + aria-invalid on input when error", () => {
    const { container } = render(<Checkbox error />);
    const label = container.firstElementChild!;
    const input = container.querySelector("input")!;
    expect(label.className).toContain("bd-checkbox--error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("renders bd-checkbox__label span when label prop is provided", () => {
    const { container } = render(<label className="bk-stack bk-stack--row bk-stack--sm"><Checkbox /><span>Agree</span></label>);
    const span = container.querySelector(".bd-checkbox__label")!;
    expect(span).toBeTruthy();
    expect(span.textContent).toBe("Agree");
  });

  it("omits bd-checkbox__label span when no label prop", () => {
    const { container } = render(<Checkbox />);
    expect(container.querySelector(".bd-checkbox__label")).toBeNull();
  });

  it("sets DOM .indeterminate property when indeterminate prop is true", () => {
    const { container, rerender } = render(<Checkbox indeterminate />);
    const input = container.querySelector("input")!;
    expect(input.indeterminate).toBe(true);
    rerender(<Checkbox indeterminate={false} />);
    expect(input.indeterminate).toBe(false);
  });

  it("forwards native attrs (checked, name, value) + onChange", () => {
    let captured = false;
    const { container } = render(
      <Checkbox
        defaultChecked
        name="agree"
        value="yes"
        onChange={(e) => { captured = e.target.checked; }}
      />
    );
    const input = container.querySelector("input")!;
    expect(input.checked).toBe(true);
    expect(input.name).toBe("agree");
    expect(input.value).toBe("yes");
    fireEvent.click(input);
    expect(captured).toBe(false);
  });

  it("merges caller className onto LABEL", () => {
    const { container } = render(<Checkbox className="extra" />);
    expect(container.firstElementChild!.className).toContain("extra");
  });
});
