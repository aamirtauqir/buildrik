/**
 * FontControls — font-size / weight / line-height / decoration / style
 * rendering and writes. Token chain buttons (CP5) render in bound/unbound
 * states via the type registry fallback (no provider needed).
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

const findSelectWithOption = (container: HTMLElement, optionValue: string) =>
  Array.from(container.querySelectorAll("select")).find((s) =>
    Array.from(s.options).some((o) => o.value === optionValue)
  );

describe("FontControls — current values render", () => {
  it("shows the font-size numeric part", () => {
    const { container } = renderFont({ "font-size": "18px" });
    const sizeInput = container.querySelector(".bdi-fld input") as HTMLInputElement;
    expect(sizeInput).toHaveValue("18");
  });

  it("defaults font-size display to 16 when unset", () => {
    const { container } = renderFont();
    const sizeInput = container.querySelector(".bdi-fld input") as HTMLInputElement;
    expect(sizeInput).toHaveValue("16");
  });

  it("shows the current font-weight in the Weight select", () => {
    const { container } = renderFont({ "font-weight": "700" });
    const weightSelect = findSelectWithOption(container, "700") as HTMLSelectElement;
    expect(weightSelect.value).toBe("700");
  });

  it("marks the active text-decoration button as pressed", () => {
    renderFont({ "text-decoration": "underline" });
    expect(screen.getByRole("button", { name: "Under" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Strike" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});

describe("FontControls — engine writes", () => {
  it("editing size writes font-size with unit", () => {
    const { onChange, container } = renderFont({ "font-size": "16px" });
    const sizeInput = container.querySelector(".bdi-fld input") as HTMLInputElement;
    fireEvent.change(sizeInput, { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith("font-size", "20px");
  });

  it("changing weight writes font-weight", () => {
    const { onChange, container } = renderFont();
    const weightSelect = findSelectWithOption(container, "700") as HTMLSelectElement;
    fireEvent.change(weightSelect, { target: { value: "700" } });
    expect(onChange).toHaveBeenCalledWith("font-weight", "700");
  });

  it("clicking a decoration button writes text-decoration", () => {
    const { onChange } = renderFont();
    fireEvent.click(screen.getByRole("button", { name: "Under" }));
    expect(onChange).toHaveBeenCalledWith("text-decoration", "underline");
  });

  it("clicking Italic writes font-style", () => {
    const { onChange } = renderFont();
    fireEvent.click(screen.getByRole("button", { name: "Italic" }));
    expect(onChange).toHaveBeenCalledWith("font-style", "italic");
  });
});

describe("FontControls — type token chain buttons (CP5)", () => {
  it("renders unbound chain buttons for font-size and line-height", () => {
    renderFont();
    expect(
      screen.getByRole("button", { name: "Link font-size to type token" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Link line-height to type token" })
    ).toBeInTheDocument();
  });

  it("renders the unlink button when font-size is bound to a type token", () => {
    renderFont({ "font-size": "var(--buildrick-design-type-body)" });
    expect(
      screen.getByRole("button", { name: "Unlink font-size type token" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Link font-size to type token" })
    ).not.toBeInTheDocument();
  });
});
