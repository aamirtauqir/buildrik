/**
 * UnifiedSelectionToolbar — board 5936:44788: three buttons at the element's
 * top-right (Duplicate · Delete · More); More opens the element menu (G2-024).
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnifiedSelectionToolbar } from "../UnifiedSelectionToolbar";

beforeEach(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as never;
});

function setup() {
  const canvas = document.createElement("div");
  const el = document.createElement("div");
  el.setAttribute("data-buildrick-id", "e1");
  canvas.appendChild(el);
  document.body.appendChild(canvas);
  Object.defineProperty(canvas, "offsetWidth", { value: 1000 });
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 }) as DOMRect;
  el.getBoundingClientRect = () => ({ left: 100, top: 50, right: 600, bottom: 250, width: 500, height: 200 }) as DOMRect;
  const props = {
    composer: { elements: { getElement: () => ({}) } } as never,
    elementId: "e1",
    canvasRef: { current: canvas },
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onOpenMenu: vi.fn(),
  };
  render(<UnifiedSelectionToolbar {...props} />);
  return props;
}

describe("UnifiedSelectionToolbar", () => {
  it("renders exactly Duplicate, Delete, More, anchored to the element's top-right", () => {
    setup();
    const bar = screen.getByTestId("selection-toolbar");
    expect(bar.querySelectorAll("button")).toHaveLength(3);
    expect(bar.style.left).toBe("592px"); // right edge 600 − 8
    expect(bar.style.top).toBe("58px"); // top 50 + 8
    expect(bar.style.transform).toBe("translateX(-100%) scale(1)");
  });

  it("wires the buttons; More opens the element menu", () => {
    const p = setup();
    fireEvent.click(screen.getByTestId("selection-toolbar-duplicate"));
    fireEvent.click(screen.getByTestId("selection-toolbar-delete"));
    fireEvent.click(screen.getByTestId("selection-toolbar-more"));
    expect(p.onDuplicate).toHaveBeenCalled();
    expect(p.onDelete).toHaveBeenCalled();
    expect(p.onOpenMenu).toHaveBeenCalledWith("e1", expect.objectContaining({ x: expect.any(Number) }));
  });

  /* Owner ruling 2026-09-24: the board's ink pill (library "Selection
     toolbar": color/ink, r8, pad 4, gap 4, 24px IconButtons, white icons,
     More on the accent fill). */
  it("is the board's ink pill with white 24px buttons and More on accent", () => {
    setup();
    const bar = screen.getByTestId("selection-toolbar");
    expect(bar.className).toContain("tw:bg-[var(--bk-ink)]");
    expect(bar.className).toContain("tw:rounded-lg");
    expect(bar.className).toContain("tw:p-1");
    expect(bar.className).toContain("tw:gap-1");
    expect(bar.className).not.toContain("bk-bg-card");
    for (const id of ["duplicate", "delete"]) {
      const b = screen.getByTestId(`selection-toolbar-${id}`);
      expect(b.className).toContain("tw:text-white");
      expect(b.className).toContain("tw:h-6");
    }
    expect(screen.getByTestId("selection-toolbar-more").className).toContain("tw:bg-[var(--bk-accent)]");
  });

  it("carries the board's caption row under the pill", () => {
    setup();
    expect(screen.getByTestId("selection-toolbar-caption")).toHaveTextContent("⧉ Duplicate ⌘D · 🗑 Delete ⌫ · ⋯ More");
  });

  /* Flow-check finding (2026-09-25): a wide (page-width) selection anchored
     the pill past `.bd-canvas-scroll`'s visible right edge — a valid DOM
     position (`.buildrick-canvas` itself is wider than its scrollable
     ancestor and isn't clipped), but invisible/unreachable there: measured
     live, the pill rendered at screen x 1272-1360 while the scroll viewport's
     visible window ended at 1116, and the Inspector panel — which starts
     exactly where the canvas column's own clip ends — received every click
     aimed at the (invisible) ⋯ More button. Reproduced live 3 of 6 first
     clicks on an isolated single-lane site with no other tab/lane touching
     it, ruling out shared-fixture contention. Root cause confirmed via a
     live ancestor-chain + `elementFromPoint` trace (not guessed): the pill's
     `left` came only from the selected element's own position, never
     compared against the SCROLLABLE viewport's visible window.
     No fake timers needed: the shift is a plain synchronous
     `useLayoutEffect` (`anchor` in, `shiftX` out; `shiftX` is deliberately
     excluded from its own deps — see the effect's comment), so
     `render`'s `act()` flush already reproduces the real ordering
     deterministically. A click-and-hope Playwright test could not have
     told "worked" from "the race didn't fire this time" apart. */
  describe("clamped to the scrollable canvas viewport (2026-09-25 flow-check fix)", () => {
    const originalGBCR = HTMLElement.prototype.getBoundingClientRect;

    beforeEach(() => {
      // The pill div doesn't exist before mount, so its rect can't be set as
      // an instance override the way `canvas`/`el` are below (those already
      // exist). Patch the prototype instead, keyed off its testid — `canvas`
      // and `el` keep their own instance overrides, which shadow this. A
      // fixed 88x32 stands in for the pill's rendered size (the board's
      // measured size); `left` + `translateX(-100%)` puts the box's final
      // right edge AT whatever `left` React just committed, so reading
      // `style.left` live (not once, at setup) is what makes this reflect
      // the SAME render the effect is reacting to.
      HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
        if (this.getAttribute("data-testid") === "selection-toolbar") {
          const left = parseFloat(this.style.left || "0");
          return { left: left - 88, top: 0, right: left, bottom: 32, width: 88, height: 32 } as DOMRect;
        }
        return originalGBCR.call(this);
      };
    });

    afterEach(() => {
      HTMLElement.prototype.getBoundingClientRect = originalGBCR;
    });

    function setupOverflowing() {
      // A `.bd-canvas-scroll` viewport narrower than `.buildrick-canvas`
      // itself — the real layout shape: the canvas frame can be wider than
      // the column that scrolls it.
      const viewport = document.createElement("div");
      viewport.className = "bd-canvas-scroll";
      const canvas = document.createElement("div");
      const el = document.createElement("div");
      el.setAttribute("data-buildrick-id", "e1");
      canvas.appendChild(el);
      viewport.appendChild(canvas);
      document.body.appendChild(viewport);

      viewport.getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, bottom: 800, width: 800, height: 800 }) as DOMRect;
      Object.defineProperty(canvas, "offsetWidth", { value: 1200 });
      canvas.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1200, bottom: 800, width: 1200, height: 800 }) as DOMRect;
      // The selected element's right edge (1150) sits near the wide canvas's
      // own edge — inside `.buildrick-canvas` (1200), but past the narrower
      // `.bd-canvas-scroll` window (800) that actually decides what's visible.
      el.getBoundingClientRect = () => ({ left: 700, top: 50, right: 1150, bottom: 250, width: 450, height: 200 }) as DOMRect;

      const props = {
        composer: { elements: { getElement: () => ({}) } } as never,
        elementId: "e1",
        canvasRef: { current: canvas },
        onDuplicate: vi.fn(),
        onDelete: vi.fn(),
        onOpenMenu: vi.fn(),
      };
      render(<UnifiedSelectionToolbar {...props} />);
      return { bar: screen.getByTestId("selection-toolbar"), props };
    }

    it("pulls the pill back onto the visible viewport instead of leaving it past the scroll edge", () => {
      const { bar } = setupOverflowing();
      // Raw anchor would be (1150-0)/1 + 0 - 8 = 1142 -- 342px past the
      // viewport's 800px right edge. The fix shifts it back flush to 800.
      expect(bar.style.left).toBe("800px");
    });

    it("does not touch the position when the pill already fits (no false-positive shift)", () => {
      setup();
      const bar = screen.getByTestId("selection-toolbar");
      expect(bar.style.left).toBe("592px");
    });
  });
});
