import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import { useCanvasKeyboard } from "../useCanvasKeyboard";
import { EVENTS } from "@/shared/constants/events";

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

/* BD-39 (1): Enter on a selection starts inline edit — the same request the
   Inspector's "Edit text on canvas" sends, so useCanvasInlineEdit decides what
   is editable text (and asks the lock gate) for all three doors. */
describe("useCanvasKeyboard — Enter starts inline edit", () => {
  const setup = (opts: { readOnly?: boolean; selectedIds?: string[]; selectedId?: string | null } = {}) => {
    const composer = {
      ...mockComposer,
      readOnly: opts.readOnly ?? false,
      emit: vi.fn(),
      elements: { ...mockComposer.elements, getElement: vi.fn(() => ({ getId: () => "el-1" })) },
    } as unknown as Composer;
    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer,
        selectedId: opts.selectedId === undefined ? "el-1" : opts.selectedId,
        selectedIds: opts.selectedIds ?? ["el-1"],
        editingId: null,
        select: vi.fn(),
        clear: vi.fn(),
        syncFromComposer: vi.fn(),
      }),
    );
    const press = (init: KeyboardEventInit, target?: HTMLElement) => {
      const ev = new KeyboardEvent("keydown", { key: "Enter", cancelable: true, ...init });
      if (target) Object.defineProperty(ev, "target", { value: target });
      act(() => result.current.handleKeyDown(ev as unknown as React.KeyboardEvent));
      return ev;
    };
    const requested = () =>
      (composer.emit as ReturnType<typeof vi.fn>).mock.calls.filter(([name]) => name === EVENTS.UI_INLINE_EDIT_REQUEST);
    return { press, requested };
  };

  it("asks for inline edit on the selected element", () => {
    const { press, requested } = setup();
    const ev = press({});
    expect(requested()).toEqual([[EVENTS.UI_INLINE_EDIT_REQUEST, { elementId: "el-1" }]]);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("does nothing while the document is read-only (view mode, time travel)", () => {
    const { press, requested } = setup({ readOnly: true });
    press({});
    expect(requested()).toHaveLength(0);
  });

  it("does nothing with a modifier, a multi-selection or no selection", () => {
    for (const init of [{ shiftKey: true }, { metaKey: true }, { ctrlKey: true }, { altKey: true }]) {
      const { press, requested } = setup();
      press(init);
      expect(requested()).toHaveLength(0);
    }
    const multi = setup({ selectedIds: ["el-1", "el-2"] });
    multi.press({});
    expect(multi.requested()).toHaveLength(0);
    const none = setup({ selectedId: null, selectedIds: [] });
    none.press({});
    expect(none.requested()).toHaveLength(0);
  });

  it("leaves Enter to a field, a select or text being edited", () => {
    for (const tag of ["input", "textarea", "select"]) {
      const { press, requested } = setup();
      press({}, document.createElement(tag));
      expect(requested()).toHaveLength(0);
    }
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    const { press, requested } = setup();
    press({}, editable);
    expect(requested()).toHaveLength(0);
  });
});
