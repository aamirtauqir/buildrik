/**
 * useCanvasSelectionBox — Figma-style marquee selection.
 *
 * Pins: rect computation from native mousedown/mousemove coordinates,
 * element-intersection selection on mouseup (via [data-buildrick-id] DOM
 * fixtures with stubbed getBoundingClientRect), shift-add union semantics,
 * the 5px MIN_SIZE guard, Escape cancel, and the element-click bail-out.
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import { useCanvasSelectionBox } from "../useCanvasSelectionBox";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ROOT_ID = "root-el";

function stubRect(
  el: HTMLElement,
  r: { left: number; top: number; right: number; bottom: number }
) {
  el.getBoundingClientRect = () =>
    ({
      left: r.left,
      top: r.top,
      right: r.right,
      bottom: r.bottom,
      width: r.right - r.left,
      height: r.bottom - r.top,
      x: r.left,
      y: r.top,
      toJSON: () => ({}),
    }) as DOMRect;
}

/** Canvas div at client origin (0,0), 800x600, appended to body */
function makeCanvas(): HTMLDivElement {
  const canvas = document.createElement("div");
  stubRect(canvas, { left: 0, top: 0, right: 800, bottom: 600 });
  document.body.appendChild(canvas);
  return canvas;
}

function addElement(
  parent: HTMLElement,
  id: string,
  r: { left: number; top: number; right: number; bottom: number }
): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("data-buildrick-id", id);
  stubRect(el, r);
  parent.appendChild(el);
  return el;
}

interface MockComposer {
  elements: {
    getActivePage: ReturnType<typeof vi.fn>;
    getElement: ReturnType<typeof vi.fn>;
  };
  selection: {
    getSelectedIds: ReturnType<typeof vi.fn>;
    selectMultiple: ReturnType<typeof vi.fn>;
  };
}

function makeComposer(existingIds: string[] = []): MockComposer {
  return {
    elements: {
      getActivePage: vi.fn(() => ({ root: { id: ROOT_ID } })),
      getElement: vi.fn((id: string) => ({ getId: () => id })),
    },
    selection: {
      getSelectedIds: vi.fn(() => existingIds),
      selectMultiple: vi.fn(),
    },
  };
}

/** Ids passed to the nth selectMultiple call */
function selectedIdsOfCall(composer: MockComposer, call = 0): string[] {
  const els = composer.selection.selectMultiple.mock.calls[call][0] as Array<{
    getId: () => string;
  }>;
  return els.map((el) => el.getId());
}

function mouse(type: string, x: number, y: number, init: MouseEventInit = {}): MouseEvent {
  return new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0, ...init });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCanvasSelectionBox", () => {
  let canvas: HTMLDivElement;

  beforeEach(() => {
    canvas = makeCanvas();
  });

  afterEach(() => {
    canvas.remove();
    vi.clearAllMocks();
  });

  function renderBox(
    composer: MockComposer | null,
    opts: { enabled?: boolean; onSelectionChange?: (ids: string[]) => void } = {}
  ) {
    return renderHook(() =>
      useCanvasSelectionBox({
        composer: composer as unknown as Composer,
        canvasRef: { current: canvas },
        ...opts,
      })
    );
  }

  it("tracks the selection rect from mousedown through mousemove", () => {
    const composer = makeComposer();
    const { result } = renderBox(composer);

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selectionRect).toBeNull();

    act(() => {
      canvas.dispatchEvent(mouse("mousedown", 10, 10));
    });

    expect(result.current.isSelecting).toBe(true);
    expect(result.current.selectionRect).toEqual({
      startX: 10,
      startY: 10,
      endX: 10,
      endY: 10,
    });

    act(() => {
      window.dispatchEvent(mouse("mousemove", 110, 90));
    });

    expect(result.current.selectionRect).toEqual({
      startX: 10,
      startY: 10,
      endX: 110,
      endY: 90,
    });
  });

  it("ignores non-left mouse buttons", () => {
    const composer = makeComposer();
    const { result } = renderBox(composer);

    act(() => {
      canvas.dispatchEvent(mouse("mousedown", 10, 10, { button: 2 }));
    });

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selectionRect).toBeNull();
  });

  it("does not start when mousedown lands on a non-root element", () => {
    const composer = makeComposer();
    const el = addElement(canvas, "el-a", { left: 20, top: 20, right: 60, bottom: 60 });
    const { result } = renderBox(composer);

    act(() => {
      el.dispatchEvent(mouse("mousedown", 30, 30));
    });

    expect(result.current.isSelecting).toBe(false);
  });

  it("DOES start when mousedown lands on the root element", () => {
    const composer = makeComposer();
    const rootEl = addElement(canvas, ROOT_ID, { left: 0, top: 0, right: 800, bottom: 600 });
    const { result } = renderBox(composer);

    act(() => {
      rootEl.dispatchEvent(mouse("mousedown", 10, 10));
    });

    expect(result.current.isSelecting).toBe(true);
  });

  it("selects intersecting elements on mouseup, skipping the root", () => {
    const composer = makeComposer();
    addElement(canvas, ROOT_ID, { left: 0, top: 0, right: 800, bottom: 600 });
    addElement(canvas, "el-a", { left: 20, top: 20, right: 60, bottom: 60 });
    addElement(canvas, "el-b", { left: 300, top: 300, right: 340, bottom: 340 });
    const onSelectionChange = vi.fn();
    renderBox(composer, { onSelectionChange });

    act(() => {
      canvas.dispatchEvent(mouse("mousedown", 10, 10));
      window.dispatchEvent(mouse("mousemove", 110, 90));
      window.dispatchEvent(mouse("mouseup", 110, 90));
    });

    expect(composer.selection.selectMultiple).toHaveBeenCalledTimes(1);
    expect(selectedIdsOfCall(composer)).toEqual(["el-a"]); // root skipped, el-b outside
    expect(onSelectionChange).toHaveBeenCalledWith(["el-a"]);
  });

  it("normalizes an inverted drag (drag up-left selects the same rect)", () => {
    const composer = makeComposer();
    addElement(canvas, "el-a", { left: 20, top: 20, right: 60, bottom: 60 });
    renderBox(composer);

    act(() => {
      canvas.dispatchEvent(mouse("mousedown", 110, 90));
      window.dispatchEvent(mouse("mousemove", 10, 10));
      window.dispatchEvent(mouse("mouseup", 10, 10));
    });

    expect(selectedIdsOfCall(composer)).toEqual(["el-a"]);
  });

  it("does nothing when the drag is at or below the 5px MIN_SIZE", () => {
    const composer = makeComposer();
    addElement(canvas, "el-a", { left: 0, top: 0, right: 60, bottom: 60 });
    const onSelectionChange = vi.fn();
    const { result } = renderBox(composer, { onSelectionChange });

    act(() => {
      canvas.dispatchEvent(mouse("mousedown", 10, 10));
      window.dispatchEvent(mouse("mousemove", 15, 15)); // exactly 5px — not > MIN_SIZE
      window.dispatchEvent(mouse("mouseup", 15, 15));
    });

    expect(composer.selection.selectMultiple).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
    // state resets regardless
    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selectionRect).toBeNull();
  });

  it("leaves existing selection untouched when the rect intersects nothing", () => {
    const composer = makeComposer(["already-selected"]);
    addElement(canvas, "el-b", { left: 700, top: 500, right: 780, bottom: 580 });
    renderBox(composer);

    act(() => {
      canvas.dispatchEvent(mouse("mousedown", 10, 10));
      window.dispatchEvent(mouse("mousemove", 110, 90));
      window.dispatchEvent(mouse("mouseup", 110, 90));
    });

    expect(composer.selection.selectMultiple).not.toHaveBeenCalled();
  });

  it("shift+drag ADDS to the existing selection (deduped union)", () => {
    const composer = makeComposer(["el-b", "el-a"]); // el-a already selected too — dedupe
    addElement(canvas, "el-a", { left: 20, top: 20, right: 60, bottom: 60 });
    const onSelectionChange = vi.fn();
    renderBox(composer, { onSelectionChange });

    act(() => {
      canvas.dispatchEvent(mouse("mousedown", 10, 10, { shiftKey: true }));
      window.dispatchEvent(mouse("mousemove", 110, 90));
      window.dispatchEvent(mouse("mouseup", 110, 90));
    });

    expect(composer.selection.selectMultiple).toHaveBeenCalledTimes(1);
    // existing first, then rect-found, Set-deduped
    expect(selectedIdsOfCall(composer)).toEqual(["el-b", "el-a"]);
    // ACTUAL behavior pin: onSelectionChange reports only the rect-found ids,
    // NOT the union that was applied to composer.selection.
    expect(onSelectionChange).toHaveBeenCalledWith(["el-a"]);
  });

  it("plain drag REPLACES the existing selection", () => {
    const composer = makeComposer(["el-b"]);
    addElement(canvas, "el-a", { left: 20, top: 20, right: 60, bottom: 60 });
    renderBox(composer);

    act(() => {
      canvas.dispatchEvent(mouse("mousedown", 10, 10)); // no shift
      window.dispatchEvent(mouse("mousemove", 110, 90));
      window.dispatchEvent(mouse("mouseup", 110, 90));
    });

    expect(selectedIdsOfCall(composer)).toEqual(["el-a"]); // el-b dropped
  });

  it("Escape cancels an in-flight selection; the following mouseup selects nothing", () => {
    const composer = makeComposer();
    addElement(canvas, "el-a", { left: 20, top: 20, right: 60, bottom: 60 });
    const { result } = renderBox(composer);

    act(() => {
      canvas.dispatchEvent(mouse("mousedown", 10, 10));
      window.dispatchEvent(mouse("mousemove", 110, 90));
    });
    expect(result.current.isSelecting).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selectionRect).toBeNull();

    act(() => {
      window.dispatchEvent(mouse("mouseup", 110, 90));
    });

    expect(composer.selection.selectMultiple).not.toHaveBeenCalled();
  });

  it("does nothing when enabled=false", () => {
    const composer = makeComposer();
    const { result } = renderBox(composer, { enabled: false });

    act(() => {
      canvas.dispatchEvent(mouse("mousedown", 10, 10));
      window.dispatchEvent(mouse("mousemove", 110, 90));
    });

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selectionRect).toBeNull();
  });
});
