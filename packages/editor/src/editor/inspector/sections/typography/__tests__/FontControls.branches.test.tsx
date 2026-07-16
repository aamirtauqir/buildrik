/**
 * FontControls — remaining branches not covered by FontControls.test.tsx:
 * line-height / letter-spacing writes, weight change, extra decoration options,
 * font-style Normal, and unlinking a bound line-height type token.
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
  it("editing line-height writes line-height (default px unit)", () => {
    const { onChange } = renderFont();
    editRow("Line height", "1.5");
    expect(onChange).toHaveBeenCalledWith("line-height", "1.5px");
  });

  it("editing letter-spacing writes letter-spacing", () => {
    const { onChange } = renderFont();
    editRow("Letter spacing", "2");
    expect(onChange).toHaveBeenCalledWith("letter-spacing", "2px");
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

  it("clicking Normal writes font-style normal", () => {
    const { onChange } = renderFont();
    fireEvent.click(screen.getByRole("button", { name: "Normal" }));
    expect(onChange).toHaveBeenCalledWith("font-style", "normal");
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
