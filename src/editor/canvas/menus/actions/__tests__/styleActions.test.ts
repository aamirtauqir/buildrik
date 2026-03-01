/**
 * styleActions — style clipboard consolidation test
 *
 * Verifies that both the context menu copy-styles action and the keyboard
 * Cmd+Option+C/V handler share the same `composer.styleClipboard` SSOT.
 * There must be NO module-level `let styleClipboard` variable; the only
 * clipboard storage is `composer.styleClipboard`.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Composer } from "../../../../../engine/Composer";
import { useCanvasKeyboard } from "../../../hooks/useCanvasKeyboard";
import { quickStyleSubmenu } from "../styleActions";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Composer mock that carries a real `styleClipboard` field,
 * so both the context-menu actions and the keyboard hook write/read to the
 * same object reference.
 */
function buildMockComposer(): Composer {
  const composer = {
    styleClipboard: null as Record<string, string> | null,
    clipboard: null,
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    selection: {
      selectAll: vi.fn(),
      clear: vi.fn(),
    },
    elements: {
      getElement: vi.fn(),
      getActivePage: vi.fn(() => null),
      removeElement: vi.fn(),
      duplicateElement: vi.fn(),
      pasteElement: vi.fn(),
    },
    history: { undo: vi.fn() },
    emit: vi.fn(),
  } as unknown as Composer;

  return composer;
}

/**
 * Build a minimal Element mock whose `getStyles` returns the provided styles
 * and whose `setStyles` / `setStyle` are tracked spies.
 */
function buildMockElement(styles: Record<string, string> = {}) {
  return {
    getStyles: vi.fn(() => ({ ...styles })),
    setStyle: vi.fn(),
    setStyles: vi.fn(),
    getId: vi.fn(() => "el-1"),
    getType: vi.fn(() => "div"),
    getParent: vi.fn(() => null),
    getChildren: vi.fn(() => []),
    isLocked: vi.fn(() => false),
    toJSON: vi.fn(() => ({})),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("styleActions — copy-styles writes to composer.styleClipboard", () => {
  let composer: Composer;
  const testStyles = { color: "red", fontSize: "14px" };

  beforeEach(() => {
    composer = buildMockComposer();
  });

  it("sets composer.styleClipboard when copy-styles handler is invoked", () => {
    const copyAction = quickStyleSubmenu.find((a) => a.id === "copy-styles");
    expect(copyAction).toBeDefined();

    const element = buildMockElement(testStyles);

    copyAction!.handler!({
      composer,
      element: element as unknown as import("../../../../../engine/elements/Element").Element,
      isRoot: false,
    });

    expect(composer.styleClipboard).toEqual(testStyles);
  });

  it("paste-styles isEnabled returns false when composer.styleClipboard is null", () => {
    composer.styleClipboard = null;
    const pasteAction = quickStyleSubmenu.find((a) => a.id === "paste-styles");
    expect(pasteAction).toBeDefined();

    const element = buildMockElement();
    const result = pasteAction!.isEnabled!({
      composer,
      element: element as unknown as import("../../../../../engine/elements/Element").Element,
      isRoot: false,
    });

    expect(result).toBe(false);
  });

  it("paste-styles isEnabled returns true when composer.styleClipboard has styles", () => {
    composer.styleClipboard = testStyles;
    const pasteAction = quickStyleSubmenu.find((a) => a.id === "paste-styles");

    const element = buildMockElement();
    const result = pasteAction!.isEnabled!({
      composer,
      element: element as unknown as import("../../../../../engine/elements/Element").Element,
      isRoot: false,
    });

    expect(result).toBe(true);
  });

  it("paste-styles handler calls element.setStyles with the styles from composer.styleClipboard", () => {
    composer.styleClipboard = testStyles;

    const pasteAction = quickStyleSubmenu.find((a) => a.id === "paste-styles");
    const element = buildMockElement();

    // runTransaction calls beginTransaction/endTransaction and invokes the callback synchronously
    (composer.beginTransaction as ReturnType<typeof vi.fn>).mockImplementation(() => undefined);
    (composer.endTransaction as ReturnType<typeof vi.fn>).mockImplementation(() => undefined);

    pasteAction!.handler!({
      composer,
      element: element as unknown as import("../../../../../engine/elements/Element").Element,
      isRoot: false,
    });

    expect(element.setStyles).toHaveBeenCalledWith(testStyles);
  });
});

describe("styleActions — cross-path clipboard sharing (context menu copy → keyboard paste)", () => {
  let composer: Composer;
  const testStyles = { backgroundColor: "#ff0000", padding: "8px", fontWeight: "bold" };

  beforeEach(() => {
    composer = buildMockComposer();
  });

  it("styles copied via context menu are readable by the keyboard Cmd+Option+V handler", () => {
    // ── Step 1: copy via context menu action ──────────────────────────────
    const copyAction = quickStyleSubmenu.find((a) => a.id === "copy-styles");
    const sourceElement = buildMockElement(testStyles);

    copyAction!.handler!({
      composer,
      element: sourceElement as unknown as import("../../../../../engine/elements/Element").Element,
      isRoot: false,
    });

    // Confirm the context menu copy wrote to composer.styleClipboard
    expect(composer.styleClipboard).toEqual(testStyles);

    // ── Step 2: paste via keyboard Cmd+Option+V ───────────────────────────
    const targetElement = buildMockElement();
    // Wire getElement to return our target element for the keyboard hook
    (composer.elements.getElement as ReturnType<typeof vi.fn>).mockReturnValue(targetElement);
    (composer.elements.getActivePage as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const syncFromComposer = vi.fn();

    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer,
        selectedId: "el-1",
        editingId: null,
        select: vi.fn(),
        clear: vi.fn(),
        syncFromComposer,
      })
    );

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent("keydown", {
          key: "v",
          ctrlKey: true,
          altKey: true,
        }) as unknown as React.KeyboardEvent
      );
    });

    // The keyboard hook should have opened a transaction and applied each style
    expect(composer.beginTransaction).toHaveBeenCalledWith("paste-styles");
    expect(composer.endTransaction).toHaveBeenCalled();

    // Each style key from the context-menu copy should have been set on the target element
    Object.entries(testStyles).forEach(([key, value]) => {
      expect(targetElement.setStyle).toHaveBeenCalledWith(key, value);
    });
  });

  it("styles copied via keyboard Cmd+Option+C are readable by the context menu paste-styles action", () => {
    // ── Step 1: copy via keyboard Cmd+Option+C ────────────────────────────
    const sourceElement = buildMockElement(testStyles);
    (composer.elements.getElement as ReturnType<typeof vi.fn>).mockReturnValue(sourceElement);
    (composer.elements.getActivePage as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { result } = renderHook(() =>
      useCanvasKeyboard({
        composer,
        selectedId: "el-1",
        editingId: null,
        select: vi.fn(),
        clear: vi.fn(),
        syncFromComposer: vi.fn(),
      })
    );

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent("keydown", {
          key: "c",
          ctrlKey: true,
          altKey: true,
        }) as unknown as React.KeyboardEvent
      );
    });

    // Confirm keyboard copy wrote to composer.styleClipboard
    expect(composer.styleClipboard).toEqual(testStyles);

    // ── Step 2: paste via context menu paste-styles handler ───────────────
    (composer.beginTransaction as ReturnType<typeof vi.fn>).mockImplementation(() => undefined);
    (composer.endTransaction as ReturnType<typeof vi.fn>).mockImplementation(() => undefined);

    const targetElement = buildMockElement();
    const pasteAction = quickStyleSubmenu.find((a) => a.id === "paste-styles");

    pasteAction!.handler!({
      composer,
      element: targetElement as unknown as import("../../../../../engine/elements/Element").Element,
      isRoot: false,
    });

    expect(targetElement.setStyles).toHaveBeenCalledWith(testStyles);
  });
});
