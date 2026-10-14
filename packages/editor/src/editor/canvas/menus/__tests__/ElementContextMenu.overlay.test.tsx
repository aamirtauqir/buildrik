/**
 * The canvas context menu (and its submenus) float in the chrome overlay root.
 *
 * It rendered inside the canvas, under a `position: relative; z-index: 1`
 * wrapper (Canvas.tsx). That wrapper is a stacking context, so the menu's own
 * z-index (3500) only ranked it inside layer 1 — and the Inspector column
 * (z-index 20) painted over every part of the menu and submenu that crossed
 * it. Measured at 1440×900: right-clicking near the canvas's right edge put
 * the menu at x 1100–1300, and document.elementFromPoint on "Style ›" returned
 * an Inspector row, so a real click could not reach it.
 *
 * jsdom has no stacking contexts, so this pins the structure: the menu is not
 * a descendant of the canvas subtree it was opened from; it is in
 * #bk-overlay-root, the one mount every chrome overlay shares (Gate 22).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ElementContextMenu } from "../ElementContextMenu";
import type { ActionContext, ContextAction } from "../contextMenuRegistry";

afterEach(cleanup);

const actions: ContextAction[] = [
  { id: "dup", label: "Duplicate", group: "Edit", handler: vi.fn() },
  {
    id: "style",
    label: "Style",
    group: "Style",
    submenu: [{ id: "paste-styles", label: "Paste styles", group: "Quick Style", handler: vi.fn() }],
  },
];
const context = { composer: {}, element: {}, isRoot: false } as unknown as ActionContext;

function renderInCanvas() {
  return render(
    <div data-testid="canvas-layer" style={{ position: "relative", zIndex: 1 }}>
      <ElementContextMenu x={1100} y={250} actions={actions} context={context} onClose={vi.fn()} />
    </div>,
  );
}

describe("ElementContextMenu — rendered above the chrome", () => {
  it("mounts in the overlay root, not inside the canvas it was opened from", () => {
    renderInCanvas();
    const menu = screen.getByTestId("canvas-ctx-menu");
    expect(screen.getByTestId("canvas-layer").contains(menu)).toBe(false);
    expect(menu.closest("#bk-overlay-root")).not.toBeNull();
  });

  it("its submenu is in the overlay root too", () => {
    vi.useFakeTimers();
    try {
      renderInCanvas();
      const style = screen.getByRole("menuitem", { name: /^Style/ });
      fireEvent.mouseEnter(style);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      const sub = screen.getByTestId("canvas-ctx-submenu");
      expect(screen.getByTestId("canvas-layer").contains(sub)).toBe(false);
      expect(sub.closest("#bk-overlay-root")).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("still takes keyboard focus when it opens — on its first row (chrome-ui Menu)", () => {
    renderInCanvas();
    expect(document.activeElement).toBe(screen.getByTestId("canvas-ctx-item-dup"));
  });
});

/* DQ-018: chrome-ui Menu's roving focus, plus the submenu contract this file
   adds — → opens and focuses the submenu, ← / Esc close it and hand focus
   back to its row, and that Esc does not close the whole menu. */
describe("ElementContextMenu — keyboard", () => {
  it("↓ moves to Style; → opens its submenu on its first row; ← returns", () => {
    const onClose = vi.fn();
    render(<ElementContextMenu x={10} y={10} actions={actions} context={context} onClose={onClose} />);
    const menu = screen.getByTestId("canvas-ctx-menu");
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    const style = screen.getByTestId("canvas-ctx-item-style");
    expect(document.activeElement).toBe(style);
    expect(style).toHaveAttribute("aria-haspopup", "menu");
    fireEvent.keyDown(style, { key: "ArrowRight" });
    expect(style).toHaveAttribute("aria-expanded", "true");
    expect(document.activeElement).toBe(screen.getByTestId("canvas-ctx-item-paste-styles"));
    fireEvent.keyDown(screen.getByTestId("canvas-ctx-submenu"), { key: "ArrowLeft" });
    expect(screen.queryByTestId("canvas-ctx-submenu")).toBeNull();
    expect(document.activeElement).toBe(style);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Esc inside the submenu closes only the submenu", () => {
    const onClose = vi.fn();
    render(<ElementContextMenu x={10} y={10} actions={actions} context={context} onClose={onClose} />);
    fireEvent.keyDown(screen.getByTestId("canvas-ctx-item-style"), { key: "Enter" });
    fireEvent.keyDown(screen.getByTestId("canvas-ctx-item-paste-styles"), { key: "Escape" });
    expect(screen.queryByTestId("canvas-ctx-submenu")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("a submenu row runs its handler and closes the menu", () => {
    const onClose = vi.fn();
    render(<ElementContextMenu x={10} y={10} actions={actions} context={context} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("canvas-ctx-item-style"));
    fireEvent.click(screen.getByTestId("canvas-ctx-item-paste-styles"));
    expect(actions[1].submenu![0].handler).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
