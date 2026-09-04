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

/** Composer whose parent has an id — needed for the parent-padding indicator,
 *  which resolves the parent's own DOM node. */
function makeComposerWithParent(parentId: string, siblingIds: string[]): Composer {
  const children = [DRAG_ID, ...siblingIds].map((id) => ({ getId: () => id }));
  const parent = { getId: () => parentId, getChildren: () => children };
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

// ---------------------------------------------------------------------------
// Board 815:4608 — spacing indicators (scenarios 3 & 4)
// ---------------------------------------------------------------------------

describe("useCanvasSnapping — equal spacing indicator (board 815:4608, scenario 3)", () => {
  it("draws a red equal-gap line on each side once dragging equalises them", () => {
    // Sibling A occupies 0-50; sibling B occupies 220-270. Dragging the
    // element to left=110 (occupying 110-160) puts 60px on both sides.
    addSiblingDom("sib-a", { left: 0, top: 100, width: 50, height: 50 });
    addSiblingDom("sib-b", { left: 220, top: 100, width: 50, height: 50 });
    const composer = makeComposer(["sib-a", "sib-b"]);
    const { calculateSnapping } = renderSnapping(composer);

    const result = calculateSnapping(DRAG_ID, { left: 110, top: 100, width: 50, height: 50 });
    const gaps = result.snapLines.filter((l) => l.kind === "equal-gap");
    expect(gaps).toHaveLength(2);
    for (const gap of gaps) {
      expect(gap.orientation).toBe("horizontal");
      expect(gap.value).toBe(60);
    }
  });

  it("stays silent when the gaps do not agree", () => {
    addSiblingDom("sib-a", { left: 0, top: 100, width: 50, height: 50 });
    // Far enough that the second gap (300-160=140) does not match the first (60).
    addSiblingDom("sib-b", { left: 300, top: 100, width: 50, height: 50 });
    const composer = makeComposer(["sib-a", "sib-b"]);
    const { calculateSnapping } = renderSnapping(composer);

    const result = calculateSnapping(DRAG_ID, { left: 110, top: 100, width: 50, height: 50 });
    expect(result.snapLines.filter((l) => l.kind === "equal-gap")).toEqual([]);
  });

  it("needs at least 3 elements on the axis — one sibling alone never qualifies", () => {
    addSiblingDom("sib-a", { left: 0, top: 100, width: 50, height: 50 });
    const composer = makeComposer(["sib-a"]);
    const { calculateSnapping } = renderSnapping(composer);

    const result = calculateSnapping(DRAG_ID, { left: 110, top: 300, width: 50, height: 50 });
    expect(result.snapLines.filter((l) => l.kind === "equal-gap")).toEqual([]);
  });
});

describe("useCanvasSnapping — parent padding indicator (board 815:4608, scenario 4)", () => {
  function addParentDom(id: string, r: { left: number; top: number; width: number; height: number }) {
    const el = document.createElement("div");
    el.setAttribute("data-buildrick-id", id);
    stubRect(el, r);
    canvasEl.appendChild(el);
    return el;
  }

  it("draws a red padding line when the drop distance matches a sibling's existing padding", () => {
    addParentDom("parent-1", { left: 50, top: 0, width: 400, height: 300 });
    // sib-1 already sits 150px off the parent's left edge (200 - 50).
    addSiblingDom("sib-1", { left: 200, top: 100, width: 50, height: 50 });
    const composer = makeComposerWithParent("parent-1", ["sib-1"]);
    const { calculateSnapping } = renderSnapping(composer);

    // Same 150px left offset as sib-1, but wider (80 vs 50) and lower so its
    // right/top/bottom distances land nowhere near sib-1's — only the left
    // edge this test is about should match.
    const result = calculateSnapping(DRAG_ID, { left: 200, top: 250, width: 80, height: 50 });
    const padding = result.snapLines.filter((l) => l.kind === "parent-padding");
    expect(padding).toHaveLength(1);
    expect(padding[0]).toMatchObject({ orientation: "horizontal", kind: "parent-padding", value: 150 });
  });

  it("stays silent when no sibling shares that distance from the parent edge", () => {
    addParentDom("parent-1", { left: 50, top: 0, width: 400, height: 300 });
    addSiblingDom("sib-1", { left: 200, top: 100, width: 50, height: 50 }); // 150px padding
    const composer = makeComposerWithParent("parent-1", ["sib-1"]);
    const { calculateSnapping } = renderSnapping(composer);

    // 90px off the left edge — nowhere near sib-1's 150px.
    const result = calculateSnapping(DRAG_ID, { left: 140, top: 250, width: 50, height: 50 });
    expect(result.snapLines.filter((l) => l.kind === "parent-padding")).toEqual([]);
  });

  it("does nothing when the element's parent has no DOM node of its own", () => {
    // makeComposer's parent carries no getId() — the existing 15-test suite
    // above already exercises this path; asserted explicitly here because
    // it is the guard the padding indicator depends on.
    addSiblingDom("sib-1", { left: 200, top: 100, width: 50, height: 50 });
    const composer = makeComposer(["sib-1"]);
    const { calculateSnapping } = renderSnapping(composer);

    const result = calculateSnapping(DRAG_ID, { left: 200, top: 250, width: 50, height: 50 });
    expect(result.snapLines.filter((l) => l.kind === "parent-padding")).toEqual([]);
  });
});
