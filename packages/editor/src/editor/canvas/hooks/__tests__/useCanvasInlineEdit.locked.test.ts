/**
 * P-1 — a locked element's text cannot be edited on the canvas, whether the
 * edit starts from a double-click or the Inspector's "Edit text on canvas"
 * (UI_INLINE_EDIT_REQUEST). Both land in beginEdit, which now passes the lock
 * gate and says so (LOCKED_ELEMENTS_SKIPPED).
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import type * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import { EVENTS } from "@/shared/constants/events";
import { useCanvasInlineEdit } from "../useCanvasInlineEdit";

function setup(locked: boolean) {
  const handlers = new Map<string, (p: unknown) => void>();
  const emit = vi.fn();
  const composer = {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    emit,
    on: vi.fn((ev: string, fn: (p: unknown) => void) => handlers.set(ev, fn)),
    off: vi.fn(),
    saveProject: vi.fn().mockResolvedValue(undefined),
    elements: { getElement: vi.fn(() => ({ isLocked: () => locked, setContent: vi.fn() })) },
  } as unknown as Composer;
  const canvas = document.createElement("div");
  const p = document.createElement("p");
  p.setAttribute("data-buildrick-id", "el-1");
  p.textContent = "Hello";
  canvas.appendChild(p);
  document.body.appendChild(canvas);
  const canvasRef = { current: canvas } as React.RefObject<HTMLDivElement | null>;
  const hook = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));
  return { hook, handlers, emit, p, canvas };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("P-1 — inline text edit respects the lock", () => {
  it("the Inspector's Edit text on canvas does not start editing a locked element", () => {
    const { hook, handlers, emit } = setup(true);
    act(() => handlers.get(EVENTS.UI_INLINE_EDIT_REQUEST)?.({ elementId: "el-1" }));
    expect(hook.result.current.isEditing).toBe(false);
    expect(emit).toHaveBeenCalledWith(EVENTS.LOCKED_ELEMENTS_SKIPPED, undefined);
  });

  it("a double-click does not start editing a locked element", () => {
    const { hook, p } = setup(true);
    act(() => hook.result.current.handleDoubleClick({ target: p, stopPropagation: vi.fn() } as unknown as React.MouseEvent));
    expect(hook.result.current.isEditing).toBe(false);
  });

  it("an unlocked element still enters editing", () => {
    const { hook, handlers } = setup(false);
    act(() => handlers.get(EVENTS.UI_INLINE_EDIT_REQUEST)?.({ elementId: "el-1" }));
    expect(hook.result.current.isEditing).toBe(true);
  });
  /* REA #12 (ISS-C01): the lock was checked when the edit began only; a lock
     applied mid-edit (another door, a collaborator) was overwritten at
     commit, which wrote setContent directly. The commit asks the gate again. */
  it("a lock applied mid-edit refuses the commit and restores the text", () => {
    const setContent = vi.fn();
    let locked = false;
    const handlers = new Map<string, (p: unknown) => void>();
    const emit = vi.fn();
    const composer = {
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      emit,
      on: vi.fn((ev: string, fn: (p: unknown) => void) => handlers.set(ev, fn)),
      off: vi.fn(),
      elements: { getElement: vi.fn(() => ({ isLocked: () => locked, setContent })) },
    } as unknown as Composer;
    const canvas = document.createElement("div");
    const p = document.createElement("p");
    p.setAttribute("data-buildrick-id", "el-1");
    p.textContent = "Hello";
    canvas.appendChild(p);
    document.body.appendChild(canvas);
    const canvasRef = { current: canvas } as React.RefObject<HTMLDivElement | null>;
    const hook = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));
    act(() => handlers.get(EVENTS.UI_INLINE_EDIT_REQUEST)?.({ elementId: "el-1" }));
    expect(hook.result.current.isEditing).toBe(true);

    p.innerHTML = "Changed";
    locked = true;
    act(() => { p.dispatchEvent(new FocusEvent("blur")); });

    expect(setContent).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith(EVENTS.LOCKED_ELEMENTS_SKIPPED, undefined);
    expect(emit).not.toHaveBeenCalledWith(EVENTS.ELEMENT_EDIT_INLINE, expect.anything());
    expect(p.innerHTML).toBe("Hello");
    expect(hook.result.current.isEditing).toBe(false);
  });
});
