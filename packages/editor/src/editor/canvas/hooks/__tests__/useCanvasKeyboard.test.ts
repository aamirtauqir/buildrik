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

describe("useCanvasKeyboard — multi-select delete", () => {
  it("deletes all selected elements when multiple are selected and Delete is pressed", () => {
    const removeElementMock = vi.fn();
    const syncFromComposerMock = vi.fn();
    const multiMockComposer = {
      elements: {
        removeElement: removeElementMock,
        getElement: vi.fn().mockImplementation((id) => ({
          remove: vi.fn(),
          isLocked: () => false,
        })),
        getActivePage: vi.fn().mockReturnValue({ root: { id: "root-id" } }),
      },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      selection: { clear: vi.fn() },
      history: { undo: vi.fn() },
    };

    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer: multiMockComposer as unknown as Composer,
        selectedId: "el-1",
        selectedIds: ["el-1", "el-2", "el-3"],
        editingId: null,
        select: vi.fn(),
        clear: vi.fn(),
        syncFromComposer: syncFromComposerMock,
      })
    );

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent("keydown", { key: "Delete" }) as unknown as React.KeyboardEvent
      );
    });

    expect(removeElementMock).toHaveBeenCalledTimes(3);
    expect(multiMockComposer.beginTransaction).toHaveBeenCalled();
    expect(multiMockComposer.endTransaction).toHaveBeenCalled();
    expect(multiMockComposer.selection.clear).toHaveBeenCalled();
    expect(syncFromComposerMock).toHaveBeenCalled();
  });

  it("deletes all selected elements when multiple are selected and Backspace is pressed", () => {
    const removeElementMock = vi.fn();
    const syncFromComposerMock = vi.fn();
    const multiMockComposer = {
      elements: {
        removeElement: removeElementMock,
        getElement: vi.fn().mockImplementation(() => ({
          remove: vi.fn(),
          isLocked: () => false,
        })),
        getActivePage: vi.fn().mockReturnValue({ root: { id: "root-id" } }),
      },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      selection: { clear: vi.fn() },
      history: { undo: vi.fn() },
    };

    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer: multiMockComposer as unknown as Composer,
        selectedId: "el-1",
        selectedIds: ["el-1", "el-2", "el-3"],
        editingId: null,
        select: vi.fn(),
        clear: vi.fn(),
        syncFromComposer: syncFromComposerMock,
      })
    );

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent("keydown", { key: "Backspace" }) as unknown as React.KeyboardEvent
      );
    });

    expect(removeElementMock).toHaveBeenCalledTimes(3);
    expect(multiMockComposer.selection.clear).toHaveBeenCalled();
    expect(syncFromComposerMock).toHaveBeenCalled();
  });

  it("does not delete the root element in multi-select", () => {
    const removeElementMock = vi.fn();
    const rootMockComposer = {
      elements: {
        removeElement: removeElementMock,
        getElement: vi.fn().mockImplementation(() => ({
          remove: vi.fn(),
          isLocked: () => false,
        })),
        getActivePage: vi.fn().mockReturnValue({ root: { id: "root-id" } }),
      },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      selection: { clear: vi.fn() },
      history: { undo: vi.fn() },
    };

    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer: rootMockComposer as unknown as Composer,
        selectedId: "el-1",
        selectedIds: ["el-1", "root-id", "el-2"],
        editingId: null,
        select: vi.fn(),
        clear: vi.fn(),
        syncFromComposer: vi.fn(),
      })
    );

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent("keydown", { key: "Delete" }) as unknown as React.KeyboardEvent
      );
    });

    // Only el-1 and el-2 should be deleted; root-id must be skipped
    expect(removeElementMock).toHaveBeenCalledTimes(2);
    expect(removeElementMock).not.toHaveBeenCalledWith("root-id");
  });

  it("does not delete locked elements in multi-select", () => {
    const removeMock = vi.fn();
    const lockMockComposer = {
      elements: {
        getElement: vi.fn().mockImplementation((id) => {
          if (id === "el-locked") return { remove: vi.fn(), isLocked: () => true };
          return { remove: removeMock, isLocked: () => false };
        }),
        getActivePage: vi.fn().mockReturnValue({ root: { id: "root-id" } }),
        removeElement: removeMock,
      },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      selection: { clear: vi.fn() },
      history: { undo: vi.fn() },
    };

    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer: lockMockComposer as unknown as Composer,
        selectedId: "el-1",
        selectedIds: ["el-1", "el-locked", "el-2"],
        editingId: null,
        select: vi.fn(),
        clear: vi.fn(),
        syncFromComposer: vi.fn(),
      })
    );

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent("keydown", { key: "Delete" }) as unknown as React.KeyboardEvent
      );
    });

    expect(removeMock).toHaveBeenCalledTimes(2); // el-1 and el-2 only, not el-locked
    expect(removeMock).not.toHaveBeenCalledWith("el-locked");
  });
});
