/**
 * Inline text editing and the one undo (design-2l9 Task 1.2).
 *
 * While the edit is open, keystrokes (and ⌘Z — see
 * useEditorShortcuts.undoRouting.test.ts) belong to the contenteditable and
 * touch no composer state. When the edit commits, everything typed lands as
 * ONE composer history step: one transaction around one setContent, so the
 * topbar's Undo takes the whole edit back in one press.
 *
 * Escape commits too (owner decision BD-31, cherry-picked from
 * feat/flow-decisions 1d28d3d8f; pinned in useCanvasInlineEdit.gaps), so
 * Escape, Enter, click-away and the toolbar's Done all take this one path.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import { useCanvasInlineEdit } from "../useCanvasInlineEdit";

describe("useCanvasInlineEdit › an inline edit commits as one composer history step", () => {
  let canvasDiv: HTMLDivElement;
  let canvasRef: React.RefObject<HTMLDivElement | null>;

  beforeEach(() => {
    canvasDiv = document.createElement("div");
    document.body.appendChild(canvasDiv);
    canvasRef = { current: canvasDiv };
  });

  afterEach(() => {
    canvasDiv.remove();
    vi.clearAllMocks();
  });

  it("typing records nothing; blur wraps the whole edit in one transaction", () => {
    const calls: string[] = [];
    const setContent = vi.fn(() => calls.push("setContent"));
    const composer = {
      beginTransaction: vi.fn(() => calls.push("begin")),
      endTransaction: vi.fn(() => calls.push("end")),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      elements: { getElement: vi.fn().mockReturnValue({ setContent }) },
    } as unknown as Composer;

    const el = document.createElement("p");
    el.setAttribute("data-buildrick-id", "el-1");
    el.textContent = "Hello";
    canvasDiv.appendChild(el);

    const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));
    act(() => {
      result.current.handleDoubleClick({ target: el, stopPropagation: vi.fn() } as unknown as React.MouseEvent);
    });
    expect(result.current.isEditing).toBe(true);

    act(() => {
      el.innerHTML = "Hello w";
      el.innerHTML = "Hello world";
      el.innerHTML = "Hello world!";
    });
    expect(calls).toEqual([]);

    act(() => {
      el.dispatchEvent(new FocusEvent("blur"));
    });
    expect(calls).toEqual(["begin", "setContent", "end"]);
    expect(composer.beginTransaction).toHaveBeenCalledWith("inline-edit");
    expect(setContent).toHaveBeenCalledWith("Hello world!", "html");
    expect(result.current.isEditing).toBe(false);
  });

  /* design-2l9 TX03: a committed change raises the receipt — once — and an
     unchanged edit raises nothing. Escape takes the same path (BD-31). */
  it("calls onCommitted once after a changed edit, by blur or Escape, and not for no change", () => {
    const composer = {
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      elements: { getElement: vi.fn().mockReturnValue({ setContent: vi.fn() }) },
    } as unknown as Composer;
    const onCommitted = vi.fn();
    const el = document.createElement("p");
    el.setAttribute("data-buildrick-id", "el-2");
    el.textContent = "Hello";
    canvasDiv.appendChild(el);
    const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef, onCommitted }));
    const open = () =>
      act(() => {
        result.current.handleDoubleClick({ target: el, stopPropagation: vi.fn() } as unknown as React.MouseEvent);
      });

    open();
    act(() => {
      el.dispatchEvent(new FocusEvent("blur"));
    });
    expect(onCommitted).not.toHaveBeenCalled();

    open();
    act(() => {
      el.innerHTML = "Hello there";
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(onCommitted).toHaveBeenCalledTimes(1);
    expect(onCommitted).toHaveBeenLastCalledWith({ linkChanged: false });
    expect(el.innerHTML).toBe("Hello there");

    /* TX11: a link made in the edit says so. */
    open();
    act(() => {
      el.innerHTML = 'Hello <a href="https://example.com">there</a>';
      el.dispatchEvent(new FocusEvent("blur"));
    });
    expect(onCommitted).toHaveBeenLastCalledWith({ linkChanged: true });
  });
});
