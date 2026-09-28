/**
 * LayoutSection — board 17: Display Block · Flex · Grid · None, the flex or
 * grid controls inline, Position. No Width / Height here (DD-9).
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LayoutSection } from "..";

function renderLayout(styles: Record<string, string> = {}, extra: Partial<React.ComponentProps<typeof LayoutSection>> = {}) {
  const onChange = vi.fn();
  render(<LayoutSection styles={styles} onChange={onChange} onBatchChange={vi.fn()} isOpen {...extra} />);
  return { onChange };
}

describe("LayoutSection — Display", () => {
  it("four segments incl. None, each writes display", () => {
    const { onChange } = renderLayout({ display: "block" });
    for (const name of ["Block", "Flex", "Grid", "None"]) expect(screen.getByRole("button", { name })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Block" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "None" }));
    expect(onChange).toHaveBeenCalledWith("display", "none");
  });

  it("the inline modes sit behind More settings, and show while one is set", () => {
    const { onChange } = renderLayout({ display: "block" }, { advancedExpanded: true, onAdvancedToggle: vi.fn() });
    fireEvent.change(screen.getByLabelText("Inline"), { target: { value: "inline-flex" } });
    expect(onChange).toHaveBeenCalledWith("display", "inline-flex");
  });
});

describe("LayoutSection — flex / grid inline (no Flexbox / Grid section)", () => {
  it("Grid shows Columns + Gap", () => {
    renderLayout({ display: "grid", "grid-template-columns": "repeat(3, 1fr)" });
    expect(screen.getByLabelText("Columns")).toHaveValue(3);
    expect(screen.getByLabelText("Gap")).toBeInTheDocument();
  });

  it("Flex shows Direction and the align grid", () => {
    renderLayout({ display: "flex" });
    expect(screen.getByRole("group", { name: "Align" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Column" })).toBeInTheDocument();
  });

  it("Block shows neither", () => {
    renderLayout({ display: "block" });
    expect(screen.queryByLabelText("Columns")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Align" })).not.toBeInTheDocument();
  });
});

describe("LayoutSection — Position, and no size", () => {
  it("Position is on the face", () => {
    const { onChange } = renderLayout();
    fireEvent.change(screen.getByRole("combobox", { name: /^Position/ }), { target: { value: "relative" } });
    expect(onChange).toHaveBeenCalledWith("position", "relative");
  });

  it("does not write width / height (Size owns them)", () => {
    renderLayout();
    expect(screen.queryByRole("group", { name: "Size" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Width sizing")).not.toBeInTheDocument();
  });

  it("overflow and visibility wait behind More settings", () => {
    renderLayout({}, { onAdvancedToggle: vi.fn() });
    expect(screen.queryByText("Overflow")).not.toBeInTheDocument();
  });
});
