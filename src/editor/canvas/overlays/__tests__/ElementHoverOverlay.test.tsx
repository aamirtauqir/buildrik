import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ElementHoverOverlay } from "../ElementHoverOverlay";

// Mock getBoxModel and getElementInfo so they return stable values without
// needing actual computed styles (jsdom does not compute CSS).
vi.mock("../../utils/elementInfo", () => ({
  getBoxModel: () => ({
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    content: { width: 100, height: 50 },
  }),
  getElementInfo: () => ({
    tagName: "div",
    id: "el-1",
    classes: [],
    dimensions: { width: 100, height: 50 },
    display: "block",
    position: "static",
    isFlexContainer: false,
    isGridContainer: false,
    isTextElement: false,
    friendlyName: "Container",
    parentName: null,
    hasLink: false,
    hasCMSBinding: false,
  }),
}));

// Mock DragHandle and SpacingLabels — they're not under test here
vi.mock("../DragHandle", () => ({
  DragHandle: () => null,
}));
vi.mock("../SpacingLabels", () => ({
  SpacingLabels: () => null,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a fake canvas ref whose .current has a querySelector that returns a
 * fake element for `[data-aqb-id="el-1"]`, with stable getBoundingClientRect
 * values so the overlay computes a non-null rect.
 */
function makeCanvasRef(elementId: string): React.RefObject<HTMLDivElement> {
  const fakeElementRect = new DOMRect(50, 50, 100, 50);
  const fakeCanvasRect = new DOMRect(0, 0, 800, 600);

  const fakeElement = {
    getBoundingClientRect: () => fakeElementRect,
    tagName: "DIV",
    getAttribute: () => elementId,
    closest: () => null,
  } as unknown as HTMLElement;

  const fakeCanvas = {
    getBoundingClientRect: () => fakeCanvasRect,
    querySelector: (selector: string) => {
      if (selector === `[data-aqb-id="${elementId}"]`) {
        return fakeElement;
      }
      return null;
    },
  } as unknown as HTMLDivElement;

  return { current: fakeCanvas } as React.RefObject<HTMLDivElement>;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ElementHoverOverlay — clone mode badge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the ⊕ clone badge when isCloneMode=true and hoveredElementId is set", () => {
    const canvasRef = makeCanvasRef("el-1");

    render(
      <ElementHoverOverlay hoveredElementId="el-1" canvasRef={canvasRef} isCloneMode={true} />
    );

    const badge = screen.getByTestId("clone-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe("⊕");
  });

  it("does NOT render the ⊕ badge when isCloneMode=false", () => {
    const canvasRef = makeCanvasRef("el-1");

    render(
      <ElementHoverOverlay hoveredElementId="el-1" canvasRef={canvasRef} isCloneMode={false} />
    );

    expect(screen.queryByTestId("clone-badge")).toBeNull();
  });

  it("does NOT render the ⊕ badge when isCloneMode is omitted (defaults to false)", () => {
    const canvasRef = makeCanvasRef("el-1");

    render(<ElementHoverOverlay hoveredElementId="el-1" canvasRef={canvasRef} />);

    expect(screen.queryByTestId("clone-badge")).toBeNull();
  });

  it("does NOT render the ⊕ badge when hoveredElementId=null even if isCloneMode=true", () => {
    // When hoveredElementId is null the overlay renders nothing (overlayData = null)
    const canvasRef = makeCanvasRef("el-1");

    render(
      <ElementHoverOverlay hoveredElementId={null} canvasRef={canvasRef} isCloneMode={true} />
    );

    expect(screen.queryByTestId("clone-badge")).toBeNull();
  });

  it("renders the ⊕ badge at hierarchy level (isCloneMode=true + altHeld=true)", () => {
    // altHeld=true → hoverLevel="hierarchy" → HierarchyOverlay renders CloneBadge
    const canvasRef = makeCanvasRef("el-1");

    render(
      <ElementHoverOverlay
        hoveredElementId="el-1"
        canvasRef={canvasRef}
        isCloneMode={true}
        altHeld={true}
      />
    );

    const badge = screen.getByTestId("clone-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe("⊕");
  });

  it("renders the ⊕ badge at boxmodel level (isCloneMode=true + altHeld=true + shiftHeld=true)", () => {
    // altHeld=true + shiftHeld=true → hoverLevel="boxmodel" → BoxModelOverlay renders CloneBadge
    const canvasRef = makeCanvasRef("el-1");

    render(
      <ElementHoverOverlay
        hoveredElementId="el-1"
        canvasRef={canvasRef}
        isCloneMode={true}
        altHeld={true}
        shiftHeld={true}
      />
    );

    const badge = screen.getByTestId("clone-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe("⊕");
  });
});
