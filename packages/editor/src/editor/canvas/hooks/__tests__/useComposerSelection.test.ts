/**
 * useComposerSelection — selection state derived from Composer events.
 *
 * Pins: initial sync from SelectionManager, reaction to the five selection
 * events (element:selected, selection:cleared, selection:multiple,
 * selection:added, selection:removed), the select/clear/isSelected helpers,
 * and full unsubscription on unmount.
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import type { Element } from "../../../../engine/elements/Element";
import { EVENTS } from "../../../../shared/constants/events";
import { useComposerSelection } from "../useComposerSelection";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function el(id: string, type = "container"): Element {
  return { getId: () => id, getType: () => type } as unknown as Element;
}

function makeComposer() {
  const handlers = new Map<string, Set<(payload?: unknown) => void>>();
  const composer = {
    on: vi.fn((event: string, fn: (payload?: unknown) => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(fn);
    }),
    off: vi.fn((event: string, fn: (payload?: unknown) => void) => {
      handlers.get(event)?.delete(fn);
    }),
    selection: {
      getSelected: vi.fn<() => Element | null>(() => null),
      getAllSelected: vi.fn<() => Element[]>(() => []),
      select: vi.fn(),
      clear: vi.fn(),
    },
    elements: {
      getElement: vi.fn<(id: string) => Element | null>(() => null),
    },
    /** Test helper — fire registered handlers like the engine would */
    fire(event: string, payload?: unknown) {
      handlers.get(event)?.forEach((fn) => fn(payload));
    },
  };
  return composer;
}
type MockComposer = ReturnType<typeof makeComposer>;

function renderSelection(composer: MockComposer | null) {
  return renderHook(() =>
    useComposerSelection({ composer: composer as unknown as Composer })
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useComposerSelection — state derivation", () => {
  it("defaults to empty when composer is null", () => {
    const { result } = renderSelection(null);
    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedElement).toBeNull();
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.selectedElements).toEqual([]);
    expect(result.current.isMultiSelect).toBe(false);
    // helpers must not throw
    act(() => result.current.select("el-1"));
    act(() => result.current.clear());
  });

  it("syncs the initial selection from the SelectionManager on mount", () => {
    const composer = makeComposer();
    const a = el("el-a");
    composer.selection.getSelected.mockReturnValue(a);
    composer.selection.getAllSelected.mockReturnValue([a]);

    const { result } = renderSelection(composer);
    expect(result.current.selectedId).toBe("el-a");
    expect(result.current.selectedElement).toBe(a);
    expect(result.current.selectedIds).toEqual(["el-a"]);
    expect(result.current.isMultiSelect).toBe(false);
  });

  it("reflects element:selected events", () => {
    const composer = makeComposer();
    const { result } = renderSelection(composer);
    expect(result.current.selectedId).toBeNull();

    const b = el("el-b", "text");
    composer.selection.getAllSelected.mockReturnValue([b]);
    act(() => composer.fire(EVENTS.ELEMENT_SELECTED, b));

    expect(result.current.selectedId).toBe("el-b");
    expect(result.current.selectedElement).toBe(b);
    expect(result.current.selectedIds).toEqual(["el-b"]);
  });

  it("reflects selection:cleared events", () => {
    const composer = makeComposer();
    const a = el("el-a");
    composer.selection.getSelected.mockReturnValue(a);
    composer.selection.getAllSelected.mockReturnValue([a]);
    const { result } = renderSelection(composer);
    expect(result.current.selectedId).toBe("el-a");

    act(() => composer.fire(EVENTS.SELECTION_CLEARED));

    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedElements).toEqual([]);
  });

  it("selection:multiple promotes the first element to primary and flags multi-select", () => {
    const composer = makeComposer();
    const { result } = renderSelection(composer);

    const a = el("el-a");
    const b = el("el-b");
    act(() => composer.fire(EVENTS.SELECTION_MULTIPLE, [a, b]));

    expect(result.current.selectedId).toBe("el-a");
    expect(result.current.selectedIds).toEqual(["el-a", "el-b"]);
    expect(result.current.isMultiSelect).toBe(true);
  });

  it("selection:added / selection:removed re-read state from the composer", () => {
    const composer = makeComposer();
    const { result } = renderSelection(composer);

    const a = el("el-a");
    const b = el("el-b");
    composer.selection.getSelected.mockReturnValue(a);
    composer.selection.getAllSelected.mockReturnValue([a, b]);
    act(() => composer.fire(EVENTS.SELECTION_ADDED));
    expect(result.current.selectedIds).toEqual(["el-a", "el-b"]);

    composer.selection.getAllSelected.mockReturnValue([a]);
    act(() => composer.fire(EVENTS.SELECTION_REMOVED));
    expect(result.current.selectedIds).toEqual(["el-a"]);
    expect(result.current.isMultiSelect).toBe(false);
  });
});

describe("useComposerSelection — actions", () => {
  it("select(id) resolves the element and delegates to SelectionManager", () => {
    const composer = makeComposer();
    const a = el("el-a");
    composer.elements.getElement.mockReturnValue(a);
    const { result } = renderSelection(composer);

    act(() => result.current.select("el-a"));
    expect(composer.elements.getElement).toHaveBeenCalledWith("el-a");
    expect(composer.selection.select).toHaveBeenCalledWith(a);
  });

  it("select(id) is a no-op for unknown ids", () => {
    const composer = makeComposer();
    composer.elements.getElement.mockReturnValue(null);
    const { result } = renderSelection(composer);

    act(() => result.current.select("ghost"));
    expect(composer.selection.select).not.toHaveBeenCalled();
  });

  it("select(element) passes the element straight through", () => {
    const composer = makeComposer();
    const a = el("el-a");
    const { result } = renderSelection(composer);

    act(() => result.current.select(a));
    expect(composer.selection.select).toHaveBeenCalledWith(a);
    expect(composer.elements.getElement).not.toHaveBeenCalled();
  });

  it("select(null) and clear() both clear via the SelectionManager", () => {
    const composer = makeComposer();
    const { result } = renderSelection(composer);

    act(() => result.current.select(null));
    act(() => result.current.clear());
    expect(composer.selection.clear).toHaveBeenCalledTimes(2);
  });

  it("isSelected answers by id or by element", () => {
    const composer = makeComposer();
    const a = el("el-a");
    composer.selection.getSelected.mockReturnValue(a);
    composer.selection.getAllSelected.mockReturnValue([a]);
    const { result } = renderSelection(composer);

    expect(result.current.isSelected("el-a")).toBe(true);
    expect(result.current.isSelected(a)).toBe(true);
    expect(result.current.isSelected("el-b")).toBe(false);
    expect(result.current.isSelected(el("el-b"))).toBe(false);
  });
});

describe("useComposerSelection — lifecycle", () => {
  it("subscribes to all five selection events and unsubscribes the SAME handlers on unmount", () => {
    const composer = makeComposer();
    const { unmount } = renderSelection(composer);

    const expectedEvents = [
      EVENTS.ELEMENT_SELECTED,
      EVENTS.SELECTION_CLEARED,
      EVENTS.SELECTION_MULTIPLE,
      EVENTS.SELECTION_ADDED,
      EVENTS.SELECTION_REMOVED,
    ];
    expect(composer.on.mock.calls.map(([evt]) => evt)).toEqual(expectedEvents);

    unmount();

    expect(composer.off).toHaveBeenCalledTimes(5);
    // each off call must pass the exact handler reference registered via on
    for (const [event, handler] of composer.on.mock.calls) {
      expect(composer.off).toHaveBeenCalledWith(event, handler);
    }
  });

  it("events after unmount no longer update state (handlers removed)", () => {
    const composer = makeComposer();
    const { result, unmount } = renderSelection(composer);
    unmount();

    // firing after unmount hits no handlers — nothing to update, no act warning
    composer.fire(EVENTS.ELEMENT_SELECTED, el("el-z"));
    expect(result.current.selectedId).toBeNull();
  });
});
