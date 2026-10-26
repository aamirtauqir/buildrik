/**
 * Inline text editing and the one undo (design-2l9 Task 1.2).
 *
 * While the edit is open, keystrokes (and ⌘Z — see
 * useEditorShortcuts.undoRouting.test.ts) belong to the contenteditable and
 * touch no composer state. When the edit commits, everything typed lands as
 * ONE composer history step: one transaction around one setContent, so the
 * topbar's Undo takes the whole edit back in one press.
 *
 * Escape: on `main` Escape still cancels the edit. Owner decision BD-31
 * ("Esc commits") ships on feat/flow-decisions (1d28d3d8f) with its own test;
 * this file pins the commit path both behaviours share.
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
    expect(setContent).toHaveBeenCalledWith("Hello world!");
    expect(result.current.isEditing).toBe(false);
  });
});
