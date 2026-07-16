/**
 * useSectionReorder — boundary computation + drag-to-reorder for top-level
 * sections (direct children of the page root).
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { useSectionReorder } from "../useSectionReorder";

const SECTION_EVENTS = [
  EVENTS.ELEMENT_CREATED,
  EVENTS.ELEMENT_DELETED,
  EVENTS.ELEMENT_MOVED,
  EVENTS.HISTORY_UNDO,
  EVENTS.HISTORY_REDO,
  EVENTS.CANVAS_FORCE_SYNC,
];

function stubRect(el: HTMLElement, rect: { top: number; left: number; width: number; height: number }) {
  el.getBoundingClientRect = () =>
    ({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.top + rect.height,
      right: rect.left + rect.width,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect;
}

describe("useSectionReorder", () => {
  let canvas: HTMLDivElement;
  let canvasRef: React.RefObject<HTMLDivElement | null>;
  let composer: {
    elements: {
      getActivePage: ReturnType<typeof vi.fn>;
      getElement: ReturnType<typeof vi.fn>;
      moveElement: ReturnType<typeof vi.fn>;
    };
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    beginTransaction: ReturnType<typeof vi.fn>;
    endTransaction: ReturnType<typeof vi.fn>;
    rollbackTransaction: ReturnType<typeof vi.fn>;
  };
  let handlers: Map<string, () => void>;
  let sectionIds: string[];
  let rafSpy: ReturnType<typeof vi.spyOn>;

  function addSectionDom(id: string, top: number) {
    const el = document.createElement("section");
    el.setAttribute("data-buildrick-id", id);
    stubRect(el, { top, left: 0, width: 800, height: 100 });
    canvas.appendChild(el);
  }

  beforeEach(() => {
    // requestAnimationFrame → synchronous so boundary recomputes are immediate
    rafSpy = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });

    canvas = document.createElement("div");
    stubRect(canvas, { top: 0, left: 0, width: 800, height: 600 });
    document.body.appendChild(canvas);
    canvasRef = { current: canvas };

    sectionIds = ["sec-a", "sec-b", "sec-c"];
    addSectionDom("sec-a", 0);
    addSectionDom("sec-b", 100);
    addSectionDom("sec-c", 200);

    handlers = new Map();
    composer = {
      elements: {
        getActivePage: vi.fn(() => ({ root: { id: "root-1" } })),
        getElement: vi.fn((id: string) =>
          id === "root-1"
            ? { getChildren: () => sectionIds.map((sid) => ({ getId: () => sid })) }
            : null
        ),
        moveElement: vi.fn(),
      },
      on: vi.fn((evt: string, h: () => void) => handlers.set(evt, h)),
      off: vi.fn(),
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
    };
  });

  afterEach(() => {
    rafSpy.mockRestore();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  function mountHook(enabled = true) {
    return renderHook(() =>
      useSectionReorder({
        composer: composer as unknown as Composer,
        canvasRef,
        enabled,
      })
    );
  }

  describe("boundary computation", () => {
    it("computes one boundary per top-level section with canvas-relative rects", () => {
      const { result } = mountHook();
      expect(result.current.boundaries).toEqual([
        { sectionId: "sec-a", index: 0, rect: { top: 0, left: 0, width: 800 } },
        { sectionId: "sec-b", index: 1, rect: { top: 100, left: 0, width: 800 } },
        { sectionId: "sec-c", index: 2, rect: { top: 200, left: 0, width: 800 } },
      ]);
    });

    it("returns no boundaries when disabled", () => {
      const { result } = mountHook(false);
      expect(result.current.boundaries).toEqual([]);
    });

    it("skips sections whose DOM node is missing from the canvas", () => {
      canvas.querySelector('[data-buildrick-id="sec-b"]')?.remove();
      const { result } = mountHook();
      expect(result.current.boundaries.map((b) => b.sectionId)).toEqual(["sec-a", "sec-c"]);
    });

    it("subscribes to content-change events and unsubscribes on unmount", () => {
      const { unmount } = mountHook();
      for (const evt of SECTION_EVENTS) {
        expect(composer.on).toHaveBeenCalledWith(evt, expect.any(Function));
      }
      unmount();
      for (const evt of SECTION_EVENTS) {
        expect(composer.off).toHaveBeenCalledWith(evt, expect.any(Function));
      }
    });

    it("recomputes boundaries when a content-change event fires", () => {
      const { result } = mountHook();
      expect(result.current.boundaries).toHaveLength(3);

      sectionIds.push("sec-d");
      addSectionDom("sec-d", 300);
      act(() => {
        handlers.get(EVENTS.ELEMENT_CREATED)?.();
      });
      expect(result.current.boundaries).toHaveLength(4);
      expect(result.current.boundaries[3].sectionId).toBe("sec-d");
    });
  });

  describe("drag lifecycle", () => {
    it("startDrag seeds dragState with toIndex = fromIndex", () => {
      const { result } = mountHook();
      act(() => result.current.startDrag("sec-a", 0));
      expect(result.current.dragState).toEqual({
        sectionId: "sec-a",
        fromIndex: 0,
        toIndex: 0,
      });
    });

    it("updateDrag derives the target index from pointer Y against boundary tops", () => {
      const { result } = mountHook();
      act(() => result.current.startDrag("sec-a", 0));

      // Y=150 is past sec-a (0) and sec-b (100) tops but not sec-c (200) → index 2
      act(() => result.current.updateDrag(150));
      expect(result.current.dragState?.toIndex).toBe(2);

      // Y=250 is past all three tops → index 3 (end of list)
      act(() => result.current.updateDrag(250));
      expect(result.current.dragState?.toIndex).toBe(3);
    });

    it("updateDrag is a no-op before startDrag", () => {
      const { result } = mountHook();
      act(() => result.current.updateDrag(150));
      expect(result.current.dragState).toBeNull();
    });

    it("completeDrag moves the section inside a reorder-section transaction (downward move adjusts index)", () => {
      const { result } = mountHook();
      act(() => result.current.startDrag("sec-a", 0));
      act(() => result.current.updateDrag(250)); // toIndex 3
      act(() => result.current.completeDrag());

      expect(composer.beginTransaction).toHaveBeenCalledWith("reorder-section");
      // Moving down: removal shifts indices, so toIndex 3 → adjusted 2
      expect(composer.elements.moveElement).toHaveBeenCalledWith("sec-a", "root-1", 2);
      expect(composer.endTransaction).toHaveBeenCalled();
      expect(result.current.dragState).toBeNull();
    });

    it("completeDrag does not move when target equals origin (same slot or slot+1)", () => {
      const { result } = mountHook();
      act(() => result.current.startDrag("sec-b", 1));
      // toIndex 2 = dropping right below itself → fromIndex === toIndex - 1 → no-op
      act(() => result.current.updateDrag(150));
      act(() => result.current.completeDrag());

      expect(composer.elements.moveElement).not.toHaveBeenCalled();
      expect(result.current.dragState).toBeNull();
    });

    it("completeDrag rolls back the transaction when moveElement throws", () => {
      composer.elements.moveElement.mockImplementation(() => {
        throw new Error("move failed");
      });
      const { result } = mountHook();
      act(() => result.current.startDrag("sec-a", 0));
      act(() => result.current.updateDrag(250));
      act(() => result.current.completeDrag());

      expect(composer.rollbackTransaction).toHaveBeenCalled();
      expect(result.current.dragState).toBeNull();
    });

    it("cancelDrag clears dragState without moving anything", () => {
      const { result } = mountHook();
      act(() => result.current.startDrag("sec-a", 0));
      act(() => result.current.cancelDrag());
      expect(result.current.dragState).toBeNull();
      expect(composer.elements.moveElement).not.toHaveBeenCalled();
    });

    it("tracks hovered boundary id", () => {
      const { result } = mountHook();
      act(() => result.current.setHoveredBoundary("sec-b"));
      expect(result.current.hoveredBoundary).toBe("sec-b");
      act(() => result.current.setHoveredBoundary(null));
      expect(result.current.hoveredBoundary).toBeNull();
    });
  });
});
