/**
 * UnifiedSelectionToolbar — board 5936:44788: three buttons at the element's
 * top-right (Duplicate · Delete · More); More opens the element menu (G2-024).
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnifiedSelectionToolbar } from "../UnifiedSelectionToolbar";

beforeEach(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as never;
});

function setup() {
  const canvas = document.createElement("div");
  const el = document.createElement("div");
  el.setAttribute("data-buildrick-id", "e1");
  canvas.appendChild(el);
  document.body.appendChild(canvas);
  Object.defineProperty(canvas, "offsetWidth", { value: 1000 });
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 }) as DOMRect;
  el.getBoundingClientRect = () => ({ left: 100, top: 50, right: 600, bottom: 250, width: 500, height: 200 }) as DOMRect;
  const props = {
    composer: { elements: { getElement: () => ({}) } } as never,
    elementId: "e1",
    canvasRef: { current: canvas },
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onOpenMenu: vi.fn(),
  };
  render(<UnifiedSelectionToolbar {...props} />);
  return props;
}

describe("UnifiedSelectionToolbar", () => {
  it("renders exactly Duplicate, Delete, More, anchored to the element's top-right", () => {
    setup();
    const bar = screen.getByTestId("selection-toolbar");
    expect(bar.querySelectorAll("button")).toHaveLength(3);
    expect(bar.style.left).toBe("592px"); // right edge 600 − 8
    expect(bar.style.top).toBe("58px"); // top 50 + 8
    expect(bar.style.transform).toBe("translateX(-100%) scale(1)");
  });

  it("wires the buttons; More opens the element menu", () => {
    const p = setup();
    fireEvent.click(screen.getByTestId("selection-toolbar-duplicate"));
    fireEvent.click(screen.getByTestId("selection-toolbar-delete"));
    fireEvent.click(screen.getByTestId("selection-toolbar-more"));
    expect(p.onDuplicate).toHaveBeenCalled();
    expect(p.onDelete).toHaveBeenCalled();
    expect(p.onOpenMenu).toHaveBeenCalledWith("e1", expect.objectContaining({ x: expect.any(Number) }));
  });
});
