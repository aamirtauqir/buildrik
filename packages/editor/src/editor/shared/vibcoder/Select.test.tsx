import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Select } from "./Select";

describe("vibcoder Select wrapper", () => {
  it("renders inside bd-select-wrap; OMITS bd-select--md (md is base default)", () => {
    const { container } = render(
      <Select><option>a</option></Select>
    );
    const wrap = container.firstElementChild!;
    expect(wrap.className).toBe("bd-select-wrap");
    const sel = container.querySelector("select")!;
    expect(sel.className).toContain("bd-select");
    expect(sel.className).not.toContain("bd-select--md");
  });

  it("emits explicit size class for xs and sm", () => {
    const xs = render(<Select size="xs"><option>x</option></Select>).container.querySelector("select")!;
    const sm = render(<Select size="sm"><option>x</option></Select>).container.querySelector("select")!;
    expect(xs.className).toContain("bd-select--xs");
    expect(sm.className).toContain("bd-select--sm");
  });

  it("emits bd-select--error + aria-invalid when error", () => {
    const { container } = render(
      <Select error><option>x</option></Select>
    );
    const sel = container.querySelector("select")!;
    expect(sel.className).toContain("bd-select--error");
    expect(sel.getAttribute("aria-invalid")).toBe("true");
  });

  it("merges caller className", () => {
    const { container } = render(
      <Select className="extra"><option>x</option></Select>
    );
    expect(container.querySelector("select")!.className).toContain("extra");
  });

  it("forwards options as children + onChange", () => {
    let captured = "";
    const { container } = render(
      <Select onChange={(e) => { captured = e.target.value; }}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    );
    const sel = container.querySelector("select")!;
    expect(sel.querySelectorAll("option")).toHaveLength(2);
    fireEvent.change(sel, { target: { value: "b" } });
    expect(captured).toBe("b");
  });
});
