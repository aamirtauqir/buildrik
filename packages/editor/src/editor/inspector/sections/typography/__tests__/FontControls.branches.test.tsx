/**
 * FontControls — remaining branches not covered by FontControls.test.tsx:
 * the paired line-height field, Letter / Word spacing, weight change, extra
 * decoration options, and unlinking a bound line-height type token.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FontControls } from "../FontControls";

function renderFont(styles: Record<string, string> = {}) {
  const onChange = vi.fn();
  const utils = render(<FontControls styles={styles} onChange={onChange} />);
  return { onChange, ...utils };
}

function editRow(labelText: string, value: string) {
  const row = screen.getByText(labelText).closest(".bdi-row-ctrl") as HTMLElement;
  fireEvent.change(row.querySelector("input") as HTMLInputElement, { target: { value } });
}

describe("FontControls — remaining unit rows", () => {
  /* Board 807:8342 pairs it with Size, so it has no label of its own — the
     second field in the row is line height. */
  it("editing the paired second field writes line-height", () => {
    const { onChange } = renderFont();
    const pair = screen.getByRole("group", { name: "Size and line height" });
    const inputs = pair.querySelectorAll("input");
    fireEvent.change(inputs[inputs.length - 1] as HTMLInputElement, { target: { value: "1.5" } });
    expect(onChange).toHaveBeenCalledWith("line-height", "1.5px");
  });

  it("editing letter-spacing writes letter-spacing", () => {
    const { onChange } = renderFont();
    editRow("Letter", "2");
    expect(onChange).toHaveBeenCalledWith("letter-spacing", "2px");
  });

  it("editing word-spacing writes word-spacing", () => {
    const { onChange } = renderFont();
    editRow("Word", "3");
    expect(onChange).toHaveBeenCalledWith("word-spacing", "3px");
  });

  /* Promoted out of More settings by the board — colour, align and transform
     are on the section's face now. */
  it("colour, align and transform write from the section face", () => {
    const { onChange } = renderFont();
    fireEvent.change(screen.getByRole("textbox", { name: "Color value" }), {
      target: { value: "ff0000" },
    });
    expect(onChange).toHaveBeenCalledWith("color", "#ff0000");
    fireEvent.click(screen.getByRole("button", { name: "Center" }));
    expect(onChange).toHaveBeenCalledWith("text-align", "center");
    fireEvent.click(screen.getByRole("button", { name: "Upper" }));
    expect(onChange).toHaveBeenCalledWith("text-transform", "uppercase");
  });
});

describe("FontControls — weight + decoration + style branches", () => {
  it("changing weight to Light writes 300", () => {
    const { onChange, container } = renderFont();
    const weightSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "300")
    ) as HTMLSelectElement;
    fireEvent.change(weightSelect, { target: { value: "300" } });
    expect(onChange).toHaveBeenCalledWith("font-weight", "300");
  });

  it("Strike writes line-through and Over writes overline", () => {
    const { onChange } = renderFont();
    fireEvent.click(screen.getByRole("button", { name: "Strike" }));
    expect(onChange).toHaveBeenCalledWith("text-decoration", "line-through");
    fireEvent.click(screen.getByRole("button", { name: "Over" }));
    expect(onChange).toHaveBeenCalledWith("text-decoration", "overline");
  });

});

describe("FontControls — type token chain (line-height bound)", () => {
  it("shows the unlink button and fires onChange when unlinking line-height", () => {
    const { onChange } = renderFont({ "line-height": "var(--buildrick-design-type-body)" });
    const unlink = screen.getByRole("button", { name: "Unlink line-height type token" });
    fireEvent.click(unlink);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
