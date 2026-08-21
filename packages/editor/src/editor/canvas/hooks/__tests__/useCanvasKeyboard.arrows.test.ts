/**
 * useCanvasKeyboard — arrow-key branches, and the single-owner rule for them.
 *
 * There used to be a second arrow handler: `useKeyboardMove`, a window-level
 * listener mounted by useCanvasElementDrag, on which plain arrows REORDERED
 * the selected element among its siblings and re-parented it. This file
 * pinned that as KNOWN. It is now deleted — measured live at 1440x900 with an
 * element selected and focus outside the canvas (the ordinary state after a
 * click anywhere in the chrome): a bare ArrowUp moved a heading up a slot and
 * a bare ArrowLeft lifted it out of its container into the page root, with no
 * shortcut printed anywhere that says so. `useCanvasKeyboard` is the only
 * arrow owner now: plain arrows navigate selection, ⌘ = 1px move, ⇧ = 10px,
 * ⌥ = reorder — which is what the cheat sheet prints.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import type * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
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
