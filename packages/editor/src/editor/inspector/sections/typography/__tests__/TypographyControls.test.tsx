/**
 * TypographyControls — what More settings holds now: font style, white-space,
 * word-break, text-indent, vertical-align. Colour, Align, Transform and Word
 * spacing moved onto the section's face (board 807:8342) and are covered in
 * FontControls.test.tsx.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TypographyControls } from "../TypographyControls";

function renderTypo(styles: Record<string, string> = {}, mixedKeys?: ReadonlySet<string>) {
  const onChange = vi.fn();
  const utils = render(
    <TypographyControls styles={styles} onChange={onChange} mixedKeys={mixedKeys} />
  );
  return { onChange, ...utils };
}

const selectWithOption = (container: HTMLElement, optionValue: string) =>
  Array.from(container.querySelectorAll("select")).find((s) =>
    Array.from(s.options).some((o) => o.value === optionValue)
  ) as HTMLSelectElement;

describe("TypographyControls — writes", () => {
  it("clicking Italic writes font-style", () => {
    const { onChange } = renderTypo();
    fireEvent.click(screen.getByRole("button", { name: "Italic" }));
    expect(onChange).toHaveBeenCalledWith("font-style", "italic");
  });

  it("clicking Normal writes font-style normal", () => {
    const { onChange } = renderTypo();
    fireEvent.click(screen.getByRole("button", { name: "Normal" }));
    expect(onChange).toHaveBeenCalledWith("font-style", "normal");
  });

  it("white-space select writes white-space", () => {
    const { onChange, container } = renderTypo();
    fireEvent.change(selectWithOption(container, "nowrap"), { target: { value: "nowrap" } });
    expect(onChange).toHaveBeenCalledWith("white-space", "nowrap");
  });

  it("word-break select writes word-break", () => {
    const { onChange, container } = renderTypo();
    fireEvent.change(selectWithOption(container, "break-all"), { target: { value: "break-all" } });
    expect(onChange).toHaveBeenCalledWith("word-break", "break-all");
  });

  it("vertical-align select writes vertical-align", () => {
    const { onChange, container } = renderTypo();
    fireEvent.change(selectWithOption(container, "super"), { target: { value: "super" } });
    expect(onChange).toHaveBeenCalledWith("vertical-align", "super");
  });

  it("editing text-indent writes with a px unit", () => {
    const { onChange } = renderTypo();
    const row = screen.getByText("Text Indent").closest(".bdi-row-ctrl") as HTMLElement;
    fireEvent.change(row.querySelector("input") as HTMLInputElement, { target: { value: "3" } });
    expect(onChange).toHaveBeenCalledWith("text-indent", "3px");
  });
});

describe("TypographyControls — current values", () => {
  it("marks the active font style aria-pressed", () => {
    renderTypo({ "font-style": "italic" });
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
  });
});
