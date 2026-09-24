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
 * element for `[data-buildrick-id="el-1"]` with stable getBoundingClientRect values,
 * so the overlay can measure a non-null rect.
 */
function makeCanvasRef(elementId: string): React.RefObject<HTMLDivElement | null> {
  const fakeElementRect = new DOMRect(100, 100, 200, 80);
  const fakeCanvasRect = new DOMRect(0, 0, 800, 600);

  const fakeElement = {
    getBoundingClientRect: () => fakeElementRect,
    tagName: "DIV",
    getAttribute: (attr: string) => (attr === "data-buildrick-id" ? elementId : null),
    closest: () => null,
  } as unknown as HTMLElement;

  const fakeCanvas = {
    getBoundingClientRect: () => fakeCanvasRect,
    querySelector: (selector: string) => {
      if (selector === `[data-buildrick-id="${elementId}"]`) return fakeElement;
      return null;
    },
  } as unknown as HTMLDivElement;

  return { current: fakeCanvas } as React.RefObject<HTMLDivElement | null>;
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

/* Board 4428:139921: an insert between elements is the 2px accent line with
   a centred "Drop here" pill — the element it lands next to is NOT filled,
   and no "Insert after …" label or breadcrumb is drawn. */
describe("DropFeedbackOverlay — before/after reads 'Drop here' (4428:139921)", () => {
  const renderAt = (dropPosition: "before" | "after" | "inside") =>
    render(
      <DropFeedbackOverlay
        isDragOver
        dropTargetId="el-1"
        dropPosition={dropPosition}
        isValidDrop
        invalidReason={null}
        canvasRef={makeCanvasRef("el-1")}
        dropTargetPath={[{ id: "a", name: "Section" }, { id: "el-1", name: "Container" }] as never}
        dropSlotRect={{ x: 0, y: 0, width: 10, height: 10, isHorizontal: false } as never}
      />,
    );

  it("after: line + centred pill, no fill, no label or breadcrumb", () => {
    const { getByTestId, queryByText, container } = renderAt("after");
    const pill = getByTestId("drop-here-pill");
    expect(pill.textContent).toBe("Drop here");
    expect(pill.getAttribute("title")).toBe("Insert after Container");
    expect(pill.style.top).toBe("180px"); // on the line: 100 + 80
    expect(queryByText(/Insert after/)).toBeNull();
    expect(queryByText(/Drop inside/)).toBeNull();
    expect(container.querySelector(".bd-drop-feedback-target")).toBeNull();
    expect(container.querySelector(".bd-drop-slot-preview")).toBeNull();
    expect(getByTestId("drop-insertion-line")).toBeTruthy();
  });

  it("inside keeps the target highlight and the breadcrumb", () => {
    const { queryByTestId, container } = renderAt("inside");
    expect(queryByTestId("drop-here-pill")).toBeNull();
    expect(container.querySelector(".bd-drop-feedback-target")).toBeTruthy();
  });
});
