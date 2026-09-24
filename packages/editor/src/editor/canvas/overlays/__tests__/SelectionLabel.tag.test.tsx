/**
 * Selection tag — board 5940:148012 ("Section · Hero"): accent fill, white
 * 11px, at (−2, −24) from the element's top-left, in canvas units.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SelectionLabel } from "../SelectionLabel";

describe("SelectionLabel — the board's accent tag", () => {
  it("renders the element type as an accent tag above the element's top-left", () => {
    const canvas = document.createElement("div");
    const el = document.createElement("section");
    el.setAttribute("data-buildrick-id", "hero");
    canvas.appendChild(el);
    document.body.appendChild(canvas);
    const rect = (x: number, y: number, w: number, h: number) => () =>
      ({ left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, x, y, toJSON: () => ({}) });
    canvas.getBoundingClientRect = rect(0, 0, 800, 600);
    el.getBoundingClientRect = rect(100, 80, 600, 200);
    const ref = { current: canvas };
    const composer = { elements: { getElement: () => ({ getType: () => "section", getTagName: () => "SECTION", getCustomData: () => undefined }) } };
    render(<SelectionLabel composer={composer as never} elementId="hero" canvasRef={ref} />);
    const tag = screen.getByTestId("canvas-selection-tag");
    expect(tag).toHaveTextContent("Section");
    expect(tag.className).toContain("tw:bg-[var(--bk-accent)]");
    expect(tag.className).toContain("tw:text-[11px]");
    expect(tag.style.left).toBe("98px");
    expect(tag.style.top).toBe("56px");
    expect(tag.querySelector("button")).toBeNull();
    canvas.remove();
  });

  it("reads Type · name when the element carries a layer name (board: Section · Hero)", () => {
    const canvas = document.createElement("div");
    const el = document.createElement("section");
    el.setAttribute("data-buildrick-id", "hero");
    canvas.appendChild(el);
    document.body.appendChild(canvas);
    const composer = {
      elements: {
        getElement: () => ({
          getType: () => "section",
          getTagName: () => "SECTION",
          getCustomData: (k: string) => (k === "layerName" ? "Hero" : undefined),
        }),
      },
      on: () => {},
      off: () => {},
    };
    render(<SelectionLabel composer={composer as never} elementId="hero" canvasRef={{ current: canvas }} />);
    expect(screen.getByTestId("canvas-selection-tag")).toHaveTextContent("Section · Hero");
    canvas.remove();
  });
});
