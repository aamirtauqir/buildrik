/**
 * useCanvasKeyboard — arrow-key branches + KNOWN dual arrow-handler pin (§1).
 *
 * §1 pin: TWO independent arrow handlers exist in the canvas stack —
 *   1. useCanvasKeyboard (React handler on the canvas): plain arrows navigate
 *      selection, Ctrl = 1px position move, Shift = 10px, Alt = reorder.
 *   2. useKeyboardMove (window-level listener mounted by useCanvasElementDrag):
 *      plain arrows REORDER the selected element among siblings / re-parent.
 * A single physical keystroke on a focused canvas can hit both. This file
 * pins that both fire with their divergent semantics (KNOWN, not fixed here).
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import type * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import { useKeyboardMove } from "../drag/useKeyboardMove";
import { useCanvasKeyboard } from "../useCanvasKeyboard";

const helperMocks = vi.hoisted(() => ({
  getNavigationTargets: vi.fn(),
  getAllNavigableElements: vi.fn(() => []),
  moveElementPosition: vi.fn(),
  reorderElement: vi.fn(),
}));

vi.mock("../keyboard/keyboardHelpers", () => helperMocks);

const prevEl = { getId: () => "prev-1" };
const nextEl = { getId: () => "next-1" };
const parentEl = { getId: () => "parent-1", getChildren: () => [prevEl, nextEl] };
const firstChildEl = { getId: () => "child-1" };

function makeComposer() {
  return {
    elements: {
      getElement: vi.fn(() => ({
        getId: () => "el-1",
        getType: () => "text",
      })),
      getActivePage: vi.fn(() => ({ root: { id: "root-1" } })),
    },
    selection: { selectAll: vi.fn(), clear: vi.fn() },
    history: { undo: vi.fn() },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  } as unknown as Composer;
}

function key(k: string, mods: Partial<KeyboardEvent> = {}): React.KeyboardEvent {
  return new KeyboardEvent("keydown", { key: k, ...mods }) as unknown as React.KeyboardEvent;
}

describe("useCanvasKeyboard — arrow navigation and movement", () => {
  let composer: Composer;
  let select: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    composer = makeComposer();
    select = vi.fn();
    helperMocks.getNavigationTargets.mockReturnValue({
      prev: prevEl,
      next: nextEl,
      parent: parentEl,
      firstChild: firstChildEl,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function mountHook(selectedId = "el-1") {
    return renderHook(() =>
      useCanvasKeyboard({
        composer,
        selectedId,
        editingId: null,
        select: select as never,
        clear: vi.fn(),
        syncFromComposer: vi.fn(),
      })
    );
  }

  it("plain ArrowUp selects the previous sibling", () => {
    const { result } = mountHook();
    act(() => result.current.handleKeyDown(key("ArrowUp")));
    expect(select).toHaveBeenCalledWith(prevEl);
    expect(helperMocks.moveElementPosition).not.toHaveBeenCalled();
  });

  it("plain ArrowDown selects the next sibling", () => {
    const { result } = mountHook();
    act(() => result.current.handleKeyDown(key("ArrowDown")));
    expect(select).toHaveBeenCalledWith(nextEl);
  });

  it("plain ArrowLeft selects the parent", () => {
    const { result } = mountHook();
    act(() => result.current.handleKeyDown(key("ArrowLeft")));
    expect(select).toHaveBeenCalledWith(parentEl);
  });

  it("plain ArrowRight selects the first child", () => {
    const { result } = mountHook();
    act(() => result.current.handleKeyDown(key("ArrowRight")));
    expect(select).toHaveBeenCalledWith(firstChildEl);
  });

  it("Ctrl+ArrowUp nudges position by -1px on Y", () => {
    const { result } = mountHook();
    act(() => result.current.handleKeyDown(key("ArrowUp", { ctrlKey: true })));
    expect(helperMocks.moveElementPosition).toHaveBeenCalledWith(composer, "el-1", 0, -1);
    expect(select).not.toHaveBeenCalled();
  });

  it("Shift+ArrowRight nudges position by +10px on X", () => {
    const { result } = mountHook();
    act(() => result.current.handleKeyDown(key("ArrowRight", { shiftKey: true })));
    expect(helperMocks.moveElementPosition).toHaveBeenCalledWith(composer, "el-1", 10, 0);
  });

  it("Alt+ArrowDown reorders the element down among siblings", () => {
    const { result } = mountHook();
    act(() => result.current.handleKeyDown(key("ArrowDown", { altKey: true })));
    expect(helperMocks.reorderElement).toHaveBeenCalledWith(
      expect.anything(),
      composer,
      "el-1",
      "down"
    );
  });

  it("never position-moves or reorders the root element", () => {
    const { result } = mountHook("root-1");
    act(() => result.current.handleKeyDown(key("ArrowUp", { ctrlKey: true })));
    act(() => result.current.handleKeyDown(key("ArrowDown", { altKey: true })));
    expect(helperMocks.moveElementPosition).not.toHaveBeenCalled();
    expect(helperMocks.reorderElement).not.toHaveBeenCalled();
  });

  it("Home selects the first sibling, End selects the last", () => {
    const { result } = mountHook();
    act(() => result.current.handleKeyDown(key("Home")));
    expect(select).toHaveBeenLastCalledWith(prevEl);
    act(() => result.current.handleKeyDown(key("End")));
    expect(select).toHaveBeenLastCalledWith(nextEl);
  });

  it("ignores keys while inline editing is active", () => {
    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer,
        selectedId: "el-1",
        editingId: "el-1",
        select: select as never,
        clear: vi.fn(),
        syncFromComposer: vi.fn(),
      })
    );
    act(() => result.current.handleKeyDown(key("ArrowUp")));
    expect(select).not.toHaveBeenCalled();
  });
});

describe("KNOWN §1 — dual arrow handlers (useCanvasKeyboard + useKeyboardMove)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("window-level useKeyboardMove ALSO consumes plain ArrowUp and reorders the selection", () => {
    // Same conceptual keystroke handled by a second, independent listener
    // with different semantics (reorder vs navigate). Pinned as KNOWN.
    const siblings = [{ getId: () => "el-0" }, { getId: () => "el-1" }];
    const parent = { getId: () => "parent-1", getChildren: () => siblings, getParent: () => null };
    const selected = {
      getId: () => "el-1",
      getType: () => "text",
      getParent: () => parent,
    };
    const moveComposer = {
      selection: {
        getSelected: vi.fn(() => selected),
        reselect: vi.fn(),
      },
      elements: { moveElement: vi.fn() },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
    } as unknown as Composer;

    renderHook(() => useKeyboardMove({ composer: moveComposer, rootIdRef: { current: "root-1" } }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    });

    // useKeyboardMove reorders el-1 from index 1 → 0 within the same parent —
    // while useCanvasKeyboard would have navigated selection for the same key.
    expect(
      (moveComposer.elements as unknown as { moveElement: ReturnType<typeof vi.fn> }).moveElement
    ).toHaveBeenCalledWith("el-1", "parent-1", 0);
    expect(
      (moveComposer.selection as unknown as { reselect: ReturnType<typeof vi.fn> }).reselect
    ).toHaveBeenCalled();
  });

  it("useKeyboardMove stays inert while a form control or contentEditable owns focus", () => {
    const selected = {
      getId: () => "el-1",
      getType: () => "text",
      getParent: () => ({ getId: () => "p", getChildren: () => [], getParent: () => null }),
    };
    const moveComposer = {
      selection: { getSelected: vi.fn(() => selected), reselect: vi.fn() },
      elements: { moveElement: vi.fn() },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
    } as unknown as Composer;

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useKeyboardMove({ composer: moveComposer, rootIdRef: { current: "root-1" } }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    });

    expect(
      (moveComposer as unknown as { beginTransaction: ReturnType<typeof vi.fn> }).beginTransaction
    ).not.toHaveBeenCalled();
    input.remove();
  });
});
