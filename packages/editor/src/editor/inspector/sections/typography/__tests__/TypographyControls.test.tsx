/**
 * TypographyControls — the advanced typography block: color, align, transform,
 * white-space, word-break, vertical-align, word-spacing/text-indent, plus the
 * multi-select Mixed badges. Complements FontControls.test.tsx (essentials).
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
  it("editing the hex color writes color with a # prefix", () => {
    const { onChange } = renderTypo();
    fireEvent.change(screen.getByRole("textbox", { name: "Color value" }), {
      target: { value: "ff0000" },
    });
    expect(onChange).toHaveBeenCalledWith("color", "#ff0000");
  });

  it("clicking an alignment writes text-align", () => {
    const { onChange } = renderTypo();
    fireEvent.click(screen.getByRole("button", { name: "Center" }));
    expect(onChange).toHaveBeenCalledWith("text-align", "center");
  });

  it("clicking a transform writes text-transform (Upper → uppercase)", () => {
    const { onChange } = renderTypo();
    fireEvent.click(screen.getByRole("button", { name: "Upper" }));
    expect(onChange).toHaveBeenCalledWith("text-transform", "uppercase");
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

  it("editing word-spacing writes with a px unit", () => {
    const { onChange } = renderTypo();
    const row = screen.getByText("Word Spacing").closest(".bdi-row-ctrl") as HTMLElement;
    fireEvent.change(row.querySelector("input") as HTMLInputElement, { target: { value: "3" } });
    expect(onChange).toHaveBeenCalledWith("word-spacing", "3px");
  });
});

describe("TypographyControls — current values + mixed badges", () => {
  it("marks the active alignment button aria-pressed", () => {
    renderTypo({ "text-align": "right" });
    expect(screen.getByRole("button", { name: "Right" })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders a Mixed badge for a differing color across selection", () => {
    renderTypo({}, new Set(["color"]));
    expect(screen.getAllByLabelText("Mixed value").length).toBeGreaterThan(0);
  });
});
