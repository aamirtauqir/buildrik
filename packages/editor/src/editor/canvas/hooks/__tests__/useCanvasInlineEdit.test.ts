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
  let canvasRef: React.RefObject<HTMLDivElement | null>;

  beforeEach(() => {
    // Build a minimal canvas DOM: a wrapper div containing a <p data-buildrick-id="el-1">
    canvasDiv = document.createElement("div");
    editableEl = document.createElement("p");
    editableEl.setAttribute("data-buildrick-id", "el-1");
    editableEl.textContent = "Hello world";
    canvasDiv.appendChild(editableEl);
    document.body.appendChild(canvasDiv);

    // An element completely outside the editable (simulates clicking elsewhere)
    outsideEl = document.createElement("div");
    document.body.appendChild(outsideEl);

    // Create a ref that points to canvasDiv
    canvasRef = { current: canvasDiv } as React.RefObject<HTMLDivElement | null>;
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

  it("sanitizes pasted markup before persisting it on commit (T4)", () => {
    const setContent = vi.fn();
    const composer = {
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      saveProject: vi.fn().mockResolvedValue(undefined),
      elements: { getElement: vi.fn().mockReturnValue({ setContent }) },
    } as unknown as Composer;

    const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

    act(() => {
      result.current.handleDoubleClick({
        target: editableEl,
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent);
    });

    // Simulate the user pasting hostile markup into the contentEditable element
    act(() => {
      editableEl.innerHTML = '<img src="x" onerror="alert(1)">';
    });

    // Commit via left-click outside
    act(() => {
      outsideEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
    });

    expect(setContent).toHaveBeenCalledTimes(1);
    const persisted = setContent.mock.calls[0][0] as string;
    expect(persisted).not.toMatch(/onerror/i);
  });

  /* Found live 2026-08-14: clicking any of the toolbar's eighteen controls
     ended the edit session. Two contracts pin the fix. The guard: mousedown
     inside .bd-inline-toolbar must not finish the edit — the class is
     matched by name, and the wrapper that carries it lives in
     CanvasOverlayGroup. One writer: nothing persists mid-session
     (useCanvasInlineCommands used to setContent per command, which made the
     engine re-render the element and killed the contentEditable session);
     finishEdit persists once, at session end. */
  it("mousedown inside .bd-inline-toolbar neither ends the session nor persists", () => {
    const composer = makeMockComposer();
    const setContent = vi.fn();
    (composer.elements.getElement as ReturnType<typeof vi.fn>).mockReturnValue({ setContent });

    const toolbar = document.createElement("div");
    toolbar.className = "bd-inline-toolbar";
    const boldBtn = document.createElement("button");
    toolbar.appendChild(boldBtn);
    document.body.appendChild(toolbar);

    const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

    act(() => {
      result.current.handleDoubleClick({
        target: editableEl,
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent);
    });
    expect(result.current.isEditing).toBe(true);

    act(() => {
      boldBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
    });

    expect(result.current.isEditing).toBe(true);
    expect(setContent).not.toHaveBeenCalled();

    document.body.removeChild(toolbar);
  });
});
