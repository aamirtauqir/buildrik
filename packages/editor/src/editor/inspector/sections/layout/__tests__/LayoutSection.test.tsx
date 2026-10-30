/**
 * LayoutSection — 2L9 247:21216 / 36:2 "Children layout": Display as a
 * select, the flex settings as select rows (or the grid controls), then
 * Placement. Overflow / visibility live in Advanced layout. No Width /
 * Height here (DD-9).
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LayoutAdvancedSection, LayoutSection } from "..";

function renderLayout(styles: Record<string, string> = {}, extra: Partial<React.ComponentProps<typeof LayoutSection>> = {}) {
  const onChange = vi.fn();
  render(<LayoutSection styles={styles} onChange={onChange} onBatchChange={vi.fn()} isOpen {...extra} />);
  return { onChange };
}

const combo = (name: string) => screen.getByRole("combobox", { name: new RegExp(`^${name}`) });

describe("LayoutSection — Display", () => {
  it("is titled Children layout, with Display one select incl. None and the inline modes", () => {
    const { onChange } = renderLayout({ display: "block" });
    expect(screen.getByText("Children layout")).toBeInTheDocument();
    const display = combo("Display");
    expect(display).toHaveValue("block");
    const values = Array.from(display.querySelectorAll("option")).map((o) => o.getAttribute("value"));
    expect(values).toEqual(expect.arrayContaining(["block", "flex", "grid", "none", "inline-block", "inline", "inline-flex", "inline-grid"]));
    fireEvent.change(display, { target: { value: "inline-flex" } });
    expect(onChange).toHaveBeenCalledWith("display", "inline-flex");
  });
});

describe("LayoutSection — flex / grid inline (no Flexbox / Grid section)", () => {
  it("Grid shows Columns + Gap", () => {
    renderLayout({ display: "grid", "grid-template-columns": "repeat(3, 1fr)" });
    expect(screen.getByLabelText("Columns")).toHaveValue("3");
    expect(screen.getByLabelText("Gap")).toBeInTheDocument();
  });

  it("Flex (36:2): Direction · Justify · Align items · Gap as rows, Wrap behind More settings", () => {
    const { onChange } = renderLayout({ display: "flex" }, { onAdvancedToggle: vi.fn() });
    for (const name of ["Direction", "Justify", "Align items"]) expect(combo(name)).toBeInTheDocument();
    expect(screen.getByLabelText("Gap")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /^Wrap/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /^Align lines/ })).not.toBeInTheDocument();
    expect(screen.getByText("More settings")).toBeInTheDocument();
    fireEvent.change(combo("Justify"), { target: { value: "space-between" } });
    expect(onChange).toHaveBeenCalledWith("justify-content", "space-between");
  });

  it("Flex wrapping with its own gaps (247:21216): Wrap, Align lines, Row / Column gap — and no More settings", () => {
    renderLayout(
      { display: "flex", "flex-wrap": "wrap", "row-gap": "24px", "column-gap": "32px" },
      { onAdvancedToggle: vi.fn() },
    );
    expect(combo("Wrap")).toHaveValue("wrap");
    expect(combo("Align lines")).toBeInTheDocument();
    expect(screen.getByLabelText("Row gap")).toBeInTheDocument();
    expect(screen.getByLabelText("Column gap")).toBeInTheDocument();
    expect(screen.queryByLabelText("Gap")).not.toBeInTheDocument();
    expect(screen.queryByText("More settings")).not.toBeInTheDocument();
  });

  it("Block shows neither", () => {
    renderLayout({ display: "block" });
    expect(screen.queryByLabelText("Columns")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /^Direction/ })).not.toBeInTheDocument();
  });
});

describe("LayoutSection — Position, and no size", () => {
  it("Position is on the face under Placement; Z-index follows it once positioned", () => {
    const { onChange } = renderLayout({ position: "relative" });
    expect(screen.getByText("Placement")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Z-index/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: /^Position/ }), { target: { value: "relative" } });
    expect(onChange).toHaveBeenCalledWith("position", "relative");
  });

  it("does not write width / height (Size owns them)", () => {
    renderLayout();
    expect(screen.queryByRole("group", { name: "Size" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Width sizing")).not.toBeInTheDocument();
  });

  it("overflow and visibility are not here — they are Advanced layout", () => {
    renderLayout({}, { onAdvancedToggle: vi.fn(), advancedExpanded: true });
    expect(screen.queryByText("Overflow X")).not.toBeInTheDocument();
    render(<LayoutAdvancedSection styles={{}} onChange={vi.fn()} isOpen />);
    expect(screen.getByText("Advanced layout")).toBeInTheDocument();
    expect(screen.getByText("Overflow X")).toBeInTheDocument();
  });
});
