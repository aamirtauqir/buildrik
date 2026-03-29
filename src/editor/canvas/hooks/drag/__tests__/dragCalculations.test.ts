import { calculateDropPositionFromCursor } from "../dragCalculations";

// =============================================================================
// Helpers
// =============================================================================

/**
 * Build a minimal DOMRect-compatible object.
 * DOMRect is not available in the Node/jsdom test environment through its
 * constructor, so we replicate the shape manually.
 */
function makeDOMRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      x: left,
      y: top,
    }),
  } as DOMRect;
}

// =============================================================================
// calculateDropPositionFromCursor
// =============================================================================

describe("calculateDropPositionFromCursor", () => {
  /**
   * Canvas rect: { left: 100, top: 100, width: 800, height: 600 }
   * Threshold: 25%  →  edge zone = 600 * 0.25 = 150 px (vertical)
   *
   * Without scroll correction:
   *   clientX=250, clientY=200
   *   relativeY = 200 - 100 = 100  →  100 < 150  →  "before"
   *
   * With 100px scroll offset applied at the call site (as useCanvasDragDrop does):
   *   clientX + 100 = 350, clientY + 100 = 300
   *   relativeY = 300 - 100 = 200  →  150 ≤ 200 ≤ 450  →  "inside"
   *
   * The different result for the same physical pixel proves why
   * useCanvasDragDrop.ts must add scrollLeft/scrollTop before calling this
   * function — without the correction the element appears to be near the top
   * edge of the target even though the user's cursor is in the middle.
   */

  const canvasRect = makeDOMRect(100, 100, 800, 600);

  it("returns a result object with a position field", () => {
    const result = calculateDropPositionFromCursor(250, 200, canvasRect, null);
    expect(result).toHaveProperty("position");
    expect(result).toHaveProperty("isParentHorizontal");
  });

  it("returns 'before' when cursor is in the top 25% of the target (no scroll)", () => {
    // clientY=200, relativeY = 200 - 100 = 100, edge = 150  →  "before"
    const result = calculateDropPositionFromCursor(250, 200, canvasRect, null);
    expect(result.position).toBe("before");
  });

  it("returns 'inside' when cursor is in the middle of the target (no scroll)", () => {
    // clientY=400, relativeY = 400 - 100 = 300, 150 < 300 < 450  →  "inside"
    const result = calculateDropPositionFromCursor(500, 400, canvasRect, null);
    expect(result.position).toBe("inside");
  });

  it("returns 'after' when cursor is in the bottom 25% of the target (no scroll)", () => {
    // clientY=650, relativeY = 650 - 100 = 550, 550 > 450  →  "after"
    const result = calculateDropPositionFromCursor(500, 650, canvasRect, null);
    expect(result.position).toBe("after");
  });

  it("is scroll-invariant: clientX/clientY and getBoundingClientRect are both in viewport space", () => {
    // Both e.clientX/e.clientY and the rect returned by getBoundingClientRect()
    // are expressed in viewport coordinates, which are already scroll-compensated.
    // The relative position (clientY - rect.top) is therefore the same regardless
    // of how far the canvas container has scrolled. useCanvasDragDrop must NOT
    // add scrollLeft/scrollTop to the cursor coordinates before calling this
    // function — doing so would introduce a spurious offset.
    //
    // Scenario: canvas has scrolled 100px. The rect returned by
    // getBoundingClientRect() already reflects the current viewport position.
    // Cursor at clientY=200, rect.top=100 → relativeY=100 → "before"
    // If 100px scroll were incorrectly added: clientY=300, relativeY=200 → "inside"
    // The second result is wrong — the cursor hasn't moved physically.

    const scrolledRect = makeDOMRect(100, 100, 800, 600); // rect already in viewport space
    const result = calculateDropPositionFromCursor(250, 200, scrolledRect, null);

    // clientY=200, rect.top=100 → relativeY=100, edge=150 → "before"
    expect(result.position).toBe("before");

    // Verify: adding scroll to the cursor would incorrectly shift the result
    const incorrectResult = calculateDropPositionFromCursor(
      250 + 100,
      200 + 100,
      scrolledRect,
      null
    );
    expect(incorrectResult.position).toBe("inside"); // wrong — cursor didn't move
    expect(result.position).not.toBe(incorrectResult.position); // proves adding scroll is incorrect
  });

  it("sets isParentHorizontal to false when parentElement is null", () => {
    const result = calculateDropPositionFromCursor(500, 400, canvasRect, null);
    expect(result.isParentHorizontal).toBe(false);
  });
});
