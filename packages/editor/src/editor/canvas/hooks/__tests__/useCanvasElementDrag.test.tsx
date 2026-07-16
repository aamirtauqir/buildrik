/**
 * useCanvasElementDrag — drag payload / clone / drop-chain tests.
 *
 * Strategy: the sibling hooks (touch, keyboard-move, auto-scroll, DOM-sync)
 * are mocked so this file isolates the delegation handlers the hook attaches
 * to the canvas container. Drag events are simulated with plain Events (jsdom
 * has no DragEvent) carrying a fake dataTransfer object.
 *
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine";
import { MIME_TYPES } from "../../../../shared/constants/config";
import { useCanvasElementDrag } from "../useCanvasElementDrag";

const mocks = vi.hoisted(() => ({
  updateDropTarget: vi.fn(),
  clearDropTarget: vi.fn(),
  startAutoScroll: vi.fn(),
  stopAutoScroll: vi.fn(),
}));

vi.mock("../drag", () => ({
  useTouchDrag: () => ({
    touchHandlers: {
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
      onTouchCancel: vi.fn(),
    },
  }),
  useKeyboardMove: () => ({ stepConfig: {} }),
}));

vi.mock("../useElementDragAutoScroll", () => ({
  useElementDragAutoScroll: () => ({
    startAutoScroll: mocks.startAutoScroll,
    stopAutoScroll: mocks.stopAutoScroll,
  }),
}));

vi.mock("../useElementDragDomSync", () => ({
  // The real hook keeps rootIdRef in sync with the active page. The mock pins
  // root-1 as the root so root-drag guards are exercisable.
  useElementDragDomSync: (opts: { rootIdRef: React.MutableRefObject<string | null> }) => {
    opts.rootIdRef.current = "root-1";
    return {
      updateDropTarget: mocks.updateDropTarget,
      clearDropTarget: mocks.clearDropTarget,
    };
  },
}));

interface FakeDataTransfer {
  store: Record<string, string>;
  setData: (k: string, v: string) => void;
  getData: (k: string) => string;
  setDragImage: ReturnType<typeof vi.fn>;
  effectAllowed: string;
}

function makeDataTransfer(): FakeDataTransfer {
  const store: Record<string, string> = {};
  return {
    store,
    setData: (k: string, v: string) => {
      store[k] = v;
    },
    getData: (k: string) => store[k] ?? "",
    setDragImage: vi.fn(),
    effectAllowed: "",
  };
}

function dragEvent(
  type: string,
  dt: FakeDataTransfer | null,
  overrides: Record<string, unknown> = {}
): Event {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(ev, {
    dataTransfer: dt,
    clientX: 10,
    clientY: 20,
    altKey: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    ...overrides,
  });
  return ev;
}

function makeComposer(overrides: Record<string, unknown> = {}) {
  return {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
    selection: {
      getSelectedIds: vi.fn(() => [] as string[]),
      select: vi.fn(),
    },
    elements: {
      getElement: vi.fn((id: string) => ({
        getId: () => id,
        getType: () => "text",
        getParent: () => null,
      })),
      duplicateElement: vi.fn(),
    },
    canvas: {
      drag: { start: vi.fn() },
      indicators: {
        calculateSmartGuides: vi.fn(() => [{ axis: "vertical", position: 50 }]),
      },
    },
    ...overrides,
  };
}

describe("useCanvasElementDrag", () => {
  let canvas: HTMLDivElement;
  let child: HTMLDivElement;
  let canvasRef: React.RefObject<HTMLDivElement | null>;
  let composer: ReturnType<typeof makeComposer>;
  let onDraggingChange: ReturnType<typeof vi.fn>;
  let onSnapLinesChange: ReturnType<typeof vi.fn>;

  function mountHook(extra: Partial<Parameters<typeof useCanvasElementDrag>[0]> = {}) {
    return renderHook(() =>
      useCanvasElementDrag({
        composer: composer as unknown as Composer,
        canvasRef,
        onDraggingChange: onDraggingChange as never,
        onSnapLinesChange: onSnapLinesChange as never,
        ...extra,
      })
    );
  }

  beforeEach(() => {
    canvas = document.createElement("div");
    child = document.createElement("div");
    child.setAttribute("data-buildrick-id", "el-1");
    canvas.appendChild(child);
    document.body.appendChild(canvas);
    canvasRef = { current: canvas };
    composer = makeComposer();
    onDraggingChange = vi.fn();
    onSnapLinesChange = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("mousedown priming", () => {
    it("marks a canvas element draggable with grabbing cursor on left mousedown", () => {
      mountHook();
      child.dispatchEvent(new MouseEvent("mousedown", { button: 0, bubbles: true }));
      expect(child.draggable).toBe(true);
      expect(child.style.cursor).toBe("grabbing");
    });

    it("refuses to make the root element draggable", () => {
      const rootEl = document.createElement("div");
      rootEl.setAttribute("data-buildrick-id", "root-1");
      canvas.appendChild(rootEl);
      mountHook();
      rootEl.dispatchEvent(new MouseEvent("mousedown", { button: 0, bubbles: true }));
      expect(rootEl.draggable).toBe(false);
    });

    it("ignores non-left mousedown", () => {
      mountHook();
      child.dispatchEvent(new MouseEvent("mousedown", { button: 2, bubbles: true }));
      expect(child.draggable).toBe(false);
    });
  });

  describe("dragstart — single element payload", () => {
    it("writes the element payload into dataTransfer and notifies DragManager", () => {
      mountHook();
      const dt = makeDataTransfer();
      child.dispatchEvent(dragEvent("dragstart", dt));

      expect(JSON.parse(dt.getData("element"))).toEqual({ elementId: "el-1" });
      expect(dt.effectAllowed).toBe("move");
      expect(onDraggingChange).toHaveBeenCalledWith("el-1");
      expect(composer.canvas.drag.start).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "element",
          elementId: "el-1",
          elementType: "text",
          startPosition: { x: 10, y: 20 },
        }),
        "canvas",
        { x: 10, y: 20 }
      );
    });

    it("applies drag visual feedback (bd-dragging class + reduced opacity)", () => {
      mountHook();
      child.dispatchEvent(dragEvent("dragstart", makeDataTransfer()));
      expect(child.classList.contains("bd-dragging")).toBe(true);
      expect(child.style.opacity).toBe("0.4");
    });

    it("mounts a drag ghost with the element type label, removed after ~50ms (BUG-018)", () => {
      vi.useFakeTimers();
      mountHook();
      child.dispatchEvent(dragEvent("dragstart", makeDataTransfer()));

      const ghost = document.querySelector(".bd-drag-ghost");
      expect(ghost).not.toBeNull();
      expect(ghost?.textContent).toContain("text");

      vi.advanceTimersByTime(60);
      expect(document.querySelector(".bd-drag-ghost")).toBeNull();
    });

    it("blocks dragging the root element", () => {
      const rootEl = document.createElement("div");
      rootEl.setAttribute("data-buildrick-id", "root-1");
      canvas.appendChild(rootEl);
      mountHook();

      const ev = dragEvent("dragstart", makeDataTransfer());
      rootEl.dispatchEvent(ev);

      expect(ev.defaultPrevented).toBe(true);
      expect(composer.canvas.drag.start).not.toHaveBeenCalled();
      expect(onDraggingChange).not.toHaveBeenCalled();
    });
  });

  describe("dragstart — Alt+drag clone mode", () => {
    it("duplicates the element in a clone-element transaction and drags the clone", () => {
      const clone = { getId: () => "el-1-copy", getType: () => "text", getParent: () => null };
      composer.elements.duplicateElement.mockReturnValue(clone);
      mountHook();

      const dt = makeDataTransfer();
      child.dispatchEvent(dragEvent("dragstart", dt, { altKey: true }));

      expect(composer.beginTransaction).toHaveBeenCalledWith("clone-element");
      expect(composer.elements.duplicateElement).toHaveBeenCalledWith("el-1");
      expect(composer.selection.select).toHaveBeenCalledWith(clone);
      expect(composer.endTransaction).toHaveBeenCalled();
      // Payload carries the CLONE id, not the source id
      expect(JSON.parse(dt.getData("element"))).toEqual({ elementId: "el-1-copy" });
      // Clone mode flips the cursor affordance to copy
      expect(dt.effectAllowed).toBe("copy");
      expect(child.classList.contains("bd-clone-mode")).toBe(true);
      expect(onDraggingChange).toHaveBeenCalledWith("el-1-copy");
    });

    it("rolls back the clone transaction and falls back to moving the original when duplicate throws", () => {
      composer.elements.duplicateElement.mockImplementation(() => {
        throw new Error("dup failed");
      });
      mountHook();

      const dt = makeDataTransfer();
      child.dispatchEvent(dragEvent("dragstart", dt, { altKey: true }));

      expect(composer.rollbackTransaction).toHaveBeenCalled();
      expect(JSON.parse(dt.getData("element"))).toEqual({ elementId: "el-1" });
      expect(dt.effectAllowed).toBe("move");
      expect(child.classList.contains("bd-clone-mode")).toBe(false);
    });
  });

  describe("dragstart — multi-select payload", () => {
    it("writes a multi drag payload when the dragged element is part of a multi-selection", () => {
      const parent = {
        getId: () => "p-1",
        getChildren: () => [{ getId: () => "el-1" }, { getId: () => "el-2" }],
      };
      composer.selection.getSelectedIds.mockReturnValue(["el-1", "el-2"]);
      composer.elements.getElement.mockImplementation(((id: string) => ({
        getId: () => id,
        getType: () => "text",
        getParent: () => parent,
      })) as never);
      mountHook();

      const dt = makeDataTransfer();
      child.dispatchEvent(dragEvent("dragstart", dt));

      const raw = dt.getData(MIME_TYPES.MULTI);
      expect(raw).not.toBe("");
      const payload = JSON.parse(raw);
      expect(payload.type).toBe("multi");
      expect(payload.elements).toEqual([
        expect.objectContaining({ elementId: "el-1", originalParentId: "p-1", originalIndex: 0 }),
        expect.objectContaining({ elementId: "el-2", originalParentId: "p-1", originalIndex: 1 }),
      ]);
      expect(composer.canvas.drag.start).toHaveBeenCalledWith(
        expect.objectContaining({ type: "multi" }),
        "canvas",
        { x: 10, y: 20 }
      );
    });

    it("uses the single-element payload when selection does not include the dragged element", () => {
      composer.selection.getSelectedIds.mockReturnValue(["other-1", "other-2"]);
      mountHook();

      const dt = makeDataTransfer();
      child.dispatchEvent(dragEvent("dragstart", dt));

      expect(dt.getData(MIME_TYPES.MULTI)).toBe("");
      expect(JSON.parse(dt.getData("element"))).toEqual({ elementId: "el-1" });
    });
  });

  describe("drag — auto-scroll, drop target and guides", () => {
    it("feeds pointer position into auto-scroll + drop-target resolution during drag", () => {
      mountHook();
      child.dispatchEvent(dragEvent("dragstart", makeDataTransfer()));
      child.dispatchEvent(dragEvent("drag", null, { clientX: 111, clientY: 222 }));

      expect(mocks.startAutoScroll).toHaveBeenCalledWith(111, 222);
      expect(mocks.updateDropTarget).toHaveBeenCalledWith(111, 222, "el-1");
    });

    it("routes snap lines through the injected snapCalculator when provided", () => {
      const snapLines = [{ orientation: "vertical" as const, position: 5, start: 0, end: 10 }];
      const snapCalculator = vi.fn(() => ({ x: 0, y: 0, snapLines }));
      mountHook({ snapCalculator });

      child.dispatchEvent(dragEvent("dragstart", makeDataTransfer()));
      child.dispatchEvent(dragEvent("drag", null));

      expect(snapCalculator).toHaveBeenCalledWith(
        "el-1",
        expect.objectContaining({ left: expect.any(Number), top: expect.any(Number) }),
        1
      );
      expect(onSnapLinesChange).toHaveBeenCalledWith(snapLines);
    });

    it("falls back to composer smart guides (mapped to snap lines) without a snapCalculator", () => {
      mountHook();
      child.dispatchEvent(dragEvent("dragstart", makeDataTransfer()));
      child.dispatchEvent(dragEvent("drag", null));

      expect(composer.canvas.indicators.calculateSmartGuides).toHaveBeenCalledWith(
        "el-1",
        expect.objectContaining({ width: expect.any(Number) })
      );
      expect(onSnapLinesChange).toHaveBeenCalledWith([
        { orientation: "vertical", position: 50, start: -99999, end: 99999 },
      ]);
    });

    it("throttles drag calculations to one per 50ms window", () => {
      const nowSpy = vi.spyOn(Date, "now");
      nowSpy.mockReturnValue(1000);
      mountHook();
      child.dispatchEvent(dragEvent("dragstart", makeDataTransfer()));

      child.dispatchEvent(dragEvent("drag", null));
      expect(mocks.updateDropTarget).toHaveBeenCalledTimes(1);

      nowSpy.mockReturnValue(1020); // within throttle window
      child.dispatchEvent(dragEvent("drag", null));
      expect(mocks.updateDropTarget).toHaveBeenCalledTimes(1);

      nowSpy.mockReturnValue(1060); // past throttle window
      child.dispatchEvent(dragEvent("drag", null));
      expect(mocks.updateDropTarget).toHaveBeenCalledTimes(2);
      nowSpy.mockRestore();
    });

    it("ignores drag events when no drag was started", () => {
      mountHook();
      child.dispatchEvent(dragEvent("drag", null));
      expect(mocks.startAutoScroll).not.toHaveBeenCalled();
      expect(mocks.updateDropTarget).not.toHaveBeenCalled();
    });
  });

  describe("dragend — cleanup chain", () => {
    it("restores visuals, stops auto-scroll, clears drop target and resets callbacks", () => {
      mountHook();
      child.dispatchEvent(dragEvent("dragstart", makeDataTransfer()));
      onDraggingChange.mockClear();
      onSnapLinesChange.mockClear();

      child.dispatchEvent(dragEvent("dragend", null));

      expect(child.style.opacity).toBe("1");
      expect(child.classList.contains("bd-dragging")).toBe(false);
      expect(child.classList.contains("bd-clone-mode")).toBe(false);
      expect(mocks.stopAutoScroll).toHaveBeenCalled();
      expect(mocks.clearDropTarget).toHaveBeenCalled();
      expect(onDraggingChange).toHaveBeenCalledWith(null);
      expect(onSnapLinesChange).toHaveBeenCalledWith([]);
    });
  });

  describe("unmount", () => {
    it("removes the delegated listeners from the canvas", () => {
      const { unmount } = mountHook();
      unmount();
      const dt = makeDataTransfer();
      child.dispatchEvent(dragEvent("dragstart", dt));
      expect(dt.getData("element")).toBe("");
      expect(onDraggingChange).not.toHaveBeenCalled();
    });
  });
});
