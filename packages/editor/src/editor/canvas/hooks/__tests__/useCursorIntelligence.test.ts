/**
 * useCursorIntelligence — cursor mode resolution.
 *
 * Pins the CURSOR_MAP priority chain: invalid-drop > clone (Ctrl/Cmd+drag) >
 * sibling (Shift+drag) > dragging > inspect (Alt/inspectorEnabled) > hover
 * context (text/element/default), plus the style side effect on the canvas
 * element and the setContext/resetCursor escape hatches.
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useCursorIntelligence } from "../useCursorIntelligence";
import type { UseCursorIntelligenceOptions } from "../useCursorIntelligence";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let canvas: HTMLDivElement;

beforeEach(() => {
  canvas = document.createElement("div");
  document.body.appendChild(canvas);
});

afterEach(() => {
  canvas.remove();
});

function renderCursor(overrides: Partial<UseCursorIntelligenceOptions> = {}) {
  return renderHook(
    (props: Partial<UseCursorIntelligenceOptions>) =>
      useCursorIntelligence({ canvasRef: { current: canvas }, ...props }),
    { initialProps: overrides }
  );
}

/** Build canvas > [data-buildrick-id] > (optional inner tag) and return the hover target */
function addHoverTarget(innerTag?: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-buildrick-id", "el-1");
  canvas.appendChild(wrapper);
  if (!innerTag) return wrapper;
  const inner = document.createElement(innerTag);
  wrapper.appendChild(inner);
  return inner;
}

function hover(target: HTMLElement) {
  act(() => {
    target.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
  });
}

function pressModifiers(init: KeyboardEventInit) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", init));
  });
}

function releaseModifiers() {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keyup", {}));
  });
}

// ---------------------------------------------------------------------------
// Hover context resolution
// ---------------------------------------------------------------------------

describe("useCursorIntelligence — hover context", () => {
  it("starts at default and writes the cursor onto the canvas element", () => {
    const { result } = renderCursor();
    expect(result.current.cursorState.cursor).toBe("default");
    expect(result.current.cursorState.context).toBe("default");
    expect(canvas.style.cursor).toBe("default");
  });

  it("text tag inside a buildrick element → text cursor", () => {
    const p = addHoverTarget("p");
    const { result } = renderCursor();

    hover(p);
    expect(result.current.cursorState.context).toBe("text");
    expect(result.current.cursorState.cursor).toBe("text");
    expect(canvas.style.cursor).toBe("text");
  });

  it("headings and links count as text targets", () => {
    const h2 = addHoverTarget("h2");
    const { result } = renderCursor();
    hover(h2);
    expect(result.current.cursorState.cursor).toBe("text");

    const a = addHoverTarget("a");
    hover(a);
    expect(result.current.cursorState.cursor).toBe("text");
  });

  it("non-text buildrick element → pointer", () => {
    const el = addHoverTarget();
    const { result } = renderCursor();

    hover(el);
    expect(result.current.cursorState.context).toBe("element");
    expect(result.current.cursorState.cursor).toBe("pointer");
  });

  it("text tag OUTSIDE any buildrick element does not get the text cursor", () => {
    const p = document.createElement("p");
    canvas.appendChild(p); // no [data-buildrick-id] ancestor
    const { result } = renderCursor();

    hover(p);
    expect(result.current.cursorState.context).toBe("default");
  });

  it("moving back over empty canvas resets to default", () => {
    const el = addHoverTarget();
    const { result } = renderCursor();

    hover(el);
    expect(result.current.cursorState.cursor).toBe("pointer");
    hover(canvas);
    expect(result.current.cursorState.cursor).toBe("default");
  });

  it("ignores hover context changes while dragging", () => {
    const p = addHoverTarget("p");
    const { result, rerender } = renderCursor({ isDragging: true });

    hover(p); // guard returns early — context must stay "default"
    rerender({ isDragging: false });
    expect(result.current.cursorState.context).toBe("default");
    expect(result.current.cursorState.cursor).toBe("default");
  });
});

// ---------------------------------------------------------------------------
// Modifier keys + drag priority chain
// ---------------------------------------------------------------------------

describe("useCursorIntelligence — modifiers and drag states", () => {
  it("Alt held → zoom-in (inspect); released → back to default", () => {
    const { result } = renderCursor();

    pressModifiers({ altKey: true });
    expect(result.current.cursorState.cursor).toBe("zoom-in");
    expect(result.current.cursorState.altHeld).toBe(true);

    releaseModifiers();
    expect(result.current.cursorState.cursor).toBe("default");
    expect(result.current.cursorState.altHeld).toBe(false);
  });

  it("inspectorEnabled forces zoom-in without any key held", () => {
    const { result } = renderCursor({ inspectorEnabled: true });
    expect(result.current.cursorState.cursor).toBe("zoom-in");
  });

  it("dragging → grabbing", () => {
    const { result } = renderCursor({ isDragging: true });
    expect(result.current.cursorState.cursor).toBe("grabbing");
    expect(canvas.style.cursor).toBe("grabbing");
  });

  it("Ctrl+drag → copy (clone mode); Meta counts as Ctrl", () => {
    const { result } = renderCursor({ isDragging: true });

    pressModifiers({ ctrlKey: true });
    expect(result.current.cursorState.cursor).toBe("copy");
    expect(result.current.cursorState.ctrlHeld).toBe(true);

    releaseModifiers();
    pressModifiers({ metaKey: true });
    expect(result.current.cursorState.cursor).toBe("copy");
  });

  it("Shift+drag → crosshair (sibling mode)", () => {
    const { result } = renderCursor({ isDragging: true });

    pressModifiers({ shiftKey: true });
    expect(result.current.cursorState.cursor).toBe("crosshair");
    expect(result.current.cursorState.shiftHeld).toBe(true);
  });

  it("clone (Ctrl) outranks sibling (Shift) when both are held during drag", () => {
    const { result } = renderCursor({ isDragging: true });

    pressModifiers({ ctrlKey: true, shiftKey: true });
    expect(result.current.cursorState.cursor).toBe("copy");
  });

  it("invalid drop outranks everything during a drag", () => {
    const { result } = renderCursor({ isDragging: true, isInvalidDrop: true });

    pressModifiers({ ctrlKey: true, shiftKey: true });
    expect(result.current.cursorState.cursor).toBe("not-allowed");
  });

  it("isInvalidDrop without isDragging does NOT force not-allowed", () => {
    const { result } = renderCursor({ isInvalidDrop: true });
    expect(result.current.cursorState.cursor).toBe("default");
  });

  it("Ctrl held while NOT dragging leaves the hover cursor alone", () => {
    const el = addHoverTarget();
    const { result } = renderCursor();

    hover(el);
    pressModifiers({ ctrlKey: true });
    expect(result.current.cursorState.cursor).toBe("pointer");
  });
});

// ---------------------------------------------------------------------------
// Explicit control
// ---------------------------------------------------------------------------

describe("useCursorIntelligence — setContext / resetCursor", () => {
  it("setContext drives the cursor map directly (resizing → nwse-resize)", () => {
    const { result } = renderCursor();

    act(() => result.current.setContext("resizing"));
    expect(result.current.cursorState.cursor).toBe("nwse-resize");
    expect(canvas.style.cursor).toBe("nwse-resize");

    act(() => result.current.setContext("invalid"));
    expect(result.current.cursorState.cursor).toBe("not-allowed");
  });

  it("resetCursor returns to default", () => {
    const { result } = renderCursor();

    act(() => result.current.setContext("resizing"));
    act(() => result.current.resetCursor());
    expect(result.current.cursorState.cursor).toBe("default");
    expect(result.current.cursorState.context).toBe("default");
  });
});
