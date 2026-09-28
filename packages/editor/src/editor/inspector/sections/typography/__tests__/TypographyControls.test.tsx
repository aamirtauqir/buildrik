/**
 * TypographyControls — what More settings holds: Transform, Decoration,
 * Letter, Word, Style, White space, Word break, Text indent, Vertical align —
 * everything the section sets that boards 1 and 4 keep off its face.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ADVANCED_TYPOGRAPHY_COUNT, TypographyControls } from "../TypographyControls";

function renderTypo(styles: Record<string, string> = {}, mixedKeys?: ReadonlySet<string>) {
  const onChange = vi.fn();
  const utils = render(<TypographyControls styles={styles} onChange={onChange} mixedKeys={mixedKeys} />);
  return { onChange, ...utils };
}

const selectWithOption = (container: HTMLElement, optionValue: string) =>
  Array.from(container.querySelectorAll("select")).find((s) =>
    Array.from(s.options).some((o) => o.value === optionValue)
  ) as HTMLSelectElement;

function editRow(labelText: string, value: string) {
  const row = screen.getByText(labelText).closest(".bdi-row-ctrl") as HTMLElement;
  fireEvent.change(row.querySelector("input") as HTMLInputElement, { target: { value } });
}

describe("TypographyControls — rows", () => {
  it("holds as many rows as the More settings badge claims", () => {
    const { container } = renderTypo();
    expect(container.querySelectorAll(".bdi-row-ctrl").length).toBe(ADVANCED_TYPOGRAPHY_COUNT);
  });
});

describe("TypographyControls — writes", () => {
  it("transform and decoration", () => {
    const { onChange } = renderTypo();
    fireEvent.click(screen.getByRole("radio", { name: "Upper" }));
    expect(onChange).toHaveBeenCalledWith("text-transform", "uppercase");
    fireEvent.click(screen.getByRole("radio", { name: "Strike" }));
    expect(onChange).toHaveBeenCalledWith("text-decoration", "line-through");
    fireEvent.click(screen.getByRole("radio", { name: "Over" }));
    expect(onChange).toHaveBeenCalledWith("text-decoration", "overline");
  });

  it("letter and word spacing", () => {
    const { onChange } = renderTypo();
    editRow("Letter", "2");
    expect(onChange).toHaveBeenCalledWith("letter-spacing", "2px");
    editRow("Word", "3");
    expect(onChange).toHaveBeenCalledWith("word-spacing", "3px");
  });

  it("clicking Italic / Normal writes font-style", () => {
    const { onChange } = renderTypo();
    fireEvent.click(screen.getByRole("radio", { name: "Italic" }));
    expect(onChange).toHaveBeenCalledWith("font-style", "italic");
    fireEvent.click(screen.getByRole("radio", { name: "Normal" }));
    expect(onChange).toHaveBeenCalledWith("font-style", "normal");
  });

  it("white-space, word-break and vertical-align selects", () => {
    const { onChange, container } = renderTypo();
    fireEvent.change(selectWithOption(container, "nowrap"), { target: { value: "nowrap" } });
    expect(onChange).toHaveBeenCalledWith("white-space", "nowrap");
    fireEvent.change(selectWithOption(container, "break-all"), { target: { value: "break-all" } });
    expect(onChange).toHaveBeenCalledWith("word-break", "break-all");
    fireEvent.change(selectWithOption(container, "super"), { target: { value: "super" } });
    expect(onChange).toHaveBeenCalledWith("vertical-align", "super");
  });

  it("editing text-indent writes with a px unit", () => {
    const { onChange } = renderTypo();
    editRow("Text Indent", "3");
    expect(onChange).toHaveBeenCalledWith("text-indent", "3px");
  });
});

describe("TypographyControls — current values", () => {
  it("marks the active font style and decoration checked", () => {
    renderTypo({ "font-style": "italic", "text-decoration": "underline" });
    expect(screen.getByRole("radio", { name: "Italic" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Under" })).toHaveAttribute("aria-checked", "true");
  });
});
