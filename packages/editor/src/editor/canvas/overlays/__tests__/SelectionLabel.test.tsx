/**
 * SelectionLabel — the canvas selection tag (board 5940:148012): a plain,
 * non-interactive accent tag naming the selected element. The parent button
 * and the ancestor dropdown are gone (G2-026); Select parent lives in the
 * inspector ⋯, the ← key and Layers.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Composer } from "../../../../engine";
import { SelectionLabel } from "../SelectionLabel";

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function setup() {
  const el = { getType: () => "heading", getTagName: () => "h1", getParent: () => null, getId: () => "h" };
  const composer = { elements: { getElement: vi.fn(() => el) } } as unknown as Composer;
  const canvas = document.createElement("div");
  const node = document.createElement("h1");
  node.setAttribute("data-buildrick-id", "h");
  canvas.appendChild(node);
  document.body.appendChild(canvas);
  render(<SelectionLabel composer={composer} elementId="h" canvasRef={{ current: canvas }} />);
}

describe("SelectionLabel", () => {
  it("renders one tag naming the selected element", () => {
    setup();
    const tag = screen.getByTestId("canvas-selection-tag");
    expect(tag.textContent).toBeTruthy();
  });

  it("has no buttons — no parent button, no ancestor dropdown", () => {
    setup();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
