/**
 * GridSection — container/item gating, template presets, track inputs,
 * span shortcuts, collapsed preview. Complements the render-only smoke
 * test in inspector/__tests__/GridSection.test.tsx.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GridSection } from "../GridSection";

function renderGrid(
  props: Partial<React.ComponentProps<typeof GridSection>> = {}
) {
  const onChange = vi.fn();
  const utils = render(
    <GridSection
      styles={{}}
      onChange={onChange}
      isGridContainer={true}
      isGridItem={false}
      isOpen={true}
      {...props}
    />
  );
  return { onChange, ...utils };
}

describe("GridSection — container/item gating", () => {
  it("shows only container controls for a grid container", () => {
    renderGrid();
    expect(screen.getByText("Grid Container")).toBeInTheDocument();
    expect(screen.queryByText("Grid Item")).not.toBeInTheDocument();
  });

  it("shows only item controls for a grid item", () => {
    renderGrid({ isGridContainer: false, isGridItem: true });
    expect(screen.getByText("Grid Item")).toBeInTheDocument();
    expect(screen.queryByText("Grid Container")).not.toBeInTheDocument();
  });
});

describe("GridSection — container writes", () => {
  it("template preset click writes grid-template-columns", () => {
    const { onChange } = renderGrid();
    fireEvent.click(screen.getByRole("button", { name: "3 Col" }));
    expect(onChange).toHaveBeenCalledWith("grid-template-columns", "1fr 1fr 1fr");
  });

  it("marks the matching template preset as pressed", () => {
    renderGrid({ styles: { "grid-template-columns": "1fr 2fr" } });
    expect(screen.getByRole("button", { name: "1:2" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("Columns input edit writes grid-template-columns verbatim", () => {
    const { onChange } = renderGrid();
    const columnsInput = screen.getByPlaceholderText("1fr 1fr 1fr");
    fireEvent.change(columnsInput, { target: { value: "repeat(3, 1fr)" } });
    expect(onChange).toHaveBeenCalledWith("grid-template-columns", "repeat(3, 1fr)");
  });

  it("Flow button writes grid-auto-flow", () => {
    const { onChange } = renderGrid();
    fireEvent.click(screen.getByRole("button", { name: "col" }));
    expect(onChange).toHaveBeenCalledWith("grid-auto-flow", "column");
  });
});

describe("GridSection — item writes", () => {
  it("Col Span shortcut writes 'span N'", () => {
    const { onChange } = renderGrid({ isGridContainer: false, isGridItem: true });
    // Col Span group renders before Row Span — both have a "2" button.
    fireEvent.click(screen.getAllByRole("button", { name: "2" })[0]);
    expect(onChange).toHaveBeenCalledWith("grid-column", "span 2");
  });

  it("Col Span 'full' writes '1 / -1'", () => {
    const { onChange } = renderGrid({ isGridContainer: false, isGridItem: true });
    fireEvent.click(screen.getAllByRole("button", { name: "full" })[0]);
    expect(onChange).toHaveBeenCalledWith("grid-column", "1 / -1");
  });

  it("grid-column free-text input writes verbatim", () => {
    const { onChange } = renderGrid({ isGridContainer: false, isGridItem: true });
    const [colInput] = screen.getAllByPlaceholderText("auto");
    fireEvent.change(colInput, { target: { value: "2 / 4" } });
    expect(onChange).toHaveBeenCalledWith("grid-column", "2 / 4");
  });
});

describe("GridSection — collapsed preview", () => {
  it("counts explicit tracks as 'cols × rows'", () => {
    renderGrid({
      isOpen: false,
      styles: {
        "grid-template-columns": "1fr 1fr 1fr",
        "grid-template-rows": "auto auto",
      },
    });
    expect(screen.getByText(/3\s*×\s*2/)).toBeInTheDocument();
  });

  it("labels auto-fit templates as 'auto'", () => {
    renderGrid({
      isOpen: false,
      styles: { "grid-template-columns": "repeat(auto-fit, minmax(200px, 1fr))" },
    });
    expect(screen.getByText(/auto\s*×\s*—/)).toBeInTheDocument();
  });
});
