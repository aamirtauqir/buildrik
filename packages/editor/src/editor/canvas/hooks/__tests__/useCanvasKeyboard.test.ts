import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import { useCanvasKeyboard } from "../useCanvasKeyboard";

// Minimal mock composer satisfying the hook's usage
const mockComposer = {
  selection: {
    selectAll: vi.fn(),
  },
  elements: {
    getElement: vi.fn(),
    getActivePage: vi.fn(() => null),
    removeElement: vi.fn(),
    duplicateElement: vi.fn(),
    pasteElement: vi.fn(),
  },
  history: {
    undo: vi.fn(),
  },
  beginTransaction: vi.fn(),
  endTransaction: vi.fn(),
  clipboard: null,
  styleClipboard: undefined,
  emit: vi.fn(),
} as unknown as Composer;

describe("useCanvasKeyboard — Shift+F10 context menu shortcut", () => {
  let querySelectorSpy: { mockRestore: () => void };

  beforeEach(() => {
    // Mock document.querySelector to return a fake element with getBoundingClientRect
    const fakeEl = {
      getBoundingClientRect: () => ({ left: 100, top: 200, width: 50, height: 40 }),
    } as unknown as Element;

    querySelectorSpy = vi.spyOn(document, "querySelector").mockReturnValue(fakeEl);
  });

  afterEach(() => {
    querySelectorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("calls onOpenContextMenu when Shift+F10 is pressed with an element selected", () => {
    const onOpenContextMenu = vi.fn();
    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer: mockComposer,
        selectedId: "el-1",
        editingId: null,
        select: vi.fn(),
        clear: vi.fn(),
        syncFromComposer: vi.fn(),
        onOpenContextMenu,
      })
    );

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent("keydown", {
          key: "F10",
          shiftKey: true,
        }) as unknown as React.KeyboardEvent
      );
    });

    expect(onOpenContextMenu).toHaveBeenCalledWith("el-1", expect.any(Object));
  });

  it("does not call onOpenContextMenu when Shift+F10 is pressed with no element selected", () => {
    const onOpenContextMenu = vi.fn();
    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer: mockComposer,
        selectedId: null,
        editingId: null,
        select: vi.fn(),
        clear: vi.fn(),
        syncFromComposer: vi.fn(),
        onOpenContextMenu,
      })
    );

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent("keydown", {
          key: "F10",
          shiftKey: true,
        }) as unknown as React.KeyboardEvent
      );
    });

    expect(onOpenContextMenu).not.toHaveBeenCalled();
  });
});

/* Delete/Backspace on the canvas run the ONE delete command. This handler
   used to delete on its own — removing a locked element's unlocked ancestor
   whole (A-5: ⌘A + Delete took the locked image with its section), skipping
   the multi-delete confirm, and toasting an Undo bound to nothing. The lock
   guard and confirm are the command's (deleteLockedDescendant.test.ts); this
   pins that the canvas goes there and only hands focus on afterwards. */
describe("useCanvasKeyboard — Delete runs the delete command", () => {
  function setup(selectedId: string | null, selectedIds: string[]) {
    const live = new Set(["el-1", "el-2", "el-3", "root-id"]);
    const parent = { getId: () => "root-id" };
    const make = (id: string) => ({
      getId: () => id,
      getParent: () => ({ ...parent, getChildren: () => ["el-1", "el-2", "el-3"].map((c) => ({ getId: () => c })) }),
      getChildren: () => [],
    });
    const composer = {
      elements: {
        removeElement: vi.fn(),
        getElement: vi.fn((id: string) => (live.has(id) ? make(id) : null)),
        getActivePage: vi.fn().mockReturnValue({ root: { id: "root-id" } }),
      },
      commands: { run: vi.fn(() => selectedIds.forEach((id) => live.delete(id))) },
    };
    const select = vi.fn();
    const clear = vi.fn();
    const sync = vi.fn();
    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer: composer as unknown as Composer,
        selectedId,
        selectedIds,
        editingId: null,
        select,
        clear,
        syncFromComposer: sync,
      })
    );
    const press = (key: string) =>
      act(() => {
        result.current.handleKeyDown(new KeyboardEvent("keydown", { key }) as unknown as React.KeyboardEvent);
      });
    return { composer, select, clear, sync, press };
  }

  it.each(["Delete", "Backspace"])("a multi-selection %s goes through the command, never removeElement", (key) => {
    const { composer, sync, press } = setup("el-1", ["el-1", "el-2", "el-3"]);
    press(key);
    expect(composer.commands.run).toHaveBeenCalledWith("delete");
    expect(composer.elements.removeElement).not.toHaveBeenCalled();
    expect(sync).toHaveBeenCalled();
  });

  it("a single delete goes through the command, then focuses the next sibling", () => {
    const { composer, select, press } = setup("el-2", ["el-2"]);
    press("Delete");
    expect(composer.commands.run).toHaveBeenCalledWith("delete");
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ getId: expect.any(Function) }));
    expect(select.mock.calls[0][0].getId()).toBe("el-3");
  });

  it("the page root alone is left alone", () => {
    const { composer, press } = setup("root-id", ["root-id"]);
    press("Delete");
    expect(composer.commands.run).not.toHaveBeenCalled();
  });
});
