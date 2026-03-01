import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import { useCanvasInlineEdit } from "../useCanvasInlineEdit";

// Minimal mock composer satisfying the hook's usage
function makeMockComposer(): Composer {
  return {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    saveProject: vi.fn().mockResolvedValue(undefined),
    elements: {
      getElement: vi.fn().mockReturnValue({
        setContent: vi.fn(),
      }),
    },
  } as unknown as Composer;
}

describe("useCanvasInlineEdit — non-left-click guard (EC-06)", () => {
  let canvasDiv: HTMLDivElement;
  let editableEl: HTMLParagraphElement;
  let outsideEl: HTMLDivElement;
  let canvasRef: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    // Build a minimal canvas DOM: a wrapper div containing a <p data-aqb-id="el-1">
    canvasDiv = document.createElement("div");
    editableEl = document.createElement("p");
    editableEl.setAttribute("data-aqb-id", "el-1");
    editableEl.textContent = "Hello world";
    canvasDiv.appendChild(editableEl);
    document.body.appendChild(canvasDiv);

    // An element completely outside the editable (simulates clicking elsewhere)
    outsideEl = document.createElement("div");
    document.body.appendChild(outsideEl);

    // Create a ref that points to canvasDiv
    canvasRef = { current: canvasDiv } as React.RefObject<HTMLDivElement>;
  });

  afterEach(() => {
    document.body.removeChild(canvasDiv);
    document.body.removeChild(outsideEl);
    vi.clearAllMocks();
  });

  it("does not commit inline edit on non-left-click (button=2, right-click) outside the editable element", () => {
    const composer = makeMockComposer();

    const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

    // Start inline editing by simulating a double-click on the editable element
    act(() => {
      result.current.handleDoubleClick({
        target: editableEl,
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent);
    });

    // Confirm editing is active
    expect(result.current.isEditing).toBe(true);
    expect(result.current.editing.id).toBe("el-1");

    // Fire a right-click mousedown (button=2) on an element outside the editable.
    // Using capture phase listener (same as the hook) ensures it fires first.
    act(() => {
      const rightClickEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 2,
      });
      outsideEl.dispatchEvent(rightClickEvent);
    });

    // Right-click must NOT commit — editing state must still be active
    expect(result.current.isEditing).toBe(true);
    expect(result.current.editing.id).toBe("el-1");

    // finishEdit(true) was NOT triggered, so setEditing was not called with id=null
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("does not commit inline edit on middle-click (button=1) outside the editable element", () => {
    const composer = makeMockComposer();

    const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

    // Start inline editing by simulating a double-click on the editable element
    act(() => {
      result.current.handleDoubleClick({
        target: editableEl,
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent);
    });

    // Confirm editing is active
    expect(result.current.isEditing).toBe(true);
    expect(result.current.editing.id).toBe("el-1");

    // Fire a middle-click mousedown (button=1) on an element outside the editable.
    act(() => {
      const middleClickEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 1,
      });
      outsideEl.dispatchEvent(middleClickEvent);
    });

    // Middle-click must NOT commit — editing state must still be active
    expect(result.current.isEditing).toBe(true);
    expect(result.current.editing.id).toBe("el-1");

    // finishEdit(true) was NOT triggered
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("does commit inline edit on left-click (button=0) outside the editable element", () => {
    const composer = makeMockComposer();

    const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

    // Start inline editing
    act(() => {
      result.current.handleDoubleClick({
        target: editableEl,
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent);
    });

    expect(result.current.isEditing).toBe(true);

    // Fire a regular left-click (button=0) on the outside element
    act(() => {
      const leftClickEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      outsideEl.dispatchEvent(leftClickEvent);
    });

    // Left-click outside SHOULD commit — editing state should be cleared
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editing.id).toBeNull();
  });
});
