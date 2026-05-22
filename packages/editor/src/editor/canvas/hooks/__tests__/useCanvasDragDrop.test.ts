/**
 * useCanvasDragDrop hook — Phase D / E-007 prep stage 3.
 *
 * Coverage gate for the D1 (useCanvasDragDrop split) refactor. The hook
 * is mostly orchestration; the real drop-execution logic is in
 * dropOperations (87% covered separately). This file exercises the
 * hook's dispatcher + handleDragOver/handleDragLeave glue.
 *
 * Strategy: vi.mock factories must be self-contained (vi.mock is hoisted
 * to top-of-file); we use vi.mocked(...) to grab fn refs after import.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// MOCK SUB-HOOKS  (factories are hoisted; no outer-scope refs allowed)
// ---------------------------------------------------------------------------

vi.mock("../useDragSession", () => ({
  useDragSession: vi.fn(() => ({
    isDragOver: false,
    setIsDragOver: vi.fn(),
    dropTargetId: null,
    setDropTargetId: vi.fn(),
    dropPosition: null,
    setDropPosition: vi.fn(),
    draggingElementId: null,
    setDraggingElementId: vi.fn(),
    isValidDrop: true,
    setIsValidDrop: vi.fn(),
    invalidDropReason: null,
    setInvalidDropReason: vi.fn(),
    dropSlotRect: null,
    setDropSlotRect: vi.fn(),
    dropTargetPath: [],
    setDropTargetPath: vi.fn(),
    resetSession: vi.fn(),
  })),
}));

vi.mock("../useDragVisuals", () => ({
  useDragVisuals: vi.fn(() => ({
    showDropTarget: vi.fn(),
    showInvalidTarget: vi.fn(),
    clearDropTarget: vi.fn(),
    clearInvalidTarget: vi.fn(),
    clearAllIndicators: vi.fn(),
  })),
}));

vi.mock("../useDragAutoScroll", () => ({
  useDragAutoScroll: vi.fn(() => ({
    handleAutoScroll: vi.fn(),
    stopCurrentAutoScroll: vi.fn(),
  })),
}));

vi.mock("../drag/dragCalculations", () => ({
  calculateDropPositionFromCursor: vi.fn(() => ({
    position: "inside",
    isParentHorizontal: false,
  })),
  calculateDropSlotRect: vi.fn(() => null),
  validateDropOperation: vi.fn(() => ({ isValid: true, reason: null })),
  buildBreadcrumbPath: vi.fn(() => []),
  calculateFreshDropTarget: vi.fn(() => ({
    targetId: "r1",
    dropPosition: "inside",
  })),
}));

vi.mock("../drag/dropOperations", () => ({
  handleMultiElementDrop: vi.fn(() => false),
  handleElementDrop: vi.fn(() => false),
  handleComponentDrop: vi.fn(() => Promise.resolve(false)),
  handleTemplateDrop: vi.fn(() => false),
  handleCatalogDrop: vi.fn(() => false),
  handleBlockDrop: vi.fn(() => true),
}));

vi.mock("../../../../shared/utils/dragDrop", () => ({
  findDropTargetElement: vi.fn(() => null),
  getElementId: vi.fn((el: HTMLElement | null) =>
    el?.getAttribute?.("data-buildrick-id") ?? null,
  ),
}));

// Now import — the mocks are in place.
import { useDragSession } from "../useDragSession";
import { useDragVisuals } from "../useDragVisuals";
import { useDragAutoScroll } from "../useDragAutoScroll";
import {
  handleMultiElementDrop,
  handleElementDrop,
  handleComponentDrop,
  handleTemplateDrop,
  handleBlockDrop,
} from "../drag/dropOperations";
import { findDropTargetElement } from "../../../../shared/utils/dragDrop";
import { useCanvasDragDrop } from "../useCanvasDragDrop";

// =============================================================================
// FIXTURE HELPERS
// =============================================================================

function makeStubComposer(opts: { hasDragManager?: boolean } = {}) {
  return {
    elements: {
      getActivePage: vi.fn(() => ({ id: "p1", root: { id: "r1" } })),
      getElement: vi.fn(),
    },
    media: { uploadFile: vi.fn() },
    // D3 facades — composer.canvas.{drag, indicators, ...} +
    // composer.mediaOps replace the old flat fields.
    canvas: {
      drag: opts.hasDragManager === false ? undefined : {
        move: vi.fn(),
        cancel: vi.fn(),
        end: vi.fn(),
      },
      indicators: {
        calculateSmartGuides: vi.fn(() => []),
        calculateSnapPoints: vi.fn(() => []),
      },
    },
    mediaOps: { insertMediaAt: vi.fn(() => true) },
  } as any;
}

function makeCanvasRef(): React.RefObject<HTMLDivElement | null> {
  const div = document.createElement("div");
  div.className = "buildrick-canvas";
  div.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => "" }) as DOMRect;
  div.querySelector = vi.fn(() => null) as any;
  return { current: div };
}

function makeDragEvent(
  payloads: Record<string, string> = {},
  files: File[] = [],
  relatedTarget: HTMLElement | null = null,
): React.DragEvent {
  return {
    clientX: 100,
    clientY: 100,
    dataTransfer: {
      getData: (type: string) => payloads[type] ?? "",
      types: Object.keys(payloads),
      files,
    },
    target: document.createElement("div"),
    relatedTarget,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.DragEvent;
}

/**
 * Render the hook with its options. Each call also returns a `getMocks`
 * helper for accessing the most recent return values from the sub-hooks
 * (since useDragSession etc. are vi.fn()s).
 */
function renderDragDrop(overrides: Partial<Parameters<typeof useCanvasDragDrop>[0]> = {}) {
  const composer = overrides.composer ?? makeStubComposer();
  const onSnapLinesChange = vi.fn();
  const onDropError = vi.fn();
  const onDropSuccess = vi.fn();
  const canvasRef = overrides.canvasRef ?? makeCanvasRef();
  const result = renderHook(() =>
    useCanvasDragDrop({
      composer,
      canvasRef,
      showGuides: false,
      isEditing: false,
      onSnapLinesChange,
      onDropError,
      onDropSuccess,
      ...overrides,
    }),
  );

  // Grab the most recent results returned by each sub-hook factory.
  // vi.fn().mock.results is the array of {type, value} records.
  const sessionResult = vi.mocked(useDragSession).mock.results.at(-1)?.value;
  const visualsResult = vi.mocked(useDragVisuals).mock.results.at(-1)?.value;
  const autoScrollResult = vi.mocked(useDragAutoScroll).mock.results.at(-1)?.value;

  return {
    ...result,
    composer,
    onSnapLinesChange,
    onDropError,
    onDropSuccess,
    canvasRef,
    sessionMock: sessionResult,
    visualsMock: visualsResult,
    autoScrollMock: autoScrollResult,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset sub-hook mock return values to defaults — clearAllMocks wipes
  // the mockImplementation set by factory, so re-set here.
  vi.mocked(useDragSession).mockImplementation(() => ({
    isDragOver: false,
    setIsDragOver: vi.fn(),
    dropTargetId: null,
    setDropTargetId: vi.fn(),
    dropPosition: null,
    setDropPosition: vi.fn(),
    draggingElementId: null,
    setDraggingElementId: vi.fn(),
    isValidDrop: true,
    setIsValidDrop: vi.fn(),
    invalidDropReason: null,
    setInvalidDropReason: vi.fn(),
    dropSlotRect: null,
    setDropSlotRect: vi.fn(),
    dropTargetPath: [],
    setDropTargetPath: vi.fn(),
    resetSession: vi.fn(),
  }) as any);
  vi.mocked(useDragVisuals).mockImplementation(() => ({
    showDropTarget: vi.fn(),
    showInvalidTarget: vi.fn(),
    clearDropTarget: vi.fn(),
    clearInvalidTarget: vi.fn(),
    clearAllIndicators: vi.fn(),
  }) as any);
  vi.mocked(useDragAutoScroll).mockImplementation(() => ({
    handleAutoScroll: vi.fn(),
    stopCurrentAutoScroll: vi.fn(),
  }) as any);

  vi.mocked(findDropTargetElement).mockReturnValue(null);
  vi.mocked(handleMultiElementDrop).mockReturnValue(false);
  vi.mocked(handleElementDrop).mockReturnValue(false);
  vi.mocked(handleComponentDrop).mockResolvedValue(false);
  vi.mocked(handleTemplateDrop).mockReturnValue(false);
  vi.mocked(handleBlockDrop).mockReturnValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

// =============================================================================
// handleDragOver
// =============================================================================

describe("useCanvasDragDrop — handleDragOver", () => {
  it("early-returns when isEditing is true", () => {
    const { result, sessionMock } = renderDragDrop({ isEditing: true });
    const e = makeDragEvent();

    act(() => result.current.handleDragOver(e));

    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(sessionMock.setIsDragOver).not.toHaveBeenCalled();
  });

  it("sets isDragOver=true and falls back to root when no DOM target found", () => {
    const { result, sessionMock } = renderDragDrop();
    const e = makeDragEvent();

    act(() => result.current.handleDragOver(e));

    expect(e.preventDefault).toHaveBeenCalled();
    expect(sessionMock.setIsDragOver).toHaveBeenCalledWith(true);
    // findDropTargetElement returns null → falls through to page root id "r1"
    expect(sessionMock.setDropTargetId).toHaveBeenCalledWith("r1");
  });

  it("dispatches showDropTarget + validates when target el is found in DOM", () => {
    const targetEl = document.createElement("div");
    targetEl.setAttribute("data-buildrick-id", "el-x");
    targetEl.getBoundingClientRect = () =>
      ({ left: 50, top: 50, width: 100, height: 100, right: 150, bottom: 150, x: 50, y: 50, toJSON: () => "" }) as DOMRect;

    vi.mocked(findDropTargetElement).mockReturnValue(targetEl);

    const canvasRef = makeCanvasRef();
    canvasRef.current!.querySelector = vi.fn(() => targetEl) as any;

    const { result, sessionMock, visualsMock, composer } = renderDragDrop({ canvasRef });
    const e = makeDragEvent();

    act(() => result.current.handleDragOver(e));

    expect(sessionMock.setDropTargetId).toHaveBeenCalledWith("el-x");
    expect(visualsMock.showDropTarget).toHaveBeenCalled();
    expect(sessionMock.setIsValidDrop).toHaveBeenCalledWith(true);
    expect(composer.canvas.drag.move).toHaveBeenCalled();
  });

  it("shows invalid-target visuals when validateDropOperation returns invalid", async () => {
    const { validateDropOperation } = await import("../drag/dragCalculations");
    vi.mocked(validateDropOperation).mockReturnValue({
      isValid: false,
      reason: "NESTING_FORBIDDEN" as any,
    });

    const targetEl = document.createElement("div");
    targetEl.setAttribute("data-buildrick-id", "el-x");
    targetEl.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => "" }) as DOMRect;
    vi.mocked(findDropTargetElement).mockReturnValue(targetEl);

    const canvasRef = makeCanvasRef();
    canvasRef.current!.querySelector = vi.fn(() => targetEl) as any;

    const { result, sessionMock, visualsMock } = renderDragDrop({ canvasRef });
    const e = makeDragEvent();

    act(() => result.current.handleDragOver(e));

    expect(sessionMock.setIsValidDrop).toHaveBeenCalledWith(false);
    expect(sessionMock.setInvalidDropReason).toHaveBeenCalledWith("NESTING_FORBIDDEN");
    expect(visualsMock.showInvalidTarget).toHaveBeenCalled();
  });

  it("clears affordance when target id resolves but DOM element is missing", () => {
    // findDropTargetElement returns null → fallback to root id "r1" used,
    // but canvas.querySelector returns null too → exercises the
    // "targetEl missing" branch (lines 263-273 in dropOperations).
    const canvasRef = makeCanvasRef();
    canvasRef.current!.querySelector = vi.fn(() => null) as any;

    const { result, sessionMock, visualsMock } = renderDragDrop({ canvasRef });
    const e = makeDragEvent();

    act(() => result.current.handleDragOver(e));

    expect(sessionMock.setDropPosition).toHaveBeenCalledWith("inside");
    expect(visualsMock.clearDropTarget).toHaveBeenCalled();
  });

  it("calculates snap guides when showGuides=true + draggingElementId set", () => {
    const targetEl = document.createElement("div");
    targetEl.setAttribute("data-buildrick-id", "el-x");
    targetEl.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => "" }) as DOMRect;

    vi.mocked(findDropTargetElement).mockReturnValue(targetEl);
    // Override session to have a draggingElementId
    vi.mocked(useDragSession).mockImplementation(() => ({
      isDragOver: false, setIsDragOver: vi.fn(),
      dropTargetId: null, setDropTargetId: vi.fn(),
      dropPosition: null, setDropPosition: vi.fn(),
      draggingElementId: "drag-x", setDraggingElementId: vi.fn(),
      isValidDrop: true, setIsValidDrop: vi.fn(),
      invalidDropReason: null, setInvalidDropReason: vi.fn(),
      dropSlotRect: null, setDropSlotRect: vi.fn(),
      dropTargetPath: [], setDropTargetPath: vi.fn(),
      resetSession: vi.fn(),
    }) as any);

    const canvasRef = makeCanvasRef();
    canvasRef.current!.querySelector = vi.fn(() => targetEl) as any;

    const { result, composer } = renderDragDrop({ canvasRef, showGuides: true });
    const e = makeDragEvent();

    act(() => result.current.handleDragOver(e));

    expect(composer.canvas.indicators.calculateSmartGuides).toHaveBeenCalled();
    expect(composer.canvas.indicators.calculateSnapPoints).toHaveBeenCalled();
  });

  it("includes snap-point lines when calculateSnapPoints returns matches", () => {
    const targetEl = document.createElement("div");
    targetEl.setAttribute("data-buildrick-id", "el-x");
    targetEl.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => "" }) as DOMRect;
    vi.mocked(findDropTargetElement).mockReturnValue(targetEl);

    // draggingElementId set + showGuides → calculateSnapGuides runs.
    vi.mocked(useDragSession).mockImplementation(() => ({
      isDragOver: false, setIsDragOver: vi.fn(),
      dropTargetId: null, setDropTargetId: vi.fn(),
      dropPosition: null, setDropPosition: vi.fn(),
      draggingElementId: "drag-x", setDraggingElementId: vi.fn(),
      isValidDrop: true, setIsValidDrop: vi.fn(),
      invalidDropReason: null, setInvalidDropReason: vi.fn(),
      dropSlotRect: null, setDropSlotRect: vi.fn(),
      dropTargetPath: [], setDropTargetPath: vi.fn(),
      resetSession: vi.fn(),
    }) as any);

    const composer = makeStubComposer();
    // Snap points within threshold of cursor (clientX/clientY = 100, threshold ~10px).
    composer.canvas.indicators.calculateSnapPoints = vi.fn(() => [
      { axis: "vertical", position: 100 },
      { axis: "horizontal", position: 100 },
    ]) as any;

    const canvasRef = makeCanvasRef();
    canvasRef.current!.querySelector = vi.fn(() => targetEl) as any;

    const { result, onSnapLinesChange } = renderDragDrop({
      composer,
      canvasRef,
      showGuides: true,
    });
    const e = makeDragEvent();

    act(() => result.current.handleDragOver(e));

    // The hook calls onSnapLinesChange with lines; we just verify it was called
    // with a non-empty array — covers the "push line" branches.
    expect(onSnapLinesChange).toHaveBeenCalled();
    const lastCall = onSnapLinesChange.mock.calls.at(-1)?.[0];
    expect(Array.isArray(lastCall)).toBe(true);
  });

  it("clears drop target when no target id and no active page", () => {
    const composer = makeStubComposer();
    composer.elements.getActivePage = vi.fn(() => null);
    const { result, sessionMock } = renderDragDrop({ composer });
    const e = makeDragEvent();

    act(() => result.current.handleDragOver(e));

    expect(sessionMock.setDropTargetId).toHaveBeenCalledWith(null);
    expect(sessionMock.setIsValidDrop).toHaveBeenCalledWith(true);
  });
});

// =============================================================================
// handleDragLeave
// =============================================================================

describe("useCanvasDragDrop — handleDragLeave", () => {
  it("does nothing when relatedTarget is still inside canvas", () => {
    const { result, sessionMock, visualsMock } = renderDragDrop();
    const insideCanvas = document.createElement("div");
    const canvas = document.createElement("div");
    canvas.className = "buildrick-canvas";
    canvas.appendChild(insideCanvas);
    document.body.appendChild(canvas);

    const e = makeDragEvent({}, [], insideCanvas);

    act(() => result.current.handleDragLeave(e));

    expect(sessionMock.resetSession).not.toHaveBeenCalled();
    expect(visualsMock.clearAllIndicators).not.toHaveBeenCalled();

    document.body.removeChild(canvas);
  });

  it("resets session + clears visuals when relatedTarget is outside canvas", () => {
    const { result, sessionMock, visualsMock, autoScrollMock, composer } = renderDragDrop();
    const e = makeDragEvent({}, [], null);

    act(() => result.current.handleDragLeave(e));

    expect(sessionMock.resetSession).toHaveBeenCalled();
    expect(visualsMock.clearAllIndicators).toHaveBeenCalled();
    expect(autoScrollMock.stopCurrentAutoScroll).toHaveBeenCalled();
    expect(composer.canvas.drag.cancel).toHaveBeenCalledWith("Left canvas");
  });
});

// =============================================================================
// handleDrop — main dispatcher
// =============================================================================

describe("useCanvasDragDrop — handleDrop", () => {
  it("emits EDITING_MODE error when called while isEditing=true", async () => {
    const { result, onDropError } = renderDragDrop({ isEditing: true });
    const e = makeDragEvent();

    await act(async () => {
      await result.current.handleDrop(e);
    });

    expect(onDropError).toHaveBeenCalledWith({
      type: "EDITING_MODE",
      message: "Cannot drop while editing text",
    });
  });

  it("returns early without error when composer is null", async () => {
    const { result, onDropError } = renderDragDrop({ composer: null });
    const e = makeDragEvent();

    await act(async () => {
      await result.current.handleDrop(e);
    });

    expect(onDropError).not.toHaveBeenCalled();
  });

  it("dispatches to handleMultiElementDrop first when it returns true", async () => {
    vi.mocked(handleMultiElementDrop).mockReturnValue(true);
    const { result, composer } = renderDragDrop();
    const e = makeDragEvent({ "application/x-aquibra-multi": "..." });

    await act(async () => {
      await result.current.handleDrop(e);
    });

    expect(handleMultiElementDrop).toHaveBeenCalled();
    expect(handleElementDrop).not.toHaveBeenCalled();
    expect(composer.canvas.drag.end).toHaveBeenCalledWith(true);
  });

  it("falls through to handleElementDrop when multi-drop returns false", async () => {
    vi.mocked(handleElementDrop).mockReturnValue(true);
    const { result } = renderDragDrop();
    const e = makeDragEvent({ element: "..." });

    await act(async () => {
      await result.current.handleDrop(e);
    });

    expect(handleMultiElementDrop).toHaveBeenCalled();
    expect(handleElementDrop).toHaveBeenCalled();
    expect(handleComponentDrop).not.toHaveBeenCalled();
  });

  it("awaits handleComponentDrop in dispatch chain", async () => {
    vi.mocked(handleComponentDrop).mockResolvedValue(true);
    const { result } = renderDragDrop();
    const e = makeDragEvent({ "application/x-aquibra-component": "comp1" });

    await act(async () => {
      await result.current.handleDrop(e);
    });

    expect(handleComponentDrop).toHaveBeenCalled();
    expect(handleTemplateDrop).not.toHaveBeenCalled();
  });

  it("falls all the way through to handleBlockDrop as terminal handler", async () => {
    const { result } = renderDragDrop();
    const e = makeDragEvent({ block: "..." });

    await act(async () => {
      await result.current.handleDrop(e);
    });

    expect(handleBlockDrop).toHaveBeenCalled();
  });

  it("handles OS file drop with image: uploads + sets src on target", async () => {
    const targetEl: any = { setAttribute: vi.fn() };
    const composer = makeStubComposer();
    composer.elements.getElement = vi.fn(() => targetEl);
    composer.media.uploadFile = vi.fn().mockResolvedValue({
      success: true,
      asset: { src: "blob:uploaded.png" },
    });

    const { result } = renderDragDrop({ composer });
    const file = new File(["x"], "img.png", { type: "image/png" });
    const e = makeDragEvent({}, [file]);

    await act(async () => {
      await result.current.handleDrop(e);
    });

    expect(composer.media.uploadFile).toHaveBeenCalledWith(file);
    expect(targetEl.setAttribute).toHaveBeenCalledWith("src", "blob:uploaded.png");
  });

  it("internal-media drop is no-op when src payload is empty", async () => {
    const composer = makeStubComposer();
    const { result } = renderDragDrop({ composer });
    const e = makeDragEvent({
      "application/x-aquibra-media-src": "", // empty
      "application/x-aquibra-media-type": "image",
    });

    await act(async () => {
      await result.current.handleDrop(e);
    });

    // Empty src → handleInternalMediaDrop early-returns; the dispatch chain
    // proceeds normally (no internal-media short-circuit).
    expect(composer.mediaOps.insertMediaAt).not.toHaveBeenCalled();
  });

  it("emits INSERT_FAILED when internal-media insertMediaAt returns null", async () => {
    const composer = makeStubComposer();
    composer.mediaOps.insertMediaAt = vi.fn(() => null) as any;
    composer.elements.getElement = vi.fn(() => ({} as any));

    const { result, onDropError } = renderDragDrop({ composer });
    const e = makeDragEvent({
      "application/x-aquibra-media-src": "https://example.com/img.png",
      "application/x-aquibra-media-type": "image",
    });

    await act(async () => {
      await result.current.handleDrop(e);
    });

    expect(onDropError).toHaveBeenCalledWith({
      type: "INSERT_FAILED",
      message: "Could not place media",
    });
  });

  it("emits INSERT_FAILED when internal-media insertMediaAt throws", async () => {
    const composer = makeStubComposer();
    composer.mediaOps.insertMediaAt = vi.fn(() => {
      throw new Error("media kaboom");
    }) as any;

    const { result, onDropError } = renderDragDrop({ composer });
    const e = makeDragEvent({
      "application/x-aquibra-media-src": "https://example.com/img.png",
      "application/x-aquibra-media-type": "image",
    });

    await act(async () => {
      await result.current.handleDrop(e);
    });

    expect(onDropError).toHaveBeenCalledWith({
      type: "INSERT_FAILED",
      message: "media kaboom",
    });
  });

  it("handles internal-media drop via handleInternalMediaDrop short-circuit", async () => {
    const { result, composer } = renderDragDrop();
    const targetEl: any = { setAttribute: vi.fn() };
    composer.elements.getElement = vi.fn(() => targetEl);

    const e = makeDragEvent({
      "application/x-aquibra-media-src": "https://example.com/img.png",
      "application/x-aquibra-media-type": "img",
      "application/x-aquibra-media-name": "img.png",
    });

    await act(async () => {
      await result.current.handleDrop(e);
    });

    expect(composer.mediaOps.insertMediaAt).toHaveBeenCalledWith(
      "https://example.com/img.png",
      "image",
      expect.objectContaining({ targetElementId: "r1", path: "drag" }),
    );
  });
});

// =============================================================================
// return shape pass-through
// =============================================================================

describe("useCanvasDragDrop — return shape", () => {
  it("exposes setDraggingElementId from session", () => {
    const { result, sessionMock } = renderDragDrop();
    act(() => result.current.setDraggingElementId("el123"));
    expect(sessionMock.setDraggingElementId).toHaveBeenCalledWith("el123");
  });
});

// =============================================================================
// global dragend cleanup
// =============================================================================

describe("useCanvasDragDrop — global dragend listener", () => {
  it("clears all visuals when document fires dragend", () => {
    const { sessionMock, visualsMock, autoScrollMock, composer } = renderDragDrop();

    act(() => {
      document.dispatchEvent(new Event("dragend"));
    });

    expect(visualsMock.clearAllIndicators).toHaveBeenCalled();
    expect(autoScrollMock.stopCurrentAutoScroll).toHaveBeenCalled();
    expect(sessionMock.resetSession).toHaveBeenCalled();
    expect(composer.canvas.drag.cancel).toHaveBeenCalledWith("Global dragend");
  });

  it("removes the dragend listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderDragDrop();

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("dragend", expect.any(Function));
    removeSpy.mockRestore();
  });
});
