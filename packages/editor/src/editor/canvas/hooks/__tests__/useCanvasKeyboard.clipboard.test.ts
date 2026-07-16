/**
 * useCanvasKeyboard — clipboard + command shortcuts NOT covered by the
 * arrow/delete/F10 suites: Ctrl+A, Escape, Ctrl+D duplicate, Ctrl+C / Ctrl+X
 * element copy/cut, Ctrl+Alt+C / Ctrl+Alt+V style copy/paste, Ctrl+V paste.
 *
 * The real keyboardHelpers are used (unmocked); elements expose null parents
 * so getNavigationTargets resolves to a clear() focus fallback.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import type * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import { useCanvasKeyboard } from "../useCanvasKeyboard";

function key(k: string, mods: Partial<KeyboardEvent> = {}): React.KeyboardEvent {
  const evt = new KeyboardEvent("keydown", { key: k, ...mods });
  // jsdom KeyboardEvent lacks preventDefault/stopPropagation as spies; supply no-ops.
  Object.defineProperty(evt, "preventDefault", { value: () => {}, writable: true });
  Object.defineProperty(evt, "stopPropagation", { value: () => {}, writable: true });
  return evt as unknown as React.KeyboardEvent;
}

interface ComposerBits {
  clipboard?: unknown;
  styleClipboard?: Record<string, string>;
  element?: Record<string, unknown>;
}

function makeComposer(bits: ComposerBits = {}) {
  const element = {
    getType: () => "text",
    getStyles: () => ({}),
    setStyle: vi.fn(),
    toJSON: () => ({ id: "el-1", type: "text" }),
    getParent: () => null,
    getChildren: () => [],
    isLocked: () => false,
    ...bits.element,
  };
  const composer = {
    selection: { selectAll: vi.fn(), clear: vi.fn() },
    elements: {
      getElement: vi.fn(() => element),
      getActivePage: vi.fn(() => ({ root: { id: "root-1" } })),
      removeElement: vi.fn(),
      duplicateElement: vi.fn(() => ({ getId: () => "clone-1" })),
      pasteElement: vi.fn(() => ({ getId: () => "pasted-1" })),
    },
    history: { undo: vi.fn() },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    clipboard: bits.clipboard ?? null,
    styleClipboard: bits.styleClipboard,
  } as unknown as Composer & { clipboard: unknown; styleClipboard?: Record<string, string> };
  return { composer, element };
}

function mount(composer: Composer, overrides: Record<string, unknown> = {}) {
  const select = vi.fn();
  const clear = vi.fn();
  const syncFromComposer = vi.fn();
  const addToast = vi.fn();
  const hook = renderHook(() =>
    useCanvasKeyboard({
      composer,
      selectedId: "el-1",
      editingId: null,
      select,
      clear,
      syncFromComposer,
      addToast,
      ...overrides,
    })
  );
  return { hook, select, clear, syncFromComposer, addToast };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCanvasKeyboard — command shortcuts", () => {
  it("Ctrl+A selects all elements", () => {
    const { composer } = makeComposer();
    const { hook } = mount(composer);
    act(() => hook.result.current.handleKeyDown(key("a", { ctrlKey: true })));
    expect(composer.selection.selectAll).toHaveBeenCalledTimes(1);
  });

  it("Escape clears the selection", () => {
    const { composer } = makeComposer();
    const { hook, clear } = mount(composer);
    act(() => hook.result.current.handleKeyDown(key("Escape")));
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+D duplicates the selected element and selects the clone", () => {
    const { composer } = makeComposer();
    const { hook, select, addToast } = mount(composer);
    act(() => hook.result.current.handleKeyDown(key("d", { ctrlKey: true })));
    expect(composer.elements.duplicateElement).toHaveBeenCalledWith("el-1");
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ getId: expect.any(Function) }));
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ tone: "success" }));
  });
});

describe("useCanvasKeyboard — copy / cut", () => {
  it("Ctrl+C copies the element JSON to the clipboard", () => {
    const { composer } = makeComposer();
    const { hook, addToast } = mount(composer);
    act(() => hook.result.current.handleKeyDown(key("c", { ctrlKey: true })));
    expect((composer as unknown as { clipboard: unknown }).clipboard).toEqual({
      id: "el-1",
      type: "text",
    });
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining("copied to clipboard") })
    );
  });

  it("Ctrl+Alt+C copies styles into styleClipboard", () => {
    const { composer } = makeComposer({ element: { getStyles: () => ({ color: "red" }) } });
    const { hook, addToast } = mount(composer);
    act(() => hook.result.current.handleKeyDown(key("c", { ctrlKey: true, altKey: true })));
    expect((composer as unknown as { styleClipboard: unknown }).styleClipboard).toEqual({
      color: "red",
    });
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: "1 style copied" })
    );
  });

  it("Ctrl+Alt+C warns when there are no styles to copy", () => {
    const { composer } = makeComposer({ element: { getStyles: () => ({}) } });
    const { hook, addToast } = mount(composer);
    act(() => hook.result.current.handleKeyDown(key("c", { ctrlKey: true, altKey: true })));
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: "No styles to copy", tone: "warning" })
    );
  });

  it("Ctrl+X copies then removes the element (cut)", () => {
    const { composer } = makeComposer();
    const { hook, clear, syncFromComposer } = mount(composer);
    act(() => hook.result.current.handleKeyDown(key("x", { ctrlKey: true })));
    expect((composer as unknown as { clipboard: unknown }).clipboard).toEqual({
      id: "el-1",
      type: "text",
    });
    expect(composer.elements.removeElement).toHaveBeenCalledWith("el-1");
    // Null parent → no next focus → clear()
    expect(clear).toHaveBeenCalled();
    expect(syncFromComposer).toHaveBeenCalled();
  });
});

describe("useCanvasKeyboard — paste", () => {
  it("Ctrl+V pastes the clipboard element under the current parent", () => {
    const parent = { getId: () => "parent-1" };
    const { composer } = makeComposer({
      clipboard: { id: "copied" },
      element: { getParent: () => parent },
    });
    const { hook, select, addToast } = mount(composer);
    act(() => hook.result.current.handleKeyDown(key("v", { ctrlKey: true })));
    expect(composer.elements.pasteElement).toHaveBeenCalledWith({ id: "copied" }, parent);
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ getId: expect.any(Function) }));
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Element pasted" })
    );
  });

  it("Ctrl+Alt+V applies each style from styleClipboard to the element", () => {
    const setStyle = vi.fn();
    const { composer, element } = makeComposer({
      styleClipboard: { color: "blue", fontSize: "12px" },
      element: { setStyle },
    });
    const { hook, addToast } = mount(composer);
    act(() => hook.result.current.handleKeyDown(key("v", { ctrlKey: true, altKey: true })));
    expect((element.setStyle as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith("color", "blue");
    expect((element.setStyle as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith("fontSize", "12px");
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ tone: "success" }));
  });
});

describe("useCanvasKeyboard — guards", () => {
  it("does nothing when composer is null", () => {
    const { select, clear } = mount(null as unknown as Composer);
    // No throw, and handlers are inert — nothing to assert beyond no crash.
    expect(select).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });

  it("ignores shortcuts when focus is inside an input", () => {
    const { composer } = makeComposer();
    const { hook } = mount(composer);
    const input = document.createElement("input");
    document.body.appendChild(input);
    const evt = key("a", { ctrlKey: true });
    Object.defineProperty(evt, "target", { value: input, writable: true });
    act(() => hook.result.current.handleKeyDown(evt));
    expect(composer.selection.selectAll).not.toHaveBeenCalled();
    input.remove();
  });
});
