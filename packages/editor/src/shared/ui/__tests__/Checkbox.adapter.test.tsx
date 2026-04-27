/**
 * Phase 4 contract tests — verify Checkbox adapter shim → vibcoder Checkbox.
 * @license BSD-3-Clause
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Checkbox } from "../Checkbox";

describe("Checkbox adapter shim (vibcoder Checkbox)", () => {
  it("renders a label.bd-checkbox > input.bd-checkbox__input[type=checkbox]", () => {
    const { container } = render(<Checkbox />);
    const label = container.querySelector("label.bd-checkbox");
    expect(label).not.toBeNull();
    const input = label?.querySelector("input") as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input?.type).toBe("checkbox");
    expect(input?.className.split(" ")).toContain("bd-checkbox__input");
  });

  it("size 'sm' / 'lg' apply BEM modifier classes (md is default no-op)", () => {
    const sm = render(<Checkbox size="sm" />).container.firstElementChild!;
    const lg = render(<Checkbox size="lg" />).container.firstElementChild!;
    expect(sm.className.split(" ")).toContain("bd-checkbox--sm");
    expect(lg.className.split(" ")).toContain("bd-checkbox--lg");
  });

  it("error → bd-checkbox--error class + aria-invalid on input", () => {
    const { container } = render(<Checkbox error />);
    const label = container.querySelector("label")!;
    expect(label.className.split(" ")).toContain("bd-checkbox--error");
    const input = container.querySelector("input")!;
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("renders label child as bd-checkbox__label", () => {
    const { container } = render(<Checkbox label="Agree" />);
    const span = container.querySelector(".bd-checkbox__label");
    expect(span?.textContent).toBe("Agree");
  });

  it("indeterminate sets the DOM property after mount", () => {
    const { container } = render(<Checkbox indeterminate />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
  });

  it("forwards onChange + checked", () => {
    const onChange = vi.fn();
    const { container } = render(<Checkbox checked={false} onChange={onChange} />);
    (container.querySelector("input") as HTMLInputElement).click();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("disabled passes through to <input>", () => {
    const { container } = render(<Checkbox disabled />);
    expect((container.querySelector("input") as HTMLInputElement).disabled).toBe(true);
  });

  it("forwards ref to underlying <input>", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Checkbox ref={ref} />);
    expect(ref.current?.tagName).toBe("INPUT");
    expect(ref.current?.type).toBe("checkbox");
  });
});
