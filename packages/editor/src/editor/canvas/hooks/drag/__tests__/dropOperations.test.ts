/**
 * Drop Operations — Phase D / E-007 prep stage 2.
 *
 * Comprehensive coverage for the 5 exported handlers in dropOperations.tsx
 * (~460 LOC). External utilities are mocked so each test is hermetic
 * against blockRegistry / nesting-rules / DOM-walking helpers; the
 * composer is a typed stub returning whatever the test needs.
 *
 * Coverage gate: Phase D D1 split requires ≥70% on dropOperations.tsx +
 * useCanvasDragDrop.ts. This file targets the dropOperations half.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// MOCK EXTERNAL UTILITIES
// ---------------------------------------------------------------------------

vi.mock("../../../../../blocks/blockRegistry", () => ({
  getBlockById: vi.fn(),
  insertBlock: vi.fn(),
}));

vi.mock("../../../../../shared/utils/nesting", () => ({
  canNestElement: vi.fn(() => true),
}));

vi.mock("../../../../../shared/utils/dragDrop", () => ({
  findDropTargetElement: vi.fn(() => null),
  getElementId: vi.fn((el: HTMLElement | null) =>
    el?.getAttribute?.("data-buildrick-id") ?? null,
  ),
  findValidDOMTarget: vi.fn((el: HTMLElement | null) => el),
  findValidDropTargetWithFallback: vi.fn(() => ({
    success: false,
    result: null,
  })),
}));

vi.mock("../../../../../shared/utils/dragDrop/animations", () => ({
  animateDropSuccess: vi.fn(),
}));

vi.mock("../../../../../shared/utils/devLogger", () => ({
  devError: vi.fn(),
  devLog: vi.fn(),
  devWarn: vi.fn(),
}));

import { getBlockById, insertBlock } from "../../../../../blocks/blockRegistry";
import { canNestElement } from "../../../../../shared/utils/nesting";
import {
  findDropTargetElement,
  findValidDropTargetWithFallback,
} from "../../../../../shared/utils/dragDrop";

// Now safe to import the SUT — its imports resolve through the mocks above.
import {
  handleBlockDrop,
  handleComponentDrop,
  handleElementDrop,
  handleMultiElementDrop,
  handleTemplateDrop,
  type DropContext,
} from "../dropOperations";

// =============================================================================
// FIXTURE HELPERS
// =============================================================================

interface StubElement {
  getId: () => string;
  getType: () => string;
  getParent: () => StubElement | null;
  getChildren: () => StubElement[];
  getDescendants: () => StubElement[];
  getClasses?: () => string[];
  getContent?: () => string;
  setContent?: (s: string) => void;
}

function makeStubElement(overrides: Partial<StubElement> & { id: string }): StubElement {
  const base: StubElement = {
    getId: () => overrides.id,
    getType: () => "container",
    getParent: () => null,
    getChildren: () => [],
    getDescendants: () => [],
    getClasses: () => [],
    getContent: () => "",
    setContent: vi.fn(),
  };
  return { ...base, ...overrides };
}

interface StubComposer {
  elements: {
    getActivePage: ReturnType<typeof vi.fn>;
    createPage: ReturnType<typeof vi.fn>;
    getElement: ReturnType<typeof vi.fn>;
    moveElement: ReturnType<typeof vi.fn>;
    insertHTMLToElement: ReturnType<typeof vi.fn>;
  };
  selection: {
    select: ReturnType<typeof vi.fn>;
    reselect: ReturnType<typeof vi.fn>;
  };
  components?: {
    instantiateComponent: ReturnType<typeof vi.fn>;
  };
  beginTransaction: ReturnType<typeof vi.fn>;
  endTransaction: ReturnType<typeof vi.fn>;
  rollbackTransaction: ReturnType<typeof vi.fn>;
}

function makeStubComposer(opts: {
  activePage?: { id: string; root: { id: string } } | null;
  elements?: Map<string, StubElement>;
  hasComponents?: boolean;
} = {}): StubComposer {
  const activePage = opts.activePage === undefined
    ? { id: "p1", root: { id: "r1" } }
    : opts.activePage;
  const elements = opts.elements ?? new Map();

  const c: StubComposer = {
    elements: {
      getActivePage: vi.fn(() => activePage),
      createPage: vi.fn(() => ({ id: "p1", root: { id: "r1" } })),
      getElement: vi.fn((id: string) => elements.get(id) ?? null),
      moveElement: vi.fn(),
      insertHTMLToElement: vi.fn(() => []),
    },
    selection: {
      select: vi.fn(),
      reselect: vi.fn(),
    },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
  };
  if (opts.hasComponents) {
    c.components = { instantiateComponent: vi.fn().mockResolvedValue(undefined) };
  }
  return c;
}

function makeCanvasRef(): React.RefObject<HTMLDivElement | null> {
  const div = document.createElement("div");
  div.querySelector = vi.fn(() => null) as any;
  return { current: div as HTMLDivElement };
}

function makeDragEvent(
  payloads: Record<string, string> = {},
  target: HTMLElement | null = null,
): React.DragEvent {
  return {
    dataTransfer: {
      getData: (type: string) => payloads[type] ?? "",
      types: Object.keys(payloads),
    },
    target: target ?? document.createElement("div"),
    clientX: 0,
    clientY: 0,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.DragEvent;
}

function makeDropContext(
  composer: StubComposer,
  overrides: Partial<DropContext> = {},
): DropContext {
  return {
    composer: composer as unknown as DropContext["composer"],
    canvasRef: makeCanvasRef(),
    freshTargetId: null,
    freshDropPosition: "inside",
    onDropError: vi.fn(),
    onDropSuccess: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset default mock return values that tests may have overridden.
  vi.mocked(canNestElement).mockReturnValue(true);
  vi.mocked(findValidDropTargetWithFallback).mockReturnValue({
    success: false,
    result: undefined,
    elementsChecked: 0,
  });
  vi.mocked(findDropTargetElement).mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
});

// =============================================================================
// handleBlockDrop
// =============================================================================

describe("handleBlockDrop", () => {
  it("returns false when dataTransfer has no block payload", () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({});

    const handled = handleBlockDrop(e, ctx);

    expect(handled).toBe(false);
    expect(ctx.onDropError).not.toHaveBeenCalled();
    expect(ctx.onDropSuccess).not.toHaveBeenCalled();
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns true + INVALID_DATA when block id is unknown", () => {
    vi.mocked(getBlockById).mockReturnValue(undefined);
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ block: JSON.stringify({ id: "no-such-block" }) });

    const handled = handleBlockDrop(e, ctx);

    expect(handled).toBe(true);
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "INVALID_DATA",
      message: expect.stringContaining("no-such-block"),
    });
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns true + INVALID_DATA when block has no elementType", () => {
    vi.mocked(getBlockById).mockReturnValue({
      id: "x",
      label: "X",
      elementType: undefined,
    } as any);
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ block: JSON.stringify({ id: "x" }) });

    const handled = handleBlockDrop(e, ctx);

    expect(handled).toBe(true);
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "INVALID_DATA",
      message: expect.stringContaining("no element type"),
    });
  });

  it("returns true + INVALID_DATA when block JSON is malformed", () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ block: "{not valid json" });

    const handled = handleBlockDrop(e, ctx);

    expect(handled).toBe(true);
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "INVALID_DATA",
      message: "Invalid block data",
    });
  });

  it("creates a page when none exists (default fallback path)", () => {
    vi.mocked(getBlockById).mockReturnValue({
      id: "container",
      label: "Container",
      elementType: "container",
    } as any);
    const root = makeStubElement({ id: "r1", getType: () => "container" });
    const composer = makeStubComposer({
      activePage: null,
      elements: new Map([["r1", root]]),
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ block: JSON.stringify({ id: "container" }) });

    handleBlockDrop(e, ctx);

    expect(composer.elements.createPage).toHaveBeenCalledWith("Page 1");
  });

  it("returns true + NO_VALID_TARGET when page root cannot be resolved", () => {
    vi.mocked(getBlockById).mockReturnValue({
      id: "container",
      label: "Container",
      elementType: "container",
    } as any);
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map(), // r1 not registered → getElement("r1") returns null
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ block: JSON.stringify({ id: "container" }) });

    const handled = handleBlockDrop(e, ctx);

    expect(handled).toBe(true);
    expect(composer.rollbackTransaction).toHaveBeenCalled();
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "NO_VALID_TARGET",
      message: "Page root element not found",
    });
  });

  it("returns true + NESTING_FORBIDDEN when nesting rules reject the parent", () => {
    vi.mocked(getBlockById).mockReturnValue({
      id: "x",
      label: "X-block",
      elementType: "image",
    } as any);
    vi.mocked(canNestElement).mockReturnValue(false);

    const root = makeStubElement({ id: "r1", getType: () => "container" });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["r1", root]]),
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ block: JSON.stringify({ id: "x" }) });

    const handled = handleBlockDrop(e, ctx);

    expect(handled).toBe(true);
    expect(composer.rollbackTransaction).toHaveBeenCalled();
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "NESTING_FORBIDDEN",
      message: expect.stringContaining("Cannot place X-block inside container"),
    });
  });

  it("happy path: inserts block under page root, fires onDropSuccess + selects new element", () => {
    vi.useFakeTimers();
    vi.mocked(getBlockById).mockReturnValue({
      id: "container",
      label: "Container",
      elementType: "container",
    } as any);
    vi.mocked(insertBlock).mockReturnValue("new-element-id");
    vi.mocked(canNestElement).mockReturnValue(true);

    const root = makeStubElement({ id: "r1", getType: () => "container" });
    const newEl = makeStubElement({ id: "new-element-id" });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["r1", root], ["new-element-id", newEl]]),
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ block: JSON.stringify({ id: "container" }) });

    const handled = handleBlockDrop(e, ctx);

    expect(handled).toBe(true);
    expect(composer.beginTransaction).toHaveBeenCalledWith("insert-block-drop");
    expect(insertBlock).toHaveBeenCalled();
    expect(composer.endTransaction).toHaveBeenCalled();

    // setTimeout(0) for the auto-select / animation / toast; flush it.
    vi.runAllTimers();

    expect(composer.selection.select).toHaveBeenCalledWith(newEl);
    expect(ctx.onDropSuccess).toHaveBeenCalledWith({
      elementLabel: "Container",
      elementType: "container",
    });
  });

  it("inserts under resolved parent when findValidDropTargetWithFallback succeeds", () => {
    vi.useFakeTimers();
    vi.mocked(getBlockById).mockReturnValue({
      id: "container",
      label: "Container",
      elementType: "container",
    } as any);
    vi.mocked(canNestElement).mockReturnValue(true);
    vi.mocked(insertBlock).mockReturnValue("new-element-id");

    const root = makeStubElement({ id: "r1" });
    const resolvedParent = makeStubElement({
      id: "p2",
      getType: () => "container",
    });
    const newEl = makeStubElement({ id: "new-element-id" });

    vi.mocked(findValidDropTargetWithFallback).mockReturnValue({
      success: true,
      result: { parent: resolvedParent as any, index: 3, position: "inside" },
      elementsChecked: 1,
    });

    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([
        ["r1", root],
        ["p2", resolvedParent],
        ["new-element-id", newEl],
      ]),
    });
    const ctx = makeDropContext(composer, { freshTargetId: "p2" });
    const e = makeDragEvent({ block: JSON.stringify({ id: "container" }) });

    handleBlockDrop(e, ctx);

    expect(insertBlock).toHaveBeenCalledWith(
      composer,
      expect.objectContaining({ id: "container" }),
      "p2", // resolved parent id, not r1
      3, // resolved index
    );
  });

  it("clears column placeholder text when parent is a 'col' with default content", () => {
    vi.mocked(getBlockById).mockReturnValue({
      id: "x",
      label: "X",
      elementType: "container",
    } as any);
    vi.mocked(canNestElement).mockReturnValue(true);
    vi.mocked(insertBlock).mockReturnValue("new-id");

    const setContentSpy = vi.fn();
    const colParent = makeStubElement({
      id: "col1",
      getType: () => "container",
      getClasses: () => ["col"],
      getContent: () => "Column 2",
      setContent: setContentSpy,
    });
    const root = makeStubElement({ id: "r1" });
    const newEl = makeStubElement({ id: "new-id" });

    vi.mocked(findValidDropTargetWithFallback).mockReturnValue({
      success: true,
      result: { parent: colParent as any, index: 0, position: "inside" },
      elementsChecked: 1,
    });

    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["r1", root], ["col1", colParent], ["new-id", newEl]]),
    });
    const ctx = makeDropContext(composer, { freshTargetId: "col1" });
    const e = makeDragEvent({ block: JSON.stringify({ id: "x" }) });

    handleBlockDrop(e, ctx);

    expect(setContentSpy).toHaveBeenCalledWith("");
  });

  it("rolls back transaction on insertBlock exception", () => {
    vi.mocked(getBlockById).mockReturnValue({
      id: "container",
      label: "Container",
      elementType: "container",
    } as any);
    vi.mocked(canNestElement).mockReturnValue(true);
    vi.mocked(insertBlock).mockImplementation(() => {
      throw new Error("insert kaboom");
    });

    const root = makeStubElement({ id: "r1", getType: () => "container" });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["r1", root]]),
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ block: JSON.stringify({ id: "container" }) });

    handleBlockDrop(e, ctx);

    expect(composer.rollbackTransaction).toHaveBeenCalled();
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "INSERT_FAILED",
      message: "Failed to add element to canvas",
    });
  });
});

// =============================================================================
// handleMultiElementDrop
// =============================================================================

describe("handleMultiElementDrop", () => {
  const MIME = "application/x-aquibra-multi";

  it("returns false when no application/x-aquibra-multi payload", () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({});

    expect(handleMultiElementDrop(e, ctx)).toBe(false);
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns false when payload elements array is empty/missing", () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ [MIME]: JSON.stringify({ elements: [] }) });

    expect(handleMultiElementDrop(e, ctx)).toBe(false);
  });

  it("returns true + INVALID_DATA when no elements pass the elementId filter", () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({
      [MIME]: JSON.stringify({ elements: [{ noId: true }, { elementId: "" }] }),
    });

    expect(handleMultiElementDrop(e, ctx)).toBe(true);
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "INVALID_DATA",
      message: "No valid elements to drop",
    });
  });

  it("returns true + NO_VALID_TARGET when no active page", () => {
    const composer = makeStubComposer({ activePage: null });
    // Override createPage so getActivePage()||createPage chain returns no root
    composer.elements.createPage = vi.fn(() => null) as any;
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({
      [MIME]: JSON.stringify({ elements: [{ elementId: "el1" }] }),
    });

    expect(handleMultiElementDrop(e, ctx)).toBe(true);
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "NO_VALID_TARGET",
      message: "No active page to drop into",
    });
  });

  it("happy path: moves all valid elements to the resolved parent", () => {
    vi.useFakeTimers();
    const root = makeStubElement({
      id: "r1",
      getChildren: () => [],
    });
    const movingEl = makeStubElement({
      id: "el1",
      getParent: () => null,
    });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["r1", root], ["el1", movingEl]]),
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({
      [MIME]: JSON.stringify({
        elements: [{ elementId: "el1", originalIndex: 0 }],
      }),
    });

    handleMultiElementDrop(e, ctx);

    expect(composer.beginTransaction).toHaveBeenCalledWith("multi-element-move");
    expect(composer.elements.moveElement).toHaveBeenCalledWith(
      "el1",
      "r1",
      expect.any(Number),
    );
    expect(composer.endTransaction).toHaveBeenCalled();

    vi.runAllTimers();
    expect(composer.selection.reselect).toHaveBeenCalled();
  });

  it("rolls back + MOVE_FAILED when moveElement throws inside multi-move loop", () => {
    const root = makeStubElement({
      id: "r1",
      getChildren: () => [],
    });
    const movingEl = makeStubElement({ id: "el1", getParent: () => null });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["r1", root], ["el1", movingEl]]),
    });
    composer.elements.moveElement = vi.fn(() => {
      throw new Error("move kaboom");
    }) as any;
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({
      "application/x-aquibra-multi": JSON.stringify({
        elements: [{ elementId: "el1", originalIndex: 0 }],
      }),
    });

    handleMultiElementDrop(e, ctx);

    expect(composer.rollbackTransaction).toHaveBeenCalled();
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "MOVE_FAILED",
      message: "Failed to move elements",
    });
  });
});

// =============================================================================
// handleElementDrop
// =============================================================================

describe("handleElementDrop", () => {
  it("returns false when no element payload", () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({});

    expect(handleElementDrop(e, ctx, null)).toBe(false);
  });

  it("returns false when payload has no elementId", () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ element: JSON.stringify({}) });

    expect(handleElementDrop(e, ctx, null)).toBe(false);
  });

  it("returns false when source element does not exist", () => {
    const composer = makeStubComposer({ elements: new Map() });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ element: JSON.stringify({ elementId: "nope" }) });

    expect(handleElementDrop(e, ctx, null)).toBe(false);
  });

  it("happy path: moves source element to resolved new parent", () => {
    vi.useFakeTimers();
    const sourceEl = makeStubElement({ id: "el1", getType: () => "text" });
    const newParent = makeStubElement({ id: "p2" });
    const root = makeStubElement({ id: "r1" });

    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["el1", sourceEl], ["p2", newParent], ["r1", root]]),
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ element: JSON.stringify({ elementId: "el1" }) });

    const targetDom = document.createElement("div");
    targetDom.setAttribute("data-buildrick-id", "p2");
    vi.mocked(findDropTargetElement).mockReturnValue(targetDom);
    vi.mocked(findValidDropTargetWithFallback).mockReturnValue({
      success: true,
      result: { parent: newParent as any, index: 5, position: "inside" },
      elementsChecked: 1,
    });

    expect(handleElementDrop(e, ctx, null)).toBe(true);
    expect(composer.beginTransaction).toHaveBeenCalledWith("move-element");
    expect(composer.elements.moveElement).toHaveBeenCalledWith("el1", "p2", expect.any(Number));
    expect(composer.endTransaction).toHaveBeenCalled();

    vi.runAllTimers();
    expect(composer.selection.reselect).toHaveBeenCalled();
  });

  /* The happy-path test above asserts `expect.any(Number)`, which is green over
     any index at all. This one replays ElementCRUD.moveElement's same-parent
     rule — the index is a slot in the list BEFORE the element is pulled out,
     and a slot that sits after the element is decremented — and asserts the
     ORDER that comes out. With calculateFinalIndex also subtracting, a drop
     below a later sibling landed one slot short (measured live). */
  it("a same-parent drop below a later sibling lands where it was dropped", () => {
    vi.useFakeTimers();
    let order = ["el1", "b", "c", "d"];
    const parent = makeStubElement({
      id: "p2",
      getChildren: () => order.map((id) => makeStubElement({ id })),
    });
    const sourceEl = makeStubElement({
      id: "el1",
      getType: () => "text",
      getParent: () => parent,
    });
    const root = makeStubElement({ id: "r1" });

    const dEl = makeStubElement({ id: "d", getParent: () => parent });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["el1", sourceEl], ["p2", parent], ["r1", root], ["d", dEl]]),
    });
    composer.elements.moveElement.mockImplementation(
      (id: string, _parentId: string, index: number) => {
        const oldIndex = order.indexOf(id);
        let adjusted = index;
        if (oldIndex > -1 && oldIndex < adjusted) adjusted = Math.max(0, adjusted - 1);
        adjusted = Math.min(Math.max(adjusted, 0), order.length - 1);
        order = order.filter((x) => x !== id);
        order.splice(adjusted, 0, id);
        return true;
      },
    );
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ element: JSON.stringify({ elementId: "el1" }) });

    const targetDom = document.createElement("div");
    targetDom.setAttribute("data-buildrick-id", "d");
    vi.mocked(findDropTargetElement).mockReturnValue(targetDom);
    // "after d" in the CURRENT list [el1, b, c, d] — the slot findValidDropTarget
    // returns is siblingIndex + 1 = 4.
    vi.mocked(findValidDropTargetWithFallback).mockReturnValue({
      success: true,
      result: { parent: parent as any, index: 4, position: "after" },
      elementsChecked: 1,
    });

    expect(handleElementDrop(e, ctx, null)).toBe(true);
    expect(order.join(",")).toBe("b,c,d,el1");
    vi.runAllTimers();
  });

  it("returns true when resolved target id has no element record", () => {
    const sourceEl = makeStubElement({ id: "el1" });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["el1", sourceEl]]), // p2 is NOT registered
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ element: JSON.stringify({ elementId: "el1" }) });

    const target = document.createElement("div");
    target.setAttribute("data-buildrick-id", "p2");
    vi.mocked(findDropTargetElement).mockReturnValue(target);

    expect(handleElementDrop(e, ctx, null)).toBe(true);
    expect(composer.elements.moveElement).not.toHaveBeenCalled();
  });

  it("returns true when findValidDropTargetWithFallback fails", () => {
    const sourceEl = makeStubElement({ id: "el1", getType: () => "text" });
    const target = makeStubElement({ id: "p2" });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["el1", sourceEl], ["p2", target]]),
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ element: JSON.stringify({ elementId: "el1" }) });

    const dom = document.createElement("div");
    dom.setAttribute("data-buildrick-id", "p2");
    vi.mocked(findDropTargetElement).mockReturnValue(dom);
    vi.mocked(findValidDropTargetWithFallback).mockReturnValue({
      success: false,
      result: undefined,
      elementsChecked: 0,
    });

    expect(handleElementDrop(e, ctx, null)).toBe(true);
    expect(composer.elements.moveElement).not.toHaveBeenCalled();
  });

  it("rolls back + MOVE_FAILED when moveElement throws", () => {
    const sourceEl = makeStubElement({ id: "el1", getType: () => "text" });
    const newParent = makeStubElement({ id: "p2" });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["el1", sourceEl], ["p2", newParent]]),
    });
    composer.elements.moveElement = vi.fn(() => {
      throw new Error("move kaboom");
    }) as any;
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ element: JSON.stringify({ elementId: "el1" }) });

    const dom = document.createElement("div");
    dom.setAttribute("data-buildrick-id", "p2");
    vi.mocked(findDropTargetElement).mockReturnValue(dom);
    vi.mocked(findValidDropTargetWithFallback).mockReturnValue({
      success: true,
      result: { parent: newParent as any, index: 0, position: "inside" },
      elementsChecked: 1,
    });

    handleElementDrop(e, ctx, null);

    expect(composer.rollbackTransaction).toHaveBeenCalled();
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "MOVE_FAILED",
      message: "Failed to move element",
    });
  });

  it("returns true when source is the page root (cannot move root)", () => {
    const rootEl = makeStubElement({ id: "r1" });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["r1", rootEl]]),
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ element: JSON.stringify({ elementId: "r1" }) });

    expect(handleElementDrop(e, ctx, null)).toBe(true);
    expect(composer.elements.moveElement).not.toHaveBeenCalled();
  });

  it("returns true + skip when target id matches source (drop on self)", () => {
    const sourceEl = makeStubElement({ id: "el1" });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["el1", sourceEl]]),
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ element: JSON.stringify({ elementId: "el1" }) });

    // Mock findDropTargetElement to point at the same element.
    const selfDom = document.createElement("div");
    selfDom.setAttribute("data-buildrick-id", "el1");
    vi.mocked(findDropTargetElement).mockReturnValue(selfDom);

    expect(handleElementDrop(e, ctx, null)).toBe(true);
    expect(composer.elements.moveElement).not.toHaveBeenCalled();
  });
});

// =============================================================================
// handleComponentDrop
// =============================================================================

describe("handleComponentDrop", () => {
  const MIME = "application/x-aquibra-component";

  it("returns false when no component payload", async () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({});

    await expect(handleComponentDrop(e, ctx)).resolves.toBe(false);
  });

  it("returns false when composer.components is missing", async () => {
    const composer = makeStubComposer({ hasComponents: false });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ [MIME]: "comp-id" });

    await expect(handleComponentDrop(e, ctx)).resolves.toBe(false);
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("rolls back + INSERT_FAILED when instantiateComponent throws", async () => {
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      hasComponents: true,
    });
    composer.components!.instantiateComponent = vi.fn(() =>
      Promise.reject(new Error("comp kaboom")),
    );
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ "application/x-aquibra-component": "comp-id" });

    await handleComponentDrop(e, ctx);

    expect(composer.rollbackTransaction).toHaveBeenCalled();
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "INSERT_FAILED",
      message: "Failed to instantiate component",
    });
  });

  it("happy path: instantiates component under active page root", async () => {
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      hasComponents: true,
    });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ [MIME]: "comp-id" });

    await expect(handleComponentDrop(e, ctx)).resolves.toBe(true);
    expect(composer.beginTransaction).toHaveBeenCalledWith(
      "instantiate-component-drop",
    );
    expect(composer.components!.instantiateComponent).toHaveBeenCalledWith(
      "comp-id",
      "r1",
    );
    expect(composer.endTransaction).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Gap C — Frame 3 (insert animation) + Frame 4 (auto-select after drop)
  // ---------------------------------------------------------------------------

  describe("Gap C Frame 3 — insert animation", () => {
    it("sets data-just-added attribute on the new element node after component drop", async () => {
      const sentinelId = "new-comp-instance-1";
      const composer = makeStubComposer({
        activePage: { id: "p1", root: { id: "r1" } },
        hasComponents: true,
      });
      composer.components!.instantiateComponent = vi
        .fn()
        .mockResolvedValue(sentinelId);
      // Register the new element so selection lookup resolves.
      const newEl = makeStubElement({ id: sentinelId });
      composer.elements.getElement = vi.fn(
        (id: string) => (id === sentinelId ? newEl : null) as any,
      );

      // Mount the DOM node the drop animation must locate.
      const node = document.createElement("div");
      node.setAttribute("data-buildrick-id", sentinelId);
      document.body.appendChild(node);

      try {
        const ctx = makeDropContext(composer);
        const e = makeDragEvent({
          "application/x-aquibra-component": "comp-id",
        });

        await handleComponentDrop(e, ctx);

        // queueMicrotask resolves after the awaited promise settles. The
        // `await` above already flushed the await; we wait one more
        // microtask tick to make sure the post-drop queueMicrotask fires.
        await Promise.resolve();

        expect(node.getAttribute("data-just-added")).toBe("true");
      } finally {
        document.body.removeChild(node);
      }
    });
  });

  describe("Gap C Frame 4 — auto-select after drop", () => {
    it("calls composer.selection.select with the new element after instantiateComponent resolves", async () => {
      const sentinelId = "new-comp-instance-2";
      const newEl = makeStubElement({ id: sentinelId });
      const composer = makeStubComposer({
        activePage: { id: "p1", root: { id: "r1" } },
        hasComponents: true,
      });
      composer.components!.instantiateComponent = vi
        .fn()
        .mockResolvedValue(sentinelId);
      composer.elements.getElement = vi.fn(
        (id: string) => (id === sentinelId ? newEl : null) as any,
      );

      const ctx = makeDropContext(composer);
      const e = makeDragEvent({
        "application/x-aquibra-component": "comp-id",
      });

      await handleComponentDrop(e, ctx);

      expect(composer.selection.select).toHaveBeenCalledWith(newEl);
    });
  });
});

// =============================================================================
// handleTemplateDrop
// =============================================================================

describe("handleTemplateDrop", () => {
  const MIME = "application/aquibra-template";

  it("returns false when no template payload", () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({});

    expect(handleTemplateDrop(e, ctx)).toBe(false);
  });

  it("returns false when payload has no html field", () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ [MIME]: JSON.stringify({}) });

    expect(handleTemplateDrop(e, ctx)).toBe(false);
  });

  it("returns false when JSON is malformed", () => {
    const composer = makeStubComposer();
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({ [MIME]: "{not valid" });

    expect(handleTemplateDrop(e, ctx)).toBe(false);
  });

  it("happy path: inserts HTML under page root, fires animateDropSuccess on first element", async () => {
    vi.useFakeTimers();
    const newElement = makeStubElement({ id: "tpl-1" });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
    });
    composer.elements.insertHTMLToElement = vi.fn(() => [newElement]) as any;

    const ctx = makeDropContext(composer);
    const e = makeDragEvent({
      [MIME]: JSON.stringify({ html: "<div>hi</div>" }),
    });

    expect(handleTemplateDrop(e, ctx)).toBe(true);
    expect(composer.beginTransaction).toHaveBeenCalledWith("insert-template-drop");
    expect(composer.elements.insertHTMLToElement).toHaveBeenCalledWith(
      "r1",
      "<div>hi</div>",
      undefined,
    );
    expect(composer.endTransaction).toHaveBeenCalled();

    vi.runAllTimers();
    expect(composer.selection.select).toHaveBeenCalledWith(newElement);
  });

  it("inserts at parent + before-position when freshTargetId resolves with freshDropPosition='before'", () => {
    const targetEl = makeStubElement({
      id: "child2",
      getParent: () => parentEl,
    });
    const child1 = makeStubElement({ id: "child1" });
    const parentEl: any = makeStubElement({
      id: "parent1",
      getChildren: () => [child1, targetEl],
    });
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
      elements: new Map([["parent1", parentEl], ["child2", targetEl]]),
    });
    composer.elements.insertHTMLToElement = vi.fn(() => []) as any;

    const ctx = makeDropContext(composer, {
      freshTargetId: "child2",
      freshDropPosition: "before",
    });
    const e = makeDragEvent({
      "application/aquibra-template": JSON.stringify({ html: "<p/>" }),
    });

    expect(handleTemplateDrop(e, ctx)).toBe(true);
    expect(composer.elements.insertHTMLToElement).toHaveBeenCalledWith(
      "parent1",
      "<p/>",
      1, // index of child2 = 1, before-position = 1
    );
  });

  it("rolls back + INSERT_FAILED when insertHTMLToElement throws", () => {
    const composer = makeStubComposer({
      activePage: { id: "p1", root: { id: "r1" } },
    });
    composer.elements.insertHTMLToElement = vi.fn(() => {
      throw new Error("insert kaboom");
    }) as any;
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({
      "application/aquibra-template": JSON.stringify({ html: "<p/>" }),
    });

    expect(handleTemplateDrop(e, ctx)).toBe(true);
    expect(composer.rollbackTransaction).toHaveBeenCalled();
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "INSERT_FAILED",
      message: "Failed to insert template",
    });
  });

  it("rolls back + INSERT_FAILED when no active page", () => {
    const composer = makeStubComposer({ activePage: null });
    const ctx = makeDropContext(composer);
    const e = makeDragEvent({
      [MIME]: JSON.stringify({ html: "<div/>" }),
    });

    expect(handleTemplateDrop(e, ctx)).toBe(true);
    expect(composer.rollbackTransaction).toHaveBeenCalled();
    expect(ctx.onDropError).toHaveBeenCalledWith({
      type: "INSERT_FAILED",
      message: "Failed to insert template",
    });
  });
});
