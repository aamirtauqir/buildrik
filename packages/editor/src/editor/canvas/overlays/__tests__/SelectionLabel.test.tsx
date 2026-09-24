/**
 * SelectionLabel (G2-026): no ancestor dropdown — the path lives in Layers —
 * and the parent button's hint names the chord that selects the parent (←),
 * not ⌥↑, which reorders.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Composer } from "../../../../engine";
import { SelectionLabel } from "../SelectionLabel";

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function setup() {
  const parent = { getType: () => "container", getTagName: () => "div", getParent: () => null, getId: () => "p" };
  const el = { getType: () => "heading", getTagName: () => "h1", getParent: () => parent, getId: () => "h" };
  const composer = { elements: { getElement: vi.fn(() => el) } } as unknown as Composer;
  const canvas = document.createElement("div");
  const node = document.createElement("h1");
  node.setAttribute("data-buildrick-id", "h");
  canvas.appendChild(node);
  document.body.appendChild(canvas);
  const onSelectParent = vi.fn();
  render(<SelectionLabel composer={composer} elementId="h" canvasRef={{ current: canvas }} onSelectParent={onSelectParent} />);
  return { onSelectParent };
}

describe("SelectionLabel", () => {
  it("the parent hint names ←, and the button selects the parent", () => {
    const { onSelectParent } = setup();
    const btn = screen.getByTitle(/Go to parent/);
    expect(btn.getAttribute("title")).toContain("(←)");
    expect(btn.getAttribute("title")).not.toContain("Alt");
    fireEvent.click(btn);
    expect(onSelectParent).toHaveBeenCalled();
  });

  it("the name is a label, not a dropdown of ancestors", () => {
    setup();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
