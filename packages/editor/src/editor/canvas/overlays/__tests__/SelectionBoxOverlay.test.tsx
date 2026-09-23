import { render, screen } from "@testing-library/react";
import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine";
import { SelectionBoxOverlay } from "../SelectionBoxOverlay";

// vi.mock calls are hoisted by vitest at runtime — order relative to imports does not matter
vi.mock("../../hooks/useCanvasResize", () => ({
  default: () => ({
    startResize: vi.fn(),
    startRotation: vi.fn(),
    isResizing: false,
    isRotating: false,
    currentBounds: null,
  }),
  useCanvasResize: () => ({
    startResize: vi.fn(),
    startRotation: vi.fn(),
    isResizing: false,
    isRotating: false,
    currentBounds: null,
  }),
}));

// Mock child components to keep the test surface minimal
vi.mock("../../toolbars/AlignmentToolbar", () => ({
  AlignmentToolbar: () => null,
}));
vi.mock("../SelectionHandles", () => ({
  SelectionHandles: () => null,
}));

// Minimal mock composer — only the methods the component touches.
// Post-D3: cmsBindings moved under composer.cms.bindings facade.
const makeComposer = () =>
  ({
    cms: { bindings: { getBindings: vi.fn(() => []) } },
    elements: {
      getElement: vi.fn(() => ({ isLocked: () => false })),
    },
    on: vi.fn(),
    off: vi.fn(),
  }) as unknown as Composer;

describe("SelectionBoxOverlay — rotation handle accessibility", () => {
  let originalResizeObserver: typeof ResizeObserver;
  let originalMutationObserver: typeof MutationObserver;
  let querySelectorSpy: { mockRestore: () => void };

  beforeEach(() => {
    // Stub ResizeObserver (not available in jsdom)
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    // Stub MutationObserver
    originalMutationObserver = globalThis.MutationObserver;
    globalThis.MutationObserver = class {
      observe() {}
      disconnect() {}
    } as unknown as typeof MutationObserver;

    // Provide a fake canvas element and a fake selected element so updateRect sets the rect
    // The component queries: '.buildrick-canvas' and '[data-buildrick-id="el-1"]'
    const fakeElementRect = {
      left: 50,
      top: 50,
      right: 250,
      bottom: 150,
      width: 200,
      height: 100,
    } as DOMRect;
    const fakeElement = {
      getBoundingClientRect: () => fakeElementRect,
    } as unknown as Element;

    const fakeCanvasRect = {
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
    } as DOMRect;
    const fakeCanvas = {
      getBoundingClientRect: () => fakeCanvasRect,
      scrollLeft: 0,
      scrollTop: 0,
    } as unknown as Element;

    querySelectorSpy = vi.spyOn(document, "querySelector").mockImplementation((selector) => {
      if (selector === ".buildrick-canvas") return fakeCanvas;
      if (selector === '[data-buildrick-id="el-1"]') return fakeElement;
      return null;
    });
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    globalThis.MutationObserver = originalMutationObserver;
    querySelectorSpy.mockRestore();
    vi.clearAllMocks();
  });

  /* QA (integration 5e0d47902): the full-canvas positioning wrapper carried
     `.bd-selection-box`, which Canvas.css paints with an --bk-accent-subtle
     fill, a border and a focus shadow — selecting a Heading laid an opaque
     1024x697 #E1EFFE sheet over the whole page. jsdom never loads Canvas.css,
     so the cascade fact is asserted against the stylesheet: no class on the
     100%x100% wrapper may be a rule that paints. */
  it("the full-size wrapper carries no class Canvas.css paints", () => {
    const composer = makeComposer();
    const { container } = render(<SelectionBoxOverlay composer={composer} elementId="el-1" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe("100%");
    expect(wrapper.style.height).toBe("100%");
    const css = readFileSync(join(__dirname, "../../Canvas.css"), "utf8");
    for (const cls of Array.from(wrapper.classList)) {
      const rule = new RegExp(`\\.${cls}(::?[a-z-]+)?\\s*[,{][^}]*\\b(background|border|box-shadow)\\s*:`);
      expect(css, `.${cls} paints the full-canvas wrapper`).not.toMatch(rule);
    }
  });

  it("rotation handle has aria-valuenow attribute", () => {
    const composer = makeComposer();
    render(<SelectionBoxOverlay composer={composer} elementId="el-1" />);

    const rotationHandle = screen.getByRole("slider", { name: /rotation/i });
    // aria-valuenow is required by WCAG 4.1.2 for role="slider" — assert presence
    expect(rotationHandle.hasAttribute("aria-valuenow")).toBe(true);
  });

  it("rotation handle aria-valuenow reflects the element's current rotation angle", () => {
    // Build a composer mock where getElement returns an element with a known rotation
    const baseComposer = makeComposer();
    const composerWithRotation = {
      ...baseComposer,
      elements: {
        getElement: vi.fn().mockImplementation((id: string) => {
          if (id === "el-1") {
            return {
              isLocked: () => false,
              getStyle: (prop: string) => (prop === "transform" ? "rotate(45deg)" : undefined),
              on: vi.fn(),
              off: vi.fn(),
            };
          }
          return null;
        }),
      },
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as Composer;

    render(<SelectionBoxOverlay composer={composerWithRotation} elementId="el-1" />);

    const rotationHandle = screen.getByRole("slider", { name: /rotation/i });
    expect(rotationHandle).toHaveAttribute("aria-valuenow", "45");
  });
});
