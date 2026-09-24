/**
 * Brand › Styles, board 7316:82153 — type styles + preset variants.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { ReusableStylesSection, presetLine, reusableStylesCount } from "../ReusableStylesSection";
import { DEFAULT_PRESETS } from "../../../constants";
import type { DesignToken } from "../../../types";

const TYPE = [
  { id: "font-heading", value: "Inter" },
  { id: "font-body", value: "Inter" },
  { id: "font-size-4xl", name: "4XL", value: "36px", type: "font-size" },
] as unknown as DesignToken[];
const primary = DEFAULT_PRESETS.find((p) => p.id === "button-primary")!;

describe("Brand › Styles (7316:82153)", () => {
  it("a preset row reads '<Category> · <variant>' over its paint token and radius", () => {
    expect(presetLine(primary, [])).toMatch(/^color-primary · radius \d+$/);
  });

  it("lists type styles then presets in one card; caption count is both", () => {
    const onSelectToken = vi.fn();
    const onOpenPresets = vi.fn();
    render(
      <ReusableStylesSection typeTokens={TYPE} allTokens={TYPE} presets={[primary]} onSelectToken={onSelectToken} onOpenPresets={onOpenPresets} />,
    );
    const rows = [...screen.getByTestId("brand-styles-list").querySelectorAll("[data-style-row]")];
    expect(rows.map((r) => r.getAttribute("data-style-row"))).toEqual(["type", "preset"]);
    expect(rows[0].textContent).toMatch(/Heading 1Inter Bold 36\/40/);
    expect(rows[1].textContent).toMatch(/Button · primary/);
    fireEvent.click(rows[0]);
    expect(onSelectToken).toHaveBeenCalledWith("font-size-4xl");
    fireEvent.click(rows[1]);
    expect(onOpenPresets).toHaveBeenCalled();
    expect(reusableStylesCount(TYPE, [primary])).toBe(2);
  });
});
