/**
 * Drop Operations — test prep stage 1 (Phase D / E-007 gate).
 *
 * useCanvasDragDrop refactor (E-007) requires ≥70% coverage on touched
 * files BEFORE the split. The hook is mostly orchestration; the real
 * drop-execution logic lives in this module's 5 exported handlers.
 * Comprehensive tests here close the bigger half of the coverage gap.
 *
 * STATUS:
 *   Stage 1 (this file): test fixture established + 1 working test +
 *   TODO list for remaining branches. Future session extends.
 *
 * EXTENDING:
 *   Each `it.todo` below is a real branch from dropOperations.tsx —
 *   pick one, replace `it.todo` with `it`, and use the makeDropContext
 *   + makeDragEvent helpers below as the starting point.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { handleBlockDrop, type DropContext } from "../dropOperations";

// =============================================================================
// FIXTURE HELPERS
// =============================================================================

/**
 * Minimal stub Composer surface. Only the fields drop-handlers read are stubbed.
 * Add more as new test cases need them — keeps the noise per test low.
 */
function makeStubComposer(): DropContext["composer"] {
  return {
    elements: {
      getActivePage: vi.fn(() => null),
      createPage: vi.fn(() => ({ id: "p1", root: { id: "r1" } })),
      getElement: vi.fn(() => null),
    },
    selection: {
      select: vi.fn(),
    },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
  } as unknown as DropContext["composer"];
}

/** Minimal stub canvas ref — most tests don't dereference it. */
function makeCanvasRef(): React.RefObject<HTMLDivElement | null> {
  return { current: null };
}

/**
 * Build a stub React DragEvent with controlled dataTransfer payloads.
 * Pass `{ block: '...' }` to populate the "block" MIME type, etc.
 */
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
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.DragEvent;
}

/** Build a DropContext with optional overrides. */
function makeDropContext(overrides: Partial<DropContext> = {}): DropContext {
  return {
    composer: makeStubComposer(),
    canvasRef: makeCanvasRef(),
    freshTargetId: null,
    freshDropPosition: "inside",
    onDropError: vi.fn(),
    onDropSuccess: vi.fn(),
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe("handleBlockDrop", () => {
  it("returns false when dataTransfer has no block payload", () => {
    const ctx = makeDropContext();
    const e = makeDragEvent({}); // empty payloads → getData("block") returns ""

    const handled = handleBlockDrop(e, ctx);

    expect(handled).toBe(false);
    expect(ctx.onDropError).not.toHaveBeenCalled();
    expect(ctx.onDropSuccess).not.toHaveBeenCalled();
    expect(ctx.composer.beginTransaction).not.toHaveBeenCalled();
  });

  // -- branches still to cover (Phase D D1 prep stage 2) --
  it.todo("returns true + INVALID_DATA when block id is unknown");
  it.todo(
    "returns true + INVALID_DATA when block has no elementType",
  );
  it.todo("returns true + INVALID_DATA when block JSON is malformed");
  it.todo(
    "creates a page when none exists (default fallback path)",
  );
  it.todo(
    "returns true + NO_VALID_TARGET when page root cannot be resolved",
  );
  it.todo(
    "returns true + NESTING_FORBIDDEN when nesting rules reject the parent",
  );
  it.todo(
    "happy path: inserts block under page root, fires onDropSuccess, selects new element",
  );
  it.todo("rolls back transaction on insertBlock exception");
});

describe("handleMultiElementDrop", () => {
  it.todo("returns false when no application/x-aquibra-multi payload");
  it.todo("returns true + INVALID_DATA when payload has no valid elements");
  it.todo("returns true + NO_VALID_TARGET when no active page");
  it.todo("happy path: moves all elements to new parent");
});

describe("handleElementDrop", () => {
  it.todo("returns false when no application/x-aquibra-element payload");
  it.todo("happy path: moves single element to new parent + position");
  it.todo("returns INVALID_DATA when payload references unknown element id");
}); // (handleElementDrop is sync per current source)

describe("handleComponentDrop", () => {
  it.todo("returns false when no application/x-aquibra-component payload");
  it.todo("happy path: instantiates component under target");
});

describe("handleTemplateDrop", () => {
  it.todo("returns false when no application/x-aquibra-template payload");
  it.todo("happy path: inserts template under target");
});
