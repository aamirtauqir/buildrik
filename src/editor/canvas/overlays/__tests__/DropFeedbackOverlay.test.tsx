import { render } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import type { InvalidDropReason } from "../../../../shared/utils/dragDrop/dropValidation";
import { DropFeedbackOverlay } from "../DropFeedbackOverlay";

// Mock getFriendlyName — jsdom does not compute layout, so we short-circuit it
vi.mock("../../utils/elementInfo", () => ({
  getFriendlyName: () => "Container",
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a canvasRef whose .current has a querySelector that returns a fake
 * element for `[data-aqb-id="el-1"]` with stable getBoundingClientRect values,
 * so the overlay can measure a non-null rect.
 */
function makeCanvasRef(elementId: string): React.RefObject<HTMLDivElement> {
  const fakeElementRect = new DOMRect(100, 100, 200, 80);
  const fakeCanvasRect = new DOMRect(0, 0, 800, 600);

  const fakeElement = {
    getBoundingClientRect: () => fakeElementRect,
    tagName: "DIV",
    getAttribute: (attr: string) => (attr === "data-aqb-id" ? elementId : null),
    closest: () => null,
  } as unknown as HTMLElement;

  const fakeCanvas = {
    getBoundingClientRect: () => fakeCanvasRect,
    querySelector: (selector: string) => {
      if (selector === `[data-aqb-id="${elementId}"]`) return fakeElement;
      return null;
    },
  } as unknown as HTMLDivElement;

  return { current: fakeCanvas } as React.RefObject<HTMLDivElement>;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("DropFeedbackOverlay — aria-live invalid drop announcements (A9 / WCAG 4.1.3)", () => {
  it("aria-live region contains the invalid drop message when isDragOver=true and isValidDrop=false", () => {
    const canvasRef = makeCanvasRef("el-1");
    const invalidReason: InvalidDropReason = "VOID_ELEMENT";

    render(
      <DropFeedbackOverlay
        isDragOver={true}
        dropTargetId="el-1"
        dropPosition="inside"
        isValidDrop={false}
        invalidReason={invalidReason}
        canvasRef={canvasRef}
      />
    );

    // Query by the aria-live attribute since assertive does not map to role="status"
    const liveDiv = document.querySelector('[aria-live="assertive"]');
    expect(liveDiv).not.toBeNull();
    expect(liveDiv?.textContent).toBe("Cannot have children");
  });

  it("aria-live region is empty when isDragOver=false (drag ended)", () => {
    const canvasRef = makeCanvasRef("el-1");
    const invalidReason: InvalidDropReason = "VOID_ELEMENT";

    render(
      <DropFeedbackOverlay
        isDragOver={false}
        dropTargetId="el-1"
        dropPosition={null}
        isValidDrop={false}
        invalidReason={invalidReason}
        canvasRef={canvasRef}
      />
    );

    const liveDiv = document.querySelector('[aria-live="assertive"]');
    expect(liveDiv).not.toBeNull();
    expect(liveDiv?.textContent).toBe("");
  });

  it("aria-live region is empty when isValidDrop=true (valid target)", () => {
    const canvasRef = makeCanvasRef("el-1");

    render(
      <DropFeedbackOverlay
        isDragOver={true}
        dropTargetId="el-1"
        dropPosition="inside"
        isValidDrop={true}
        invalidReason={null}
        canvasRef={canvasRef}
      />
    );

    const liveDiv = document.querySelector('[aria-live="assertive"]');
    expect(liveDiv).not.toBeNull();
    expect(liveDiv?.textContent).toBe("");
  });

  it("aria-live region uses assertive priority and aria-atomic=true", () => {
    const canvasRef = makeCanvasRef("el-1");

    render(
      <DropFeedbackOverlay
        isDragOver={true}
        dropTargetId="el-1"
        dropPosition="inside"
        isValidDrop={false}
        invalidReason={"SELF_DROP"}
        canvasRef={canvasRef}
      />
    );

    const liveDiv = document.querySelector('[aria-live="assertive"]');
    expect(liveDiv).not.toBeNull();
    expect(liveDiv?.getAttribute("aria-live")).toBe("assertive");
    expect(liveDiv?.getAttribute("aria-atomic")).toBe("true");
    expect(liveDiv?.textContent).toBe("Cannot drop inside itself");
  });

  it("announces SELF_DROP reason correctly", () => {
    const canvasRef = makeCanvasRef("el-1");

    render(
      <DropFeedbackOverlay
        isDragOver={true}
        dropTargetId="el-1"
        dropPosition="inside"
        isValidDrop={false}
        invalidReason={"SELF_DROP"}
        canvasRef={canvasRef}
      />
    );

    const liveDiv = document.querySelector('[aria-live="assertive"]');
    expect(liveDiv?.textContent).toBe("Cannot drop inside itself");
  });

  it("announces MAX_DEPTH reason correctly", () => {
    const canvasRef = makeCanvasRef("el-1");

    render(
      <DropFeedbackOverlay
        isDragOver={true}
        dropTargetId="el-1"
        dropPosition="inside"
        isValidDrop={false}
        invalidReason={"MAX_DEPTH"}
        canvasRef={canvasRef}
      />
    );

    const liveDiv = document.querySelector('[aria-live="assertive"]');
    expect(liveDiv?.textContent).toBe("Max depth reached");
  });

  it("aria-live region is empty when invalidReason=null even if isDragOver=true", () => {
    const canvasRef = makeCanvasRef("el-1");

    render(
      <DropFeedbackOverlay
        isDragOver={true}
        dropTargetId="el-1"
        dropPosition={null}
        isValidDrop={false}
        invalidReason={null}
        canvasRef={canvasRef}
      />
    );

    const liveDiv = document.querySelector('[aria-live="assertive"]');
    expect(liveDiv?.textContent).toBe("");
  });
});
