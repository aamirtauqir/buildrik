/**
 * useCanvasSnapping — snap-threshold math.
 *
 * Pins: 5px threshold (strict <, divided by zoom scale), edge + center
 * alignment corrections against sibling DOM rects, returned SnapLine
 * geometry, and the passthrough paths (no composer / element / parent /
 * sibling DOM node).
 *
 * Sibling rects come from document.querySelector('[data-buildrick-id=...]')
 * and are converted to canvas-relative space via closest('.buildrick-canvas'),
 * so the fixture builds that exact DOM shape with stubbed rects.
 */

import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import { useCanvasSnapping } from "../useCanvasSnapping";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DRAG_ID = "drag-el";

function stubRect(
  el: HTMLElement,
  r: { left: number; top: number; width: number; height: number }
) {
  el.getBoundingClientRect = () =>
    ({
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      right: r.left + r.width,
      bottom: r.top + r.height,
      x: r.left,
      y: r.top,
      toJSON: () => ({}),
    }) as DOMRect;
}

let canvasEl: HTMLDivElement;

function addSiblingDom(id: string, r: { left: number; top: number; width: number; height: number }) {
  const el = document.createElement("div");
  el.setAttribute("data-buildrick-id", id);
  stubRect(el, r);
  canvasEl.appendChild(el);
  return el;
}

/** Composer whose dragged element has the given sibling ids */
function makeComposer(siblingIds: string[]): Composer {
  const children = [DRAG_ID, ...siblingIds].map((id) => ({ getId: () => id }));
  const parent = { getChildren: () => children };
  const element = { getId: () => DRAG_ID, getParent: () => parent };
  return {
    elements: {
      getElement: vi.fn((id: string) => (id === DRAG_ID ? element : null)),
    },
  } as unknown as Composer;
}

function renderSnapping(composer: Composer | null) {
  return renderHook(() => useCanvasSnapping(composer)).result.current;
}

beforeEach(() => {
  canvasEl = document.createElement("div");
  canvasEl.className = "buildrick-canvas";
  stubRect(canvasEl, { left: 0, top: 0, width: 800, height: 600 });
  document.body.appendChild(canvasEl);
});

afterEach(() => {
  canvasEl.remove();
});

// ---------------------------------------------------------------------------
// Passthrough paths
// ---------------------------------------------------------------------------

describe("useCanvasSnapping — passthrough (no snap possible)", () => {
  it("returns the input position unchanged when composer is null", () => {
    const { calculateSnapping } = renderSnapping(null);
    const result = calculateSnapping("any", { left: 33, top: 44, width: 10, height: 10 });
    expect(result).toEqual({ x: 33, y: 44, snapLines: [] });
  });

  it("returns unchanged when the element id is unknown", () => {
    const composer = makeComposer(["sib-1"]);
    const { calculateSnapping } = renderSnapping(composer);
    const result = calculateSnapping("missing", { left: 33, top: 44, width: 10, height: 10 });
    expect(result).toEqual({ x: 33, y: 44, snapLines: [] });
  });

  it("returns unchanged when the element has no parent", () => {
    const composer = {
      elements: {
        getElement: vi.fn(() => ({ getId: () => DRAG_ID, getParent: () => null })),
      },
    } as unknown as Composer;
    const { calculateSnapping } = renderSnapping(composer);
    const result = calculateSnapping(DRAG_ID, { left: 33, top: 44, width: 10, height: 10 });
    expect(result).toEqual({ x: 33, y: 44, snapLines: [] });
  });

  it("ignores siblings that have no DOM node", () => {
    const composer = makeComposer(["sib-not-in-dom"]);
    const { calculateSnapping } = renderSnapping(composer);
    const result = calculateSnapping(DRAG_ID, { left: 101, top: 101, width: 50, height: 50 });
    expect(result).toEqual({ x: 101, y: 101, snapLines: [] });
  });
});

// ---------------------------------------------------------------------------
// Threshold math
// ---------------------------------------------------------------------------

describe("useCanvasSnapping — threshold math (SNAP_THRESHOLD=5, strict <)", () => {
  // Sibling occupies (100,100) 50x50 → V edges/center at 100/125/150,
  // H edges/center at 100/125/150 (canvas at origin so client == canvas space).
  const SIBLING = { left: 100, top: 100, width: 50, height: 50 };

  function setup() {
    addSiblingDom("sib-1", SIBLING);
    const composer = makeComposer(["sib-1"]);
    return renderSnapping(composer);
  }

  it("snaps X to the sibling's left edge when within threshold (3px off)", () => {
    const { calculateSnapping } = setup();
    // dragging left=103 → 3px from sibling left edge 100; far away in Y
    const result = calculateSnapping(DRAG_ID, { left: 103, top: 300, width: 50, height: 50 });
    expect(result.x).toBe(100);
    expect(result.y).toBe(300); // untouched — no Y candidate in range
  });

  it("does NOT snap at exactly the threshold distance (5px, strict <)", () => {
    const { calculateSnapping } = setup();
    const result = calculateSnapping(DRAG_ID, { left: 105, top: 300, width: 50, height: 50 });
    expect(result.x).toBe(105);
    expect(result.snapLines).toEqual([]);
  });

  it("does NOT snap just outside the threshold (6px off) at scale 1", () => {
    const { calculateSnapping } = setup();
    const result = calculateSnapping(DRAG_ID, { left: 106, top: 300, width: 50, height: 50 });
    expect(result.x).toBe(106);
    expect(result.snapLines).toEqual([]);
  });

  it("threshold scales with zoom: 6px off snaps at scale 0.5 (threshold 10)", () => {
    const { calculateSnapping } = setup();
    const result = calculateSnapping(DRAG_ID, { left: 106, top: 300, width: 50, height: 50 }, 0.5);
    expect(result.x).toBe(100);
  });

  it("threshold tightens when zoomed in: 3px off does NOT snap at scale 2 (threshold 2.5)", () => {
    const { calculateSnapping } = setup();
    const result = calculateSnapping(DRAG_ID, { left: 103, top: 300, width: 50, height: 50 }, 2);
    expect(result.x).toBe(103);
  });

  it("applies a +2 correction when 2px shy of alignment (edge AND center agree)", () => {
    const { calculateSnapping } = setup();
    // left=98 width=50 → left edge is 2px from sibling left (100) and center
    // (123) is 2px from sibling center (125); both imply the same +2 correction
    const result = calculateSnapping(DRAG_ID, { left: 98, top: 300, width: 50, height: 50 });
    expect(result.x).toBe(100);
  });

  it("snaps Y to the sibling's top edge and emits a horizontal snap line", () => {
    const { calculateSnapping } = setup();
    const result = calculateSnapping(DRAG_ID, { left: 300, top: 102, width: 50, height: 50 });
    expect(result.y).toBe(100);
    expect(result.x).toBe(300);
    const horizontal = result.snapLines.filter((l) => l.orientation === "horizontal");
    expect(horizontal.length).toBeGreaterThan(0);
    expect(horizontal[0].position).toBe(100);
  });

  it("returns the winning vertical snap line with span geometry", () => {
    const { calculateSnapping } = setup();
    const result = calculateSnapping(DRAG_ID, { left: 103, top: 200, width: 50, height: 50 });
    expect(result.snapLines).toEqual([
      {
        orientation: "vertical",
        position: 100,
        start: 100, // min(dragTop 200, siblingTop 100)
        end: 250, // max(dragBottom 250, siblingBottom 150)
      },
    ]);
  });

  it("snaps X and Y independently in the same call", () => {
    const { calculateSnapping } = setup();
    const result = calculateSnapping(DRAG_ID, { left: 103, top: 148, width: 50, height: 50 });
    expect(result.x).toBe(100); // left edge → sibling left (3px)
    expect(result.y).toBe(150); // top edge → sibling bottom 150 (2px)
  });

  it("picks the CLOSEST candidate when multiple edges are in range", () => {
    addSiblingDom("sib-1", SIBLING);
    // Second sibling with left edge at 104 — dragging left=103 is 1px from it
    // but 3px from sib-1's 100. The closer one must win.
    addSiblingDom("sib-2", { left: 104, top: 400, width: 50, height: 50 });
    const composer = makeComposer(["sib-1", "sib-2"]);
    const { calculateSnapping } = renderSnapping(composer);

    const result = calculateSnapping(DRAG_ID, { left: 103, top: 300, width: 50, height: 50 });
    expect(result.x).toBe(104);
  });

  it("converts sibling rects into canvas-relative space (offset canvas)", () => {
    // Canvas shifted to client (200,50). Sibling at client (300,150) →
    // canvas-relative (100,100). draggingRect is canvas-relative per the
    // useCanvasDragDrop contract, so left=103 must still snap to 100.
    stubRect(canvasEl, { left: 200, top: 50, width: 800, height: 600 });
    addSiblingDom("sib-1", { left: 300, top: 150, width: 50, height: 50 });
    const composer = makeComposer(["sib-1"]);
    const { calculateSnapping } = renderSnapping(composer);

    const result = calculateSnapping(DRAG_ID, { left: 103, top: 300, width: 50, height: 50 });
    expect(result.x).toBe(100);
  });
});
