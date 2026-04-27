/**
 * Phase 4 contract tests — verify Select adapter shim → vibcoder Select.
 * @license BSD-3-Clause
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "../Select";

describe("Select adapter shim (vibcoder Select)", () => {
  it("renders a select with bd-select class wrapped in bd-select-wrap", () => {
    const { container } = render(
      <Select>
        <option value="a">A</option>
      </Select>,
    );
    const wrap = container.querySelector(".bd-select-wrap");
    expect(wrap).not.toBeNull();
    const select = wrap?.querySelector("select");
    expect(select).not.toBeNull();
    expect(select?.className.split(" ")).toContain("bd-select");
  });

  it("renders children as <option>", () => {
    render(
      <Select defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    expect(screen.getAllByRole("option").length).toBe(2);
  });

  it("forwards value + onChange", () => {
    const onChange = vi.fn();
    render(
      <Select value="a" onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("size 'xs' applies bd-select--xs modifier", () => {
    const { container } = render(
      <Select size="xs">
        <option value="a">A</option>
      </Select>,
    );
    const select = container.querySelector("select");
    expect(select?.className.split(" ")).toContain("bd-select--xs");
  });

  it("default size 'md' does NOT add a modifier class", () => {
    const { container } = render(
      <Select>
        <option value="a">A</option>
      </Select>,
    );
    const cls = container.querySelector("select")?.className.split(" ") ?? [];
    expect(cls).not.toContain("bd-select--md");
  });

  it("error=true → bd-select--error + aria-invalid", () => {
    const { container } = render(
      <Select error>
        <option value="a">A</option>
      </Select>,
    );
    const select = container.querySelector("select")!;
    expect(select.className.split(" ")).toContain("bd-select--error");
    expect(select.getAttribute("aria-invalid")).toBe("true");
  });

  it("disabled passes through to <select>", () => {
    render(
      <Select disabled>
        <option value="a">A</option>
      </Select>,
    );
    expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
  });

  it("forwards ref to underlying <select>", () => {
    const ref = React.createRef<HTMLSelectElement>();
    render(
      <Select ref={ref}>
        <option value="a">A</option>
      </Select>,
    );
    expect(ref.current?.tagName).toBe("SELECT");
  });
});
